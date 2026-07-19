import { describe, it, expect } from "vitest";
import { createCombat, reduce, currentPhase, pendingMove, defenseSpecFor, playerAttackDamage, isUltimateReady } from "./engine";
import { nextRand } from "./rng";
import type { BossDefinition, CombatState, CombatEvent } from "./types";

const TEST_BOSS: BossDefinition = {
  id: "glitch-toad", name: "Test Toad", maxHealth: 20,
  phases: [
    { exitBelow: 0.5, movePool: ["slam"], tempoScale: 1 },
    { exitBelow: 0, movePool: ["slam"], tempoScale: 0.75, enterLines: ["!"] },
  ],
  weaknesses: ["w1"], typingPrompts: ["scan"],
  moves: [{ id: "slam", name: "Slam", damage: 2, parryable: true, telegraph: "raises" }],
  mechanic: "tutorial", rewards: [], intro: [], defeatLines: [],
};

const carry = {
  levelBuffs: [], deathsOnBoss: 0,
  abilities: { improvedParry: false },
  maxHealth: 6, attack: 2, parryWindowMs: 220, perfectParryMs: 90, typingPower: 1,
};

const run = (s: CombatState, ...evs: CombatEvent[]) => evs.reduce(reduce, s);

describe("combat engine", () => {
  it("attack damages boss then boss telegraphs", () => {
    let s = createCombat(TEST_BOSS, carry);
    s = reduce(s, { type: "action", kind: "attack" });
    expect(s.bossHealth).toBe(18);
    expect(s.tag).toBe("telegraph");
    expect(s.pendingMoveId).toBe("slam");
  });

  it("perfect parry: no damage, counter, ultimate gain", () => {
    let s = createCombat(TEST_BOSS, carry);
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
    expect(s.player.health).toBe(6);
    expect(s.bossHealth).toBe(16); // 18 - counter 2
    expect(s.ultimate).toBe(34);
    expect(s.tag).toBe("player-turn");
  });

  it("miss takes full damage; defend halves; firewall subtracts", () => {
    let s = createCombat(TEST_BOSS, { ...carry, levelBuffs: ["firewall-layer"] });
    s = run(s, { type: "action", kind: "defend" }, { type: "defense-result", parry: "miss" });
    // 2 dmg -> defend ceil(1) -> firewall 1 -> 0
    expect(s.player.health).toBe(6);
  });

  it("typing grades scale command damage", () => {
    let s = createCombat(TEST_BOSS, carry);
    s = reduce(s, { type: "action", kind: "command" });
    expect(s.tag).toBe("typing");
    s = reduce(s, { type: "typing-result", grade: "perfect" });
    expect(s.bossHealth).toBe(16); // round(2 * 2)
  });

  it("phase transition fires at threshold", () => {
    let s = createCombat(TEST_BOSS, carry);
    // attack (2) + normal-parry counter (1) = 3 boss damage per round
    for (let i = 0; i < 4; i++)
      s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "normal" });
    expect(s.bossHealth).toBe(8);   // 20 - 12, ≤ 50%
    expect(s.phaseIndex).toBe(1);
    expect(s.outcome).toBe("ongoing");
  });

  it("recovery packet heals capped; illegal events are no-ops", () => {
    let s = createCombat(TEST_BOSS, { ...carry, levelBuffs: ["recovery-packet"] });
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "miss" }); // hp 4
    const before = s;
    s = reduce(s, { type: "defense-result", parry: "perfect" }); // wrong tag
    expect(s).toBe(before);
    s = reduce(s, { type: "item", buff: "recovery-packet" });
    expect(s.player.health).toBe(6);
  });

  it("armored boss: normal attack deals flat 1", () => {
    const armored: BossDefinition = { ...TEST_BOSS, armored: true, mechanic: "breach-meter" };
    let s = createCombat(armored, carry);
    s = reduce(s, { type: "action", kind: "attack" });
    expect(s.bossHealth).toBe(19);
  });

  it("three perfect parries charge ultimate; next attack triples and resets it", () => {
    let s = createCombat(TEST_BOSS, carry);
    for (let i = 0; i < 3; i++)
      s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
    expect(s.ultimate).toBeGreaterThanOrEqual(100); // 34 * 3
    const hp = s.bossHealth;
    s = reduce(s, { type: "action", kind: "attack" });
    expect(hp - s.bossHealth).toBe(6); // (attack 2) * 3
    expect(s.ultimate).toBe(0);
  });

  it("same seed = same fight", () => {
    const a = run(createCombat(TEST_BOSS, carry), { type: "action", kind: "command" });
    const b = run(createCombat(TEST_BOSS, carry), { type: "action", kind: "command" });
    expect(a.prompt).toEqual(b.prompt);
  });

  it("defeat when player health reaches 0", () => {
    let s = createCombat(TEST_BOSS, { ...carry, maxHealth: 2 });
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "miss" });
    expect(s.outcome).toBe("defeat");
    expect(s.tag).toBe("defeat");
  });
});

