// features/adventure/combat/controllerLogic.ts
// Pure helpers for the combat controller — the parts that are logic rather than
// glue, extracted so the telegraph deadline math (with pause extension), the
// force-result selection per QTE kind, the carry builder, and the fx diff are
// all unit-testable without Phaser, React, or timers.
import type { QteSpec } from "./timedEvents";
import type { CombatEvent, CombatState } from "./types";
import type { BossId, BuffId } from "../ids";

// Telegraph timing contract: impact lands at 1400ms scaled by the phase tempo
// and the assist scale; the UI has an extra grace window after impact to land a
// late press before the controller force-fails the unanswered telegraph.
export const TELEGRAPH_BASE_MS = 1400;
export const TELEGRAPH_GRACE_MS = 250;

export function telegraphImpactMs(tempoScale: number, assistScale: number): number {
  return TELEGRAPH_BASE_MS * tempoScale * assistScale;
}

/** Wall-clock budget before an unanswered telegraph is force-failed. */
export function telegraphDeadlineMs(tempoScale: number, assistScale: number): number {
  return telegraphImpactMs(tempoScale, assistScale) + TELEGRAPH_GRACE_MS;
}

/** The failing defense-result for a spec kind: parry → "miss", QTE → fail. */
export function forceDefenseResult(spec: QteSpec): Extract<CombatEvent, { type: "defense-result" }> {
  return spec.kind === "parry"
    ? { type: "defense-result", parry: "miss" }
    : { type: "defense-result", qteSuccess: false };
}

// ─────────────────────────────────────────────── pause-extendable deadline ──
// A deadline that freezes while the game is paused: pausing records when the
// pause began; resuming pushes the due time forward by the paused duration, so
// a pause mid-telegraph never eats the player's parry window.

export interface Deadline {
  dueAt: number;
  pausedAt: number | null;
}

export function createDeadline(now: number, durationMs: number): Deadline {
  return { dueAt: now + durationMs, pausedAt: null };
}

export function pauseDeadline(d: Deadline, now: number): Deadline {
  return d.pausedAt === null ? { ...d, pausedAt: now } : d;
}

export function resumeDeadline(d: Deadline, now: number): Deadline {
  if (d.pausedAt === null) return d;
  return { dueAt: d.dueAt + (now - d.pausedAt), pausedAt: null };
}

/** Time left before firing; frozen (measured from the pause instant) while paused. */
export function remainingMs(d: Deadline, now: number): number {
  const ref = d.pausedAt ?? now;
  return Math.max(0, d.dueAt - ref);
}

/** True once due and not paused. A paused deadline never expires. */
export function isExpired(d: Deadline, now: number): boolean {
  return d.pausedAt === null && now >= d.dueAt;
}

// ───────────────────────────────────────────────────────────── carry build ──

export interface CombatCarry {
  levelBuffs: BuffId[];
  deathsOnBoss: number;
  abilities: { improvedParry: boolean };
  maxHealth: number;
  attack: number;
  parryWindowMs: number;
  perfectParryMs: number;
  typingPower: number;
}

export interface CarryBase {
  maxHealth: number;
  attack: number;
  parryWindowMs: number;
  perfectParryMs: number;
  typingPower: number;
}

/** Assemble the engine `carry` from player base stats, the level's buff
 *  snapshot, and this boss's death count (which drives the assist curve). */
export function buildCarry(args: {
  base: CarryBase;
  levelBuffs: BuffId[];
  deaths: Partial<Record<BossId, number>>;
  bossId: BossId;
  improvedParry: boolean;
}): CombatCarry {
  return {
    levelBuffs: [...args.levelBuffs],
    deathsOnBoss: args.deaths[args.bossId] ?? 0,
    abilities: { improvedParry: args.improvedParry },
    maxHealth: args.base.maxHealth,
    attack: args.base.attack,
    parryWindowMs: args.base.parryWindowMs,
    perfectParryMs: args.base.perfectParryMs,
    typingPower: args.base.typingPower,
  };
}

// ─────────────────────────────────────────────────────────────── fx diff ──

export type CombatFxKind =
  | "player-hit" | "boss-hit" | "parry" | "crit" | "breach" | "phase" | "summon";

/** Derive the visual/audio fx a transition should fire, by diffing prev→next.
 *  Returns [] for a no-op transition (illegal event → same reference). */
export function deriveFx(prev: CombatState, next: CombatState, event: CombatEvent): CombatFxKind[] {
  if (prev === next) return [];
  const fx: CombatFxKind[] = [];
  const perfectParry = event.type === "defense-result" && event.parry === "perfect";
  const anyParry =
    event.type === "defense-result" && (event.parry === "perfect" || event.parry === "normal");

  if (anyParry) fx.push("parry");
  if (next.bossHealth < prev.bossHealth) fx.push("boss-hit");
  if (next.player.health < prev.player.health) fx.push("player-hit");

  const newLog = next.log.slice(prev.log.length).join(" ");
  if (perfectParry || /ULTIMATE|Perfect parry/i.test(newLog)) fx.push("crit");
  if (next.mechanic.breached && !prev.mechanic.breached) fx.push("breach");
  if (next.phaseIndex > prev.phaseIndex) fx.push("phase");
  if (next.mechanic.summons > prev.mechanic.summons) fx.push("summon");
  return fx;
}
