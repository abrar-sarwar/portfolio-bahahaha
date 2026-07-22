// features/adventure/realtime/types.ts
//
// Pure type contracts for the real-time boss-combat core (plan amendment §4,
// "Binding interfaces"). These shapes are implemented VERBATIM: later tasks may
// add OPTIONAL fields, but the members below are never renamed or removed.
//
// ZERO Phaser imports live here (this is the pure logic core). The Phaser-facing
// mechanics factory (BossMechanics / MechanicsApi) is defined by Task 33 where
// the scene types exist.
import type { TrackId } from "../ids";

export type RtBossId =
  | "training-dummy" | "broken-king" | "hollow-giant" | "one-eyed-dealer"
  | "scythebound" | "veiled-archer" | "devil-king";

export interface RtAttackSpec {
  id: string;
  telegraphMs: number; // >= 700 required when damage === 2 (validateDef)
  activeMs: number; // never scaled by tempo
  recoveryMs: number; // punish window; doubles as the vulnerable-window length
  cooldownMs?: number;
  parryable?: boolean; // shows the game-wide parry flash during telegraph
  damage: 1 | 2; // hearts
  weight?: number; // selection weight (default 1)
  minRangePx?: number;
  maxRangePx?: number; // selection gating by |player - boss| x-distance
}

export interface RtPhaseSpec {
  id: string;
  enterBelowHpFrac?: number; // omitted for phase 0 / mechanic-driven phases
  attackIds: string[];
  tempoScale?: number; // < 1 = faster telegraph + recovery
}

export interface RtBossDef {
  id: RtBossId;
  name: string; // shown ALL-CAPS in BossHealthBar
  maxHp: number;
  contactDamage: 1 | 2;
  damageScale?: { attack?: number; stomp?: number }; // default 1 / 1
  phases: RtPhaseSpec[];
  attacks: RtAttackSpec[];
  arenaKey: string; // key into realtime/arenas.ts
  track: TrackId;
  spawn: { tx: number; ty: number };
  /** Boss starts mechanic-armored (Veiled Archer: damage only via scripted
   *  catches; One-Eyed Dealer: masked on spawn). Default false. */
  invulnerableBaseline?: boolean;
  /** Physics body size (default 18×30). Also anchors floor placement: the
   *  sprite is positioned so its feet sit on the bottom of the spawn tile. */
  body?: { w: number; h: number };
  /** Row index (sprite px, from the top) of the BOTTOM edge of the visible
   *  feet. When set, floor placement aligns THIS line to the spawn tile's
   *  bottom instead of assuming the body rect ends at the drawn feet — art
   *  with bottom padding (the Broken King's 1-row margin) otherwise sinks or
   *  floats by the mismatch between sprite height and body height. */
  spriteFeetY?: number;
  /** Disable body-contact interactions entirely (background-anchored bosses —
   *  the Hollow Giant: threats and weak points are all mechanics-spawned). */
  noContact?: boolean;
  /** Map the machine's generic anim vocabulary (RT_ANIM names) onto this
   *  boss's sprite rows — e.g. telegraph+overhead → "overhead-prep". Falls
   *  back to the BossController's generic chain when absent/returning null. */
  animFor?(anim: string, ctx: { attackId: string | null; phaseIndex: number }): string | null;
}

export type MachineEvent =
  | { kind: "hit"; amount: number; source: "attack" | "stomp" | "mechanic" }
  | { kind: "parried" } // player parried the current parryable attack
  | { kind: "wall-hit" } // charge-type attacks striking a wall
  | { kind: "mechanic"; id: string } // boss-specific (truth, clasp, seal, force-defeat, …)
  // Task 33 mechanics-driven extensions (boss-demands synthesis). All additive:
  | { kind: "force-phase"; phaseIndex: number; lock?: boolean }
  // ^ mechanic-driven phase jump (stomp tiers, catches, weapon-form timers).
  //   `lock` suppresses hp-driven deepening afterwards (needed when hp is frozen
  //   or a rollback must stick against deepestPhase re-entering).
  | { kind: "force-stagger"; ms: number }
  // ^ unconditional scripted stagger/expose window of an explicit length —
  //   catch windows, unmask freezes, stomp stuns, seal-shatter openings. Unlike
  //   `parried`/`wall-hit` it fires from ANY non-defeated state.
  | { kind: "set-invulnerable"; value: boolean }
  // ^ toggle mechanic armor at runtime (mask on/off, arsenal seals).
  | { kind: "set-tempo"; scale: number | null };
  // ^ override the phase's tempoScale until cleared with null (rage removal,
  //   re-mask speed-ups, post-lapse acceleration).

export interface BossMachineState {
  hp: number;
  phaseIndex: number;
  fsm:
    | "spawn"
    | "idle"
    | "telegraph"
    | "attack"
    | "recovery"
    | "stagger"
    | "transition"
    | "defeated";
  msInState: number;
  currentAttackId: string | null;
  cooldowns: Record<string, number>;
  vulnerableMs: number; // > 0 → weakness/punish window open
  invulnerable: boolean; // mechanic-armored (normal damage events ignored)
  /** Set by a `force-phase` event with `lock: true`: hp-driven phase deepening
   *  is suppressed for the rest of the fight (mechanics own the phases). */
  phaseLocked?: boolean;
  /** Set by `set-tempo`: overrides the current phase's tempoScale until cleared
   *  (null/absent → the phase's own scale applies). */
  tempoOverride?: number | null;
}

export type MachineCommand =
  | { kind: "anim"; anim: string }
  | { kind: "attack-start" | "attack-active" | "attack-end"; attackId: string }
  | { kind: "phase"; phaseIndex: number }
  | { kind: "stagger" }
  | { kind: "vulnerable"; ms: number }
  | { kind: "defeated" };

export interface StepInput {
  dt: number; // ms, fixed-step in tests
  playerX: number;
  playerY: number;
  bossX: number;
  bossY: number;
  events: MachineEvent[];
  rng: () => number; // seeded (see makeRng in config.ts)
  /** Silent-assist recovery lengthening (assistRT §6): scales recovery-window
   *  durations (and their vulnerable windows). Default 1. */
  recoveryScale?: number;
}