// ─────────────────────────────────────────────────────── extended coverage ──

const SPOOF_BOSS: BossDefinition = {
  id: "captain-spoof", name: "Captain Spoof", maxHealth: 40,
  phases: [{ exitBelow: 0, movePool: ["jab"], tempoScale: 1 }],
  weaknesses: [], typingPrompts: ["ping"],
  moves: [
    { id: "jab", name: "Jab", damage: 2, parryable: true, telegraph: "feints" },
    {
      id: "trick", name: "Trick", damage: 3, parryable: false, telegraph: "spoofs a prompt",
      qte: { kind: "choice", promptText: "which is real?", options: ["a", "b"], correctIndex: 0, timeLimitMs: 3000 },
    },
  ],
  mechanic: "spoof-pick", rewards: [], intro: [], defeatLines: [],
};

const BREACH_BOSS: BossDefinition = {
  id: "warden", name: "Warden", maxHealth: 40, armored: true,
  phases: [{ exitBelow: 0, movePool: ["crush"], tempoScale: 1 }],
  weaknesses: [], typingPrompts: ["scan"],
  moves: [{ id: "crush", name: "Crush", damage: 2, parryable: true, telegraph: "winds up" }],
  mechanic: "breach-meter", rewards: [], intro: [], defeatLines: [],
};

const SEQ_BOSS: BossDefinition = {
  id: "blank-page", name: "Blank Page", maxHealth: 60, armored: true,
  phases: [{ exitBelow: 0, movePool: ["blank"], tempoScale: 1 }],
  weaknesses: [], typingPrompts: ["write"],
  moves: [{ id: "blank", name: "Blank", damage: 1, parryable: true, telegraph: "stares" }],
  mechanic: "sequence-puzzle", rewards: [], intro: [], defeatLines: [],
};

const SUMMON_BOSS: BossDefinition = {
  id: "warden", name: "Summoner", maxHealth: 100,
  phases: [{ exitBelow: 0, movePool: ["call"], tempoScale: 1 }],
  weaknesses: [], typingPrompts: ["x"],
  moves: [{ id: "call", name: "Call", damage: 3, parryable: true, telegraph: "summons", summons: 1 }],
  mechanic: "tutorial", rewards: [], intro: [], defeatLines: [],
};

const DEVIL_BOSS: BossDefinition = {
  id: "devil-king", name: "Devil King", maxHealth: 10,
  phases: [
    { exitBelow: 0.6, movePool: ["swipe"], tempoScale: 1 },
    { exitBelow: 0.2, movePool: ["swipe"], tempoScale: 0.9 },
    { exitBelow: 0, movePool: ["swipe"], tempoScale: 0.8, enterLines: ["The final phase begins."] },
  ],
  weaknesses: ["w"], typingPrompts: ["scan"],
  corruptedPrompts: [{ shown: "sc@n", correct: "scan" }],
  moves: [{ id: "swipe", name: "Swipe", damage: 1, parryable: true, telegraph: "raises a claw" }],
  mechanic: "devil-king", rewards: [], intro: [], defeatLines: ["The chapter goes dark."],
};

// Drive a fresh Devil King into its scripted finale (finalStep 0).
function enterScripted(over: Partial<typeof carry> = {}): CombatState {
  let s = createCombat(DEVIL_BOSS, { ...carry, ...over });
  s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
  s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
  return s;
}

