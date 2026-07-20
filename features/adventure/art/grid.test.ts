import { describe, it, expect } from "vitest";
import { parseGrid } from "./grid";
import { PALETTE } from "./palette";
import { PLAYER_SPRITES } from "./sprites/player";
import { ENEMY_SPRITES } from "./sprites/enemies1";
import { BOSS_SPRITES } from "./sprites/bosses";
import type { SpriteDef } from "./textures";

describe("parseGrid", () => {
  it("parses a rectangular grid into palette refs", () => {
    const g = parseGrid(["KK.", ".KK"]);
    expect(g.w).toBe(3);
    expect(g.h).toBe(2);
    expect(g.px[0][0]).toBe("K");
    expect(g.px[0][2]).toBeNull(); // "." = transparent
  });

  it("throws on ragged rows", () => {
    expect(() => parseGrid(["KK", "K"])).toThrow(/ragged/i);
  });

  it("throws on characters missing from the palette", () => {
    expect(() => parseGrid(["KZ"])).toThrow(/palette/i);
  });
});

/**
 * Permanent integrity guard for every code-generated sprite sheet, not
 * just the player. Any SpriteDef added to this list gets the same
 * checks: every frame parses, every frame matches the declared w/h,
 * every char is a real palette entry (or "."), no two frames in the
 * same animation are byte-for-byte identical (lazy copies), and every
 * anim frame index actually exists in the frames array.
 */
const SPRITE_SHEETS: SpriteDef[] = [PLAYER_SPRITES, ...ENEMY_SPRITES, ...BOSS_SPRITES];

describe("sprite sheet integrity", () => {
  const validChars = new Set([...Object.keys(PALETTE), "."]);

  for (const def of SPRITE_SHEETS) {
    describe(def.key, () => {
      it("has at least one frame", () => {
        expect(def.frames.length).toBeGreaterThan(0);
      });

      def.frames.forEach((rows, i) => {
        it(`frame ${i} is ${def.w}x${def.h} and uses only palette chars`, () => {
          const g = parseGrid(rows); // throws on ragged rows / unknown chars
          expect(g.w).toBe(def.w);
          expect(g.h).toBe(def.h);
          for (let y = 0; y < rows.length; y++) {
            for (const ch of rows[y]) {
              expect(validChars.has(ch), `frame ${i} row ${y} char "${ch}"`).toBe(true);
            }
          }
        });
      });

      for (const anim of def.anims ?? []) {
        describe(`anim "${anim.key}"`, () => {
          it("references only valid frame indices", () => {
            for (const idx of anim.frames) {
              expect(idx).toBeGreaterThanOrEqual(0);
              expect(idx).toBeLessThan(def.frames.length);
            }
          });

          it("has no back-to-back duplicate (lazy-copy) frames", () => {
            for (let i = 1; i < anim.frames.length; i++) {
              const prev = def.frames[anim.frames[i - 1]];
              const curr = def.frames[anim.frames[i]];
              expect(
                curr,
                `anim "${anim.key}" frames[${i - 1}] and frames[${i}] (sprite indices ${anim.frames[i - 1]},${anim.frames[i]}) are pixel-identical`,
              ).not.toEqual(prev);
            }
          });
        });
      }
    });
  }
});
