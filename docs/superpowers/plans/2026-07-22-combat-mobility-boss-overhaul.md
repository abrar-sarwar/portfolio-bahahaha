# Combat, Mobility, and Boss Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared sword/ability runtime, replace Shift dash with running, redesign the four requested encounters, move the chase into the castle, and make all dangerous boss actions readable.

**Architecture:** Pure helpers in `playerAbilityLogic.ts` own ability availability, timing, damage, and HUD derivation. A Phaser-facing `PlayerAbilityController` owns transient movement/effects and exposes hit callbacks; `PlatformLevelScene` supplies enemy and damage boundaries, while `BossArenaScene` supplies boss events. Boss-specific movement stays in mechanics modules and shared telegraph/contact rules stay in the arena/controller layer.

**Tech Stack:** TypeScript 5.6, Phaser 3.90 Arcade Physics, React 19, Tailwind CSS, Vitest 3, Next.js 16.

## Global Constraints

- Shift is hold-to-run at 240 px/s; no discrete player dash remains.
- Base boss sword damage is 5 and ordinary-enemy sword damage is 3.
- R has two air charges that refill on landing.
- F lasts 240 ms, is invulnerable, deals 7 boss/4 enemy damage, and cools down for 2.4 seconds.
- Z lasts at most 1.35 seconds, deals 4 boss/3 enemy damage, stuns for 900 ms, and cools down for 3.6 seconds.
- Q lasts 30 seconds, is once per level run, grants immunity, multiplies speed by 1.6, and multiplies damage by 2.
- Passive boss-body overlap cannot damage the player.
- Existing saves remain compatible.

---

### Task 1: Pure Input, Movement, and Ability State

**Files:**
- Create: `features/adventure/realtime/playerAbilityLogic.ts`
- Create: `features/adventure/realtime/playerAbilityLogic.test.ts`
- Modify: `features/adventure/input/InputState.ts`
- Modify: `features/adventure/input/InputState.test.ts`
- Modify: `features/adventure/config.ts`
- Modify: `features/adventure/realtime/config.ts`
- Modify: `features/adventure/scenes/controllerGates.ts`
- Modify: `features/adventure/scenes/controllerGates.test.ts`

**Interfaces:**
- Produces: `AbilityRuntimeState`, `initialAbilityState()`, `stepAbilityState()`, `tryUseAbility()`, `playerDamageFor()`, `movementSpeedFor()`, and `isAbilityInvulnerable()`.
- Produces input fields `runHeld`, `grapplePressed`, `slashRushPressed`, `swordWavePressed`, and `ultimatePressed`.

- [ ] **Step 1: Write failing pure tests**

```ts
expect(movementSpeedFor(false, false)).toBe(150);
expect(movementSpeedFor(true, false)).toBe(240);
expect(tryUseAbility(initialAbilityState(), "grapple", 0).state.grappleCharges).toBe(1);
expect(stepAbilityState({ ...initialAbilityState(), grappleCharges: 0 }, { now: 100, grounded: true }).grappleCharges).toBe(2);
expect(tryUseAbility(initialAbilityState(), "ultimate", 0).state.ultimateEndsAt).toBe(30_000);
expect(tryUseAbility(tryUseAbility(initialAbilityState(), "ultimate", 0).state, "ultimate", 31_000).activated).toBe(false);
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- features/adventure/realtime/playerAbilityLogic.test.ts features/adventure/input/InputState.test.ts features/adventure/scenes/controllerGates.test.ts`

Expected: FAIL because the new module and input fields do not exist.

- [ ] **Step 3: Implement minimal pure state and held input wiring**

```ts
export type PlayerAbility = "grapple" | "slashRush" | "swordWave" | "ultimate";
export interface AbilityRuntimeState {
  grappleCharges: number;
  slashRushEndsAt: number;
  slashRushReadyAt: number;
  swordWaveReadyAt: number;
  ultimateEndsAt: number;
  ultimateSpent: boolean;
}
```

