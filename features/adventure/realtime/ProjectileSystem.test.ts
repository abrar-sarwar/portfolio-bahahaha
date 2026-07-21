import { describe, it, expect } from "vitest";
import {
  spawnProjectile,
  stepProjectile,
  type ProjectileSpec,
  type Wall,
} from "./ProjectileSystem";

describe("spawnProjectile", () => {
  it("seeds position/velocity from the spec and starts alive", () => {
    const spec: ProjectileSpec = { kind: "linear", x: 10, y: 20, vx: 100, vy: -50, ttlMs: 1000 };
    const s = spawnProjectile(spec);
    expect(s).toMatchObject({ x: 10, y: 20, vx: 100, vy: -50, ageMs: 0, bounces: 0, alive: true });
  });
});

describe("linear", () => {
  const spec: ProjectileSpec = { kind: "linear", x: 0, y: 0, vx: 340, vy: 0, ttlMs: 1000 };
  it("advances by velocity × dt (px/s, dt in ms)", () => {
    const s = stepProjectile(spec, spawnProjectile(spec), { dt: 100 });
    expect(s.x).toBeCloseTo(34); // 340 px/s * 0.1s
    expect(s.y).toBeCloseTo(0);
    expect(s.alive).toBe(true);
  });
});

describe("arc (gravity)", () => {
  const spec: ProjectileSpec = { kind: "arc", x: 0, y: 0, vx: 100, vy: -100, ttlMs: 2000, gravity: 1000 };
  it("accelerates vy by gravity × dt", () => {
    const s = stepProjectile(spec, spawnProjectile(spec), { dt: 100 });
    expect(s.vy).toBeCloseTo(0); // -100 + 1000*0.1
    expect(s.vx).toBeCloseTo(100); // unaffected
  });
});

describe("homing-lite", () => {
  const spec: ProjectileSpec = {
    kind: "homing",
    x: 0,
    y: 0,
    vx: 100,
    vy: 0,
    ttlMs: 5000,
    turnRateRadPerSec: Math.PI, // 180°/s
    speed: 100,
  };
  it("turns toward the target but no more than the max turn rate, preserving speed", () => {
    // target straight down; desired heading is +90°, max turn in 100ms is 18°.
    const s = stepProjectile(spec, spawnProjectile(spec), { dt: 100, targetX: 0, targetY: 100 });
    expect(s.vy).toBeGreaterThan(0); // started turning downward
    expect(Math.hypot(s.vx, s.vy)).toBeCloseTo(100); // speed maintained
    const heading = Math.atan2(s.vy, s.vx);
    expect(heading).toBeCloseTo(Math.PI * 0.1, 3); // exactly the clamped 18°
  });
});

describe("bouncing", () => {
  // Wall spanning x in [50,60], y in [-100,100]; projectile flies right into it.
  const wall: Wall = { x: 50, y: -100, w: 10, h: 200 };
  const spec: ProjectileSpec = { kind: "bouncing", x: 40, y: 0, vx: 300, vy: 0, ttlMs: 5000, maxBounces: 1 };

  it("reflects horizontal velocity off a wall and counts the bounce", () => {
    const s = stepProjectile(spec, spawnProjectile(spec), { dt: 100, walls: [wall] });
    expect(s.vx).toBe(-300);
    expect(s.bounces).toBe(1);
    expect(s.alive).toBe(true);
  });

  it("dies once it exceeds maxBounces", () => {
    let s = spawnProjectile(spec);
    s = stepProjectile(spec, s, { dt: 100, walls: [wall] }); // bounce 1, now moving left
    // send it back into a wall on the left to trigger bounce 2 (> maxBounces=1)
    const leftWall: Wall = { x: -100, y: -100, w: 130, h: 200 };
    s = { ...s, x: 35 };
    s = stepProjectile(spec, s, { dt: 100, walls: [leftWall] });
    expect(s.bounces).toBe(2);
    expect(s.alive).toBe(false);
  });
});

describe("TTL", () => {
  const spec: ProjectileSpec = { kind: "linear", x: 0, y: 0, vx: 10, vy: 0, ttlMs: 150 };
  it("expires once age reaches ttl", () => {
    let s = spawnProjectile(spec);
    s = stepProjectile(spec, s, { dt: 100 });
    expect(s.alive).toBe(true);
    s = stepProjectile(spec, s, { dt: 100 }); // age 200 >= 150
    expect(s.alive).toBe(false);
  });

  it("is a no-op once dead (absorbing)", () => {
    const dead = { x: 5, y: 5, vx: 10, vy: 0, ageMs: 999, bounces: 0, alive: false };
    expect(stepProjectile(spec, dead, { dt: 100 })).toEqual(dead);
  });
});
