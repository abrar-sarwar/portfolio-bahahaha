import type { LevelId } from "../ids";
import { LEVELS } from "../levels";

export function isDebugEnabled(params: URLSearchParams): boolean {
  return params.get("debug") === "1";
}

export function debugLevelFrom(params: URLSearchParams): LevelId | null {
  if (!isDebugEnabled(params)) return null;
  const level = params.get("level") as LevelId | null;
  return level && LEVELS[level] ? level : null;
}
