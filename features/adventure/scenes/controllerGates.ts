// Pure controller-gate decisions extracted from PlatformLevelScene so the
// interaction between knockback and the variable-jump-height clip can be
// unit-tested without a Phaser/physics runtime. Both are read each frame in
// update(); keep the constants below in sync with the scene.

/** Grace (ms) after a jump fires before the release-clip may engage. Gives
 *  tap-buffered jumps a real minimum hop instead of clipping on the same frame
 *  the buffered press releases (min hop ~1.8 tiles instead of ~0.32). */
export const JUMP_CLIP_GRACE_MS = 80;

/**
 * Whether the variable-jump-height clip should fire this frame: the player
 * released jump while still ascending faster than the -120 floor, the grace
 * window has elapsed, and no knockback is protecting the current velocity.
 * A true result means the scene clamps vy up to -120.
 */
export function shouldClipAscent(
  now: number,
  jumpFiredAt: number,
  jumpHeld: boolean,
  vy: number,
  knockbackUntil: number,
): boolean {
  return (
    !jumpHeld &&
    vy < -120 &&
    !movementLocked(now, knockbackUntil) &&
    now - jumpFiredAt > JUMP_CLIP_GRACE_MS
  );
}

/**
 * Whether player-driven movement is locked because a knockback/bounce impulse
 * is still in effect. While locked, the scene skips the horizontal velocity
 * write, dash start, and flip so the damage pop / hazard bounce is not
 * immediately neutralized by the movement code the next frame.
 */
export function movementLocked(now: number, knockbackUntil: number): boolean {
  return now < knockbackUntil;
}
