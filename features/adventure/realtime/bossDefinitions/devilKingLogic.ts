export type ArsenalSeal = "sword" | "bow" | "spear" | "hammer";

export type ArsenalSeals = Record<ArsenalSeal, boolean>;

const SEALS: ArsenalSeal[] = ["sword", "bow", "spear", "hammer"];

export function emptyArsenalSeals(): ArsenalSeals {
  return { sword: false, bow: false, spear: false, hammer: false };
}

export function breakArsenalSeal(state: ArsenalSeals, seal: ArsenalSeal): ArsenalSeals {
  return state[seal] ? state : { ...state, [seal]: true };
}

export function brokenSealCount(state: ArsenalSeals): number {
  return SEALS.reduce((count, seal) => count + Number(state[seal]), 0);
}

export function allArsenalSealsBroken(state: ArsenalSeals): boolean {
  return brokenSealCount(state) === SEALS.length;
}

/** One readable weapon lesson every fifteen seconds, then the mixed finale. */
export function arsenalPhaseForElapsed(elapsedMs: number): number {
  return Math.min(5, 1 + Math.floor(Math.max(0, elapsedMs) / 15_000));
}