describe("combat engine — mechanics", () => {
  it("exploit-insight in carry pre-analyzes at creation", () => {
    const s = createCombat(TEST_BOSS, { ...carry, levelBuffs: ["exploit-insight"] });
    expect(s.fx.analyzed).toBe(true);
    expect(s.fx.exploitInsight).toBe(true);
    expect(s.weaknessesRevealed).toBe(TEST_BOSS.weaknesses.length);
  });

  it("armored boss halves command damage until breached", () => {
    const armored: BossDefinition = { ...TEST_BOSS, armored: true, mechanic: "breach-meter" };
    let s = createCombat(armored, carry);
    s = reduce(s, { type: "action", kind: "command" });
    s = reduce(s, { type: "typing-result", grade: "perfect" });
    // round(2*2*1)=4, armor halves -> ceil(4/2)=2
    expect(s.bossHealth).toBe(18);
  });

  it("spoof-pick forces the choice move on the 3rd boss turn; success exposes for a x2 attack", () => {
    let s = createCombat(SPOOF_BOSS, carry);
    // two ordinary boss turns
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "normal" });
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "normal" });
    // third attack telegraphs the forced choice QTE
    s = reduce(s, { type: "action", kind: "attack" });
    expect(s.tag).toBe("telegraph");
    expect(s.pendingMoveId).toBe("trick");
    const ultBefore = s.ultimate;
    const bossBefore = s.bossHealth;
    // beating the QTE: 0 damage, reflect 1, +25 ultimate, and it sets exposed
    s = reduce(s, { type: "defense-result", qteSuccess: true });
    expect(s.mechanic.exposed).toBe(true);
    expect(s.ultimate).toBe(ultBefore + 25);
    expect(bossBefore - s.bossHealth).toBe(1); // reflect
    // the follow-up attack consumes exposed for double damage
    const hp = s.bossHealth;
    s = reduce(s, { type: "action", kind: "attack" });
    expect(hp - s.bossHealth).toBe(carry.attack * 2);
    expect(s.mechanic.exposed).toBe(false);
  });

  it("breach-meter: two qualifying parries breach the armor, unlocking full attacks", () => {
    // Balance amendment: breach threshold 3→2 parries (sim floor for Warden winnability).
    let s = createCombat(BREACH_BOSS, { ...carry, maxHealth: 20 });
    s = reduce(s, { type: "action", kind: "attack" });
    expect(s.bossHealth).toBe(39); // armored → flat 1
    s = reduce(s, { type: "defense-result", parry: "normal" }); // breachMeter 1
    s = reduce(s, { type: "action", kind: "attack" });
    s = reduce(s, { type: "defense-result", parry: "normal" }); // breachMeter 2 → breached
    expect(s.mechanic.breached).toBe(true);
    const hp = s.bossHealth;
    s = reduce(s, { type: "action", kind: "attack" });
    expect(hp - s.bossHealth).toBe(carry.attack); // full damage now, no longer flat 1
  });

  it("breach only counts perfect/normal parries, never misses", () => {
    let s = createCombat(BREACH_BOSS, { ...carry, maxHealth: 30 });
    for (let i = 0; i < 4; i++) {
      s = reduce(s, { type: "action", kind: "attack" });
      s = reduce(s, { type: "defense-result", parry: "miss" });
    }
    expect(s.mechanic.breached).toBe(false);
    expect(s.mechanic.breachMeter).toBe(0);
  });

  it("sequence-puzzle: the full correct order lands 48, breaks the armor, and unlocks full attacks", () => {
    let s = createCombat(SEQ_BOSS, carry);
    const start = s.bossHealth;
    // Each puzzle step now costs a boss turn (steps are not free actions):
    // input a step, then the boss telegraphs and we must answer before the next.
    s = reduce(s, { type: "action", kind: "analyze" });   // step 1 → boss telegraphs
    expect(s.tag).toBe("telegraph");
    s = reduce(s, { type: "defense-result", parry: "miss" }); // resolve the boss turn
    s = reduce(s, { type: "action", kind: "defend" });    // step 2
    s = reduce(s, { type: "defense-result", parry: "miss" });
    s = reduce(s, { type: "mechanic", choice: "remember" }); // step 3
    s = reduce(s, { type: "defense-result", parry: "miss" });
    s = reduce(s, { type: "mechanic", choice: "create" });   // step 4 → completes + breaks armor
    expect(start - s.bossHealth).toBe(48); // 4 × 12
    expect(s.mechanic.seqIndex).toBe(4);
    expect(s.mechanic.breached).toBe(true); // "THE PAGE UNDERSTANDS…"
    // resolve the boss's final telegraph, then a normal attack now lands full damage.
    s = reduce(s, { type: "defense-result", parry: "miss" });
    const hp = s.bossHealth;
    s = reduce(s, { type: "action", kind: "attack" });
    expect(hp - s.bossHealth).toBe(carry.attack); // full damage, no longer flat 1
  });

  it("sequence-puzzle: a plain attack only chips 1 (armored)", () => {
    let s = createCombat(SEQ_BOSS, carry);
    s = reduce(s, { type: "action", kind: "attack" });
    expect(s.bossHealth).toBe(SEQ_BOSS.maxHealth - 1);
  });

  it("sequence-puzzle: a wrong verb resets the sequence to 0 (and still costs a boss turn)", () => {
    let s = createCombat(SEQ_BOSS, carry);
    s = reduce(s, { type: "action", kind: "analyze" });    // step 1 ok → boss telegraphs
    expect(s.mechanic.seqIndex).toBe(1);
    s = reduce(s, { type: "defense-result", parry: "miss" }); // resolve the boss turn
    s = reduce(s, { type: "mechanic", choice: "create" }); // expected "defend" → reset
    expect(s.mechanic.seqIndex).toBe(0);
    expect(s.bossHealth).toBe(SEQ_BOSS.maxHealth - 12); // only the first correct step landed
  });

  it("summons add +1 boss damage each, capped at +2", () => {
    let s = createCombat(SUMMON_BOSS, { ...carry, maxHealth: 30 });
    const takes: number[] = [];
    for (let i = 0; i < 4; i++) {
      const hp = s.player.health;
      s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "miss" });
      takes.push(hp - s.player.health);
    }
    expect(takes).toEqual([3, 4, 5, 5]); // base 3; +1, +2, then capped at +2
    expect(s.mechanic.summons).toBe(4);
  });

  it("devil-king: crossing 20% clamps health and locks into the scripted finale", () => {
    let s = createCombat(DEVIL_BOSS, carry);
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
    expect(s.phaseIndex).toBe(1);
    expect(s.tag).toBe("player-turn");
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
    expect(s.tag).toBe("scripted");
    expect(s.phaseIndex).toBe(2);
    expect(s.bossHealth).toBe(Math.ceil(0.2 * DEVIL_BOSS.maxHealth));
    expect(s.mechanic.finalStep).toBe(0);
  });

  it("devil-king: entering the scripted finale heals the player, capped at +2", () => {
    // Balance amendment round 2: resolve heal on entering the finale (sim floor
    // for DevilKing winnability). Take 1 dmg/turn on the way down so there's
    // more than 2 HP of headroom when the finale clamp fires, proving the heal
    // is capped at +2 rather than topping the player all the way back up.
    const dCarry = { ...carry, maxHealth: 8 };
    let s = createCombat(DEVIL_BOSS, dCarry);
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "miss" }); // 8 → 7
    expect(s.phaseIndex).toBe(0);
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "miss" }); // 7 → 6, phase 0 → 1
    expect(s.phaseIndex).toBe(1);
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "miss" }); // 6 → 5
    expect(s.player.health).toBe(5);
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "miss" }); // enters scripted (3 HP headroom)
    expect(s.tag).toBe("scripted");
    expect(s.phaseIndex).toBe(2);
    expect(s.player.health).toBe(7); // 5 + 2 (capped, not the full 3 headroom)
  });

  it("devil-king: the resolve heal never overheals past max (already full → +0)", () => {
    let s = createCombat(DEVIL_BOSS, carry);
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
    expect(s.tag).toBe("scripted");
    expect(s.player.health).toBe(carry.maxHealth); // stayed full — no overheal
  });

  it("devil-king: phase ≥1 command uses corrupted prompts (shown vs. correct)", () => {
    let s = createCombat(DEVIL_BOSS, carry);
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
    expect(s.phaseIndex).toBe(1);
    s = reduce(s, { type: "action", kind: "command" });
    expect(s.tag).toBe("typing");
    expect(s.prompt?.display).toBe("sc@n");
    expect(s.prompt?.text).toBe("scan");
  });

  it("devil-king: full scripted walk ends in victory (incl. auto-granted root access)", () => {
    let s = enterScripted();
    expect(s.tag).toBe("scripted");
    s = reduce(s, { type: "action", kind: "analyze" });
    expect(s.mechanic.finalStep).toBe(1);
    s = reduce(s, { type: "defense-result", parry: "perfect" });
    expect(s.mechanic.finalStep).toBe(2);
    s = reduce(s, { type: "action", kind: "command" });
    expect(s.prompt?.text).toBe("sudo restore the lost chapter");
    expect(s.prompt?.timeLimitMs).toBe(8000); // 8000 base, no focus chips, assist 1
    s = reduce(s, { type: "typing-result", grade: "perfect" });
    expect(s.mechanic.finalStep).toBe(3);
    expect(s.fx.rootAccessCharges).toBe(0);
    s = reduce(s, { type: "mechanic", choice: "root-access" }); // auto-granted, then spent
    expect(s.mechanic.finalStep).toBe(4);
    s = reduce(s, { type: "mechanic", choice: "strike" });
    expect(s.tag).toBe("victory");
    expect(s.outcome).toBe("victory");
  });

  it("devil-king: a failed step costs 1 HP and retries the SAME step (no reset to 0)", () => {
    let s = enterScripted();
    s = reduce(s, { type: "action", kind: "analyze" }); // finalStep 1 (parry)
    const hp = s.player.health;
    s = reduce(s, { type: "defense-result", parry: "miss" }); // parry attempt failed
    expect(s.player.health).toBe(hp - 1); // softened: -1, not -2
    expect(s.mechanic.finalStep).toBe(1); // still on the parry step; no reset to 0
    expect(s.tag).toBe("scripted");
    // the retried step can still succeed
    s = reduce(s, { type: "defense-result", parry: "perfect" });
    expect(s.mechanic.finalStep).toBe(2);
  });

  it("devil-king: repeated failures eventually empty health into a defeat", () => {
    let s = enterScripted({ maxHealth: 2 }); // player enters the finale at 2 HP
    s = reduce(s, { type: "action", kind: "analyze" }); // finalStep 1 (parry)
    s = reduce(s, { type: "defense-result", parry: "miss" }); // 2 → 1, retry parry
    expect(s.tag).toBe("scripted");
    expect(s.player.health).toBe(1);
    s = reduce(s, { type: "defense-result", parry: "miss" }); // 1 → 0 → defeat
    expect(s.tag).toBe("defeat");
    expect(s.outcome).toBe("defeat");
  });

  it.each([
    { seed: 6, drops: true },  // nextRand(6) ≈ 0.526 < 0.6
    { seed: 1, drops: false }, // nextRand(1) ≈ 0.627 ≥ 0.6
  ])("devil-king: strike-adds kills a summon and drops a packet iff r<0.6 (seed $seed)", ({ seed, drops }) => {
    const base = createCombat(DEVIL_BOSS, carry);
    const scriptedAtStrike: CombatState = {
      ...base,
      tag: "scripted",
      phaseIndex: 2,
      bossHealth: 2,
      rng: seed,
      mechanic: { ...base.mechanic, finalStep: 4, summons: 1 },
    };
    // sanity: our seed choice matches the engine's 0.6 threshold
    expect(nextRand(seed)[0] < 0.6).toBe(drops);
    const s = reduce(scriptedAtStrike, { type: "mechanic", choice: "strike-adds" });
    expect(s.mechanic.summons).toBe(0);
    if (drops) expect(s.items).toContain("recovery-packet");
    else expect(s.items).not.toContain("recovery-packet");
    // still on step 4 — the killing strike is a separate input
    expect(s.mechanic.finalStep).toBe(4);
    const done = reduce(s, { type: "mechanic", choice: "strike" });
    expect(done.tag).toBe("victory");
  });

  it("root-access mechanic tears through armor for double damage, consuming a charge", () => {
    let s = createCombat(BREACH_BOSS, { ...carry, levelBuffs: ["root-access"] });
    s = reduce(s, { type: "item", buff: "root-access" }); // arm a charge
    expect(s.fx.rootAccessCharges).toBe(1);
    const hp = s.bossHealth;
    s = reduce(s, { type: "mechanic", choice: "use-root-access" });
    expect(hp - s.bossHealth).toBe(carry.attack * 2); // ignores armor (would be flat 1 otherwise)
    expect(s.fx.rootAccessCharges).toBe(0);
  });

  it("helpers expose derived state for the UI", () => {
    let s = createCombat(TEST_BOSS, carry);
    expect(currentPhase(s)).toBe(TEST_BOSS.phases[0]);
    expect(pendingMove(s)).toBeNull();
    expect(playerAttackDamage(s)).toBe(carry.attack);
    expect(isUltimateReady(s)).toBe(false);
    s = reduce(s, { type: "action", kind: "attack" });
    expect(pendingMove(s)?.id).toBe("slam");
    const spec = defenseSpecFor(s);
    expect(spec.kind).toBe("parry");
  });

  it("reduce never mutates its input across every tag it walks through", () => {
    let s = createCombat(TEST_BOSS, { ...carry, levelBuffs: ["firewall-layer", "recovery-packet"] });
    const events: CombatEvent[] = [
      { type: "action", kind: "attack" },        // player-turn → telegraph
      { type: "defense-result", parry: "normal" }, // telegraph → player-turn
      { type: "action", kind: "command" },        // player-turn → typing
      { type: "typing-result", grade: "good" },   // typing → telegraph
      { type: "defense-result", parry: "perfect" }, // telegraph → player-turn
      { type: "item", buff: "recovery-packet" },  // free item
    ];
    for (const ev of events) {
      const snapshot = structuredClone(s);
      const next = reduce(s, ev);
      expect(s).toEqual(snapshot); // input object graph untouched
      s = next;
    }
  });
});

