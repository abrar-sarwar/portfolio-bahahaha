import { frame } from "../grid";
import type { SpriteDef } from "../textures";
import type { OverNodeId } from "../../scenes/overworldLogic";

// Overworld map art: the winding-path furniture that turns five levels into a
// visible progression. Node discs and the castle silhouette are deterministic
// code-generated grids (a clean circle / a many-windowed keep are infeasible to
// hand-type pixel-accurately, same rationale as the parallax layers); the
// smaller icons (path dot, flag, gate, gallery book, chibi map-player) are
// hand-authored frame() grids. Every def is added to the art integrity tests
// (art/tiles.test.ts + the animated map-player in art/grid.test.ts).

// ── generators ──────────────────────────────────────────────────────────────

/** A lit map-node disc: bright rim, mid body, a top-left highlight and a
 *  bottom-right shadow so it reads as a raised button under top-left light. */
function disc(size: number, bright: string, mid: string, dark: string): string[] {
  const c = (size - 1) / 2;
  const r = size / 2 - 0.5;
  const rows: string[] = [];
  for (let y = 0; y < size; y++) {
    let row = "";
    for (let x = 0; x < size; x++) {
      const dx = x - c;
      const dy = y - c;
      const dist = Math.hypot(dx, dy);
      if (dist > r + 0.35) {
        row += ".";
      } else if (dist > r - 1.0) {
        row += bright; // rim
      } else if (dx + dy < -2.0) {
        row += bright; // top-left highlight
      } else if (dx + dy > 2.6) {
        row += dark; // bottom-right shadow
      } else {
        row += mid;
      }
    }
    rows.push(row);
  }
  return rows;
}

/** The far-right castle keep silhouette (64×48): three crenellated towers over
 *  a curtain wall with an arched gate, K body, O deep-shadow/outline, X base
 *  band, R lit window glints. Generated so the battlements + windows stay
 *  crisp and reproducible for the integrity test. */
function castleKeep(): string[] {
  const W = 64;
  const H = 48;
  const g: string[][] = Array.from({ length: H }, () => Array<string>(W).fill("."));

  const wallTop = 20;
  // Curtain wall body.
  for (let y = wallTop; y < H; y++) {
    for (let x = 4; x < W - 4; x++) g[y][x] = "K";
  }
  // Towers: [x0, x1, topY]. Center tower is tallest.
  const towers: [number, number, number][] = [
    [2, 16, 12],
    [24, 40, 4],
    [48, 62, 12],
  ];
  for (const [x0, x1, topY] of towers) {
    for (let y = topY; y < H; y++) {
      for (let x = x0; x < x1; x++) g[y][x] = "K";
    }
    // Crenellations: notch every 4px across the tower crown.
    for (let x = x0; x < x1; x++) {
      if (Math.floor((x - x0) / 3) % 2 === 1) {
        g[topY][x] = ".";
        if (topY + 1 < H) g[topY + 1][x] = ".";
      }
    }
  }
  // Outline / deep shadow along the left edge and the very base band.
  for (let y = wallTop; y < H; y++) g[y][4] = "O";
  for (const [x0, , topY] of towers) for (let y = topY; y < H; y++) g[y][x0] = "O";
  for (let x = 4; x < W - 4; x++) {
    g[H - 1][x] = "X";
    g[H - 2][x] = "X";
  }
  // Arched gate (dark O) centered at the wall base.
  const gx = 28;
  const gw = 8;
  for (let y = H - 12; y < H; y++) {
    for (let x = gx; x < gx + gw; x++) {
      // round the arch top
      const dy = y - (H - 12);
      const inset = dy < 2 ? 2 - dy : 0;
      if (x >= gx + inset && x < gx + gw - inset) g[y][x] = "O";
    }
  }
  // Lit window glints (R): a scatter across the towers.
  const windows: [number, number][] = [
    [8, 24], [11, 30], [30, 12], [34, 18], [30, 24], [54, 24], [57, 30], [8, 34], [54, 34],
  ];
  for (const [x, y] of windows) if (g[y] && g[y][x] === "K") g[y][x] = "R";

  return g.map((r) => r.join(""));
}

// ── hand-authored icons ───────────────────────────────────────────────────────

// path stud 8×8 — a small raised dot connecting nodes (c rim, d core).
const PATH_DOT = frame(`
  ........
  ..cccc..
  .cddddc.
  .cddddc.
  .cddddc.
  .cddddc.
  ..cccc..
  ........
`);

// checkpoint-style flag 8×12 planted on a completed node (d pole, V pennant
// with a v shade fold).
const FLAG = frame(`
  .d......
  .dVVVVV.
  .dVVVVVV
  .dVvvvVV
  .dVVVVVV
  .dVVVVV.
  .d......
  .d......
  .d......
  .d......
  .dd.....
  cccc....
`);

// padlock gate 10×12 for locked nodes (d shackle, D body, K keyhole).
const GATE = frame(`
  ...dd.....
  ..d..d....
  ..d..d....
  .dDDDDDD..
  .dDDDDDD..
  .dDDKDDD..
  .dDDKDDD..
  .dDDDDDD..
  .dDDDDDD..
  .dDDDDDD..
  ..........
  ..........
`);

