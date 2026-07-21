// features/adventure/realtime/BossStateMachine.ts
//
// The PURE reducer at the heart of the real-time boss framework. Given a boss
// definition, the current machine state, and a fixed-step input (dt, positions,
// events, seeded rng), it returns the next state and a list of commands for the
// Phaser-side BossController (Task 33) to present.
//
// Purity contract: same (def, state, input) with the same rng sequence → the
// same output. No Date.now, no globals, no mutation of the inputs.
//
// FSM:  spawn → idle → telegraph(×tempo) → attack → recovery(×tempo) → idle
//       parried/wall-hit → stagger (interrupts, opens the vulnerable window)
//       hp crosses a phase threshold → transition (fixed) → idle in new phase
//       hp ≤ 0 OR force-defeat mechanic → defeated (absorbing)
import { RT_ANIM, RT_MECHANIC, RT_TUNING } from "./config";
import { scaleBossDamage } from "./DamageSystem";
import type {
  BossMachineState,
  MachineCommand,
  RtAttackSpec,
  RtBossDef,
  RtPhaseSpec,
  StepInput,
} from "./types";

export function initBossState(def: RtBossDef): BossMachineState {
  return {
    hp: def.maxHp,
    phaseIndex: 0,
    fsm: "spawn",
    msInState: 0,
    currentAttackId: null,
    cooldowns: {},
    vulnerableMs: 0,
    invulnerable: def.invulnerableBaseline ?? false,
  };
}

export interface StepResult {
  state: BossMachineState;
  commands: MachineCommand[];
}

export function stepBoss(def: RtBossDef, s: BossMachineState, input: StepInput): StepResult {
  // Defeated is absorbing: no state change, no commands, ever.
  if (s.fsm === "defeated") return { state: s, commands: [] };

  const commands: MachineCommand[] = [];
  const state: BossMachineState = { ...s, cooldowns: { ...s.cooldowns } };

  // 1) Timers that advance every step, regardless of fsm.
  state.cooldowns = tickCooldowns(state.cooldowns, input.dt);
  if (state.vulnerableMs > 0) state.vulnerableMs = Math.max(0, state.vulnerableMs - input.dt);

  // 2) Resolve this step's events.
  const curAttack = state.currentAttackId ? attackOf(def, state.currentAttackId) : undefined;
  const inParryPhase = state.fsm === "telegraph" || state.fsm === "attack";
  let forceDefeat = false;
  let staggerRequested = false;
  let tookDamage = false;
  let forcedPhase: { phaseIndex: number; lock?: boolean } | null = null;
  let forcedStaggerMs: number | null = null;

  for (const e of input.events) {
    switch (e.kind) {
      case "mechanic":
        if (e.id === RT_MECHANIC.forceDefeat) forceDefeat = true;
        break;
      case "hit":
        if (applyHit(state, e.amount, e.source, def) > 0) tookDamage = true;
        break;
      case "parried":
        if (inParryPhase && curAttack?.parryable) staggerRequested = true;
        break;
      case "wall-hit":
        if (inParryPhase) staggerRequested = true;
        break;
      // Task 33 mechanics-driven events (last-wins within a step):
      case "force-phase":
        forcedPhase = { phaseIndex: e.phaseIndex, lock: e.lock };
        break;
      case "force-stagger":
        forcedStaggerMs = e.ms;
        break;
      case "set-invulnerable":
        state.invulnerable = e.value;
        break;
      case "set-tempo":
        state.tempoOverride = e.scale;
        break;
    }
  }

  // 3) Defeat (scripted finish or hp depleted) has top priority and absorbs.
  if (forceDefeat || state.hp <= 0) {
    state.hp = Math.max(0, state.hp);
    state.fsm = "defeated";
    state.msInState = 0;
    state.currentAttackId = null;
    state.vulnerableMs = 0;
    return {
      state,
      commands: [{ kind: "defeated" }, { kind: "anim", anim: RT_ANIM.defeat }],
    };
  }

  // 4) Phase crossing — outranks a same-step stagger. A mechanics-forced phase
  //    (stomp tiers, catches, weapon timers) outranks the hp-driven crossing;
  //    hp-driven deepening is suppressed entirely once a lock is set.
  if (forcedPhase) {
    const idx = Math.max(0, Math.min(def.phases.length - 1, forcedPhase.phaseIndex));
    state.phaseIndex = idx;
    if (forcedPhase.lock) state.phaseLocked = true;
    state.fsm = "transition";
    state.msInState = 0;
    state.currentAttackId = null;
    state.vulnerableMs = 0;
    commands.push({ kind: "phase", phaseIndex: idx }, { kind: "anim", anim: RT_ANIM.transition });
    return { state, commands };
  }
  const deepest = deepestPhase(def, state.hp);
  if (!state.phaseLocked && deepest > state.phaseIndex && state.fsm !== "transition") {
    state.phaseIndex = deepest;
    state.fsm = "transition";
    state.msInState = 0;
    state.currentAttackId = null;
    state.vulnerableMs = 0;
    commands.push({ kind: "phase", phaseIndex: deepest }, { kind: "anim", anim: RT_ANIM.transition });
    return { state, commands };
  }

  // 5) Stagger interrupts the in-progress attack and opens the vulnerable window.
  //    A mechanics-forced stagger (catch window, unmask freeze, stomp stun,
  //    seal shatter) fires from ANY state and carries its own duration; its
  //    exit is keyed on vulnerableMs draining (see progress "stagger").
  if (forcedStaggerMs !== null) {
    state.fsm = "stagger";
    state.msInState = 0;
    state.currentAttackId = null; // scripted stagger — no attack to recover from
    state.vulnerableMs = forcedStaggerMs;
    commands.push(
      { kind: "stagger" },
      { kind: "vulnerable", ms: forcedStaggerMs },
      { kind: "anim", anim: RT_ANIM.stagger },
    );
    return { state, commands };
  }
  if (staggerRequested) {
    const dur = curAttack?.recoveryMs ?? RT_TUNING.transitionMs;
    state.fsm = "stagger";
    state.msInState = 0;
    state.vulnerableMs = dur; // currentAttackId kept so stagger length is recoverable
    commands.push(
      { kind: "stagger" },
      { kind: "vulnerable", ms: dur },
      { kind: "anim", anim: RT_ANIM.stagger },
    );
    return { state, commands };
  }

  // 6) A landed hit that changed nothing structural is a transient damage flash.
  if (tookDamage) commands.push({ kind: "anim", anim: RT_ANIM.damage });

  // 7) Timed FSM progression.
  state.msInState += input.dt;
  progress(def, state, input, commands);
  return { state, commands };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function attackOf(def: RtBossDef, id: string): RtAttackSpec | undefined {
  return def.attacks.find((a) => a.id === id);
}

function phaseOf(def: RtBossDef, i: number): RtPhaseSpec {
  return def.phases[i] ?? def.phases[0];
}

function tempo(phase: RtPhaseSpec, state: BossMachineState): number {
  return state.tempoOverride ?? phase.tempoScale ?? 1;
}

function tickCooldowns(cds: Record<string, number>, dt: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id in cds) {
    const next = cds[id] - dt;
    if (next > 0) out[id] = next; // expired cooldowns drop out (absence = ready)
  }
  return out;
}

