// NOTE: kit palette chars remapped in-repo — `Q`→`o` (hot-pink; Q = desert
// crystal) and `e`→`a` (cream stucco; e = temple lacquer). Art pixels only.
import { frame } from "../grid";
import type { SpriteDef } from "../textures";
import type { LevelDefinition } from "../../levels/types";

// World 1-3 "From the Coast to the Casino" DUAL-BIOME tileset + parallax.
//
// (A) Portugal-inspired coast: limestone-cobble street/stair, cream stucco
// walls, azulejo tile panels, terracotta barrel roofs, iron balconies, a
// tram-rail one-way platform, and 2f ocean water. (B) Vegas-inspired casino
// city: plush violet/gold carpet, gaudy gold trim, glass + roulette platforms,
// a security-laser emitter, and 2f neon-sign / slot-machine decor. The six
// parallax layers (480x270, two triplets) are deterministically generated at
// module load (ocean+hillside town -> casino neon skyline). Original art only.
// A permanent integrity test (art/tiles.test.ts) parses every frame and checks
// palette membership; new chars Q/e/z are added to art/palette.ts by Task 38.

// --- 16x16 gameplay tiles + decor ------------------------------------------


// === (A) Portugal-inspired coast ===

// ground
const COAST_GROUND_0 = frame(`
  WcckWcckWcckWcck
  acckacckacckacck
  ccdkccdkccdkccdk
  kkkkkkkkkkkkkkkk
  ckacckacckacckac
  dkccdkccdkccdkcc
  dkcddkcddkcddkcd
  kkkkkkkkkkkkkkkk
  acckacckacckacck
  ccdkccdkccdkccdk
  cddkcddkcddkcddk
  kkkkkkkkkkkkkkkk
  ckacckacckacckac
  dkccdkccdkccdkcc
  dkcddkcddkcddkcd
  kkkkkkkkkkkkkkkk
`);

// ground-fill
const COAST_GROUND_FILL_0 = frame(`
  acckacckacckacck
  ccdkccdkccdkccdk
  cddkcddkcddkcddk
  kkkkkkkkkkkkkkkk
  ckacckacckacckac
  dkccdkccdkccdkcc
  dkcddkcddkcddkcd
  kkkkkkkkkkkkkkkk
  acckacckacckacck
  ccdkccdkccdkccdk
  cddkcddkcddkcddk
  kkkkkkkkkkkkkkkk
  ckacckacckacckac
  dkccdkccdkccdkcc
  dkcddkcddkcddkcd
  kkkkkkkkkkkkkkkk
`);

// ground (stairway)
const COAST_STAIR_0 = frame(`
  WWWWWWWWWWWWWWWW
  aaaaaaaaaaaaaaaa
  accaaccaaccaacca
  ddkdddkdddkdddkd
  WWWWWWWWWWWWWWWW
  aaaaaaaaaaaaaaaa
  accaaccaaccaacca
  ddkdddkdddkdddkd
  WWWWWWWWWWWWWWWW
  aaaaaaaaaaaaaaaa
  accaaccaaccaacca
  ddkdddkdddkdddkd
  WWWWWWWWWWWWWWWW
  aaaaaaaaaaaaaaaa
  accaaccaaccaacca
  ddkdddkdddkdddkd
`);

// structural wall
const COAST_WALL_0 = frame(`
  aaaaaaaaaaaaaaaa
  aaaaCaaaaaaaCaaa
  aaaaaaaaaaaaaaaa
  paaaaaaaapaaaaaa
  aaaaaaaaaaaaaaaa
  aaaCaaaaaaaCaaaa
  aaaaaaaaaaaaaaaa
  aaaaaaaaaaaaaaaa
  aaaaaaaaaaaaaaaa
  aaaaCaaaaaaaCaaa
  aaaaaaaaaaaaaaaa
  aapaaaaaaaapaaaa
  aaaaaaaaaaaaaaaa
  aaaCaaaaaaaCaaaa
  aaaaaaaaaaaaaaaa
  aaaaaaaaaaaaaaaa
`);

