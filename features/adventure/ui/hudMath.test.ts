import { describe, it, expect } from "vitest";
import { heartsFromHealth, buffTag } from "./hudMath";

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
