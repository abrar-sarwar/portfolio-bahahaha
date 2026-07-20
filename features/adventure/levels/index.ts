import type { LevelId } from "../ids";
import type { LevelDefinition } from "./types";
import { LEVEL_1_1 } from "./level-1-1";
import { LEVEL_1_2 } from "./level-1-2";
import { LEVEL_1_3 } from "./level-1-3";
import { LEVEL_1_4 } from "./level-1-4";

export const LEVELS: Partial<Record<LevelId, LevelDefinition>> = {
  "1-1": LEVEL_1_1,
  "1-2": LEVEL_1_2,
  "1-3": LEVEL_1_3,
  "1-4": LEVEL_1_4,
};
