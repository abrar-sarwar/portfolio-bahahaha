import { frame } from "../grid";
import type { SpriteDef } from "../textures";

// World-1-3 "Firewall Factory" tileset + parallax backdrop.
//
// A dark industrial steel foundry glowing furnace-orange: steel floor plates,
// a jump-through metal grating ledge, an animated molten-metal hazard pool, an
// animated conveyor belt, a two-state blast-gate/portcullis, and a
// floor-mounted laser emitter + its vertical beam. The three parallax layers
// are 480x270 and code-generated (a dithered furnace-glow gradient, distant
// smokestack silhouettes, and foreground pipe/gantry silhouettes) — hand-typing
// 270x480 grids is infeasible, so deterministic generators build them at module
// load. A permanent integrity test (art/tiles.test.ts) parses every frame and
// checks palette membership.

// --- 16x16 / 16x32 gameplay tiles -------------------------------------------

// Solid steel floor plate: bright lit crown (C highlight over d underside)
// above a D/d steel body seamed by k rivet columns (col 0 / col 8) and a mid
// horizontal seam, with C rivet heads and d speckle. Mirrors HARBOR_GROUND's
// lit crown over a darker body.
const GROUND = frame(`
  CCCdCCCdCCCdCCCd
  CdddCdddCdddCddd
  kDDDDDDDkDDDDDDD
  kDDdDDDDkDDdDDDD
  kDDDDDDDkDDDDDDD
  kDDCDDDDkDDCDDDD
  kDDDDDDDkDDDDDDD
  kDdDDDDDkDdDDDDD
  kkkkkkkkkkkkkkkk
  kDDDDDDDkDDDDDDD
  kDDDDDdDkDDDDDdD
  kDDDDDDDkDDDDDDD
  kDDCDDDDkDDCDDDD
  kDDDDDDDkDDDDDDD
  kDdDDDDDkDdDDDDD
  kDDDDDDDkDDDDDDD
`);

// Ground fill: the same D/d steel body as GROUND (same k seam columns 0/8 and
// mid seam, same C rivets / d speckle) but with NO bright top lip — a stacked
// column of solids only shows the lit crown on its exposed top (GROUND), not a
// stripe partway down. The k seam columns line up so the join with GROUND (or
// another fill) below reads as continuous plating.
const GROUND_FILL = frame(`
  kDDDDDDDkDDDDDDD
  kDDdDDDDkDDdDDDD
  kDDDDDDDkDDDDDDD
  kDdDDDDDkDdDDDDD
  kDDDDDDDkDDDDDDD
  kDDCDDDDkDDCDDDD
  kDDDDDDDkDDDDDDD
  kDdDDDDDkDdDDDDD
  kkkkkkkkkkkkkkkk
  kDDDDDDDkDDDDDDD
  kDDDDDdDkDDDDDdD
  kDDDDDDDkDDDDDDD
  kDDCDDDDkDDCDDDD
  kDDDDDDDkDDDDDDD
  kDdDDDDDkDdDDDDD
  kDDDDDDDkDDDDDDD
`);

// One-way metal grating ledge: a thin lit grating (C top, d/k slats, k
// underside) in the top 3 rows only, then transparent. Only its top face
// blocks (set in the scene) — a jump-through platform.
const ONEWAY = frame(`
  CdCdCdCdCdCdCdCd
  dkdkdkdkdkdkdkdk
  kkkkkkkkkkkkkkkk
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
`);

// Molten-metal hazard pool, frame 0: bright M orange surface skin, m mid ripple
// band, then deep L body with a couple of B/W hot glints.
const MOLTEN_0 = frame(`
  MMMMMMMMMMMMMMMM
  MmMMMWMMMMmMMMMM
  mmMmmmmMmmmmmMmm
  mmmmmmmmmmmmmmmm
  mLmmmmBmmmmmmmmm
  LLmLLmmLLmmmLLmm
  LLLLLLLLLLLLLLLL
  LLmLLLLLmLLLLLLL
  LLLLLLLLLLLLLLLL
  LmLLLLLLLLmLLLLL
  LLLLLLLLLLLLLLLL
  LLLLLmLLLLLLLLLL
  LLLLLLLLLLLLLLLL
  LLmLLLLLLLmLLLLL
  LLLLLLLLLLLLLLLL
  LLLLLLLLLLLLLLLL
`);

