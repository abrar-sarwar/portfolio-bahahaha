// features/adventure/ids.ts
export type LevelId = "1-1" | "1-2" | "1-3" | "1-4" | "castle";
export type BossId = "glitch-toad" | "captain-spoof" | "warden" | "blank-page" | "devil-king";
export type BuffId =
  | "attack-byte" | "firewall-layer" | "focus-chip" | "parry-module"
  | "recovery-packet" | "root-access" | "exploit-insight" | "cache-boost";
export type AbilityId = "dash" | "analyze" | "improvedParry";
export type KeyFragment = "bronze" | "silver" | "gold";
export type TrackId =
  | "title" | "overworld" | "level-1" | "level-2" | "level-3" | "level-4"
  | "boss" | "castle" | "devil-1" | "devil-2" | "devil-3" | "victory" | "chest";
export type SfxId =
  | "jump" | "stomp" | "parry" | "type" | "damage" | "collect" | "chest"
  | "select" | "dash" | "error" | "crit";
export type SceneKey = "Boot" | "Title" | "Overworld" | "Level" | "CombatBackdrop" | "Victory" | "Chest";
