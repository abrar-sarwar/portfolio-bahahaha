# Abrar's Adventure — Plan Amendment: Real-Time Combat Rework

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.
> This amendment **supersedes** `2026-07-17-abrars-adventure.md` for all work from
> 2026-07-20 onward. The original plan remains the historical record of Tasks 1–22
> and the authority on retained infrastructure it built. Where the two documents
> conflict, THIS document and the rework brief govern.

**Date:** 2026-07-20
**Spec:** `docs/superpowers/specs/2026-07-20-realtime-rework-brief.md` (verbatim user
brief — cited below as "the brief"; every content task MUST read its section of it)
**Ledger:** `.superpowers/sdd/progress.md` (continues; new tasks are numbered 31–49)
**Branch:** `feature/abrars-adventure` — LOCAL ONLY, never push, never touch `main`.

## 1. Decision record

On 2026-07-20 the user replaced the turn-based combat direction with **real-time
platform combat**, and replaced all five worlds' content with a new creative
direction (city→temple, desert→underground, coast→casino, rain kingdom→cathedral,
rift castle) with six new real-time bosses. Additional binding decisions from the
brief:

1. No turn-based combat menu anywhere in active gameplay.
2. **No dialogue** of any kind (boss/cutscene/NPC/narration). Allowed text only:
   world names, boss names, controls, HUD info, objective counters, short system
   messages (`CASTLE UNLOCKED`, `ARCHIVE KEY ACQUIRED`), archive code, buttons.
   Leave clean seams so dialogue can be added later without rebuilding encounters.
3. All gameplay controls/ability info live in a small bottom **action bar**; boss
   health at top; player health always visible.
4. Target ~25 min total, hard cap < 30 min: worlds ≈ 4/4/4/6 min, castle ≈ 7 min
   (≈3 min gauntlet + boss), overworld/transitions 1–2 min.
5. The turn-based engine is **preserved but dormant** until the new system is
   verified (brief rule 6). The eight locked files (brief rule 7) are NOT
   authorized for modification by this amendment. Building happens in
   `features/adventure/realtime/`.
6. Player: 6 hearts, no lives; normal boss hit = 1 heart, heavy = 2 hearts with a
   large telegraph; boss retries restart immediately before the boss.
7. Every boss is defeated primarily by understanding a specific weakness, not by
   raw HP reduction.

## 2. Disposition of the original plan (Tasks 1–30)

| Old task | Disposition |
|---|---|
| 1–3 tooling, bridge, route shell | **Retained** as-is. |
| 4 palette/grid/textures/player sprite | **Retained.** Player sprite reused verbatim ("the existing pixel-art Abrar character"). Palette is extended additively by new-world tasks (never re-map an existing char). |
| 5 synth/tracks/sfx | **Engine retained.** Track/SFX *content* extended and partly replaced (see §5 Audio). Old boss/devil track data stays in-tree, dormant. |
| 6 level format/parser | **Retained.** New worlds are authored in the same ASCII format; new legend chars follow the established parser-TDD pattern. Per T6 ledger note, every replaced map updates its `parse.test.ts` CONTENT row. |
| 7 PlatformLevelScene/controller/camera/HUD | **Retained** — it is the platforming engine the rework builds on. HUD moves to 6 hearts (Task 32). |
| 8 enemy base + drops | **Framework retained.** Cyber-themed enemy sprites/uses become dormant as their maps are replaced; per-world tasks re-skin behaviors or omit enemies (levels are platforming-first; enemies are seasoning). Buff DROPS are dormant (no buff system in real-time combat). |
| 9–13 typing/timedEvents/buffs/engine/controller+combat UI | **Dormant, preserved.** Locked files untouched. `combat/controller.ts`, `ui/CombatPanel.tsx`, `CombatBackdropScene.ts` stay in-tree but are unwired from active flow in Task 33. Their tests keep running and must stay green (they guard preserved code). |
| 14 Glitch Toad | **Dormant, preserved** (boss def + sprite stay; never launched). |
| 15 save/settings | **Retained.** Additive changes only (see §6 Save). |
| 16 Title/Overworld | **Retained.** World display names change per new direction; castle-node transformation added in Task 42. |
| 17 dialogue system | **Dormant, preserved.** No active caller after the rework. Do not delete; it is the future "dialogue seam". |
| 18–21 worlds 1-2/1-3/1-4/castle + bosses | **Content replaced** by Tasks 34–43. Old maps/tilesets/tracks are overwritten in place (git history preserves them); old turn-based boss defs stay dormant in `bosses/`. |
| 22 Devil King phases 1–2 (turn-based) | Committed `2086f61` but never ledgered/reviewed. **Superseded** — treat as dormant content; no retro-review. Its sprite may be salvaged/adapted by Task 44 if the design fits; otherwise a new sprite is authored. |
| 23 Final Command + VictoryScene | **Obsolete** (typing finale + scripted dialogue contradict the brief). Replaced by Tasks 45–46. `SceneKey` values `Victory`/`Chest` are reused by the new scenes. |
| 24 ChestScene/codeService | **Carried forward into Task 46** with changed display text (`THE LOST KEY HAS BEEN RECOVERED` / `ARCHIVE CODE`); `codeService` interface + dev code `INK-7F2A` verbatim from the old plan; no chest dialogue. |
| 25 `/gallery` stub | **Carried forward → Task 47** (unchanged scope). |
| 26 secret-door entry button | **Carried forward → Task 47** (unchanged scope). |
| 27 mobile virtual controls | **Carried forward → Task 48**, extended with ATTACK/PARRY buttons and the ActionBar's mobile transform. |
| 28 pause/settings/accessibility | **Carried forward → Task 48.** Accessibility set becomes: wider parry, slower hazards, reduced flashing, no screen shake (see §6). `slowerTyping` stays persisted but dormant. |
| 29 debug menu `?debug=1` | **Carried forward → Task 48** with real-time actions (world/arena jump, wipe save, grant completion). The gated debug menu is a shipped feature, NOT a "temporary debug hook" in the brief's sense; ad-hoc hooks (teleports, god-mode flags, speed hacks) must never survive a task's commit. |
| 30 final verification | **Replaced by Task 49** — the brief's 30-point completion criteria are the new acceptance bar (the old 20-point list is obsolete). |

**Obsolete acceptance criteria:** the old plan's "Combat balance acceptance"
section (sim-verified turn-based win rates) is void. Real-time balance is
verified by scripted/browser playtests and the timing targets in §1.4.

## 3. Updated global constraints (binding for Tasks 31–49)

Carried forward from the original plan:

- NEVER `git push`; local commits only; commit after every task with the given message.
- Phaser never enters the main-feed bundle (dynamic import boundary unchanged).
- Do not modify: `components/IntroVideo.tsx`, `components/VideoModal.tsx`, any
  video preloading behavior, `_archive/`, existing routes' behavior.
  `components/ScrollFeed.tsx` gets exactly one addition (Task 47).
