import type { LevelId } from "../ids";
import type { LevelDefinition } from "./types";
import { LEVEL_1_1 } from "./level-1-1";

export const LEVELS: Partial<Record<LevelId, LevelDefinition>> = {
  "1-1": LEVEL_1_1,
};