// one-way platform (tram-rail)
const COAST_TRAM_0 = frame(`
  WcWcWcWcWcWcWcWc
  cdcdcdcdcdcdcdcd
  LpLpLpLpLpLpLpLp
  kLkLkLkLkLkLkLkL
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

// hazard (deep water)
const COAST_WATER_0 = frame(`
  TWTTTWTTTTWTTTWT
  TtTTtTTtTTtTTtTT
  tTttTttTttTttTtt
  ttbttbttbttbttbt
  tbttbttbttbttbtt
  bbtbbtbbtbbtbbtb
  bNbbNbbNbbNbbNbb
  bbNbbNbbNbbNbbNb
  NbNNbNNbNNbNNbNN
  NNbNNbNNbNNbNNbN
  NNNbNNNbNNNbNNNb
  bNNNbNNNbNNNbNNN
  NNNNNNNNNNNNNNNN
  NbNNNNNbNNNNNbNN
  NNNNNNNNNNNNNNNN
  NNNbNNNNNNNbNNNN
`);
const COAST_WATER_1 = frame(`
  TTWTTTWTTTTWTTTW
  tTTtTTtTTtTTtTTt
  TttTttTttTttTttT
  tbttbttbttbttbtt
  bttbttbttbttbttb
  btbbtbbtbbtbbtbb
  NbbNbbNbbNbbNbbN
  bNbbNbbNbbNbbNbb
  bNNbNNbNNbNNbNNb
  NbNNbNNbNNbNNbNN
  NNbNNNbNNNbNNNbN
  NNNbNNNbNNNbNNNb
  NNNNNNNNNNNNNNNN
  NNNbNNNNNbNNNNNb
  NNNNNNNNNNNNNNNN
  bNNNNNNNbNNNNNNN
`);

// decor (wall tile panel)
const COAST_AZULEJO_0 = frame(`
  bWWWWWWbbWWWWWWb
  WBbWWbBWWBbWWbBW
  WbBWWBbWWbBWWBbW
  WWWNNWWWWWWNNWWW
  WWWNNWWWWWWNNWWW
  WbBWWBbWWbBWWBbW
  WBbWWbBWWBbWWbBW
  bWWWWWWbbWWWWWWb
  bWWWWWWbbWWWWWWb
  WBbWWbBWWBbWWbBW
  WbBWWBbWWbBWWBbW
  WWWNNWWWWWWNNWWW
  WWWNNWWWWWWNNWWW
  WbBWWBbWWbBWWBbW
  WBbWWbBWWBbWWbBW
  bWWWWWWbbWWWWWWb
`);

// decor (terracotta roof)
const COAST_ROOF_0 = frame(`
  MmmLMmmLMmmLMmmL
  MmmLMmmLMmmLMmmL
  MmmLMmmLMmmLMmmL
  mmLLmmLLmmLLmmLL
  MMmLMMmLMMmLMMmL
  MmmLMmmLMmmLMmmL
  MmmLMmmLMmmLMmmL
  mmLLmmLLmmLLmmLL
  MmmLMmmLMmmLMmmL
  MmmLMmmLMmmLMmmL
  MmmLMmmLMmmLMmmL
  mmLLmmLLmmLLmmLL
  MMmLMMmLMMmLMMmL
  MmmLMmmLMmmLMmmL
  MmmLMmmLMmmLMmmL
  mmLLmmLLmmLLmmLL
`);

// decor (balcony rail)
const COAST_BALCONY_0 = frame(`
  .gGg............
  .GGgG...........
  .GmGg...........
  .Lmmm...........
  ..LmL...........
  DDDDDDDDDDDDDDDD
  cdcdcdcdcdcdcdcd
  Dk..Dk..Dk..Dk..
  Dk..Dk..Dk..Dk..
  Dk..Dk..Dk..Dk..
  Dk..Dk..Dk..Dk..
  Dk..Dk..Dk..Dk..
  Dk..Dk..Dk..Dk..
  Dk..Dk..Dk..Dk..
  dddddddddddddddd
  DDDDDDDDDDDDDDDD
`);


// === (B) Vegas-inspired casino city ===

// ground (plush floor)
const CASINO_FLOOR_0 = frame(`
  vvvvvvvvvvvvvvvv
  UvUUUUvUUvUUUUvU
  UUUUyUUUUUUUyUUU
  UUUyYyUUUUUyYyUU
  UUyYWYyUUUyYWYyU
  UUUyYyUUUUUyYyUU
  UUUUyUUUUUUUyUUU
  UvUUUUvUUvUUUUvU
  vvvvvvvvvvvvvvvv
  UvUUUUvUUvUUUUvU
  UUUUyUUUUUUUyUUU
  UUUyYyUUUUUyYyUU
  UUyYWYyUUUyYWYyU
  UUUyYyUUUUUyYyUU
  UUUUyUUUUUUUyUUU
  UvUUUUvUUvUUUUvU
`);

// ground-fill
const CASINO_FLOOR_FILL_0 = frame(`
  UUvUUUvUUUvUUUvU
  vUUUUUUvvUUUUUUv
  UUUUyUUUUUUUyUUU
  UUUyYyUUUUUyYyUU
  UUyYWYyUUUyYWYyU
  UUUyYyUUUUUyYyUU
  UUUUyUUUUUUUyUUU
  UvUUUUvUUvUUUUvU
  UUvUUUvUUUvUUUvU
  vUUUUUUvvUUUUUUv
  UUUUyUUUUUUUyUUU
  UUUyYyUUUUUyYyUU
  UUyYWYyUUUyYWYyU
  UUUyYyUUUUUyYyUU
  UUUUyUUUUUUUyUUU
  UvUUUUvUUvUUUUvU
`);

// structural (gold trim)
const CASINO_TRIM_0 = frame(`
  yYYyyYYyyYYyyYYy
  YWWYYWWYYWWYYWWY
  yYYyyYYyyYYyyYYy
  LyyLLyyLLyyLLyyL
  yYYyyYYyyYYyyYYy
  YWWYYWWYYWWYYWWY
  yYYyyYYyyYYyyYYy
  LyyLLyyLLyyLLyyL
  yYYyyYYyyYYyyYYy
  YWWYYWWYYWWYYWWY
  yYYyyYYyyYYyyYYy
  LyyLLyyLLyyLLyyL
  yYYyyYYyyYYyyYYy
  YWWYYWWYYWWYYWWY
  yYYyyYYyyYYyyYYy
  LyyLLyyLLyyLLyyL
`);

// one-way platform (glass)
const CASINO_GLASS_0 = frame(`
  YyYyYyYyYyYyYyYy
  WBWBWBWBWBWBWBWB
  BbBbBbBbBbBbBbBb
  bNbNbNbNbNbNbNbN
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

// one-way platform (rotating roulette)
const CASINO_ROULETTE_0 = frame(`
  .......yY.......
  ....YyyyYYYy....
  ...YYKKKrrryy...
  ..yrrKKKrrrKKY..
  .yyrrrKKrrKKKYY.
  .YKKrrrKrKKKrry.
  .YKKKrYWWYKrrry.
  YYKKKKWWWWrrrryy
  yyrrrrWWWWKKKKYY
  .yrrrKYWWYrKKKY.
  .yrrKKKrKrrrKKY.
  .YYKKKrrKKrrryy.
  ..YKKrrrKKKrry..
  ...yyrrrKKKYY...
  ....yYYYyyyY....
  .......Yy.......
`);

// hazard (security laser emitter)
const CASINO_LASER_0 = frame(`
  ................
  ................
  ................
  ................
  ..kkk...........
  .kDDDk..........
  .DdddD.rrrrrrrrr
  kDRWRDRRRRRRRRRR
  kDRWRDRRRRRRRRRR
  .DdddD.rrrrrrrrr
  .kDDDk..........
  ..kkk...........
  ................
  ................
  ................
  ................
`);

// decor (neon sign)
const CASINO_NEON_0 = frame(`
  ................
  .......WW.......
  ......o..o......
  .....o....o.....
  ....o......o....
  ...o...oo...o...
  ..o...B..B...o..
  .W...B....B...W.
  .W...B....B...W.
  ..o...B..B...o..
  ...o...oo...o...
  ....o......o....
  .....o....o.....
  ......o..o......
  .......WW.......
  ................
`);
const CASINO_NEON_1 = frame(`
  ................
  .......oo.......
  ......o..o......
  .....o....o.....
  ....o......o....
  ...o........o...
  ..o..........o..
  .o............o.
  .o............o.
  ..o..........o..
  ...U........U...
  ....U......U....
  .....U....U.....
  ......U..U......
  .......UU.......
  ................
`);

// decor (slot machine)
const CASINO_SLOT_0 = frame(`
  ..YYYYYYYYYYYY..
  .YooooooooooooY.
  .YWooooooooooWY.
  .rrrrrrrrrrrrrr.
  .rKKKKKKKKKKKKr.
  .rWWWKWWWKWWWKr.
  .rYYYK.R.K.y.Kr.
  .r.Y.KRRRKyyyKr.
  .r.Y.K.R.K.y.Kr.
  .rWWWKWWWKWWWKr.
  .rKKKKKKKKKKKKr.
  .rrrrrrrrrrrrrr.
  .rXrrrrrrrrrrXr.
  .rrYYYYYYYYYYrr.
  .rrrrrrrrrrrrrr.
  .rGGrrGGrrGGrrr.
  .rrrrrrrrrrrrrr.
  .rXXXXXXXXXXXXr.
  .rXWWWWWWWWWWXr.
  .rrrrrrrrrrrrrr.
  .KrrrrrrrrrrrrK.
  .KKKKKKKKKKKKKK.
  ..KKKKKKKKKKKK..
  ..dddddddddddd..
`);
const CASINO_SLOT_1 = frame(`
  ..YYYYYYYYYYYY..
  .YWWWWWWWWWWWWY.
  .YoWoWoWoWoWoWY.
  .rrrrrrrrrrrrrr.
  .rKKKKKKKKKKKKr.
  .rWWWKWWWKWWWKr.
  .rWWWK.B.KYYYKr.
  .rRRRKBBBK.Y.Kr.
  .r.R.K.B.K.Y.Kr.
  .rWWWKWWWKWWWKr.
  .rKKKKKKKKKKKKr.
  .rrrrrrrrrrrrrr.
  .rXrrrrrrrrrrXr.
  .rrYYYYYYYYYYrr.
  .rrrrrrrrrrrrrr.
  .rGGrrGGrrGGrrr.
  .rrrrrrrrrrrrrr.
  .rXXXXXXXXXXXXr.
  .rXWWWWWWWWWWXr.
  .rrrrrrrrrrrrrr.
  .KrrrrrrrrrrrrK.
  .KKKKKKKKKKKKKK.
  ..KKKKKKKKKKKK..
  ..dddddddddddd..
`);

// --- SpriteDefs ------------------------------------------------------------

export const COAST_GROUND: SpriteDef = { key: "tile-coast-ground", w: 16, h: 16, frames: [COAST_GROUND_0] };

export const COAST_GROUND_FILL: SpriteDef = { key: "tile-coast-ground-fill", w: 16, h: 16, frames: [COAST_GROUND_FILL_0] };

export const COAST_STAIR: SpriteDef = { key: "tile-coast-stair", w: 16, h: 16, frames: [COAST_STAIR_0] };

export const COAST_WALL: SpriteDef = { key: "tile-coast-wall", w: 16, h: 16, frames: [COAST_WALL_0] };

export const COAST_TRAM: SpriteDef = { key: "tile-coast-tram", w: 16, h: 16, frames: [COAST_TRAM_0] };

export const COAST_WATER_ANIM = "swell";
export const COAST_WATER: SpriteDef = {
  key: "tile-coast-water",
  w: 16,
  h: 16,
  frames: [COAST_WATER_0, COAST_WATER_1],
  anims: [{ key: COAST_WATER_ANIM, frames: [0, 1], frameRate: 3, repeat: -1 }],
};

export const COAST_AZULEJO: SpriteDef = { key: "decor-coast-azulejo", w: 16, h: 16, frames: [COAST_AZULEJO_0] };

export const COAST_ROOF: SpriteDef = { key: "decor-coast-roof", w: 16, h: 16, frames: [COAST_ROOF_0] };

export const COAST_BALCONY: SpriteDef = { key: "decor-coast-balcony", w: 16, h: 16, frames: [COAST_BALCONY_0] };

export const CASINO_FLOOR: SpriteDef = { key: "tile-casino-floor", w: 16, h: 16, frames: [CASINO_FLOOR_0] };

export const CASINO_FLOOR_FILL: SpriteDef = { key: "tile-casino-floor-fill", w: 16, h: 16, frames: [CASINO_FLOOR_FILL_0] };

export const CASINO_TRIM: SpriteDef = { key: "tile-casino-trim", w: 16, h: 16, frames: [CASINO_TRIM_0] };

export const CASINO_GLASS: SpriteDef = { key: "tile-casino-glass", w: 16, h: 16, frames: [CASINO_GLASS_0] };

export const CASINO_ROULETTE: SpriteDef = { key: "tile-casino-roulette", w: 16, h: 16, frames: [CASINO_ROULETTE_0] };

export const CASINO_LASER: SpriteDef = { key: "hazard-casino-laser", w: 16, h: 16, frames: [CASINO_LASER_0] };

export const CASINO_NEON_ANIM = "flicker";
export const CASINO_NEON: SpriteDef = {
  key: "decor-casino-neon",
  w: 16,
  h: 16,
  frames: [CASINO_NEON_0, CASINO_NEON_1],
  anims: [{ key: CASINO_NEON_ANIM, frames: [0, 1], frameRate: 4, repeat: -1 }],
};

export const CASINO_SLOT_ANIM = "spin";
export const CASINO_SLOT: SpriteDef = {
  key: "decor-casino-slot",
  w: 16,
  h: 24,
  frames: [CASINO_SLOT_0, CASINO_SLOT_1],
  anims: [{ key: CASINO_SLOT_ANIM, frames: [0, 1], frameRate: 5, repeat: -1 }],
};

// --- parallax backdrop (480x270, two triplets) -----------------------------

const BG_W = 480;
const BG_H = 270;

/** Deterministic 2D hash -> unsigned int (stable generated art; no Math.random
 *  at module load so the integrity test stays reproducible). */
function hash(x: number, y: number): number {
  let h = (x * 73856093) ^ (y * 19349663);
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}

function blank(): string[][] {
  return Array.from({ length: BG_H }, () => Array<string>(BG_W).fill("."));
}

function coastSky(): string[] {
  const stops: string[] = ["B", "B", "b", "z", "z"]; // top -> horizon
  const rows: string[] = [];
  const sunX = 120, sunY = 70;
  for (let y = 0; y < BG_H; y++) {
    const t = y / (BG_H - 1);
    const f = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(f));
    const frac = f - i;
    let row = "";
    for (let x = 0; x < BG_W; x++) {
      let ch = hash(x, y) % 100 < frac * 100 ? stops[i + 1] : stops[i];
      const sd = Math.sqrt((x - sunX) * (x - sunX) + (y - sunY) * (y - sunY));
      if (sd < 14) ch = "W";
      else if (sd < 20) ch = "Y";
      else if (sd < 34) { if (hash(x, y) % 3 !== 0) ch = "z"; }
      if (y < 60 && hash(x * 3 + 5, (y >> 1) * 7) % 900 === 0) ch = "W";
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

function coastHills(): string[] {
  const g = blank();
  const seaY = 196;
  // ocean band
  for (let y = seaY; y < BG_H; y++) {
    for (let x = 0; x < BG_W; x++) {
      const t = (y - seaY) / (BG_H - seaY);
      let ch = hash(x, y) % 100 < t * 80 ? "N" : (hash(x, y) % 3 ? "t" : "b");
      if (y === seaY || y === seaY + 1) ch = (hash(x, y) % 4 === 0 ? "W" : "T");
      g[y][x] = ch;
    }
  }
  // hillside silhouette base
  for (let x = 0; x < BG_W; x++) {
    const hillTop = seaY - 28 - Math.floor(18 * Math.sin(x * 0.017) + 10 * Math.sin(x * 0.05));
    for (let y = hillTop; y < seaY; y++) g[y][x] = (hash(x, y) % 5 === 0 ? "g" : "F");
  }
  // stacked houses standing on the hill (base anchored to the terrain height)
  let hx = 8;
  while (hx < BG_W - 20) {
    const bw = 22 + (hash(hx, 2) % 16);
    const bh = 20 + (hash(hx, 6) % 22);
    const cxh = hx + (bw >> 1);
    const hillAt = seaY - 28 - Math.floor(18 * Math.sin(cxh * 0.017) + 10 * Math.sin(cxh * 0.05));
    const base = hillAt + 5; // sink into the hillside so houses sit on land
    const top = base - bh;
    for (let y = top; y < base; y++) {
      for (let xx = hx; xx < Math.min(hx + bw, BG_W); xx++) {
        if (y < 0) continue;
        const edge = xx === hx || xx === hx + bw - 1;
        g[y][xx] = edge ? "p" : "a";
      }
    }
    // terracotta roof cap
    for (let ry = 0; ry < 5; ry++) {
      for (let xx = hx - 1; xx < Math.min(hx + bw + 1, BG_W); xx++) {
        const yy = top - 5 + ry;
        if (yy >= 0 && xx >= 0) g[yy][xx] = ry < 2 ? "M" : "m";
      }
    }
    // windows (azulejo-blue / lit)
    for (let wy = top + 4; wy < base - 3; wy += 8) {
      if (wy < 0 || wy >= BG_H) continue;
      for (let wx = hx + 3; wx < Math.min(hx + bw - 3, BG_W - 1); wx += 7) {
        g[wy][wx] = "b"; g[wy][wx + 1] = "N";
        if (wy + 1 < base && wy + 1 < BG_H) { g[wy + 1][wx] = "N"; g[wy + 1][wx + 1] = "b"; }
      }
    }
    hx += bw + 2 + (hash(hx, 4) % 6);
  }
  return g.map((r) => r.join(""));
}

function coastForeground(): string[] {
  const g = blank();
  // rooftop edge along the very bottom
  for (let x = 0; x < BG_W; x++) {
    for (let y = BG_H - 18; y < BG_H; y++) {
      const yy = y - (BG_H - 18);
      g[y][x] = yy < 4 ? (yy < 2 ? "M" : "m") : "L";
    }
  }
  const palms = [70, 400];
  for (const px of palms) {
    // trunk (gently swaying)
    for (let y = 44; y < BG_H - 14; y++) {
      const sway = Math.floor(6 * Math.sin(y * 0.04));
      const tx = px + sway;
      g[y][tx] = "L"; g[y][tx + 1] = "h"; g[y][tx + 2] = "L";
    }
    // crown of drooping fronds: rise out then sag at the tips
    const cy = 44, cx = px + Math.floor(6 * Math.sin(44 * 0.04)) + 1;
    const dirs = [-1.0, -0.62, -0.3, 0.3, 0.62, 1.0];
    for (const d of dirs) {
      for (let r = 0; r < 28; r++) {
        const fx = Math.round(cx + d * r);
        const fy = Math.round(cy - r * 0.55 + r * r * 0.032) - 2;
        if (fx >= 0 && fx < BG_W && fy >= 0 && fy < BG_H) {
          g[fy][fx] = r > 20 ? "g" : (r > 9 ? "G" : "F");
          if (fx + 1 < BG_W && r > 4) g[fy][fx + 1] = r > 20 ? "g" : "G"; // thicken frond
        }
      }
    }
    for (let d = 0; d < 6; d++) { if (cy + d < BG_H) g[cy + d][cx] = "L"; }
  }
  return g.map((r) => r.join(""));
}

function casinoSky(): string[] {
  const stops: string[] = ["O", "O", "K", "k", "X"]; // top -> horizon
  const rows: string[] = [];
  for (let y = 0; y < BG_H; y++) {
    const t = y / (BG_H - 1);
    const f = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(f));
    const frac = f - i;
    let row = "";
    for (let x = 0; x < BG_W; x++) {
      let ch = hash(x, y) % 100 < frac * 100 ? stops[i + 1] : stops[i];
      // neon smog glow low in the sky
      if (y > BG_H * 0.66) {
        const gl = hash(x * 5, y * 3) % 22;
        if (gl === 0) ch = "o";
        else if (gl === 1) ch = "z";
        else if (gl === 2) ch = "v";
      }
      if (y < BG_H * 0.4 && hash(x * 7 + 1, y * 3 + 5) % 1100 === 0) ch = "c";
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

function casinoSkyline(): string[] {
  const g = blank();
  const horizon = 210;
  let x = 0;
  while (x < BG_W) {
    const bw = 26 + (hash(x, 7) % 34);
    const bh = 60 + (hash(x, 13) % 120);
    const top = horizon - bh;
    for (let y = Math.max(0, top); y < horizon; y++) {
      for (let xx = x; xx < Math.min(x + bw, BG_W); xx++) {
        const edge = xx === x || xx === x + bw - 1 || y === top;
        g[y][xx] = edge ? "k" : "K";
      }
    }
    // neon window grid
    const neon = ["o", "B", "Y", "v"][hash(x, 21) % 4];
    for (let wy = top + 5; wy < horizon - 4; wy += 6) {
      for (let wx = x + 3; wx < Math.min(x + bw - 3, BG_W); wx += 5) {
        if (wy >= 0 && wy < BG_H && wx >= 0 && hash(wx, wy) % 4 !== 0) g[wy][wx] = neon;
      }
    }
    // rooftop marquee glow on taller towers
    if (bh > 130 && top - 2 >= 0) {
      for (let mx = x + 2; mx < Math.min(x + bw - 2, BG_W); mx++) {
        g[top - 2][mx] = neon; g[top - 1][mx] = "z";
      }
    }
    x += bw + 1 + (hash(x, 3) % 4);
  }
  return g.map((r) => r.join(""));
}

function casinoForeground(): string[] {
  const g = blank();
  // side pillars
  for (const [px, pw] of [[0, 34], [446, 34]]) {
    for (let y = 0; y < BG_H; y++) {
      for (let xx = px; xx < px + pw; xx++) {
        const edge = xx === px || xx === px + pw - 1;
        g[y][xx] = edge ? "D" : "O";
      }
    }
    // gold trim studs
    for (let ty = 20; ty < BG_H; ty += 26) g[ty][px + Math.floor(pw / 2)] = "Y";
  }
  // neon arch across the top between the pillars
  for (let x = 34; x < 446; x++) {
    const ay = 30 + Math.floor(26 * Math.abs(Math.sin((x - 34) / 412 * Math.PI)) * -1) + 26;
    const y = 20 + Math.floor(24 * (1 - Math.sin((x - 34) / 412 * Math.PI)));
    if (y >= 0 && y < BG_H) {
      g[y][x] = "o";
      if (y - 1 >= 0) g[y - 1][x] = "o"; // 2px pink tube core
      if (y + 1 < BG_H) g[y + 1][x] = (x % 6 === 0 ? "Y" : "z");
      if (y - 2 >= 0 && x % 3 === 0) g[y - 2][x] = "W"; // bulb glints above
    }
  }
  return g.map((r) => r.join(""));
}

export const COAST_BG0: SpriteDef = { key: "bg-coast-0", w: BG_W, h: BG_H, frames: [coastSky()] };
export const COAST_BG1: SpriteDef = { key: "bg-coast-1", w: BG_W, h: BG_H, frames: [coastHills()] };
export const COAST_BG2: SpriteDef = { key: "bg-coast-2", w: BG_W, h: BG_H, frames: [coastForeground()] };
export const CASINO_BG0: SpriteDef = { key: "bg-casino-0", w: BG_W, h: BG_H, frames: [casinoSky()] };
export const CASINO_BG1: SpriteDef = { key: "bg-casino-1", w: BG_W, h: BG_H, frames: [casinoSkyline()] };
export const CASINO_BG2: SpriteDef = { key: "bg-casino-2", w: BG_W, h: BG_H, frames: [casinoForeground()] };

// --- registries ------------------------------------------------------------

export const COAST_TILES: SpriteDef[] = [
  COAST_GROUND,
  COAST_GROUND_FILL,
  COAST_STAIR,
  COAST_WALL,
  COAST_TRAM,
  COAST_WATER,
  COAST_AZULEJO,
  COAST_ROOF,
  COAST_BALCONY,
];
export const CASINO_TILES: SpriteDef[] = [
  CASINO_FLOOR,
  CASINO_FLOOR_FILL,
  CASINO_TRIM,
  CASINO_GLASS,
  CASINO_ROULETTE,
  CASINO_LASER,
  CASINO_NEON,
  CASINO_SLOT,
];
export const COAST_PARALLAX: SpriteDef[] = [COAST_BG0, COAST_BG1, COAST_BG2];
export const CASINO_PARALLAX: SpriteDef[] = [CASINO_BG0, CASINO_BG1, CASINO_BG2];

// Single source of truth for the bare texture keys the scene references, shared
// with the integrity test so the strings can't drift. Animated defs are
// addressed by their anim key; single frames resolve by their bare key.
export const COAST_TILE_KEYS = {
  ground: COAST_GROUND.key,
  groundFill: COAST_GROUND_FILL.key,
  stair: COAST_STAIR.key,
  wall: COAST_WALL.key,
  tram: COAST_TRAM.key,
  water: COAST_WATER.key,
  azulejo: COAST_AZULEJO.key,
  roof: COAST_ROOF.key,
  balcony: COAST_BALCONY.key,
} as const;

export const CASINO_TILE_KEYS = {
  floor: CASINO_FLOOR.key,
  floorFill: CASINO_FLOOR_FILL.key,
  trim: CASINO_TRIM.key,
  glass: CASINO_GLASS.key,
  roulette: CASINO_ROULETTE.key,
  laser: CASINO_LASER.key,
  neon: CASINO_NEON.key,
  slot: CASINO_SLOT.key,
} as const;

export const COAST_PARALLAX_KEYS = { bg0: COAST_BG0.key, bg1: COAST_BG1.key, bg2: COAST_BG2.key } as const;
export const CASINO_PARALLAX_KEYS = { bg0: CASINO_BG0.key, bg1: CASINO_BG1.key, bg2: CASINO_BG2.key } as const;

/** Parallax + tile SpriteDefs for this world's theme. "coast" spans both
 *  biomes; the scene picks the coast set early and layers the casino set in
 *  as the level transitions. */
export function coastTilesetFor(_theme: LevelDefinition["theme"]): SpriteDef[] {
  return [...COAST_PARALLAX, ...CASINO_PARALLAX, ...COAST_TILES, ...CASINO_TILES];
}