- All art/audio original + code-generated (pixel grids, chiptune synth). No
  copyrighted designs — explicitly none from Undertale, Mario/Nintendo, casino
  games, or other commercial titles.
- `INK-7F2A` served only through async `codeService`; never hardcoded in UI.
- Canvas 960×540, `pixelArt`, `roundPixels`, `Scale.FIT`, camera zoom 2 in
  platforming; tiles 16×16; player 16×24.
- Gates per task: `npx tsc --noEmit` clean; `npx vitest run` all green.
  `npm run build` at framework/world milestones (Tasks 33, 35, 39, 43, 46, 49).
  Repo-wide `npm run lint` failure is pre-existing and not a gate.
- SCENE-INSTANCE HYGIENE (T18 rule, now brief-mandated): every scene resets ALL
  accumulated arrays, timers, projectiles, hitboxes, and references at the top of
  `create()`; teardown on `shutdown`/`destroy` events.

New, from the brief:

- The eight locked files under `features/adventure/combat/` are read-only.
  (`engine.ts`, `types.ts`, `typing.ts`, `timedEvents.ts`, `buffs.ts`,
  `assist.ts`, `rng.ts`, `controllerLogic.ts`.) Importing from them is allowed
  (e.g. the seeded rng); editing is not.
- **No dialogue** (see §1.2). New gameplay code must not call
  `dialogue/dialogueController` or render `Dialogue.tsx`.
- Controls: A/← left, D/→ right, Space/W/↑ jump, **J/X attack, K/C parry**,
  Shift dash, E interact, Escape pause.
- 6 hearts everywhere (levels + arenas); full heal on level start, checkpoint
  respawn, and arena entry/retry.
- Every world map places at least two mid-level checkpoints (≈1/3 and ≈2/3 of
  the route, ahead of hazard-dense sections); boss arenas are their own
  checkpoint. (Coverage-critique SF-3.)
- Damage readability: no invisible or unpredictable damage; every boss attack has
  a telegraph (animation/sound/lighting/positioning/particles); parryable attacks
  share ONE consistent visual signal game-wide (bright white-gold flash ring —
  established in Task 33, reused by every boss).
- Every new boss sprite is rendered to PNG and visually inspected before its
  commit (devtool from Task 34; inspect with the Read tool / by eye). The
  Task 32 training dummy is exempt (debug-only sprite, predates the devtool —
  critique N-4).
- Boss anim states minimum, where applicable: Idle, Move, Attack prep, Attack,
  Recovery, Damage, Phase transition, Defeat. (Background-anchored bosses may
  omit Move; single-phase bosses omit Phase transition — critique N-3.)
- Timing: task-level playtests record world completion times against §1.4.

## 4. Real-time architecture

New directory `features/adventure/realtime/` (brief's suggested layout, split
into pure logic vs Phaser-facing):

```text
features/adventure/realtime/
  config.ts                  # RT_PLAYER / RT_TUNING constants (single source)
  types.ts                   # RtBossDef, RtAttackSpec, RtPhaseSpec, machine types
  BossStateMachine.ts        # PURE reducer — the framework's heart (vitest)
  DamageSystem.ts            # PURE hearts/iframes/knockback/damage-scale math
  ParrySystem.ts             # PURE parry window/result math
  StompSystem.ts             # PURE stomp-contact classification math
  ProjectileSystem.ts        # PURE projectile kinematics (spawn specs → motion)
  assistRT.ts                # PURE silent-assist scaling
  *.test.ts                  # alongside every pure module
  BossArenaScene.ts          # Phaser scene: arena map + player + boss + retry
  BossController.ts          # binds machine state/commands → sprites/anims/sfx
  PlayerCombatController.ts  # attack/parry/stomp layer over platform movement
  AttackHitbox.ts            # pooled player hitboxes (no overlapping spam)
  ProjectileManager.ts       # pooled Phaser projectiles driven by ProjectileSystem
  ArenaHazardSystem.ts       # shockwaves, falling debris, lasers, zones (pooled)
  effects.ts                 # hit-stop, parry freeze, impact particles, flashes
  arenas.ts                  # arena LevelDefinitions (small enclosed maps)
  bossDefinitions/
    trainingDummy.ts         # debug-arena boss exercising every framework path
    brokenKing.ts hollowGiant.ts oneEyedDealer.ts
    scythebound.ts veiledArcher.ts devilKing.ts
  ui/
    ActionBar.tsx            # bottom action bar (+ mobile transform, Task 48)
    BossHealthBar.tsx        # top boss health + name + phase pips
```

### Binding interfaces (Tasks 31–33 implement; later tasks consume)

```ts
// realtime/types.ts (shapes may gain optional fields; never rename these)
export type RtBossId =
  | "training-dummy" | "broken-king" | "hollow-giant" | "one-eyed-dealer"
  | "scythebound" | "veiled-archer" | "devil-king";

export interface RtAttackSpec {
  id: string;
  telegraphMs: number;         // >= 700 required when damage === 2
  activeMs: number;
  recoveryMs: number;          // punish window
  cooldownMs?: number;
  parryable?: boolean;         // shows the game-wide parry flash during telegraph
  damage: 1 | 2;               // hearts
  weight?: number;             // selection weight (default 1)
  minRangePx?: number;
  maxRangePx?: number;         // selection gating by |player - boss| x-distance
}

export interface RtPhaseSpec {
  id: string;
  enterBelowHpFrac?: number;   // omitted for phase 0 / mechanic-driven phases
  attackIds: string[];
  tempoScale?: number;         // < 1 = faster telegraph+recovery
}

export interface RtBossDef {
  id: RtBossId;
  name: string;                // shown ALL-CAPS in BossHealthBar
  maxHp: number;
  contactDamage: 1 | 2;
  damageScale?: { attack?: number; stomp?: number }; // default 1 / 1
  phases: RtPhaseSpec[];
  attacks: RtAttackSpec[];
  arenaKey: string;            // key into realtime/arenas.ts
  track: TrackId;
  spawn: { tx: number; ty: number };
}

export type MachineEvent =
  | { kind: "hit"; amount: number; source: "attack" | "stomp" | "mechanic" }
  | { kind: "parried" }        // player parried the current parryable attack
  | { kind: "wall-hit" }       // charge-type attacks striking a wall
  | { kind: "mechanic"; id: string }; // boss-specific (truth, clasp, seal, …)

export interface BossMachineState {
  hp: number; phaseIndex: number;
  fsm: "spawn" | "idle" | "telegraph" | "attack" | "recovery"
     | "stagger" | "transition" | "defeated";
  msInState: number;
  currentAttackId: string | null;
  cooldowns: Record<string, number>;
  vulnerableMs: number;        // > 0 → weakness/punish window open
  invulnerable: boolean;       // mechanic-armored (damage events ignored)
}

export type MachineCommand =
  | { kind: "anim"; anim: string }
  | { kind: "attack-start" | "attack-active" | "attack-end"; attackId: string }
  | { kind: "phase"; phaseIndex: number }
  | { kind: "stagger" }
  | { kind: "vulnerable"; ms: number }
  | { kind: "defeated" };

export interface StepInput {
  dt: number;                  // ms, fixed-step in tests
  playerX: number; playerY: number; bossX: number; bossY: number;
  events: MachineEvent[];
  rng: () => number;           // seeded (import mulberry32 from combat/rng.ts —
}                              // import is allowed, modification is not)

// BossStateMachine.ts
stepBoss(def: RtBossDef, s: BossMachineState, input: StepInput):
  { state: BossMachineState; commands: MachineCommand[] }
```

