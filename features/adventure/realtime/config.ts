// features/adventure/realtime/config.ts
//
// Single source of tuning constants for the real-time combat core, plus the
// seeded-rng helper. Importing the read-only mulberry32 step from combat/rng.ts
// is explicitly allowed (amendment §3); editing that file is not.
import { nextRand } from "../combat/rng";

// Player combat starting values (amendment §4; tuned in playtests). Existing
// platforming feel (coyote/buffer/dash/knockback) stays in adventure/config.ts.
export const RT_PLAYER = {
  maxHearts: 6,
  attackCooldownMs: 320,
  attackActiveMs: 140,
  attackReachPx: 20,
  attackDamage: 2,
  hitStopMs: 70, // boss hit-stop when a player hit lands
  stompBounceVel: -330,
  stompDamage: 3,
  parryWindowMs: 200,
  parryFailVulnerableMs: 450,
  parryFreezeMs: 120,
  hurtIframesMs: 900,
} as const;

// Machine-level timings that are not part of any per-attack spec.
export const RT_TUNING = {
  spawnMs: 600, // spawn -> idle intro beat
  transitionMs: 600, // fixed phase-transition state duration (§4)
} as const;

// Well-known mechanic-event ids the pure machine recognises directly. Boss
// mechanics modules (Task 33+) emit these via MechanicsApi; every OTHER mechanic
// id is a boss-specific signal handled outside the machine (crown cracks, clasp
// shatters, seal pips, …).
export const RT_MECHANIC = {
  forceDefeat: "force-defeat", // MechanicsApi.forceDefeat() → machine → defeated
} as const;

// Canonical animation-state names the machine emits as { kind: "anim" }. The
// BossController (Task 33) maps each to the current boss's sprite animation.
export const RT_ANIM = {
  spawn: "spawn",
  idle: "idle",
  telegraph: "telegraph",
  attack: "attack",
  recovery: "recovery",
  stagger: "stagger",
  transition: "transition",
  damage: "damage",
  defeat: "defeat",
} as const;

/**
 * Wrap the read-only mulberry32 step in a stateful closure so the machine's
 * `StepInput.rng: () => number` gets an independent, deterministic stream. Same
 * seed → identical sequence of values in [0, 1). Use in tests for determinism
 * and in the scene to seed a boss encounter.
 */
export function makeRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    const [value, next] = nextRand(s);
    s = next;
    return value;
  };
}
