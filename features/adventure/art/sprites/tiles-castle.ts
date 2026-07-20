import { frame } from "../grid";
import type { SpriteDef } from "../textures";

// World-castle "The Devil King's Castle" tileset + parallax backdrop.
//
// The dramatic final gauntlet: black basalt brickwork (O/K/k), rivers of red
// lava (R/M) instead of the factory's orange molten, arcing fireballs spat from
// lava spouts, collapsing iron-plank bridges, and a rising tide of corruption.
// Decor sells the dread — hanging chains, a glitching blood-red banner, and
// demonic gargoyle statues. The three parallax layers are 480x270 and code
// generated (a red-storm sky with a lightning flicker band, a crenellated wall
// silhouette carrying THE DEVIL KING's distant 80x96 silhouette with red crown
// glints, and a foreground pillar/chain layer) — hand-typing 270x480 grids is
// infeasible, so deterministic generators build them at module load. A permanent
// integrity test (art/tiles.test.ts) parses every frame and checks palette
// membership.

// --- 16x16 gameplay tiles ---------------------------------------------------

// Solid black-basalt brick: a lit K crown lip over an O stone body seamed by k
// mortar in a running-bond pattern, with sparse d chips and r hairline cracks.
// Mirrors FACTORY_GROUND's lit-crown-over-darker-body idea in a near-black key.
const GROUND = frame(`
  KKKKKKKKKKKKKKKK
  KOOOOOOkOOOOOOOK
  OOOdOOOkOOOOOOrO
  kkkkkkkkkkkkkkkk
  OOOkOOOOOOOkOOOO
  OrOkOOOdOOOkOOOO
  kkkkkkkkkkkkkkkk
  OOOOOOOkOOOOOOOO
  OOOdOOOkOOrOOOOO
  kkkkkkkkkkkkkkkk
  OOOkOOOOOOOkOOOO
  OOOkOOrOOOOkOdOO
  kkkkkkkkkkkkkkkk
  OOOOOOOkOOOOOOOO
  OrOOOOOkOOOdOOOO
  kkkkkkkkkkkkkkkk
`);

// Ground fill: the same O basalt body / k mortar as GROUND but with NO lit crown
// lip — a stacked column shows the highlight only on its exposed top (GROUND).
const GROUND_FILL = frame(`
  OOOkOOOOOOOkOOOO
  OrOkOOOdOOOkOOOO
  kkkkkkkkkkkkkkkk
  OOOOOOOkOOOOOOOO
  OOOdOOOkOOrOOOOO
  kkkkkkkkkkkkkkkk
  OOOkOOOOOOOkOOOO
  OOOkOOrOOOOkOdOO
  kkkkkkkkkkkkkkkk
  OOOOOOOkOOOOOOOO
  OrOOOOOkOOOdOOOO
  kkkkkkkkkkkkkkkk
  OOOkOOOOOOOkOOOO
  OOOdOOOkOOOkOOrO
  kkkkkkkkkkkkkkkk
  OOOOOOOkOOOOOOOO
`);