// Molten-metal hazard pool, frame 1: surface ripples and hot glints shifted so
// the anim reads as flowing lava (must differ from frame 0).
const MOLTEN_1 = frame(`
  MMMMMMMMMMMMMMMM
  MMMmMMMMMMWMMMmM
  mMmmmmMmmmmmMmmm
  mmmmmmmmmmmmmmmm
  mmmmBmmmmmmmLmmm
  LmmLLmmmLLmmLLmm
  LLLLLLLLLLLLLLLL
  LmLLLLLmLLLLLmLL
  LLLLLLLLLLLLLLLL
  LLLmLLLLLmLLLLLL
  LLLLLLLLLLLLLLLL
  LLLLLLLLLLmLLLLL
  LLLLLLLLLLLLLLLL
  LmLLLLLLLmLLLLLL
  LLLLLLLLLLLLLLLL
  LLLLLLLLLLLLLLLL
`);

// Conveyor belt segment, frame 0: c/d roller lips top & bottom, dark D belt
// body with bright M chevrons (C tip) pointing RIGHT. The scene flips the
// sprite horizontally for left-running belts, so author arrows pointing right.
const CONVEYOR_0 = frame(`
  cccccccccccccccc
  dddddddddddddddd
  kkkkkkkkkkkkkkkk
  DDDDDDDDDDDDDDDD
  DDDDDDDDDDDDDDDD
  MDDDMDDDMDDDMDDD
  DMDDDMDDDMDDDMDD
  DDCDDDCDDDCDDDCD
  DMDDDMDDDMDDDMDD
  MDDDMDDDMDDDMDDD
  DDDDDDDDDDDDDDDD
  DDDDDDDDDDDDDDDD
  kkkkkkkkkkkkkkkk
  dddddddddddddddd
  cccccccccccccccc
  kkkkkkkkkkkkkkkk
`);

// Conveyor belt segment, frame 1: chevrons shifted one step right so they
// appear to roll (must differ from frame 0).
const CONVEYOR_1 = frame(`
  cccccccccccccccc
  dddddddddddddddd
  kkkkkkkkkkkkkkkk
  DDDDDDDDDDDDDDDD
  DDDDDDDDDDDDDDDD
  DMDDDMDDDMDDDMDD
  DDMDDDMDDDMDDDMD
  DDDCDDDCDDDCDDDC
  DDMDDDMDDDMDDDMD
  DMDDDMDDDMDDDMDD
  DDDDDDDDDDDDDDDD
  DDDDDDDDDDDDDDDD
  kkkkkkkkkkkkkkkk
  dddddddddddddddd
  cccccccccccccccc
  kkkkkkkkkkkkkkkk
`);

// Vertical blast-gate / portcullis, 16x32. Frame 0 = CLOSED: a heavy D/d/k
// shutter filling the tile, side rails (d), horizontal slats (k), with M/m
// warning stripe bands near the top and bottom.
const GATE_CLOSED = frame(`
  dddddddddddddddd
  dddddddddddddddd
  MmMmMmMmMmMmMmMm
  mMmMmMmMmMmMmMmM
  MmMmMmMmMmMmMmMm
  mMmMmMmMmMmMmMmM
  dDDDDDDDDDDDDDDd
  dDDDDDDDDDDDDDDd
  dkkkkkkkkkkkkkkd
  dDDDDDDDDDDDDDDd
  dDDDDDDDDDDDDDDd
  dkkkkkkkkkkkkkkd
  dDDDDDDDDDDDDDDd
  dDDDDDDDDDDDDDDd
  dkkkkkkkkkkkkkkd
  dDDDDDDDDDDDDDDd
  dDDDDDDDDDDDDDDd
  dkkkkkkkkkkkkkkd
  dDDDDDDDDDDDDDDd
  dDDDDDDDDDDDDDDd
  dkkkkkkkkkkkkkkd
  dDDDDDDDDDDDDDDd
  dDDDDDDDDDDDDDDd
  dkkkkkkkkkkkkkkd
  dDDDDDDDDDDDDDDd
  dDDDDDDDDDDDDDDd
  MmMmMmMmMmMmMmMm
  mMmMmMmMmMmMmMmM
  MmMmMmMmMmMmMmMm
  mMmMmMmMmMmMmMmM
  dddddddddddddddd
  dddddddddddddddd
`);

