// Pure geometry helpers extracted from PlatformLevelScene so the run-merging
// math can be unit-tested without a Phaser/canvas runtime. The scene converts
// each merged run into one static Arcade body — merging horizontal runs keeps
// the body count low (one body per contiguous strip instead of one per tile).

/** A contiguous horizontal run of `true` cells on a single row.
 *  `colEnd` is exclusive: the run covers columns [colStart, colEnd). */
export interface SolidRun {
  row: number;
  colStart: number;
  colEnd: number;
}

/** An axis-aligned pixel rectangle (top-left origin). */
export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Merge horizontal runs of `true` cells, per row, into runs. Mirrors the
 * scene's boolean scan exactly (walk one past the row end so an open run
 * flushes at the boundary), so a full-width row yields a single run and a
 * lone tile yields a length-1 run.
 */
export function mergeRowRuns(grid: boolean[][]): SolidRun[] {
  const runs: SolidRun[] = [];
  for (let row = 0; row < grid.length; row++) {
    const cells = grid[row];
    const width = cells.length;
    let start = -1;
    for (let col = 0; col <= width; col++) {
      const solid = col < width && cells[col];
      if (solid && start < 0) start = col;
      if (!solid && start >= 0) {
        runs.push({ row, colStart: start, colEnd: col });
        start = -1;
      }
    }
  }
  return runs;
}

/** Convert a merged run to a top-left pixel rectangle at the given tile size. */
export function runToRect(run: SolidRun, tile: number): PixelRect {
  return {
    x: run.colStart * tile,
    y: run.row * tile,
    w: (run.colEnd - run.colStart) * tile,
    h: tile,
  };
}

/**
 * Whether a solid cell shows its top face to open air — the top world row, or a
 * cell with no solid directly above it. Exposed cells draw the grass-lip GROUND
 * tile; covered cells draw the lip-less GROUND_FILL tile, so a vertical stack of
 * solids has grass only on its crown instead of a grass stripe through the soil.
 */
export function topExposed(solids: boolean[][], tx: number, ty: number): boolean {
  return ty === 0 || !solids[ty - 1][tx];
}
