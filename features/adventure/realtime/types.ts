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
}

export type MachineEvent =
  | { kind: "hit"; amount: number; source: "attack" | "stomp" | "mechanic" }
  | { kind: "parried" } // player parried the current parryable attack
  | { kind: "wall-hit" } // charge-type attacks striking a wall
  | { kind: "mechanic"; id: string }; // boss-specific (truth, clasp, seal, force-defeat, …)

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
}
