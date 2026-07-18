import Phaser from "phaser";
import { animKey } from "../art/textures";
import { BUGLING_SPRITES } from "../art/sprites/enemies1";
import { Enemy } from "./Enemy";

const FLECK_INTERVAL_MS = 800;
const FLECK_FADE_MS = 300;

/**
 * Bugling: a slow ground patroller that turns at walls and ledges, stompable in
 * one hit, deals 1 contact damage, and sheds red glitch flecks as it walks.
 */
export class Bugling extends Enemy {
  private lastFleckAt = -Infinity;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "bugling", BUGLING_SPRITES.key);
    this.hp = 1;
    this.touchDamage = 1;
    this.stompable = true;
    this.patrolSpeed = 30;
    this.turnAtLedges = true;
    this.play(animKey(this.animBase, "walk"));
  }

  override tick(dtMs: number): void {
    if (this.dying) return;
    this.patrol();
    this.emitFlecks(dtMs);
  }

  /** Red 2x2 glitch fleck every 800ms, fading over 300ms. */
  private emitFlecks(_dtMs: number): void {
    const now = this.scene.time.now;
    if (now - this.lastFleckAt < FLECK_INTERVAL_MS) return;
    this.lastFleckAt = now;
    const fx = this.x + Phaser.Math.Between(-6, 6);
    const fy = this.y + Phaser.Math.Between(-4, 4);
    const fleck = this.scene.add.rectangle(fx, fy, 2, 2, 0xef4444).setDepth(8);
    this.scene.tweens.add({
      targets: fleck,
      alpha: 0,
      y: fy - 4,
      duration: FLECK_FADE_MS,
      onComplete: () => fleck.destroy(),
    });
  }
}
