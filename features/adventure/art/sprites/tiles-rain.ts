import { frame } from "../grid";
import type { SpriteDef } from "../textures";

// World 1-4 "The Rain Kingdom" tileset + parallax backdrop.
//
// A DUAL-BIOME kit: (A) England-inspired dark wet streets — cobble, wet brick,
// rooftop slate, one-way iron ledges, a stone bridge, clock-tower masonry, an
// iron fence, a 2-frame streetlight, and a clock face; (B) an abandoned
// cathedral — dressed sandstone, rounded pillars, a 2-frame stained-glass
// window, a chandelier, a bronze bell, and a graveyard headstone, plus a
// churchyard spike hazard. Rain and fog are SCENE OVERLAYS, not tiles.
//
// The three 16x16-and-up gameplay/decor tiles are hand-authored pixel grids.
// The three parallax layers are 480x270 and code-generated (a foggy night sky
// with a hazy moon, an England rooftop skyline carrying a clock tower, and a
// receding gothic-nave interior-depth strip) — deterministic generators build
// them at module load so the art/tiles.test.ts integrity test is reproducible.
//
// Palette: reuses the global chars aggressively and adds four Rain-Kingdom
// chars — remapped in-repo from the kit's E/e/A/a (all four now taken by
// other worlds) to Z/q wet brick and I/l wet slate (palette.ts, Task 40).

// --- streets ----------------------------------------------------------------

const COBBLE = frame(`
  lIIKlIIKlIIKlIIK
  IIIKIIIKIIIKIIIK
  IDDKIDDKIDDKIDDK
  KKKKKKKKKKKKKKKK
  IKlIIKlIIKlIIKlI
  IKIIIKIIIKIIIKII
  DKIDDKIDDKIDDKID
  KKKKKKKKKKKKKKKK
  lIIKlIIKlIIKlIIK
  IIIKIIIKIIIKIIIK
  IDDKIDDKIDDKIDDK
  KKKKKKKKKKKKKKKK
  IKlIIKlIIKlIIKlI
  IKIIIKIIIKIIIKII
  DKIDDKIDDKIDDKID
  KKKKKKKKKKKKKKKK
`);

const COBBLE_FILL = frame(`
  IIIKIIIKIIIKIIIK
  IIIKIIIKIIIKIIIK
  IDDKIDDKIDDKIDDK
  KKKKKKKKKKKKKKKK
  IKIIIKIIIKIIIKII
  IKIIIKIIIKIIIKII
  DKIDDKIDDKIDDKID
  KKKKKKKKKKKKKKKK
  IIIKIIIKIIIKIIIK
  IIIKIIIKIIIKIIIK
  IDDKIDDKIDDKIDDK
  KKKKKKKKKKKKKKKK
  IKIIIKIIIKIIIKII
  IKIIIKIIIKIIIKII
  DKIDDKIDDKIDDKID
  KKKKKKKKKKKKKKKK
`);

const BRICK = frame(`
  sZZksZZksZZksZZk
  ZZZkZZZkZZZkZZZk
  qqqkqqqkqqqkqqqk
  kkkkkkkkkkkkkkkk
  ZksZZksZZksZZksZ
  ZkZZZkZZZkZZZkZZ
  qkqqqkqqqkqqqkqq
  kkkkkkkkkkkkkkkk
  sZZksZZksZZksZZk
  ZZZkZZZkZZZkZZZk
  qqqkqqqkqqqkqqqk
  kkkkkkkkkkkkkkkk
  ZksZZksZZksZZksZ
  ZkZZZkZZZkZZZkZZ
  qkqqqkqqqkqqqkqq
  kkkkkkkkkkkkkkkk
`);

