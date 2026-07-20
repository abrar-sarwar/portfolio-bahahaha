import { frame } from "../grid";
import type { SpriteDef } from "../textures";

// World-1-4 "The Corrupted Archive" tileset + parallax backdrop.
//
// A sepia library of unfinished stories: warm wooden bookshelf plates (p/P/h),
// fluttering floating-page platforms (W/c — the one-way / fake / rotator arms),
// and pools of corrupt ink (X/r) as the hazard. The three parallax layers are
// 480x270 and code-generated (a sepia dusk gradient with drifting page motes,
// unfinished manga-panel silhouettes carrying the four verb glyphs that hint
// the boss order, and a foreground shelf/mote layer) — hand-typing 270x480
// grids is infeasible, so deterministic generators build them at module load.
// A permanent integrity test (art/tiles.test.ts) parses every frame and checks
// palette membership.

// --- 16x16 gameplay tiles ---------------------------------------------------

// Solid bookshelf plank: a lit P crown lip over a p wood body flecked with h
// grain knots. Mirrors FACTORY_GROUND's lit-crown-over-darker-body idea.
const GROUND = frame(`
  PPPPPPPPPPPPPPPP
  PppppppppppppppP
  ppphpppppppphppp
  pppppppppppppppp
  phpppppppphppppp
  pppppppppppppppp
  ppppphpppppppppp
  pppppppppppphppp
  pphppppppppppppp
  pppppppphpppppph
  pppppppppppppppp
  phppphpppppppppp
  ppppppppphppppph
  pppppppppppppppp
  pppphpppppppppph
  ppppppppppphpppp
`);

// Ground fill: the same p wood body / h grain as GROUND but with NO lit crown
// lip — a stacked column shows the highlight only on its exposed top.
const GROUND_FILL = frame(`
  ppphpppppppphppp
  pppppppppppppppp
  phpppppppphppppp
  pppppppppppppppp
  ppppphpppppppppp
  pppppppppppphppp
  pphppppppppppppp
  pppppppphpppppph
  pppppppppppppppp
  phppphpppppppppp
  ppppppppphppppph
  pppppppppppppppp
  pppphpppppppppph
  ppppppppppphpppp
  phpppppppppppppp
  pppppphpppppppph
`);

