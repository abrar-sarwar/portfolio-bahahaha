import { describe, it, expect } from "vitest";
import { makeRng, RT_PLAYER, RT_TUNING, RT_MECHANIC } from "./config";
import { nextRand } from "../combat/rng";

describe("makeRng", () => {
  it("is deterministic: same seed → same sequence", () => {
    const a = makeRng(1234);
    const b = makeRng(1234);
    const seqA = [a(), a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("advances internal state (successive values differ)", () => {
    const r = makeRng(42);
    const v1 = r();
    const v2 = r();
    expect(v1).not.toBe(v2);
  });

  it("returns values in [0, 1)", () => {
    const r = makeRng(7);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("threads the same seeds as raw nextRand", () => {
    const r = makeRng(999);
    let seed = 999 | 0;
    for (let i = 0; i < 5; i++) {
      const [expected, next] = nextRand(seed);
      expect(r()).toBe(expected);
      seed = next;
    }
  });

  it("different seeds diverge", () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(a()).not.toBe(b());
  });
});

describe("RT constants", () => {
  it("player has 6 hearts and the §4 combat values", () => {
    expect(RT_PLAYER.maxHearts).toBe(6);
    expect(RT_PLAYER.attackDamage).toBe(2);
    expect(RT_PLAYER.stompDamage).toBe(3);
    expect(RT_PLAYER.parryWindowMs).toBe(200);
    expect(RT_PLAYER.parryFailVulnerableMs).toBe(450);
    expect(RT_PLAYER.hurtIframesMs).toBe(900);
  });

  it("fixes the phase-transition state at 600ms and names the force-defeat mechanic", () => {
    expect(RT_TUNING.transitionMs).toBe(600);
    expect(RT_MECHANIC.forceDefeat).toBe("force-defeat");
  });
});
