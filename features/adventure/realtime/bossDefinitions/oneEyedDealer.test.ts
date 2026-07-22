import { describe, expect, it } from "vitest";
import {
  DEALER_BULLET_SPEED,
  dealerStrafeX,
  shouldPuntDealerMask,
  willNextDealerShotGlow,
} from "./oneEyedDealer";

describe("One-Eyed Dealer mask punt", () => {
  it("only allows one punt until the Dealer recovers the mask", () => {
    expect(shouldPuntDealerMask(false, 20, false)).toBe(true);
    expect(shouldPuntDealerMask(false, 50, true)).toBe(true);
    expect(shouldPuntDealerMask(false, 50, false)).toBe(false);
    expect(shouldPuntDealerMask(true, 20, true)).toBe(false);
  });
});

describe("Dealer combat readability", () => {
  it("slows bullets and predicts the parryable pull before it fires", () => {
    expect(DEALER_BULLET_SPEED).toBe(190);
    expect(willNextDealerShotGlow(1)).toBe(false);
    expect(willNextDealerShotGlow(2)).toBe(true);
  });

  it("strafes while respecting room margins", () => {
    expect(dealerStrafeX(200, 300, 1, 100, 768)).toBeGreaterThan(200);
    expect(dealerStrafeX(47, 300, -1, 100, 768)).toBe(48);
    expect(dealerStrafeX(721, 300, 1, 100, 768)).toBe(720);
  });
});
