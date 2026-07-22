// features/adventure/realtime/bossDefinitions/index.ts
//
// Registry of real-time boss definitions + their Phaser-side mechanics
// factories, keyed by RtBossId. The defs are pure (types.ts contract); the
// factories are wired by BossController (Task 33). Each real boss task (35–45)
// registers its pair here.
import type { RtBossId } from "../types";
import type { RtBossDef } from "../types";
import type { LevelId } from "../../ids";
import type { MechanicsFactory } from "../BossController";
import { TRAINING_DUMMY, createTrainingMechanics } from "./trainingDummy";
import { BROKEN_KING, createBrokenKingMechanics } from "./brokenKing";
import { HOLLOW_GIANT, createHollowGiantMechanics } from "./hollowGiant";
import { ONE_EYED_DEALER, createDealerMechanics } from "./oneEyedDealer";
import { SCYTHEBOUND, createScytheboundMechanics } from "./scythebound";
import { VEILED_ARCHER, createVeiledArcherMechanics } from "./veiledArcher";
import { DEVIL_KING, createDevilKingMechanics } from "./devilKing";

export const RT_BOSSES: Partial<Record<RtBossId, RtBossDef>> = {
  "training-dummy": TRAINING_DUMMY,
  "broken-king": BROKEN_KING,
  "hollow-giant": HOLLOW_GIANT,
  "one-eyed-dealer": ONE_EYED_DEALER,
  scythebound: SCYTHEBOUND,
  "veiled-archer": VEILED_ARCHER,
  "devil-king": DEVIL_KING,
};

/** Which real-time boss guards each level's boss door (amendment §7). A level
 *  whose boss def has not landed yet simply shows COMING SOON at the door —
 *  each world task (35–45) registers its def above and the door goes live. */
export const LEVEL_RT_BOSS: Record<LevelId, RtBossId> = {
  "1-1": "broken-king",
  "1-2": "hollow-giant",
  "1-3": "one-eyed-dealer",
  "1-4": "veiled-archer",
  castle: "devil-king",
};

export const RT_MECHANICS: Partial<Record<RtBossId, MechanicsFactory>> = {
  "training-dummy": createTrainingMechanics,
  "broken-king": createBrokenKingMechanics,
  "hollow-giant": createHollowGiantMechanics,
  "one-eyed-dealer": createDealerMechanics,
  scythebound: createScytheboundMechanics,
  "veiled-archer": createVeiledArcherMechanics,
  "devil-king": createDevilKingMechanics,
};

export function getRtBoss(id: RtBossId): RtBossDef | undefined {
  return RT_BOSSES[id];
}

export function getRtMechanics(id: RtBossId): MechanicsFactory | undefined {
  return RT_MECHANICS[id];
}
