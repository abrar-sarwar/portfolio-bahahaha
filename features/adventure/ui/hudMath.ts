import type { BuffId } from "../ids";

// Pure HUD math extracted so the hearts logic is unit-tested without React.
// 6-heart unification (Task 32): health is measured in WHOLE hearts — one point
// per heart, one glyph per max-heart, no half-heart rounding. (The pre-rework
// half-heart model — maxHealth 10 => 5 hearts, 2 points each — is retired; the
// dormant turn-based engine keeps its own HP scale in CombatState.)

export interface Hearts {
  full: number;
  /** Retained for shape stability; always 0 now (no half hearts). */
  half: number;
  empty: number;
}

/** Break a whole-heart health value into full / empty glyph counts. Clamps
 *  health to [0, maxHealth]; total glyphs = maxHealth (one per heart). `half`
 *  is always 0 — halves were removed with the 6-heart unification. */
export function heartsFromHealth(health: number, maxHealth: number): Hearts {
  const totalHearts = Math.max(0, Math.floor(maxHealth));
  const clamped = Math.max(0, Math.min(Math.floor(health), totalHearts));
  const full = clamped;
  const empty = Math.max(0, totalHearts - full);
  return { full, half: 0, empty };
}

/** Short two-letter chip label for a buff id (HUD buff chips). */
const BUFF_TAGS: Record<BuffId, string> = {
  "attack-byte": "AB",
  "firewall-layer": "FW",
  "focus-chip": "FC",
  "parry-module": "PM",
  "recovery-packet": "RP",
  "root-access": "RA",
  "exploit-insight": "EI",
  "cache-boost": "CB",
};

export function buffTag(buff: BuffId): string {
  return BUFF_TAGS[buff] ?? buff.slice(0, 2).toUpperCase();
}

export interface BuffCount {
  buff: BuffId;
  n: number;
}

/** Group a (possibly repeated) buff list into one entry per distinct buff id
 *  with its stack count, ordered by each buff's first appearance. Buffs stack
 *  (duplicates are legal — e.g. attack-byte +1 each pickup), so the HUD
 *  renders one chip per buff id with an xN count rather than N separate
 *  chips. */
export function countBuffs(buffs: BuffId[]): BuffCount[] {
  const order: BuffId[] = [];
  const counts = new Map<BuffId, number>();
  for (const b of buffs) {
    if (!counts.has(b)) order.push(b);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  return order.map((buff) => ({ buff, n: counts.get(buff)! }));
}

/** Human-readable buff name for toasts / tooltips. */
const BUFF_NAMES: Record<BuffId, string> = {
  "attack-byte": "Attack Byte",
  "firewall-layer": "Firewall Layer",
  "focus-chip": "Focus Chip",
  "parry-module": "Parry Module",
  "recovery-packet": "Recovery Packet",
  "root-access": "Root Access",
  "exploit-insight": "Exploit Insight",
  "cache-boost": "Cache Boost",
};

export function buffName(buff: BuffId): string {
  return BUFF_NAMES[buff] ?? buff;
}
