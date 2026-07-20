import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  startCombat,
  beginCombat,
  dispatchCombat,
  returnToOverworld,
  registerCombatGame,
  teardownCombat,
  currentCombat,
  SCRIPTED_PARRY_STEP,
} from "./controller";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";
import type { AdventureEvents } from "../bridge/EventBus";
import type { BossDefinition } from "./types";

// A minimal tutorial boss driven directly (NOT registered in BOSSES) so the
// controller's carry-build + reduce/publish loop can be exercised headlessly —
// no Phaser game is registered, so all scene calls are skipped.
function testBoss(overrides: Partial<BossDefinition> = {}): BossDefinition {
  return {
    id: "glitch-toad", name: "Test Toad", maxHealth: 6,
    phases: [{ exitBelow: 0, movePool: ["slam"], tempoScale: 1 }],
    weaknesses: ["w1"], typingPrompts: ["scan"],
    moves: [{ id: "slam", name: "Slam", damage: 2, parryable: true, telegraph: "raises" }],
    mechanic: "tutorial", rewards: [], intro: ["Ready."], defeatLines: ["..."],
    ...overrides,
  };
}

// A devil-king boss (mirrors engine.test.ts's DEVIL_BOSS) so the store-based
// telegraph tests can drive the scripted finale's parry step (finalStep 1)
// through the real controller, not just the tutorial "telegraph" tag.
function devilBoss(overrides: Partial<BossDefinition> = {}): BossDefinition {
  return {
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
    ...overrides,
  };
}

// Capture bus events for assertions.
function capture<K extends keyof AdventureEvents>(event: K): AdventureEvents[K][] {
  const seen: AdventureEvents[K][] = [];
  const off = bus.on(event, (p) => seen.push(p));
  offs.push(off);
  return seen;
}
let offs: (() => void)[] = [];

beforeEach(() => {
  gameStore.set({
    combat: null, combatResult: null, deaths: {}, levelBuffs: [], paused: false,
    abilities: { dash: false, analyze: false, improvedParry: false }, telegraph: null,
  });
  offs = [];
});

afterEach(() => {
  teardownCombat(); // also nulls the registered mock game — see registerCombatGame tests below
  for (const off of offs) off();
});

const OPTS = { levelId: "1-1", returnTo: "level" } as const;

describe("combat controller", () => {
  it("startCombat throws for a boss with no registered definition", () => {
    expect(() => startCombat("devil-king", OPTS)).toThrow(/no boss definition/i);
  });

  it("beginCombat builds the carry, seeds the engine, and publishes to the store", () => {
    gameStore.set({ levelBuffs: ["attack-byte"] });
    beginCombat("glitch-toad", OPTS, testBoss());
    const s = gameStore.get().combat!;
    expect(s).not.toBeNull();
    expect(s.tag).toBe("player-turn");
    expect(s.player.attack + s.fx.attackBonus).toBe(3); // base 2 + attack-byte
    expect(s.bossHealth).toBe(6);
    expect(gameStore.get().combatResult).toBeNull();
  });

  it("drives one attack → telegraph → perfect-parry round through the store + bus", () => {
    const telegraphs = capture("combat:telegraph");
    const fx = capture("combat:fx");
    beginCombat("glitch-toad", OPTS, testBoss({ maxHealth: 6 }));

    // ATTACK: boss takes 2, engine telegraphs, controller emits the prompt.
    dispatchCombat({ type: "action", kind: "attack" });
    let s = gameStore.get().combat!;
    expect(s.tag).toBe("telegraph");
    expect(s.bossHealth).toBe(4);
    expect(telegraphs).toHaveLength(1);
    expect(telegraphs[0].moveId).toBe("slam");
    expect(telegraphs[0].spec.kind).toBe("parry");
    expect(telegraphs[0].impactInMs).toBeCloseTo(1400); // tempo 1 * assist 1
    expect(fx.map((f) => f.kind)).toContain("boss-hit");

    // PERFECT PARRY: 0 damage, counter 2 (boss → 2), back to player-turn.
    dispatchCombat({ type: "defense-result", parry: "perfect" });
    s = gameStore.get().combat!;
    expect(s.tag).toBe("player-turn");
    expect(s.player.health).toBe(s.player.maxHealth); // took no damage
    expect(s.bossHealth).toBe(2); // 4 - counter 2
    expect(fx.map((f) => f.kind)).toEqual(expect.arrayContaining(["parry", "crit"]));
    expect(currentCombat()?.turn).toBe(1);
  });

  it("victory emits combat:over and sets combatResult", () => {
    const over = capture("combat:over");
    beginCombat("glitch-toad", OPTS, testBoss({ maxHealth: 4 }));
    dispatchCombat({ type: "action", kind: "attack" }); // boss 4 → 2, telegraph
    dispatchCombat({ type: "defense-result", parry: "perfect" }); // counter 2 → 0 → victory
    const s = gameStore.get().combat!;
    expect(s.tag).toBe("victory");
    expect(over).toEqual([{ outcome: "victory", bossId: "glitch-toad" }]);
    expect(gameStore.get().combatResult).toEqual({ outcome: "victory", bossId: "glitch-toad" });
  });

  it("defeat increments deaths[bossId] and emits combat:over", () => {
    const over = capture("combat:over");
    beginCombat("glitch-toad", OPTS, testBoss({ maxHealth: 40 }));
    // Miss repeatedly (2 dmg each) until the 10-HP player falls.
    for (let i = 0; i < 5; i++) {
      dispatchCombat({ type: "action", kind: "attack" });
      dispatchCombat({ type: "defense-result", parry: "miss" });
    }
    const s = gameStore.get().combat!;
    expect(s.tag).toBe("defeat");
    expect(gameStore.get().deaths["glitch-toad"]).toBe(1);
    expect(over).toEqual([{ outcome: "defeat", bossId: "glitch-toad" }]);
  });

  it("ignores illegal events (engine no-op → no publish churn)", () => {
    beginCombat("glitch-toad", OPTS, testBoss());
    const before = gameStore.get().combat;
    dispatchCombat({ type: "typing-result", grade: "perfect" }); // illegal in player-turn
    expect(gameStore.get().combat).toBe(before); // same reference, no set()
  });
});

