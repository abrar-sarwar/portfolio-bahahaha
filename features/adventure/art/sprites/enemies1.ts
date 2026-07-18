import { frame } from "../grid";
import type { SpriteDef } from "../textures";

// World-1 enemies, 16x16 each. Authored to schema; a permanent integrity test
// (art/grid.test.ts) parses every frame for palette membership, size, and
// per-anim non-duplicate frames.

// --- Bugling: a round corrupted beetle-mushroom -----------------------------
// Green mushroom cap (G/g) speckled with red glitch patches (R/r) over a dark
// beetle body (k) with two cute white eyes (W/O) and stubby green legs (G/g).

const BUG_WALK_0 = frame(`
  ................
  ....GGGGGGGG....
  ..GGGGGGGGGGGG..
  .GGGRRGGGGrGGGG.
  .GGGGGGGGGGGGGG.
  .gggggggggggggg.
  ..kkkkkkkkkkkk..
  .kWWkkkkkkkkWWk.
  .kWOkkkkkkkkOWk.
  .kkkkRrkkrRkkkk.
  .kkkkkkkkkkkkkk.
  ..kkkkkkkkkkkk..
  ...kkkkkkkkkk...
  ...G.gg..gg.G...
  ..GG.gg..gg.GG..
  ................
`);

// walk f1: legs swap to the alternate step; glitch flecks drift to new cells.
const BUG_WALK_1 = frame(`
  ................
  ....GGGGGGGG....
  ..GGGGGGGGGGGG..
  .GGGGGrGGRRGGGG.
  .GGGGGGGGGGGGGG.
  .gggggggggggggg.
  ..kkkkkkkkkkkk..
  .kWWkkkkkkkkWWk.
  .kWOkkkkkkkkOWk.
  .kkrRkkkkkkRrkk.
  .kkkkkkkkkkkkkk.
  ..kkkkkkkkkkkk..
  ...kkkkkkkkkk...
  ..GG.gg..gg.GG..
  ...G.gg..gg.G...
  ................
`);

// squash f0 (death): flattened splat, legs splayed, glitch flecks bursting.
const BUG_SQUASH = frame(`
  ................
  ................
  ................
  ................
  ................
  ................
  ................
  ...R........R...
  ..GGGGGGGGGGGG..
  .GGGRRGGGGrRGGG.
  .gggggggggggggg.
  .kWOkkkkkkkkOWk.
  .kkkkrRkkrRkkkk.
  ..kkGGg..gGGkk..
  ...gg......gg...
  ................
`);

// --- Phishling: a floating gift box that reveals a toothy maw ----------------
// Disguise: gold present (Y/y) with a white ribbon + bow (W) — the "FREE"
// bait. Reveal/lunge: the wrapping tears to bare a red toothy maw (R/r) with
// dark X gums and white W teeth.

const PHISH_DISGUISE_0 = frame(`
  ................
  ......WWWW......
  .....W.WW.W.....
  ......YYYY......
  ..YYYYYWWYYYYY..
  .YYYYYYWWYYYYYY.
  .YYYYYYWWYYYYYY.
  .WWWWWWWWWWWWWW.
  .YYYYYYWWYYYYYY.
  .YYYYYYWWYYYYYY.
  .YYYYYYWWYYYYYY.
  .YyYYYYWWYYYYyY.
  .YyyYYYWWYYYyyY.
  .yyyyyyWWyyyyyy.
  ..yyyyyyyyyyyy..
  ................
`);

// disguise f1: shimmer — sparkles pop at the corners, highlights drift.
const PHISH_DISGUISE_1 = frame(`
  .W..............
  ......WWWW....W.
  .....W.WW.W.....
  ....Y.YYYY.Y....
  ..YYYYYWWYYYYY..
  .YYYYYYWWYYYYYY.
  .YyYYYYWWYYYYyY.
  .WWWWWWWWWWWWWW.
  .YYYYYYWWYYYYYY.
  .YYyYYYWWYYYyYY.
  .YYYYYYWWYYYYYY.
  .YYYYYYWWYYYYYY.
  .YyyYYYWWYYYyyY.
  .yyyyyyWWyyyyyy.
  ..yyyyyyyyyyyy..
  ...W........W...
`);

// reveal f0: wrapping tears; a red toothy maw with white eye glints emerges.
const PHISH_REVEAL_0 = frame(`
  ................
  ..Y........Y....
  .YYRRRRRRRRRRYY.
  .RRRRRRRRRRRRRR.
  .RRWRRRRRRRRWRR.
  .RRWRRRRRRRRWRR.
  .RRRRRRRRRRRRRR.
  RWRWRWRWRWRWRWRW
  .XWXWXWXWXWXWXW.
  .XRRRRRRRRRRRRX.
  .XRRRRRRRRRRRRX.
  .XWXWXWXWXWXWXW.
  RWRWRWRWRWRWRWRW
  .rrrrrrrrrrrrrr.
  ..rr......rr....
  ................
`);

// reveal f1: maw yawns wider, eyes darken to angry X sockets.
const PHISH_REVEAL_1 = frame(`
  ................
  .Y..........Y...
  ..RRRRRRRRRRRR..
  .RRRRRRRRRRRRRR.
  .RXRRRRRRRRRRXR.
  .RXRRRRRRRRRRXR.
  RWRWRWRWRWRWRWRW
  .XWXWXWXWXWXWXW.
  .XRRRRRRRRRRRRX.
  .XRRRRRRRRRRRRX.
  .XRRRRRRRRRRRRX.
  .XWXWXWXWXWXWXW.
  RWRWRWRWRWRWRWRW
  .rrrrrrrrrrrrrr.
  ..rr......rr....
  ................
`);

// lunge f0: maw thrown wide open, motion streaks trailing the strike.
const PHISH_LUNGE = frame(`
  ................
  ................
  RR............RR
  .RRRRRRRRRRRRRR.
  RRXRRRRRRRRRRXRR
  RWRWRWRWRWRWRWRW
  XWXWXWXWXWXWXWXW
  RRRRRRRRRRRRRRRR
  XRRRRRRRRRRRRRRX
  XRRRRRRRRRRRRRRX
  RRRRRRRRRRRRRRRR
  XWXWXWXWXWXWXWXW
  RWRWRWRWRWRWRWRW
  .RRRRRRRRRRRRRR.
  ..rr......rr....
  ................
`);

export const BUGLING_SPRITES: SpriteDef = {
  key: "enemy-bugling",
  w: 16,
  h: 16,
  frames: [BUG_WALK_0, BUG_WALK_1, BUG_SQUASH],
  anims: [
    { key: "walk", frames: [0, 1], frameRate: 6, repeat: -1 },
    { key: "squash", frames: [2], frameRate: 1, repeat: 0 },
  ],
};

export const PHISHLING_SPRITES: SpriteDef = {
  key: "enemy-phishling",
  w: 16,
  h: 16,
  frames: [PHISH_DISGUISE_0, PHISH_DISGUISE_1, PHISH_REVEAL_0, PHISH_REVEAL_1, PHISH_LUNGE],
  anims: [
    { key: "disguise", frames: [0, 1], frameRate: 3, repeat: -1 },
    { key: "reveal", frames: [2, 3], frameRate: 8, repeat: -1 },
    { key: "lunge", frames: [4], frameRate: 1, repeat: 0 },
  ],
};

export const ENEMY_SPRITES: SpriteDef[] = [BUGLING_SPRITES, PHISHLING_SPRITES];