// Vertical blast-gate / portcullis, 16x32. Frame 1 = OPEN: the shutter has
// retracted into the top ~8 rows (housing + folded slats + a warning band); the
// lower ~24 rows are transparent so the player can pass. The scene picks frame
// 0/1 by gate state.
const GATE_OPEN = frame(`
  dddddddddddddddd
  dDDDDDDDDDDDDDDd
  MmMmMmMmMmMmMmMm
  mMmMmMmMmMmMmMmM
  dkkkkkkkkkkkkkkd
  dDkDkDkDkDkDkDDd
  dkkkkkkkkkkkkkkd
  dddddddddddddddd
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
`);

// Floor-mounted laser emitter, frame 0: a chunky D/d steel housing (k bolts)
// with a red R lens/aperture running up the center to a nozzle at the top.
const LASER_0 = frame(`
  ......dDDd......
  ......dRRd......
  .....ddRRdd.....
  .....dDRRDd.....
  ....dDDRRDDd....
  ....dDDRRDDd....
  ...dDDDRRDDDd...
  ...dDkDRRDkDd...
  ..dDDDDRRDDDDd..
  ..dDkDDDDDDkDd..
  .dDDDDDDDDDDDDd.
  .dDkDDDDDDDDkDd.
  dDDDDDDDDDDDDDDd
  dkDDDDDDDDDDDDkd
  dDDDDDDDDDDDDDDd
  kkkkkkkkkkkkkkkk
`);

// Floor-mounted laser emitter, frame 1: the aperture pulses brighter — a hot W
// core inside the R lens (must differ from frame 0).
const LASER_1 = frame(`
  ......dDDd......
  ......dWWd......
  .....ddWWdd.....
  .....dRWWRd.....
  ....dDRWWRDd....
  ....dDRWWRDd....
  ...dDDRWWRDDd...
  ...dDkRWWRkDd...
  ..dDDDRWWRDDDd..
  ..dDkDDRRDDkDd..
  .dDDDDDDDDDDDDd.
  .dDkDDDDDDDDkDd.
  dDDDDDDDDDDDDDDd
  dkDDDDDDDDDDDDkd
  dDDDDDDDDDDDDDDd
  kkkkkkkkkkkkkkkk
`);

// Vertical laser beam, frame 0: a bright R/W column ~4px wide down the center,
// transparent sides, with soft r glow glints on some rows. The scene stretches
// this sprite vertically to span the beam length.
const BEAM_0 = frame(`
  ......RWWR......
  ......RWWR......
  .....rRWWRr.....
  ......RWWR......
  ......RWWR......
  ......RWWR......
  .....rRWWRr.....
  ......RWWR......
  ......RWWR......
  ......RWWR......
  .....rRWWRr.....
  ......RWWR......
  ......RWWR......
  ......RWWR......
  .....rRWWRr.....
  ......RWWR......
`);

// Vertical laser beam, frame 1: the r glow glints flicker to different rows so
// the beam reads as burning/unstable (must differ from frame 0).
const BEAM_1 = frame(`
  ......RWWR......
  .....rRWWRr.....
  ......RWWR......
  ......RWWR......
  .....rRWWRr.....
  ......RWWR......
  ......RWWR......
  .....rRWWRr.....
  ......RWWR......
  ......RWWR......
  ......RWWR......
  .....rRWWRr.....
  ......RWWR......
  ......RWWR......
  ......RWWR......
  .....rRWWRr.....
`);

export const FACTORY_GROUND: SpriteDef = {
  key: "tile-factory-ground",
  w: 16,
  h: 16,
  frames: [GROUND],
};

export const FACTORY_GROUND_FILL: SpriteDef = {
  key: "tile-factory-ground-fill",
  w: 16,
  h: 16,
  frames: [GROUND_FILL],
};

export const FACTORY_ONEWAY: SpriteDef = {
  key: "tile-factory-oneway",
  w: 16,
  h: 16,
  frames: [ONEWAY],
};

export const FACTORY_MOLTEN_ANIM = "flow";

