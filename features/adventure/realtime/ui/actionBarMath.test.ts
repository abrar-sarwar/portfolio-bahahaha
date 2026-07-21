import { describe, it, expect } from "vitest";
import { cooldownFrac, fracFromReadyAt } from "./actionBarMath";

// Pure cooldown-sweep math for the ActionBar. `cooldownFrac` maps how much of a
// cooldown remains to a [0, 1] fill fraction (1 = just used / full sweep, 0 =
// ready). The scene computes it from a "ready-at" timestamp each frame and
// stores it; the ActionBar renders it as a bottom-up fill over the slot.
describe("cooldownFrac", () => {
  it("is 0 when nothing remains (ready)", () => {
    expect(cooldownFrac(0, 320)).toBe(0);
    expect(cooldownFrac(-50, 320)).toBe(0);
  });

  it("is 1 the instant an ability is spent (full remaining)", () => {
    expect(cooldownFrac(320, 320)).toBe(1);
  });

  it("clamps overshoot to 1", () => {
    expect(cooldownFrac(999, 320)).toBe(1);
  });

  it("is linear through the middle of the cooldown", () => {
    expect(cooldownFrac(160, 320)).toBeCloseTo(0.5, 5);
    expect(cooldownFrac(80, 320)).toBeCloseTo(0.25, 5);
  });

  it("is 0 for a non-positive duration (no cooldown configured)", () => {
    expect(cooldownFrac(100, 0)).toBe(0);
    expect(cooldownFrac(100, -1)).toBe(0);
  });
});

describe("fracFromReadyAt", () => {
  it("is 0 once the ready time has passed", () => {
    expect(fracFromReadyAt(1000, 900, 320)).toBe(0);
    expect(fracFromReadyAt(1000, 1000, 320)).toBe(0);
  });

  it("maps a future ready time to the remaining fraction", () => {
    // 240ms left of a 320ms cooldown -> 0.75 fill.
    expect(fracFromReadyAt(1000, 1240, 320)).toBeCloseTo(0.75, 5);
  });

  it("clamps to 1 when more than a full duration remains", () => {
    expect(fracFromReadyAt(1000, 2000, 320)).toBe(1);
  });
});
