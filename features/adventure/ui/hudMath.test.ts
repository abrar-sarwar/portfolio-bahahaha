import { describe, it, expect } from "vitest";
import { heartsFromHealth, buffTag, countBuffs } from "./hudMath";
import type { BuffId } from "../ids";

describe("heartsFromHealth", () => {
  it("full health = all full hearts", () => {
    expect(heartsFromHealth(6, 6)).toEqual({ full: 3, half: 0, empty: 0 });
  });

  it("odd health shows a trailing half heart", () => {
    expect(heartsFromHealth(5, 6)).toEqual({ full: 2, half: 1, empty: 0 });
    expect(heartsFromHealth(3, 6)).toEqual({ full: 1, half: 1, empty: 1 });
    expect(heartsFromHealth(1, 6)).toEqual({ full: 0, half: 1, empty: 2 });
  });

  it("even non-full health has no half", () => {
    expect(heartsFromHealth(4, 6)).toEqual({ full: 2, half: 0, empty: 1 });
    expect(heartsFromHealth(2, 6)).toEqual({ full: 1, half: 0, empty: 2 });
  });

  it("zero health = all empty hearts", () => {
    expect(heartsFromHealth(0, 6)).toEqual({ full: 0, half: 0, empty: 3 });
  });

  it("clamps health above/below the valid range", () => {
    expect(heartsFromHealth(99, 6)).toEqual({ full: 3, half: 0, empty: 0 });
    expect(heartsFromHealth(-4, 6)).toEqual({ full: 0, half: 0, empty: 3 });
  });

  it("handles an odd maxHealth (rounds glyph count up)", () => {
    // maxHealth 5 -> ceil(5/2) = 3 hearts.
    expect(heartsFromHealth(5, 5)).toEqual({ full: 2, half: 1, empty: 0 });
    expect(heartsFromHealth(0, 5)).toEqual({ full: 0, half: 0, empty: 3 });
  });

  it("handles zero maxHealth without negative glyphs", () => {
    expect(heartsFromHealth(0, 0)).toEqual({ full: 0, half: 0, empty: 0 });
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
