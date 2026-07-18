import { describe, it, expect } from "vitest";
import { bareKeyFor } from "./textures";
import type { SpriteDef } from "./textures";
import {
  FIELD_TILE_KEYS,
  FIELD_PARALLAX_KEYS,
  FIELDS_TILES,
  FIELDS_PARALLAX,
} from "./sprites/tiles-fields";

describe("bareKeyFor", () => {
  it("returns the bare key for a single-frame SpriteDef", () => {
    const def: SpriteDef = { key: "tile-x", w: 1, h: 1, frames: [["K"]] };
    expect(bareKeyFor(def)).toBe("tile-x");
  });

  it("returns null for a multi-frame SpriteDef (bare alias would be ambiguous)", () => {
    const def: SpriteDef = { key: "anim-x", w: 1, h: 1, frames: [["K"], ["k"]] };
    expect(bareKeyFor(def)).toBeNull();
  });

  it("returns null for a zero-frame SpriteDef", () => {
    const def: SpriteDef = { key: "empty-x", w: 1, h: 1, frames: [] };
    expect(bareKeyFor(def)).toBeNull();
  });
});

/**
 * Pins the bare-key aliasing contract the scene relies on: every texture key
 * the scene references by BARE name (parallax layers + gameplay tiles) must map
 * to a single-frame SpriteDef, since registerSprites only aliases the bare key
 * when frames.length === 1 (bareKeyFor(def) !== null). If a referenced def ever
 * grows a second frame, the bare reference would render __MISSING and this fails.
 */
describe("scene bare-key references resolve to single-frame defs", () => {
  const defsByKey = new Map<string, SpriteDef>(
    [...FIELDS_TILES, ...FIELDS_PARALLAX].map((d) => [d.key, d]),
  );
  const referenced = [...Object.values(FIELD_TILE_KEYS), ...Object.values(FIELD_PARALLAX_KEYS)];

  for (const key of referenced) {
    it(`"${key}" is a registered single-frame def with a valid bare alias`, () => {
      const def = defsByKey.get(key);
      expect(def, `no SpriteDef registered for bare key "${key}"`).toBeDefined();
      expect(def!.frames.length).toBe(1);
      expect(bareKeyFor(def!)).toBe(key);
    });
  }
});
