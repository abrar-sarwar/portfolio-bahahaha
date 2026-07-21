import { describe, it, expect } from "vitest";
import { heartsFromHealth, buffTag, countBuffs } from "./hudMath";
import type { BuffId } from "../ids";

// 6-heart unification (Task 32): health is now measured in WHOLE hearts (one
// point per heart, no half-heart rounding). heartsFromHealth renders one glyph
// per max-heart, `full` filled up to the current value, the rest `empty`.
// `half` is retained in the return shape (always 0) so the Hud's glyph switch
// keeps compiling.
describe("heartsFromHealth", () => {
  it("full health = all full hearts, no halves", () => {
    expect(heartsFromHealth(6, 6)).toEqual({ full: 6, half: 0, empty: 0 });
  });

  it("partial health = full + empty, never a half", () => {
    expect(heartsFromHealth(5, 6)).toEqual({ full: 5, half: 0, empty: 1 });
    expect(heartsFromHealth(3, 6)).toEqual({ full: 3, half: 0, empty: 3 });
    expect(heartsFromHealth(1, 6)).toEqual({ full: 1, half: 0, empty: 5 });
  });

  it("zero health = all empty hearts", () => {
    expect(heartsFromHealth(0, 6)).toEqual({ full: 0, half: 0, empty: 6 });
  });

  it("clamps health above/below the valid range", () => {
    expect(heartsFromHealth(99, 6)).toEqual({ full: 6, half: 0, empty: 0 });
    expect(heartsFromHealth(-4, 6)).toEqual({ full: 0, half: 0, empty: 6 });
  });

  it("one glyph per max-heart (no ceil/2 halving)", () => {
    expect(heartsFromHealth(3, 3)).toEqual({ full: 3, half: 0, empty: 0 });
    expect(heartsFromHealth(0, 3)).toEqual({ full: 0, half: 0, empty: 3 });
  });

  it("handles zero maxHealth without negative glyphs", () => {
    expect(heartsFromHealth(0, 0)).toEqual({ full: 0, half: 0, empty: 0 });
  });

  it("floors fractional inputs into whole hearts", () => {
    expect(heartsFromHealth(4.9, 6)).toEqual({ full: 4, half: 0, empty: 2 });
  });
});

describe("buffTag", () => {
  it("maps known buff ids to two-letter tags", () => {
    expect(buffTag("cache-boost")).toBe("CB");
    expect(buffTag("attack-byte")).toBe("AB");
    expect(buffTag("parry-module")).toBe("PM");
  });
});

describe("countBuffs", () => {
  // Fix 3: buffs stack (duplicates legal), so the HUD groups them into one
  // chip per buff id with an xN count instead of rendering N separate chips.
  it("returns an empty list for no buffs", () => {
    expect(countBuffs([])).toEqual([]);
  });

  it("counts a single instance of each distinct buff as n: 1", () => {
    const buffs: BuffId[] = ["attack-byte", "cache-boost"];
    expect(countBuffs(buffs)).toEqual([
      { buff: "attack-byte", n: 1 },
      { buff: "cache-boost", n: 1 },
    ]);
  });

  it("groups repeated buffs into a single entry with the right count", () => {
    const buffs: BuffId[] = ["attack-byte", "attack-byte", "attack-byte"];
    expect(countBuffs(buffs)).toEqual([{ buff: "attack-byte", n: 3 }]);
  });

  it("handles a mix of repeats and singles, order-stable by first appearance", () => {
    const buffs: BuffId[] = [
      "cache-boost",
      "attack-byte",
      "cache-boost",
      "focus-chip",
      "attack-byte",
      "cache-boost",
    ];
    expect(countBuffs(buffs)).toEqual([
      { buff: "cache-boost", n: 3 },
      { buff: "attack-byte", n: 2 },
      { buff: "focus-chip", n: 1 },
    ]);
  });
});
