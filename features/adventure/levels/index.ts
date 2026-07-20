import type { LevelId } from "../ids";
import type { LevelDefinition } from "./types";
import { LEVEL_1_1 } from "./level-1-1";
import { LEVEL_1_2 } from "./level-1-2";

export const LEVELS: Partial<Record<LevelId, LevelDefinition>> = {
  "1-1": LEVEL_1_1,
  "1-2": LEVEL_1_2,
};