/** Deepest phase whose enterBelowHpFrac threshold the current hp has crossed. */
function deepestPhase(def: RtBossDef, hp: number): number {
  const frac = hp / def.maxHp;
  let idx = 0;
  for (let i = 0; i < def.phases.length; i++) {
    const t = def.phases[i].enterBelowHpFrac;
    if (t !== undefined && frac < t) idx = i;
  }
  return idx;
}

/** Apply one hit to the boss's hp, returning the damage actually dealt. */
function applyHit(
  state: BossMachineState,
  amount: number,
  source: "attack" | "stomp" | "mechanic",
  def: RtBossDef,
): number {
  // Mechanic hits always land; normal hits are ignored while mechanic-armored.
  if (source !== "mechanic" && state.invulnerable) return 0;
  const dmg = scaleBossDamage(amount, source, def.damageScale);
  if (dmg <= 0) return 0;
  state.hp = Math.max(0, state.hp - dmg);
  return dmg;
}

/** Weighted, cooldown- and range-filtered attack pick. Consumes rng only when a
 *  candidate exists (so idle steps with nothing to do are rng-neutral). */
function selectAttack(def: RtBossDef, state: BossMachineState, input: StepInput): RtAttackSpec | null {
  const phase = phaseOf(def, state.phaseIndex);
  const dist = Math.abs(input.playerX - input.bossX);
  const candidates: RtAttackSpec[] = [];
  for (const id of phase.attackIds) {
    const a = attackOf(def, id);
    if (!a) continue;
    if ((state.cooldowns[id] ?? 0) > 0) continue; // still cooling down
    if (dist < (a.minRangePx ?? 0) || dist > (a.maxRangePx ?? Infinity)) continue; // range gate
    candidates.push(a);
  }
  if (candidates.length === 0) return null;

  const total = candidates.reduce((sum, a) => sum + (a.weight ?? 1), 0);
  let roll = input.rng() * total;
  for (const a of candidates) {
    roll -= a.weight ?? 1;
    if (roll < 0) return a;
  }
  return candidates[candidates.length - 1];
}

