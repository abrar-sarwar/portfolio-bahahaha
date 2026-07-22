import type { LevelId } from "../ids";

export function levelEntryScene(levelId: LevelId): "Level" | "Chase" {
  return levelId === "castle" ? "Chase" : "Level";
}

export function chaseAttackPlan(
  now: number,
  progress: number,
): { nextAt: number; followupDelayMs: number | null } {
  const late = progress >= 0.65;
  return {
    nextAt: now + (late ? 1700 : 2200),
    followupDelayMs: late ? 480 : null,
  };
}
