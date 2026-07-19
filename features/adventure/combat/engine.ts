// features/adventure/combat/engine.ts
// Pure, deterministic turn-based combat reducer. Every boss runs on this engine.
// No mutation: every transition returns fresh objects. Illegal events are no-ops
// that return the SAME state reference.
import { nextRand } from "./rng";
import { TYPING_DAMAGE_MULT, typingTimeLimitMs } from "./typing";
import type { TypingGrade } from "./typing";
import { applyItem } from "./buffs";
import { assistLevelFor, assistTimeScale, assistStartHeal } from "./assist";
import { scaleQte } from "./timedEvents";
import type { QteSpec } from "./timedEvents";
import type { BuffId } from "../ids";
import type {
  ActiveEffects,
  BossDefinition,
  BossMove,
  BossPhase,
  CombatEvent,
  CombatState,
  MechanicState,
  PlayerCombat,
} from "./types";

const SEQ_ORDER = ["analyze", "defend", "remember", "create"] as const;
const FINAL_ORDER = ["analyze", "parry", "command", "root-access", "strike"] as const;

// Buffs that auto-apply on combat entry vs. those that sit in the item pouch.
const PASSIVE_BUFFS: BuffId[] = [
  "attack-byte", "firewall-layer", "focus-chip", "parry-module", "exploit-insight",
];
const CONSUMABLE_BUFFS: BuffId[] = ["recovery-packet", "root-access"];

// ─────────────────────────────────────────────────────────── createCombat ──

export function createCombat(
  def: BossDefinition,
  carry: {
    levelBuffs: BuffId[];
    deathsOnBoss: number;
    abilities: { improvedParry: boolean };
    maxHealth: number;
    attack: number;
    parryWindowMs: number;
    perfectParryMs: number;
    typingPower: number;
  },
): CombatState {
  let player: PlayerCombat = {
    health: carry.maxHealth,
    maxHealth: carry.maxHealth,
    attack: carry.attack,
    parryWindowMs: carry.parryWindowMs,
    perfectParryMs: carry.perfectParryMs,
    typingPower: carry.typingPower,
    improvedParry: carry.abilities.improvedParry,
  };
  let fx: ActiveEffects = {
    attackBonus: 0, firewallLayers: 0, focusChips: 0, parryModules: 0,
    exploitInsight: false, defending: false, stance: false, analyzed: false,
    rootAccessCharges: 0,
  };
  const log: string[] = [...def.intro];

  // Assist: quiet difficulty curve driven by deaths on this boss.
  const level = assistLevelFor(carry.deathsOnBoss);
  const assistScale = assistTimeScale(level);
  const startHeal = assistStartHeal(level);
  if (startHeal > 0) {
    // The player always starts full, so a plain heal was provably inert. The
    // quiet aid is BONUS max health (extra hearts) for this attempt: add to both.
    player = {
      ...player,
      maxHealth: player.maxHealth + startHeal,
      health: player.health + startHeal,
    };
    log.push(`Assist grants ${startHeal} bonus HP.`);
  }

  // Split carried buffs: passives auto-apply, consumables land in the pouch,
  // cache-boost is a level-only perk and is ignored in combat.
  const items: BuffId[] = [];
  for (const buff of carry.levelBuffs) {
    if (PASSIVE_BUFFS.includes(buff)) {
      const applied = applyItem(fx, player, buff);
      fx = applied.fx;
      player = applied.player;
      log.push(applied.log);
    } else if (CONSUMABLE_BUFFS.includes(buff)) {
      items.push(buff);
    }
    // cache-boost (and anything else) ignored.
  }

  const mechanic: MechanicState = {
    breachMeter: 0, breached: false, bossTurns: 0, exposed: false,
    seqIndex: 0, finalStep: 0, summons: 0,
  };

  return {
    def,
    tag: "player-turn",
    turn: 0,
    bossHealth: def.maxHealth,
    phaseIndex: 0,
    player,
    items,
    fx,
    mechanic,
    ultimate: 0,
    pendingMoveId: null,
    prompt: null,
    log,
    weaknessesRevealed: fx.analyzed ? def.weaknesses.length : 0,
    rng: 1337,
    assistScale,
    outcome: "ongoing",
  };
}

// ───────────────────────────────────────────────────────────────── reduce ──

