import { frame } from "../grid";
import type { SpriteDef } from "../textures";
import type { LevelDefinition } from "../../levels/types";

// World-1 "Bug Fields" tileset + parallax backdrop.
//
// The three 16x16 gameplay tiles are hand-authored pixel grids (grass-lip
// ground, a jump-through one-way lip, and a red glitch-spike hazard). The
// three parallax layers are 480x270 and code-generated (a dithered N->K sky
// with V star specks, pixel clouds, and broken terminal silhouettes at the
// horizon) — hand-typing 270x480 grids is infeasible, so deterministic
// generators build them at module load. A permanent integrity test
// (art/tiles.test.ts) parses every frame and checks palette membership.

// --- 16x16 gameplay tiles ---------------------------------------------------

// Solid ground: bright grass lip (G/g) over a speckled dirt body (h/F).
const GROUND = frame(`
  GGGGGGGGGGGGGGGG
  gGGgGGGgGGgGGGgG
  GggGGgGGgGGgGGgg
  gggggggggggggggg
  hhFhhhhFhhhhhFhh
  hhhhhFhhhhhFhhhh
  FhhhhhhhhFhhhhhh
  hhhhFhhhhhhhhFhh
  hhhhhhhFhhhhhhhh
  hFhhhhhhhhhFhhhh
  hhhhhhFhhhhhhhhF
  hhFhhhhhhhFhhhhh
  hhhhhhhhFhhhhhhh
  FhhhhhFhhhhhhhFh
  hhhhhhhhhhFhhhhh
  hhFhhhhhhhhhhhFh
`);

// One-way platform lip: a thin grass ledge over a shallow dirt underside,
// then transparent. Only its top face blocks (set in the scene).
const ONEWAY = frame(`
  GGGGGGGGGGGGGGGG
  gggggggggggggggg
  hFhFhFhFhFhFhFhF
  .h.h..h.h..h.h..
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

// Hazard: red glitch spikes (R bright edge, r inner, X dark base band).
const HAZARD = frame(`
  ................
  ................
  ..R.........R...
  ..R....R....R...
  .RRR..RRR..RRR..
  .RRR..RRR..RRR..
  RRrRRRRrRRRRrRR.
  RRrRRRRrRRRRrRR.
  RrrRRRrrRRRrrRR.
  RrrRRRrrRRRrrRR.
  rrXrrrrXrrrrXrr.
  rrXrrrrXrrrrXrr.
  XXXXXXXXXXXXXXXX
  XXXXXXXXXXXXXXXX
  rXrXrXrXrXrXrXrX
  XrXrXrXrXrXrXrXr
`);

export const FIELDS_GROUND: SpriteDef = {
  key: "tile-fields-ground",
  w: 16,
  h: 16,
  frames: [GROUND],
};

export const FIELDS_ONEWAY: SpriteDef = {
  key: "tile-fields-oneway",
  w: 16,
  h: 16,
  frames: [ONEWAY],
};

export const FIELDS_HAZARD: SpriteDef = {
  key: "tile-fields-hazard",
  w: 16,
  h: 16,
  frames: [HAZARD],
};

// --- parallax backdrop (480x270) --------------------------------------------

const BG_W = 480;
const BG_H = 270;
// Horizon = the level's floor line (8 tiles * 16px). Clouds/terminals live
// above it so they read against the sky (the opaque ground covers below).
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

// Layer 0: dithered vertical gradient sky N (top) -> K (bottom) + V stars.
function skyRows(): string[] {
  const rows: string[] = [];
  for (let y = 0; y < BG_H; y++) {
    const t = y / (BG_H - 1); // 0 top .. 1 bottom
    let row = "";
    for (let x = 0; x < BG_W; x++) {
      let ch = hash(x, y) % 100 < t * 100 ? "K" : "N";
      // Sparse star specks in the upper half only.
      if (y < BG_H * 0.5 && hash(x * 3 + 1, y * 7 + 2) % 811 === 0) ch = "V";
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

// Layer 1: a few blocky pixel clouds (C top-lit, c underside). Transparent
// elsewhere; features kept off the tile seam (x = 0 / BG_W-1).
function cloudRows(): string[] {
  const g = blank();
  const clouds = [
    { x: 70, y: 46, w: 64, h: 18 },
    { x: 210, y: 30, w: 84, h: 22 },
    { x: 350, y: 66, w: 52, h: 15 },
  ];
  for (const c of clouds) {
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    for (let y = c.y; y < c.y + c.h; y++) {
      for (let x = c.x; x < c.x + c.w; x++) {
        const dx = (x - cx) / (c.w / 2);
        const dy = (y - cy) / (c.h / 2);
        if (dx * dx + dy * dy > 1) continue; // rounded blob
        g[y][x] = y < c.y + c.h * 0.4 ? "C" : "c";
      }
    }
  }
  return g.map((r) => r.join(""));
}

// Layer 2: broken terminal / server silhouettes along the horizon (k body,
// D lit windows), with occasional glitched-out pixels.
function terminalRows(): string[] {
  const g = blank();
  let x = 0;
  while (x < BG_W) {
    const bw = 16 + (hash(x, 7) % 24); // 16..39 wide
    const bh = 34 + (hash(x, 13) % 56); // 34..89 tall
    const top = HORIZON_Y - bh;
    for (let y = top; y < HORIZON_Y; y++) {
      for (let xx = x; xx < Math.min(x + bw, BG_W); xx++) {
        if (y < 0) continue;
        if (hash(xx, y) % 31 === 0) continue; // glitch dropout
        g[y][xx] = (xx + y) % 6 === 0 ? "D" : "k"; // window flecks
      }
    }
    x += bw + 2 + (hash(x, 3) % 6);
  }
  return g.map((r) => r.join(""));
}

export const FIELDS_BG0: SpriteDef = { key: "bg-fields-0", w: BG_W, h: BG_H, frames: [skyRows()] };
export const FIELDS_BG1: SpriteDef = { key: "bg-fields-1", w: BG_W, h: BG_H, frames: [cloudRows()] };
export const FIELDS_BG2: SpriteDef = { key: "bg-fields-2", w: BG_W, h: BG_H, frames: [terminalRows()] };

// --- registry ---------------------------------------------------------------

export const FIELDS_TILES: SpriteDef[] = [FIELDS_GROUND, FIELDS_ONEWAY, FIELDS_HAZARD];
export const FIELDS_PARALLAX: SpriteDef[] = [FIELDS_BG0, FIELDS_BG1, FIELDS_BG2];

/** Parallax + tile SpriteDefs for a level theme. Only "fields" exists today;
 *  later worlds add their own tileset modules behind this switch. */
export function tilesetFor(_theme: LevelDefinition["theme"]): SpriteDef[] {
  return [...FIELDS_PARALLAX, ...FIELDS_TILES];
}
