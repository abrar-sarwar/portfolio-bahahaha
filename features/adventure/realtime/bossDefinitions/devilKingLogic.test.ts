import { describe, expect, it } from "vitest";
import * as logic from "./devilKingLogic";

describe("Devil King arsenal seals", () => {
  it("deduplicates seals and reports the final exposure", () => {
    expect(logic.breakArsenalSeal).toBeTypeOf("function");
    let seals = logic.emptyArsenalSeals();
    seals = logic.breakArsenalSeal(seals, "sword");
    seals = logic.breakArsenalSeal(seals, "sword");
    expect(logic.brokenSealCount(seals)).toBe(1);
    for (const seal of ["bow", "spear", "hammer"] as const) seals = logic.breakArsenalSeal(seals, seal);
    expect(logic.allArsenalSealsBroken(seals)).toBe(true);
  });
});

describe("arsenalPhaseForElapsed", () => {
  it("cycles four readable 15-second forms before entering the mixed arsenal", () => {
    expect(logic.arsenalPhaseForElapsed).toBeTypeOf("function");
    expect([0, 15_000, 30_000, 45_000, 60_000].map(logic.arsenalPhaseForElapsed)).toEqual([1, 2, 3, 4, 5]);
  });
});
