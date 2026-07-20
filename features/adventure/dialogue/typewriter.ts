// features/adventure/dialogue/typewriter.ts
// Pure typewriter-reveal math, extracted from Dialogue.tsx so the
// character-count formula is unit-tested without React or rAF.

/** Reveal speed: characters per second (task spec). */
export const TYPEWRITER_CPS = 30;

/** How many characters of `text` should be visible after `elapsedMs` at
 *  `cps` characters/second. Clamped to [0, text.length] — a negative/zero
 *  elapsed (or empty text) shows nothing; elapsed past the full reveal time
 *  shows the whole line rather than overflowing past its length. */
export function charsVisible(elapsedMs: number, cps: number, text: string): number {
  if (elapsedMs <= 0 || text.length === 0) return 0;
  const n = Math.floor((elapsedMs / 1000) * cps);
  return Math.max(0, Math.min(text.length, n));
}