// gallery "archive" node 12×12 — an open golden book (Y cover, y spine/edges,
// W pages, k inner rule) that only appears once the game is beaten.
const BOOK = frame(`
  ............
  .YYYYYYYYYY.
  .YyWWYYWWyY.
  .YyWkYYkWyY.
  .YyWWYYWWyY.
  .YyWWYYWWyY.
  .YyWkYYkWyY.
  .YyWWYYWWyY.
  .YyWWYYWWyY.
  .YyWkYYkWyY.
  .YYYYYYYYYY.
  ............
`);

// ── chibi map-player (Abrar) 12×16, 2-frame walk ──────────────────────────────
// On-model: H/h dark wavy hair, O sunglasses band, S/s tan skin, K black fit,
// W sneaker soles. Two frames swap the stride so the walk reads (and satisfies
// the no-duplicate-frame integrity check).
const MAP_WALK_0 = frame(`
  ...HHHHHH...
  ..HHHHHHHH..
  ..HhSSSShH..
  ..HSSSSSSH..
  ..OOOOOOOO..
  ..hSSSSSSh..
  ...SSSSSS...
  ...KKCCKK...
  ..KKKKKKKK..
  ..KKKKKKKK..
  ..KKKKKKKK..
  ...KKKKKK...
  ...KK.KKk...
  ..KKk..KK...
  ..WW....k...
  ..WWW.......
`);

const MAP_WALK_1 = frame(`
  ...HHHHHH...
  ..HHHHHHHH..
  ..HhSSSShH..
  ..HSSSSSSH..
  ..OOOOOOOO..
  ..hSSSSSSh..
  ...SSSSSS...
  ...KKCCKK...
  ..KKKKKKKK..
  ..KKKKKKKK..
  ..KKKKKKKK..
  ...KKKKKK...
  ...kKKKK....
  ...KK..kKK..
  ...k....WW..
  .......WWW..
`);

// ── SpriteDefs ────────────────────────────────────────────────────────────────

export const OW_PATH_DOT: SpriteDef = { key: "overworld-path-dot", w: 8, h: 8, frames: [PATH_DOT] };
export const OW_FLAG: SpriteDef = { key: "overworld-flag", w: 8, h: 12, frames: [FLAG] };
export const OW_GATE: SpriteDef = { key: "overworld-gate", w: 10, h: 12, frames: [GATE] };
export const OW_BOOK: SpriteDef = { key: "overworld-book", w: 12, h: 12, frames: [BOOK] };
export const OW_CASTLE: SpriteDef = { key: "overworld-castle", w: 64, h: 48, frames: [castleKeep()] };

export const OW_DISC_FIELDS: SpriteDef = { key: "overworld-disc-fields", w: 12, h: 12, frames: [disc(12, "G", "g", "F")] };
export const OW_DISC_HARBOR: SpriteDef = { key: "overworld-disc-harbor", w: 12, h: 12, frames: [disc(12, "T", "t", "N")] };
export const OW_DISC_FACTORY: SpriteDef = { key: "overworld-disc-factory", w: 12, h: 12, frames: [disc(12, "M", "m", "L")] };
export const OW_DISC_ARCHIVE: SpriteDef = { key: "overworld-disc-archive", w: 12, h: 12, frames: [disc(12, "P", "p", "k")] };
export const OW_DISC_CASTLE: SpriteDef = { key: "overworld-disc-castle", w: 12, h: 12, frames: [disc(12, "R", "r", "X")] };

export const OW_MAP_PLAYER: SpriteDef = {
  key: "overworld-map-player",
  w: 12,
  h: 16,
  frames: [MAP_WALK_0, MAP_WALK_1],
  anims: [{ key: "walk", frames: [0, 1], frameRate: 6, repeat: -1 }],
};

/** Bare disc-texture key for a level/castle node. The gallery archive node uses
 *  its own book art (OW_BOOK), not a disc. */
export function nodeDiscKey(id: OverNodeId): string {
  switch (id) {
    case "1-1": return OW_DISC_FIELDS.key;
    case "1-2": return OW_DISC_HARBOR.key;
    case "1-3": return OW_DISC_FACTORY.key;
    case "1-4": return OW_DISC_ARCHIVE.key;
    case "castle": return OW_DISC_CASTLE.key;
    case "archive": return OW_BOOK.key;
  }
}

/** Every single-frame overworld def (for registerSprites + the tile integrity
 *  test). The animated map-player is registered/tested separately. */
export const OVERWORLD_TILES: SpriteDef[] = [
  OW_PATH_DOT,
  OW_FLAG,
  OW_GATE,
  OW_BOOK,
  OW_CASTLE,
  OW_DISC_FIELDS,
  OW_DISC_HARBOR,
  OW_DISC_FACTORY,
  OW_DISC_ARCHIVE,
  OW_DISC_CASTLE,
];

/** Everything the OverworldScene registers (tiles + the animated chibi). */
export const OVERWORLD_SPRITES: SpriteDef[] = [...OVERWORLD_TILES, OW_MAP_PLAYER];
