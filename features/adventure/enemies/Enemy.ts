import Phaser from "phaser";
import type { EnemyKind } from "../levels/types";
import { frameKey, animKey } from "../art/textures";
import { audio } from "../audio/synth";
import { rollDrop, type DropItem } from "./drops";

type Body = Phaser.Physics.Arcade.Body;

/** The slice of PlatformLevelScene the enemies depend on. Declared here (not
 *  imported from the scene) so the scene can `import` the enemy classes without
 *  a circular reference — enemies only ever see this narrow surface. */
export interface EnemyHostScene extends Phaser.Scene {
  /** Solid-tile lookup in world px, for ledge probing. */
  isSolidAt(px: number, py: number): boolean;
  /** Map width in world px, for clamping runtime spawn positions in-bounds. */
  mapWidthPx: number;
  /** Materialize a dropped pickup at a world position. */
  spawnPickup(x: number, y: number, drop: DropItem): void;
  /** Apply contact damage to the player (honours iframes internally). */
  damagePlayer(n: number): void;
  /** Launch an enemy projectile from a pooled group (Task 18 malware-bat
   *  packets): a 4x4 hazard that damages the player on overlap and despawns on
   *  solids or after ~2s. */
  fireEnemyProjectile(x: number, y: number, vx: number, vy: number): void;
  /** Add a runtime-spawned enemy to the live enemy group so it inherits the
   *  group's solid/one-way colliders and the player overlap (Task 19 slime
   *  splits). */
  registerEnemy(enemy: Enemy): void;
  /** Drop a short-lived corrupt hazard tile at a world position (Task 19 slime
   *  burrow leaves a `^`-equivalent behind for a few seconds). */
  spawnCorruptHazard(x: number, y: number, ttlMs: number): void;
  /** The player sprite, for stomp-bounce and phishling targeting. */
  readonly playerSprite: Phaser.Physics.Arcade.Sprite;
}

const STOMP_BOUNCE = -240;

/**
 * Shared enemy base: an arcade sprite that patrols with wall/ledge turnaround,
 * takes a stomp or an attack, squashes, rolls a drop, and despawns. Subclasses
 * override `tick()` for their own AI and toggle `stompable` as needed.
 */