function progress(def: RtBossDef, state: BossMachineState, input: StepInput, commands: MachineCommand[]): void {
  const phase = phaseOf(def, state.phaseIndex);
  switch (state.fsm) {
    case "spawn":
      if (state.msInState >= RT_TUNING.spawnMs) enterIdle(state, commands);
      break;

    case "idle": {
      const atk = selectAttack(def, state, input);
      if (atk) enterTelegraph(state, atk, commands);
      break;
    }

    case "telegraph": {
      const atk = attackOf(def, state.currentAttackId ?? "");
      if (atk && state.msInState >= atk.telegraphMs * tempo(phase, state)) enterAttack(state, atk, commands);
      break;
    }

    case "attack": {
      const atk = attackOf(def, state.currentAttackId ?? "");
      if (atk && state.msInState >= atk.activeMs) {
        enterRecovery(state, atk, phase, input, commands); // activeMs never scaled
      }
      break;
    }

    case "recovery": {
      const atk = attackOf(def, state.currentAttackId ?? "");
      const dur = (atk?.recoveryMs ?? 0) * tempo(phase, state) * (input.recoveryScale ?? 1);
      if (state.msInState >= dur) {
        state.vulnerableMs = 0;
        state.currentAttackId = null;
        enterIdle(state, commands);
      }
      break;
    }

    case "stagger": {
      // A scripted stagger (force-stagger: no attack attached) holds until its
      // vulnerable window drains; an attack-born stagger holds recoveryMs.
      const atk = attackOf(def, state.currentAttackId ?? "");
      const done = atk
        ? state.msInState >= atk.recoveryMs // unscaled — a punish window
        : state.vulnerableMs <= 0;
      if (done) {
        state.vulnerableMs = 0;
        state.currentAttackId = null;
        enterIdle(state, commands);
      }
      break;
    }

    case "transition":
      if (state.msInState >= RT_TUNING.transitionMs) enterIdle(state, commands);
      break;
  }
}

function enterIdle(state: BossMachineState, commands: MachineCommand[]): void {
  state.fsm = "idle";
  state.msInState = 0;
  commands.push({ kind: "anim", anim: RT_ANIM.idle });
}

function enterTelegraph(state: BossMachineState, atk: RtAttackSpec, commands: MachineCommand[]): void {
  state.fsm = "telegraph";
  state.msInState = 0;
  state.currentAttackId = atk.id;
  state.cooldowns = { ...state.cooldowns, [atk.id]: atk.cooldownMs ?? 0 };
  commands.push({ kind: "attack-start", attackId: atk.id }, { kind: "anim", anim: RT_ANIM.telegraph });
}

function enterAttack(state: BossMachineState, atk: RtAttackSpec, commands: MachineCommand[]): void {
  state.fsm = "attack";
  state.msInState = 0;
  commands.push({ kind: "attack-active", attackId: atk.id }, { kind: "anim", anim: RT_ANIM.attack });
}

function enterRecovery(
  state: BossMachineState,
  atk: RtAttackSpec,
  phase: RtPhaseSpec,
  input: StepInput,
  commands: MachineCommand[],
): void {
  state.fsm = "recovery";
  state.msInState = 0;
  const dur = atk.recoveryMs * tempo(phase, state) * (input.recoveryScale ?? 1);
  state.vulnerableMs = dur; // recovery IS the punish/weakness window
  commands.push(
    { kind: "attack-end", attackId: atk.id },
    { kind: "vulnerable", ms: dur },
    { kind: "anim", anim: RT_ANIM.recovery },
  );
}

// ── def validation (called at registration by later tasks) ───────────────────

/**
 * Validate a boss definition, throwing on the first structural error. Called
 * once at registration (Tasks 32+). Enforces the invariants the runtime relies
 * on: heavy (2-heart) attacks are telegraphed for ≥ 700ms, every phase attackId
 * resolves, phase thresholds strictly decrease, weights are positive.
 */
export function validateDef(def: RtBossDef): void {
  if (def.maxHp <= 0) throw new Error(`[${def.id}] maxHp must be > 0`);
  if (def.phases.length === 0) throw new Error(`[${def.id}] needs at least one phase`);

  const known = new Set(def.attacks.map((a) => a.id));
  for (const a of def.attacks) {
    if (a.telegraphMs < 0 || a.activeMs < 0 || a.recoveryMs < 0) {
      throw new Error(`[${def.id}] attack ${a.id} has negative timing`);
    }
    if (a.weight !== undefined && a.weight <= 0) {
      throw new Error(`[${def.id}] attack ${a.id} weight must be > 0`);
    }
    if (a.damage === 2 && a.telegraphMs < 700) {
      throw new Error(
        `[${def.id}] heavy attack ${a.id} needs telegraphMs >= 700 (got ${a.telegraphMs})`,
      );
    }
  }

  let prevFrac = Infinity;
  for (const p of def.phases) {
    for (const id of p.attackIds) {
      if (!known.has(id)) throw new Error(`[${def.id}] phase ${p.id} references unknown attack ${id}`);
    }
    if (p.tempoScale !== undefined && p.tempoScale <= 0) {
      throw new Error(`[${def.id}] phase ${p.id} tempoScale must be > 0`);
    }
    if (p.enterBelowHpFrac !== undefined) {
      if (p.enterBelowHpFrac <= 0 || p.enterBelowHpFrac > 1) {
        throw new Error(`[${def.id}] phase ${p.id} enterBelowHpFrac must be in (0, 1]`);
      }
      if (p.enterBelowHpFrac >= prevFrac) {
        throw new Error(`[${def.id}] phase enterBelowHpFrac must strictly decrease`);
      }
      prevFrac = p.enterBelowHpFrac;
    }
  }
}
