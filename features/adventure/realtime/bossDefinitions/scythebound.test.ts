import { describe, expect, it } from "vitest";
import { SCYTHEBOUND, scythePursuitX } from "./scythebound";

describe("Scythebound redesign", () => {
  it("uses a visible 55-HP bar and accepts ordinary combat damage", () => {
    expect(SCYTHEBOUND.maxHp).toBe(55);
    expect(SCYTHEBOUND.hideHealthBar).not.toBe(true);
    expect(SCYTHEBOUND.damageScale).toBeUndefined();
    expect(SCYTHEBOUND.phases.map((phase) => phase.enterBelowHpFrac)).toEqual([
      undefined,
      0.65,
      0.3,
    ]);
  });

  it("closes distance without leaving the courtyard", () => {
    expect(scythePursuitX(200, 400, 100, 640)).toBeGreaterThan(200);
    expect(scythePursuitX(50, 0, 100, 640)).toBe(48);
    expect(scythePursuitX(590, 700, 100, 640)).toBe(592);
  });
});
