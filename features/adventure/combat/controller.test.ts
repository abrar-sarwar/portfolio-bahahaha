import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  startCombat,
  beginCombat,
  dispatchCombat,
  exitCombat,
  currentCombat,
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
    abilities: { dash: false, analyze: false, improvedParry: false },
  });
  offs = [];
});

afterEach(() => {
  exitCombat();
  for (const off of offs) off();
});

const OPTS = { levelId: "1-1", returnTo: "level" } as const;

describe("combat controller", () => {
  it("startCombat throws for a boss with no registered definition", () => {
    expect(() => startCombat("warden", OPTS)).toThrow(/no boss definition/i);
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
