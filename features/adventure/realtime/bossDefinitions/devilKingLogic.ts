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

export function devilDuelTargetX(bossX: number, playerX: number, arenaWidth: number): number {
  const distance = Math.abs(bossX - playerX);
  const side = bossX >= playerX ? 1 : -1;
  const target = distance > 170
    ? playerX + side * 150
    : distance < 90
      ? playerX + side * 90
      : bossX;
  return Math.max(48, Math.min(arenaWidth - 48, target));
}

export function devilBladePreview(
  attackId: string,
  direction: 1 | -1,
): { width: number; offsetX: number } | null {
  if (attackId === "quick-slash" || attackId === "delayed-slash") {
    return { width: 82, offsetX: direction * 32 };
  }
  if (attackId === "dash-cut") return { width: 94, offsetX: direction * 28 };
  if (attackId === "spear-thrust") return { width: 116, offsetX: direction * 50 };
  if (attackId === "three-hit") return { width: 88, offsetX: direction * 30 };
  return null;
}
