import { frame, mirrorFrame } from "../grid";
import type { SpriteDef } from "../textures";

// World 1-1 "City of the Broken Crown" DUAL-BIOME tileset + parallax backdrop.
//
// A single kit that carries the level from a modern steel-and-glass city (biome
// A: cool blue-gray concrete, girder platforms, neon signage) through gradual
// TRANSITION tiles into an East-Asian-inspired mountain temple (biome B: aged
// warm brick, dressed stone stairs, gold-trimmed temple timber, red lanterns,
// jade roofs, a great temple door). Two transition tiles (concrete cracking into
// brick, a curtain-wall aging into masonry) let the map dissolve A→B over a
// stretch rather than cut. The three 480x270 parallax layers are code-generated
// at module load (deterministic hash — no Math.random, so the art integrity test
// is reproducible): a sky that shifts cool→warm across its width, a skyline that
// hands off from city towers to a mountain range with a temple pagoda, and a
// foreground of rooftop clutter giving way to pines and a temple wall.
//
// Palette additions (art/palette.ts, World 1-1 budget): J jade #4f9e86,
// e lacquer-red #cf4b2a, w temple-timber #6f4326, E neon-magenta #ff5db0. All
// other chars are existing palette entries reused aggressively.

// ============================================================================
// BIOME A — modern city (16x16 gameplay tiles)
// ============================================================================

// Concrete sidewalk GROUND: bright lit curb lip (C) over a cool concrete body
// (c) seamed by dark expansion joints (D) at fixed columns 2 & 10 with sparse
// d aggregate speckle. The lit lip marks an exposed top surface.
const CITY_GROUND_F = frame(`
  CCCCCCCCCCCCCCCC
  ccDcccccccDccccc
  ccDcdcccccDccdcc
  cdDcccccdcDccccc
  ccDcccdcccDccccc
  cdDcccccccDcccdc
  ccDcdcccccDccccc
  ccDcccccdcDcccdc
  cdDcccccccDccccc
  ccDcccdcccDcdccc
  ccDccdccccDccccc
  cdDcccccccDccccc
  ccDcccccdcDcccdc
  ccDccdccccDccccc
  cdDcccccccDcdccc
  ccDcccdcccDccccc
`);

// Concrete GROUND_FILL: the same c/D/d concrete body with NO lit lip, so a
// stacked column of solids only shows the bright curb on its exposed crown. The
// joint columns 2 & 10 continue unbroken so fills tile into a seamless slab.
const CITY_GROUND_FILL_F = frame(`
  ccDcccdcccDccccc
  cdDcccccccDcccdc
  ccDcdcccccDccccc
  ccDcccccdcDcccdc
  cdDcccccccDccccc
  ccDcccdcccDcdccc
  ccDccdccccDccccc
  cdDcccccccDccccc
  ccDcccccdcDcccdc
  ccDccdccccDccccc
  cdDcccccccDcdccc
  ccDcccdcccDccccc
  ccDcdcccccDccdcc
  cdDcccccdcDccccc
  ccDcccdcccDccccc
  cdDcccccccDcccdc
`);

// Glass-and-steel curtain-wall BLOCK (solid): a window grid — dark d mullions
// on the tile edges (cols 0 & 8, rows 0 & 8) so panes align across tiles — with
// b glass panes, a B top-left highlight per pane and an N reflection streak.
const CITY_GLASS_F = frame(`
  dddddddddddddddd
  dBBbbbbbdBBbbbbb
  dBbbbbbbdBbbbbbb
  dbbbbbNbdbbbbbNb
  dbbbbNNbdbbbbNNb
  dbbbbbbbdbbbbbbb
  dbbbNbbbdbbbNbbb
  dbbbbbbbdbbbbbbb
  dddddddddddddddd
  dBBbbbbbdBBbbbbb
  dBbbbbbbdBbbbbbb
  dbbbbbNbdbbbbbNb
  dbbbbNNbdbbbbNNb
  dbbbbbbbdbbbbbbb
  dbbbNbbbdbbbNbbb
  dbbbbbbbdbbbbbbb
`);

