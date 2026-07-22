import type { BossId, LevelId, SceneKey } from "../ids";
import type { Pt } from "../levels/types";
import {
  completeLevel,
  markBossDefeated,
  type AdventureSave,
} from "../state/save";
import type { RtBossId } from "./types";

export interface MidLevelReturn {
  levelId: LevelId;
  resumeAt: Pt;
}

export interface ArenaRouteData {
  fromLevel?: LevelId;
  returnScene?: SceneKey;
  midLevel?: MidLevelReturn;
  /** POWER stacks survive death-retries and mid-level arena round trips. */
  power?: number;
}

export type ArenaVictoryDestination =
  | {
      scene: "Level";
      data: { levelId: LevelId; spawnAt: "checkpoint"; checkpoint: Pt; power: number };
    }
  | { scene: "Overworld"; data: { justCompleted: LevelId } }
  | { scene: SceneKey };

export interface ArenaVictoryResolution {
  save: AdventureSave;
  persist: boolean;
  completedLevel?: LevelId;
  destination: ArenaVictoryDestination;
}

export function shouldRunArcherAftermath(
  route: ArenaRouteData,
  bossId: RtBossId,
): boolean {
  return bossId === "veiled-archer" && route.fromLevel === "1-4";
}

/** Resolve the generic arena exit without conflating a mid-level mini-boss
 * with the final boss that completes a world. Special Archer/Devil aftermaths
 * are handled before this seam in BossArenaScene. */
export function resolveArenaVictory(
  route: ArenaRouteData,
  bossId: RtBossId,
  save: AdventureSave,
): ArenaVictoryResolution {
  if (route.midLevel) {
    const next = markBossDefeated(save, bossId as BossId);
    return {
      save: next,
      persist: true,
      destination: {
        scene: "Level",
        data: {
          levelId: route.midLevel.levelId,
          spawnAt: "checkpoint",
          checkpoint: route.midLevel.resumeAt,
          power: route.power ?? 0,
        },
      },
    };
  }

  if (route.fromLevel) {
    const next = markBossDefeated(completeLevel(save, route.fromLevel), bossId as BossId);
    return {
      save: next,
      persist: true,
      completedLevel: route.fromLevel,
      destination: {
        scene: "Overworld",
        data: { justCompleted: route.fromLevel },
      },
    };
  }

  return {
    save,
    persist: false,
    destination: { scene: route.returnScene ?? "Title" },
  };
}
