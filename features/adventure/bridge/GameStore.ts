import { useSyncExternalStore } from "react";

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

import type { SceneKey } from "../ids";

/** UI-facing snapshot. Later tasks add fields; they never remove them. */
export interface GameUIState {
  scene: SceneKey;
  paused: boolean;
}

export const gameStore = createStore<GameUIState>({
  scene: "Boot",
  paused: false,
});

export function useGameStore<T>(selector: (s: GameUIState) => T): T {
  return useSyncExternalStore(
    gameStore.subscribe,
    () => selector(gameStore.get()),
    () => selector(gameStore.get()),
  );
}
