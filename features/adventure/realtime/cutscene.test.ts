import { describe, expect, it } from "vitest";
import * as cutscene from "./cutscene";

describe("orderedCutsceneSteps", () => {
  it("sorts visual beats while preserving equal-time author order", () => {
    expect(cutscene.orderedCutsceneSteps).toBeTypeOf("function");
    const beats = cutscene.orderedCutsceneSteps([
      { atMs: 900, run: () => undefined },
      { atMs: 100, run: () => undefined },
      { atMs: 900, run: () => undefined },
    ]);
    expect(beats.map((beat) => beat.atMs)).toEqual([100, 900, 900]);
  });
});

describe("nextChaseRunnerX", () => {
  it("keeps the runner visible ahead without ever allowing the player to catch him", () => {
    expect(cutscene.nextChaseRunnerX).toBeTypeOf("function");
    expect(cutscene.nextChaseRunnerX({ runnerX: 300, playerX: 250, dtMs: 1000, runSpeed: 200, finishX: 1200 })).toBe(580);
    expect(cutscene.nextChaseRunnerX({ runnerX: 700, playerX: 690, dtMs: 100, runSpeed: 200, finishX: 1200 })).toBeGreaterThanOrEqual(830);
  });

  it("clamps the runner at the exterior ledge", () => {
    expect(cutscene.nextChaseRunnerX).toBeTypeOf("function");
    expect(cutscene.nextChaseRunnerX({ runnerX: 1180, playerX: 1100, dtMs: 1000, runSpeed: 200, finishX: 1200 })).toBe(1200);
  });
});