Map Shift keydown/up to `runHeld`; map R/F/Z/Q keydown edges to the four presses; consume only edge fields.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- features/adventure/realtime/playerAbilityLogic.test.ts features/adventure/input/InputState.test.ts features/adventure/scenes/controllerGates.test.ts`

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```bash
git add features/adventure/realtime/playerAbilityLogic.ts features/adventure/realtime/playerAbilityLogic.test.ts features/adventure/input/InputState.ts features/adventure/input/InputState.test.ts features/adventure/config.ts features/adventure/realtime/config.ts features/adventure/scenes/controllerGates.ts features/adventure/scenes/controllerGates.test.ts
git commit -m "feat(adventure): add player ability state and hold-to-run input"
```

### Task 2: Phaser Ability Controller and Enemy Stun

**Files:**
- Create: `features/adventure/realtime/PlayerAbilityController.ts`
- Create: `features/adventure/realtime/PlayerAbilityController.test.ts`
- Modify: `features/adventure/enemies/Enemy.ts`
- Create: `features/adventure/enemies/enemyStun.test.ts`

**Interfaces:**
- Consumes: Task 1 ability state and tuning constants.
- Produces: `PlayerAbilityController.update(now, grounded)`, `activate(name, now, facing)`, `bindTarget(target, handlers)`, `isInvulnerable(now)`, `speedMultiplier(now)`, `damageMultiplier(now)`, `snapshot(now)`, and `destroy()`.
- Produces: `Enemy.hitByAbility(damage, stunMs, hitId)`.

- [ ] **Step 1: Write failing tests for one-hit dedupe, immunity, cooldown snapshots, and enemy stun**

```ts
expect(controller.isInvulnerable(100)).toBe(false);
controller.activate("slashRush", 100, 1);
expect(controller.isInvulnerable(200)).toBe(true);
expect(controller.snapshot(200).slashRush.cooldownFrac).toBeGreaterThan(0);
enemy.hitByAbility(3, 900, 1);
expect(enemy.touchDamage).toBe(0);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- features/adventure/realtime/PlayerAbilityController.test.ts features/adventure/enemies/enemyStun.test.ts`

Expected: FAIL because controller and stun API do not exist.

- [ ] **Step 3: Implement the controller with persistent rush zone and pooled sword waves**

Use one disabled Arcade zone for F, one group of live wave sprites/zones for Z, and a per-activation numeric hit id. R sets velocity and draws a timed line. Q owns aura/trail objects and tint cleanup. Every timer/object is destroyed from `destroy()`.

- [ ] **Step 4: Implement generic enemy ability damage and stun**

Store `stunnedUntil`, prior touch damage, and the last ability-hit id. During stun, stop horizontal motion, show stars, and restore normal behavior after 900 ms. Death clears the stars.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- features/adventure/realtime/PlayerAbilityController.test.ts features/adventure/enemies/enemyStun.test.ts`

Expected: focused tests pass.

- [ ] **Step 6: Commit**

```bash
git add features/adventure/realtime/PlayerAbilityController.ts features/adventure/realtime/PlayerAbilityController.test.ts features/adventure/enemies/Enemy.ts features/adventure/enemies/enemyStun.test.ts
git commit -m "feat(adventure): add rift combat ability controller"
```

### Task 3: Level Combat Integration and Oversized Sword

**Files:**
- Modify: `features/adventure/scenes/PlatformLevelScene.ts`
- Modify: `features/adventure/enemies/Enemy.ts`
- Modify: `features/adventure/art/sprites/player.ts`
- Modify: `features/adventure/art/sprites/ending.test.ts`

**Interfaces:**
- Consumes: Task 2 controller.
- Produces: level attack/rush/wave target bindings, shared damage immunity boundary, run movement, ability route data, and sword visual synchronization.

- [ ] **Step 1: Write failing assertions for player sprite sword frames and level route state**