Boss-specific mechanics (truth seals, heart cycles, mask clasps, stomp counter,
arrow platforms, weapon seals) are NOT machine states — each boss definition
module exports a mechanics factory wired by `BossController`:

```ts
export interface BossMechanics {
  onCommand?(cmd: MachineCommand): void;
  update?(dt: number): void;
  /** Feed machine events (mechanic hits, forced vulnerability, victory). */
  events(): MachineEvent[];
  destroy(): void;
}
createMechanics(scene: BossArenaScene, api: MechanicsApi): BossMechanics
```

`MechanicsApi` (Task 33) exposes: player/boss sprites, `setContextAction(...)`
(drives the ActionBar's `[ E REVEAL TRUTH ]`-style slot), `setObjective(...)`
(`STOMPS: 12 / 15`), seal pips, projectile/hazard managers, effects, sfx, and
`forceDefeat()` for scripted finishes.

### Player combat (realtime/config.ts starting values — tune in playtests)

```ts
export const RT_PLAYER = {
  maxHearts: 6,
  attackCooldownMs: 320, attackActiveMs: 140, attackReachPx: 20, attackDamage: 2,
  hitStopMs: 70,               // boss hit-stop on player hits landing
  stompBounceVel: -330, stompDamage: 3,
  parryWindowMs: 200, parryFailVulnerableMs: 450, parryFreezeMs: 120,
  hurtIframesMs: 900,
} as const;
```

Existing platforming feel (coyote 100ms, buffer 120ms, variable jump, dash
320px/s / 160ms / 450ms cd, knockback) is preserved from `config.ts` `PHYSICS`.

### Scene & flow

- `BossArenaScene` (SceneKey `"Arena"`, added to `ids.ts` additively) is ONE
  parameterized scene launched with `{ bossId, fromLevel: LevelId }`. Arenas are
  small enclosed `LevelDefinition` maps rendered through the existing tile/theme
  pipeline. Boss placement comes from `RtBossDef.spawn`, not a legend char.
- Level boss doors (`D`) launch the Arena directly — no dialogue, no turn-based
  controller. Victory → existing level-completion path (save + overworld return).
  Player death → short fade → `scene.restart()` with full hearts ("retry from
  immediately before the boss"). Quit-to-map stays available via pause.
- React side: `ActionBar` (bottom, always during Level/Arena) and `BossHealthBar`
  (top, Arena only) read new `gameStore` fields (`rtBoss`, `rtActions`,
  `rtObjective`, `rtSeals` — added additively in Tasks 32–33). The old central
  `CombatPanel` stops being mounted (file preserved).

## 5. Audio plan

Engine (synth/notes) unchanged. Additive `ids.ts` changes:

- `TrackId` += `"broken-king" | "hollow-giant" | "one-eyed-dealer" |
  "scythebound" | "veiled-archer" | "devil-duel" | "devil-arsenal"` — one
  distinct theme per boss, authored in that boss's task. Devil King phase 2
  swaps `devil-duel` → `devil-arsenal` (the brief's transforming music).
- World themes: replace CONTENT of `level-1..level-4` and `castle` tracks in
  their world tasks (ids unchanged). `title`/`overworld`/`victory`/`chest`
  retained. Old `boss`/`devil-1/2/3` data dormant.
- `SfxId` += `"slash" | "boss-hit" | "telegraph" | "expose" | "seal" |
  "mask-break" | "heart-hit" | "weapon-swap" | "key-drop"` (Task 33 stubs them
  in `sfx.ts`; boss tasks may refine). Brief's required-cue map: player attack →
  `slash`, stomp → `stomp`, parry → `parry`, boss telegraph → `telegraph`, boss
  damage → `boss-hit`, player damage → `damage`, weak-point exposure → `expose`,
  mask breaking → `mask-break`, truth seal → `seal`, heart strike → `heart-hit`,
  weapon transformation → `weapon-swap`, key drop → `key-drop`, chest → `chest`.
  (The mapped ids `stomp`, `parry`, `damage`, `collect`, `chest` already exist
  in `SfxId` from original Task 5 — verified in-repo; the mapping relies on
  them. Critique SF-1.)

## 6. Save, settings, accessibility

- `AdventureSave` schema: no version bump. `bossesDefeated` records the new boss
  ids — `BossId` in `ids.ts` is EXTENDED additively with
  `"broken-king" | "hollow-giant" | "one-eyed-dealer" | "scythebound" |
  "veiled-archer"` (old ids remain for shape compat; `devil-king` reused).
  `abilities`/`keyFragments`/`memoryFragments` become dormant fields (persisted,
  unread). Unlocks are driven purely by `completed`/`unlocked` LevelIds.
- Player has the FULL moveset (attack/parry/dash/stomp) from World 1-1 — no
  ability unlock chain.
- `settings.accessibility` gains `slowerHazards: boolean` (additive, default
  false; scales projectile speeds ×0.8 and hazard timers ×1.25). Active set:
  `widerParry` (parry window ×1.3), `slowerHazards`, `reduceFlash`, `noShake`.
  `slowerTyping` persists but is dormant.
- Silent assist (`assistRT.ts`): after 3+ failed attempts on the same boss (in-
  session count, floor persisted via existing `assistLevel`): +1 max heart,
  recovery windows ×1.2, projectile speed ×0.85, parry window ×1.25. Never
  announced (no toast, no copy).

## 7. Task sequence

Numbering continues the original ledger (31–49). Aliases R1–R19 exist only for
conversation; headers below are what `scripts/task-brief` extracts. Every task:
implementer subagent → tests/gates → commit (exact message given) → task review →
fixes → ledger line. Browser playtests use a headless-Playwright harness in the
session scratchpad (recreate if missing; `npx playwright install chromium` once
if the cache is gone).

---

### Task 31: Realtime core logic (pure)

**Files:** Create `features/adventure/realtime/{config,types,BossStateMachine,DamageSystem,ParrySystem,StompSystem,ProjectileSystem,assistRT}.ts` + a `.test.ts` per logic module. Modify `features/adventure/ids.ts` (additive only: `SceneKey` += `"Arena"`; `BossId` += the five new ids; `TrackId`/`SfxId` += §5 lists).

Implement §4's binding interfaces exactly. Machine behavior: `spawn` → `idle`
(attack selection: filter phase pool by cooldown+range, weighted pick via rng) →
`telegraph` (× tempoScale) → `attack` → `recovery` (× tempoScale) → `idle`;
`parried`/`wall-hit` events → `stagger` (interrupts, opens `vulnerableMs`);
`hit` events respect `invulnerable` + `damageScale`; phase crossings emit
`phase` + `transition` state; hp ≤ 0 or `forceDefeat` mechanic event →
`defeated` (absorbing). DamageSystem: hearts math, iframes, 1|2-heart hits,
heavy-telegraph invariant (validate defs: damage 2 ⇒ telegraphMs ≥ 700 — throw
at registration). ParrySystem: window grading vs `parryWindowMs` (+ widerParry/
assist scaling), fail-vulnerable. StompSystem: classify contact (falling, feet
above target's top third → stomp) — reuse the geometry conventions from
`enemyLogic.ts`. ProjectileSystem: linear/arc/homing-lite/bouncing kinematics +
TTL, pure step functions. assistRT per §6. Determinism: all functions pure;
fixed-dt step tests; rng injected (import from `combat/rng.ts` — read-only).
Tests: full machine walkthrough for a synthetic def (selection, cadence,
stagger, phase, defeat, cooldowns, range gating, tempo scaling), damage/parry/
stomp/projectile math, def validation, assist scaling. Gates: tsc + vitest.

```bash
git add features/adventure && git commit -m "feat(adventure): realtime combat core — boss state machine and combat math"
```

---

### Task 32: Player combat layer, ActionBar, arena shell, training dummy

**Files:** Create `realtime/{BossArenaScene,PlayerCombatController,AttackHitbox,effects,arenas}.ts`, `realtime/bossDefinitions/trainingDummy.ts`, `realtime/ui/{ActionBar,BossHealthBar}.tsx`. Modify: `input/InputState.ts` (add `attack` J/X, `parry` K/C, jump alias W — additive), `game.ts` (register Arena), `bridge/GameStore.ts` (additive fields `rtBoss`, `rtActions`, `rtObjective`, `rtSeals`, `hearts`), `ui/Overlay.tsx` (mount ActionBar during Level/Arena + BossHealthBar during Arena), `ui/Hud.tsx`+`hudMath.ts`+test (6 hearts, no halves), `scenes/PlatformLevelScene.ts` (health source → 6 hearts; full heal at start/checkpoint), `ui/DebugMenu` hook if trivial — else arena entry via `?arena=training` query param handled in `game.ts` (shipped, gated, harmless).

- Player combat: J/X attack (pooled single active hitbox, cooldown, `slash` sfx,
  impact particles, hit-stop via `effects.ts`); K/C parry (window + fail-
  vulnerable + freeze + flash); stomp-on-boss via StompSystem (bounce, `stomp`
  sfx); dash/iframes/knockback reuse platform machinery. No hitbox spam: holding
  J produces one hitbox per cooldown.
- BossArenaScene: loads arena map from `arenas.ts` through the existing tile
  pipeline (training arena uses an existing tileset theme); spawns player + boss
  sprite; full state reset at `create()` top; death → fade → restart with full
  hearts; Escape pause honored. BossHealthBar (name/hp/phase pips) + hearts HUD
  + ActionBar (`[ J ATTACK ] [ SPACE JUMP ] [ SHIFT DASH ] [ K PARRY ]
  [ E INTERACT ]`, cooldown sweeps, context-action + objective slots wired to
  store; small, bottom-centered, never covers the player).
- Training dummy def: static boss with one parryable poke + one unparryable
  poke; takes attack/stomp damage; validates the loop end-to-end.
- Verify in browser (screenshots): arena boots via `?arena=training`, attack/
  parry/stomp/dash all function, hearts drain/restore, restart works, no console
  errors, level HUD shows 6 hearts. Gates: tsc + vitest + build.

```bash
git add features/adventure && git commit -m "feat(adventure): player realtime combat, action bar, boss arena shell"
```

---

### Task 33: Boss framework — controller, projectiles, hazards, unwire turn-based

**Files:** Create `realtime/{BossController,ProjectileManager,ArenaHazardSystem}.ts` (+ pure helpers/tests where extractable). Modify: `realtime/BossArenaScene.ts` (controller integration, victory flow), `bossDefinitions/trainingDummy.ts` (exercise everything), `audio/sfx.ts` (§5 new cues), `scenes/PlatformLevelScene.ts` (boss door `D` → launch Arena for that level's boss; remove combat-controller launch + boss-intro dialogue trigger), `ui/Overlay.tsx` (stop mounting CombatPanel/TimedPrompt/TypingBox/BuffTray in gameplay), `scenes/controllerGates.ts` if door-gating logic lives there.

- BossController: consumes `stepBoss` commands → anims/movement/sfx/effects;
  runs `BossMechanics` (§4) with `MechanicsApi`; includes ONE documented no-op
  hook point (`onEncounterBeat(tag: string)`) as the future dialogue seam
  (brief: "clean technical seams… without rebuilding the encounters" —
  critique N-8); game-wide parryable flash
  signal; telegraph presentation hooks (tint/particles/`telegraph` sfx);
  `vulnerable` → weak-point glow + `expose` sfx.
- ProjectileManager: pooled sprites driven by ProjectileSystem specs; parryable
  projectiles reflectable (velocity mirror → `reflected` flag → boss/mechanic
  collision); full pool reset on scene restart.
- ArenaHazardSystem: ground shockwaves (jumpable, speed/height params), marked
  falling debris (target marker → delay → fall), laser/zone hazards; pooled +
  reset-safe.
- Victory: `defeated` → defeat anim → mark level complete via the existing save/
  overworld path (`bossesDefeated` += new id), return to Overworld. Verify the
  training dummy full loop in-browser: telegraphs, parry-reflect, shockwave,
  debris, victory→overworld, retry-on-death, replay. Confirm turn-based combat
  is unreachable (no code path launches it) while `combat/` files stay intact +
  tests green. Gates: tsc + vitest + build.

```bash
git add features/adventure && git commit -m "feat(adventure): boss controller, projectiles, hazards; realtime replaces turn-based flow"
```

---

### Task 34: World 1-1 — City of the Broken Crown (level)

**Files:** Create `art/sprites/tiles-city.ts` (city→temple tileset + parallax), `art/devtools/renderSprite.ts` (node CLI: sprite def → PPM → `sips` → PNG for visual inspection; used by all boss tasks). Replace content: `levels/level-1-1.ts`, `audio/tracks.ts` `level-1` melody (city-to-temple mood shift). Modify: `levels/parse.ts`+test only if new legend chars needed; `parse.test.ts` CONTENT row; overworld node label → `CITY OF THE BROKEN CROWN`; palette additive ramps (city blue-gray steel/glass + temple gold/red/jade — reuse existing chars first, add ≤ 8 new).

Map (~16×220, ≈4 min): city streets → rooftops → construction platforms (girders,
one-ways) → old district → gradual transition (buildings age, neon → lanterns,
stone paths, mountain parallax) → temple stairs → large temple door (`D`).
Three **Truth Seals** ON the critical path (auto-collect on overlap, glowing,
`seal` sfx, `rtSeals` pips beside the ActionBar): rooftop gap, old-district
alcove, temple stairway. Sparse enemies: ≤ 2 re-skinned patrol variants max, or
none. Playtest: full run TO AND THROUGH the boss door (the fight itself lands
in Task 35 — critique N-6), screenshots at each section, time recorded (target
≈4 min incl. boss retry buffer), CONTENT standability test green. Gates: tsc +
vitest.

```bash
git add features/adventure && git commit -m "feat(adventure): World 1-1 — City of the Broken Crown, city-to-temple ascent"
```

---

### Task 35: The Broken King + Truth mechanic

**Files:** Create `realtime/bossDefinitions/brokenKing.ts`, sprite in `art/sprites/bosses2.ts` (new file; ~48×72: ancient towering king, long white hair/beard, damaged crown, enormous sword in LEFT arm, missing right arm under cape; anims per §3 minimum incl. crown-crack, rage-aura, sword-drop, kneel). Modify: `realtime/arenas.ts` (temple arena: broken pillars, banners, cracked stone, throne, dust motes, light shaft, ceremonial bell), `audio/tracks.ts` (+`broken-king` theme), boss-door wiring for level 1-1.

Def (starting values): maxHp 24, contact 1, damageScale `{attack: 0.25, stomp: 0}`
(attrition possible but ~10× slower than Truth). Attacks — overhead strike
(tele 900, shockwave both ways 240px/s jumpable, dmg 2, unparryable, recovery
1500 → vulnerable), horizontal sweep (tele 650, parryable → stagger+vulnerable,
dmg 1), sword charge (tele 700, crosses arena; wall-hit → stagger 1500 →
vulnerable, dmg 1), falling blade waves (tele 800, 4 descending arcs one safe
gap, dmg 1, unparryable). Phase `royal-rage` ≤ 50% hp OR after first truth?—NO:
≤ 50% hp, tempoScale 0.75 + crown glow. **Truth mechanic** (mechanics module):
during any `vulnerableMs` window with the player within 40px, context action
`[ E REVEAL TRUTH ]`; holding E 900ms consumes one seal → `mechanic` event:
1 cracks the crown, 2 removes the rage aura (tempo back to 1.0), 3 drops the
sword → kneel → `forceDefeat`. Victory ends the fight regardless of hp; hp 0
also wins (kneel, no dialogue). Seals guaranteed = 3 (path-blocking pickups;
belt-and-suspenders: arena entry tops up to 3 silently). Distinct theme: heavy,
mournful, slow brass-like squares. Render all frames to PNG, inspect, iterate.
Playtest the full fight both ways (truth path, attrition sanity), retry-on-death,
screenshots each attack + each truth beat. Gates: tsc + vitest + build.

```bash
git add features/adventure && git commit -m "feat(adventure): The Broken King — temple duel with the Truth mechanic"
```

---

### Task 36: World 1-2 — The Buried Heart (level)

**Files:** Create `art/sprites/tiles-desert.ts` (dunes/ruins/excavation/caves +
parallax). Replace content: `levels/level-1-2.ts`, `level-2` track (desert wind
→ deep-earth pulse). Modify: parser+tests for new mechanics chars as needed;
CONTENT row; overworld label → `THE BURIED HEART`; palette additive (sand/dusk +
cave umber/deep blue, ≤ 8 new).

Map (~16×220, ≈4 min): dunes (sliding sand: gentle conveyor-style push reusing
factory conveyor logic) → ruined structures → sandstorm band (wind force +
reduced parallax visibility, `reduceFlash`-safe) → excavation site → sinkhole
drop (long safe fall with wall features) → caves (falling rocks at marked spots,
crumbling floors reusing collapse logic, sinking platforms, underground lift =
vertical mover, narrow jumps) → massive chamber approach → boss door. Playtest +
timing + screenshots. Gates: tsc + vitest.

```bash
git add features/adventure && git commit -m "feat(adventure): World 1-2 — The Buried Heart, desert descent into the deep"
```

---

### Task 37: The Hollow Giant + heart cycles

**Files:** Create `realtime/bossDefinitions/hollowGiant.ts`, sprites in
`bosses2.ts` (embedded colossus: torso ~128×96 background piece, separate hand
sprites ~40×24, glowing heart 20×20 with crack states ×3, mouth anim; chains/
roots into the cave). Modify: `arenas.ts` (chamber: stacked platforms flanking
the giant, anchor rocks, marked ceiling), `audio/tracks.ts` (+`hollow-giant`
— cavernous, slow, sub-heavy), level 1-2 boss wiring.

Structure: giant is background-anchored; hands enter the playfield. maxHp 9 ==
3 cycles × 3 heart-hits; body/hands `damageScale 0` — ONLY the heart hitbox
takes damage, and only while exposed. QUANTIZATION (critique SF-4): each
attack/stomp connect on the exposed heart emits exactly
`{kind:"hit", amount:1, source:"mechanic"}` (mechanic source: scale-exempt,
armor-piercing) so every cycle is exactly 3 contacts regardless of RT_PLAYER
attack/stomp damage values. Attacks: hand slam (tele 700 marked
column, hand lingers 2500ms as a PLATFORM, dmg 1), double slam (tele 1000 +
visible safe zone, hands linger 3000ms, dmg 2), mouth shockwave (tele 900,
horizontal wave, safe crouch-gap/behind-rock/dash-through, dmg 1), inhale
(tele 600, 2800ms pull 120px/s, mouth contact dmg 2, anchored platforms), heart
pulse (expanding rings while player climbs, dmg 1, jumpable), falling debris
(marked). Loop (mechanics module): after double slam → climb hand→arm→shoulder
(temporary anatomy platforms) → heart exposed (`expose` sfx, `[ E STRIKE
HEART ]`/attack/stomp all valid — attack or stomp each deal 1 heart-hit,
`heart-hit` sfx) → 3 hits → knockback blast, heart cracks + pulses faster →
next cycle faster (tempoScale 0.85/0.7). Cycle 3 ends with a big stomp beat →
collapse backward into darkness (defeat anim). PNG-inspect all pieces. Playtest
3 full cycles + timing. Gates: tsc + vitest.

```bash
git add features/adventure && git commit -m "feat(adventure): The Hollow Giant — climb the hands, break the heart"
```

---

### Task 38: World 1-3 — From the Coast to the Casino (level)

**Files:** Create `art/sprites/tiles-coast.ts` (hillside/tiled streets/ocean +
casino neon set + parallax). Replace content: `levels/level-1-3.ts`, `level-3`
track (sunny coastal → sleazy neon swing). Parser additions as needed (moving
elevator = vertical mover reuse; roulette platform = rotating/stepped mover;
security laser = timed beam reusing factory laser logic). CONTENT row;
overworld label → `COAST TO CASINO`; palette additive (terracotta/azulejo azure
+ neon purple/pink/gold, ≤ 10 new).

Map (~16×220, ≈4 min): colorful hillside → tiled streets/stairways → balconies/
alleys → coastal cliffs + tram-rail platforms → brightening signage transition →
entertainment district → casino floors (slot imagery, moving elevators,
roulette platforms, security lasers) → private-room door (`D`). Playtest +
timing + screenshots. Gates: tsc + vitest.

```bash
git add features/adventure && git commit -m "feat(adventure): World 1-3 — coastal town to casino city"
```

---

### Task 39: The One-Eyed Dealer + mask mechanic

**Files:** Create `realtime/bossDefinitions/oneEyedDealer.ts`, sprites in
`bosses2.ts` (~24×40 slim masked figure: full mask w/ single LED eye + devil
glyph, purple suit, handgun; mask as SEPARATE sprite w/ dropped state; anims
incl. teleport dissolve, mask-off freeze, mask-grab). Modify: `arenas.ts`
(private casino chamber: neon purple, card tables, glass platforms, rotating
sign hazard, metal reflect surfaces, 3 wall clasp symbols), `audio/tracks.ts`
(+`one-eyed-dealer` — cold electro-swing pulse), level 1-3 boss wiring.

maxHp 12; masked = `invulnerable`. Attacks: direct shot (laser-line tele 600,
bullet 340px/s, dmg 1), ricochet shot (bounce-path preview 700ms, 2 bounces,
dmg 1), triple shot (3 heights, dmg 1), teleport shot (dissolve 500ms →
reappear → direct shot), bullet rain (marked columns, dmg 1), pistol strike
(≤ 36px, tele 350, dmg 1 + pushback). Every 3rd–4th bullet **glows**
(parryable): parry → reflect → auto-arcs to the nearest intact clasp
(`mask-break` on clasp shatter). 3 clasps → mask falls: music ducks to silence,
Dealer freezes (no face beneath — dark void + LED eye), vulnerable 4s (player
attacks, full damage). Then he dashes to the mask, re-masks, clasps restore,
tempo +. At hp ≤ 4 (3rd unmasking): mask lies on the ground — walking/dashing
into it punts it (`[ E KICK MASK ]` context also punts); Dealer chases the mask
instead of shooting; land the finishing hits before he reaches it. PNG-inspect.
Playtest all attacks + 3 unmaskings + finish. Gates: tsc + vitest + build.

```bash
git add features/adventure && git commit -m "feat(adventure): The One-Eyed Dealer — parry the glow, break the mask"
```

---

### Task 40: World 1-4 part A — The Rain Kingdom + The Scythebound

**Files:** Create `art/sprites/tiles-rain.ts` (brick/iron/fog/rain set +
parallax w/ clock tower), `realtime/bossDefinitions/scythebound.ts` + sprite in
`bosses2.ts` (~28×36 shirtless long-haired scythe fighter; anims incl. spin,
leap, throw, stun, crash-through-wall). Replace content: `levels/level-1-4.ts`
FIRST HALF (England section → sealed courtyard; part B extends the same map or
a second map file — implementer's choice, documented), `level-4` track (rain +
bells, somber). Modify: rain particle overlay in PlatformLevelScene theme hook;
`arenas.ts` (courtyard arena w/ raised platforms + lockable gates);
`audio/tracks.ts` (+`scythebound` — driving percussion); overworld label →
`THE RAIN KINGDOM`; CONTENT row; palette additive (slate/brick/fog, ≤ 6 new).

Level part A (≈2.5–3 min of the world's 6): old streets → brick rooftops →
clock-tower jumps → iron fences/bridges → fog courtyard that SEALS on entry
(gate closes → mini-boss arena in-place via Arena launch). **Scythebound**: no
hp bar — objective `STOMPS: 0 / 15` (bottom objective slot; the brief's literal
`[ SPACE STOMP: 12 / 15 ]` action-slot form is equally acceptable — either
placement satisfies the brief, critique N-5). Grounded + not
spinning = stompable (head top-third, StompSystem); stomp → bounce + stun 900ms
+ counter++ + impact fx. Attacks: scythe sweep (tele 500, jump over, dmg 1),
overhead strike (leap + slam, recovery 1300 = the taught stomp window, dmg 1),
spinning scythe (moving spin 2200ms, unstompable, use platforms, dmg 1), high
leap (crosses player, backstrike; whiff recovery = stomp window), scythe throw
(curved boomerang, dmg 1; unarmed chase = contact dmg 1, still stompable).
Escalation by count: 1–5 tempo 1.0 (sweep+overhead only), 6–10 tempo 0.85
(+leap), 11–14 tempo 0.75 (+spin+throw), 15 = slow-mo cinematic stomp → he
crashes through the courtyard wall revealing the path. Unfairness guard: stun
grants full control + brief post-stun no-attack grace. PNG-inspect. Playtest to
15 with timing. Gates: tsc + vitest.

```bash
git add features/adventure && git commit -m "feat(adventure): Rain Kingdom streets and The Scythebound — fifteen stomps"
```

---

### Task 41: World 1-4 part B — Cathedral + The Veiled Archer

**Files:** Create cathedral tile additions in `tiles-rain.ts` (stained glass,
pillars, chandeliers, bell tower), `realtime/bossDefinitions/veiledArcher.ts` +
sprite in `bosses2.ts` (~20×32 hooded archer, longbow, spectral silver arrows;
weightless ledge-hop anims; dissolve-into-light). Extend `levels/level-1-4.ts`
part B (graveyard → ruined halls → rooftops → stained-glass chambers → bell
tower → central chamber door), `arenas.ts` (cathedral arena: 4–5 elevated
ledges, pillars w/ arrow SOCKETS, chandeliers, floor), `audio/tracks.ts`
(+`veiled-archer` — airy, high, sacred-eerie). CONTENT row.

maxHp 3 "catches" (melee phases). She holds elevated ledges, hops when
approached. Attacks: direct arrow (aim line 700, 380px/s, dmg 1), arrow rain
(floor target circles, 900ms delay, dmg 1), triple spread, piercing arrow (big
tele, passes through terrain, dmg 2), arrow trap (embedded floor arrows hazard
4s), backstep shot (proximity), cathedral volley (final phase, roaming).
**Embed mechanic:** pale-glow arrows that miss embed into wall/pillar sockets →
become platforms 6s (`expose` cue) → stair-step to her ledge. Reaching her →
vulnerable 2.5s → melee hits land (one catch per window) → she vanishes to
another ledge, tempo +. Parrying a glowing arrow staggers her 1.5s (alternate
opening). Third catch → she begins dissolving into light → hand off to Task
42's cutscene trigger. PNG-inspect. Playtest all 3 phases + world timing (part
A+B ≈ 6 min). Gates: tsc + vitest.

```bash
git add features/adventure && git commit -m "feat(adventure): the cathedral and The Veiled Archer — climb her arrows"
```

---

### Task 42: Absorption cutscene, unwinnable chase, castle unlock

**Files:** Create `realtime/cutscene.ts` (small scripted-sequence runner: timed
steps, input lock, camera moves — the reusable no-dialogue cutscene seam) +
swordsman sprite in `bosses2.ts` (~20×34 cloaked swordsman; walk, draw, slash,
absorb-glow, run; shares silhouette DNA with Task 44's Devil King). Modify:
`BossArenaScene`/archer def (post-defeat handoff), `levels/level-1-4.ts` or a
dedicated short chase map segment, `scenes/OverworldScene.ts` +
`overworldLogic.ts` (castle node transforms into the Rift Castle look; unlock on
1-4 completion; `CASTLE UNLOCKED` toast — allowed system message),
`state/save.ts` consumers if a `chaseSeen` flag is needed (additive).

Cutscene (all visual, zero text): Archer dissolving → quiet (music fades) →
swordsman walks in from the right, slow approach → draw → single slash through
her light → energy streams into him → brief transform flash (eyes/sword
crimson) → he bolts right. Control returns → **chase** (30–45s): scripted
rightward cathedral-escape corridor; he stays ahead at ~140% player speed
(rubber-banded so he is always visible, never catchable); at the exterior ledge
he leaps → dark rift opens (distortion: tint waves + shake (noShake-safe) +
particle vortex) → he vanishes → level ends → overworld: castle node morphs +
`CASTLE UNLOCKED` + castle selectable. Replay of 1-4 replays the full sequence.
Playtest: cutscene, chase pacing (timed 30–45s), unlock persistence across
reload. Gates: tsc + vitest.

```bash
git add features/adventure && git commit -m "feat(adventure): the absorption, the chase, and the castle unlocked"
```

---

### Task 43: The Rift Castle (level)

**Files:** Create `art/sprites/tiles-rift.ts` (void-crimson rift-castle set +
parallax: broken bridge, distorted geometry). Replace content:
`levels/castle.ts`, `castle` track (dread, corrupted echoes of earlier motifs).
Modify: hazard reuse wiring (evolved forms): sword-shockwave emitters (Broken
King), periodic giant hand slams (Hollow Giant), glow-bullet turret gates —
parry to open path (Dealer), scythe pendulum sweeps (Scythebound), arrow-rain
zones (Veiled Archer); overworld label → `THE RIFT CASTLE`; CONTENT row;
palette additive (void violet-black/crimson, ≤ 6 new).

Map (~16×200, ≈3 min pre-boss, brief-mandated): broken outer bridge → castle
walls → weapon halls (shockwaves) → collapsing rooms (crumbling floors) →
vertical tower (arrow rain + hand slams) → distorted chambers (mixed) → final
approach → **checkpoint directly outside the throne room** → throne door.
Strictly no gauntlet bloat. Playtest + timing. Gates: tsc + vitest + build.

```bash
git add features/adventure && git commit -m "feat(adventure): The Rift Castle — the swordsman's gauntlet"
```

---

### Task 44: The Devil King — Phase One: The Sword

**Files:** Create `realtime/bossDefinitions/devilKing.ts` + NEW human-scale
sprite in `bosses2.ts` (~24×40: the Task-42 swordsman unveiled — dark royal
armor, the same sword, absorbed-energy accents; full §3 anim set; the old
80×96 turn-based sprite stays dormant unless deliberately adapted). Modify:
`arenas.ts` (throne arena: dark throne chamber, rift sky), `audio/tracks.ts`
(+`devil-duel`), castle boss wiring, boss title card `THE DEVIL KING` (visual
only).

maxHp 100; phase 2 at ≤ 50 (Task 45). Duel attacks: quick slash (tele 350,
dmg 1, parryable), delayed slash (tele 900 with a 300ms feint hitch, dmg 1),
dash cut (tele 500, crosses arena, dmg 1, recovery = opening), air slash
(diagonal energy blade projectile, dmg 1), sword wave (ground projectile
300px/s, dmg 1, parryable-reflect), counter stance (1200ms glow — player
attacks during it are auto-countered for dmg 1; dash/stomp safe), three-hit
sequence (fast, fast, delayed heavy dmg 2 w/ big telegraph). Openings: parry →
stagger, dash-cut/three-hit recovery, dashing behind during delayed slash.
Fast, readable, duel-like; hit-stop + spark fx on every clean exchange.
PNG-inspect. Playtest to the 50% transition trigger. Gates: tsc + vitest.

```bash
git add features/adventure && git commit -m "feat(adventure): The Devil King phase one — a duel of swords"
```

---

### Task 45: The Devil King — Phase Two: The Arsenal

**Files:** Modify `realtime/bossDefinitions/devilKing.ts` (+ arsenal sprites/
anim rows in `bosses2.ts`: bow/spear/hammer materializations, transform burst),
`audio/tracks.ts` (+`devil-arsenal`; transition transforms the duel theme),
`realtime/ui/ActionBar.tsx` seal pips if not generic already.

At ≤ 50 hp: transformation burst (`weapon-swap` sfx, music → `devil-arsenal`),
weapon cycle Sword → Bow → Spear → Hammer (~15–18s each, visible weapon in
hand), then rapid mixed switching. Forms — Sword: phase-1 pool, parry-focused.
Bow (Archer's energy): direct arrow, arrow rain, spread shot, delayed explosive
arrow (dmg 2, big tele). Spear: forward thrust (long reach, dmg 1), upward
launch, spinning spear, planted spear → ground energy lines (jump over). Hammer:
overhead slam (dmg 2), ground shockwave, arena-cracking strike + falling debris,
delayed double slam; the 3rd hammer swing sticks in the floor ~2.5s. **Four
energy seals** (HUD pips): parry any sword attack · reflect-or-dash-through the
explosive arrow · jump the planted-spear energy line · stomp the stuck hammer.
Each correct handling shatters one seal (fx + `boss-hit`). All four → his
protection breaks (aura shatter, `expose`): vulnerable window ~6s, player deals
full damage through normal control; if the window lapses, the cycle resumes
faster with seals kept. Hp 0 → collapse + dissolve (defeat anim, no dialogue).
PNG-inspect. Playtest: full two-phase kill, each seal condition, retry.
Gates: tsc + vitest + build.

```bash
git add features/adventure && git commit -m "feat(adventure): The Devil King phase two — the stolen arsenal and four seals"
```

---

### Task 46: Ending — key, treasure room, chest, code

**Files:** Create `scenes/VictoryScene.ts` (throne aftermath), `scenes/ChestScene.ts`,
`services/codeService.ts` + test (verbatim interface from old Task 24: async
`getUnlockCode()` → `INK-7F2A`, `validate()`; swappable for a server
implementation), `ui/ChestPanel.tsx`. Modify: `game.ts` (register scenes),
`ui/Overlay.tsx` (ChestPanel mount), devil-defeat handoff, `state/save.ts`
consumers (`gameCompleted`, `codeReceived`), overworld archive path (existing
flag-driven node).

Sequence (no dialogue): weapons dissolve → silence → King dissolves → key drops
(bounce + glow + `key-drop`) → control returns → walk to key, press E →
`ARCHIVE KEY ACQUIRED` banner + `collect` → door opens behind the throne → walk
through → ChestScene treasure room → walk to chest, press E → chest opens
(`chest` sfx + track) → ChestPanel: `THE LOST KEY HAS BEEN RECOVERED` /
`ARCHIVE CODE` / code from `codeService` in giant pixel type; buttons
`COPY CODE` (clipboard, flips to `COPIED ✓` 2s), `RETURN TO THE ARCHIVE` →
`/gallery`, `RETURN TO OVERWORLD`. Persist completion flags; overworld shows
the archive path. Playtest: full ending from throne checkpoint, reload
persistence, clipboard. Gates: tsc + vitest + build.

```bash
git add features/adventure && git commit -m "feat(adventure): the key, the treasure room, and the archive code"
```

---

### Task 47: `/gallery` locked book + secret-door entry button

Old Tasks 25 + 26 executed as specified in the original plan (files, component
specs, ScrollFeed single-insertion rule, bundle checks all unchanged — read
those two task blocks in `2026-07-17-abrars-adventure.md` as the brief).
Gallery placeholder copy stays "the lost chapter will be restored here soon";
completion hint reads from the save. Gates: tsc + vitest + build (bundle table:
`/` unchanged).

```bash
git add app/gallery components app/globals.css && git commit -m "feat(gallery+home): locked archive book and the secret door in the feed"
```

---

### Task 48: Mobile controls, pause/settings/accessibility, debug menu

**Files:** Create `ui/VirtualControls.tsx`, `ui/PauseMenu.tsx`,
`ui/DebugMenu.tsx`. Modify: `ui/Overlay.tsx`, `AdventureApp.tsx` (fullscreen
toggle), `realtime/ui/ActionBar.tsx` (mobile transform: bar buttons become the
touch controls per the brief), `input/InputState.ts` consumers,
`state/save.ts`+`settings.ts` (`slowerHazards` additive), scene/system call
sites (apply widerParry ×1.3, slowerHazards ×0.8 projectile / ×1.25 hazard
timers, reduceFlash swaps flashes for steady outlines, noShake gates every
shake), `assistRT` wiring (per §6, silent).

Division of authority (critique N-1): `VirtualControls` owns movement (◀ ▶) +
JUMP + DASH; the ActionBar's mobile transform owns ATTACK / PARRY / E-context
buttons — both feed the single `InputState` sink, and no action may be bound in
both surfaces. Icon pass (critique SF-2, brief "use icons where possible"):
this task adds small pixel icons to every ActionBar slot (desktop + mobile),
keeping key labels as secondary text.
Virtual controls: ◀ ▶ + JUMP / ATTACK / DASH / PARRY / E clusters (pointer-id
multi-touch safe, `touch-action: none`); Pause (Escape/pause button): RESUME /
RESTART FROM CHECKPOINT / SETTINGS (volume, mute, 4 accessibility toggles,
live-applied + persisted) / QUIT TO MAP; all realtime timers freeze while
paused (machine receives dt 0). Debug menu behind `?debug=1` only: jump to any
world/arena, grant completion through world N, wipe save. Verify: devtools
mobile emulation walkthrough + toggles observably change behavior + pause-freeze
during a boss telegraph. Gates: tsc + vitest + build.

```bash
git add features/adventure && git commit -m "feat(adventure): mobile controls, pause and accessibility, debug menu"
```

---

### Task 49: Final verification & balance pass

- Gates: `npx tsc --noEmit` · `npm test` · `npm run build` (lint pre-existing
  failure noted, not a gate; no NEW lint regressions in changed files).
- The brief's **30-point completion criteria** ticked one-by-one via a full
  playthrough (record per-world times; tune boss hp/tempo/level length if the
  run exceeds 30 min — reduce hp before cutting content).
- Screenshot matrix: every world section, every boss + phase, the cutscene +
  chase, key pickup, chest, mobile layout, pause + restart behavior.
- Sweep for temporary hooks (teleport/damage/invincibility/dev flags) — none
  may remain; `?debug=1` menu and `?arena=` entry are shipped gated features
  and stay — record that ruling explicitly in the ledger against completion
  criterion #29 (critique N-2). Per critique N-7, the Task 48/49 review must
  verify the four accessibility toggles + silent assist against EVERY boss's
  bespoke flash/shake/projectile call-sites, not just the shared systems.
- Confirm zero active code paths into turn-based combat/dialogue; propose (do
  NOT execute) the deletion of dormant systems as a user decision recorded in
  the ledger.
- Ledger: final entry + minors triage from Tasks 31–48.

```bash
git add -A && git commit -m "polish(adventure): realtime rework final verification and balance"
```

---

## 8. Risks & watch-list

- **PlatformLevelScene growth:** it already carries five themes; new themes
  must keep using the established theme-hook pattern, not fork the scene.
- **Arena/level completion path:** reuse the T16/T17 completion + return flow;
  reviewers must trace resume/restart lifecycles (T14 lesson: verify on the
  REAL path, not scene-jump shortcuts).
- **Old tests as canaries:** dormant-system tests stay green; content-coupled
  tests (parse CONTENT, track schema, sprite integrity) are updated inside the
  task that replaces their content — never deleted wholesale.
- **Sprite scope:** six bosses × 8+ anim states is the art bottleneck; the
  PNG-inspect devtool (Task 34) is mandatory kit for every boss task.
- **Timing:** worlds are authored to length targets; Task 49 is the hard gate.
