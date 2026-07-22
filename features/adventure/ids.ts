// features/adventure/ids.ts
export type LevelId = "1-1" | "1-2" | "1-3" | "1-4" | "castle";
export type BossId =
  // turn-based ids (dormant, kept for save-shape compat)
  | "glitch-toad" | "captain-spoof" | "warden" | "blank-page" | "devil-king"
  // real-time rework bosses (amendment §6; devil-king reused above)
  | "broken-king" | "hollow-giant" | "one-eyed-dealer" | "scythebound" | "veiled-archer";
export type BuffId =
  | "attack-byte" | "firewall-layer" | "focus-chip" | "parry-module"
  | "recovery-packet" | "root-access" | "exploit-insight" | "cache-boost";
export type AbilityId = "dash" | "analyze" | "improvedParry";
export type KeyFragment = "bronze" | "silver" | "gold";
export type TrackId =
  | "title" | "overworld" | "level-1" | "level-2" | "level-3" | "level-4"
  | "boss" | "castle" | "devil-1" | "devil-2" | "devil-3" | "victory" | "chest"
  // real-time rework boss themes (amendment §5; content authored in boss tasks)
  | "broken-king" | "hollow-giant" | "one-eyed-dealer" | "scythebound"
  | "veiled-archer" | "devil-duel" | "devil-arsenal";
export type SfxId =
  | "jump" | "stomp" | "parry" | "type" | "damage" | "collect" | "chest"
  | "select" | "dash" | "error" | "crit"
  // real-time rework cues (amendment §5; stubbed in sfx.ts by Task 33)
  | "slash" | "boss-hit" | "telegraph" | "expose" | "seal" | "mask-break"
  | "heart-hit" | "weapon-swap" | "key-drop";
export type SceneKey =
  | "Boot" | "Title" | "Overworld" | "Level" | "CombatBackdrop" | "Victory" | "Chest"
  | "Arena" | "Chase";
