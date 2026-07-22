import { describe, expect, it } from "vitest";
import { telegraphPresentation } from "./telegraphPresentation";

describe("shared boss telegraph language", () => {
  it("uses gold and a final pulse for parryable attacks", () => {
    expect(telegraphPresentation(true, 700)).toEqual({
      tint: 0xffe08a,
      halo: 0xffd75e,
      finalPulseDelayMs: 380,
    });
  });

  it("uses red without a parry pulse for unblockable attacks", () => {
    expect(telegraphPresentation(false, 700)).toEqual({
      tint: 0xff6a6a,
      halo: 0xef4444,
      finalPulseDelayMs: null,
    });
  });
});
