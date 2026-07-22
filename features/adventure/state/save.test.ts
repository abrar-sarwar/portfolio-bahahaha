import { describe, it, expect } from "vitest";
import {
  defaultSave,
  loadSave,
  persistSave,
  UNLOCK_NEXT,
  completeLevel,
  grantReward,
  recordDeath,
  markBossDefeated,
  collectMemoryFragment,
  markIntroSeen,
  finishAdventure,
  grantCompletionThrough,
  type AdventureSave,
  type StorageLike,
} from "./save";

// Map-backed fake — exercises the real StorageLike contract without touching
// a real localStorage (unavailable in the Node test environment anyway).
class FakeStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(k: string): string | null {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.map.set(k, v);
  }
}

const KEY = "adventure-save-v1";

describe("defaultSave", () => {
  it("starts version 1 with only 1-1 unlocked and nothing completed", () => {
    const s = defaultSave();
    expect(s.version).toBe(1);
    expect(s.unlocked).toEqual(["1-1"]);
    expect(s.completed).toEqual([]);
  });

  it("starts with no abilities, fragments, or castle key", () => {
    const s = defaultSave();
    expect(s.abilities).toEqual({ dash: false, analyze: false, improvedParry: false });
    expect(s.keyFragments).toEqual([]);
    expect(s.castleKey).toBe(false);
    expect(s.memoryFragments).toEqual([]);
    expect(s.bossesDefeated).toEqual([]);
    expect(s.deaths).toEqual({});
    expect(s.gameCompleted).toBe(false);
    expect(s.codeReceived).toBe(false);
    expect(s.seenIntros).toEqual([]);
  });

  it("starts with default audio settings and no accessibility toggles", () => {
    const s = defaultSave();
    expect(s.settings.muted).toBe(false);
    expect(s.settings.volume).toBeGreaterThan(0);
    expect(s.settings.accessibility).toEqual({
      widerParry: false,
      slowerTyping: false,
      slowerHazards: false,
      reduceFlash: false,
      noShake: false,
    });
  });
});

describe("loadSave / persistSave roundtrip", () => {
  it("persists and reloads a mutated save unchanged via a Map-backed fake storage", () => {
    const storage = new FakeStorage();
    const save = grantReward(completeLevel(defaultSave(), "1-1"), { kind: "ability", id: "dash" });
    persistSave(save, storage);
    expect(loadSave(storage)).toEqual(save);
  });

  it("returns defaults when the key is missing", () => {
    const storage = new FakeStorage();
    expect(loadSave(storage)).toEqual(defaultSave());
  });

  it("returns defaults when the stored value is corrupt JSON", () => {
    const storage = new FakeStorage();
    storage.setItem(KEY, "{not valid json");
    expect(loadSave(storage)).toEqual(defaultSave());
  });

  it("returns defaults for an unknown save version", () => {
    const storage = new FakeStorage();
    storage.setItem(KEY, JSON.stringify({ ...defaultSave(), version: 2 }));
    expect(loadSave(storage)).toEqual(defaultSave());
  });

  it("returns defaults for a version-1 payload missing required fields", () => {
    const storage = new FakeStorage();
    storage.setItem(KEY, JSON.stringify({ version: 1 }));
    expect(loadSave(storage)).toEqual(defaultSave());
  });

  it("loadSave with no storage argument in a Node/SSR context does not throw and returns defaults", () => {
    expect(() => loadSave()).not.toThrow();
    expect(loadSave()).toEqual(defaultSave());
  });

  it("persistSave with no storage argument in a Node/SSR context does not throw", () => {
    expect(() => persistSave(defaultSave())).not.toThrow();
  });

  it("fills a missing seenIntros with [] for a save written before Task 17 (additive field, no version bump)", () => {
    const storage = new FakeStorage();
    const legacy = { ...defaultSave() } as Partial<AdventureSave>;
    delete legacy.seenIntros;
    storage.setItem(KEY, JSON.stringify(legacy));
    const loaded = loadSave(storage);
    expect(loaded.seenIntros).toEqual([]);
    expect(loaded.unlocked).toEqual(["1-1"]); // rest of the shape is untouched
  });

  it("still returns defaults for a version-1 payload missing OTHER required fields, seenIntros absence alone is not enough to reject", () => {
    const storage = new FakeStorage();
    storage.setItem(KEY, JSON.stringify({ version: 1, unlocked: ["1-1"] })); // missing completed etc.
    expect(loadSave(storage)).toEqual(defaultSave());
  });
});

