import { describe, it, expect } from "vitest";
import {
  scaleBossDamage,
  initPlayerHearts,
  applyPlayerHit,
  tickPlayerIframes,
  healToFull,
  grantMaxHeart,
  computeKnockback,
} from "./DamageSystem";
import { RT_PLAYER } from "./config";

describe("scaleBossDamage", () => {
  it("passes attack/stomp damage through unscaled by default", () => {
    expect(scaleBossDamage(2, "attack")).toBe(2);
    expect(scaleBossDamage(3, "stomp")).toBe(3);
  });

  it("scales attack damage by damageScale.attack", () => {
    expect(scaleBossDamage(2, "attack", { attack: 0.25 })).toBe(0.5);
  });

  it("scales stomp damage by damageScale.stomp (0 = immune to stomps)", () => {
    expect(scaleBossDamage(3, "stomp", { stomp: 0 })).toBe(0);
  });

  it("mechanic hits are ALWAYS scale 1, ignoring damageScale", () => {
    expect(scaleBossDamage(1, "mechanic", { attack: 0, stomp: 0 })).toBe(1);
  });
});

describe("player hearts", () => {
  it("starts full at 6 hearts with no iframes", () => {
    const hp = initPlayerHearts();
    expect(hp.hearts).toBe(6);
    expect(hp.maxHearts).toBe(6);
    expect(hp.iframesMs).toBe(0);
  });

  it("a normal hit removes 1 heart and arms iframes", () => {
    const r = applyPlayerHit(initPlayerHearts(), 1);
    expect(r.hp.hearts).toBe(5);
    expect(r.blocked).toBe(false);
    expect(r.dead).toBe(false);
    expect(r.hp.iframesMs).toBe(RT_PLAYER.hurtIframesMs);
  });

  it("a heavy hit removes 2 hearts", () => {
    const r = applyPlayerHit(initPlayerHearts(), 2);
    expect(r.hp.hearts).toBe(4);
  });

  it("a hit DURING iframes is a no-op (blocked, no heart loss, iframes unchanged)", () => {
    const hp = { hearts: 5, maxHearts: 6, iframesMs: 400 };
    const r = applyPlayerHit(hp, 2);
    expect(r.blocked).toBe(true);
    expect(r.hp.hearts).toBe(5);
    expect(r.hp.iframesMs).toBe(400);
  });

  it("clamps at 0 and reports death", () => {
    const r = applyPlayerHit({ hearts: 1, maxHearts: 6, iframesMs: 0 }, 2);
    expect(r.hp.hearts).toBe(0);
    expect(r.dead).toBe(true);
  });

  it("ticks iframes down and never below 0", () => {
    expect(tickPlayerIframes({ hearts: 6, maxHearts: 6, iframesMs: 500 }, 200).iframesMs).toBe(300);
    expect(tickPlayerIframes({ hearts: 6, maxHearts: 6, iframesMs: 100 }, 200).iframesMs).toBe(0);
  });

  it("heal-to-full restores hearts to max and clears iframes", () => {
    const hp = healToFull({ hearts: 1, maxHearts: 6, iframesMs: 300 });
    expect(hp.hearts).toBe(6);
    expect(hp.iframesMs).toBe(0);
  });

  it("assist bonus heart raises max AND current by one", () => {
    const hp = grantMaxHeart(initPlayerHearts());
    expect(hp.maxHearts).toBe(7);
    expect(hp.hearts).toBe(7);
  });
});

describe("computeKnockback", () => {
  it("pushes away from the damage source and up", () => {
    const right = computeKnockback(100, 40, 200, 150); // player right of source
    expect(right.vx).toBe(200);
    expect(right.vy).toBe(-150);
    const left = computeKnockback(40, 100, 200, 150); // player left of source
    expect(left.vx).toBe(-200);
  });

  it("defaults to a rightward push when player and source share an x", () => {
    expect(computeKnockback(50, 50, 200, 150).vx).toBe(200);
  });
});
