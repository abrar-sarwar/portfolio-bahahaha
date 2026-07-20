import Phaser from "phaser";
import { animKey } from "../art/textures";
import { BRUTE_SPRITES } from "../art/sprites/enemies3";
import { resolveParry } from "../combat/timedEvents";
import { audio } from "../audio/synth";
import { Enemy } from "./Enemy";

type Body = Phaser.Physics.Arcade.Body;

// Behaviour contract (task-19-brief.md, LOCKED numbers):
//  - 24x24, hp 3. Slow menace patrol; when the player is on the SAME platform
//    row and within reach, it CHARGES at 70px/s in a committed straight line.
//  - Hitting a wall mid-charge STUNS it for 2s: during stun it is stompable and
//    takes ×2 melee damage. Outside stun its front is armored — a frontal melee
//    deals 0 (dodge behind and hit its back, or bait it into a wall / parry it).
//  - The charge is parryable in-level: an attack pressed within 150ms of the
//    predicted contact negates the hit and stuns it (resolveParry with the
//    impact = predicted contact time).
const CHARGE_SPEED = 70;
const PATROL_SPEED = 20;
const CHARGE_TRIGGER_PX = 150; // horizontal reach that commits a charge
const SAME_ROW_PX = 20; // |dy| that counts as "same platform row"
const STUN_MS = 2000;
const CHARGE_COOLDOWN_MS = 900; // after a stun ends, before it can charge again
const CHARGE_TIMEOUT_MS = 3000; // failsafe: a charge that never hits a wall ends
const CHARGE_PARRY_WINDOW_MS = 150;
const CHARGE_PARRY_PERFECT_MS = 60;

type BruteState = "patrol" | "charging" | "stunned";

export class BruteForceBrute extends Enemy {
  private phase: BruteState = "patrol";
  private stunUntil = 0;
  private chargeReadyAt = 0;
  private chargeDir: 1 | -1 = 1;
  private chargeStartedAt = 0;
  private predictedContactAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "brute", BRUTE_SPRITES.key);
    this.hp = 3;
    this.touchDamage = 1;
    this.stompable = false; // armored: only stompable once stunned
    this.patrolSpeed = PATROL_SPEED;
    this.turnAtLedges = true;

    const body = this.body as Body;
    body.setSize(16, 20);
    body.setOffset(4, 3);

    this.play(animKey(this.animBase, "charge"));
  }

  override tick(_dtMs: number): void {
    if (this.dying) return;
    const now = this.scene.time.now;
    const body = this.body as Body;
    const player = this.host.playerSprite;

    switch (this.phase) {
      case "stunned":
        body.setVelocityX(0);
        if (now >= this.stunUntil) this.exitStun(now);
        break;
      case "charging": {
        body.setVelocityX(this.chargeDir * CHARGE_SPEED);
        this.setFlipX(this.chargeDir < 0);
        const wall =
          (this.chargeDir > 0 && body.blocked.right) ||
          (this.chargeDir < 0 && body.blocked.left);
        if (wall || now - this.chargeStartedAt > CHARGE_TIMEOUT_MS) this.enterStun(now);
        break;
      }
      case "patrol":
      default: {
        this.patrol();
        const sameRow = Math.abs(player.y - this.y) < SAME_ROW_PX;
        const dx = player.x - this.x;
        if (
          now >= this.chargeReadyAt &&
          sameRow &&
          Math.abs(dx) < CHARGE_TRIGGER_PX &&
          Math.abs(dx) > 8
        )
          this.startCharge(now, Math.sign(dx) as 1 | -1);
        break;
      }
    }
  }

  /** In-level charge parry: an attack pressed within CHARGE_PARRY_WINDOW_MS of
   *  the predicted contact negates the charge and stuns the brute. Returns true
   *  on a successful parry so the scene can play feedback. */
  tryChargeParry(pressAt: number): boolean {
    if (this.phase !== "charging") return false;
    const grade = resolveParry(
      pressAt,
      this.predictedContactAt,
      CHARGE_PARRY_WINDOW_MS,
      CHARGE_PARRY_PERFECT_MS,
    );
    if (grade === "miss") return false;
    this.enterStun(pressAt);
    audio.sfx("parry");
    return true;
  }

  private startCharge(now: number, dir: 1 | -1): void {
    this.phase = "charging";
    this.chargeDir = dir;
    this.dir = dir;
    this.chargeStartedAt = now;
    const dist = Math.abs(this.host.playerSprite.x - this.x);
    this.predictedContactAt = now + (dist / CHARGE_SPEED) * 1000;
    audio.sfx("dash");
  }

  private enterStun(now: number): void {
    this.phase = "stunned";
    this.stunUntil = now + STUN_MS;
    (this.body as Body).setVelocityX(0);
    this.stompable = true; // open to a stomp / heavy hit while stunned
    this.touchDamage = 0;
    this.restoreTint(); // keep the strong/shadow tint (castle) through the stun
    this.play(animKey(this.animBase, "stun"));
  }

  private exitStun(now: number): void {
    this.phase = "patrol";
    this.stompable = false;
    this.touchDamage = 1;
    this.chargeReadyAt = now + CHARGE_COOLDOWN_MS;
    this.restoreTint(); // keep the strong/shadow tint (castle) after the stun
    this.play(animKey(this.animBase, "charge"));
  }

  /** Front armored (0 unless hit from behind); doubled while stunned. */
  protected override attackDamage(): number {
    if (this.phase === "stunned") return 2;
    const playerSide = Math.sign(this.host.playerSprite.x - this.x);
    return playerSide === this.dir ? 0 : 1; // frontal (facing the player) = blocked
  }
}
