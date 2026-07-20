import { describe, it, expect, beforeEach } from "vitest";
import { applyRewards, grantRewards, type RewardTargetState } from "./rewards";
import { gameStore } from "../bridge/GameStore";
import type { BossDefinition, Reward } from "./types";

function state(overrides: Partial<RewardTargetState> = {}): RewardTargetState {
  return {
    abilities: { dash: false, analyze: false, improvedParry: false },
    keyFragments: [],
    castleKey: false,
    ...overrides,
  };
}

describe("applyRewards (pure)", () => {
  it("flips an ability reward on", () => {
    const rewards: Reward[] = [{ kind: "ability", id: "dash" }];
    const next = applyRewards(state(), rewards);
    expect(next.abilities.dash).toBe(true);
    expect(next.abilities.analyze).toBe(false); // untouched abilities stay as-is
  });

  it("pushes a key-fragment reward", () => {
    const rewards: Reward[] = [{ kind: "key-fragment", id: "bronze" }];
    const next = applyRewards(state(), rewards);
    expect(next.keyFragments).toEqual(["bronze"]);
  });

  it("applies the Glitch Toad's full reward list (dash + bronze) in one pass", () => {
    const rewards: Reward[] = [
      { kind: "ability", id: "dash" },
      { kind: "key-fragment", id: "bronze" },
    ];
    const next = applyRewards(state(), rewards);
    expect(next.abilities.dash).toBe(true);
    expect(next.keyFragments).toEqual(["bronze"]);
  });

  it("does not mutate the input state object", () => {
    const s = state();
    const rewards: Reward[] = [{ kind: "ability", id: "dash" }];
    applyRewards(s, rewards);
    expect(s.abilities.dash).toBe(false);
    expect(s.keyFragments).toEqual([]);
  });

  it("is idempotent: replaying the same rewards never double-grants", () => {
    const rewards: Reward[] = [
      { kind: "ability", id: "dash" },
      { kind: "key-fragment", id: "bronze" },
    ];
    const once = applyRewards(state(), rewards);
    const twice = applyRewards(once, rewards);
    expect(twice.abilities.dash).toBe(true);
    expect(twice.keyFragments).toEqual(["bronze"]); // not ["bronze", "bronze"]
  });

  it("returns the SAME abilities/keyFragments references when nothing changes (no-op replay)", () => {
    const already = state({ abilities: { dash: true, analyze: false, improvedParry: false }, keyFragments: ["bronze"] });
    const rewards: Reward[] = [
      { kind: "ability", id: "dash" },
      { kind: "key-fragment", id: "bronze" },
    ];
    const next = applyRewards(already, rewards);
    expect(next.abilities).toBe(already.abilities);
    expect(next.keyFragments).toBe(already.keyFragments);
  });

  it("an empty reward list is a no-op", () => {
    const s = state();
    const next = applyRewards(s, []);
    expect(next.abilities).toBe(s.abilities);
    expect(next.keyFragments).toBe(s.keyFragments);
  });

  it("does not add duplicate fragment ids across separate calls with different bosses", () => {
    const afterFirst = applyRewards(state(), [{ kind: "key-fragment", id: "bronze" }]);
    const afterSecond = applyRewards(afterFirst, [{ kind: "key-fragment", id: "silver" }]);
    expect(afterSecond.keyFragments).toEqual(["bronze", "silver"]);
  });

  it("forges the castle key from an explicit castle-key reward (Task 20 Blank Page)", () => {
    const next = applyRewards(state(), [{ kind: "castle-key", id: "castle" }]);
    expect(next.castleKey).toBe(true); // previously DROPPED on the way out of applyRewards
  });

  it("auto-forges the castle key when the third fragment lands", () => {
    const two = state({ keyFragments: ["bronze", "silver"] });
    const next = applyRewards(two, [{ kind: "key-fragment", id: "gold" }]);
    expect(next.keyFragments).toEqual(["bronze", "silver", "gold"]);
    expect(next.castleKey).toBe(true);
  });

  it("leaves castleKey false (reference-stable) below three fragments", () => {
    const next = applyRewards(state(), [{ kind: "key-fragment", id: "bronze" }]);
    expect(next.castleKey).toBe(false);
  });
});

// ─────────────────────────────────────────────── grantRewards (store glue) ──
function testBoss(rewards: Reward[]): BossDefinition {
  return {
    id: "glitch-toad", name: "Test Toad", maxHealth: 6,
    phases: [{ exitBelow: 0, movePool: ["hop"], tempoScale: 1 }],
    weaknesses: [], typingPrompts: ["scan"],
    moves: [{ id: "hop", name: "Hop", damage: 2, parryable: true, telegraph: "..." }],
    mechanic: "tutorial", rewards, intro: [], defeatLines: [],
  };
}

describe("grantRewards (store glue)", () => {
  beforeEach(() => {
    gameStore.set({
      abilities: { dash: false, analyze: false, improvedParry: false },
      keyFragments: [],
      castleKey: false,
    });
  });

  it("writes the boss's rewards onto the store", () => {
    grantRewards(testBoss([{ kind: "ability", id: "dash" }, { kind: "key-fragment", id: "bronze" }]));
    const s = gameStore.get();
    expect(s.abilities.dash).toBe(true);
    expect(s.keyFragments).toEqual(["bronze"]);
  });

  it("replaying the same boss's victory does not double-add the fragment", () => {
    const boss = testBoss([{ kind: "ability", id: "dash" }, { kind: "key-fragment", id: "bronze" }]);
    grantRewards(boss);
    grantRewards(boss);
    const s = gameStore.get();
    expect(s.keyFragments).toEqual(["bronze"]);
    expect(s.abilities.dash).toBe(true);
  });

  it("a no-op replay does not touch the store fields (reference-stable)", () => {
    const boss = testBoss([{ kind: "ability", id: "dash" }]);
    grantRewards(boss);
    const abilitiesAfterFirst = gameStore.get().abilities;
    grantRewards(boss);
    expect(gameStore.get().abilities).toBe(abilitiesAfterFirst);
  });

  it("writes castleKey onto the store from The Blank Page's castle-key reward", () => {
    grantRewards(testBoss([{ kind: "castle-key", id: "castle" }]));
    expect(gameStore.get().castleKey).toBe(true);
  });
});
