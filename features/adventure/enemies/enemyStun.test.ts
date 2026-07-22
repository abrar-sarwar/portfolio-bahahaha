import { describe, expect, it } from "vitest";
import { beginEnemyStun, stepEnemyStun } from "./enemyStunLogic";

describe("generic enemy stun", () => {
  it("suppresses touch damage and movement until the timer expires", () => {
    const stunned = beginEnemyStun({ stunnedUntil: 0, restingTouchDamage: 1 }, 100, 900);
    expect(stepEnemyStun(stunned, 999)).toEqual({ stunned: true, touchDamage: 0 });
    expect(stepEnemyStun(stunned, 1_000)).toEqual({ stunned: false, touchDamage: 1 });
  });

  it("extends an existing stun instead of shortening it", () => {
    const state = beginEnemyStun({ stunnedUntil: 2_000, restingTouchDamage: 2 }, 500, 900);
    expect(state.stunnedUntil).toBe(2_000);
  });
});
