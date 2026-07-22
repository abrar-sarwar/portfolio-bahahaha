import { describe, it, expect } from "vitest";
import { shouldClipAscent, movementLocked, shouldStartDash } from "./controllerGates";

// Grace window (ms) after a jump fires before the variable-height clip may
// engage, and the knockback lock duration. Kept in sync with the scene.
const GRACE = 80;

describe("shouldClipAscent", () => {
  // Baseline: released, well past grace, ascending hard, no knockback -> clip.
  const now = 1000;
  const fired = now - (GRACE + 50); // past the grace window
  const noKb = -Infinity;

  it("clips when the jump is released after the grace window while ascending", () => {
    expect(shouldClipAscent(now, fired, false, -300, noKb)).toBe(true);
  });

  it("does not clip while the jump is still held", () => {
    expect(shouldClipAscent(now, fired, true, -300, noKb)).toBe(false);
  });

  it("does not clip during knockback (held velocity is protected)", () => {
    expect(shouldClipAscent(now, fired, false, -300, now + 1)).toBe(false);
  });

  it("does not clip within the 80ms grace window after firing", () => {
    expect(shouldClipAscent(now, now - (GRACE - 10), false, -300, noKb)).toBe(false);
  });

  it("does not clip exactly at the grace boundary (strictly greater than 80)", () => {
    expect(shouldClipAscent(now, now - GRACE, false, -300, noKb)).toBe(false);
  });

  it("does not clip when ascent is already at/above the -120 floor", () => {
    expect(shouldClipAscent(now, fired, false, -120, noKb)).toBe(false);
    expect(shouldClipAscent(now, fired, false, -100, noKb)).toBe(false);
  });
});

describe("movementLocked", () => {
  it("is locked strictly inside the knockback window", () => {
    expect(movementLocked(1000, 1180)).toBe(true);
  });

  it("is unlocked once the window has elapsed", () => {
    expect(movementLocked(1180, 1180)).toBe(false);
    expect(movementLocked(1200, 1180)).toBe(false);
  });

  it("is unlocked when no knockback is pending", () => {
    expect(movementLocked(1000, -Infinity)).toBe(false);
  });
});

describe("shouldStartDash", () => {
  it("allows the realtime dash from a fresh save whenever input and cooldown permit", () => {
    expect(shouldStartDash(true, true, 1)).toBe(true);
    expect(shouldStartDash(true, true, -1)).toBe(true);
  });

  it("still requires a direction, a fresh press, and a ready cooldown", () => {
    expect(shouldStartDash(true, true, 0)).toBe(false);
    expect(shouldStartDash(false, true, 1)).toBe(false);
    expect(shouldStartDash(true, false, 1)).toBe(false);
  });
});
