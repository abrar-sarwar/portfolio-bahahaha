import { describe, it, expect } from "vitest";
import { parseGrid } from "../grid";
import { BOSSES2_SPRITES, TRAINING_DUMMY_SPRITE } from "./bosses2";

// Sprite integrity (amendment §8 "sprite integrity" canary): every frame must
// parse to the def's declared w×h with only palette-valid chars, or
// registerSprites throws at scene create. parseGrid enforces both without a
// Phaser canvas.
describe("bosses2 sprite integrity", () => {
  for (const def of BOSSES2_SPRITES) {
    it(`${def.key}: every frame is exactly ${def.key === TRAINING_DUMMY_SPRITE.key ? "24×32" : `${def.w}×${def.h}`}`, () => {
      def.frames.forEach((rows, i) => {
        const g = parseGrid(rows);
        expect({ frame: i, w: g.w, h: g.h }).toEqual({ frame: i, w: def.w, h: def.h });
      });
    });

    it(`${def.key}: anim frame indices are all in range`, () => {
      const n = def.frames.length;
      for (const anim of def.anims ?? []) {
        for (const f of anim.frames) {
          expect(f).toBeGreaterThanOrEqual(0);
          expect(f).toBeLessThan(n);
        }
      }
    });
  }

  it("training dummy declares idle / hurt / defeat anims", () => {
    const keys = (TRAINING_DUMMY_SPRITE.anims ?? []).map((a) => a.key);
    expect(keys).toEqual(expect.arrayContaining(["idle", "hurt", "defeat"]));
  });
});
