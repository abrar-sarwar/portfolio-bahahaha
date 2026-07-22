import { describe, expect, it } from "vitest";
import { emptyInputSnapshot, reduceInputKey } from "./InputState";

describe("adventure input mapping", () => {
  it("treats Shift as a held run control", () => {
    const down = reduceInputKey(emptyInputSnapshot(), "ShiftLeft", true, false);
    expect(down.runHeld).toBe(true);
    const up = reduceInputKey(down, "ShiftLeft", false, false);
    expect(up.runHeld).toBe(false);
  });

  it.each([
    ["KeyR", "grapplePressed"],
    ["KeyF", "slashRushPressed"],
    ["KeyZ", "swordWavePressed"],
    ["KeyQ", "ultimatePressed"],
  ] as const)("maps %s to %s on a fresh press", (code, field) => {
    const pressed = reduceInputKey(emptyInputSnapshot(), code, true, false);
    expect(pressed[field]).toBe(true);
    expect(reduceInputKey(emptyInputSnapshot(), code, true, true)[field]).toBe(false);
  });
});
