// features/adventure/combat/types.ts — verbatim
import type { BossId, BuffId } from "../ids";
import type { QteSpec, ParryGrade } from "./timedEvents";
import type { TypingGrade } from "./typing";

export interface BossMove {
  id: string; name: string; damage: number;
  parryable: boolean;
  qte?: QteSpec;          // when set, defense is this QTE instead of a parry
  telegraph: string;
  summons?: number;
}

export interface BossPhase {
  exitBelow: number;      // phase ends when health fraction <= exitBelow (last phase 0)
  movePool: string[];
  tempoScale: number;     // 1 = normal; 0.75 = 25% tighter windows
  enterLines?: string[];
}

export type BossMechanicId = "tutorial" | "spoof-pick" | "breach-meter" | "sequence-puzzle" | "devil-king";
export interface Reward { kind: "ability" | "key-fragment" | "castle-key"; id: string }

export interface BossDefinition {
  id: BossId; name: string; maxHealth: number; armored?: boolean;
  phases: BossPhase[]; weaknesses: string[];
  typingPrompts: string[]; corruptedPrompts?: { shown: string; correct: string }[];
  moves: BossMove[]; mechanic: BossMechanicId; rewards: Reward[];
  intro: string[]; defeatLines: string[];
}

export interface ActiveEffects {
  attackBonus: number; firewallLayers: number; focusChips: number;
  parryModules: number; exploitInsight: boolean; defending: boolean;
  stance: boolean; analyzed: boolean; rootAccessCharges: number;
}

export interface PlayerCombat {
  health: number; maxHealth: number; attack: number;
  parryWindowMs: number; perfectParryMs: number; typingPower: number;
  improvedParry: boolean;
}

export type CombatTag = "player-turn" | "typing" | "telegraph" | "scripted" | "victory" | "defeat";

export interface MechanicState {
  breachMeter: number; breached: boolean;
  bossTurns: number; exposed: boolean;
  seqIndex: number; finalStep: number; summons: number;
}

export interface CombatState {
  def: BossDefinition; tag: CombatTag; turn: number;
  bossHealth: number; phaseIndex: number;
  player: PlayerCombat; items: BuffId[]; fx: ActiveEffects;
  mechanic: MechanicState;
  ultimate: number; pendingMoveId: string | null;
  prompt: { text: string; display: string; timeLimitMs: number } | null;
  log: string[]; weaknessesRevealed: number;
  rng: number; assistScale: number;
  outcome: "ongoing" | "victory" | "defeat";
}

export type PlayerActionKind = "attack" | "command" | "defend" | "parry-stance" | "analyze";
export type CombatEvent =
  | { type: "action"; kind: PlayerActionKind }
  | { type: "item"; buff: BuffId }
  | { type: "mechanic"; choice: string }
  | { type: "typing-result"; grade: TypingGrade }
  | { type: "defense-result"; parry?: ParryGrade; qteSuccess?: boolean };