const SLATE = frame(`
  llllllllllllllll
  IIIDIIIDIIIDIIID
  IIIDIIIDIIIDIIID
  DDDkDDDkDDDkDDDk
  llllllllllllllll
  DIIIDIIIDIIIDIII
  DIIIDIIIDIIIDIII
  kDDDkDDDkDDDkDDD
  llllllllllllllll
  IIIDIIIDIIIDIIID
  IIIDIIIDIIIDIIID
  DDDkDDDkDDDkDDDk
  llllllllllllllll
  DIIIDIIIDIIIDIII
  DIIIDIIIDIIIDIII
  kDDDkDDDkDDDkDDD
`);

const ONEWAY = frame(`
  llllllllllllllll
  DdDDdDDdDDdDDdDD
  kkkkkkkkkkkkkkkk
  .K..K..K..K..K..
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

const BRIDGE = frame(`
  CCCCCCCCCCCCCCCC
  lIIIIIIIIIIIIIIl
  KKKKKKKKKKKKKKKK
  IIIIIKIIIIKIIIIK
  IIIIIKIIIIKIIIIK
  lIIIIKIIIIKIIIIK
  KKKKKKKKKKKKKKKK
  IIKIIIIIKIIIIIKI
  IIKIIIIIKIIIIIKI
  lIKIIIIIKIIIIIKI
  KKKKKKKKKKKKKKKK
  IIIIIKIIIIKIIIIK
  IIIIIKIIIIKIIIIK
  lIIIIKIIIIKIIIIK
  KKKKKKKKKKKKKKKK
  IIKIIIIIKIIIIIKI
`);

const CLOCK_BLOCK = frame(`
  lllllllIlllllllI
  IIIIIIIDIIIIIIID
  IIIIIIIDIIIIIIID
  KKKKKKKKKKKKKKKK
  lllIlllllllIllll
  IIIDIIIIIIIDIIII
  IIIDIIIIIIIDIIII
  KKKKKKKKKKKKKKKK
  lllllllIlllllllI
  IIIIIIIDIIIIIIID
  IIIIIIIDIIIIIIID
  KKKKKKKKKKKKKKKK
  lllIlllllllIllll
  IIIDIIIIIIIDIIII
  IIIDIIIIIIIDIIII
  KKKKKKKKKKKKKKKK
`);


// --- cathedral --------------------------------------------------------------

const STONE = frame(`
  CPPPPPPpPPPPPPPp
  PPPPPPPpPPPPPPPp
  PPPPPPPpPPPPPPPp
  pppppppppppppppp
  PPPCPPPPPPPCPPPP
  PPPpPPPPPPPpPPPP
  PPPpPPPPPPPpPPPP
  pppppppppppppppp
  CPPPPPPpPPPPPPPp
  PPPPPPPpPPPPPPPp
  PPPPPPPpPPPPPPPp
  pppppppppppppppp
  PPPCPPPPPPPCPPPP
  PPPpPPPPPPPpPPPP
  PPPpPPPPPPPpPPPP
  pppppppppppppppp
`);

const PILLAR = frame(`
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
  KpPPCCWWWWCCPPpK
`);


// --- streets ----------------------------------------------------------------

const SPIKES = frame(`
  ................
  .d..d..d..d..d..
  .dD.dD.dD.dD.dD.
  dDDddDDddDDddDDd
  DDDDDDDDDDDDDDDD
  kkkkkkkkkkkkkkkk
  rXrXrXrXrXrXrXrX
  XXXXXXXXXXXXXXXX
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ................
`);

const FENCE = frame(`
  ..K..K..K..K..K.
  .KKK.KKK.KKK.KKK
  ..K..K..K..K..K.
  ..d..d..d..d..d.
  ..D..D..D..D..D.
  DDDDDDDDDDDDDDDD
  ..D..D..D..D..D.
  ..D..D..D..D..D.
  ..D..D..D..D..D.
  ..D..D..D..D..D.
  lDlDlDlDlDlDlDlD
  ..D..D..D..D..D.
  ..D..D..D..D..D.
  ..K..K..K..K..K.
  ................
  ................
`);

const LAMP_0 = frame(`
  .......DD.......
  ......DyyD......
  ......dDDd......
  .....D.MM.D.....
  ....D.MYYM.D....
  ...D.MYWWYM.D...
  ...D.YWWWWY.D...
  ...D.MYWWYM.D...
  ...D.MYYYYM.D...
  ....D.MYYM.D....
  .....D.MM.D.....
  ......dDDd......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  ......ddDd......
  .......DD.......
  .......DD.......
  .......DD.......
  ......DDDD......
  .....DddddD.....
  ....DDkkkkDD....
`);
const LAMP_1 = frame(`
  .......DD.......
  ......DddD......
  ......dDDd......
  .....D.mm.D.....
  ....D.mMMm.D....
  ...D.mMYYMm.D...
  ...D.MYYYYM.D...
  ...D.mMYYMm.D...
  ...D.mMMMMm.D...
  ....D.mMMm.D....
  .....D.mm.D.....
  ......dDDd......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  .......DD.......
  ......ddDd......
  .......DD.......
  .......DD.......
  .......DD.......
  ......DDDD......
  .....DddddD.....
  ....DDkkkkDD....
`);

const CLOCK_FACE = frame(`
  ....yKKKKKKy....
  ..yKCCCCCCCCKy..
  .yKCCCCyyCCCCKy.
  .KCCCCCyyCCCCCK.
  KCCCCCCCCCCCCCCK
  KCCCCCCyCCCCCCCK
  KyCCCCCyCCCCCCyK
  KyCCCCCKKCCCCCyK
  KCCCCCCCyyCCCCCK
  KCCCCCCCCyCCCCCK
  KCCCCCCCCCyCCCCK
  .KCCCCCyyCCCCCK.
  .yKCCCCCCCCCCKy.
  ..yKCCCCCCCCKy..
  ....yKKKKKKy....
  ................
`);


// --- cathedral --------------------------------------------------------------

const GLASS_0 = frame(`
  ......KKKK......
  ....KKvvvvKK....
  ...KvVVVVVVvK...
  ..KvVBBBBBBVvK..
  .KvVBbBBBBbBVvK.
  KvVBbBBBBBBbBVvK
  KbBBbKrRRrKbBBbK
  KbBBbKrRRrKbBBbK
  KbVVbKrYYrKbVVbK
  KbBBbKrRRrKbBBbK
  KbBBbKrRRrKbBBbK
  KGGgGKrRRrKGGgGK
  KGggGKrYYrKGggGK
  KGggGKrRRrKGggGK
  KGggGKvVVvKGggGK
  KGggGKvUUvKGggGK
  KGggGKvVVvKGggGK
  KgFFgKvUUvKgFFgK
  KgFFgKvvvvKgFFgK
  KKKKKKKKKKKKKKKK
  .KppppppppppppK.
  .KpDDDDDDDDDDpK.
  ..KKKKKKKKKKKK..
  ................
`);
const GLASS_1 = frame(`
  ......KKKK......
  ....KKVVVVKK....
  ...KVVWWWWVVK...
  ..KvVBBBBBBVvK..
  .KvVBBBBBBBBVvK.
  KvVBbBBBBBBbBVvK
  KbVVbKrRRrKbVVbK
  KbBBbKrYYrKbBBbK
  KbBBbKrRRrKbBBbK
  KbBBbKrRRrKbBBbK
  KGggGKrRRrKGggGK
  KGggGKrYYrKGggGK
  KGGgGKrRRrKGGgGK
  KGggGKvUUvKGggGK
  KGggGKvVVvKGggGK
  KGggGKvUUvKGggGK
  KgFFgKvVVvKgFFgK
  KgFFgKvvvvKgFFgK
  KgFFgKvUUvKgFFgK
  KKKKKKKKKKKKKKKK
  .KppppppppppppK.
  .KpDDDDDDDDDDpK.
  ..KKKKKKKKKKKK..
  ................
`);

const CHANDELIER = frame(`
  .......DD.......
  .......DD.......
  ......dDDd......
  ...M.......M....
  ..MYM.....MYM...
  ...Y..MYM..Y....
  ...C..MYM..C....
  ...C...Y...C....
  ...C...C...C....
  dDDDDDDDDDDDDDDd
  ..y..d...d..y...
  .....d...d......
  ................
  ................
  ................
  ................
`);

const BELL = frame(`
  .......yy.......
  ......yYYy......
  ......yYYy......
  .....yYYYYy.....
  ....yYYYYYYy....
  ...yYYYYYYYYy...
  ..yYYYYYYYYYYy..
  ..yYYYYYYYYYYy..
  .yYYYYYYYYYYYYy.
  .yYYYYyyYYYYYYy.
  yYYYYYYYYYYYYYYy
  yYYyYYYYYYYYyYYy
  yyYYYYYYYYYYYYyy
  .yyyyyyyyyyyyyy.
  ..KKKKKKKKKKKK..
  ....KKKKKKKK....
`);

const HEADSTONE = frame(`
  ...pPPPPPPPPp...
  ..pPCCCCCCCCPp..
  .pPCCCCCCCCCCPp.
  .pPCCCCCCCCCCPp.
  .pPCCCCCCCCCCPp.
  .pPCCCCppCCCCPp.
  .pPCCCCppCCCCPp.
  .pPCppppppppCPp.
  .pPCppppppppCPp.
  .pPCCCCppCCCCPp.
  .pPCCCCppCCCCPp.
  .pPCCCCCCCCCCPp.
  .pPCCCCCCCCCCPp.
  .ppPPPPPPPPPPpp.
  FgFgFghhFgFgFgFg
  gFgFgFgFgFgFgFgF
`);

// --- sprite defs ------------------------------------------------------------

export const RAIN_COBBLE: SpriteDef = { key: "tile-rain-cobble", w: 16, h: 16, frames: [COBBLE] };
export const RAIN_COBBLE_FILL: SpriteDef = { key: "tile-rain-cobble-fill", w: 16, h: 16, frames: [COBBLE_FILL] };
export const RAIN_BRICK: SpriteDef = { key: "tile-rain-brick", w: 16, h: 16, frames: [BRICK] };
export const RAIN_SLATE: SpriteDef = { key: "tile-rain-slate", w: 16, h: 16, frames: [SLATE] };
export const RAIN_ONEWAY: SpriteDef = { key: "tile-rain-oneway", w: 16, h: 16, frames: [ONEWAY] };
export const RAIN_BRIDGE: SpriteDef = { key: "tile-rain-bridge", w: 16, h: 16, frames: [BRIDGE] };
export const RAIN_CLOCK_BLOCK: SpriteDef = { key: "tile-rain-clockblock", w: 16, h: 16, frames: [CLOCK_BLOCK] };
export const RAIN_STONE: SpriteDef = { key: "tile-rain-stone", w: 16, h: 16, frames: [STONE] };
export const RAIN_PILLAR: SpriteDef = { key: "tile-rain-pillar", w: 16, h: 16, frames: [PILLAR] };
export const RAIN_SPIKES: SpriteDef = { key: "tile-rain-spikes", w: 16, h: 16, frames: [SPIKES] };
export const RAIN_FENCE: SpriteDef = { key: "decor-rain-fence", w: 16, h: 16, frames: [FENCE] };
export const RAIN_LAMP_ANIM = "flicker";
export const RAIN_LAMP: SpriteDef = {
  key: "decor-rain-lamp",
  w: 16,
  h: 32,
  frames: [LAMP_0, LAMP_1],
  anims: [{ key: RAIN_LAMP_ANIM, frames: [0, 1], frameRate: 3, repeat: -1 }],
};

export const RAIN_CLOCK_FACE: SpriteDef = { key: "decor-rain-clockface", w: 16, h: 16, frames: [CLOCK_FACE] };
export const RAIN_GLASS_ANIM = "shimmer";
export const RAIN_GLASS: SpriteDef = {
  key: "decor-rain-glass",
  w: 16,
  h: 24,
  frames: [GLASS_0, GLASS_1],
  anims: [{ key: RAIN_GLASS_ANIM, frames: [0, 1], frameRate: 2, repeat: -1 }],
};

export const RAIN_CHANDELIER: SpriteDef = { key: "decor-rain-chandelier", w: 16, h: 16, frames: [CHANDELIER] };
export const RAIN_BELL: SpriteDef = { key: "decor-rain-bell", w: 16, h: 16, frames: [BELL] };
export const RAIN_HEADSTONE: SpriteDef = { key: "decor-rain-headstone", w: 16, h: 16, frames: [HEADSTONE] };

// --- parallax backdrop (480x270) --------------------------------------------

const BG_W = 480;
const BG_H = 270;
const HORIZON_Y = 200;

/** Deterministic 2D hash -> unsigned int (stable generated art; no
 *  Math.random at module load so the integrity test is reproducible). */
function hash(x: number, y: number): number {
  let h = (x * 73856093) ^ (y * 19349663);
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}

function blank() {
  return Array.from({ length: BG_H }, () => Array<string>(BG_W).fill("."));
}

function rainSkyRows() {
  const stops = ["O", "K", "D", "I", "d", "I", "c", "c"]; // top -> horizon
  const moonX = 372;
  const moonY = 58;
  const rows: string[] = [];
  for (let y = 0; y < BG_H; y++) {
    const t = y / (BG_H - 1);
    const f = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(f));
    const frac = f - i;
    let row = "";
    for (let x = 0; x < BG_W; x++) {
      let ch = hash(x, y) % 100 < frac * 100 ? stops[i + 1] : stops[i];
      // Hazy moon: soft disc, brightest core fading into the fog.
      const dx = x - moonX;
      const dy = (y - moonY) * 1.15;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) ch = dist < 11 ? "W" : "C";
      else if (dist < 28 && hash(x, y) % 3 === 0) ch = "C";
      // Faint diagonal rain specks in the mid band.
      if (y > BG_H * 0.28 && y < BG_H * 0.72) {
        if (hash(x * 7 + (y % 3), y * 3) % 240 === 0) ch = "c";
      }
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

function skylineRows() {
  const g = blank();
  // Terraced buildings along the horizon.
  let x = 0;
  while (x < BG_W) {
    const bw = 26 + (hash(x, 11) % 22); // 26..47 wide
    const bh = 46 + (hash(x, 17) % 62); // 46..107 tall
    const top = HORIZON_Y - bh;
    for (let y = top; y < HORIZON_Y; y++) {
      for (let xx = x; xx < Math.min(x + bw, BG_W); xx++) {
        if (y < 0) continue;
        const edge = xx === x || xx === x + bw - 1;
        g[y][xx] = y === top || y === top + 1 || edge ? "D" : "K";
      }
    }
    // A couple of warm lit windows.
    const cols = 2 + (hash(x, 5) % 2);
    for (let w = 0; w < cols; w++) {
      const wx = x + 6 + w * 10 + (hash(x + w, 9) % 4);
      const wy = top + 10 + (hash(x + w, 13) % Math.max(1, bh - 20));
      if (wx < BG_W - 1 && wy < HORIZON_Y - 2 && wy > 0) {
        g[wy][wx] = "M";
        g[wy][wx + 1] = "y";
      }
    }
    x += bw + 1;
  }
  // The clock tower — a tall slab centred-left, above the terraces, with a
  // pointed roof, a pale clock face, and lit belfry slits.
  const tx = 150;
  const tw = 44;
  const ttop = 46;
  for (let y = ttop; y < HORIZON_Y; y++) {
    for (let xx = tx; xx < tx + tw; xx++) {
      const edge = xx === tx || xx === tx + tw - 1;
      g[y][xx] = edge ? "D" : "K";
    }
  }
  // Pointed roof.
  for (let r = 0; r < 18; r++) {
    const half = tw / 2 - r * 1.2;
    for (let xx = tx + tw / 2 - half; xx <= tx + tw / 2 + half; xx++) {
      const yy = ttop - 18 + r;
      if (yy >= 0 && xx >= 0 && xx < BG_W) g[yy][Math.round(xx)] = "K";
    }
  }
  // Pale clock face disc.
  const cx = tx + tw / 2;
  const cy = ttop + 30;
  for (let y = -9; y <= 9; y++) {
    for (let xd = -9; xd <= 9; xd++) {
      if (xd * xd + y * y > 81) continue;
      const px = cx + xd;
      const py = cy + y;
      if (py < 0 || px < 0 || px >= BG_W) continue;
      const edge = xd * xd + y * y > 56;
      g[py][px] = edge ? "y" : "C";
    }
  }
  // Clock hands.
  g[cy][cx] = "K";
  g[cy - 1][cx] = "K";
  g[cy - 2][cx] = "K";
  g[cy][cx + 1] = "K";
  g[cy][cx + 2] = "K";
  // Belfry slits (warm).
  g[ttop + 52][cx - 6] = "M";
  g[ttop + 52][cx + 6] = "M";
  // Low fog bank hazing the base — soft, sparse, dark haze (not glary).
  for (let y = HORIZON_Y - 8; y < HORIZON_Y; y++) {
    const near = (y - (HORIZON_Y - 8)) / 8; // 0 top .. 1 base
    for (let xx = 0; xx < BG_W; xx++) {
      const on = hash(xx, y * 5) % 100 < 12 + near * 30;
      if (!on) continue;
      const shade = near > 0.6 ? "d" : "I";
      if (g[y][xx] === ".") g[y][xx] = shade;
      else if (near > 0.4) g[y][xx] = shade; // soften building feet
    }
  }
  return g.map((r) => r.join(""));
}

function cathedralDepthRows() {
  const g = blank();
  const vpx = BG_W / 2;
  const vpy = 120;
  // Far apse rose-window glow — a soft, structured luminous shape (smooth violet
  // bands with sparse jewel flecks + a vertical lead came), not per-pixel noise.
  for (let y = vpy - 26; y < vpy + 32; y++) {
    for (let x = vpx - 16; x < vpx + 16; x++) {
      if (y < 0 || y >= BG_H || x < 0 || x >= BG_W) continue;
      const dx = (x - vpx) / 15;
      const dy = (y - vpy) / 29;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1) continue;
      let ch = d2 < 0.16 ? "V" : d2 < 0.5 ? "v" : "U";
      // sparse jewel flecks toward the rim
      const hs = hash(x, y) % 11;
      if (d2 > 0.28 && hs === 0) ch = "b";
      else if (d2 > 0.28 && hs === 1) ch = "r";
      // vertical + horizontal lead came through the centre
      if (x === Math.round(vpx) || y === Math.round(vpy)) ch = "K";
      g[y][x] = ch;
    }
  }
  // Nested receding arches (near = large/light, far = small/dark).
  const bays = [
    { half: 220, topY: 8, col: "K", pil: "D" },
    { half: 168, topY: 30, col: "K", pil: "D" },
    { half: 122, topY: 50, col: "K", pil: "p" },
    { half: 84, topY: 68, col: "K", pil: "p" },
    { half: 54, topY: 84, col: "K", pil: "P" },
    { half: 32, topY: 98, col: "K", pil: "P" },
  ];
  for (const b of bays) {
    const lx = Math.round(vpx - b.half);
    const rx = Math.round(vpx + b.half);
    const baseY = HORIZON_Y + 40;
    // Two pillars.
    for (const px of [lx, rx]) {
      for (let y = b.topY + b.half; y < baseY; y++) {
        if (y < 0 || y >= BG_H) continue;
        const w = Math.max(2, Math.round(b.half / 12));
        for (let d = 0; d < w; d++) {
          const xx = px < vpx ? px - d : px + d;
          if (xx >= 0 && xx < BG_W) g[y][xx] = d === 0 ? b.pil : b.col;
        }
      }
    }
    // Pointed arch connecting the pillar tops.
    const apex = b.topY;
    const springY = b.topY + b.half;
    for (const side of [-1, 1]) {
      for (let s = 0; s <= b.half; s++) {
        const t = s / b.half;
        const ax = Math.round(vpx + side * b.half * (1 - t));
        const ay = Math.round(springY - (springY - apex) * Math.sin(t * (Math.PI / 2)));
        if (ay >= 0 && ay < BG_H && ax >= 0 && ax < BG_W) {
          g[ay][ax] = b.col;
          if (ay + 1 < BG_H) g[ay + 1][ax] = b.pil;
        }
      }
    }
  }
  // Floor line receding.
  for (let x = 0; x < BG_W; x++) {
    if (hash(x, 999) % 4 !== 0) g[HORIZON_Y + 39] && (g[HORIZON_Y + 39][x] = "p");
  }
  return g.map((r) => r.join(""));
}

export const RAIN_BG0: SpriteDef = { key: "bg-rain-0", w: BG_W, h: BG_H, frames: [rainSkyRows()] };
export const RAIN_BG1: SpriteDef = { key: "bg-rain-1", w: BG_W, h: BG_H, frames: [skylineRows()] };
export const RAIN_BG2: SpriteDef = { key: "bg-rain-2", w: BG_W, h: BG_H, frames: [cathedralDepthRows()] };

// --- registry ---------------------------------------------------------------

export const RAIN_TILES: SpriteDef[] = [
  RAIN_COBBLE,
  RAIN_COBBLE_FILL,
  RAIN_BRICK,
  RAIN_SLATE,
  RAIN_ONEWAY,
  RAIN_BRIDGE,
  RAIN_CLOCK_BLOCK,
  RAIN_STONE,
  RAIN_PILLAR,
  RAIN_SPIKES,
  RAIN_FENCE,
  RAIN_LAMP,
  RAIN_CLOCK_FACE,
  RAIN_GLASS,
  RAIN_CHANDELIER,
  RAIN_BELL,
  RAIN_HEADSTONE,
];
export const RAIN_PARALLAX: SpriteDef[] = [RAIN_BG0, RAIN_BG1, RAIN_BG2];

// Single source of truth for the bare texture keys the scene references, shared
// with the integrity test so the strings can't drift. Animated defs (lamp,
// glass) are addressed by their anim key; single frames resolve by bare key.
export const RAIN_TILE_KEYS = {
  cobble: RAIN_COBBLE.key,
  cobbleFill: RAIN_COBBLE_FILL.key,
  brick: RAIN_BRICK.key,
  slate: RAIN_SLATE.key,
  oneWay: RAIN_ONEWAY.key,
  bridge: RAIN_BRIDGE.key,
  clockBlock: RAIN_CLOCK_BLOCK.key,
  stone: RAIN_STONE.key,
  pillar: RAIN_PILLAR.key,
  spikes: RAIN_SPIKES.key,
  fence: RAIN_FENCE.key,
  lamp: RAIN_LAMP.key,
  clockFace: RAIN_CLOCK_FACE.key,
  glass: RAIN_GLASS.key,
  chandelier: RAIN_CHANDELIER.key,
  bell: RAIN_BELL.key,
  headstone: RAIN_HEADSTONE.key,
} as const;

export const RAIN_PARALLAX_KEYS = {
  bg0: RAIN_BG0.key,
  bg1: RAIN_BG1.key,
  bg2: RAIN_BG2.key,
} as const;
