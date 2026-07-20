import type { LevelId } from "../ids";
import type { LevelDefinition } from "./types";
import { LEVEL_1_1 } from "./level-1-1";
import { LEVEL_1_2 } from "./level-1-2";
import { LEVEL_1_3 } from "./level-1-3";
import { LEVEL_1_4 } from "./level-1-4";
import { CASTLE } from "./castle";

// All five levels exist now (Task 21). LEVELS is a FULL Record — every LevelId
// resolves to a definition, so consumers no longer guard for `undefined`.
export const LEVELS: Record<LevelId, LevelDefinition> = {
  "1-1": LEVEL_1_1,
  "1-2": LEVEL_1_2,
  "1-3": LEVEL_1_3,
  "1-4": LEVEL_1_4,
  castle: CASTLE,
};