describe("completeLevel", () => {
  it("completing 1-1 marks it complete and unlocks 1-2", () => {
    const next = completeLevel(defaultSave(), "1-1");
    expect(next.completed).toEqual(["1-1"]);
    expect(next.unlocked).toEqual(["1-1", "1-2"]);
  });

  it("is idempotent: completing the same level twice is a no-op the second time", () => {
    const once = completeLevel(defaultSave(), "1-1");
    const twice = completeLevel(once, "1-1");
    expect(twice).toBe(once); // reference-stable no-op
  });

  it("does not mutate the input save", () => {
    const save = defaultSave();
    completeLevel(save, "1-1");
    expect(save.completed).toEqual([]);
    expect(save.unlocked).toEqual(["1-1"]);
  });

  it("completing 1-4 unlocks the castle", () => {
    const save: AdventureSave = { ...defaultSave(), unlocked: ["1-1", "1-2", "1-3", "1-4"] };
    const next = completeLevel(save, "1-4");
    expect(next.completed).toEqual(["1-4"]);
    expect(next.unlocked).toContain("castle");
  });

  it("completing a level with no successor (castle) only marks it complete", () => {
    const next = completeLevel(defaultSave(), "castle");
    expect(next.completed).toEqual(["castle"]);
    expect(next.unlocked).toEqual(["1-1"]); // UNLOCK_NEXT has no entry for castle
  });

  it("UNLOCK_NEXT chains 1-1 through castle", () => {
    expect(UNLOCK_NEXT).toEqual({ "1-1": "1-2", "1-2": "1-3", "1-3": "1-4", "1-4": "castle" });
  });
});

describe("grantReward", () => {
  it("grants an ability", () => {
    const next = grantReward(defaultSave(), { kind: "ability", id: "dash" });
    expect(next.abilities.dash).toBe(true);
    expect(next.abilities.analyze).toBe(false);
  });

  it("granting an already-held ability is a no-op (same reference)", () => {
    const withDash = grantReward(defaultSave(), { kind: "ability", id: "dash" });
    const again = grantReward(withDash, { kind: "ability", id: "dash" });
    expect(again).toBe(withDash);
  });

  it("accumulates key fragments without duplicates", () => {
    let save = grantReward(defaultSave(), { kind: "key-fragment", id: "bronze" });
    save = grantReward(save, { kind: "key-fragment", id: "bronze" });
    expect(save.keyFragments).toEqual(["bronze"]);
  });

  it("the third distinct key fragment auto-grants the castle key", () => {
    let save = defaultSave();
    save = grantReward(save, { kind: "key-fragment", id: "bronze" });
    expect(save.castleKey).toBe(false);
    save = grantReward(save, { kind: "key-fragment", id: "silver" });
    expect(save.castleKey).toBe(false);
    save = grantReward(save, { kind: "key-fragment", id: "gold" });
    expect(save.castleKey).toBe(true);
  });

  it("a direct castle-key reward sets castleKey", () => {
    const next = grantReward(defaultSave(), { kind: "castle-key", id: "castle-key" });
    expect(next.castleKey).toBe(true);
  });

  it("does not mutate the input save", () => {
    const save = defaultSave();
    grantReward(save, { kind: "ability", id: "dash" });
    expect(save.abilities.dash).toBe(false);
  });
});

describe("recordDeath", () => {
  it("increments a boss's death count from zero", () => {
    const next = recordDeath(defaultSave(), "glitch-toad");
    expect(next.deaths["glitch-toad"]).toBe(1);
  });

  it("increments across multiple deaths", () => {
    let save = recordDeath(defaultSave(), "glitch-toad");
    save = recordDeath(save, "glitch-toad");
    expect(save.deaths["glitch-toad"]).toBe(2);
  });
});

describe("markBossDefeated", () => {
  it("adds a boss to bossesDefeated", () => {
    const next = markBossDefeated(defaultSave(), "glitch-toad");
    expect(next.bossesDefeated).toEqual(["glitch-toad"]);
  });

  it("is idempotent (reference-stable no-op replay)", () => {
    const once = markBossDefeated(defaultSave(), "glitch-toad");
    const twice = markBossDefeated(once, "glitch-toad");
    expect(twice).toBe(once);
  });
});

describe("collectMemoryFragment", () => {
  it("adds a level's memory fragment", () => {
    const next = collectMemoryFragment(defaultSave(), "1-1");
    expect(next.memoryFragments).toEqual(["1-1"]);
  });

  it("is idempotent (reference-stable no-op replay)", () => {
    const once = collectMemoryFragment(defaultSave(), "1-1");
    const twice = collectMemoryFragment(once, "1-1");
    expect(twice).toBe(once);
  });
});

describe("markIntroSeen", () => {
  it("adds a level id to seenIntros", () => {
    const next = markIntroSeen(defaultSave(), "1-1");
    expect(next.seenIntros).toEqual(["1-1"]);
  });

  it("is idempotent (reference-stable no-op replay)", () => {
    const once = markIntroSeen(defaultSave(), "1-1");
    const twice = markIntroSeen(once, "1-1");
    expect(twice).toBe(once);
  });

  it("does not mutate the input save", () => {
    const save = defaultSave();
    markIntroSeen(save, "1-1");
    expect(save.seenIntros).toEqual([]);
  });
});

describe("finishAdventure", () => {
  it("persists both ending flags and is reference-stable on replay", () => {
    const finished = finishAdventure(defaultSave());
    expect(finished).toMatchObject({ gameCompleted: true, codeReceived: true });
    expect(finishAdventure(finished)).toBe(finished);
  });
});

describe("grantCompletionThrough", () => {
  it("uses the real unlock chain through the selected level", () => {
    const save = grantCompletionThrough(defaultSave(), "1-3");
    expect(save.completed).toEqual(["1-1", "1-2", "1-3"]);
    expect(save.unlocked).toEqual(["1-1", "1-2", "1-3", "1-4"]);
  });
});
