import { describe, expect, it } from "vitest";
import * as logic from "./devilKingLogic";
import { DEVIL_KING } from "./devilKing";

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

describe("readable Devil King duel spacing", () => {
  it("gives every parryable attack at least 620ms of warning", () => {
    for (const attack of DEVIL_KING.attacks.filter((candidate) => candidate.parryable)) {
      expect(attack.telegraphMs, attack.id).toBeGreaterThanOrEqual(620);
    }
  });

  it("repositions toward a 90-170px duel band without leaving the arena", () => {
    expect(logic.devilDuelTargetX(500, 100, 832)).toBe(250);
    expect(logic.devilDuelTargetX(120, 100, 832)).toBe(190);
    expect(logic.devilDuelTargetX(800, 900, 832)).toBe(784);
  });

  it("uses the same reach for telegraph previews and active blade shapes", () => {
    expect(logic.devilBladePreview("quick-slash", -1)).toEqual({ width: 82, offsetX: -32 });
    expect(logic.devilBladePreview("spear-thrust", 1)).toEqual({ width: 116, offsetX: 50 });
    expect(logic.devilBladePreview("bow-direct", 1)).toBeNull();
  });
});

describe("arsenalPhaseForElapsed", () => {
  it("cycles four readable 15-second forms before entering the mixed arsenal", () => {
    expect(logic.arsenalPhaseForElapsed).toBeTypeOf("function");
    expect([0, 15_000, 30_000, 45_000, 60_000].map(logic.arsenalPhaseForElapsed)).toEqual([1, 2, 3, 4, 5]);
  });
});