export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly kind: EnemyKind;
  protected readonly animBase: string;

  hp = 1;
  touchDamage = 1;
  stompable = true;
  patrolSpeed = 30;
  dir: 1 | -1 = 1;
  protected turnAtLedges = true;
  /** True once killed — the scene skips contact resolution against it. */
  dying = false;
  /** False = untargetable (e.g. a burrowed rootkit slime): melee/stomp are
   *  no-ops. Subclasses toggle it; the base leaves everyone targetable. */
  targetable = true;
  /** False = death rolls no drop (Task 19 slime minis). */
  protected dropsLoot = true;

  /** Archive "shadow" palette-swap tint (Task 20). null = normal enemy. When
   *  set, hit-flash / blocked-hit / death tint restores TO this instead of
   *  clearing, so a shadow enemy stays visibly dark through combat. */
  private shadowTint: number | null = null;

  /** Per-swing hit guard: the last attack-swing id that landed on this enemy,
   *  so one swing deals exactly one hit even though the hitbox overlaps every
   *  frame of the 220ms window (matters once hp > 1 — Task 19 heavies). */
  private lastHitSwing = -1;
  /** Cooldown so a single stomp-bounce can't re-hit the same enemy for several
   *  frames before the player clears its top (single-hp enemies died instantly,
   *  so this only bites multi-hp Task 19 enemies). */
  private stompCdUntil = -Infinity;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind, texKey: string) {
    super(scene, x, y, frameKey(texKey, 0));
    this.kind = kind;
    this.animBase = texKey;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(9);
    const body = this.body as Body;
    body.setSize(12, 12);
    body.setOffset(2, 3);
  }

  protected get host(): EnemyHostScene {
    return this.scene as EnemyHostScene;
  }

  /** Turn this into a "shadow"/strong variant: a dark palette-swap tint that
   *  survives hit flashes, plus +1 hp and an optional patrol-speed bonus.
   *  Called by the scene right after construction (theme "archive" uses the
   *  default 0x333333 shadow; theme "castle" passes a blood-dark tint + a speed
   *  bonus for its strong gauntlet — see PlatformLevelScene.spawnEnemies). The
   *  base kind's own hp/patrolSpeed are set first, so this stays additive. */
  makeShadow(tint = 0x333333, speedBonus = 0): void {
    this.shadowTint = tint;
    this.setTint(tint);
    this.hp += 1;
    this.patrolSpeed += speedBonus;
  }

  /** Restore the resting tint after a flash: back to the shadow tint for a
   *  shadow enemy, or a full clear for a normal one. */
  protected restoreTint(): void {
    if (this.shadowTint !== null) this.setTint(this.shadowTint);
    else this.clearTint();
  }

  /** Per-frame AI. Base behaviour is a ground patrol; subclasses may override. */
  tick(_dtMs: number): void {
    this.patrol();
  }

  /** Ground patrol with wall-turn (blocked sides) and optional ledge-turn
   *  (no solid one tile ahead+below). Verbatim contract from the brief. */
  protected patrol(): void {
    if (this.dying) return;
    const body = this.body as Body;
    if (body.blocked.left) this.dir = 1;
    if (body.blocked.right) this.dir = -1;
    if (
      this.turnAtLedges &&
      body.blocked.down &&
      !this.host.isSolidAt(this.x + this.dir * 10, this.y + 14)
    )
      this.dir = (this.dir * -1) as 1 | -1;
    body.setVelocityX(this.dir * this.patrolSpeed);
    this.setFlipX(this.dir < 0);
  }

  /** Hook: apply this enemy's contact damage to the player. */
  hurtPlayer(): void {
    if (this.dying) return;
    this.host.damagePlayer(this.touchDamage);
  }

  /** A player melee hit lands (once per swing). Effective damage comes from
   *  attackDamage() so subclasses can armor a facing (Brute/Knight front) or
   *  double it (stunned Brute). hp reaches 0 → die("attack"). */
  hitByAttack(swingId: number): void {
    if (this.dying || !this.targetable || swingId === this.lastHitSwing) return;
    this.lastHitSwing = swingId;
    const dmg = this.attackDamage();
    if (dmg <= 0) {
      this.onBlockedHit();
      return;
    }
    this.hp -= dmg;
    if (this.hp <= 0) this.die("attack");
    else this.flashHit();
  }

  /** A player stomp lands. Always bounces the player and deals 1; hp 0 → die.
   *  A short cooldown stops one bounce from multi-hitting a surviving heavy. */
  hitByStomp(): void {
    if (this.dying || !this.targetable) return;
    const now = this.scene.time.now;
    if (now < this.stompCdUntil) return;
    this.hp -= 1;
    if (this.hp <= 0) {
      this.die("stomp");
      return;
    }
    this.stompCdUntil = now + 250;
    (this.host.playerSprite.body as Body).setVelocityY(STOMP_BOUNCE);
    audio.sfx("stomp");
    this.flashHit();
  }

  /** Effective melee damage a landed swing deals. Default 1; armored enemies
   *  override to 0 from a protected facing or ×2 while stunned. */
  protected attackDamage(): number {
    return 1;
  }

  /** A swing that dealt no damage (blocked by armor/shield): a small clink. */
  protected onBlockedHit(): void {
    this.setTint(0x6ec1ff);
    this.scene.time.delayedCall(90, () => {
      if (!this.dying) this.restoreTint();
    });
    audio.sfx("error");
  }

  /** Non-lethal hit feedback: a white flash. */
  protected flashHit(): void {
    this.setTint(0xffffff);
    this.scene.time.delayedCall(90, () => {
      if (!this.dying) this.restoreTint();
    });
    audio.sfx("damage");
  }

  /** Killed by a stomp or an attack: squash + flash, roll a drop, bounce the
   *  player on a stomp, then fade out and despawn. Idempotent. */
  die(source: "stomp" | "attack"): void {
    if (this.dying) return;
    this.dying = true;

    const body = this.body as Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    body.checkCollision.none = true; // no more colliders/overlaps

    this.onDeath();

    // Squash: dedicated frame if the sheet has one, else a scale-flatten.
    if (this.scene.anims.exists(animKey(this.animBase, "squash")))
      this.play(animKey(this.animBase, "squash"));
    else this.setScale(1.25, 0.5);
    this.setTint(0xffffff);
    this.scene.time.delayedCall(90, () => this.restoreTint());

    const drop = this.dropsLoot ? rollDrop(this.kind, Math.random()) : null;
    if (drop) this.host.spawnPickup(this.x, this.y, drop);

    if (source === "stomp") {
      (this.host.playerSprite.body as Body).setVelocityY(STOMP_BOUNCE);
      audio.sfx("stomp");
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 220,
      delay: 160,
      onComplete: () => this.destroy(),
    });
  }

  /** Subclass cleanup hook fired at the start of death (e.g. floating text). */
  protected onDeath(): void {}
}