// ─────────────────────────────────────────── balance amendment coverage ──

describe("combat engine — balance amendment", () => {
  it("a non-devil boss driven to 0 HP ends in victory", () => {
    let s = createCombat(TEST_BOSS, carry);
    for (let i = 0; i < 8 && s.outcome === "ongoing"; i++) {
      s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
    }
    expect(s.bossHealth).toBe(0);
    expect(s.tag).toBe("victory");
    expect(s.outcome).toBe("victory");
  });

  it("normal parry fully blocks (0 damage) and grants +15 ultimate", () => {
    let s = createCombat(TEST_BOSS, carry); // no firewall, no defend
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "normal" });
    expect(s.player.health).toBe(6); // took nothing — normal parry now fully blocks
    expect(s.ultimate).toBe(15);     // explicit +15 on a normal parry
    expect(s.bossHealth).toBe(20 - 2 - 1); // attack 2 + normal counter ceil(2/2)=1
  });

  it("ultimate meter clamps at 100", () => {
    let s = createCombat(TEST_BOSS, carry);
    s = { ...s, ultimate: 90 };
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
    expect(s.ultimate).toBe(100); // 90 + 34 clamped to 100, not 124
  });

  it("exposed survives an armor-flattened hit (charge kept for a usable hit)", () => {
    const base = createCombat(BREACH_BOSS, carry); // armored, not breached
    const exposed: CombatState = { ...base, mechanic: { ...base.mechanic, exposed: true } };
    const hp = exposed.bossHealth;
    const s = reduce(exposed, { type: "action", kind: "attack" });
    expect(hp - s.bossHealth).toBe(1);      // armor flattens to 1
    expect(s.mechanic.exposed).toBe(true);  // but the exposed charge is NOT consumed
  });

  it("assist grants bonus hearts (extra max health) after repeated deaths", () => {
    const s = createCombat(TEST_BOSS, { ...carry, maxHealth: 8, deathsOnBoss: 4 });
    expect(s.player.maxHealth).toBe(10); // 8 + assistStartHeal(level 2) = 2
    expect(s.player.health).toBe(10);    // starts full, on the raised cap
  });

  it("scripted finale: inapplicable event types are no-ops returning the SAME state reference", () => {
    let s = enterScripted();
    // step 0 (analyze): defense/typing/attack are inapplicable → same ref
    expect(reduce(s, { type: "defense-result", parry: "perfect" })).toBe(s);
    expect(reduce(s, { type: "typing-result", grade: "perfect" })).toBe(s);
    expect(reduce(s, { type: "action", kind: "attack" })).toBe(s);
    s = reduce(s, { type: "action", kind: "analyze" }); // → step 1 (parry)
    // step 1 (parry): a typing-result / non-parry action is inapplicable
    expect(reduce(s, { type: "typing-result", grade: "perfect" })).toBe(s);
    expect(reduce(s, { type: "action", kind: "analyze" })).toBe(s);
    s = reduce(s, { type: "defense-result", parry: "perfect" }); // → step 2 (command)
    // step 2 (command, pre-prompt): a defense-result is inapplicable
    expect(reduce(s, { type: "defense-result", parry: "perfect" })).toBe(s);
    s = reduce(s, { type: "action", kind: "command" }); // prompt shown
    // step 2 (command, prompt shown): non-typing events are inert
    expect(reduce(s, { type: "action", kind: "attack" })).toBe(s);
    s = reduce(s, { type: "typing-result", grade: "perfect" }); // → step 3 (root-access)
    // step 3 (root-access): a not-offered mechanic press is inapplicable
    expect(reduce(s, { type: "mechanic", choice: "strike" })).toBe(s);
    s = reduce(s, { type: "mechanic", choice: "root-access" }); // → step 4 (strike)
    // step 4 (strike): a non-strike action is inapplicable
    expect(reduce(s, { type: "action", kind: "analyze" })).toBe(s);
    s = reduce(s, { type: "mechanic", choice: "strike" });
    expect(s.tag).toBe("victory"); // the walk still completes normally
  });
});
