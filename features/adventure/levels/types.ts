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
  /** Fake-platform spawn cells (legend `F`): 16x8 one-way look-alikes that
   *  flicker near the player and vanish once stood on (see PlatformLevelScene). */
  fakes: Pt[];
  /** Boat spawn cells (legend `o`): 32x16 moving platforms that tween ±64px
   *  horizontally and carry a rider (see PlatformLevelScene). */
  boats: Pt[];
}
