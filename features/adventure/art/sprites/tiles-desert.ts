// NOTE: the kit's proposed sandstone char `E` is remapped to `x` in-repo
// (`E` is the city neon magenta from tiles-city). Art pixels only.
import { frame } from "../grid";
import type { SpriteDef } from "../textures";

// World 1-2 "The Buried Heart" tileset + parallax backdrop.
//
// A DUAL-BIOME kit for the desert-descent-into-the-deep: a sand/dusk SURFACE
// (sliding dune sand, sandstone ruin blocks, excavation timber scaffold, a
// sinkhole edge) that plunges into an umber/deep-blue UNDERGROUND (rough cave
// rock, ancient tunnel brick, a crumbling floor, a stone-and-iron lift, glinting
// crystals, and the anchor rock that ties the Hollow Giant to the cave). All
// gameplay tiles are hand-authored 16x16 pixel grids; the crystal is a 2-frame
// glint anim; the crumbling floor carries 3 collapse frames (INTACT/CRACKED/
// BREAKING, scene-driven like the castle bridge). The three 480x270 parallax
// layers are code-generated deterministically (a dusk dune sky, a reduceFlash-
// safe sandstorm veil, and an underground darkness strip hiding a faint buried
// monument) — hand-typing 270x480 grids is infeasible, so generators build them
// at module load. A permanent integrity test (art/tiles.test.ts) parses every
// frame and checks palette membership.
//
// PALETTE: reuses existing chars aggressively and adds 5 new chars this world
// owns (must be added to art/palette.ts before integration):
//   A #e6d0a3 lit dune-crest sand highlight
//   E #9c6b3f weathered sandstone / ruin-block & tunnel-brick mid
//   u #4a3524 umber cave-rock body
//   n #10203a deep-blue underground gloom (darkness strip depth)
//   Q #bff2ff icy crystal sparkle highlight

// --- DESERT SURFACE 16x16 tiles ---------------------------------------------

// Sliding dune sand (solid ground; slide via the factory conveyor push): lit A
// crest over a pale P body dusted with sparse, scattered p grains and rare s pits
// — organic loose sand, no mechanical grain lines.
const SAND = frame(`
  AAAAAAAAAAAAAAAA
  PAPPPPAPPPPPAPPP
  PPPpPPPPPPsPPPPP
  pPPPPPsPPPPPPPpP
  PPPPpPPPPPPPPPPs
  PPsPPPPPpPPPPPPP
  PPPPPPPPPPPpPPPP
  PpPPPPPPsPPPPPPP
  PPPPPsPPPPPPsPPP
  PPPpPPPPPPPPPPpP
  sPPPPPPpPPPsPPPP
  PPPPpPPPPPPPPPPP
  PPPPPPPPPpPPPPsP
  PpPPPsPPPPpPPPPP
  PPPPPPPPsPPPPPPP
  pPPpPPPsPPpPPPsP
`);

// Sand fill: same organic dusting, no lit crest (a stacked column shows the crest
// only on its exposed crown). Its top row continues the body so it stacks clean.
const SAND_FILL = frame(`
  PPpPPPPPPsPPPPPP
  pPPPPPsPPPPPPPpP
  PPPPpPPPPPPPPPPs
  PPsPPPPPpPPPPPPP
  PPPPPPPPPPPpPPPP
  PpPPPPPPsPPPPPPP
  PPPPPsPPPPPPsPPP
  PPPpPPPPPPPPPPpP
  sPPPPPPpPPPsPPPP
  PPPPpPPPPPPPPPPP
  PPPPPPPPPpPPPPsP
  PpPPPsPPPPpPPPPP
  PPPPPPPPsPPPPPPP
  PPPpPPPPPPPPsPPP
  sPPPPPsPPPPPPPPP
  pPPpPPPsPPpPPPsP
`);

// Sandstone ruin block (solid ground/wall): lit S crown, warm E body, h mortar in
// running bond, weathered s/p chips. Carved masonry (contrasts with rough cave
// rock and grimier tunnel brick).
const SANDSTONE = frame(`
  SSSSSSSSSSSSSSSS
  sxxxxxxhxxxxxxxs
  xxxpxxxhxxxxxxsx
  hhhhhhhhhhhhhhhh
  xxxhxxxxxxxhxxxx
  xpxhxxxsxxxhxxxx
  hhhhhhhhhhhhhhhh
  xxxxxxxhxxxxxxxx
  xxxpxxxhxxsxxxxx
  hhhhhhhhhhhhhhhh
  xxxhxxxxxxxhxxxx
  xxxhxxpxxxxhxsxx
  hhhhhhhhhhhhhhhh
  xxxxxxxhxxxxxxxx
  xpxxxxxhxxxsxxxx
  hhhhhhhhhhhhhhhh
`);