// Floating page platform, frame 0: a lit W sheet with a ruled c text-line band
// and a c underside, hanging a couple of ink drips. Only the top face blocks
// (set in the scene) — the archive's one-way, fake, and rotator-arm tile. The
// page sits in the upper rows so a rider stands on its crown.
const PAGE_0 = frame(`
  WWWWWWWWWWWWWWWW
  WWWWWWWWWWWWWWWW
  WcWcWcWcWcWcWcWc
  cccccccccccccccc
  ....cc....cc....
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

// Floating page, frame 1: the ruled line and drips flutter one step over so the
// sheet reads as gently turning (must differ from frame 0).
const PAGE_1 = frame(`
  WWWWWWWWWWWWWWWW
  WWWWWWWWWWWWWWWW
  cWcWcWcWcWcWcWcW
  cccccccccccccccc
  ..cc....cc......
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

// Corrupt-ink hazard pool, frame 0: a dark X body skinned with r bleed on top,
// speckled with r droplets — the archive's `^` equivalent.
const INK_0 = frame(`
  rXrXrXrXrXrXrXrX
  XrrXrXrrXrXrrXrX
  rXXrXXrXXrXXrXXr
  XXXXXXXXXXXXXXXX
  XXrXXXXXrXXXXXrX
  XXXXXXXXXXXXXXXX
  XrXXXXrXXXXrXXXX
  XXXXXXXXXXXXXXXX
  XXXXrXXXXXXrXXXX
  XXXXXXXXXXXXXXXX
  XrXXXXXXrXXXXXXX
  XXXXXXXXXXXXXXXX
  XXXXXXrXXXXXrXXX
  XXXXXXXXXXXXXXXX
  XrXXXXXXXXrXXXXX
  XXXXXXXXXXXXXXXX
`);

// Corrupt-ink hazard pool, frame 1: the bleed skin and droplets shift so the
// pool reads as seeping (must differ from frame 0).
const INK_1 = frame(`
  XrXrXrXrXrXrXrXr
  rXXrXrXXrXrXXrXr
  XrrXrrXrrXrrXrrX
  XXXXXXXXXXXXXXXX
  XrXXXXrXXXXrXXXX
  XXXXXXXXXXXXXXXX
  XXrXXXXrXXXXrXXX
  XXXXXXXXXXXXXXXX
  XXXrXXXXXrXXXXXX
  XXXXXXXXXXXXXXXX
  XXrXXXXrXXXXXXrX
  XXXXXXXXXXXXXXXX
  XrXXXXXXrXXXXXXX
  XXXXXXXXXXXXXXXX
  XXXrXXXXXXrXXXXX
  XXXXXXXXXXXXXXXX
`);

export const ARCHIVE_GROUND: SpriteDef = { key: "tile-archive-ground", w: 16, h: 16, frames: [GROUND] };
export const ARCHIVE_GROUND_FILL: SpriteDef = { key: "tile-archive-ground-fill", w: 16, h: 16, frames: [GROUND_FILL] };

export const ARCHIVE_PAGE_ANIM = "flutter";
export const ARCHIVE_PAGE: SpriteDef = {
  key: "tile-archive-page",
  w: 16,
  h: 16,
  frames: [PAGE_0, PAGE_1],
  anims: [{ key: ARCHIVE_PAGE_ANIM, frames: [0, 1], frameRate: 3, repeat: -1 }],
};

export const ARCHIVE_INK_ANIM = "seep";
export const ARCHIVE_INK: SpriteDef = {
  key: "tile-archive-ink",
  w: 16,
  h: 16,
  frames: [INK_0, INK_1],
  anims: [{ key: ARCHIVE_INK_ANIM, frames: [0, 1], frameRate: 3, repeat: -1 }],
};

// --- parallax backdrop (480x270) --------------------------------------------

const BG_W = 480;
const BG_H = 270;
const HORIZON_Y = 150;

/** Deterministic 2D hash -> unsigned int (stable generated art; no Math.random
 *  at module load so the integrity test is reproducible). */
function hash(x: number, y: number): number {
  let h = (x * 73856093) ^ (y * 19349663);
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}

function blank(): string[][] {
  return Array.from({ length: BG_H }, () => Array<string>(BG_W).fill("."));
}

// A verb glyph is a tiny bitmap ('#' filled). Stamped scaled ×SCALE into the
// panel layer so the four together spell the boss order across the mid distance:
// EYE (see / ANALYZE) -> SHIELD (hold / DEFEND) -> LOOP (recall / REMEMBER) ->
// SPARK (begin / CREATE). Read left-to-right, they are the clue in the walls.
const EYE = [
  "...######...",
  "..#......#..",
  ".#..####..#.",
  "#..######..#",
  ".#..####..#.",
  "..#......#..",
  "...######...",
];
const SHIELD = [
  "###########",
  "#.........#",
  "#.........#",
  ".#.......#.",
  ".#.......#.",
  "..#.....#..",
  "...#...#...",
  "....#.#....",
  ".....#.....",
];
const LOOP = [
  ".#######.",
  "#.......#",
  "#.#####.#",
  "#.#...#.#",
  "#.#.#.#.#",
  "#.#...#.#",
  "#.#####.#",
  "#.......#",
  ".#######.",
];
const SPARK = [
  "....#....",
  "..#.#.#..",
  "...###...",
  "#########",
  "...###...",
  "..#.#.#..",
  "....#....",
];

function stampGlyph(g: string[][], ox: number, oy: number, bitmap: string[], ch: string, scale: number) {
  for (let y = 0; y < bitmap.length; y++) {
    for (let x = 0; x < bitmap[y].length; x++) {
      if (bitmap[y][x] !== "#") continue;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = ox + x * scale + sx;
          const py = oy + y * scale + sy;
          if (px >= 0 && px < BG_W && py >= 0 && py < BG_H) g[py][px] = ch;
        }
      }
    }
  }
}

