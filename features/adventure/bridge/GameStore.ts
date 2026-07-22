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

import type { SceneKey, LevelId, BossId, BuffId, AbilityId, KeyFragment } from "../ids";
import type { CombatState } from "../combat/types";
import type { QteSpec } from "../combat/timedEvents";
import { PLAYER_BASE } from "../config";
import { RT_PLAYER } from "../realtime/config";

/** Realtime combat action-bar slots (Task 32). `cooldownFrac` is a 0..1 sweep
 *  fill (1 = just spent, 0 = ready) the ActionBar renders bottom-up over the
 *  slot. `context` swaps the `[ E INTERACT ]` slot for a boss-mechanic action
 *  (e.g. `[ E REVEAL TRUTH ]`, with an optional 0..1 hold `progress`); null
 *  keeps the default interact slot. Driven by the active BossArenaScene. */
export interface RtActionsState {
  attack: { cooldownFrac: number };
  dash: { cooldownFrac: number };
  parry: { cooldownFrac: number };
  context: null | { key: string; label: string; progress?: number };
}

/** Top boss-health-bar snapshot (Task 32); null when no realtime boss is
 *  active. `phase` is the current 0-based phase index; `phases` is the total
 *  count so BossHealthBar can render one pip per phase. */
export interface RtBossState {
  name: string;
  hp: number;
  maxHp: number;
  phase: number;
  phases: number;
}

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

/** Active typewriter dialogue overlay (Task 17); null when nothing is
 *  showing. `line` is the index into `lines` currently on screen.
 *  Dialogue.tsx renders entirely from this; dialogue/dialogueController.ts
 *  is the only writer (openDialogue / advanceDialogue / closeDialogue).
 *  Deliberately independent of `paused` below — see dialogueController.ts's
 *  doc comment for why reusing that flag would fight PlatformLevelScene's
 *  own P/Esc pause toggle instead of layering cleanly alongside it. */
export interface DialogueState {
  id: string;
  lines: string[];
  line: number;
}

/** Player-facing HUD snapshot (hearts, buff chips, fragment count). */
export interface HudState {
  health: number;
  maxHealth: number;
  buffs: BuffId[];
  fragments: number;
  /** POWER stacks (stomp-killed enemies this level, capped) — bonus swing
   *  damage carried into the boss arena. 0 hides the chip. */
  power: number;
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
  /** Key fragments earned from boss rewards (Task 14's applyRewards). No save
   *  system yet (Task 15) — like `deaths`, this is a session-only stash the
   *  controller's victory seam writes into via combat/rewards.ts. */
  keyFragments: KeyFragment[];
  /** Whether the Castle Key has been forged — set when the third key fragment
   *  lands OR by The Blank Page's explicit `castle-key` reward (Task 20). The
   *  durable mirror is save.castleKey; this is the session copy the reward flow
   *  maps through applyRewards/grantRewards (combat/rewards.ts). The castle
   *  DOOR (Task 21) gates on it; the overworld castle NODE unlocks off the
   *  normal completion chain, not this. */
  castleKey: boolean;
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
  /** Overworld progression, seeded from the save at boot and kept as the
   *  session source of truth the OverworldScene reads (it writes both here and
   *  through to the save on every completion). Mirrors save.completed /
   *  save.unlocked; `completeLevel`'s unlock chain drives which nodes light. */
  completed: LevelId[];
  unlocked: LevelId[];
  /** A pending confirm-dialog request from a scene (currently only the Title's
   *  NEW GAME wipe). Non-null makes the Overlay render ConfirmDialog; the scene
   *  that raised it listens for the `ui:confirm` bus result and clears this. */
  confirm: { message: string } | null;
  /** Active typewriter dialogue overlay (Task 17); see DialogueState. */
  dialogue: DialogueState | null;
  /** Player hearts (Task 32, 6-heart unification). The canonical realtime-facing
   *  health source the Hud renders from, in levels AND arenas. Written by
   *  PlatformLevelScene / BossArenaScene; defaults to a full 6 hearts. */
  hearts: { current: number; max: number };
  /** Active realtime boss for the top health bar; null outside an Arena. */
  rtBoss: RtBossState | null;
  /** Realtime action-bar slot state (cooldown sweeps + context action). */
  rtActions: RtActionsState;
  /** Short objective line for the ActionBar's objective slot (e.g.
   *  `STOMPS: 3 / 15`); null when there is no counted objective. */
  rtObjective: string | null;
  /** Boss-mechanic seal pips beside the ActionBar (e.g. Truth Seals); null when
   *  the active encounter has no seals. */
  rtSeals: { lit: number; of: number } | null;
}

export const gameStore = createStore<GameUIState>({
  scene: "Boot",
  paused: false,
  hud: {
    health: PLAYER_BASE.maxHealth,
    maxHealth: PLAYER_BASE.maxHealth,
    buffs: [],
    fragments: 0,
    power: 0,
    levelId: null,
  },
  levelBuffs: [],
  abilities: { dash: false, analyze: false, improvedParry: false },
  keyFragments: [],
  castleKey: false,
  combat: null,
  telegraph: null,
  deaths: {},
  combatResult: null,
  completed: [],
  unlocked: ["1-1"],
  confirm: null,
  dialogue: null,
  hearts: { current: RT_PLAYER.maxHearts, max: RT_PLAYER.maxHearts },
  rtBoss: null,
  rtActions: {
    attack: { cooldownFrac: 0 },
    dash: { cooldownFrac: 0 },
    parry: { cooldownFrac: 0 },
    context: null,
  },
  rtObjective: null,
  rtSeals: null,
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
