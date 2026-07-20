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
  /** Materialize a dropped pickup at a world position. */
  spawnPickup(x: number, y: number, drop: DropItem): void;
  /** Apply contact damage to the player (honours iframes internally). */
  damagePlayer(n: number): void;
  /** Launch an enemy projectile from a pooled group (Task 18 malware-bat
   *  packets): a 4x4 hazard that damages the player on overlap and despawns on
   *  solids or after ~2s. */
  fireEnemyProjectile(x: number, y: number, vx: number, vy: number): void;
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
    this.scene.time.delayedCall(90, () => this.clearTint());

    const drop = rollDrop(this.kind, Math.random());
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
