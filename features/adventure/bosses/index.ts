import type { BossId } from "../ids";
import type { BossDefinition } from "../combat/types";
import { GLITCH_TOAD } from "./glitchToad";
import { CAPTAIN_SPOOF } from "./captainSpoof";
import { WARDEN } from "./warden";
import { BLANK_PAGE } from "./blankPage";
import { DEVIL_KING } from "./devilKing";

// Boss definition registry. Task 14 (Glitch Toad) and later boss tasks populate
// this map. The combat controller looks bosses up here by id and throws a clear
// error when a def is missing, so an un-authored boss fails loudly at its door
// rather than silently launching an empty fight.
export const BOSSES: Partial<Record<BossId, BossDefinition>> = {
  "glitch-toad": GLITCH_TOAD,
  "captain-spoof": CAPTAIN_SPOOF,
  "warden": WARDEN,
  "blank-page": BLANK_PAGE,
  "devil-king": DEVIL_KING,
};
