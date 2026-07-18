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
