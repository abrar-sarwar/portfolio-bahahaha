import Phaser from "phaser";
import { animKey } from "../art/textures";
import { SLIME_SPRITES, SLIME_MINI_SPRITES } from "../art/sprites/enemies3";
import { Enemy } from "./Enemy";

type Body = Phaser.Physics.Arcade.Body;

// Behaviour contract (task-19-brief.md, LOCKED numbers):
//  - 16x16, hp 2. Roams, then BURROWS for 1.5s: while under it is untargetable
//    (melee/stomp are no-ops, no contact damage) and leaves a corrupt `^`
//    hazard tile at the dive point for 3s. It resurfaces within ~48px of the
//    player. On death it SPLITS into two 8x8 minis (hp 1, speed 60, no drops,
//    stompable).
const ROAM_MS = 2600;
const BURROW_MS = 1500;
const CORRUPT_TILE_MS = 3000;
const RESURFACE_RANGE_PX = 48;
const MINI_SPEED = 60;

type SlimeState = "roam" | "burrowed";

export class RootkitSlime extends Enemy {
  private readonly mini: boolean;
  private phase: SlimeState = "roam";
  private burrowAt = 0;
  private surfaceAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, mini = false) {
    super(scene, x, y, "rootkit-slime", mini ? SLIME_MINI_SPRITES.key : SLIME_SPRITES.key);
    this.mini = mini;
    this.touchDamage = 1;
    this.stompable = true;
    this.turnAtLedges = true;

    const body = this.body as Body;
    if (mini) {
      this.hp = 1;
      this.patrolSpeed = MINI_SPEED;
      this.dropsLoot = false; // splits drop nothing
      body.setSize(6, 6);
      body.setOffset(1, 1);
    } else {
      this.hp = 2;
      this.patrolSpeed = 30;
      this.burrowAt = scene.time.now + ROAM_MS + Math.floor(Math.random() * 800);
    }
    this.play(animKey(this.animBase, "blob"));
  }

  override tick(_dtMs: number): void {
    if (this.dying) return;
    if (this.mini) {
      this.patrol();
      return;
    }
    const now = this.scene.time.now;
    switch (this.phase) {
      case "roam":
        this.patrol();
        if (now >= this.burrowAt) this.startBurrow(now);
        break;
      case "burrowed":
        (this.body as Body).setVelocity(0, 0);
        if (now >= this.surfaceAt) this.resurface(now);
        break;
    }
  }

  private startBurrow(now: number): void {
    this.phase = "burrowed";
    this.surfaceAt = now + BURROW_MS;
    this.targetable = false; // untargetable while under
    this.touchDamage = 0;
    this.stompable = false;
    const body = this.body as Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    body.checkCollision.none = true;
    this.host.spawnCorruptHazard(this.x, this.y, CORRUPT_TILE_MS);
    this.play(animKey(this.animBase, "burrow"));
    this.scene.time.delayedCall(320, () => {
      if (!this.dying && this.phase === "burrowed") this.setAlpha(0.12);
    });
  }

  private resurface(now: number): void {
    const player = this.host.playerSprite;
    // Clamp inside the map and back away from solid geometry so the slime
    // can never materialize out-of-bounds or embedded in a wall.
    const rawX = player.x + Phaser.Math.Between(-RESURFACE_RANGE_PX, RESURFACE_RANGE_PX);
    let nx = Phaser.Math.Clamp(rawX, 12, this.host.mapWidthPx - 12);
    const ny = player.y - 8;
    if (this.host.isSolidAt(nx, ny)) nx = player.x;
    this.setPosition(nx, ny);
    const body = this.body as Body;
    body.reset(nx, ny);
    body.setAllowGravity(true);
    body.checkCollision.none = false;
    this.setAlpha(1);
    this.phase = "roam";
    this.burrowAt = now + ROAM_MS;
    this.targetable = true;
    this.touchDamage = 1;
    this.stompable = true;
    this.play(animKey(this.animBase, "blob"));
  }

  /** On death, a full slime splits into two minis (skipped for minis). */
  protected override onDeath(): void {
    if (this.mini) return;
    for (const d of [-1, 1] as const) {
      const m = new RootkitSlime(this.scene, this.x + d * 5, this.y - 2, true);
      m.dir = d;
      this.host.registerEnemy(m);
    }
  }
}