// Construction girder ONE-WAY platform: a steel I-beam edge — lit top flange
// (C/c), a riveted web (C studs on d), a hazard-tape stripe (Y/K), a shadowed
// bottom flange (D) — then transparent. Only the top face blocks (scene-set).
const CITY_GIRDER_F = frame(`
  CCCCCCCCCCCCCCCC
  cccccccccccccccc
  dCddddCddddCdddd
  YKYKYKYKYKYKYKYK
  DDDDDDDDDDDDDDDD
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

// City ROAD surface (solid ground variant): dark asphalt speckle (K/k) with a
// dashed centre lane line (Y) on a period-8 rhythm so it reads continuous when
// tiled along the street.
const CITY_ROAD_F = frame(`
  kKkkKkkkKkkkKkkk
  KkkKkkkKkkkKkkkK
  kkKkkkkKkkkkKkkk
  KkkkKkkkkKkkkKkk
  kKkkkkKkkkkKkkkk
  kkkKkkkKkkkKkkkK
  KkkkkKkkkkKkkkkk
  kYYYkkkkkYYYkkkk
  kYYYkkkkkYYYkkkk
  KkkkkKkkkKkkkKkk
  kKkkkkKkkkkKkkkk
  kkkKkkkKkkkKkkkK
  KkkkKkkkkKkkkKkk
  kKkkkkKkkkkKkkkk
  kkKkkkkKkkkkKkkk
  KkkkKkkkKkkkKkkk
`);

// Neon signage DECOR (2f) — an original "broken crown" sign in magenta tube
// (E) with white-hot cores (W) on a dark mount (K). Frame 0 fully lit; frame 1
// flickers: segments drop to unlit k and the cores cool to y.
const CITY_NEON_0 = frame(`
  KKKKKKKKKKKKKKKK
  KKKKKKKEKKKKKKKK
  KKKEKKKEKKKKEKKK
  KKKEKKKEKKKKEKKK
  KEKEKKEKEKKEKEKK
  KEKEKEKKEKEKEKEK
  KEEEEEKKEEEKEEKK
  KEEEEEEEEEEEEEKK
  KEWEWEWEWEWEWEKK
  KEEEEEEEEEEEEEKK
  KKEEEEEEEEEEEKKK
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
`);

const CITY_NEON_1 = frame(`
  KKKKKKKKKKKKKKKK
  KKKKKKKEKKKKKKKK
  KKKEKKKEKKKKkKKK
  KKKEKKKEKKKKkKKK
  KEKEKKEKEKKKKEKK
  KEKEKEKKEKEKEKEK
  KEEEEEKKEEEKEEKK
  KEEEEEEEEEEEEEKK
  KEyEyEyEyEyEyEKK
  KEEEEEEEEEEEEEKK
  KKEEEEEEkEEEEKKK
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
  KKKKKKKKKKKKKKKK
`);

// ============================================================================
// BIOME B — East-Asian mountain temple (16x16 gameplay tiles)
// ============================================================================

// Temple stone-path GROUND: a lit warm flagstone lip (P) over aged sandstone
// masonry (p) in a running-bond course — full k mortar lines every 4 rows
// (y = 3,7,11,15) with staggered vertical joints and creeping moss (g/F).
const TEMPLE_GROUND_F = frame(`
  PPPPPPPPPPPPPPPP
  ppkpppgpppkppppp
  ppkpppppppkppppp
  kkkkkkkkkkkkkkkk
  ppppppkpppppppkp
  pgppppkpppppppkp
  ppppppkppppFpppk
  kkkkkkkkkkkkkkkk
  ppkpppppppkppppp
  ppkpPppgppkppppp
  ppkpppppppkppppp
  kkkkkkkkkkkkkkkk
  ppppppkpppppppkp
  pgppppkpppppppkp
  ppppppkppppFpppk
  kkkkkkkkkkkkkkkk
`);

// Temple masonry GROUND_FILL: the same running-bond sandstone with NO lit lip;
// mortar courses at y = 3,7,11,15 continue the coursing so fills tile cleanly.
const TEMPLE_GROUND_FILL_F = frame(`
  pPkpppppppkppppg
  ppkpppgpppkppppp
  ppkpppppppkppppp
  kkkkkkkkkkkkkkkk
  ppppppkpppppppkp
  pgppppkpppppppkp
  ppppppkpppppppkp
  kkkkkkkkkkkkkkkk
  ppkpppppppkppppp
  ppkppgppppkppppp
  ppkpppppppkppppg
  kkkkkkkkkkkkkkkk
  ppppppkpppppppkp
  pgppppkpppppppkp
  ppppppkpppppppkp
  kkkkkkkkkkkkkkkk
`);

// Temple dressed-stone STAIR block: one grand step — a bright lit tread (P) at
// the top, then a shadowed riser face (p) with cut-stone joints (k) darkening
// to a base shadow. Stacking/offsetting these reads as the temple stairway.
const TEMPLE_STAIR_F = frame(`
  PPPPPPPPPPPPPPPP
  PPppppppppppppkk
  pppkppppppppkppk
  pppkppppppppkppk
  pppkppppppppkppk
  pppkppppppppkppk
  pppkppppppppkppk
  pppkppppppppkppk
  pppkppppppppkppk
  pppkppppppppkppk
  pppkppppppppkppk
  pppkppppppppkppk
  pppkppppppppkppk
  ppkkppppppkpkppk
  kppkkppppppkkppk
  kkkkkkkkkkkkkkkk
`);

// Temple timber ONE-WAY platform: a gold-trimmed lacquer beam — gold ridge (Y),
// a red lacquer band (e), wood grain (w with s highlight / h shadow), a shadow
// underside — then transparent. Only the top face blocks (scene-set).
const TEMPLE_ONEWAY_F = frame(`
  YyYyYyYyYyYyYyYy
  eeeeeeeeeeeeeeee
  wswwswwswwswwsww
  whwwhwwhwwhwwhww
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
`);

// Hanging paper lantern DECOR (2f): a red globe (e) with gold ribs (y) and gold
// caps, a warm glowing core (Y), on a dark cord, with a tassel. Frame 0 bright;
// frame 1 the glow dims (Y→y) and the tassel sways — a gentle flicker.
const TEMPLE_LANTERN_0 = frame(`
  .......k........
  .......k........
  .....yyyyyy.....
  ....eeeeeeee....
  ...eeyeeeeyee...
  ...eyeeYYeeye...
  ..eeyeeYYeeyee..
  ..eeyeeYYeeyee..
  ..eeyeeYYeeyee..
  ...eyeeYYeeye...
  ...eeyeeeeyee...
  ....eeeeeeee....
  .....yyyyyy.....
  ......yYy.......
  .......e........
  .......e........
`);

const TEMPLE_LANTERN_1 = frame(`
  .......k........
  .......k........
  .....yyyyyy.....
  ....eeeeeeee....
  ...eeyeeeeyee...
  ...eyeeyyeeye...
  ..eeyeeyYeeyee..
  ..eeyeeyYeeyee..
  ..eeyeeyyeeyee..
  ...eyeeyyeeye...
  ...eeyeeeeyee...
  ....eeeeeeee....
  .....yyyyyy.....
  .......yYy......
  ........e.......
  ........e.......
`);

// ============================================================================
// TRANSITION tiles (blend biome A -> B)
// ============================================================================

// Transition GROUND: concrete (c, left) fracturing along a jagged K crack into
// warm temple flagstone (p/P, right), with moss (g) creeping across. Placed in
// a run, the map dissolves from city sidewalk to stone path.
const TRANS_GROUND_F = frame(`
  CCCCCCCCPPPPPPPP
  cccccKcppPppgppp
  ccKcccKcpppppppp
  cccKccKppppkpppp
  ccccKcKkkkkkkkkk
  cKcccKcppppppgpp
  cccKcKcpppkppppp
  ccccKKckkkkkkkkk
  ccKccKcppppppppp
  cccKcKcpppgppppp
  cKcccKcppppkpppp
  cccccKKkkkkkkkkk
  ccKcccKppppppppp
  cccKccKcpgpppppp
  ccccKcKppppkpppp
  cKcccKKkkkkkkkkk
`);

// Transition WALL (solid block): a glass curtain wall (b/N, upper-left)
// shattering along K cracks into aged brick (p/P) with ivy (g/F) climbing from
// the lower-right — a building visibly aging into temple masonry.
const TRANS_WALL_F = frame(`
  dddddddddddddddd
  dBbbbbKppkppppgp
  dbbNbbKppppkpFpp
  dbbbbKcppkppgppp
  dbKbbKcpppppppFp
  dbbbKKppkpgppppp
  dbbbKcppppppkgpp
  ddKKKcppgpkppFpp
  cpKcpppppppppgpp
  ppcpppkppgppppFp
  ppppgpppppkpgppp
  pkppppFpppppppgp
  ppppgpppkpppgFpp
  pgpppppppppgpppp
  ppkppgpFppgppkFp
  pppppppgppppgppp
`);

// ============================================================================
// Great temple DOOR (32x48, two 16x48 tiles L | R; R mirrors L)
// ============================================================================

// The left half of a grand double door: an upturned jade-tiled pagoda eave (J
// roof, Y ridge, k underside) rising toward the centre ridge, a red-lacquer
// lintel beam (e) with gold dentils (Y), tall wooden door leaves (w planks,
// h seams, e frame edge) studded with gold bosses (Y) and a central handle
// column, over a dressed-stone threshold. The right tile is this mirrored, so
// the two together peak at the centre and their handles meet.
const TEMPLE_DOOR_L_F = frame(`
  ..............YY
  .............YJJ
  ............YJJJ
  ...........YJJJJ
  ..........YJJJJk
  .........YJJJJJk
  Y.......YJJJJJJk
  JY.....YJJJJJJJk
  JJY...YJJJJJJJJk
  JJJYYYJJJJJJJJJk
  kkkkkkkkkkkkkkkk
  eeeeeeeeeeeeeeee
  eYeYeYeYeYeYeYeY
  eeeeeeeeeeeeeeee
  wwwwwwwwwwwwwwww
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  ewYwwwYwwYwwwYwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  ewYwwwYwwYwwwYwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwYY
  ewwhwwwwhwwwhwYY
  ewwhwwwwhwwwhwwY
  ewYwwwYwwYwwwYwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  ewYwwwYwwYwwwYwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  ewYwwwYwwYwwwYwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  ewwhwwwwhwwwhwwY
  wwwwwwwwwwwwwwww
  PPPPPPPPPPPPPPPP
  pppppppppppppppp
  pppkppppppppkppp
  kkkkkkkkkkkkkkkk
  dddddddddddddddd
  kkkkkkkkkkkkkkkk
`);
const TEMPLE_DOOR_R_F = mirrorFrame(TEMPLE_DOOR_L_F);

// Hazard cell (`^`): an open construction/runoff pit — dark void, amber warning
// shimmer along the lip that blinks between frames. Reads as danger in both
// biomes (street works pit early, mountain runoff creek late).
const CITY_HAZARD_0 = frame(`
  MKkkKKkkKKkkKKkM
  kOKOOKKOOKKOOKOk
  KOOOOOOOOOOOOOOK
  kOOKOOOOOOOOKOOk
  KOOOOOOOOOOOOOOK
  kOOOOOKOOKOOOOOk
  KOOOOOOOOOOOOOOK
  kOKOOOOOOOOOOKOk
  KOOOOOOOOOOOOOOK
  kOOOOKOOOOKOOOOk
  KOOOOOOOOOOOOOOK
  kOOKOOOOOOOOKOOk
  KOOOOOOOOOOOOOOK
  kOOOOOOKKOOOOOOk
  KOOOOOOOOOOOOOOK
  kkkkkkkkkkkkkkkk
`);
const CITY_HAZARD_1 = frame(`
  kKkkMMkkMMkkKKkk
  KOKOOKKOOKKOOKOK
  kOOOOOOOOOOOOOOk
  KOOKOOOOOOOOKOOK
  kOOOOOOOOOOOOOOk
  KOOOOOKOOKOOOOOK
  kOOOOOOOOOOOOOOk
  KOKOOOOOOOOOOKOK
  kOOOOOOOOOOOOOOk
  KOOOOKOOOOKOOOOK
  kOOOOOOOOOOOOOOk
  KOOKOOOOOOOOKOOK
  kOOOOOOOOOOOOOOk
  KOOOOOOKKOOOOOOK
  kOOOOOOOOOOOOOOk
  KKKKKKKKKKKKKKKK
`);

// ============================================================================
// SpriteDefs
// ============================================================================

export const CITY_HAZARD_ANIM = "blink";
export const CITY_HAZARD: SpriteDef = {
  key: "tile-city-hazard",
  w: 16,
  h: 16,
  frames: [CITY_HAZARD_0, CITY_HAZARD_1],
  anims: [{ key: CITY_HAZARD_ANIM, frames: [0, 1], frameRate: 2, repeat: -1 }],
};

export const CITY_GROUND: SpriteDef = { key: "tile-city-ground", w: 16, h: 16, frames: [CITY_GROUND_F] };
export const CITY_GROUND_FILL: SpriteDef = { key: "tile-city-ground-fill", w: 16, h: 16, frames: [CITY_GROUND_FILL_F] };
export const CITY_GLASS: SpriteDef = { key: "tile-city-glass", w: 16, h: 16, frames: [CITY_GLASS_F] };
export const CITY_GIRDER: SpriteDef = { key: "tile-city-girder", w: 16, h: 16, frames: [CITY_GIRDER_F] };
export const CITY_ROAD: SpriteDef = { key: "tile-city-road", w: 16, h: 16, frames: [CITY_ROAD_F] };

export const CITY_NEON_ANIM = "flicker";
export const CITY_NEON: SpriteDef = {
  key: "decor-city-neon",
  w: 16,
  h: 16,
  frames: [CITY_NEON_0, CITY_NEON_1],
  anims: [{ key: CITY_NEON_ANIM, frames: [0, 1], frameRate: 3, repeat: -1 }],
};

export const TEMPLE_GROUND: SpriteDef = { key: "tile-temple-ground", w: 16, h: 16, frames: [TEMPLE_GROUND_F] };
export const TEMPLE_GROUND_FILL: SpriteDef = { key: "tile-temple-ground-fill", w: 16, h: 16, frames: [TEMPLE_GROUND_FILL_F] };
export const TEMPLE_STAIR: SpriteDef = { key: "tile-temple-stair", w: 16, h: 16, frames: [TEMPLE_STAIR_F] };
export const TEMPLE_ONEWAY: SpriteDef = { key: "tile-temple-oneway", w: 16, h: 16, frames: [TEMPLE_ONEWAY_F] };

export const TEMPLE_LANTERN_ANIM = "glow";
export const TEMPLE_LANTERN: SpriteDef = {
  key: "decor-temple-lantern",
  w: 16,
  h: 16,
  frames: [TEMPLE_LANTERN_0, TEMPLE_LANTERN_1],
  anims: [{ key: TEMPLE_LANTERN_ANIM, frames: [0, 1], frameRate: 2, repeat: -1 }],
};

export const TRANS_GROUND: SpriteDef = { key: "tile-trans-ground", w: 16, h: 16, frames: [TRANS_GROUND_F] };
export const TRANS_WALL: SpriteDef = { key: "tile-trans-wall", w: 16, h: 16, frames: [TRANS_WALL_F] };

export const TEMPLE_DOOR_L: SpriteDef = { key: "decor-temple-door-l", w: 16, h: 48, frames: [TEMPLE_DOOR_L_F] };
export const TEMPLE_DOOR_R: SpriteDef = { key: "decor-temple-door-r", w: 16, h: 48, frames: [TEMPLE_DOOR_R_F] };

// ============================================================================
// Parallax backdrop (480x270), code-generated
// ============================================================================

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

/** Dithered vertical gradient sample: pick between adjacent stops by the
 *  fractional position, hashed so the boundary is a stable stipple. */
function gradSample(stops: string[], t: number, x: number, y: number): string {
  const f = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(f));
  const frac = f - i;
  return hash(x, y) % 100 < frac * 100 ? stops[i + 1] : stops[i];
}

// Layer 0: sky. A vertical dusk gradient that ALSO shifts across its width —
// cool blue-gray on the left (city) into a warm dawn on the right (temple). The
// upper sky stays dark/cool across the whole width; only the lower third warms
// (violet dusk into orange), so the handoff is a soft horizontal fade near the
// horizon rather than an all-over red wash. Violet stars speck the cool
// upper-left, a pale moon hangs left, and a gold pool over a jade band glows at
// the right horizon.
function skyRows(): string[] {
  const cool = ["K", "K", "N", "N", "b", "c"]; // top -> horizon (blue-gray dusk)
  const warm = ["K", "k", "N", "U", "m", "M"]; // cool up top, warm only near horizon
  const rows: string[] = [];
  for (let y = 0; y < BG_H; y++) {
    const t = y / (BG_H - 1);
    let row = "";
    for (let x = 0; x < BG_W; x++) {
      const u = x / (BG_W - 1);
      const uu = Math.pow(u, 1.3); // bias the warmth toward the right edge
      let ch: string;
      if (y >= HORIZON_Y) {
        // Below the horizon: a calm, near-black ground haze. (The gradient
        // used to keep dithering full-height, leaving a loud noise band
        // behind the playfield between skyline and foreground.)
        const depth = (y - HORIZON_Y) / (BG_H - HORIZON_Y);
        ch = hash(x * 7 + 1, y * 3 + 5) % 100 < 20 - depth * 16 ? "k" : "K";
      } else {
        const coolCh = gradSample(cool, t, x, y);
        const warmCh = gradSample(warm, t, x, y);
        ch = hash(x * 2 + 5, y * 2 + 9) % 100 < uu * 100 ? warmCh : coolCh;
        // Thin drifting haze bands across the cool left sky (soft horizontal
        // streaks, sine-warped so they read as strata, not scanlines).
        const band = Math.sin(y / 9 + Math.sin(x / 31) * 1.7);
        if (u < 0.55 && y > 40 && y < 150 && band > 0.86 && hash(x * 3 + 7, y * 5 + 1) % 100 < 34)
          ch = y < 95 ? "N" : "b";
        // Gold streak clouds hanging over the warm right horizon.
        if (u > 0.55 && y > HORIZON_Y - 58 && y < HORIZON_Y - 26) {
          const streak = Math.sin(y / 3.2 + x / 17);
          if (streak > 0.94 && hash(x * 9 + 2, y * 7 + 6) % 100 < 60)
            ch = y < HORIZON_Y - 44 ? "y" : "M";
        }
      }
      // Pale moon, upper-left cool sky: soft C disc, c crescent shade, a few
      // hashed craters, and a thin d halo feathering into the sky.
      const mx = 74,
        my = 52,
        mr = 13;
      const dm = Math.hypot(x - mx, y - my);
      if (dm < mr) {
        ch = (x - mx) * 0.5 + (y - my) * 0.3 > 2 ? "c" : "C";
        if (hash(x * 11 + 3, y * 13 + 8) % 23 === 0) ch = "c"; // craters
      } else if (dm < mr + 3 && y < HORIZON_Y) {
        if (hash(x * 5 + 9, y * 3 + 4) % 100 < 40 - (dm - mr) * 12) ch = "d"; // halo
      }
      // Cool stars, upper-left only (kept off the moon): a violet field with
      // a rarer bright-white tier.
      if (y < BG_H * 0.42 && u < 0.5 && dm > mr + 3) {
        const star = hash(x * 3 + 1, y * 7 + 2);
        if (star % 760 === 0) ch = "V";
        else if (star % 1861 === 0) ch = "W";
      }
      // Warm horizon glow, lower-right: a gold pool over a jade band.
      if (u > 0.5 && y > HORIZON_Y - 34 && y < HORIZON_Y) {
        const gz = hash(x * 5 + 3, y * 9 + 4) % 5;
        if (y > HORIZON_Y - 11) ch = gz < 3 ? "J" : "t";
        else if (y > HORIZON_Y - 22) ch = gz < 3 ? "Y" : "M";
        else if (gz === 0) ch = "y";
      }
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

// Layer 1: the handoff skyline. City tower silhouettes (D bodies, D/K edges,
// lit b/B windows) crowd the left; they thin out mid-frame where a mountain
// ridge rises; a temple pagoda silhouette (K body, e roof glints, Y finial)
// sits on the right ridge. Transparent above so the sky shows through.
function skylineRows(): string[] {
  const g = blank();

  // Distant second ridge — hazier (d crest over D body), drawn FIRST so the
  // near ridge overlaps it. Far right only, tracking ~14px above the near
  // ridge line: a depth sliver behind the pagoda, never a wall over the warm
  // dusk sky (an earlier, taller version blanketed the whole right sky).
  for (let x = 0; x < BG_W; x++) {
    const u = x / (BG_W - 1);
    if (u < 0.62) continue;
    const base = HORIZON_Y - 14 - Math.floor((u - 0.32) * 150);
    const n = (hash(Math.floor(x / 11), 29) % 18) - 6;
    const ridge = Math.max(56, base - n);
    for (let y = ridge; y < HORIZON_Y; y++) g[y][x] = y <= ridge + 1 ? "d" : "D";
  }

  // Near mountain ridge across the right two-thirds, rising toward the right.
  for (let x = 0; x < BG_W; x++) {
    const u = x / (BG_W - 1);
    if (u < 0.32) continue;
    // Two overlapped ridge humps via hashed noise + a rising base.
    const base = HORIZON_Y - Math.floor((u - 0.32) * 150);
    const n = (hash(Math.floor(x / 7), 11) % 22) - 6;
    const ridge = Math.max(30, base - n);
    for (let y = ridge; y < HORIZON_Y; y++) {
      const edge = y <= ridge + 1;
      g[y][x] = edge ? "D" : "K";
    }
  }

  // City towers along the left, descending in density toward the middle.
  let tx = 4;
  while (tx < BG_W * 0.6) {
    const tw = 16 + (hash(tx, 7) % 22);
    const maxH = 150 - Math.floor((tx / (BG_W * 0.6)) * 96); // shorter to the right
    const th = 44 + (hash(tx, 13) % Math.max(20, maxH));
    const top = HORIZON_Y - th;
    for (let y = Math.max(0, top); y < HORIZON_Y; y++) {
      for (let xx = tx; xx < Math.min(tx + tw, BG_W); xx++) {
        const edge = xx === tx || xx === tx + tw - 1 || y === top;
        // Lit windows on a grid: mostly b, a bright B tier, a rare magenta E
        // sign among them.
        let ch = "D";
        if (!edge && (xx - tx) % 4 === 2 && (y - top) % 5 === 2) {
          const r = hash(xx, y) % 17;
          ch = r === 0 ? "E" : r < 4 ? "B" : "b";
        }
        g[y][xx] = edge ? "K" : ch;
      }
    }
    // Rooftop furniture: an antenna mast (R warning light) or a squat water
    // tank, hashed per tower so the roofline stops reading as a bare comb.
    const roofKind = hash(tx, 17) % 3;
    if (roofKind === 0) {
      const ax = tx + 3 + (hash(tx, 19) % Math.max(1, tw - 6));
      const ah = 6 + (hash(tx, 23) % 9);
      for (let y = Math.max(0, top - ah); y < top; y++) g[y][ax] = "D";
      if (top - ah - 1 >= 0) g[top - ah - 1][ax] = "R";
    } else if (roofKind === 1 && tw >= 12) {
      const wx = tx + 2 + (hash(tx, 31) % Math.max(1, tw - 10));
      for (let y = Math.max(0, top - 5); y < top; y++)
        for (let xx = wx; xx < wx + 7; xx++) g[y][xx] = y === top - 5 ? "D" : "k";
    }
    tx += tw + 2 + (hash(tx, 3) % 8);
  }

  // Temple pagoda silhouette on the right ridge (three stacked upturned roofs
  // with a finial), sitting above the mountain line.
  const pcx = Math.floor(BG_W * 0.86);
  const pbase = HORIZON_Y - Math.floor((0.86 - 0.32) * 150) - 6;
  const stamp = (cx: number, y0: number, halfW: number, roofCh: string) => {
    for (let dy = 0; dy < 7; dy++) {
      const w = halfW - dy;
      for (let dx = -w; dx <= w; dx++) {
        const px = cx + dx;
        const py = y0 + dy;
        if (px >= 0 && px < BG_W && py >= 0 && py < BG_H) {
          // Two-px lacquer courses so the roofs read as solid planes against
          // the dark sky (single-px edges looked like hollow wireframes).
          g[py][px] = dy <= 1 || Math.abs(dx) >= w - 1 ? roofCh : "K";
        }
      }
      // upturned tips
      if (dy === 6) {
        if (cx - w - 1 >= 0) g[y0 + dy - 1][cx - w - 1] = roofCh;
        if (cx + w + 1 < BG_W) g[y0 + dy - 1][cx + w + 1] = roofCh;
      }
    }
    // body under this roof, warm window slits glowing through the dark
    for (let by = y0 + 7; by < y0 + 12; by++) {
      for (let bx = cx - (halfW - 8); bx <= cx + (halfW - 8); bx++) {
        if (bx >= 0 && bx < BG_W && by >= 0 && by < BG_H) {
          g[by][bx] = (bx - cx) % 5 === 0 && by === y0 + 9 ? "Y" : "K";
        }
      }
    }
  };
  stamp(pcx, pbase - 40, 12, "e"); // top roof
  stamp(pcx, pbase - 22, 17, "e"); // mid roof
  stamp(pcx, pbase - 4, 22, "e"); // base roof
  if (pbase - 44 >= 0) {
    g[pbase - 44][pcx] = "Y"; // finial
    g[pbase - 45][pcx] = "Y";
  }

  return g.map((r) => r.join(""));
}

// Layer 2: foreground band. Left = near rooftop clutter (water tanks, antennae,
// vents in k/D with a stray lit b). Right = pine-tree silhouettes (F/g) and a
// temple perimeter wall (p body, J jade coping, e post caps). Transparent above
// the band so the skyline reads behind.
function foregroundRows(): string[] {
  const g = blank();
  const bandTop = 214;

  // Solid near-ground band along the bottom.
  for (let x = 0; x < BG_W; x++) {
    const u = x / (BG_W - 1);
    if (u < 0.5) {
      // City rooftop parapet.
      for (let y = bandTop + 6; y < BG_H; y++) g[y][x] = (x + y) % 7 === 0 ? "D" : "k";
    } else {
      // Temple wall with a jade coping course + cinnabar post caps.
      for (let y = bandTop + 6; y < BG_H; y++) {
        g[y][x] = y === bandTop + 6 ? "J" : y === bandTop + 7 ? "t" : (x + y) % 6 === 0 ? "k" : "p";
      }
      if (x % 28 === 0) g[bandTop + 6][x] = "e";
    }
  }

  // Left: water tanks, antennae, and squat AC boxes rising off the parapet.
  let cx = 20;
  while (cx < BG_W * 0.5) {
    const kind = hash(cx, 5) % 3;
    if (kind === 0) {
      // water tank (rounded block on legs)
      const tw = 18 + (hash(cx, 2) % 10);
      const th = 16 + (hash(cx, 8) % 8);
      for (let y = bandTop - th; y < bandTop + 6; y++) {
        for (let xx = cx; xx < Math.min(cx + tw, BG_W); xx++) {
          const edge = xx === cx || xx === cx + tw - 1 || y === bandTop - th;
          g[y][xx] = edge ? "D" : "k";
        }
      }
      if (hash(cx, 9) % 2 === 0) g[bandTop - th + 3][cx + 3] = "b"; // lit port
    } else if (kind === 1) {
      // antenna mast
      const mh = 24 + (hash(cx, 4) % 30);
      for (let y = bandTop + 6 - mh; y < bandTop + 6; y++) g[y][cx] = "D";
      g[bandTop + 6 - mh][cx] = "R"; // aircraft-warning light
      if (cx + 2 < BG_W) for (let y = bandTop - 6; y < bandTop + 6; y++) g[y][cx + 2] = "k";
    } else {
      // AC box: a squat vented unit sitting on the parapet
      const bw = 10 + (hash(cx, 12) % 6);
      for (let y = bandTop - 4; y < bandTop + 6; y++) {
        for (let xx = cx; xx < Math.min(cx + bw, BG_W); xx++) {
          const edge = y === bandTop - 4 || xx === cx || xx === cx + bw - 1;
          g[y][xx] = edge ? "D" : (y - bandTop) % 2 === 0 ? "d" : "k";
        }
      }
    }
    cx += 34 + (hash(cx, 6) % 30);
  }

  // Right: pine trees along the temple wall.
  let px = Math.floor(BG_W * 0.52);
  while (px < BG_W) {
    const th = 30 + (hash(px, 5) % 22);
    const top = bandTop + 6 - th;
    for (let dy = 0; dy < th - 6; dy++) {
      const w = Math.floor((dy / (th - 6)) * 9) + 1;
      for (let dx = -w; dx <= w; dx++) {
        const xx = px + dx;
        if (xx >= 0 && xx < BG_W && top + dy >= 0) {
          g[top + dy][xx] = Math.abs(dx) === w ? "F" : dy < 3 ? "g" : "F";
        }
      }
    }
    for (let dy = th - 6; dy < th; dy++) {
      if (top + dy < BG_H && top + dy >= 0) g[top + dy][px] = "h"; // trunk
    }
    px += 30 + (hash(px, 7) % 26);
  }

  // Stone lanterns spaced between the pines: sepia pillar, capped housing
  // with a warm Y light — drawn last so they stand in front of the trees.
  let lx = Math.floor(BG_W * 0.56) + 9;
  while (lx < BG_W - 3) {
    const baseY = bandTop + 5;
    for (let y = baseY - 7; y <= baseY; y++) g[y][lx] = "p";
    g[baseY - 8][lx - 1] = "k";
    g[baseY - 8][lx] = "Y"; // the light
    g[baseY - 8][lx + 1] = "k";
    g[baseY - 9][lx - 1] = "p";
    g[baseY - 9][lx] = "P";
    g[baseY - 9][lx + 1] = "p"; // cap
    lx += 52 + (hash(lx, 9) % 40);
  }

  return g.map((r) => r.join(""));
}

export const CITY_BG0: SpriteDef = { key: "bg-city-0", w: BG_W, h: BG_H, frames: [skyRows()] };
export const CITY_BG1: SpriteDef = { key: "bg-city-1", w: BG_W, h: BG_H, frames: [skylineRows()] };
export const CITY_BG2: SpriteDef = { key: "bg-city-2", w: BG_W, h: BG_H, frames: [foregroundRows()] };

// ============================================================================
// Registry
// ============================================================================

export const CITY_TILES: SpriteDef[] = [
  CITY_GROUND,
  CITY_GROUND_FILL,
  CITY_GLASS,
  CITY_GIRDER,
  CITY_ROAD,
  CITY_NEON,
  TEMPLE_GROUND,
  TEMPLE_GROUND_FILL,
  TEMPLE_STAIR,
  TEMPLE_ONEWAY,
  TEMPLE_LANTERN,
  TRANS_GROUND,
  TRANS_WALL,
  TEMPLE_DOOR_L,
  TEMPLE_DOOR_R,
  CITY_HAZARD,
];
export const CITY_PARALLAX: SpriteDef[] = [CITY_BG0, CITY_BG1, CITY_BG2];

// Single source of truth for the bare texture keys the scene references, shared
// with the integrity test so the strings can't drift. Animated defs (neon,
// lantern) are addressed by their anim key; single frames resolve by bare key.
export const CITY_TILE_KEYS = {
  cityGround: CITY_GROUND.key,
  cityGroundFill: CITY_GROUND_FILL.key,
  cityGlass: CITY_GLASS.key,
  cityGirder: CITY_GIRDER.key,
  cityRoad: CITY_ROAD.key,
  cityNeon: CITY_NEON.key,
  templeGround: TEMPLE_GROUND.key,
  templeGroundFill: TEMPLE_GROUND_FILL.key,
  templeStair: TEMPLE_STAIR.key,
  templeOneWay: TEMPLE_ONEWAY.key,
  templeLantern: TEMPLE_LANTERN.key,
  transGround: TRANS_GROUND.key,
  transWall: TRANS_WALL.key,
  templeDoorL: TEMPLE_DOOR_L.key,
  templeDoorR: TEMPLE_DOOR_R.key,
  hazard: CITY_HAZARD.key,
} as const;

export const CITY_PARALLAX_KEYS = {
  bg0: CITY_BG0.key,
  bg1: CITY_BG1.key,
  bg2: CITY_BG2.key,
} as const;
