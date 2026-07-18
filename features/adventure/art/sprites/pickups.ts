import { frame } from "../grid";
import type { SpriteDef } from "../textures";
import type { BuffId } from "../../ids";
import { buffTag } from "../../ui/hudMath";
import type { Drop } from "../../enemies/drops";

// Collectible pickups dropped by enemies (heart, per-buff chips) plus the
// fragment shard and checkpoint flag. All are SINGLE-FRAME defs, so
// registerSprites aliases each under its bare key — the scene references them
// by bare name (no `#0`). A permanent integrity test (art/tiles.test.ts) parses
// every frame for palette membership and declared size.

// --- heart 8x8 (heal pickup) ------------------------------------------------
// Bright R lobes with an r shade dimple and a white top-left glint.
const HEART = frame(`
  .RR..RR.
  RWRRRRRR
  RRRRRRrR
  RRRRRRRR
  .RRRRRR.
  ..rRRr..
  ...rr...
  ........
`);

// --- fragment 12x12 (V shard) -----------------------------------------------
// A faceted violet crystal shard: bright V edge, v body, U core seam.
const FRAGMENT = frame(`
  .....VV.....
  ....VvvV....
  ...VvUUvV...
  ..VvUUUUvV..
  .VvUUvvUUvV.
  VvUUvVVvUUvV
  .VUUvVVvUUV.
  ..VUvvvvUV..
  ...VUvvUV...
  ....VUUV....
  .....VV.....
  ............
`);

// --- checkpoint flag 16x24 --------------------------------------------------
// Grey pole (c/d) with a violet pennant (V lit face, v shade, U dark fold)
// and a small base. Referenced by later scene polish; kept in the art set so
// it ships and stays palette-valid.
const FLAG = frame(`
  ..d.............
  ..d.............
  ..dVVVVVVVVV....
  ..dVVVVVVVVVV...
  ..dVVvvvvVVVVV..
  ..dVvvUUUvvVVV..
  ..dVvUUUUUvvVV..
  ..dVvvUUUvvVVV..
  ..dVVvvvvVVVVV..
  ..dVVVVVVVVVV...
  ..dVVVVVVVVV....
  ..dVVVVVVV......
  ..d.............
  ..d.............
  ..d.............
  ..d.............
  ..d.............
  ..d.............
  ..d.............
  ..d.............
  ..d.............
  .ccc............
  cccccc..........
  cccccc..........
`);

// --- per-buff chip 12x12 ----------------------------------------------------
// A violet-bordered chip (V frame, U interior) stamped with the buff's
// two-letter tag in white via a 3x5 pixel font. Built at module load so all
// eight chips stay in lockstep with the HUD's `buffTag` labels.

const FONT_3x5: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  I: ["111", "010", "010", "010", "111"],
  M: ["101", "111", "111", "101", "101"],
  P: ["110", "101", "110", "100", "100"],
  R: ["110", "101", "110", "101", "101"],
  W: ["101", "101", "101", "111", "101"],
};

function chipRows(tag: string): string[] {
  const size = 12;
  const grid: string[][] = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) =>
      x === 0 || x === size - 1 || y === 0 || y === size - 1 ? "V" : "U",
    ),
  );
  // Two 3x5 glyphs, 1px gap -> 7px wide, centred: start col 2, start row 3.
  const letters = tag.slice(0, 2).toUpperCase().split("");
  letters.forEach((ch, li) => {
    const glyph = FONT_3x5[ch];
    if (!glyph) return;
    const ox = 2 + li * 4;
    const oy = 3;
    glyph.forEach((grow, gy) =>
      [...grow].forEach((bit, gx) => {
        if (bit === "1") grid[oy + gy][ox + gx] = "W";
      }),
    );
  });
  return grid.map((r) => r.join(""));
}

const BUFF_IDS: BuffId[] = [
  "attack-byte", "firewall-layer", "focus-chip", "parry-module",
  "recovery-packet", "root-access", "exploit-insight", "cache-boost",
];

export function buffChipKey(buff: BuffId): string {
  return `pickup-buff-${buff}`;
}

export const HEART_PICKUP: SpriteDef = { key: "pickup-heart", w: 8, h: 8, frames: [HEART] };
export const FRAGMENT_PICKUP: SpriteDef = { key: "pickup-fragment", w: 12, h: 12, frames: [FRAGMENT] };
export const FLAG_PICKUP: SpriteDef = { key: "pickup-flag", w: 16, h: 24, frames: [FLAG] };

export const BUFF_CHIPS: SpriteDef[] = BUFF_IDS.map((b) => ({
  key: buffChipKey(b),
  w: 12,
  h: 12,
  frames: [chipRows(buffTag(b))],
}));

export const PICKUP_SPRITES: SpriteDef[] = [
  HEART_PICKUP,
  FRAGMENT_PICKUP,
  FLAG_PICKUP,
  ...BUFF_CHIPS,
];

/** Bare texture key for a materialized drop (heart or a buff chip). */
export function pickupKeyFor(drop: Exclude<Drop, null>): string {
  return drop === "heart" ? HEART_PICKUP.key : buffChipKey(drop);
}