Add sprite tests that require `player-sword` idle/swing/wave animations and route tests that require `ultimateSpent` to survive a mid-boss handoff.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- features/adventure/art/sprites/ending.test.ts features/adventure/realtime/arenaFlow.test.ts`

Expected: FAIL on missing sword texture and route state.

- [ ] **Step 3: Integrate controller into create/update/shutdown**

Replace dash movement with `movementSpeedFor(snap.runHeld, demonActive)`. Capture R/F/Z/Q before input consumption. Bind F/Z to `enemyGroup`; make the base attack zone 30×24, apply 3 enemy damage, and make `takeDamage()` return while the ability controller is invulnerable.

- [ ] **Step 4: Add and synchronize the oversized sword sprite**

Register a 32×32 `player-sword` sheet. Follow player position/facing every frame; use idle/run pose normally, three-frame sweep for J, streak for F, and crescent frame for Z. Demon form tints the blade crimson-white.

- [ ] **Step 5: Run focused tests and TypeScript**

Run: `npm test -- features/adventure/art/sprites/ending.test.ts features/adventure/realtime/arenaFlow.test.ts && npx tsc --noEmit`

Expected: tests and compiler pass.

- [ ] **Step 6: Commit**

```bash
git add features/adventure/scenes/PlatformLevelScene.ts features/adventure/enemies/Enemy.ts features/adventure/art/sprites/player.ts features/adventure/art/sprites/ending.test.ts features/adventure/realtime/arenaFlow.ts features/adventure/realtime/arenaFlow.test.ts
git commit -m "feat(adventure): integrate heavy sword and abilities into levels"
```

### Task 4: Boss Arena Ability Integration and Contact Safety

**Files:**
- Modify: `features/adventure/realtime/PlayerCombatController.ts`
- Modify: `features/adventure/realtime/BossArenaScene.ts`
- Modify: `features/adventure/realtime/BossController.ts`
- Modify: `features/adventure/realtime/types.ts`
- Create: `features/adventure/realtime/bossContactLogic.ts`
- Create: `features/adventure/realtime/bossContactLogic.test.ts`

**Interfaces:**
- Consumes: shared ability controller from Task 2.
- Produces: `shouldDamageOnBossBodyContact(contact, hasCustomStompHook)` and boss ability events.
- Adds optional mechanics hook `onPlayerAbilityHit?(ability, damage, stunMs)` only where boss-specific behavior needs it.

- [ ] **Step 1: Write failing tests proving side/body contact is safe and stomps still resolve**

```ts
expect(shouldDamageOnBossBodyContact("side", false)).toBe(false);
expect(shouldDamageOnBossBodyContact("stomp", false)).toBe(true);
```

Also test that base sword damage is 5, successful parry clears commitment, and F/Q immunity suppresses arena damage.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- features/adventure/realtime/bossContactLogic.test.ts features/adventure/realtime/ParrySystem.test.ts features/adventure/realtime/config.test.ts`

Expected: FAIL on the missing contact helper and new tuning.

- [ ] **Step 3: Integrate boss targets**

Bind J to 5 damage, F to 7, and Z to 4 plus `{ kind: "force-stagger", ms: 900 }`. Apply Q’s damage multiplier before emitting machine hits. Use the shared controller as the sole F/Q immunity source.

- [ ] **Step 4: Remove passive body damage**

Side overlap does nothing. Valid downward stomp still bounces and emits stomp damage; a boss-specific hook may reject the stomp without turning an ordinary side overlap into damage.

- [ ] **Step 5: Strengthen the shared parry tell**

BossController creates and destroys a gold halo plus final-telegraph pulse for parryable attacks; red remains for others. Cancel the halo on attack end, stagger, phase, defeat, and destroy.

- [ ] **Step 6: Run focused tests and TypeScript**

Run: `npm test -- features/adventure/realtime/bossContactLogic.test.ts features/adventure/realtime/ParrySystem.test.ts features/adventure/realtime/config.test.ts && npx tsc --noEmit`

Expected: tests and compiler pass.

- [ ] **Step 7: Commit**

