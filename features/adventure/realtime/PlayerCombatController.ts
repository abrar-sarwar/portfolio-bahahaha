// features/adventure/realtime/PlayerCombatController.ts
//
// The attack / parry / stomp layer that sits ON TOP of PlatformLevelScene's
// movement (dash / iframes / knockback / jump are reused untouched). It owns the
// pooled AttackHitbox, the parry stance/commit windows, and the queue of pure
// MachineEvents the BossArenaScene drains into stepBoss each frame. All timing
// numbers come from RT_PLAYER (realtime/config.ts).
import Phaser from "phaser";
import { RT_PLAYER } from "./config";
import { AttackHitbox } from "./AttackHitbox";
import { parryFlashRing } from "./effects";
import { fracFromReadyAt } from "./ui/actionBarMath";
import type { MachineEvent } from "./types";
import { audio } from "../audio/synth";

// A whiffed parry commits the player to a fail-vulnerable recovery (also the
// re-parry lockout + the ActionBar sweep length). A successful parry clears it.
const PARRY_COMMIT_MS = RT_PLAYER.parryFailVulnerableMs;

export class PlayerCombatController {
  readonly hitbox: AttackHitbox;
  private events: MachineEvent[] = [];
  private attackReadyAt = 0;
  private parryStanceUntil = 0;
  private committedUntil = 0; // parry recovery / fail-vulnerable window end

  constructor(
    private scene: Phaser.Scene,
    private player: Phaser.Physics.Arcade.Sprite,
    /** Silent-assist parry-window widening (assistRT §6). Default 1. */
    private parryWindowScale = 1,
  ) {
    this.hitbox = new AttackHitbox(scene);
  }

  /** Wire the swing to the boss sprite: a landed swing damages the boss. */
  bindTarget(boss: Phaser.GameObjects.GameObject, onLand: () => void): void {
    this.hitbox.overlapWith(boss, () => {
      this.events.push({ kind: "hit", amount: RT_PLAYER.attackDamage, source: "attack" });
      onLand();
    });
  }

  /** Attempt a swing. Cooldown-gated → holding the key yields one swing per
   *  cooldown. Returns true when the swing fired (so the scene can lock the
   *  attack anim). */
  attack(now: number, facing: 1 | -1): boolean {
    if (now < this.attackReadyAt) return false;
    this.attackReadyAt = now + RT_PLAYER.attackCooldownMs;
    this.hitbox.fire(this.player.x, this.player.y, facing, RT_PLAYER.attackReachPx, RT_PLAYER.attackActiveMs);
    audio.sfx("slash");
    return true;
  }

  /** Open a parry stance. Committed (whiffed or mid-recovery) → ignored. */
  parry(now: number): boolean {
    if (now < this.committedUntil) return false;
    this.parryStanceUntil = now + RT_PLAYER.parryWindowMs * this.parryWindowScale;
    this.committedUntil = now + PARRY_COMMIT_MS;
    return true;
  }

  isParrying(now: number): boolean {
    return now <= this.parryStanceUntil;
  }

  /** True during the fail-vulnerable recovery of a whiffed parry. */
  isVulnerable(now: number): boolean {
    return now < this.committedUntil && !this.isParrying(now);
  }

  /**
   * Resolve a boss attack reaching the player. A parryable attack caught in the
   * stance succeeds: play the game-wide flash + `parry` sfx, clear the commit,
   * and emit `parried` so the machine staggers the boss. Returns whether it was
   * parried (false → the scene applies the hit's damage).
   */
  resolveBossAttack(now: number, parryable: boolean): boolean {
    if (parryable && this.isParrying(now)) {
      this.parryStanceUntil = 0;
      this.committedUntil = now; // success clears the vulnerability
      parryFlashRing(this.scene, this.player.x, this.player.y);
      audio.sfx("parry");
      this.events.push({ kind: "parried" });
      return true;
    }
    return false;
  }

  /** A stomp landed on the boss (the scene classified the contact). */
  registerStomp(): void {
    this.events.push({ kind: "hit", amount: RT_PLAYER.stompDamage, source: "stomp" });
  }

  /**
   * Consume the open stance for a PROJECTILE parry (Task 33): success
   * semantics — clears the stance + the fail-vulnerable commit — but does NOT
   * emit a machine `parried` event. A reflected projectile must never stagger
   * the boss directly (boss-demands G1: what a reflect does is the mechanics
   * module's call). The flash/sfx live with the caller (ProjectileManager).
   */
  consumeParry(now: number): void {
    this.parryStanceUntil = 0;
    this.committedUntil = now;
  }

  /** Keep the active hitbox glued in front of the player mid-swing. */
  followHitbox(): void {
    this.hitbox.follow(this.player.x, this.player.y);
  }

  drainEvents(): MachineEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  cooldownFracs(now: number): { attack: number; parry: number } {
    return {
      attack: fracFromReadyAt(now, this.attackReadyAt, RT_PLAYER.attackCooldownMs),
      parry: fracFromReadyAt(now, this.committedUntil, PARRY_COMMIT_MS),
    };
  }

  destroy(): void {
    this.hitbox.destroy();
  }
}
