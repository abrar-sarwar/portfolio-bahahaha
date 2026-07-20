// features/adventure/combat/controller.ts
// The bridge between the pure combat engine and the running game: it owns the
// live CombatState, publishes every transition to the store for the React UI,
// emits side-effect bus events (telegraph / fx / over), runs the telegraph
// force-fail deadline (frozen while paused), and drives the Phaser scenes
// (pause the Level, launch the CombatBackdrop). All engine logic stays in
// engine.ts; all timing/selection math stays in controllerLogic.ts.
import { createCombat, reduce, currentPhase, defenseSpecFor } from "./engine";
import {
  telegraphImpactMs,
  telegraphDeadlineMs,
  forceDefenseResult,
  buildCarry,
  deriveFx,
  createDeadline,
  pauseDeadline,
  resumeDeadline,
  remainingMs,
  type Deadline,
} from "./controllerLogic";
import type { CombatEvent, CombatState } from "./types";
import type { QteSpec } from "./timedEvents";
import type { BossId, LevelId, SfxId } from "../ids";
import { BOSSES } from "../bosses";
import { PLAYER_BASE } from "../config";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";
import { LEVELS } from "../levels";
import { audio } from "../audio/synth";

export interface StartCombatOpts {
  levelId: LevelId;
  returnTo: "level" | "castle";
}

// Structural view of the bits of Phaser.Game the controller drives, so this
// module never imports Phaser at runtime (keeps it headless-testable).
interface SceneManagerLike {
  isActive(key: string): boolean;
  pause(key: string): unknown;
  resume(key: string): unknown;
  start(key: string, data?: unknown): unknown;
  stop(key: string): unknown;
}
interface GameLike {
  scene: SceneManagerLike;
}

const LEVEL_SCENE = "Level";
const BACKDROP_SCENE = "CombatBackdrop";
// The scripted devil-king finale's parry is its second step (0 analyze,
// 1 parry). Its tag stays "scripted" rather than "telegraph", so the controller
// prompts the UI for it explicitly without arming the force-fail deadline.
// Exported so the UI (TimedPrompt, CombatPanel) shares this single literal
// instead of each re-declaring "1".
export const SCRIPTED_PARRY_STEP = 1;

interface Session {
  bossId: BossId;
  opts: StartCombatOpts;
  state: CombatState;
  deadline: Deadline | null;
  timer: ReturnType<typeof setTimeout> | null;
  pendingSpec: QteSpec | null;
}

let session: Session | null = null;
let combatGame: GameLike | null = null;
let storeUnsub: (() => void) | null = null;
let lastPaused = false;

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/** Wire the Phaser game the controller should drive (pause Level, launch
 *  backdrop). Passed by the Level scene on create; null in headless tests. */
export function registerCombatGame(game: GameLike | null): void {
  combatGame = game;
}

// ─────────────────────────────────────────────────────────── start combat ──

export function startCombat(bossId: BossId, opts: StartCombatOpts): void {
  const def = BOSSES[bossId];
  if (!def) {
    throw new Error(
      `startCombat: no boss definition registered for "${bossId}". ` +
        `Register it in features/adventure/bosses/index.ts (BOSSES) before its door can start a fight.`,
    );
  }
  beginCombat(bossId, opts);
}

/** Restart the current fight with the same opts (RETRY after a defeat). The
 *  carry is rebuilt, so the incremented death count re-derives the assist. */
export function retryCombat(): void {
  if (!session) return;
  startCombat(session.bossId, session.opts);
}

/** Exit the fight: tear down, resume the Level scene, stop the backdrop, clear
 *  the store's combat snapshot. Task 14 calls this after the reward flow.
 *  Guarded against a destroyed/null combatGame — e.g. a straggling call that
 *  lands after `teardownCombat()` already nulled it during unmount — so it
 *  never throws. */
export function exitCombat(): void {
  teardownSession();
  if (combatGame) {
    try {
      if (combatGame.scene.isActive(BACKDROP_SCENE)) combatGame.scene.stop(BACKDROP_SCENE);
      combatGame.scene.resume(LEVEL_SCENE);
    } catch {
      // Phaser game already destroyed — nothing left to resume/stop.
    }
  }
  gameStore.set({ combat: null, telegraph: null });
}

/** Full teardown for a React unmount: clears any pending force-fail timer,
 *  nulls the module session and the registered Phaser game reference, and
 *  clears the store's combat/telegraph/combatResult fields. Safe to call
 *  when nothing is active, and safe to call twice. AdventureApp's effect
 *  cleanup calls this BEFORE `game.destroy(true)` so no in-flight timer or
 *  scene call can land on a torn-down Phaser game. */
export function teardownCombat(): void {
  teardownSession();
  combatGame = null;
  gameStore.set({ combat: null, telegraph: null, combatResult: null });
}

// beginCombat is the internal seam startCombat delegates to; the proof test
// drives it directly with an inline BossDefinition that is not in BOSSES.
export function beginCombat(bossId: BossId, opts: StartCombatOpts, defOverride?: CombatState["def"]): void {
  teardownSession();

  const def = defOverride ?? BOSSES[bossId]!;
  const store = gameStore.get();
  const carry = buildCarry({
    base: PLAYER_BASE,
    levelBuffs: store.levelBuffs,
    deaths: store.deaths,
    bossId,
    improvedParry: store.abilities.improvedParry,
  });

  const state = createCombat(def, carry);
  session = { bossId, opts, state, deadline: null, timer: null, pendingSpec: null };

  gameStore.set({ combat: state, combatResult: null, telegraph: null });

  lastPaused = gameStore.get().paused;
  storeUnsub = gameStore.subscribe(onStoreChange);

  // Drive the Phaser scenes (guarded so headless tests skip Phaser entirely).
  if (combatGame) {
    const theme = LEVELS[opts.levelId]?.theme;
    if (combatGame.scene.isActive(LEVEL_SCENE)) combatGame.scene.pause(LEVEL_SCENE);
    combatGame.scene.start(BACKDROP_SCENE, { bossId, levelId: opts.levelId, theme });
  }

  // A fight can open already needing a defense (unlikely) — reconcile the tag.
  handleTag();
}