```bash
git add features/adventure/realtime/PlayerCombatController.ts features/adventure/realtime/BossArenaScene.ts features/adventure/realtime/BossController.ts features/adventure/realtime/types.ts features/adventure/realtime/bossContactLogic.ts features/adventure/realtime/bossContactLogic.test.ts
git commit -m "feat(adventure): unify arena abilities and safe boss contact"
```

### Task 5: Ability HUD and Touch Controls

**Files:**
- Modify: `features/adventure/bridge/GameStore.ts`
- Modify: `features/adventure/bridge/GameStore.test.ts`
- Modify: `features/adventure/realtime/ui/ActionBar.tsx`
- Modify: `features/adventure/realtime/ui/actionBarMath.ts`
- Modify: `features/adventure/realtime/ui/actionBarMath.test.ts`
- Modify: `features/adventure/ui/Hud.tsx`
- Modify: `features/adventure/ui/VirtualControls.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces `RtAbilitiesState` with R charges, F/Z cooldown fraction, and Q ready/active/remaining/spent state.

- [ ] **Step 1: Write failing store/math tests for stable ability snapshots and Q fill labels**

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- features/adventure/bridge/GameStore.test.ts features/adventure/realtime/ui/actionBarMath.test.ts`

Expected: FAIL on missing ability state.

- [ ] **Step 3: Add the crimson demon-seal HUD and compact desktop slots**

Render R `2/2`, F/Z cooldown fills, Q `READY`/time/`SPENT`, and Shift `RUN`. Add a segmented horn-ended seal below hearts with `aria-label` state text.

- [ ] **Step 4: Update touch layout**

Replace DASH with a held RUN button. Add R/F/Z/Q buttons in a compact second action row with 44 px minimum targets and correct pointer release cleanup.

- [ ] **Step 5: Run focused tests and TypeScript**

Run: `npm test -- features/adventure/bridge/GameStore.test.ts features/adventure/realtime/ui/actionBarMath.test.ts && npx tsc --noEmit`

Expected: tests and compiler pass.

- [ ] **Step 6: Commit**

```bash
git add features/adventure/bridge/GameStore.ts features/adventure/bridge/GameStore.test.ts features/adventure/realtime/ui/ActionBar.tsx features/adventure/realtime/ui/actionBarMath.ts features/adventure/realtime/ui/actionBarMath.test.ts features/adventure/ui/Hud.tsx features/adventure/ui/VirtualControls.tsx app/globals.css
git commit -m "feat(adventure): add demon seal ability HUD"
```

### Task 6: Dealer and Scythebound Rebalance

**Files:**
- Modify: `features/adventure/realtime/bossDefinitions/oneEyedDealer.ts`
- Modify: `features/adventure/realtime/bossDefinitions/oneEyedDealer.test.ts`
- Modify: `features/adventure/realtime/bossDefinitions/scythebound.ts`
- Create: `features/adventure/realtime/bossDefinitions/scythebound.test.ts`
- Modify: `features/adventure/realtime/bossDefinitions/index.test.ts`
- Modify: `features/adventure/realtime/arenas.ts`
- Modify: `features/adventure/realtime/arenas.test.ts`

**Interfaces:**
- Produces pure `dealerMoveTarget()` and `scytheMoveTarget()` helpers for deterministic movement tests.

- [ ] **Step 1: Write failing tuning and movement tests**

