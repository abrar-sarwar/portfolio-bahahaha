// features/adventure/realtime/ParrySystem.ts
//
// PURE parry window/result math. Given an attack's active-start time and the
// base parry window, decide whether an input timestamp parries. The window is
//   [activeStart − effectiveWindow, activeStart + lateGrace]
// where only the PRE-window scales with accessibility/assist multipliers; the
// late grace is a fixed forgiveness tail (§ amendment ParrySystem note).
import { RT_PLAYER } from "./config";

export const PARRY_LATE_GRACE_MS = 40;
export const PARRY_WIDER_MULT = 1.3; // widerParry accessibility toggle
export const PARRY_ASSIST_MULT = 1.25; // silent assist (mirrors assistRT.parryWindowScale)

export interface ParryScaling {
  widerParry?: boolean;
  assist?: boolean;
}

export interface ParryTiming {
  activeStartMs: number; // when the attack turns active (telegraph end)
  parryWindowMs: number; // base pre-active window
}

export interface ParryBounds {
  start: number;
  end: number;
}

export type ParryResult = { ok: true; offsetMs: number } | { ok: false; vulnerableMs: number };

export function effectiveParryWindowMs(base: number, scaling?: ParryScaling): number {
  let w = base;
  if (scaling?.widerParry) w *= PARRY_WIDER_MULT;
  if (scaling?.assist) w *= PARRY_ASSIST_MULT;
  return w;
}

export function parryBounds(timing: ParryTiming, scaling?: ParryScaling): ParryBounds {
  const window = effectiveParryWindowMs(timing.parryWindowMs, scaling);
  return {
    start: timing.activeStartMs - window,
    end: timing.activeStartMs + PARRY_LATE_GRACE_MS,
  };
}

/**
 * Grade a parry attempt. Success reports the signed offset from active-start
 * (0 = frame-perfect, negative = early, positive = late-grace). A miss carries
 * the fail-vulnerable duration the player eats for whiffing.
 */
export function judgeParry(
  inputMs: number,
  timing: ParryTiming,
  opts?: { scaling?: ParryScaling; failVulnerableMs?: number },
): ParryResult {
  const { start, end } = parryBounds(timing, opts?.scaling);
  if (inputMs >= start && inputMs <= end) {
    return { ok: true, offsetMs: inputMs - timing.activeStartMs };
  }
  return { ok: false, vulnerableMs: opts?.failVulnerableMs ?? RT_PLAYER.parryFailVulnerableMs };
}
