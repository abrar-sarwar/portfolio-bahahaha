// features/adventure/realtime/AttackHitbox.ts
//
// ONE pooled player attack hitbox (amendment §4). A single Zone + body lives for
// the arena's whole lifetime; a swing repositions it in front of the player and
// enables its body for a short active window, then disables it — no per-swing
// GameObject/Collider churn (the T18 leak lesson from PlatformLevelScene's own
// attack zone). A monotonic swing id guarantees ONE hit per swing even if the
// overlap fires on several frames, so holding the attack key can never stack
// hits.
import Phaser from "phaser";

type Body = Phaser.Physics.Arcade.Body;

export class AttackHitbox {
  private zone: Phaser.GameObjects.Zone;
  private swingId = 0;
  private lastHitSwing = -1;
  private facing: 1 | -1 = 1;
  private reachPx = 0;

  constructor(
    private scene: Phaser.Scene,
    width = 18,
    height = 20,
  ) {
    this.zone = scene.add.zone(0, 0, width, height);
    scene.physics.add.existing(this.zone);
    const body = this.zone.body as Body;
    body.setAllowGravity(false);
    body.enable = false;
  }

  /** Register a target the swing damages; `onHit` fires at most once per swing. */
  overlapWith(target: Phaser.GameObjects.GameObject, onHit: () => void): void {
    this.scene.physics.add.overlap(this.zone, target, () => {
      if (this.lastHitSwing === this.swingId) return; // one hit per swing
      this.lastHitSwing = this.swingId;
      onHit();
    });
  }

  /** Start a swing: place the box in front of the player and enable it. */
  fire(px: number, py: number, facing: 1 | -1, reachPx: number, activeMs: number): void {
    this.swingId++;
    this.facing = facing;
    this.reachPx = reachPx;
    const body = this.zone.body as Body;
    this.zone.setPosition(px + facing * reachPx, py);
    body.enable = true;
    this.scene.time.delayedCall(activeMs, () => {
      body.enable = false;
    });
  }

  /** Keep the active box glued in front of the player as they move mid-swing. */
  follow(px: number, py: number): void {
    if (!(this.zone.body as Body).enable) return;
    this.zone.setPosition(px + this.facing * this.reachPx, py);
  }

  get active(): boolean {
    return (this.zone.body as Body).enable;
  }

  destroy(): void {
    this.zone.destroy();
  }
}
