import { frame } from "../grid";
import type { SpriteDef } from "../textures";

// World-1-2 "Phishing Harbor" tileset + parallax backdrop (night harbor).
//
// The gameplay tiles are hand-authored pixel grids (plank-lipped dock
// ground, a jump-through dock ledge, an animated code-water hazard, and an
// animated gold-shimmer fake ledge lure), plus a 32x16 boat platform. The
// three parallax layers are 480x270 and code-generated (a dithered N->K
// night sky with star specks + a moon disc, a teal wave band, and mast/crane
// silhouettes along the horizon) — hand-typing 270x480 grids is infeasible,
// so deterministic generators build them at module load. A permanent
// integrity test (art/tiles.test.ts) parses every frame and checks palette
// membership.

// --- 16x16 / 32x16 gameplay tiles -------------------------------------------

// Solid dock crown: lit plank top (P highlight, p body, h board seams) over a
// darker wood/piling body (h base with D piling posts, d speckle).
const GROUND = frame(`
  PPPhPPPhPPPhPPPh
  ppphppphppphppph
  ppphppphppphppph
  hhhhhhhhhhhhhhhh
  hhDDhhhhhhhDDhhh
  hhDDhdhhhhhDDhhh
  hhDDhhhhdhhDDhhh
  hhDDhhhhhhhDDdhh
  dhDDhhhhhhhDDhhh
  hhDDhhdhhhhDDhhh
  hhDDhhhhhhhDDhhd
  hhDDhdhhhhhDDhhh
  hhDDhhhhhhhDDhhh
  hhDDhhhhdhhDDhhh
  hhDDhhhhhhhDDhhh
  hhDDhdhhhhhDDhhh
`);

// Ground fill: the same dark wood/piling body as GROUND but with NO bright
// plank lip — a stacked column of solids only shows planks on its exposed
// crown (GROUND), not a stripe partway down. Same h/D/d piling chars as
// GROUND's body so the seam where GROUND meets a fill tile below is
// continuous.
const GROUND_FILL = frame(`
  hhDDhhhhhhhDDhhh
  hhDDhdhhhhhDDhhh
  hhDDhhhhdhhDDhhh
  hhDDhhhhhhhDDdhh
  dhDDhhhhhhhDDhhh
  hhDDhhdhhhhDDhhh
  hhDDhhhhhhhDDhhd
  hhDDhdhhhhhDDhhh
  hhDDhhhhhhhDDhhh
  hhDDhhhhdhhDDhhh
  hhDDhhhhhhhDDhhh
  hhDDhdhhhhhDDhhh
  hhDDhhhhdhhDDhhh
  dhDDhhhhhhhDDhhh
  hhDDhhhhhhhDDhhd
  hhDDhdhhhhhDDhhh
`);

