// features/adventure/realtime/ProjectileSystem.ts
//
// PURE projectile kinematics: linear / arc (gravity) / homing-lite (capped turn
// rate) / bouncing (reflect off provided AABB walls, capped bounce count) plus
// TTL expiry. Spawn spec in → position/velocity/alive out. Velocities are px/s;
// dt is ms. No pooling here (that is the Phaser-side ProjectileManager, Task 33)
// and no rng — motion is fully deterministic.

export type ProjectileKind = "linear" | "arc" | "homing" | "bouncing";

export interface ProjectileSpec {
  kind: ProjectileKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttlMs: number;
  gravity?: number; // px/s² downward, for "arc"
  turnRateRadPerSec?: number; // max steer, for "homing"
  speed?: number; // maintained speed for "homing" (default = spawn speed)
  maxBounces?: number; // for "bouncing" (default unlimited)
}

export interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ProjectileState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ageMs: number;
  bounces: number;
  alive: boolean;
}

export interface ProjectileCtx {
  dt: number;
  targetX?: number; // for "homing"
  targetY?: number;
  walls?: Wall[]; // for "bouncing"
}

export function spawnProjectile(spec: ProjectileSpec): ProjectileState {
  return { x: spec.x, y: spec.y, vx: spec.vx, vy: spec.vy, ageMs: 0, bounces: 0, alive: true };
}

/** Advance one fixed step. Dead projectiles are absorbing (returned untouched). */
export function stepProjectile(
  spec: ProjectileSpec,
  st: ProjectileState,
  ctx: ProjectileCtx,
): ProjectileState {
  if (!st.alive) return st;
  const dtS = ctx.dt / 1000;
  let { x, y, vx, vy, ageMs, bounces } = st;

  // 1) velocity update by kind
  if (spec.kind === "arc") {
    vy += (spec.gravity ?? 0) * dtS;
  } else if (spec.kind === "homing" && ctx.targetX !== undefined && ctx.targetY !== undefined) {
    const cur = Math.atan2(vy, vx);
    const desired = Math.atan2(ctx.targetY - y, ctx.targetX - x);
    // shortest signed angular difference, normalised to [-π, π]
    let diff = Math.atan2(Math.sin(desired - cur), Math.cos(desired - cur));
    const maxTurn = (spec.turnRateRadPerSec ?? 0) * dtS;
    if (diff > maxTurn) diff = maxTurn;
    else if (diff < -maxTurn) diff = -maxTurn;
    const speed = spec.speed ?? Math.hypot(vx, vy);
    const heading = cur + diff;
    vx = Math.cos(heading) * speed;
    vy = Math.sin(heading) * speed;
  }

  // 2) integrate
  let nx = x + vx * dtS;
  let ny = y + vy * dtS;

  // 3) bouncing: swept segment-vs-AABB against the first wall crossed this step
  // (a swept test, not endpoint-only, so a fast bullet cannot tunnel a thin wall)
  let alive = true;
  if (spec.kind === "bouncing" && ctx.walls) {
    const dx = nx - x;
    const dy = ny - y;
    for (const w of ctx.walls) {
      const hit = sweptHit(x, y, dx, dy, w);
      if (!hit) continue;
      const t = Math.max(0, hit.t);
      if (hit.axis === "x") vx = -vx;
      else vy = -vy;
      nx = x + dx * t; // rest at the impact face; reflected velocity carries next step
      ny = y + dy * t;
      bounces += 1;
      if (spec.maxBounces !== undefined && bounces > spec.maxBounces) alive = false;
      break; // one bounce per step
    }
  }

  // 4) TTL
  ageMs += ctx.dt;
  if (ageMs >= spec.ttlMs) alive = false;

  return { x: nx, y: ny, vx, vy, ageMs, bounces, alive };
}

/** One slab's [tmin, tmax] entry/exit fractions, or null if the ray misses it. */
function slab(min: number, max: number, p: number, d: number): readonly [number, number] | null {
  if (d === 0) return p >= min && p <= max ? [-Infinity, Infinity] : null;
  const t1 = (min - p) / d;
  const t2 = (max - p) / d;
  return t1 < t2 ? [t1, t2] : [t2, t1];
}

/**
 * Swept point-vs-AABB: does the segment (x,y)→(x+dx,y+dy) cross wall `w` within
 * this step? Returns the entry fraction `t ∈ [0,1]` and the face axis, else null.
 */
function sweptHit(
  x: number,
  y: number,
  dx: number,
  dy: number,
  w: Wall,
): { t: number; axis: "x" | "y" } | null {
  const sx = slab(w.x, w.x + w.w, x, dx);
  const sy = slab(w.y, w.y + w.h, y, dy);
  if (!sx || !sy) return null;
  const tEntry = Math.max(sx[0], sy[0]);
  const tExit = Math.min(sx[1], sy[1]);
  if (tEntry > tExit || tEntry > 1 || tExit < 0) return null;
  return { t: tEntry, axis: sx[0] > sy[0] ? "x" : "y" };
}
