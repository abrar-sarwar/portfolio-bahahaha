import { useMemo, useSyncExternalStore } from "react";

export function createStore<S extends object>(initial: S) {
  let state = initial;
  const subs = new Set<() => void>();
  const notify = () => subs.forEach((fn) => fn());
  return {
    get: () => state,
    set: (patch: Partial<S>) => {
      state = { ...state, ...patch };
      notify();
    },
    update: (fn: (s: S) => S) => {
      state = fn(state);
      notify();
    },
    subscribe: (fn: () => void) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

import type { SceneKey, LevelId, BuffId, AbilityId } from "../ids";
import { PLAYER_BASE } from "../config";

/** Player-facing HUD snapshot (hearts, buff chips, fragment count). */
export interface HudState {
  health: number;
  maxHealth: number;
  buffs: BuffId[];
  fragments: number;
  levelId: LevelId | null;
}

/** UI-facing snapshot. Later tasks add fields; they never remove them. */
export interface GameUIState {
  scene: SceneKey;
  paused: boolean;
  hud: HudState;
  /** Buffs snapshotted when entering a boss (Task 13 combat consumes this). */
  levelBuffs: BuffId[];
  /** Unlocked movement/combat abilities. `dash` gates the platformer dash. */
  abilities: Record<AbilityId, boolean>;
}

export const gameStore = createStore<GameUIState>({
  scene: "Boot",
  paused: false,
  hud: {
    health: PLAYER_BASE.maxHealth,
    maxHealth: PLAYER_BASE.maxHealth,
    buffs: [],
    fragments: 0,
    levelId: null,
  },
  levelBuffs: [],
  abilities: { dash: false, analyze: false, improvedParry: false },
});

/** Memoize a selector by store-state reference so getSnapshot returns a
 *  stable value between store changes (useSyncExternalStore contract —
 *  object-returning selectors would otherwise loop React). */
export function memoizeBy<S, T>(compute: (s: S) => T): (s: S) => T {
  let last: { s: S; v: T } | null = null;
  return (s) => {
    if (!last || last.s !== s) last = { s, v: compute(s) };
    return last.v;
  };
}

export function useGameStore<T>(selector: (s: GameUIState) => T): T {
  // Selector is captured on first render; inline selectors must be pure.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memo = useMemo(() => memoizeBy(selector), []);
  return useSyncExternalStore(
    gameStore.subscribe,
    () => memo(gameStore.get()),
    () => memo(gameStore.get()),
  );
}
