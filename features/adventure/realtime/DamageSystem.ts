// features/adventure/realtime/DamageSystem.ts
//
// PURE damage math for the real-time core. Two responsibilities, no Phaser:
//   1. Boss-side incoming-damage scaling (used by the BossStateMachine).
//   2. Player-side hearts / iframes / knockback.
import { RT_PLAYER } from "./config";

// ── Boss side ────────────────────────────────────────────────────────────────

/**
 * Scale an incoming hit against the boss. `mechanic` hits are always applied at
 * face value (scale 1) — they are the scripted weakness path and must never be
 * softened by damageScale or armor. `attack`/`stomp` hits scale by the def's
 * per-source multiplier (default 1). A `stomp` scale of 0 makes a boss immune
 * to stomps (e.g. The Broken King).
 */
export function scaleBossDamage(
  amount: number,
  source: "attack" | "stomp" | "mechanic",
  damageScale?: { attack?: number; stomp?: number },
): number {
  if (source === "mechanic") return amount;
  const mult = source === "attack" ? damageScale?.attack ?? 1 : damageScale?.stomp ?? 1;
  return amount * mult;
}

// ── Player side ──────────────────────────────────────────────────────────────

export interface PlayerHearts {
  hearts: number;
  maxHearts: number;
  iframesMs: number;
}

export interface PlayerHitResult {
  hp: PlayerHearts;
  blocked: boolean; // true when iframes swallowed the hit (no-op)
  dead: boolean;
}

export function initPlayerHearts(maxHearts: number = RT_PLAYER.maxHearts): PlayerHearts {
  return { hearts: maxHearts, maxHearts, iframesMs: 0 };
}

/**
 * Apply a 1- or 2-heart hit. A hit that lands while iframes are active is a
 * no-op (`blocked`). A hit that lands arms fresh iframes and clamps hearts at 0.
 * Pure: returns a new PlayerHearts, never mutates the input.
 */
export function applyPlayerHit(
  hp: PlayerHearts,
  damage: 1 | 2,
  iframesMs: number = RT_PLAYER.hurtIframesMs,
): PlayerHitResult {
  if (hp.iframesMs > 0) {
    return { hp: { ...hp }, blocked: true, dead: hp.hearts <= 0 };
  }
  const hearts = Math.max(0, hp.hearts - damage);
  return { hp: { ...hp, hearts, iframesMs }, blocked: false, dead: hearts <= 0 };
}

export function tickPlayerIframes(hp: PlayerHearts, dt: number): PlayerHearts {
  if (hp.iframesMs <= 0) return hp;
  return { ...hp, iframesMs: Math.max(0, hp.iframesMs - dt) };
}

/** Full heal (level start, checkpoint respawn, arena entry/retry). Clears iframes. */
export function healToFull(hp: PlayerHearts): PlayerHearts {
  return { ...hp, hearts: hp.maxHearts, iframesMs: 0 };
}

/** Silent-assist bonus heart (§6): raise the ceiling and the current pool by one. */
export function grantMaxHeart(hp: PlayerHearts): PlayerHearts {
  return { ...hp, maxHearts: hp.maxHearts + 1, hearts: hp.hearts + 1 };
}

/**
 * Knockback velocity from a damage source: pushed horizontally AWAY from the
 * source with a fixed upward pop. When player and source share an x (dead-on),
 * default to a rightward push so knockback is never zero.
 */
export function computeKnockback(
  playerX: number,
  sourceX: number,
  speedX: number,
  speedY: number,
): { vx: number; vy: number } {
  const dir = playerX < sourceX ? -1 : 1;
  return { vx: dir * speedX, vy: -speedY };
}