// One-way dock ledge: a thin plank lip (P/p, h seams + underside) in the top
// 3 rows only, then transparent. Only its top face blocks (set in the
// scene) — a jump-through platform over open air or water.
const ONEWAY = frame(`
  PPPhPPPhPPPhPPPh
  ppphppphppphppph
  hhhhhhhhhhhhhhhh
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

// Water hazard, frame 0: deep navy base (N), mid ripple bands (b), bright
// glints (B) sprinkled like stray bits on the surface. Two rows of ripple
// band per group (crest N-lit / trough b), four groups down the tile.
const WATER_0 = frame(`
  NNNNNNNNNNNNNNNN
  NNNBNNNNNNBNNNNN
  NbbNNNbbNNNbbNNN
  NNbbNNNbbNNNbbNN
  NNNNNNNNNNNNNNNN
  NNNNNNNNNNNNNNNN
  NbbNNNbbNNNbbNNN
  NNbbNNNbbNNNbbNN
  NNNNNNNNNNNNNNNN
  NNNNBNNNNNNNBNNN
  NbbNNNbbNNNbbNNN
  NNbbNNNbbNNNbbNN
  NNNNNNNNNNNNNNNN
  NNNNNNNNNNNNNNNN
  NbbNNNbbNNNbbNNN
  NNbbNNNbbNNNbbNN
`);

// Water hazard, frame 1: ripple bands shifted right + glints relocated, so
// the "wave" anim reads as gentle rightward motion + a shimmer flicker.
const WATER_1 = frame(`
  NNNNNNNNNNNNNNNN
  NNNNNBNNNNNNNBNN
  NNNbbNNNbbNNNbbN
  NNNNbbNNNbbNNNbb
  NNNNNNNNNNNNNNNN
  NNNNNNNNNNNNNNNN
  NNNbbNNNbbNNNbbN
  NNNNbbNNNbbNNNbb
  NNNNNNNNNNNNNNNN
  NNBNNNNNBNNNNNNN
  NNNbbNNNbbNNNbbN
  NNNNbbNNNbbNNNbb
  NNNNNNNNNNNNNNNN
  NNNNNNNNNNNNNNNN
  NNNbbNNNbbNNNbbN
  NNNNbbNNNbbNNNbb
`);

// Gold-shimmer fake ledge (phishing lure), frame 0: looks like a plank
// one-way ledge but rendered in gold (Y/y) with a stray white (W) sparkle —
// only the top 5 rows are opaque, matching ONEWAY's silhouette so it reads
// as an enticing platform at a glance.
const FAKE_0 = frame(`
  YWYyYYYyYYYyYYYy
  yyyyyyyyyyyyyyyy
  YYYyYYYyYYYyYYYy
  yyyyyyyyyyWyyyyy
  yyyyyyyyyyyyyyyy
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

// Gold-shimmer fake ledge, frame 1: the sparkle relocates so the "shimmer"
// anim reads as a glint traveling across the gold lip.
const FAKE_1 = frame(`
  YYYyYYYyYYYyYYYy
  yyyyyyWyyyyyyyyy
  YYYyYYYyYYYyYYYy
  yyyyyyyyyyyyyyyy
  yyyyyyyyyyyyyWyy
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

// Small barge/boat platform, 32x16: flat plank deck (P/p, h seams) across the
// top 2 rows is the ride surface, an open cargo hold below (h fill, T teal
// gunwale trim, a Y/y crate) fills the mid rows, and a curved wooden hull
// (p planks, h keel) tapers to a point at the bottom.
const BOAT = frame(`
  .PPPPPhPPPPPhPPPPPhPPPPPhPPPPPh.
  .ppppphppppphppppphppppphppppph.
  .ThhhhhhhhhhhhhhhhhhhhhhhhhhhhT.
  .ThhhhhhhhhhhhhhhhhhhhhhhhhhhhT.
  .ThhhhhhhhhhhhYYYYhhhhhhhhhhhhT.
  .ThhhhhhhhhhhhyyyyhhhhhhhhhhhhT.
  .ThhhhhhhhhhhhyyyyhhhhhhhhhhhhT.
  .ThhhhhhhhhhhhhhhhhhhhhhhhhhhhT.
  .ppphppphppphppphppphppphppphpp.
  ..ppphppphppphppphppphppphppph..
  ...ppphppphppphppphppphppphpp...
  ....ppphppphppphppphppphppph....
  .....ppphppphppphppphppphpp.....
  .......ppphppphppphppphpp.......
  .........ppphppphppphpp.........
  ............hhhhhhhh............
`);

export const HARBOR_GROUND: SpriteDef = {
  key: "tile-harbor-ground",
  w: 16,
  h: 16,
  frames: [GROUND],
};

export const HARBOR_GROUND_FILL: SpriteDef = {
  key: "tile-harbor-ground-fill",
  w: 16,
  h: 16,
  frames: [GROUND_FILL],
};

export const HARBOR_ONEWAY: SpriteDef = {
  key: "tile-harbor-oneway",
  w: 16,
  h: 16,
  frames: [ONEWAY],
};

export const HARBOR_WATER_ANIM = "wave";

export const HARBOR_WATER: SpriteDef = {
  key: "tile-harbor-water",
  w: 16,
  h: 16,
  frames: [WATER_0, WATER_1],
  anims: [{ key: HARBOR_WATER_ANIM, frames: [0, 1], frameRate: 3, repeat: -1 }],
};

export const HARBOR_FAKE_ANIM = "shimmer";

export const HARBOR_FAKE: SpriteDef = {
  key: "tile-harbor-fake",
  w: 16,
  h: 16,
  frames: [FAKE_0, FAKE_1],
  anims: [{ key: HARBOR_FAKE_ANIM, frames: [0, 1], frameRate: 4, repeat: -1 }],
};

const HARBOR_BOAT: SpriteDef = {
  key: "tile-harbor-boat",
  w: 32,
  h: 16,
  frames: [BOAT],
};

export const HARBOR_BOAT_SPRITE: SpriteDef = HARBOR_BOAT;
export const HARBOR_BOAT_KEY = HARBOR_BOAT.key;

// --- parallax backdrop (480x270) --------------------------------------------

const BG_W = 480;
const BG_H = 270;
// Horizon = the level's floor line (8 tiles * 16px). Masts/cranes live above
// it so they read against the sky (the opaque dock covers below).
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

// Layer 0: dithered vertical gradient night sky N (top) -> K (bottom), sparse
// V/W star specks in the upper half, and a single gold (Y) moon disc.
function skyRows(): string[] {
  const moonCx = 380;
  const moonCy = 46;
  const moonR = 16;
  const rows: string[] = [];
  for (let y = 0; y < BG_H; y++) {
    const t = y / (BG_H - 1); // 0 top .. 1 bottom
    let row = "";
    for (let x = 0; x < BG_W; x++) {
      let ch = hash(x, y) % 100 < t * 100 ? "K" : "N";
      // Sparse star specks in the upper half only (mostly W, occasional V).
      if (y < BG_H * 0.55) {
        const starRoll = hash(x * 3 + 1, y * 7 + 2) % 900;
        if (starRoll === 0) ch = "W";
        else if (starRoll === 1) ch = "V";
      }
      const dx = x - moonCx;
      const dy = y - moonCy;
      if (dx * dx + dy * dy <= moonR * moonR) ch = "Y";
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

// Layer 1: a horizontal wave band of teal ripples (T crest, t trough) across
// the lower-middle of the frame, transparent elsewhere. Several thick,
// sine-offset swells stacked with small gaps between them so the band reads
// as rolling water rather than thin crossing wires.
function waveRows(): string[] {
  const g = blank();
  const top = 150;
  const bandCount = 5;
  const bandStep = 10; // vertical spacing between swell tops
  for (let i = 0; i < bandCount; i++) {
    const baseY = top + i * bandStep;
    const amp = 1 + (i % 2); // gentle wobble, stays inside its own band step
    const freq = 0.03 + (i % 3) * 0.006;
    const phase = i * 41;
    const thickness = 6; // fills most of the 10px step, leaving a thin transparent gap
    for (let x = 0; x < BG_W; x++) {
      const yOff = Math.round(Math.sin((x + phase) * freq) * amp);
      const y0 = Math.round(baseY) + yOff;
      for (let dy = 0; dy < thickness; dy++) {
        const y = y0 + dy;
        if (y < 0 || y >= BG_H) continue;
        g[y][x] = dy < thickness - 1 ? "T" : "t"; // bright crest, dark trough edge
      }
    }
  }
  return g.map((r) => r.join(""));
}

// Layer 2: mast/crane silhouettes along the horizon (k body, K spars, D lit
// windows/lanterns). Plain masts (2px pole + a crow's-nest block + 2px-thick
// yardarm spars) alternate with blockier dock cranes (2px support posts + a
// jib arm + a small lit cabin). Poles/spars are drawn 2px thick so the
// silhouettes stay readable at low contrast against the night sky, matching
// the chunkiness of Bug Fields' terminal-block skyline.
function mastRows(): string[] {
  const g = blank();
  let x = 0;
  while (x < BG_W) {
    const isCrane = hash(x, 11) % 3 === 0;
    if (isCrane) {
      const baseH = 70 + (hash(x, 5) % 40); // 70..109
      const top = HORIZON_Y - baseH;
      const cx = x + 2;
      for (let y = Math.max(0, top); y < HORIZON_Y; y++) {
        for (let dx = 0; dx < 2; dx++) if (cx + dx < BG_W) g[y][cx + dx] = "k";
      }
      const armLen = 24 + (hash(x, 9) % 24);
      const armY = top + 4;
      for (let dy = 0; dy < 2; dy++) {
        const y = armY + dy;
        if (y < 0 || y >= BG_H) continue;
        for (let xx = cx; xx < Math.min(cx + armLen, BG_W); xx++) g[y][xx] = "K";
      }
      for (let yy = Math.max(0, top + 6); yy < top + 14; yy++) {
        for (let xx = Math.max(0, cx - 3); xx < Math.min(cx + 7, BG_W); xx++) {
          g[yy][xx] = xx === cx + 1 && yy === top + 10 ? "D" : "k";
        }
      }
      x += 10 + (hash(x, 3) % 10);
    } else {
      const h = 50 + (hash(x, 13) % 50); // 50..99
      const top = HORIZON_Y - h;
      for (let y = Math.max(0, top); y < HORIZON_Y; y++) {
        if (hash(x, y) % 41 === 0) continue; // slight glitch dropout
        g[y][x] = "k";
        if (x + 1 < BG_W) g[y][x + 1] = "k";
      }
      const sparY1 = top + 8;
      const sparLen = 12 + (hash(x, 17) % 12);
      for (let dy = 0; dy < 2; dy++) {
        const y = sparY1 + dy;
        if (y < 0 || y >= BG_H) continue;
        for (let xx = Math.max(0, x - sparLen); xx <= Math.min(BG_W - 1, x + sparLen); xx++)
          g[y][xx] = "K";
      }
      if (h > 70) {
        const sparY2 = top + 22;
        const sparLen2 = 8 + (hash(x, 19) % 8);
        for (let dy = 0; dy < 2; dy++) {
          const y = sparY2 + dy;
          if (y < 0 || y >= BG_H) continue;
          for (let xx = Math.max(0, x - sparLen2); xx <= Math.min(BG_W - 1, x + sparLen2); xx++)
            g[y][xx] = "K";
        }
      }
      for (let yy = Math.max(0, top); yy < top + 4; yy++) {
        for (let xx = Math.max(0, x - 2); xx < Math.min(x + 4, BG_W); xx++) g[yy][xx] = "k";
      }
      if (hash(x, 23) % 4 === 0) {
        const wy = HORIZON_Y - 6;
        if (wy >= 0 && wy < BG_H) g[wy][x] = "D";
      }
      x += 20 + (hash(x, 29) % 26); // 20..45 gap between masts
    }
  }
  return g.map((r) => r.join(""));
}

export const HARBOR_BG0: SpriteDef = { key: "bg-harbor-0", w: BG_W, h: BG_H, frames: [skyRows()] };
export const HARBOR_BG1: SpriteDef = { key: "bg-harbor-1", w: BG_W, h: BG_H, frames: [waveRows()] };
export const HARBOR_BG2: SpriteDef = { key: "bg-harbor-2", w: BG_W, h: BG_H, frames: [mastRows()] };

// --- registry ---------------------------------------------------------------

export const HARBOR_TILES: SpriteDef[] = [
  HARBOR_GROUND,
  HARBOR_GROUND_FILL,
  HARBOR_ONEWAY,
  HARBOR_WATER,
  HARBOR_FAKE,
];
export const HARBOR_PARALLAX: SpriteDef[] = [HARBOR_BG0, HARBOR_BG1, HARBOR_BG2];

// Single source of truth for the BARE texture keys the scene references (each
// resolves to a single-frame SpriteDef, aliased by registerSprites/bareKeyFor,
// except water/fake which are multi-frame animated tiles addressed by anim
// key). Shared by the scene and the integrity test so the strings can't drift.
export const HARBOR_TILE_KEYS = {
  ground: HARBOR_GROUND.key,
  groundFill: HARBOR_GROUND_FILL.key,
  oneWay: HARBOR_ONEWAY.key,
  water: HARBOR_WATER.key,
  fake: HARBOR_FAKE.key,
} as const;

export const HARBOR_PARALLAX_KEYS = {
  bg0: HARBOR_BG0.key,
  bg1: HARBOR_BG1.key,
  bg2: HARBOR_BG2.key,
} as const;
