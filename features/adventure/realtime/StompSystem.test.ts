import { describe, it, expect } from "vitest";
import * as stompSystem from "./StompSystem";
import { classifyStomp, resolveStomp } from "./StompSystem";
import { RT_PLAYER } from "./config";

// Target AABB: top at y=100, height 30 → top-third line at y=110.
const target = { topY: 100, height: 30, stompable: true };

describe("classifyStomp", () => {
  it("stomps when falling with feet above the target's top third", () => {
    expect(classifyStomp({ vy: 200, feetY: 105 }, target)).toBe("stomp");
  });

  it("is a strict boundary: feet exactly on the top-third line is contact, not stomp", () => {
    // top-third line = 100 + 30/3 = 110. feetY === 110 → contact (mirrors enemyLogic strictness).
    expect(classifyStomp({ vy: 200, feetY: 110 }, target)).toBe("contact");
    expect(classifyStomp({ vy: 200, feetY: 109 }, target)).toBe("stomp");
  });

  it("is contact when feet are below the top third even while falling", () => {
    expect(classifyStomp({ vy: 200, feetY: 125 }, target)).toBe("contact");
  });

  it("is contact when rising (vy <= 0) even from above", () => {
    expect(classifyStomp({ vy: -200, feetY: 105 }, target)).toBe("contact");
    expect(classifyStomp({ vy: 0, feetY: 105 }, target)).toBe("contact");
  });

  it("never stomps a non-stompable target", () => {
    expect(classifyStomp({ vy: 200, feetY: 105 }, { ...target, stompable: false })).toBe("contact");
  });
});

describe("resolveStomp", () => {
  it("attaches the bounce velocity and stomp damage on a stomp", () => {
    const r = resolveStomp({ vy: 200, feetY: 105 }, target);
    expect(r.kind).toBe("stomp");
    if (r.kind === "stomp") {
      expect(r.bounceVel).toBe(RT_PLAYER.stompBounceVel);
      expect(r.damage).toBe(RT_PLAYER.stompDamage);
    }
  });

  it("returns a plain contact otherwise", () => {
    expect(resolveStomp({ vy: -5, feetY: 105 }, target).kind).toBe("contact");
  });
});

describe("createStompHook", () => {
  it("defaults to accepting a generic boss stomp", () => {
    expect(stompSystem.createStompHook).toBeTypeOf("function");
    const hook = stompSystem.createStompHook();
    expect(hook.resolve()).toBe(true);
  });

  it("uses and disposes the mechanics handler", () => {
    expect(stompSystem.createStompHook).toBeTypeOf("function");
    const hook = stompSystem.createStompHook();
    const dispose = hook.register(() => false);
    expect(hook.resolve()).toBe(false);
    dispose();
    expect(hook.resolve()).toBe(true);
  });
});