// Layer 0: sepia dusk gradient (dark O/K crown fading down to warm p/P library
// haze), dithered per-pixel by hash, with sparse pale page motes drifting in
// the mid band.
function duskRows(): string[] {
  const stops = ["O", "K", "k", "D", "p", "P"]; // top -> bottom
  const rows: string[] = [];
  for (let y = 0; y < BG_H; y++) {
    const t = y / (BG_H - 1);
    const f = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(f));
    const frac = f - i;
    let row = "";
    for (let x = 0; x < BG_W; x++) {
      let ch = hash(x, y) % 100 < frac * 100 ? stops[i + 1] : stops[i];
      if (y > BG_H * 0.25 && y < BG_H * 0.85) {
        const mote = hash(x * 7 + 1, y * 11 + 5) % 1500;
        if (mote === 0) ch = "W";
        else if (mote === 1) ch = "C";
      }
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

// Layer 1: unfinished manga-panel silhouettes — a grid of empty rectangular
// gutters (D borders over k interiors) hanging above the horizon, some crossed
// by a rough sketch diagonal. The four verb glyphs are stamped across the band
// as sepia silhouettes: the order-clue, painted into the archive itself.
function panelRows(): string[] {
  const g = blank();
  const panelYs = [22, 74];
  let idx = 0;
  for (const py of panelYs) {
    let x = 8;
    while (x < BG_W - 40) {
      const w = 40 + (hash(x, py) % 34); // 40..73 wide
      const h = 34 + (hash(x, py + 1) % 18); // 34..51 tall
      for (let yy = py; yy < Math.min(py + h, BG_H); yy++) {
        for (let xx = x; xx < Math.min(x + w, BG_W); xx++) {
          const edge = xx === x || xx === x + w - 1 || yy === py || yy === py + h - 1;
          g[yy][xx] = edge ? "D" : "k";
        }
      }
      // A rough unfinished sketch stroke across some panels.
      if (hash(x, py) % 2 === 0) {
        for (let s = 2; s < Math.min(w, h) - 2; s++) {
          const yy = py + s;
          const xx = x + s;
          if (yy < BG_H && xx < BG_W) g[yy][xx] = "d";
        }
      }
      idx++;
      x += w + 10 + (hash(x, 9) % 18);
    }
  }
  // The four verb glyphs, evenly spaced along the mid band, big enough to read.
  const gy = 108;
  stampGlyph(g, 44, gy, EYE, "p", 3);
  stampGlyph(g, 160, gy - 4, SHIELD, "p", 3);
  stampGlyph(g, 280, gy, LOOP, "p", 3);
  stampGlyph(g, 392, gy, SPARK, "p", 3);
  return g.map((r) => r.join(""));
}

// Layer 2: foreground — a low shelf silhouette line near the bottom (P lit
// board over p body) with book-spine ticks, plus a denser drift of near page
// motes (W/C) rising through the frame.
function shelfRows(): string[] {
  const g = blank();
  const shelfY = 232;
  for (let x = 0; x < BG_W; x++) {
    g[shelfY][x] = "P";
    for (let dy = 1; dy < 6; dy++) g[shelfY + dy][x] = "p";
  }
  // Book spines standing on the shelf.
  let bx = 6;
  while (bx < BG_W - 4) {
    const bw = 3 + (hash(bx, 2) % 5); // 3..7 wide
    const bh = 10 + (hash(bx, 4) % 16); // 10..25 tall
    const spine = ["h", "D", "p", "k"][hash(bx, 6) % 4];
    for (let yy = shelfY - bh; yy < shelfY; yy++) {
      for (let xx = bx; xx < Math.min(bx + bw, BG_W); xx++) {
        if (yy < 0 || yy >= BG_H) continue;
        g[yy][xx] = xx === bx ? "D" : spine;
      }
    }
    bx += bw + 1 + (hash(bx, 8) % 3);
  }
  // Near page motes drifting upward.
  for (let y = 20; y < shelfY - 6; y++) {
    for (let x = 0; x < BG_W; x++) {
      const mote = hash(x * 13 + 2, y * 5 + 9) % 900;
      if (mote === 0) g[y][x] = "W";
      else if (mote === 1) g[y][x] = "C";
    }
  }
  return g.map((r) => r.join(""));
}

export const ARCHIVE_BG0: SpriteDef = { key: "bg-archive-0", w: BG_W, h: BG_H, frames: [duskRows()] };
export const ARCHIVE_BG1: SpriteDef = { key: "bg-archive-1", w: BG_W, h: BG_H, frames: [panelRows()] };
export const ARCHIVE_BG2: SpriteDef = { key: "bg-archive-2", w: BG_W, h: BG_H, frames: [shelfRows()] };

// --- registry ---------------------------------------------------------------

export const ARCHIVE_TILES: SpriteDef[] = [ARCHIVE_GROUND, ARCHIVE_GROUND_FILL, ARCHIVE_PAGE, ARCHIVE_INK];
export const ARCHIVE_PARALLAX: SpriteDef[] = [ARCHIVE_BG0, ARCHIVE_BG1, ARCHIVE_BG2];

// Single source of truth for the bare texture keys the scene references, shared
// with the integrity test so the strings can't drift. The one-way, fake, and
// rotator-arm platforms all render the same fluttering PAGE tile (addressed by
// its animated key), so the scene renders archive one-ways as animated sprites
// (theme.oneWayAnim) rather than the static image other themes use.
export const ARCHIVE_TILE_KEYS = {
  ground: ARCHIVE_GROUND.key,
  groundFill: ARCHIVE_GROUND_FILL.key,
  page: ARCHIVE_PAGE.key,
  ink: ARCHIVE_INK.key,
} as const;

export const ARCHIVE_PARALLAX_KEYS = {
  bg0: ARCHIVE_BG0.key,
  bg1: ARCHIVE_BG1.key,
  bg2: ARCHIVE_BG2.key,
} as const;