export function reduce(state: CombatState, event: CombatEvent): CombatState {
  switch (state.tag) {
    case "player-turn":
      return event.type === "action" || event.type === "item" || event.type === "mechanic"
        ? playerTurn(state, event)
        : state;
    case "typing":
      return event.type === "typing-result" ? resolveCommand(state, event.grade) : state;
    case "telegraph":
      return event.type === "defense-result" ? resolveDefense(state, event) : state;
    case "scripted":
      return scripted(state, event);
    default:
      return state; // victory / defeat are terminal
  }
}

// ─────────────────────────────────────────────────────────────── helpers ───

export function currentPhase(state: CombatState): BossPhase {
  return state.def.phases[state.phaseIndex];
}

export function pendingMove(state: CombatState): BossMove | null {
  if (!state.pendingMoveId) return null;
  return state.def.moves.find((m) => m.id === state.pendingMoveId) ?? null;
}

export function isUltimateReady(state: CombatState): boolean {
  return state.ultimate >= 100;
}

/** Damage a plain ATTACK would land right now (ultimate / exposed / armor applied). */
export function playerAttackDamage(state: CombatState): number {
  return computeAttack(state).dmg;
}

/** The defense mini-game the pending boss move demands, scaled for phase + assist. */
export function defenseSpecFor(state: CombatState): QteSpec {
  const move = pendingMove(state);
  const phase = currentPhase(state);
  const scale = phase.tempoScale * state.assistScale;
  if (move?.qte) {
    let spec = scaleQte(move.qte, scale);
    if (spec.kind === "parry") {
      spec = { ...spec, windowMs: spec.windowMs + state.fx.parryModules * 40 };
    }
    return spec;
  }
  // Default: a parry window derived from the player's own stats.
  let windowMs = state.player.parryWindowMs;
  if (state.fx.stance) windowMs += 60;
  windowMs += state.fx.parryModules * 40;
  if (state.player.improvedParry) windowMs *= 1.25;
  windowMs *= scale;
  return { kind: "parry", windowMs };
}

// ─────────────────────────────────────────────── shared damage arithmetic ──

interface AttackCalc { dmg: number; ignoreArmor: boolean; usedUltimate: boolean; usedExposed: boolean }

function computeAttack(state: CombatState): AttackCalc {
  const base = state.player.attack + state.fx.attackBonus;
  const { def, mechanic } = state;
  if (state.ultimate >= 100) {
    return { dmg: base * 3, ignoreArmor: true, usedUltimate: true, usedExposed: false };
  }
  let dmg = base;
  let usedExposed = false;
  if (mechanic.exposed) {
    dmg = base * 2;
    usedExposed = true;
  }
  if (def.armored && !mechanic.breached) {
    dmg = 1; // armored & !breached & !ultimate → flat 1
    usedExposed = false; // the armor-flattened hit can't use exposed — keep the charge
  }
  return { dmg, ignoreArmor: false, usedUltimate: false, usedExposed };
}

/** Boss-hit reduction: parry grade → defending halve → firewall subtract (floor 0). */
function incomingDamage(reducedBase: number, fx: ActiveEffects): number {
  let d = reducedBase;
  if (fx.defending) d = Math.ceil(d / 2);
  return Math.max(0, d - fx.firewallLayers);
}

// ──────────────────────────────────────────────────────── player actions ──

function playerTurn(state: CombatState, event: CombatEvent): CombatState {
  if (event.type === "item") return useItem(state, event.buff);
  if (event.type === "mechanic") return playerMechanic(state, event.choice);
  if (event.type !== "action") return state;
  switch (event.kind) {
    case "attack":
      return doAttack(state);
    case "command":
      return startCommand(state);
    case "analyze":
      return doAnalyze(state);
    case "defend":
      return doDefend(state);
    case "parry-stance":
      return doParryStance(state);
    default:
      return state;
  }
}

function useItem(state: CombatState, buff: BuffId): CombatState {
  const idx = state.items.indexOf(buff);
  if (idx === -1) return state; // not held → illegal no-op
  const applied = applyItem(state.fx, state.player, buff);
  const items = state.items.slice();
  items.splice(idx, 1);
  return {
    ...state,
    fx: applied.fx,
    player: applied.player,
    items,
    log: [...state.log, applied.log],
  };
}

