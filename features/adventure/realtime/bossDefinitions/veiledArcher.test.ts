import { describe, expect, it } from "vitest";
import { VEILED_ARCHER, chooseArcherPerch } from "./veiledArcher";

describe("Veiled Archer redesign", () => {
  it("is a normal 35-HP boss rather than a three-catch armor puzzle", () => {
    expect(VEILED_ARCHER.maxHp).toBe(35);
    expect(VEILED_ARCHER.invulnerableBaseline).not.toBe(true);
    expect(VEILED_ARCHER.damageScale).toBeUndefined();
  });

  it("relocates to the safe perch farthest from the player", () => {
    const perches = [{ x: 72, y: 190 }, { x: 272, y: 170 }, { x: 472, y: 190 }];
    expect(chooseArcherPerch(60, 272, perches)).toEqual(perches[2]);
    expect(chooseArcherPerch(470, 272, perches)).toEqual(perches[0]);
  });
});