// ─────────────────────────────────────────── store-based telegraph (review) ──
// Task 13 review Finding 1: TimedPrompt must read the telegraph off the
// store (not a bus event) so a React mount-order race can never lose it.
// These tests assert the controller's half of that contract directly:
// gameStore.get().telegraph is the source of truth.
describe("combat controller — store-based telegraph", () => {
  it("arms a store telegraph with impactAt = startedAt + impact ms, and clears it on resolution", () => {
    beginCombat("glitch-toad", OPTS, testBoss({ maxHealth: 6 }));
    expect(gameStore.get().telegraph).toBeNull();

    const before = performance.now();
    dispatchCombat({ type: "action", kind: "attack" }); // → telegraph
    const after = performance.now();

    const tel = gameStore.get().telegraph;
    expect(tel).not.toBeNull();
    expect(tel!.moveId).toBe("slam");
    expect(tel!.spec.kind).toBe("parry");
    expect(tel!.startedAt).toBeGreaterThanOrEqual(before);
    expect(tel!.startedAt).toBeLessThanOrEqual(after);
    expect(tel!.impactAt - tel!.startedAt).toBeCloseTo(1400); // tempo 1 * assist 1

    dispatchCombat({ type: "defense-result", parry: "perfect" });
    expect(gameStore.get().telegraph).toBeNull();
  });

  it("arms a store telegraph for the scripted devil-king parry step (finalStep 1) and clears it on resolution", () => {
    beginCombat("devil-king", OPTS, devilBoss());
    dispatchCombat({ type: "action", kind: "attack" });
    dispatchCombat({ type: "defense-result", parry: "perfect" }); // phase 0 → 1
    dispatchCombat({ type: "action", kind: "attack" });
    dispatchCombat({ type: "defense-result", parry: "perfect" }); // phase 1 → 2, scripted finale

    const entered = gameStore.get().combat!;
    expect(entered.tag).toBe("scripted");
    expect(entered.mechanic.finalStep).toBe(0);
    expect(gameStore.get().telegraph).toBeNull(); // analyze step: no defense pending yet

    dispatchCombat({ type: "action", kind: "analyze" }); // → finalStep 1 (SCRIPTED_PARRY_STEP)
    const armed = gameStore.get().combat!;
    expect(armed.tag).toBe("scripted");
    expect(armed.mechanic.finalStep).toBe(SCRIPTED_PARRY_STEP);

    const tel = gameStore.get().telegraph;
    expect(tel).not.toBeNull();
    expect(tel!.spec.kind).toBe("parry");

    dispatchCombat({ type: "defense-result", parry: "perfect" }); // resolves → finalStep 2
    expect(gameStore.get().combat!.mechanic.finalStep).toBe(2);
    expect(gameStore.get().telegraph).toBeNull();
  });

  it("clears the store telegraph on combat end (defeat)", () => {
    // A high boss maxHealth so the fight ends by the PLAYER's 10 HP running
    // out (5 missed 2-dmg rounds), not by the player's attack killing the
    // boss first — mirrors the existing "defeat increments deaths" test.
    beginCombat("glitch-toad", OPTS, testBoss({ maxHealth: 40 }));
    for (let i = 0; i < 4; i++) {
      dispatchCombat({ type: "action", kind: "attack" });
      dispatchCombat({ type: "defense-result", parry: "miss" });
    }
    expect(gameStore.get().combat!.tag).toBe("player-turn");

    dispatchCombat({ type: "action", kind: "attack" });
    expect(gameStore.get().telegraph).not.toBeNull(); // the fatal round's telegraph is armed

    dispatchCombat({ type: "defense-result", parry: "miss" }); // 5th miss → 0 HP → defeat
    expect(gameStore.get().combat!.tag).toBe("defeat");
    expect(gameStore.get().telegraph).toBeNull();
  });

  it("force-fails an unanswered telegraph after the deadline and clears the store telegraph", () => {
    vi.useFakeTimers();
    try {
      beginCombat("glitch-toad", OPTS, testBoss({ maxHealth: 6 }));
      dispatchCombat({ type: "action", kind: "attack" });
      expect(gameStore.get().telegraph).not.toBeNull();

      vi.advanceTimersByTime(1400 + 250 + 1); // impact + grace, past the deadline
      expect(gameStore.get().telegraph).toBeNull();
      expect(gameStore.get().combat!.tag).toBe("player-turn"); // forced miss resolved it
    } finally {
      vi.useRealTimers();
    }
  });

  it("teardownCombat cancels the pending force-fail timer, clears store fields, and is safe to call twice", () => {
    vi.useFakeTimers();
    try {
      beginCombat("glitch-toad", OPTS, testBoss({ maxHealth: 6 }));
      dispatchCombat({ type: "action", kind: "attack" }); // arms the force-fail timer
      expect(gameStore.get().telegraph).not.toBeNull();

      teardownCombat();
      expect(gameStore.get().combat).toBeNull();
      expect(gameStore.get().telegraph).toBeNull();
      expect(gameStore.get().combatResult).toBeNull();
      expect(currentCombat()).toBeNull();

      // The force-fail timer must be cancelled, not just orphaned — advancing
      // past its deadline must not resurrect a combat snapshot.
      vi.advanceTimersByTime(5000);
      expect(gameStore.get().combat).toBeNull();

      expect(() => teardownCombat()).not.toThrow(); // idempotent
      expect(gameStore.get().combat).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ─────────────────────────────────────────────────────── returnToOverworld ──
// Fold-in fix (a) from the Task 16 review: a mock-scene unit test asserting
// the scene-transition ORDER (stop Backdrop -> stop Level -> start
// Overworld) and that the store's completed/unlocked — the fields
// OverworldScene reads to light nodes — land before the scene switch. Also
// covers fold-in fix (c): the level:complete emit must stay victory-gated.
describe("returnToOverworld", () => {
  it("stops Backdrop then Level, starts Overworld (in that order), and updates store completed/unlocked on a victory", () => {
    const calls: string[] = [];
    const mockGame = {
      scene: {
        isActive: () => true,
        pause: (key: string) => { calls.push(`pause:${key}`); },
        resume: (key: string) => { calls.push(`resume:${key}`); },
        start: (key: string) => { calls.push(`start:${key}`); },
        stop: (key: string) => { calls.push(`stop:${key}`); },
      },
    };
    registerCombatGame(mockGame);
    gameStore.set({ completed: [], unlocked: ["1-1"] });

    beginCombat("glitch-toad", OPTS, testBoss({ maxHealth: 4 }));
    dispatchCombat({ type: "action", kind: "attack" }); // boss 4 -> 2, telegraph
    dispatchCombat({ type: "defense-result", parry: "perfect" }); // counter -> 0 -> victory
    expect(gameStore.get().combat!.tag).toBe("victory");

    calls.length = 0; // isolate the calls returnToOverworld itself makes
    returnToOverworld();

    const backdropIdx = calls.indexOf("stop:CombatBackdrop");
    const levelIdx = calls.indexOf("stop:Level");
    const overworldIdx = calls.indexOf("start:Overworld");
    expect(backdropIdx).toBeGreaterThanOrEqual(0);
    expect(levelIdx).toBeGreaterThan(backdropIdx);
    expect(overworldIdx).toBeGreaterThan(levelIdx);

    expect(gameStore.get().completed).toEqual(["1-1"]);
    expect(gameStore.get().unlocked).toEqual(["1-1", "1-2"]);
    expect(gameStore.get().combat).toBeNull();
  });

  it("does not mark the level complete when called without a victory outcome (fold-in fix c)", () => {
    const completeEvents = capture("level:complete");
    gameStore.set({ completed: [], unlocked: ["1-1"] });

    beginCombat("glitch-toad", OPTS, testBoss({ maxHealth: 4 }));
    expect(gameStore.get().combat!.outcome).toBe("ongoing");

    returnToOverworld();

    expect(completeEvents).toEqual([]);
    expect(gameStore.get().completed).toEqual([]);
  });
});