function doAttack(state: CombatState): CombatState {
  // Sequence-puzzle bosses are armored; a plain attack only chips 1.
  const calc = computeAttack(state);
  const mechanic = calc.usedExposed
    ? { ...state.mechanic, exposed: false }
    : state.mechanic;
  const ultimate = calc.usedUltimate ? 0 : state.ultimate;
  const label = calc.usedUltimate
    ? `ULTIMATE strike for ${calc.dmg}!`
    : calc.usedExposed
    ? `You exploit the opening for ${calc.dmg}.`
    : `You attack for ${calc.dmg}.`;
  const next = phaseCheck({
    ...state,
    mechanic,
    ultimate,
    bossHealth: state.bossHealth - calc.dmg,
    log: [...state.log, label],
  });
  return advanceToBossOrEnd(next);
}

function startCommand(state: CombatState): CombatState {
  const [r, rng2] = nextRand(state.rng);
  const useCorrupted =
    state.def.mechanic === "devil-king" &&
    state.phaseIndex >= 1 &&
    !!state.def.corruptedPrompts &&
    state.def.corruptedPrompts.length > 0;
  let text: string;
  let display: string;
  if (useCorrupted) {
    const pool = state.def.corruptedPrompts!;
    const pick = pool[Math.floor(r * pool.length)];
    text = pick.correct;
    display = pick.shown;
  } else {
    const pool = state.def.typingPrompts;
    const pick = pool[Math.floor(r * pool.length)];
    text = pick;
    display = pick;
  }
  const timeLimitMs = typingTimeLimitMs(4000, state.fx.focusChips, state.assistScale);
  return {
    ...state,
    tag: "typing",
    rng: rng2,
    prompt: { text, display, timeLimitMs },
    log: [...state.log, `Type the command: ${display}`],
  };
}

function resolveCommand(state: CombatState, grade: TypingGrade): CombatState {
  const base = state.player.attack + state.fx.attackBonus;
  let dmg = Math.max(1, Math.round(base * TYPING_DAMAGE_MULT[grade] * state.player.typingPower));
  if (state.def.armored && !state.mechanic.breached) {
    dmg = Math.max(1, Math.ceil(dmg / 2)); // armor halves command damage until breached
  }
  const next = phaseCheck({
    ...state,
    bossHealth: state.bossHealth - dmg,
    prompt: null,
    log: [...state.log, `Command lands (${grade}) for ${dmg}.`],
  });
  return advanceToBossOrEnd(next);
}

function doAnalyze(state: CombatState): CombatState {
  // For sequence-puzzle bosses, "analyze" is a puzzle input, not a scan.
  if (state.def.mechanic === "sequence-puzzle") return seqInput(state, "analyze");
  return {
    ...state,
    fx: { ...state.fx, analyzed: true },
    weaknessesRevealed: state.def.weaknesses.length,
    log: [...state.log, "You analyze the enemy; weaknesses revealed."],
  };
}

function doDefend(state: CombatState): CombatState {
  // For sequence-puzzle bosses, "defend" is a puzzle input.
  if (state.def.mechanic === "sequence-puzzle") return seqInput(state, "defend");
  const withPosture: CombatState = {
    ...state,
    fx: { ...state.fx, defending: true },
    log: [...state.log, "You brace to defend."],
  };
  return advanceToBossOrEnd(withPosture);
}

function doParryStance(state: CombatState): CombatState {
  const withPosture: CombatState = {
    ...state,
    fx: { ...state.fx, stance: true },
    log: [...state.log, "You settle into a parry stance."],
  };
  return advanceToBossOrEnd(withPosture);
}

function playerMechanic(state: CombatState, choice: string): CombatState {
  if (choice === "use-root-access") return useRootAccessAttack(state);
  if (
    state.def.mechanic === "sequence-puzzle" &&
    (choice === "remember" || choice === "create")
  ) {
    return seqInput(state, choice);
  }
  return state; // unknown choice for this tag → no-op
}