export const FACTORY_MOLTEN: SpriteDef = {
  key: "tile-factory-molten",
  w: 16,
  h: 16,
  frames: [MOLTEN_0, MOLTEN_1],
  anims: [{ key: FACTORY_MOLTEN_ANIM, frames: [0, 1], frameRate: 3, repeat: -1 }],
};

export const FACTORY_CONVEYOR_ANIM = "roll";

export const FACTORY_CONVEYOR: SpriteDef = {
  key: "tile-factory-conveyor",
  w: 16,
  h: 16,
  frames: [CONVEYOR_0, CONVEYOR_1],
  anims: [{ key: FACTORY_CONVEYOR_ANIM, frames: [0, 1], frameRate: 8, repeat: -1 }],
};

export const FACTORY_GATE: SpriteDef = {
  key: "tile-factory-gate",
  w: 16,
  h: 32,
  frames: [GATE_CLOSED, GATE_OPEN],
};

export const FACTORY_LASER_ANIM = "pulse";

export const FACTORY_LASER_EMITTER: SpriteDef = {
  key: "tile-factory-laser",
  w: 16,
  h: 16,
  frames: [LASER_0, LASER_1],
  anims: [{ key: FACTORY_LASER_ANIM, frames: [0, 1], frameRate: 6, repeat: -1 }],
};

export const FACTORY_BEAM_ANIM = "burn";

export const FACTORY_LASER_BEAM: SpriteDef = {
  key: "tile-factory-beam",
  w: 16,
  h: 16,
  frames: [BEAM_0, BEAM_1],
  anims: [{ key: FACTORY_BEAM_ANIM, frames: [0, 1], frameRate: 10, repeat: -1 }],
};

// --- parallax backdrop (480x270) --------------------------------------------

const BG_W = 480;
const BG_H = 270;
// Horizon = the level's floor line (8 tiles * 16px). Smokestacks live above it
// so they read against the furnace glow (the opaque foundry floor covers below).
const HORIZON_Y = 128;

/** Deterministic 2D hash -> unsigned int. Keeps generated art stable across
 *  runs (integrity test must be reproducible; no Math.random at module load). */
function hash(x: number, y: number): number {
  let h = (x * 73856093) ^ (y * 19349663);
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}

/** Blank transparent grid of the parallax size. */
function blank(): string[][] {
  return Array.from({ length: BG_H }, () => Array<string>(BG_W).fill("."));
}

