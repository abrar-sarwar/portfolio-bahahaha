import { describe, expect, it } from "vitest";
import { PLAYER_SPRITES, PLAYER_SWORD_SPRITES } from "./player";

describe("player combat art", () => {
  it("keeps the character compact but gives the sword a larger canvas", () => {
    expect(PLAYER_SPRITES.w).toBe(16);
    expect(PLAYER_SWORD_SPRITES.w).toBe(32);
    expect(PLAYER_SWORD_SPRITES.h).toBe(32);
  });

  it("ships visible idle, swing, rush, and wave sword animations", () => {
    const names = (PLAYER_SWORD_SPRITES.anims ?? []).map((anim) => anim.key);
    expect(names).toEqual(expect.arrayContaining(["idle", "swing", "rush", "wave"]));
    for (const frame of PLAYER_SWORD_SPRITES.frames) {
      expect(frame).toHaveLength(32);
      expect(frame.every((row) => row.length === 32)).toBe(true);
      expect(frame.some((row) => /[WBV]/.test(row))).toBe(true);
    }
  });
});
