import { describe, expect, it } from "vitest";
import { chaseAttackPlan, levelEntryScene } from "./chaseLogic";

describe("castle chase routing", () => {
  it("routes castle entry through Chase and every other level through Level", () => {
    expect(levelEntryScene("castle")).toBe("Chase");
    expect(levelEntryScene("1-4")).toBe("Level");
  });
});

describe("runner sword-wave cadence", () => {
  it("uses readable gaps and adds a delayed pair only late in the chase", () => {
    expect(chaseAttackPlan(1_000, 0.25)).toEqual({ nextAt: 3_200, followupDelayMs: null });
    expect(chaseAttackPlan(1_000, 0.8)).toEqual({ nextAt: 2_700, followupDelayMs: 480 });
  });
});
