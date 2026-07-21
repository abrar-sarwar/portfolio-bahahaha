// features/adventure/realtime/assistRT.ts
//
// PURE silent-assist scaling (amendment §6). After 3+ failed attempts on the
// same boss, combat quietly eases: +1 max heart, recovery windows ×1.2,
// projectile speed ×0.85, parry window ×1.25. Never announced. This module only
// computes the profile; the wiring that applies it lives in Task 48.

export const ASSIST_RT_THRESHOLD = 3;

/** The exact §6 multipliers applied once assist is active. */
export const ASSIST_RT = {
  bonusMaxHearts: 1,
  recoveryScale: 1.2,
  projectileSpeedScale: 0.85,
  parryWindowScale: 1.25, // mirrored by ParrySystem's assist flag (PARRY_ASSIST_MULT)
} as const;

export interface AssistProfile {
  active: boolean;
  bonusMaxHearts: number;
  recoveryScale: number;
  projectileSpeedScale: number;
  parryWindowScale: number;
}

const NEUTRAL: AssistProfile = {
  active: false,
  bonusMaxHearts: 0,
  recoveryScale: 1,
  projectileSpeedScale: 1,
  parryWindowScale: 1,
};

export function assistRTActive(failedAttempts: number): boolean {
  return failedAttempts >= ASSIST_RT_THRESHOLD;
}

export function assistRTProfile(failedAttempts: number): AssistProfile {
  if (!assistRTActive(failedAttempts)) return { ...NEUTRAL };
  return { active: true, ...ASSIST_RT };
}

/**
 * Combine the in-session failure count with the persisted floor (kept via the
 * existing `assistLevel`) so assist, once earned, never silently switches off
 * mid-session.
 */
export function effectiveAttempts(sessionFails: number, persistedFloor = 0): number {
  return Math.max(sessionFails, persistedFloor);
}
