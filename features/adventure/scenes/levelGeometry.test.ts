import { describe, it, expect } from "vitest";
import { mergeRowRuns, runToRect, type SolidRun } from "./levelGeometry";

// Small string-grid helper: "#" = solid, "." = empty.
function grid(rows: string[]): boolean[][] {
  return rows.map((r) => [...r].map((c) => c === "#"));
}

describe("mergeRowRuns", () => {
  it("returns no runs for an all-empty grid", () => {
    expect(mergeRowRuns(grid(["....", "....", "...."]))).toEqual([]);
  });

  it("merges a full-width row into a single run (colEnd exclusive)", () => {
    expect(mergeRowRuns(grid(["####"]))).toEqual<SolidRun[]>([
      { row: 0, colStart: 0, colEnd: 4 },
    ]);
  });

  it("emits a length-1 run for a single lone tile", () => {
    expect(mergeRowRuns(grid([".#.."]))).toEqual<SolidRun[]>([
      { row: 0, colStart: 1, colEnd: 2 },
    ]);
  });

  it("flushes a run that reaches the right edge", () => {
    expect(mergeRowRuns(grid(["..##"]))).toEqual<SolidRun[]>([
      { row: 0, colStart: 2, colEnd: 4 },
    ]);
  });

  it("splits multiple runs separated by gaps on the same row", () => {
    expect(mergeRowRuns(grid(["##.#.##"]))).toEqual<SolidRun[]>([
      { row: 0, colStart: 0, colEnd: 2 },
      { row: 0, colStart: 3, colEnd: 4 },
      { row: 0, colStart: 5, colEnd: 7 },
    ]);
  });

  it("keeps runs independent per row", () => {
    expect(mergeRowRuns(grid(["#.#", ".#.", "###"]))).toEqual<SolidRun[]>([
      { row: 0, colStart: 0, colEnd: 1 },
      { row: 0, colStart: 2, colEnd: 3 },
      { row: 1, colStart: 1, colEnd: 2 },
      { row: 2, colStart: 0, colEnd: 3 },
    ]);
  });

  it("does not bleed a run across rows (no vertical merging)", () => {
    // Same column solid on two rows -> two separate single-tile runs.
    const runs = mergeRowRuns(grid(["#", "#"]));
    expect(runs).toEqual<SolidRun[]>([
      { row: 0, colStart: 0, colEnd: 1 },
      { row: 1, colStart: 0, colEnd: 1 },
    ]);
  });
});

describe("runToRect", () => {
  it("converts a run to a top-left pixel rect at tile size 16", () => {
    expect(runToRect({ row: 2, colStart: 3, colEnd: 7 }, 16)).toEqual({
      x: 48,
      y: 32,
      w: 64,
      h: 16,
    });
  });

  it("gives a tile-wide rect for a single-tile run", () => {
    expect(runToRect({ row: 0, colStart: 0, colEnd: 1 }, 16)).toEqual({
      x: 0,
      y: 0,
      w: 16,
      h: 16,
    });
  });

  it("center of the rect matches the brief's rectangle formula", () => {
    // brief: rectangle(run*TILE + wpx/2, ty*TILE + TILE/2, wpx, TILE)
    const TILE = 16;
    const run: SolidRun = { row: 4, colStart: 5, colEnd: 9 };
    const r = runToRect(run, TILE);
    const wpx = (run.colEnd - run.colStart) * TILE;
    expect(r.x + r.w / 2).toBe(run.colStart * TILE + wpx / 2);
    expect(r.y + r.h / 2).toBe(run.row * TILE + TILE / 2);
  });
});
