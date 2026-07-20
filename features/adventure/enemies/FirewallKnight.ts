import Phaser from "phaser";
import { animKey } from "../art/textures";
import { KNIGHT_SPRITES, KNIGHT_BARRIER_SPRITES } from "../art/sprites/enemies3";
import { audio } from "../audio/synth";
import { Enemy } from "./Enemy";

type Body = Phaser.Physics.Arcade.Body;

// Behaviour contract (task-19-brief.md, LOCKED numbers):
//  - 24x24, hp 3. Slow patrol at 25px/s. Its front is permanently armored:
//    frontal melee deals 0 — you must hit it from BEHIND or STOMP it.
//  - Every 4s it raises a 16x32 firewall barrier for 1.5s. While the barrier is
//    up ALL melee is blocked (blocks player attacks + projectiles); it does not
//    block movement. Stomping over the shield still works — wait it out or leap.
const PATROL_SPEED = 25;
const BARRIER_PERIOD_MS = 4000;
const BARRIER_UP_MS = 1500;
const BARRIER_OFFSET_PX = 14; // how far in front the firewall sits

export class FirewallKnight extends Enemy {
  private barrierUp = false;
  private nextBarrierAt: number;
  private barrierUntil = 0;
  private barrier?: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "firewall-knight", KNIGHT_SPRITES.key);
    this.hp = 3;
    this.touchDamage = 1;
    this.stompable = true; // stomp is always allowed (over the shield)
    this.patrolSpeed = PATROL_SPEED;
    this.turnAtLedges = true;

    const body = this.body as Body;
    body.setSize(14, 20);
    body.setOffset(5, 3);

    // Stagger the first raise so a row of knights don't shield in unison.
    this.nextBarrierAt = scene.time.now + Math.floor(Math.random() * BARRIER_PERIOD_MS);

    this.barrier = scene.add
      .sprite(x, y, KNIGHT_BARRIER_SPRITES.key)
      .setDepth(10)
      .setVisible(false);
    this.barrier.play(animKey(KNIGHT_BARRIER_SPRITES.key, "flare"));

    this.play(animKey(this.animBase, "walk"));
  }

  override tick(_dtMs: number): void {
    if (this.dying) return;
    const now = this.scene.time.now;

    if (!this.barrierUp && now >= this.nextBarrierAt) this.raiseBarrier(now);
    if (this.barrierUp && now >= this.barrierUntil) this.dropBarrier();

    if (!this.barrierUp) this.patrol();
    else (this.body as Body).setVelocityX(0);

    // Keep the firewall planted in front of the knight (its facing side).
    if (this.barrier?.visible) {
      const dir = this.flipX ? -1 : 1;
      this.barrier.setPosition(this.x + dir * BARRIER_OFFSET_PX, this.y);
    }
  }

  private raiseBarrier(now: number): void {
    this.barrierUp = true;
    this.barrierUntil = now + BARRIER_UP_MS;
    this.nextBarrierAt = now + BARRIER_PERIOD_MS;
    (this.body as Body).setVelocityX(0);
    this.play(animKey(this.animBase, "brace"));
    const dir = this.flipX ? -1 : 1;
    this.barrier?.setPosition(this.x + dir * BARRIER_OFFSET_PX, this.y).setVisible(true);
    audio.sfx("select");
  }

  private dropBarrier(): void {
    this.barrierUp = false;
    this.barrier?.setVisible(false);
    this.play(animKey(this.animBase, "walk"));
  }

  /** Front armored, and everything blocked while the firewall is up. Back hits
   *  land; stomps always land (handled in the base via hitByStomp). */
  protected override attackDamage(): number {
    if (this.barrierUp) return 0;
    const playerSide = Math.sign(this.host.playerSprite.x - this.x);
    return playerSide === this.dir ? 0 : 1;
  }

  protected override onDeath(): void {
    this.barrier?.destroy();
    this.barrier = undefined;
  }
}