// Layer 0: dithered vertical furnace-glow gradient. A multi-stop ramp from dark
// O/K at the top down through steel grays to a hot L/m/M molten glow band near
// the bottom, dithered per-pixel by hash (like harbor's skyRows but warm at the
// bottom), with sparse W/M ember sparks drifting in the lower-middle.
function furnaceRows(): string[] {
  const stops = ["O", "K", "k", "D", "L", "m", "M"]; // top -> bottom
  const rows: string[] = [];
  for (let y = 0; y < BG_H; y++) {
    const t = y / (BG_H - 1); // 0 top .. 1 bottom
    const f = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(f));
    const frac = f - i; // 0..1 within the segment
    let row = "";
    for (let x = 0; x < BG_W; x++) {
      let ch = hash(x, y) % 100 < frac * 100 ? stops[i + 1] : stops[i];
      // Sparse ember sparks rising through the mid/lower glow.
      if (y > BG_H * 0.5 && y < BG_H * 0.92) {
        const ember = hash(x * 5 + 3, y * 9 + 4) % 1300;
        if (ember === 0) ch = "W";
        else if (ember === 1) ch = "M";
      }
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

// Layer 1: distant smokestack / chimney silhouettes rising to the horizon
// (k bodies, D edge girders); some carry a hot M glow band at their lit tops.
// Transparent elsewhere.
function chimneyRows(): string[] {
  const g = blank();
  let x = 0;
  while (x < BG_W) {
    const w = 10 + (hash(x, 7) % 12); // 10..21 wide
    const h = 60 + (hash(x, 13) % 70); // 60..129 tall
    const top = HORIZON_Y - h;
    const lit = hash(x, 5) % 3 === 0;
    for (let y = Math.max(0, top); y < HORIZON_Y; y++) {
      for (let xx = x; xx < Math.min(x + w, BG_W); xx++) {
        const edge = xx === x || xx === x + w - 1;
        g[y][xx] = edge ? "D" : "k";
      }
    }
    if (lit) {
      for (let dy = 0; dy < 3; dy++) {
        const y = top + dy;
        if (y < 0 || y >= BG_H) continue;
        for (let xx = x + 1; xx < Math.min(x + w - 1, BG_W); xx++) g[y][xx] = "M";
      }
    }
    x += w + 12 + (hash(x, 3) % 24); // gap between stacks
  }
  return g.map((r) => r.join(""));
}

// Layer 2: foreground pipe / gantry silhouettes (k pipe bodies with D rim
// girders, D vertical gantry supports) crossing the lower frame, with occasional
// lit M warm / B cyan valves. Transparent elsewhere.
function pipeRows(): string[] {
  const g = blank();
  const pipeYs = [176, 208, 240];
  // Horizontal pipes across the full width.
  for (let pi = 0; pi < pipeYs.length; pi++) {
    const py = pipeYs[pi];
    const thick = 6 + (pi % 2) * 2; // 6..8
    for (let x = 0; x < BG_W; x++) {
      for (let dy = 0; dy < thick; dy++) {
        const y = py + dy;
        if (y < 0 || y >= BG_H) continue;
        g[y][x] = dy === 0 || dy === thick - 1 ? "D" : "k"; // rim girder / body
      }
    }
  }
  // Vertical gantry supports at intervals.
  let gx = 20;
  while (gx < BG_W) {
    for (let y = 160; y < BG_H; y++) {
      g[y][gx] = "D";
      if (gx + 1 < BG_W) g[y][gx + 1] = "k";
      if (gx + 2 < BG_W) g[y][gx + 2] = "D";
    }
    gx += 60 + (hash(gx, 3) % 40);
  }
  // Lit valves / indicator lights on the pipes (M warm or B cyan).
  for (let pi = 0; pi < pipeYs.length; pi++) {
    const py = pipeYs[pi];
    let vx = 30 + pi * 17;
    while (vx < BG_W) {
      const col = hash(vx, pi) % 2 === 0 ? "M" : "B";
      for (let dy = 1; dy < 4; dy++) {
        const y = py + dy;
        if (y < 0 || y >= BG_H) continue;
        if (vx < BG_W) g[y][vx] = col;
        if (vx + 1 < BG_W) g[y][vx + 1] = col;
      }
      vx += 48 + (hash(vx, pi + 1) % 40);
    }
  }
  return g.map((r) => r.join(""));
}

export const FACTORY_BG0: SpriteDef = { key: "bg-factory-0", w: BG_W, h: BG_H, frames: [furnaceRows()] };
export const FACTORY_BG1: SpriteDef = { key: "bg-factory-1", w: BG_W, h: BG_H, frames: [chimneyRows()] };
export const FACTORY_BG2: SpriteDef = { key: "bg-factory-2", w: BG_W, h: BG_H, frames: [pipeRows()] };

// --- registry ---------------------------------------------------------------

export const FACTORY_TILES: SpriteDef[] = [
  FACTORY_GROUND,
  FACTORY_GROUND_FILL,
  FACTORY_ONEWAY,
  FACTORY_MOLTEN,
  FACTORY_CONVEYOR,
  FACTORY_GATE,
  FACTORY_LASER_EMITTER,
  FACTORY_LASER_BEAM,
];
export const FACTORY_PARALLAX: SpriteDef[] = [FACTORY_BG0, FACTORY_BG1, FACTORY_BG2];

// Single source of truth for the BARE texture keys the scene references (each
// single-frame def is aliased by registerSprites/bareKeyFor; animated tiles are
// addressed by anim key). Shared by the scene and the integrity test so the
// strings can't drift.
export const FACTORY_TILE_KEYS = {
  ground: FACTORY_GROUND.key,
  groundFill: FACTORY_GROUND_FILL.key,
  oneWay: FACTORY_ONEWAY.key,
  molten: FACTORY_MOLTEN.key,
  conveyor: FACTORY_CONVEYOR.key,
  gate: FACTORY_GATE.key,
  laserEmitter: FACTORY_LASER_EMITTER.key,
  laserBeam: FACTORY_LASER_BEAM.key,
} as const;

export const FACTORY_PARALLAX_KEYS = {
  bg0: FACTORY_BG0.key,
  bg1: FACTORY_BG1.key,
  bg2: FACTORY_BG2.key,
} as const;
