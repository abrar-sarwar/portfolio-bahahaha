import { describe, it, expect } from "vitest";
import { parseGrid } from "./grid";
import { PALETTE } from "./palette";
import type { SpriteDef } from "./textures";
import { FIELDS_TILES, FIELDS_PARALLAX } from "./sprites/tiles-fields";

/**
 * Permanent integrity guard for the world-1 tileset + parallax, mirroring the
 * player-sprite integrity block in grid.test.ts: every frame parses (no ragged
 * rows), matches its declared w/h, and uses only palette chars (or ".").
 * Any tileset SpriteDef added here gets the same checks.
 */
const TILE_SHEETS: SpriteDef[] = [...FIELDS_TILES, ...FIELDS_PARALLAX];

describe("tileset integrity", () => {
  const validChars = new Set([...Object.keys(PALETTE), "."]);

  for (const def of TILE_SHEETS) {
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
    });
  }
});
