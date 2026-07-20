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

import type { SceneKey, LevelId, BossId, BuffId, AbilityId } from "../ids";
import type { CombatState } from "../combat/types";
import type { QteSpec } from "../combat/timedEvents";
import { PLAYER_BASE } from "../config";

/** Active telegraph the UI should render a defense mini-game against; null
 *  when nothing is armed. Timestamps are absolute `performance.now()` values
 *  (not durations) rather than the transient `combat:telegraph` bus event's
 *  relative `impactInMs` — a component that mounts on a LATER render than
 *  the one that armed the telegraph (a real risk: React's automatic
 *  batching mounts TimedPrompt only after dispatchCombat's synchronous work
 *  unwinds) can still compute correct parry timing by reading this state
 *  directly instead of racing a bus emit against its own mount. */
export interface TelegraphState {
  moveId: string;
  spec: QteSpec;
  /** performance.now() timestamp the boss move lands. */
  impactAt: number;
  /** performance.now() timestamp the telegraph was armed. */
  startedAt: number;
}

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
  /** Live combat snapshot while a boss fight is active; null otherwise. The
   *  React CombatPanel renders entirely from this. */
  combat: CombatState | null;
  /** Active telegraph awaiting a defense-result; null otherwise. Store-based
   *  (not the `combat:telegraph` bus event) so TimedPrompt can never miss it
   *  to a mount-order race. See TelegraphState. */
  telegraph: TelegraphState | null;
  /** Deaths per boss, driving the quiet assist curve. No save system yet
   *  (Task 15) — the controller stashes deaths here for the session. */
  deaths: Partial<Record<BossId, number>>;
  /** Terminal result of the most recent fight; Task 14 reads this to run the
   *  reward flow. Set on victory/defeat, cleared when combat re-launches. */
  combatResult: { outcome: "victory" | "defeat"; bossId: BossId } | null;
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
  combat: null,
  telegraph: null,
  deaths: {},
  combatResult: null,
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
