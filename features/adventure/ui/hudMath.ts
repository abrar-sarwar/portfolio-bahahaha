import type { BuffId } from "../ids";

// Pure HUD math extracted so the hearts logic (half-heart rounding, odd
// health/maxHealth) is unit-tested without React. Health is measured in
// half-heart points: maxHealth 6 => 3 hearts, each heart = 2 points.

export interface Hearts {
  full: number;
  half: number;
  empty: number;
}

/** Break a health value into full / half / empty heart glyph counts.
 *  Clamps health to [0, maxHealth]; total glyphs = ceil(maxHealth / 2). */
export function heartsFromHealth(health: number, maxHealth: number): Hearts {
  const totalHearts = Math.max(0, Math.ceil(maxHealth / 2));
  const clamped = Math.max(0, Math.min(health, maxHealth));
  const full = Math.floor(clamped / 2);
  const half = clamped % 2 === 1 ? 1 : 0;
  const empty = Math.max(0, totalHearts - full - half);
  return { full, half, empty };
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
