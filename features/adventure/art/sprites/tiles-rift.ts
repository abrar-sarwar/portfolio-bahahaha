// The Rift Castle deliberately corrupts the original basalt kit instead of
// introducing a disconnected visual language: the same masonry, iron and lava
// return beneath a crimson/violet tint, while the level recombines the earlier
// worlds' mechanics. Exporting a distinct kit boundary lets the scene evolve
// this palette independently without changing the dormant old castle theme.
import {
  CASTLE_TILES,
  CASTLE_PARALLAX,
  CASTLE_TILE_KEYS,
  CASTLE_PARALLAX_KEYS,
  CASTLE_LAVA_ANIM,
  CASTLE_BANNER_ANIM,
} from "./tiles-castle";

export const RIFT_TILES = CASTLE_TILES;
export const RIFT_PARALLAX = CASTLE_PARALLAX;
export const RIFT_TILE_KEYS = CASTLE_TILE_KEYS;
export const RIFT_PARALLAX_KEYS = CASTLE_PARALLAX_KEYS;
export const RIFT_LAVA_ANIM = CASTLE_LAVA_ANIM;
export const RIFT_BANNER_ANIM = CASTLE_BANNER_ANIM;