// One-way iron-grate ledge: a thin lit grate (d studs over k/D slats) in the top
// 3 rows only, then transparent. Only its top face blocks (set in the scene) —
// the chain-climb / corruption-shaft jump-through platform.
const ONEWAY = frame(`
  dKdKdKdKdKdKdKdK
  DkDkDkDkDkDkDkDk
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

// Lava hazard pool, frame 0: bright R surface skin, m/M ripple band, then a deep
// r/X body with a couple of M/R hot glints. The castle's `^` equivalent.
const LAVA_0 = frame(`
  RRRRRRRRRRRRRRRR
  RmRRRMRRRRmRRRRR
  mmRmmmmRmmmmmRmm
  mmmmmmmmmmmmmmmm
  rmmmmmMmmmmmmmmm
  rrmrrmmrrmmmrrmm
  rrrrrrrrrrrrrrrr
  rrmrrrrrRrrrrrrr
  rrrrrrrrrrrrrrrr
  rmrrrrrrrrmrrrrr
  rrrrrrrrrrrrXrrr
  rrrrrmrrrrrrrrrr
  rXrrrrrrrrrrrrrr
  rrmrrrrrrrmrrrrr
  rrrrrrrXrrrrrrrr
  rrrrrrrrrrrrrrrr
`);

// Lava hazard pool, frame 1: surface ripples and hot glints shifted so the anim
// reads as flowing lava (must differ from frame 0).
const LAVA_1 = frame(`
  RRRRRRRRRRRRRRRR
  RRRmRRRRRRMRRRmR
  mRmmmmRmmmmmRmmm
  mmmmmmmmmmmmmmmm
  mmmmRmmmmmmmMmmm
  rmmrrmmmrrmmrrmm
  rrrrrrrrrrrrrrrr
  rmrrrrrRrrrrrmrr
  rrrrrrrrrrrrrrrr
  rrrmrrrrrmrrrrrr
  rXrrrrrrrrrrrrrr
  rrrrrrrrrrmrrrrr
  rrrrrrrrrrrrrXrr
  rmrrrrrrrmrrrrrr
  rrrrrrrrrrrrrrrr
  rrrXrrrrrrrrrrrr
`);

// Collapsing iron-plank bridge, frame 0 = INTACT: a thin D/d/k plank deck in the
// top 6 rows, transparent below. Only the top face blocks (one-way, scene-set).
const BRIDGE_INTACT = frame(`
  dDdDdDdDdDdDdDdD
  DDDDDDDDDDDDDDDD
  kkkkkkkkkkkkkkkk
  DkDkDkDkDkDkDkDk
  DDDDDDDDDDDDDDDD
  kdkdkdkdkdkdkdkd
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

// Bridge frame 1 = CRACKED: hairline r cracks spider across the planks (shown
// during the 400ms shake before it falls).
const BRIDGE_CRACKED = frame(`
  dDdDdDdrdDdDdDdD
  DDDrDDDDDDDDrDDD
  kkkkkkrkkkkkkkkk
  DkDkDrDkDrDkDkDk
  DDDDrDDDDDDDDDDD
  kdkdkdkdkrkdkdkd
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

// Bridge frame 2 = BREAKING: cracks widen into r/X gaps just before the deck
// drops away (the last shake frame).
const BRIDGE_BREAKING = frame(`
  dDrrdXdrrDdrdDrD
  DrrDDrrDDrrDDrrD
  krkrXkrkkrkrrkrk
  DrDrDrDkrrDrrrDk
  DrrDrDrrDrrrDrDD
  krkrrdrrkrkrrkdk
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

// Arcing fireball, 8x8: a fiery ball spat from a lava spout — outer R shell, M
// body, hot W core. Single frame (small + fast; no anim needed).
const FIREBALL = frame(`
  ..RRRR..
  .RMMMMR.
  RMMMMMMR
  RMMWWMMR
  RMMWWMMR
  RMMMMMMR
  .RMMMMR.
  ..RRRR..
`);

// --- decor (no collision) ---------------------------------------------------

// Hanging chain, 8x16: iron links (D/d bodies, k gaps) dangling from the ceiling.
const CHAIN = frame(`
  ..dd....
  .dDDd...
  .dDDd...
  ..kk....
  .dDDd...
  .dDDd...
  ..kk....
  .dDDd...
  .dDDd...
  ..kk....
  .dDDd...
  .dDDd...
  ..kk....
  .dDDd...
  .dDDd...
  ..dd....
`);

// Glitching blood banner, 16x24, frame 0: a d rod over an X dark-red cloth with
// an R sigil (an inverted triangle / demon mark), tattered at the hem.
const BANNER_0 = frame(`
  dddddddddddddddd
  .XXXXXXXXXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXRRRRRRRRXXX.
  .XXXRXXXXXXRXXX.
  .XXXRXXXXXXRXXX.
  .XXXXRXXXXRXXXX.
  .XXXXRXXXXRXXXX.
  .XXXXXRXXRXXXXX.
  .XXXXXRXXRXXXXX.
  .XXXXXXRRXXXXXX.
  .XXXXXXRRXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXXXXXXXXXXXX.
  .XX.XX.XX.XX.XX.
  .X..X..X..X..X..
  ..............X.
  ................
`);

// Banner frame 1: the sigil GLITCHES — a stray R corruption speckle jumps across
// the cloth and the hem tatters shift (must differ from frame 0).
const BANNER_1 = frame(`
  dddddddddddddddd
  .XXXXXXXXXXXXXX.
  .XXXXXXXXRXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXRRRRRRRRXXX.
  .XXRRXXXXXXRXXX.
  .XXXRXXXXXXRXXX.
  .XXXXRXXXXRXXXX.
  .XRXXRXXXXRXXXX.
  .XXXXXRXXRXXXXX.
  .XXXXXRXXRXXRXX.
  .XXXXXXRRXXXXXX.
  .XXXXXXRRXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXRXXXXXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXXXXXXXXXXXX.
  .XXXXXXXXXXRXXX.
  .XXXXXXXXXXXXXX.
  .X.XX.XX.XX.XX..
  ..X..X..X..X..X.
  .X..............
  ................
`);

// Demonic gargoyle statue, 16x32: a horned, winged basalt sentinel (O/K/k/D
// stone) with smouldering R eyes. Symmetric silhouette.
const STATUE = frame(`
  ..K........K....
  ..KK......KK....
  ...KK....KK.....
  ....KKKKKK......
  ...KKOOOOKK.....
  ..KKOOOOOOKK....
  ..KOORRRROOK....
  ..KOOOOOOOOK....
  ..KOKOOOOKOK....
  ..KKOOOOOOKK....
  ...KOOOOOOK.....
  ...KKOOOOKK.....
  ..KKKOOOOKKK....
  .KKDKOOOOKDKK...
  .KDDKKOOKKDDK...
  KKDDDKOOKDDDKK..
  KDDDDKOOKDDDDK..
  KDDDDKOOKDDDDK..
  .KDDKKOOKKDDK...
  ..KKKOOOOKKK....
  ...KOOOOOOK.....
  ...KOOOOOOK.....
  ...KOOKKOOK.....
  ...KOK..KOK.....
  ...KOK..KOK.....
  ..KKOK..KOKK....
  ..KDOK..KODK....
  ..KDDK..KDDK....
  ..KKKK..KKKK....
  ..KKK....KKK....
  .KKKK....KKKK...
  KKKKK....KKKKK..
`);

export const CASTLE_GROUND: SpriteDef = { key: "tile-castle-ground", w: 16, h: 16, frames: [GROUND] };
export const CASTLE_GROUND_FILL: SpriteDef = { key: "tile-castle-ground-fill", w: 16, h: 16, frames: [GROUND_FILL] };
export const CASTLE_ONEWAY: SpriteDef = { key: "tile-castle-oneway", w: 16, h: 16, frames: [ONEWAY] };

export const CASTLE_LAVA_ANIM = "boil";
export const CASTLE_LAVA: SpriteDef = {
  key: "tile-castle-lava",
  w: 16,
  h: 16,
  frames: [LAVA_0, LAVA_1],
  anims: [{ key: CASTLE_LAVA_ANIM, frames: [0, 1], frameRate: 3, repeat: -1 }],
};

export const CASTLE_BRIDGE: SpriteDef = {
  key: "tile-castle-bridge",
  w: 16,
  h: 16,
  frames: [BRIDGE_INTACT, BRIDGE_CRACKED, BRIDGE_BREAKING],
};

export const CASTLE_FIREBALL: SpriteDef = { key: "fx-castle-fireball", w: 8, h: 8, frames: [FIREBALL] };

export const CASTLE_CHAIN: SpriteDef = { key: "decor-castle-chain", w: 8, h: 16, frames: [CHAIN] };

export const CASTLE_BANNER_ANIM = "glitch";
export const CASTLE_BANNER: SpriteDef = {
  key: "decor-castle-banner",
  w: 16,
  h: 24,
  frames: [BANNER_0, BANNER_1],
  anims: [{ key: CASTLE_BANNER_ANIM, frames: [0, 1], frameRate: 4, repeat: -1 }],
};

export const CASTLE_STATUE: SpriteDef = { key: "decor-castle-statue", w: 16, h: 32, frames: [STATUE] };

// --- parallax backdrop (480x270) --------------------------------------------

const BG_W = 480;
const BG_H = 270;
const HORIZON_Y = 172;

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

// A '#' bitmap stamped scaled ×scale into the layer, mapping '#' -> body char and
// '*' -> glint char (used for the Devil King's red crown glints).
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

// THE DEVIL KING: a 20x24 crowned, horned, hulking silhouette. Stamped ×4 into
// the horizon layer => an 80x96 dark shape with R crown glints (the `*` row).
const DEVIL_KING = [
  "..#..............#..",
  "..##............##..",
  "...##..........##...",
  "....#*#*#**#*#*#.....",
  "....############....",
  "...##############...",
  "...##############...",
  "...###.######.###...",
  "...##############...",
  "....############....",
  "...##############...",
  "..################..",
  ".##################.",
  ".##################.",
  ".##################.",
  ".##################.",
  ".##################.",
  "..################..",
  "..################..",
  "..################..",
  ".##################.",
  "####################",
  "####################",
  "####################",
];

// Layer 0: red-storm sky. A dithered vertical ramp (near-black crown -> deep-red
// storm glow mid -> dark base), a pale LIGHTNING FLICKER BAND high in the sky,
// and sparse R/W ember sparks drifting through the glow.
function stormRows(): string[] {
  const stops = ["O", "K", "X", "r", "R", "r", "X", "K"]; // top -> bottom
  const rows: string[] = [];
  for (let y = 0; y < BG_H; y++) {
    const t = y / (BG_H - 1);
    const f = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(f));
    const frac = f - i;
    let row = "";
    for (let x = 0; x < BG_W; x++) {
      let ch = hash(x, y) % 100 < frac * 100 ? stops[i + 1] : stops[i];
      // Lightning flicker band: a jagged pale cloud shelf high in the sky.
      if (y >= 40 && y <= 60) {
        const flick = hash(x * 3 + 7, (y >> 1) * 5 + 2) % 6;
        if (flick === 0) ch = "W";
        else if (flick === 1) ch = "C";
        else if (flick === 2) ch = "d";
      }
      // Ember sparks rising through the mid glow.
      if (y > BG_H * 0.35 && y < BG_H * 0.82) {
        const ember = hash(x * 5 + 3, y * 9 + 4) % 1400;
        if (ember === 0) ch = "R";
        else if (ember === 1) ch = "W";
      }
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

// Layer 1: a crenellated distant castle-wall silhouette running along the
// horizon (K bodies, D merlon caps), with the Devil King stamped rising behind
// it dead-centre — his crown catching R glints against the storm.
function wallRows(): string[] {
  const g = blank();
  // The Devil King on the horizon, centred, crown glinting red.
  stampBitmap(g, BG_W / 2 - 40, HORIZON_Y - 96, DEVIL_KING, "O", "R", 4);
  // Crenellated wall along the horizon, drawn OVER the lower body so the king
  // rises from behind the battlements.
  const wallTop = HORIZON_Y - 16;
  for (let x = 0; x < BG_W; x++) {
    const merlon = Math.floor(x / 6) % 2 === 0; // alternating tooth/gap on top row
    for (let y = wallTop; y < HORIZON_Y; y++) {
      if (y === wallTop && !merlon) continue; // crenellation gaps
      g[y][x] = y === wallTop || y === wallTop + 1 ? "D" : "K";
    }
  }
  // A few distant tower silhouettes breaking the wall line.
  let tx = 40;
  while (tx < BG_W) {
    const tw = 14 + (hash(tx, 3) % 10);
    const th = 40 + (hash(tx, 9) % 44);
    const top = HORIZON_Y - th;
    for (let y = Math.max(0, top); y < HORIZON_Y; y++) {
      for (let xx = tx; xx < Math.min(tx + tw, BG_W); xx++) {
        const edge = xx === tx || xx === tx + tw - 1;
        g[y][xx] = edge ? "D" : "K";
      }
    }
    // Lit red window slit near the top.
    if (hash(tx, 5) % 2 === 0 && top + 6 < BG_H) {
      g[top + 5][tx + Math.floor(tw / 2)] = "r";
    }
    tx += tw + 70 + (hash(tx, 7) % 60);
  }
  return g.map((r) => r.join(""));
}

// Layer 2: foreground — heavy black pillars rising the full height with D rim
// edges and lit r torch glints, plus hanging chain silhouettes between them.
function pillarRows(): string[] {
  const g = blank();
  let px = 24;
  while (px < BG_W) {
    const pw = 18 + (hash(px, 2) % 10);
    for (let y = 0; y < BG_H; y++) {
      for (let xx = px; xx < Math.min(px + pw, BG_W); xx++) {
        const edge = xx === px || xx === px + pw - 1;
        g[y][xx] = edge ? "D" : "O";
      }
    }
    // Torch glint sconces down the pillar.
    for (let ty = 60; ty < BG_H; ty += 70) {
      const cx = px + Math.floor(pw / 2);
      if (ty < BG_H && cx < BG_W) {
        g[ty][cx] = "R";
        if (ty + 1 < BG_H) g[ty + 1][cx] = "r";
      }
    }
    // Hanging chains in the gap to the next pillar.
    const gapX = px + pw + 20;
    if (gapX < BG_W) {
      for (let y = 0; y < 90; y++) {
        if (y % 3 !== 2) g[y][gapX] = "k";
      }
    }
    px += pw + 96 + (hash(px, 4) % 40);
  }
  return g.map((r) => r.join(""));
}

export const CASTLE_BG0: SpriteDef = { key: "bg-castle-0", w: BG_W, h: BG_H, frames: [stormRows()] };
export const CASTLE_BG1: SpriteDef = { key: "bg-castle-1", w: BG_W, h: BG_H, frames: [wallRows()] };
export const CASTLE_BG2: SpriteDef = { key: "bg-castle-2", w: BG_W, h: BG_H, frames: [pillarRows()] };

// --- registry ---------------------------------------------------------------

export const CASTLE_TILES: SpriteDef[] = [
  CASTLE_GROUND,
  CASTLE_GROUND_FILL,
  CASTLE_ONEWAY,
  CASTLE_LAVA,
  CASTLE_BRIDGE,
  CASTLE_FIREBALL,
  CASTLE_CHAIN,
  CASTLE_BANNER,
  CASTLE_STATUE,
];
export const CASTLE_PARALLAX: SpriteDef[] = [CASTLE_BG0, CASTLE_BG1, CASTLE_BG2];

// Single source of truth for the bare texture keys the scene references, shared
// with the integrity test so the strings can't drift. Animated defs (lava,
// banner) are addressed by their anim key; the fireball/chain/statue single
// frames resolve by their bare key.
export const CASTLE_TILE_KEYS = {
  ground: CASTLE_GROUND.key,
  groundFill: CASTLE_GROUND_FILL.key,
  oneWay: CASTLE_ONEWAY.key,
  lava: CASTLE_LAVA.key,
  bridge: CASTLE_BRIDGE.key,
  fireball: CASTLE_FIREBALL.key,
  chain: CASTLE_CHAIN.key,
  banner: CASTLE_BANNER.key,
  statue: CASTLE_STATUE.key,
} as const;

export const CASTLE_PARALLAX_KEYS = {
  bg0: CASTLE_BG0.key,
  bg1: CASTLE_BG1.key,
  bg2: CASTLE_BG2.key,
} as const;
