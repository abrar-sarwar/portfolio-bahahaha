import { describe, expect, it } from "vitest";
import { canAbilityHit, nextAbilityHitId } from "./abilityCollisionLogic";

describe("ability collision dedupe", () => {
  it("lets a target take one hit per ability activation", () => {
    expect(canAbilityHit(undefined, 4)).toBe(true);
    expect(canAbilityHit(4, 4)).toBe(false);
    expect(canAbilityHit(4, 5)).toBe(true);
  });

  it("keeps activation ids monotonic", () => {
    expect(nextAbilityHitId(0)).toBe(1);
    expect(nextAbilityHitId(41)).toBe(42);
  });
});