Require Dealer speed 190, gold warning timing, safe arena clamp, Scythebound HP 55, visible health bar, normal damage scale, and HP phases.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- features/adventure/realtime/bossDefinitions/oneEyedDealer.test.ts features/adventure/realtime/bossDefinitions/scythebound.test.ts features/adventure/realtime/bossDefinitions/index.test.ts features/adventure/realtime/arenas.test.ts`

Expected: FAIL against current 240 speed and stomp-only Scythebound.

- [ ] **Step 3: Implement Dealer strafe and parry-shot warning**

Move during idle/recovery, clamp 48–720, create a gold reticle/muzzle pulse for a glowing shot, and clean it on all command exits.

- [ ] **Step 4: Replace Scythebound stomp counter with HP combat**

Set 55 HP, remove hidden bar/invulnerability/scales/counter, use phases at 65% and 30%, and add assertive idle/recovery movement. Preserve sweep, overhead, leap, spin, and throw with wall-clamped targets.

- [ ] **Step 5: Simplify courtyard geometry and run focused tests**

Run the command from Step 2 and expect all tests to pass.

- [ ] **Step 6: Commit**

```bash
git add features/adventure/realtime/bossDefinitions/oneEyedDealer.ts features/adventure/realtime/bossDefinitions/oneEyedDealer.test.ts features/adventure/realtime/bossDefinitions/scythebound.ts features/adventure/realtime/bossDefinitions/scythebound.test.ts features/adventure/realtime/bossDefinitions/index.test.ts features/adventure/realtime/arenas.ts features/adventure/realtime/arenas.test.ts
git commit -m "feat(adventure): make dealer and scythebound mobile fair fights"
```

### Task 7: Archer Arena and Free-Movement Fight

**Files:**
- Modify: `features/adventure/realtime/bossDefinitions/veiledArcher.ts`
- Create: `features/adventure/realtime/bossDefinitions/veiledArcher.test.ts`
- Modify: `features/adventure/realtime/bossDefinitions/index.test.ts`
- Modify: `features/adventure/realtime/arenas.ts`
- Modify: `features/adventure/realtime/arenas.test.ts`

**Interfaces:**
- Produces `chooseArcherPerch(playerX, bossX, arenaWidth)` and a normal 35-HP boss definition.

- [ ] **Step 1: Write failing tests for open geometry, normal damage, and farthest-perch relocation**

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- features/adventure/realtime/bossDefinitions/veiledArcher.test.ts features/adventure/realtime/bossDefinitions/index.test.ts features/adventure/realtime/arenas.test.ts`

Expected: FAIL against pillar/catch mechanics.

- [ ] **Step 3: Replace catch armor with normal HP and hit relocation**

Remove arrow stairs, catch count, and baseline invulnerability. Keep glowing arrows as reflectable stagger shots. On a connected player hit, move to the farthest safe perch after a 180 ms vanish tell.

- [ ] **Step 4: Replace cathedral with a 34-tile open nave**

Use a flat floor and two low one-way side ledges with no tall columns.

- [ ] **Step 5: Run focused tests and commit**

Run the command from Step 2 and expect all tests to pass.

```bash
git add features/adventure/realtime/bossDefinitions/veiledArcher.ts features/adventure/realtime/bossDefinitions/veiledArcher.test.ts features/adventure/realtime/bossDefinitions/index.test.ts features/adventure/realtime/arenas.ts features/adventure/realtime/arenas.test.ts
git commit -m "feat(adventure): rebuild archer as an open arena duel"
```

### Task 8: Move and Upgrade the Castle Chase

**Files:**
- Create: `features/adventure/scenes/chaseLogic.ts`
- Create: `features/adventure/scenes/chaseLogic.test.ts`
- Modify: `features/adventure/scenes/ChaseScene.ts`
- Modify: `features/adventure/realtime/BossArenaScene.ts`
- Modify: `features/adventure/realtime/arenaFlow.ts`
- Modify: `features/adventure/realtime/arenaFlow.test.ts`
- Modify: `features/adventure/scenes/PlatformLevelScene.ts`
- Modify: `features/adventure/levels/castle.ts`

**Interfaces:**
- Produces `nextChaseAttack()`, `chaseWaveIsParryable()`, and castle route data `{ chaseCleared?: boolean }`.

- [ ] **Step 1: Write failing route and attack-cadence tests**