function useRootAccessAttack(state: CombatState): CombatState {
  if (state.fx.rootAccessCharges <= 0) return state; // no charge → no-op
  const dmg = (state.player.attack + state.fx.attackBonus) * 2; // ignores armor
  const next = phaseCheck({
    ...state,
    fx: { ...state.fx, rootAccessCharges: state.fx.rootAccessCharges - 1 },
    bossHealth: state.bossHealth - dmg,
    log: [...state.log, `Root access tears through armor for ${dmg}.`],
  });
  return advanceToBossOrEnd(next);
}

// ─────────────────────────────────────────────────────── sequence puzzle ──

function seqInput(state: CombatState, verb: string): CombatState {
  const expected = SEQ_ORDER[state.mechanic.seqIndex];
  if (verb === expected) {
    const seqIndex = state.mechanic.seqIndex + 1;
    const log = [...state.log, `Sequence step "${verb}" correct — a clue surfaces. (${seqIndex}/${SEQ_ORDER.length})`];
    let mechanic = { ...state.mechanic, seqIndex };
    // Completing all four steps breaks the armor: the page understands, and
    // normal attacks then land at full damage.
    if (seqIndex >= SEQ_ORDER.length && !mechanic.breached) {
      mechanic = { ...mechanic, breached: true };
      log.push("THE PAGE UNDERSTANDS…");
    }
    // Balance amendment: puzzle steps are NOT free — the boss takes its turn.
    const next = phaseCheck({
      ...state,
      mechanic,
      bossHealth: state.bossHealth - 12,
      log,
    });
    return advanceToBossOrEnd(next);
  }
  // A wrong step resets the order and still costs a boss turn.
  return advanceToBossOrEnd({
    ...state,
    mechanic: { ...state.mechanic, seqIndex: 0 },
    log: [...state.log, `Sequence broken at "${verb}" — the order resets.`],
  });
}

// ───────────────────────────────────────────────────────── boss telegraph ──

function advanceToBossOrEnd(state: CombatState): CombatState {
  if (state.outcome !== "ongoing") return state; // victory / defeat already set
  if (state.tag === "scripted") return state; // devil-king just entered its finale
  return bossTelegraph(state);
}

function bossTelegraph(state: CombatState): CombatState {
  const phase = currentPhase(state);
  const turnIndex = state.mechanic.bossTurns;
  let rng = state.rng;
  let moveId: string | undefined;

  // spoof-pick: every 3rd boss turn the boss forces its choice move.
  if (state.def.mechanic === "spoof-pick" && turnIndex % 3 === 2) {
    moveId = state.def.moves.find((m) => m.qte?.kind === "choice")?.id;
  }
  if (moveId === undefined) {
    const pool = phase.movePool;
    const [r, rng2] = nextRand(state.rng);
    rng = rng2;
    moveId = pool[Math.floor(r * pool.length)] ?? pool[0];
  }

  const move = state.def.moves.find((m) => m.id === moveId) ?? state.def.moves[0];
  return {
    ...state,
    tag: "telegraph",
    pendingMoveId: move.id,
    rng,
    mechanic: { ...state.mechanic, bossTurns: turnIndex + 1 },
    log: [...state.log, `${state.def.name} ${move.telegraph}.`],
  };
}

// ─────────────────────────────────────────────────────── defense resolve ──