const SANDSTONE_FILL = frame(`
  xxxhxxxxxxxhxxxx
  xpxhxxxsxxxhxxxx
  hhhhhhhhhhhhhhhh
  xxxxxxxhxxxxxxxx
  xxxpxxxhxxsxxxxx
  hhhhhhhhhhhhhhhh
  xxxhxxxxxxxhxxxx
  xxxhxxpxxxxhxsxx
  hhhhhhhhhhhhhhhh
  xxxxxxxhxxxxxxxx
  xpxxxxxhxxxsxxxx
  hhhhhhhhhhhhhhhh
  xxxhxxxxxxxhxxxx
  sxxhxxxpxxxhxxxx
  hhhhhhhhhhhhhhhh
  xxxxxxxhxxxxxxxx
`);

// Excavation timber scaffold (one-way platform): lit plank top (s/p grain with h
// nails), a plank body seamed by L plank-divisions, an H underside shadow. Rows
// 4-15 transparent — only the top face blocks (set in the scene).
const TIMBER = frame(`
  spspshspspshspsp
  pppLpppLpppLpppL
  hHhHhHhHhHhHhHhH
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

// Sinkhole edge (decor, no collision): a lit sand crust rim collapsing into a
// dark void with falling P sand specks — marks the sinkhole drop.
const SINKHOLE = frame(`
  AAAAAAAAAAAAAAAA
  PPPPPPPPPPPPPPPP
  PpPphPPPPhpPPPPp
  hHhHhHPHhHhHHhHh
  HHHHHHHHHHHHHHHH
  HOHOHHOHHOHHHOHO
  OHOPHHOHOOHOHPHO
  HOHOHHOHHOHHHOHO
  OHOHOPHOHOHOHOHO
  HHOHHOHHOHHOHHOH
  OHOPOHOHPHOHOOHO
  HOHHOHHOHHOHHOHH
  OHOHOHOHOHOPHOHO
  HOHHOHHOHHOHHOHH
  OHOHOHOHOHOHOOHO
  HHOHHOHHOHHOHHOH
`);

// --- UNDERGROUND 16x16 tiles ------------------------------------------------

// Cave rock (solid ground): rough natural umber. Lit p/s crown grains, umber u
// body, irregular h shadow speckle, sparse d mineral flecks / H deep pits. No
// mortar courses (natural, contrasts with carved tunnel brick).
const CAVE_ROCK = frame(`
  pppspppppsppppps
  puuuupuuuuupuuup
  uuhuuuuuhuuuuuhu
  uuuuuhuuuuuhuuuu
  uhuuuuuuuuhuuuuu
  uuuuhuuuuuuuuuhu
  uuuuuuuhuuuuuuuu
  huuuuuuuuuuhuuuu
  uuuuuhuuuuuuuuuu
  uuhuuuuuduuuuuuu
  uuuuuuuuuuuuHuuu
  uHuuuuhuuuuuuuuu
  uuuuuuuuuuhuuuuu
  uuuuduuuuuuuuHuu
  uuuuuuuuHuuuuuuu
  uuhuuuuuuuuuuuhu
`);

const CAVE_ROCK_FILL = frame(`
  uuuupuuuuupuuuup
  uuhuuuuuhuuuuuhu
  uuuuuhuuuuuhuuuu
  uhuuuuuuuuhuuuuu
  uuuuhuuuuuuuuuhu
  uuuuuuuhuuuuuuuu
  huuuuuuuuuuhuuuu
  uuuuuhuuuuuuuuuu
  uuhuuuuuduuuuuuu
  uuuuuuuuuuuuHuuu
  uHuuuuhuuuuuuuuu
  uuuuuuuuuuhuuuuu
  uuuuduuuuuuuuHuu
  uuuuuuuuHuuuuuuu
  uuhuuuuuuuuuuuhu
  uuuupuuuuupuuuuh
`);

// Ancient tunnel brick (solid ground/wall): carved masonry, grimier and cooler
// than the outdoor sandstone. Warm E body, k grout courses, D/h/u worn flecks.
const TUNNEL_BRICK = frame(`
  sxsxxxsxxsxxxsxx
  xxxxxxDxxxxxxDxx
  kkkkkkkkkkkkkkkk
  xxDxxxxxxxDxxxxx
  xhxxxxxsxxxDxxux
  kkkkkkkkkkkkkkkk
  xxxxxxxDxxxxxxxx
  xxuxxxxDxxhxxxxx
  kkkkkkkkkkkkkkkk
  xxDxxxxxxxDxxxxx
  xxDxxhxxxxDxsxxx
  kkkkkkkkkkkkkkkk
  xxxxxxxDxxxxxxxx
  xhxxxxxDxxxuxxxx
  kkkkkkkkkkkkkkkk
  xxxxxxxDxxxxxxxx
`);

const TUNNEL_BRICK_FILL = frame(`
  xxDxxxxxxxDxxxxx
  xhxxxxxsxxxDxxux
  kkkkkkkkkkkkkkkk
  xxxxxxxDxxxxxxxx
  xxuxxxxDxxhxxxxx
  kkkkkkkkkkkkkkkk
  xxDxxxxxxxDxxxxx
  xxDxxhxxxxDxsxxx
  kkkkkkkkkkkkkkkk
  xxxxxxxDxxxxxxxx
  xhxxxxxDxxxuxxxx
  kkkkkkkkkkkkkkkk
  xxDxxxxxxxDxxxxx
  xxuxxxsxxxxDxxxx
  kkkkkkkkkkkkkkkk
  xxxxxxxDxxxxxxxx
`);

// Crumbling cave floor (reuses collapse logic), frame 0 = INTACT: umber slab,
// lit p top.
const CRUMBLE_INTACT = frame(`
  pppppppppppppppp
  uuuuuuuuuuuuuuuu
  uuhuuuuuhuuuuuhu
  uuuuuuuuuuuuuuuu
  uuuuuhuuuuuuhuuu
  uuuuuuuuuuuuuuuu
  uhuuuuuuuuuuuuhu
  uuuuuuuuuuuuuuuu
  uuuuuhuuuuhuuuuu
  uuuuuuuuuuuuuuuu
  uuhuuuuuuuuuuhuu
  uuuuuuuuuuuuuuuu
  uuuuuhuuuuuuuuhu
  uuuuuuuuuuuuuuuu
  uhuuuuuuhuuuuuuu
  uuuuuuuuuuuuuuuu
`);

// frame 1 = CRACKED: dark K hairline cracks spider across the slab.
const CRUMBLE_CRACKED = frame(`
  pppKppppppKppppp
  uuKuuuuuuKuuuuuu
  uKhuuuuuhuKuuuhu
  uuKuuuuuKuuuKuuu
  uuuKuhuKuuuuKuuu
  uuuuKuKuuuuKuuuu
  uhuuuKuuuuKuuuuh
  uuuuKuuuuKuuuuuu
  uuuKuhuuKuhuuuuu
  uuuKuuuKuuuuuuuu
  uuKuuuuKuuuuuKuu
  uKuuuuKuuuuuuKuu
  uKuuuKuuuuuuuKuh
  Kuuuuuuuuuuuuuku
  KuuuuuuhuuuuuuKu
  uuuuuuuuuuuuuuKu
`);

// frame 2 = BREAKING: cracks open into O void gaps; chunks separate just before
// the floor drops away.
const CRUMBLE_BREAKING = frame(`
  ppKOppppOKppOppp
  uuKuOuuuKOuuOuuu
  uKhuOuuOuuKOuuhu
  uOKuuuuOuuuKOuuu
  uuOKuhOuuuuKOuuu
  uuuOKOuuuuOKuuuu
  uhuuOKuuuOKuuuuh
  uuuuOKuuuOKuuuuu
  uuuOKhuuOKhuuuuu
  uuuOKuuOKuuuuOuu
  uuKuOuuOKuuuOKuu
  uKuuOOuuuuuOuKuu
  uKuuOKuuuuuOuKuh
  KuuuOuuuuuuOuuku
  KuuuOuuhuuuOuuKu
  uuuuOuuuuuuOuuKu
`);

// Underground lift platform (one-way / vertical mover): a stone-and-iron slab.
// Lit d metal lip, E/u stone slab with Y corner rivets, k/D bottom frame. Rows
// 12-15 transparent — the top face is the stand-on surface.
const LIFT = frame(`
  dddddddddddddddd
  DdDdDdDdDdDdDdDd
  xxxxxxxxxxxxxxxx
  xuuxuuxuuxuuxuux
  xuYuuuuuuuuuuYux
  xuuuuuuuuuuuuuux
  xuuuuuuuuuuuuuux
  xuuuuuuuuuuuuuux
  xuYuuuuuuuuuuYux
  xxxxxxxxxxxxxxxx
  DdDdDdDdDdDdDdDd
  kDkDkDkDkDkDkDkD
  ................
  ................
  ................
  ................
`);

// --- decor (no collision) ---------------------------------------------------

// Crystal cluster, frame 0: blue-violet facets (U core, v/V faces, B/T edges)
// with a Q icy sparkle, growing from an h base.
const CRYSTAL_0 = frame(`
  ................
  .......Q........
  ......VvV.......
  .....BvvvV......
  .....vvUvv......
  ....VvUvvvB.....
  ....vvUvvUv.....
  ...BvUvvvUvv....
  ...vvvUvvUvv....
  ..VvvUvvvvUvB...
  ..vTvvUvvvvvv...
  ..TtvvvvvvvtT...
  ...ttUvvvUtt....
  ....tttttt......
  .....hhhh.......
  ......hh........
`);

// frame 1: the Q sparkle jumps to a lower facet and a T edge glint blinks (must
// differ from frame 0).
const CRYSTAL_1 = frame(`
  ................
  ......VvV.......
  .....BvvvV......
  .....vvUvv......
  ....VvUvvvB.....
  ....vvUvvUv.....
  ...BvUQvvUvv....
  ...vvvUvvUvv....
  ..VvvUvvvvUvB...
  ..vTvvUvvvvvv...
  ..TtvvvvvvvtT...
  ..QtvvvvvvvtT...
  ...ttUvvvUtt....
  ....tttttt......
  .....hhhh.......
  ......hh........
`);

// Anchor rock (decor, no collision): an embedded boulder with an iron ring anchor
// on top — where chains/roots tie the Hollow Giant to the cave. Umber u body, lit
// p rim, D iron ring, H base shadow.
const ANCHOR = frame(`
  ......DD........
  .....D..D.......
  .....D..D.......
  .....DppD.......
  ....puuuup......
  ...puuuuuupp....
  ..puuhuuuuup....
  ..puuuuuuhup....
  .puuuuuuuuuup...
  .puuhuuuuuuup...
  .puuuuuuhuuup...
  ..puuuuuuuup....
  ..HpuuuuuuHp....
  ...HHhuuhHHh....
  ....HHHHHHHH....
  ......HHHH......
`);

// --- SpriteDefs -------------------------------------------------------------

export const DESERT_SAND: SpriteDef = { key: "tile-desert-sand", w: 16, h: 16, frames: [SAND] };
export const DESERT_SAND_FILL: SpriteDef = { key: "tile-desert-sand-fill", w: 16, h: 16, frames: [SAND_FILL] };
export const DESERT_SANDSTONE: SpriteDef = { key: "tile-desert-sandstone", w: 16, h: 16, frames: [SANDSTONE] };
export const DESERT_SANDSTONE_FILL: SpriteDef = { key: "tile-desert-sandstone-fill", w: 16, h: 16, frames: [SANDSTONE_FILL] };
export const DESERT_TIMBER: SpriteDef = { key: "tile-desert-timber", w: 16, h: 16, frames: [TIMBER] };
export const DESERT_SINKHOLE: SpriteDef = { key: "decor-desert-sinkhole", w: 16, h: 16, frames: [SINKHOLE] };

export const CAVE_ROCK_TILE: SpriteDef = { key: "tile-cave-rock", w: 16, h: 16, frames: [CAVE_ROCK] };
export const CAVE_ROCK_FILL_TILE: SpriteDef = { key: "tile-cave-rock-fill", w: 16, h: 16, frames: [CAVE_ROCK_FILL] };
export const CAVE_TUNNEL_BRICK: SpriteDef = { key: "tile-cave-tunnel-brick", w: 16, h: 16, frames: [TUNNEL_BRICK] };
export const CAVE_TUNNEL_BRICK_FILL: SpriteDef = { key: "tile-cave-tunnel-brick-fill", w: 16, h: 16, frames: [TUNNEL_BRICK_FILL] };

// Crumbling floor carries its 3 collapse frames on one def; the scene advances
// frames on trigger (INTACT -> CRACKED -> BREAKING) like the castle bridge, so no
// looping anim is declared.
export const CAVE_CRUMBLE: SpriteDef = {
  key: "tile-cave-crumble",
  w: 16,
  h: 16,
  frames: [CRUMBLE_INTACT, CRUMBLE_CRACKED, CRUMBLE_BREAKING],
};

export const CAVE_LIFT: SpriteDef = { key: "tile-cave-lift", w: 16, h: 16, frames: [LIFT] };

export const CAVE_CRYSTAL_ANIM = "glint";
export const CAVE_CRYSTAL: SpriteDef = {
  key: "decor-cave-crystal",
  w: 16,
  h: 16,
  frames: [CRYSTAL_0, CRYSTAL_1],
  anims: [{ key: CAVE_CRYSTAL_ANIM, frames: [0, 1], frameRate: 2, repeat: -1 }],
};

export const CAVE_ANCHOR: SpriteDef = { key: "decor-cave-anchor", w: 16, h: 16, frames: [ANCHOR] };

// --- parallax backdrop (480x270) --------------------------------------------

const BG_W = 480;
const BG_H = 270;

/** Deterministic 2D hash -> unsigned int (stable generated art; no Math.random at
 *  module load so the integrity test is reproducible). */
function hash(x: number, y: number): number {
  let h = (x * 73856093) ^ (y * 19349663);
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}

function blank(): string[][] {
  return Array.from({ length: BG_H }, () => Array<string>(BG_W).fill("."));
}

// A '#'/'*' bitmap stamped scaled into a layer ('#' -> body, '*' -> glint).
function stampBitmap(
  g: string[][],
  ox: number,
  oy: number,
  bitmap: string[],
  body: string,
  glint: string,
  scale: number,
) {
  for (let y = 0; y < bitmap.length; y++) {
    for (let x = 0; x < bitmap[y].length; x++) {
      const c = bitmap[y][x];
      if (c !== "#" && c !== "*") continue;
      const ch = c === "*" ? glint : body;
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

// Layer 0 (surface): dusk dune sky. A dithered vertical ramp — night-violet crown
// -> warm amber horizon — with a low sun-glow disc and rolling distant dune humps.
function duskRows(): string[] {
  const stops = ["K", "N", "U", "v", "U", "m", "M", "P", "s"]; // top -> horizon
  const rows: string[] = [];
  const HORIZON = 176;
  const sunX = 300, sunY = 168, sunR = 30;
  for (let y = 0; y < BG_H; y++) {
    const t = y / (BG_H - 1);
    const f = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(f));
    const frac = f - i;
    let row = "";
    for (let x = 0; x < BG_W; x++) {
      let ch = hash(x, y) % 100 < frac * 100 ? stops[i + 1] : stops[i];
      const dx = x - sunX, dy = (y - sunY) * 1.4, dd = Math.sqrt(dx * dx + dy * dy);
      if (dd < sunR) ch = dd < sunR * 0.55 ? "Y" : "M";
      else if (dd < sunR * 1.5 && hash(x, y) % 3 === 0) ch = "M";
      if (y >= HORIZON) {
        const hump = Math.floor(18 * Math.sin(x / 70) + 10 * Math.sin(x / 23 + 2));
        const duneTop = HORIZON + 8 - hump;
        if (y >= duneTop) ch = y < duneTop + 3 ? "s" : (hash(x, y) % 5 === 0 ? "p" : "s");
      }
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

// Layer 1 (surface): sandstorm band — a low-contrast horizontal veil of drifting
// P/s sand, densest mid-strip and feathering out; transparent above/below.
// reduceFlash-safe: a soft STATIC veil, no strobing or high-contrast flicker.
function sandstormRows(): string[] {
  const g = blank();
  const bandY = 150, bandH = 90;
  for (let y = 0; y < BG_H; y++) {
    const d = Math.abs(y - bandY) / (bandH / 2);
    if (d > 1) continue;
    const density = Math.round((1 - d) * 42) + 4; // denser at the band centre
    for (let x = 0; x < BG_W; x++) {
      const streak = hash(Math.floor(x / 3), y * 2); // horizontal streak bias -> wind
      if (streak % 100 < density) g[y][x] = hash(x, y) % 4 === 0 ? "s" : "P";
    }
  }
  return g.map((r) => r.join(""));
}

// A colossal buried monument — a carved, horned guardian face, eyes faint-lit.
// Stamped x6 -> ~132x144, barely brighter than the gloom ('*' = faint eye glint).
const MONUMENT = [
  "...##....##...",
  "..####..####..",
  "..#..#..#..#..",
  ".####..####...",
  ".#..######..#.",
  ".#.##....##.#.",
  ".###..**..###.",
  ".##..*##*..##.",
  ".##...##...##.",
  ".###.####.###.",
  ".#.######.#.#.",
  ".#..####..#.#.",
  "..#.####.##...",
  "..##....##....",
  "...######.....",
  "....####......",
];

// Layer 0 (underground): darkness strip. A deep-blue n -> black O dithered
// gradient with the faint buried MONUMENT silhouette (K, just above the gloom)
// and a scatter of dim crystal glints (V/T/B).
function darknessRows(): string[] {
  const stops = ["n", "N", "n", "K", "O", "O"]; // top -> bottom, mostly dark
  const g = blank();
  for (let y = 0; y < BG_H; y++) {
    const t = y / (BG_H - 1);
    const f = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(f));
    const frac = f - i;
    for (let x = 0; x < BG_W; x++) {
      g[y][x] = hash(x, y) % 100 < frac * 100 ? stops[i + 1] : stops[i];
    }
  }
  stampBitmap(g, BG_W / 2 - 66, 96, MONUMENT, "K", "T", 6);
  for (let x = 0; x < BG_W; x++) {
    for (let y = 0; y < BG_H; y++) {
      const s = hash(x * 7 + 1, y * 5 + 3);
      if (s % 2300 === 0) g[y][x] = "V";
      else if (s % 3100 === 0) g[y][x] = "T";
      else if (s % 4700 === 0) g[y][x] = "B";
    }
  }
  return g.map((r) => r.join(""));
}

export const DESERT_BG0: SpriteDef = { key: "bg-desert-0", w: BG_W, h: BG_H, frames: [duskRows()] };
export const DESERT_BG1: SpriteDef = { key: "bg-desert-1", w: BG_W, h: BG_H, frames: [sandstormRows()] };
export const CAVE_BG0: SpriteDef = { key: "bg-cave-0", w: BG_W, h: BG_H, frames: [darknessRows()] };

// --- registry ---------------------------------------------------------------

export const DESERT_TILES: SpriteDef[] = [
  DESERT_SAND,
  DESERT_SAND_FILL,
  DESERT_SANDSTONE,
  DESERT_SANDSTONE_FILL,
  DESERT_TIMBER,
  DESERT_SINKHOLE,
  CAVE_ROCK_TILE,
  CAVE_ROCK_FILL_TILE,
  CAVE_TUNNEL_BRICK,
  CAVE_TUNNEL_BRICK_FILL,
  CAVE_CRUMBLE,
  CAVE_LIFT,
  CAVE_CRYSTAL,
  CAVE_ANCHOR,
];
export const DESERT_PARALLAX: SpriteDef[] = [DESERT_BG0, DESERT_BG1, CAVE_BG0];

// Single source of truth for the bare texture keys the scene references, shared
// with the integrity test so the strings can't drift. The animated crystal is
// addressed by its anim key; the crumble def is addressed by its bare key (the
// scene selects its frame index for collapse state).
export const DESERT_TILE_KEYS = {
  sand: DESERT_SAND.key,
  sandFill: DESERT_SAND_FILL.key,
  sandstone: DESERT_SANDSTONE.key,
  sandstoneFill: DESERT_SANDSTONE_FILL.key,
  timber: DESERT_TIMBER.key,
  sinkhole: DESERT_SINKHOLE.key,
  caveRock: CAVE_ROCK_TILE.key,
  caveRockFill: CAVE_ROCK_FILL_TILE.key,
  tunnelBrick: CAVE_TUNNEL_BRICK.key,
  tunnelBrickFill: CAVE_TUNNEL_BRICK_FILL.key,
  crumble: CAVE_CRUMBLE.key,
  lift: CAVE_LIFT.key,
  crystal: CAVE_CRYSTAL.key,
  anchor: CAVE_ANCHOR.key,
} as const;

export const DESERT_PARALLAX_KEYS = {
  bg0: DESERT_BG0.key,
  bg1: DESERT_BG1.key,
  caveBg0: CAVE_BG0.key,
} as const;
