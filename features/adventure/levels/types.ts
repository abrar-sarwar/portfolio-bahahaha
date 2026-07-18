import type { LevelId, BossId, TrackId } from "../ids";

export interface LevelDefinition {
  id: LevelId;
  name: string;
  theme: "fields" | "harbor" | "factory" | "archive" | "castle";
  bossId: BossId;
  music: TrackId;
  map: string;
  introDialogueId: string | null;
  fragmentDialogueId: string | null;
}

export interface Pt {
  tx: number;
  ty: number;
}

export type EnemyKind =
  | "bugling"
  | "phishling"
  | "malware-bat"
  | "brute"
  | "firewall-knight"
  | "rootkit-slime";

export interface ParsedLevel {
  widthTiles: number;
  heightTiles: number;
  solids: boolean[][];
  oneWays: boolean[][];
  hazards: boolean[][];
  playerStart: Pt;
  checkpoints: Pt[];
  fragment: Pt | null;
  bossDoor: Pt;
  spawns: { kind: EnemyKind; at: Pt }[];
}