function resolveDefense(
  state: CombatState,
  event: Extract<CombatEvent, { type: "defense-result" }>,
): CombatState {
  const move = pendingMove(state) ?? state.def.moves[0];
  const summonBonus = Math.min(state.mechanic.summons, 2); // each active summon +1, cap +2
  const bossBase = move.damage + summonBonus;
  const base = state.player.attack + state.fx.attackBonus;

  let playerDmg = 0;
  let counter = 0;
  let ultGain = 0;
  let breachHit = false;
  let exposedSet = false;
  let outcomeLog = "";

  if (move.qte) {
    // Timed mini-game (marker / choice / type-word).
    if (event.qteSuccess) {
      playerDmg = 0;
      counter = 1; // reflect
      ultGain = 25;
      if (state.def.mechanic === "spoof-pick" && move.qte.kind === "choice") exposedSet = true;
      outcomeLog = "You beat the timed challenge — the hit reflects.";
    } else {
      playerDmg = incomingDamage(bossBase, state.fx);
      outcomeLog = `The challenge fails; you take ${playerDmg}.`;
    }
  } else {
    const parry = event.parry ?? "miss";
    if (parry === "perfect") {
      playerDmg = 0;
      counter = base;
      ultGain = 34;
      breachHit = true;
      outcomeLog = `Perfect parry! You counter for ${counter}.`;
    } else if (parry === "normal") {
      // Balance amendment: a normal parry now fully blocks (perfect 0 / normal 0 /
      // miss full). Counter + meter are unchanged, so perfect stays strictly better.
      playerDmg = incomingDamage(0, state.fx);
      counter = Math.ceil(base / 2);
      ultGain = 15;
      breachHit = true;
      outcomeLog = `Parry! The blow is turned aside; you counter for ${counter}.`;
    } else {
      playerDmg = incomingDamage(bossBase, state.fx);
      outcomeLog = `The blow lands for ${playerDmg}.`;
    }
  }

  // Mechanic side-effects that key off this defense.
  let mechanic = state.mechanic;
  if (breachHit && state.def.mechanic === "breach-meter" && !mechanic.breached) {
    const breachMeter = mechanic.breachMeter + 1;
    mechanic = { ...mechanic, breachMeter, breached: breachMeter >= 3 };
  }
  if (exposedSet) mechanic = { ...mechanic, exposed: true };
  if (move.summons && move.summons > 0) {
    mechanic = { ...mechanic, summons: mechanic.summons + move.summons };
  }

  const fx: ActiveEffects = { ...state.fx, defending: false, stance: false };
  const player: PlayerCombat = { ...state.player, health: state.player.health - playerDmg };
  const log = [...state.log, outcomeLog];
  if (mechanic.breached && !state.mechanic.breached) log.push("ARMOR BREACHED — its guard shatters!");

  // Player death is checked before the counter can register a boss kill.
  if (player.health <= 0) {
    return {
      ...state,
      player: { ...player, health: 0 },
      fx,
      mechanic,
      pendingMoveId: null,
      tag: "defeat",
      outcome: "defeat",
      log: [...log, ...state.def.defeatLines, "You have fallen."],
    };
  }

  const damaged = phaseCheck({
    ...state,
    player,
    fx,
    mechanic,
    ultimate: Math.min(100, state.ultimate + ultGain), // ultimate clamps at 100
    bossHealth: state.bossHealth - counter,
    pendingMoveId: null,
    log,
  });

  if (damaged.outcome !== "ongoing") return damaged; // boss counter finished it
  if (damaged.tag === "scripted") return damaged; // counter pushed devil-king into its finale
  return { ...damaged, tag: "player-turn", turn: damaged.turn + 1 };
}

// ────────────────────────────────────────────────────────── phase check ──

function phaseCheck(state: CombatState): CombatState {
  const { def } = state;
  const max = def.maxHealth;

  // Non-devil bosses are simply defeated at 0 HP.
  if (state.bossHealth <= 0 && def.mechanic !== "devil-king") {
    return {
      ...state,
      bossHealth: 0,
      tag: "victory",
      outcome: "victory",
      log: [...state.log, ...def.defeatLines, `${def.name} is defeated!`],
    };
  }

  let idx = state.phaseIndex;
  let bossHealth = state.bossHealth;
  let tag = state.tag;
  let mechanic = state.mechanic;
  const log = state.log.slice();

  while (idx < def.phases.length - 1 && bossHealth / max <= def.phases[idx].exitBelow) {
    idx++;
    const phase = def.phases[idx];
    const enteringLast = idx === def.phases.length - 1;
    if (def.mechanic === "devil-king" && enteringLast) {
      // Scripted finale: clamp the boss and hand control to the final sequence.
      bossHealth = Math.ceil(0.2 * max);
      tag = "scripted";
      mechanic = { ...mechanic, finalStep: 0 };
      if (phase.enterLines) log.push(...phase.enterLines);
      log.push("The Devil King locks the fight into its final sequence.");
    } else if (phase.enterLines) {
      log.push(...phase.enterLines);
    }
  }

  return { ...state, phaseIndex: idx, bossHealth, tag, mechanic, log };
}

// ─────────────────────────────────────────────────────── devil-king finale ──

