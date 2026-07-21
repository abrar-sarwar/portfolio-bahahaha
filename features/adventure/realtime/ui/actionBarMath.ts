// features/adventure/realtime/ui/actionBarMath.ts
//
// PURE cooldown-sweep math for the ActionBar. The scene tracks a per-ability
// "ready-at" timestamp; each frame it converts the remaining time into a [0, 1]
// fill fraction and writes it to gameStore.rtActions, and the ActionBar renders
// that fraction as a bottom-up sweep over the slot. Kept pure + unit-tested so
// the timing math is verified without a Phaser scene or React.

/** Fraction of a cooldown still remaining, clamped to [0, 1]. 1 = just spent
 *  (full sweep), 0 = ready. A non-positive duration means "no cooldown" → 0. */
export function cooldownFrac(remainingMs: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  if (remainingMs <= 0) return 0;
  if (remainingMs >= durationMs) return 1;
  return remainingMs / durationMs;
}

/** Convenience: the fill fraction for an ability that becomes ready at
 *  `readyAt` (scene clock), given its total cooldown `durationMs`. */
export function fracFromReadyAt(now: number, readyAt: number, durationMs: number): number {
  return cooldownFrac(readyAt - now, durationMs);
}