Require Archer victory to complete 1-4 and route to Overworld, a fresh castle entry to route through Chase, and attack cadence to preserve a minimum 1.4-second safe gap.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- features/adventure/scenes/chaseLogic.test.ts features/adventure/realtime/arenaFlow.test.ts`

Expected: FAIL because Archer currently starts Chase immediately.

- [ ] **Step 3: Move the chase to castle entry**

Archer aftermath persists the boss defeat, completes 1-4, and unlocks castle. Castle entry starts Chase; chase completion starts `Level` with a castle checkpoint and `chaseCleared: true`.

- [ ] **Step 4: Replace chase map and add runner attacks**

Use castle theme/decor, gates, low hazards, and collapsing bridges. Add telegraphed low sword waves that can be jumped or parried, later paired with safe spacing. Damage costs one heart and temporarily reduces run speed.

- [ ] **Step 5: Run focused tests and TypeScript**

Run: `npm test -- features/adventure/scenes/chaseLogic.test.ts features/adventure/realtime/arenaFlow.test.ts && npx tsc --noEmit`

Expected: tests and compiler pass.

- [ ] **Step 6: Commit**

```bash
git add features/adventure/scenes/chaseLogic.ts features/adventure/scenes/chaseLogic.test.ts features/adventure/scenes/ChaseScene.ts features/adventure/realtime/BossArenaScene.ts features/adventure/realtime/arenaFlow.ts features/adventure/realtime/arenaFlow.test.ts features/adventure/scenes/PlatformLevelScene.ts features/adventure/levels/castle.ts
git commit -m "feat(adventure): move the swordsman chase inside the castle"
```

### Task 9: Devil King Telegraph and Spacing Pass

**Files:**
- Modify: `features/adventure/realtime/bossDefinitions/devilKing.ts`
- Modify: `features/adventure/realtime/bossDefinitions/devilKingLogic.ts`
- Modify: `features/adventure/realtime/bossDefinitions/devilKingLogic.test.ts`

**Interfaces:**
- Produces `devilDuelTargetX()` and `devilBladePreview()`.

- [ ] **Step 1: Write failing tests for warning floors, duel spacing, and blade preview geometry**

Require every parryable Devil attack to have at least 620 ms telegraph, movement target distance 90–170 px, and preview width to match active shape width.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- features/adventure/realtime/bossDefinitions/devilKingLogic.test.ts features/adventure/realtime/bossDefinitions/index.test.ts`

Expected: FAIL on the 360/470 ms attacks and missing spacing helpers.

- [ ] **Step 3: Implement spacing and directional previews**

Move only in idle/recovery, clamp to arena, and cancel movement on attack/stagger/phase/defeat. Draw gold/red directional blade lines during telegraphs and clear them on every exit.

- [ ] **Step 4: Align timings and hitboxes**

Raise quick slash and spear thrust warnings to 620 ms. Ensure melee hitbox widths/offsets match previews and projectile attacks suppress the generic melee zone.

- [ ] **Step 5: Run focused tests and commit**

Run the command from Step 2 and expect all tests to pass.

```bash
git add features/adventure/realtime/bossDefinitions/devilKing.ts features/adventure/realtime/bossDefinitions/devilKingLogic.ts features/adventure/realtime/bossDefinitions/devilKingLogic.test.ts
git commit -m "feat(adventure): make devil king attacks readable at range"
```

### Task 10: Full Verification and Visual Critique

**Files:**
- Modify only files required by failures discovered during verification.

**Interfaces:**
- Consumes the complete overhaul.
- Produces verified build and a requirement-by-requirement evidence checklist.

- [ ] **Step 1: Run complete automated verification**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`

Expected: all commands exit 0 with no test failures or TypeScript errors.

- [ ] **Step 2: Run browser playtest flows**

Verify Level keyboard controls, touch controls at a coarse-pointer viewport, R twice then landing refill, F immunity/damage, Z stun, Q 30-second lifecycle, Dealer glow shot, Scythe HP fight, open Archer arena, Archer-to-Overworld routing, castle chase attacks, and Devil close/ranged parries.

- [ ] **Step 3: Critique the visuals**

Check sword silhouette, ability readability, demon-seal meter, reduced-flash behavior, HUD overlap at 320 px width, and effect cleanup after scene transitions. Remove any decorative effect that obscures attack timing.

- [ ] **Step 4: Re-run complete automated verification after fixes**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 5: Commit final verification fixes**

```bash
git add -A
git commit -m "fix(adventure): finish combat overhaul verification"
```
