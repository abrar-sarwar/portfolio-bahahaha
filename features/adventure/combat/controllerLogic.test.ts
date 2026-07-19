import { describe, it, expect } from "vitest";
import {
  telegraphImpactMs,
  telegraphDeadlineMs,
  forceDefenseResult,
  createDeadline,
  pauseDeadline,
  resumeDeadline,
  remainingMs,
  isExpired,
  buildCarry,
  deriveFx,
  TELEGRAPH_BASE_MS,
  TELEGRAPH_GRACE_MS,
} from "./controllerLogic";
import { createCombat, reduce } from "./engine";
import type { BossDefinition, CombatState, CombatEvent } from "./types";
import type { QteSpec } from "./timedEvents";

const BOSS: BossDefinition = {
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
  levelBuffs: [], deathsOnBoss: 0, abilities: { improvedParry: false },
  maxHealth: 6, attack: 2, parryWindowMs: 220, perfectParryMs: 90, typingPower: 1,
};

describe("controllerLogic — telegraph timing", () => {
  it("impact = 1400 * tempo * assist; deadline adds grace", () => {
    expect(telegraphImpactMs(1, 1)).toBe(TELEGRAPH_BASE_MS);
    expect(telegraphImpactMs(0.75, 1.5)).toBeCloseTo(1400 * 0.75 * 1.5);
    expect(telegraphDeadlineMs(1, 1)).toBe(TELEGRAPH_BASE_MS + TELEGRAPH_GRACE_MS);
  });

  it("force-result is a miss for parry and a failed QTE otherwise", () => {
    expect(forceDefenseResult({ kind: "parry", windowMs: 200 })).toEqual({
      type: "defense-result", parry: "miss",
    });
    const marker: QteSpec = { kind: "marker", travelMs: 800, targetStart: 0.4, targetEnd: 0.6 };
    expect(forceDefenseResult(marker)).toEqual({ type: "defense-result", qteSuccess: false });
    const choice: QteSpec = { kind: "choice", promptText: "?", options: ["a"], correctIndex: 0, timeLimitMs: 2000 };
    expect(forceDefenseResult(choice)).toEqual({ type: "defense-result", qteSuccess: false });
  });
});

describe("controllerLogic — pause-extendable deadline", () => {
  it("expires at dueAt when never paused", () => {
    const d = createDeadline(1000, 500);
    expect(isExpired(d, 1499)).toBe(false);
    expect(isExpired(d, 1500)).toBe(true);
    expect(remainingMs(d, 1200)).toBe(300);
  });

  it("freezes while paused and extends by the paused duration on resume", () => {
    let d = createDeadline(1000, 500); // due 1500
    d = pauseDeadline(d, 1200);        // 300ms left, frozen
    expect(remainingMs(d, 5000)).toBe(300); // time passing while paused does not count
    expect(isExpired(d, 5000)).toBe(false); // a paused deadline never fires
    d = resumeDeadline(d, 5000);            // paused 3800ms → due pushed to 5300
    expect(d.dueAt).toBe(5300);
    expect(remainingMs(d, 5000)).toBe(300);
    expect(isExpired(d, 5299)).toBe(false);
    expect(isExpired(d, 5300)).toBe(true);
  });

  it("double pause / resume-without-pause are no-ops", () => {
    let d = createDeadline(0, 100);
    const paused = pauseDeadline(d, 10);
    expect(pauseDeadline(paused, 50)).toBe(paused); // already paused
    d = resumeDeadline(d, 10); // not paused → unchanged reference
    expect(d.dueAt).toBe(100);
  });
});

describe("controllerLogic — buildCarry", () => {
  it("copies level buffs and reads deaths for the boss", () => {
    const c = buildCarry({
      base: { maxHealth: 10, attack: 2, parryWindowMs: 220, perfectParryMs: 90, typingPower: 1 },
      levelBuffs: ["attack-byte", "recovery-packet"],
      deaths: { "glitch-toad": 3 },
      bossId: "glitch-toad",
      improvedParry: true,
    });
    expect(c.levelBuffs).toEqual(["attack-byte", "recovery-packet"]);
    expect(c.deathsOnBoss).toBe(3);
    expect(c.abilities.improvedParry).toBe(true);
    expect(c.maxHealth).toBe(10);
  });

  it("defaults deaths to 0 for an un-fought boss", () => {
    const c = buildCarry({
      base: { maxHealth: 10, attack: 2, parryWindowMs: 220, perfectParryMs: 90, typingPower: 1 },
      levelBuffs: [], deaths: {}, bossId: "warden", improvedParry: false,
    });
    expect(c.deathsOnBoss).toBe(0);
  });
});

describe("controllerLogic — deriveFx", () => {
  const attack: CombatEvent = { type: "action", kind: "attack" };

  it("returns [] for a no-op (same reference)", () => {
    const s = createCombat(BOSS, carry);
    // typing-result during player-turn is illegal → same ref
    const illegal: CombatEvent = { type: "typing-result", grade: "perfect" };
    expect(deriveFx(s, reduce(s, illegal), illegal)).toEqual([]);
  });

  it("boss-hit on an attack that damages the boss", () => {
    const s = createCombat(BOSS, carry);
    const next = reduce(s, attack);
    expect(deriveFx(s, next, attack)).toContain("boss-hit");
  });

  it("parry + crit on a perfect parry, player-hit on a miss", () => {
    let s = createCombat(BOSS, carry);
    s = reduce(s, attack); // → telegraph
    const perfect: CombatEvent = { type: "defense-result", parry: "perfect" };
    const afterPerfect = reduce(s, perfect);
    const fx = deriveFx(s, afterPerfect, perfect);
    expect(fx).toContain("parry");
    expect(fx).toContain("crit");

    const miss: CombatEvent = { type: "defense-result", parry: "miss" };
    const afterMiss = reduce(s, miss);
    expect(deriveFx(s, afterMiss, miss)).toContain("player-hit");
  });

  it("phase fx when a hit crosses the phase threshold", () => {
    let s: CombatState = createCombat(BOSS, carry);
    // Chip the boss to just above 50% then cross it.
    for (let i = 0; i < 3; i++) {
      s = reduce(s, attack);
      s = reduce(s, { type: "defense-result", parry: "normal" });
    }
    const before = s;
    s = reduce(s, attack);
    const fx = deriveFx(before, s, attack);
    expect(before.phaseIndex).toBe(0);
    expect(s.phaseIndex).toBe(1);
    expect(fx).toContain("phase");
  });
});
