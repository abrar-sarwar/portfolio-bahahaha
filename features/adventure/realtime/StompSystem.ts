// features/adventure/realtime/StompSystem.ts
//
// PURE stomp-contact classification. Mirrors the geometry convention established
// in enemies/enemyLogic.ts (falling + feet above the target's upper region →
// stomp), but parameterised over a plain AABB so it carries no Enemy import.
// The boundary is STRICT — feet exactly on the top-third line count as a
// side/contact hit, not a stomp — matching enemyLogic's strict `<`.
import { RT_PLAYER } from "./config";

export interface StompTarget {
  topY: number; // top edge of the target AABB (smaller y = higher)
  height: number;
  stompable: boolean;
}

export interface StompProbe {
  vy: number; // player vertical velocity (down = positive)
  feetY: number; // player's bottom edge
}

export type StompContact = "stomp" | "contact";

export type StompResolution =
  | { kind: "stomp"; bounceVel: number; damage: number }
  | { kind: "contact" };

export interface StompHook {
  /** Register the boss-mechanics decision for a geometrically valid stomp.
   *  Returning false rejects the stomp and lets the scene treat it as body
   *  contact (for example, the Scythebound while spinning). */
  register(handler: () => boolean): () => void;
  /** Resolve a valid stomp. Bosses without custom mechanics accept by default. */
  resolve(): boolean;
  clear(): void;
}

/** Tiny scene↔mechanics seam for objective-driven stomp encounters. */
export function createStompHook(): StompHook {
  let current: (() => boolean) | null = null;
  return {
    register(handler) {
      current = handler;
      return () => {
        if (current === handler) current = null;
      };
    },
    resolve: () => current?.() ?? true,
    clear: () => {
      current = null;
    },
  };
}

/**
 * Classify an overlap: a stomp needs a stompable target, downward motion, and
 * the player's feet strictly above the target's top-third line.
 */
export function classifyStomp(probe: StompProbe, target: StompTarget): StompContact {
  if (!target.stompable) return "contact";
  if (probe.vy <= 0) return "contact";
  const topThirdLine = target.topY + target.height / 3;
  return probe.feetY < topThirdLine ? "stomp" : "contact";
}

/**
 * Resolve an overlap into an outcome, attaching the player's bounce velocity and
 * stomp damage on a successful stomp.
 */
export function resolveStomp(
  probe: StompProbe,
  target: StompTarget,
  cfg: { bounceVel: number; damage: number } = {
    bounceVel: RT_PLAYER.stompBounceVel,
    damage: RT_PLAYER.stompDamage,
  },
): StompResolution {
  if (classifyStomp(probe, target) === "stomp") {
    return { kind: "stomp", bounceVel: cfg.bounceVel, damage: cfg.damage };
  }
  return { kind: "contact" };
}