function scripted(state: CombatState, event: CombatEvent): CombatState {
  const step = state.mechanic.finalStep;

  // Command step waits for the typed restoration line.
  if (step === 2 && state.prompt) {
    if (event.type === "typing-result") {
      const ok = event.grade === "perfect" || event.grade === "good";
      return ok
        ? advanceScript(state, 3, { prompt: null }, "The lost chapter is restored.")
        : failScript(state, "The restoration command falters.");
    }
    return state; // still awaiting the type; anything else is inert
  }

  if (event.type === "item") return useItem(state, event.buff); // healing stays free

  // Event hygiene: event TYPES inapplicable to the current step are pure no-ops
  // returning the SAME state reference. Only a genuine failed ATTEMPT at the
  // current step (a missed telegraphed parry, an incomplete/incorrect typed
  // command, a wrong-but-offered mechanic press) invokes failScript.
  const expected = FINAL_ORDER[step];
  switch (expected) {
    case "analyze":
      if (event.type === "action" && event.kind === "analyze") {
        return advanceScript(state, 1, {}, "You read the Devil King's pattern.");
      }
      return state; // inapplicable event → no-op
    case "parry":
      // The telegraphed parry: a defense-result IS the attempt at this step.
      if (event.type === "defense-result") {
        return event.parry === "perfect" || event.parry === "normal"
          ? advanceScript(state, 2, {}, "You turn the strike aside.")
          : failScript(state, "The parry fails.");
      }
      return state; // any non-defense event → no-op
    case "command":
      if (event.type === "action" && event.kind === "command") {
        const timeLimitMs = typingTimeLimitMs(8000, state.fx.focusChips, state.assistScale);
        const prompt = {
          text: "sudo restore the lost chapter",
          display: "sudo restore the lost chapter",
          timeLimitMs,
        };
        return { ...state, prompt, log: [...state.log, "Type: sudo restore the lost chapter"] };
      }
      return state; // inapplicable event → no-op (the typing attempt is graded above)
    case "root-access": {
      if (event.type === "mechanic" && event.choice === "root-access") {
        let fx = state.fx;
        const log = [...state.log];
        if (fx.rootAccessCharges === 0) {
          fx = { ...fx, rootAccessCharges: 1 };
          log.push("Root access is auto-granted for the finale.");
        }
        fx = { ...fx, rootAccessCharges: fx.rootAccessCharges - 1 };
        return advanceScript({ ...state, fx, log }, 4, {}, "You seize root access.");
      }
      return state; // only the offered root-access press applies → else no-op
    }
    case "strike": {
      if (event.type === "mechanic" && event.choice === "strike-adds" && state.mechanic.summons > 0) {
        const [r, rng2] = nextRand(state.rng);
        const log = [...state.log, "Your strike clears one of the summons."];
        let items = state.items;
        if (r < 0.6) {
          items = [...items, "recovery-packet"];
          log.push("The fallen summon drops a recovery packet.");
        }
        return {
          ...state,
          rng: rng2,
          items,
          mechanic: { ...state.mechanic, summons: state.mechanic.summons - 1 },
          log,
        };
      }
      if (event.type === "mechanic" && event.choice === "strike") {
        return {
          ...state,
          tag: "victory",
          outcome: "victory",
          log: [...state.log, "FINAL STRIKE — the Devil King is undone."],
        };
      }
      return state; // only strike / strike-adds are offered here → else no-op
    }
    default:
      return state;
  }
}

function advanceScript(
  state: CombatState,
  nextStep: number,
  extra: Partial<CombatState>,
  msg: string,
): CombatState {
  return {
    ...state,
    ...extra,
    mechanic: { ...state.mechanic, finalStep: nextStep },
    log: [...state.log, msg],
  };
}

function failScript(state: CombatState, msg: string): CombatState {
  // Balance amendment: a slip costs 1 HP (defeat if it empties) and the player
  // RETRIES the same step — no −2, no reset of finalStep to 0.
  const health = state.player.health - 1;
  if (health <= 0) {
    return {
      ...state,
      player: { ...state.player, health: 0 },
      prompt: null,
      tag: "defeat",
      outcome: "defeat",
      log: [...state.log, msg, ...state.def.defeatLines, "You have fallen."],
    };
  }
  return {
    ...state,
    player: { ...state.player, health },
    prompt: null, // clear any typed prompt so the step can be re-attempted
    log: [...state.log, msg, "Steady — try that step again."],
  };
}
