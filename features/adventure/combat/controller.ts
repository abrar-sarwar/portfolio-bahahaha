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
import { grantRewards } from "./rewards";
import { completeLevel, loadSave, markBossDefeated, persistSave, recordDeath } from "../state/save";
import { openDialogue } from "../dialogue/dialogueController";

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
const OVERWORLD_SCENE = "Overworld";
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

// Persist AND seed the runtime store wherever "level:complete" fires.
// returnToOverworld() is the sole emitter (Task 17 review: removed the dead
// exitCombat() victory branch that used to share this listener — see its
// doc comment), so completion is durable (save) and immediately visible
// (store's completed/unlocked, which the OverworldScene reads to light
// nodes). completeLevel is idempotent, so a replayed clear is a
// reference-stable no-op.
bus.on("level:complete", ({ levelId }) => {
  const save = completeLevel(loadSave(), levelId);
  persistSave(save);
  gameStore.set({ completed: save.completed, unlocked: save.unlocked });
});

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

/** Victory exit to the Overworld ("RETURN TO THE MAP" button). Tears down the
 *  fight, persists + seeds the level completion via the level:complete bus
 *  listener above, STOPS the Level scene, and starts the Overworld — the map
 *  is the post-victory home, not the level. (Task 17 review: this used to sit
 *  alongside a since-removed exitCombat(), which resumed the paused Level
 *  instead of returning to the map; returnToOverworld is now the single
 *  victory-exit seam, so that dead function and its stale comments were
 *  deleted.) `justCompleted` lets the Overworld pop the freshly-planted flag.
 *  Guarded against a destroyed/null combatGame. */
export function returnToOverworld(): void {
  const levelId = session?.opts.levelId;
  const wasVictory = session?.state.outcome === "victory";
  teardownSession();
  gameStore.set({ combat: null, telegraph: null });
  // Emit BEFORE the scene switch so the listener's store seed lands before the
  // Overworld's create() reads completed/unlocked. Guarded on victory (Task
  // 17 review fix c) — returnToOverworld is reachable today only from the
  // victory panel, but the emit itself had no outcome check; a future or
  // rogue call from a non-victory session must not mark the level complete.
  if (wasVictory && levelId) bus.emit("level:complete", { levelId });
  if (combatGame) {
    try {
      // Stop BOTH unconditionally: the Level scene is PAUSED here (beginCombat
      // paused it before launching the backdrop), and a paused scene reports
      // isActive() === false yet still RENDERS — an isActive guard would leave
      // it drawing on top of the Overworld. scene.stop() on a not-running scene
      // is a harmless no-op, so no guard is needed.
      combatGame.scene.stop(BACKDROP_SCENE);
      combatGame.scene.stop(LEVEL_SCENE);
      combatGame.scene.start(OVERWORLD_SCENE, { justCompleted: levelId });
    } catch {
      // Phaser game already destroyed — nothing to stop/start.
    }
  }
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

  // Dialogue (Task 17): the boss's intro plays as an overlay BEFORE the
  // first player turn — CombatPanel swaps in <Dialogue/> instead of the
  // action menu while gameStore.dialogue is set (see Interaction() there).
  // The dynamic `boss-intro-<bossId>` id resolves BOSSES[bossId].intro
  // through resolveScript, so any registered boss gets this for free; a
  // boss with no resolvable script is a silent no-op.
  openDialogue(`boss-intro-${bossId}`);

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
    persistSave(recordDeath(loadSave(), bossId)); // durable mirror of the assist-curve counter above
  } else {
    // Victory seam: grant this boss's rewards (idempotent — see rewards.ts,
    // which also persists them) and switch the music before publishing the
    // result, so the UI's victory panel and the fanfare land together.
    grantRewards(state.def);
    audio.playTrack("victory");
    gameStore.set({ combatResult: { outcome: "victory", bossId } });
    persistSave(markBossDefeated(loadSave(), bossId));
    // Dialogue (Task 17): defeat lines play through the same Dialogue
    // overlay before CombatPanel's reward chips + RETURN button — see
    // Interaction()'s dialogue gate. Dynamic id resolves
    // BOSSES[bossId].defeatLines; a silent no-op if unresolved.
    openDialogue(`boss-defeat-${bossId}`);
  }
  bus.emit("combat:over", { outcome: state.outcome === "defeat" ? "defeat" : "victory", bossId });
  // The combat snapshot stays in the store so the UI shows victory / retry.
  // CombatPanel's victory branch reads combat.def.rewards for the reward
  // chips; defeatLines now play through the Dialogue overlay opened above
  // instead of a static list. "RETURN TO THE MAP" calls returnToOverworld().
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
