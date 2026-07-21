import { describe, it, expect } from "vitest";
import {
  ASSIST_RT_THRESHOLD,
  assistRTActive,
  assistRTProfile,
  effectiveAttempts,
} from "./assistRT";

describe("assistRT (amendment §6)", () => {
  it("activates only after 3+ failed attempts", () => {
    expect(ASSIST_RT_THRESHOLD).toBe(3);
    expect(assistRTActive(0)).toBe(false);
    expect(assistRTActive(2)).toBe(false);
    expect(assistRTActive(3)).toBe(true);
    expect(assistRTActive(9)).toBe(true);
  });

  it("is neutral (no help) below the threshold", () => {
    expect(assistRTProfile(2)).toEqual({
      active: false,
      bonusMaxHearts: 0,
      recoveryScale: 1,
      projectileSpeedScale: 1,
      parryWindowScale: 1,
    });
  });

  it("applies the exact §6 multipliers when active", () => {
    expect(assistRTProfile(3)).toEqual({
      active: true,
      bonusMaxHearts: 1, // +1 max heart
      recoveryScale: 1.2, // recovery windows ×1.2
      projectileSpeedScale: 0.85, // projectile speed ×0.85
      parryWindowScale: 1.25, // parry window ×1.25
    });
  });

  it("floor-persisted attempts win over the session count", () => {
    expect(effectiveAttempts(1, 0)).toBe(1);
    expect(effectiveAttempts(1, 5)).toBe(5); // persisted floor keeps assist on
    expect(effectiveAttempts(4, 2)).toBe(4);
  });
});