// ───────────────────────────────────────────────────────────── dispatch ──

export function dispatchCombat(event: CombatEvent): void {
  if (!session) return;
  const prev = session.state;
  const next = reduce(prev, event);
  if (next === prev) return; // illegal event → engine returned the same ref

  session.state = next;
  gameStore.set({ combat: next });

  for (const kind of deriveFx(prev, next, event)) {
    bus.emit("combat:fx", { kind });
    playFx(kind);
  }

  // Any transition answers/invalidates the outstanding telegraph deadline —
  // clear the store telegraph too so a resolved/expired prompt can never
  // linger; handleTag() below re-arms it if the new state demands one.
  clearDeadline();
  session.pendingSpec = null;
  gameStore.set({ telegraph: null });

  handleTag();

  if (next.outcome !== "ongoing") handleOutcome();
}

// Emit the telegraph prompt (and, for a true "telegraph" tag, arm the
// force-fail deadline) whenever the new state is waiting on a defense-result.
function handleTag(): void {
  if (!session) return;
  const s = session.state;
  const isTelegraph = s.tag === "telegraph";
  const isScriptedParry = s.tag === "scripted" && s.mechanic.finalStep === SCRIPTED_PARRY_STEP;
  if (!isTelegraph && !isScriptedParry) return;

  const spec = defenseSpecFor(s);
  const phase = currentPhase(s);
  const impactInMs = telegraphImpactMs(phase.tempoScale, s.assistScale);
  const moveId = s.pendingMoveId ?? "final-parry";
  session.pendingSpec = spec;

  // Store-based telegraph (Task 13 review fix): write the absolute-timestamp
  // snapshot the UI reads on render, so a TimedPrompt that mounts AFTER this
  // synchronous dispatch (React's automatic batching defers the mount-driving
  // re-render past the current stack) can still resolve the prompt correctly
  // instead of missing an unrecoverable bus emit. Keep the bus emit too: it
  // costs nothing, and it's the one already-verified contract for a future
  // always-mounted consumer (checked: CombatBackdropScene only listens for
  // "combat:fx", not "combat:telegraph", so nothing currently depends on it).
  const startedAt = now();
  const impactAt = startedAt + impactInMs;
  gameStore.set({ telegraph: { moveId, spec, impactAt, startedAt } });
  bus.emit("combat:telegraph", { moveId, spec, impactInMs });

  // Only a real telegraph is force-failed on timeout. The scripted parry has no
  // engine timer (a missed one just costs 1 HP and re-prompts) so auto-failing
  // it could spiral; there we simply wait for the player.
  if (isTelegraph) {
    const durationMs = telegraphDeadlineMs(phase.tempoScale, s.assistScale);
    session.deadline = createDeadline(startedAt, durationMs);
    armTimer(durationMs);
  }
}

function handleOutcome(): void {
  if (!session) return;
  const { state, bossId } = session;
  clearDeadline();
  gameStore.set({ telegraph: null });
  if (state.outcome === "defeat") {
    const deaths = { ...gameStore.get().deaths };
    deaths[bossId] = (deaths[bossId] ?? 0) + 1;
    gameStore.set({ deaths, combatResult: { outcome: "defeat", bossId } });
  } else {
    gameStore.set({ combatResult: { outcome: "victory", bossId } });
  }
  bus.emit("combat:over", { outcome: state.outcome === "defeat" ? "defeat" : "victory", bossId });
  // The combat snapshot stays in the store so the UI shows victory / retry;
  // Task 14 owns the reward flow and the return-to-level via exitCombat().
}

// ─────────────────────────────────────────────────── deadline / timer glue ──

function armTimer(ms: number): void {
  if (!session) return;
  session.timer = setTimeout(onDeadlineExpire, ms);
}

function clearDeadline(): void {
  if (!session) return;
  if (session.timer) {
    clearTimeout(session.timer);
    session.timer = null;
  }
  session.deadline = null;
}

function onDeadlineExpire(): void {
  if (!session || !session.pendingSpec) return;
  const spec = session.pendingSpec;
  dispatchCombat(forceDefenseResult(spec));
}

// Freeze the deadline while paused so a pause mid-telegraph never eats a parry.
function onStoreChange(): void {
  const paused = gameStore.get().paused;
  if (paused === lastPaused) return;
  lastPaused = paused;
  if (!session || !session.deadline) return;
  if (paused) {
    if (session.timer) {
      clearTimeout(session.timer);
      session.timer = null;
    }
    session.deadline = pauseDeadline(session.deadline, now());
  } else {
    session.deadline = resumeDeadline(session.deadline, now());
    armTimer(remainingMs(session.deadline, now()));
  }
}

function teardownSession(): void {
  if (session?.timer) clearTimeout(session.timer);
  storeUnsub?.();
  storeUnsub = null;
  session = null;
}

// ────────────────────────────────────────────────────────────────── audio ──

const FX_SFX: Record<string, SfxId> = {
  "player-hit": "damage",
  "boss-hit": "stomp",
  parry: "parry",
  crit: "crit",
  breach: "crit",
  phase: "select",
  summon: "error",
};

function playFx(kind: string): void {
  const id = FX_SFX[kind];
  if (id) audio.sfx(id);
}

/** Test-only: the live combat state (or null). */
export function currentCombat(): CombatState | null {
  return session?.state ?? null;
}
