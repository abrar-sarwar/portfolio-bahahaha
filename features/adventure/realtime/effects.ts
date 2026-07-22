// features/adventure/realtime/effects.ts
//
// Phaser-side combat juice for the real-time arena: impact sparks, the
// game-wide parry flash ring, a boss hit-flash, and a small camera kick. Each
// helper creates short-lived GameObjects that tween out and self-destroy (the
// codebase idiom — rectangles/arcs + tweens, no external particle assets), so
// there is no pool to reset. The hit-STOP freeze itself is a timestamp the
// BossArenaScene owns (it gates the machine step); these are the visuals that
// sell the impact. Flashes will become reduceFlash-aware in Task 48.
import Phaser from "phaser";
import { loadSave } from "../state/save";

const GOLD = 0xffd75e;
const WHITE = 0xffffff;

/** A small burst of sparks at a world point (a landed hit). */
export function impactSparks(scene: Phaser.Scene, x: number, y: number, color = GOLD): void {
  for (let i = 0; i < 6; i++) {
    const spark = scene.add.rectangle(x, y, 2, 2, color).setDepth(30);
    const ang = (Math.PI * 2 * i) / 6 + Math.random() * 0.4;
    const dist = 8 + Math.random() * 12;
    scene.tweens.add({
      targets: spark,
      x: x + Math.cos(ang) * dist,
      y: y + Math.sin(ang) * dist,
      alpha: 0,
      duration: 180 + Math.random() * 120,
      ease: "Quad.easeOut",
      onComplete: () => spark.destroy(),
    });
  }
}

/**
 * The ONE game-wide parry signal (amendment §3): a bright white-gold ring that
 * expands and fades from the player on a successful parry. Every boss reuses
 * this exact flash so a parry always reads the same.
 */
export function parryFlashRing(scene: Phaser.Scene, x: number, y: number): void {
  const reduced = loadSave().settings.accessibility.reduceFlash;
  const ring = scene.add.circle(x, y, 6).setDepth(31);
  ring.setStrokeStyle(3, WHITE, 1);
  ring.setFillStyle(GOLD, reduced ? 0 : 0.18);
  if (reduced) {
    ring.setScale(3);
    scene.time.delayedCall(260, () => ring.destroy());
    return;
  }
  scene.tweens.add({
    targets: ring,
    scale: 4,
    alpha: 0,
    duration: 260,
    ease: "Cubic.easeOut",
    onComplete: () => ring.destroy(),
  });
  // A brief inner gold pop for a bright core.
  const core = scene.add.circle(x, y, 10, GOLD, 0.5).setDepth(31);
  scene.tweens.add({
    targets: core,
    scale: 0.2,
    alpha: 0,
    duration: 160,
    onComplete: () => core.destroy(),
  });
}

/** A quick white tint pop on a boss sprite when a player hit lands. */
export function hitFlash(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite): void {
  if (loadSave().settings.accessibility.reduceFlash) {
    const bounds = sprite.getBounds();
    const outline = scene.add
      .rectangle(bounds.centerX, bounds.centerY, bounds.width + 4, bounds.height + 4)
      .setStrokeStyle(2, GOLD, 0.9)
      .setFillStyle(0, 0)
      .setDepth(30);
    scene.time.delayedCall(180, () => outline.destroy());
    return;
  }
  sprite.setTintFill(WHITE);
  scene.time.delayedCall(70, () => sprite.clearTint());
}

/** A short, small camera kick on impact (noShake-gated in Task 48). */
export function cameraKick(scene: Phaser.Scene, intensity = 0.004, ms = 90): void {
  if (loadSave().settings.accessibility.noShake) return;
  scene.cameras.main.shake(ms, intensity);
}
