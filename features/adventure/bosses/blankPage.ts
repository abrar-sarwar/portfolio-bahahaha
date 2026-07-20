// features/adventure/bosses/blankPage.ts — VERBATIM from the plan's CURRENT
// block (task-20-brief). The Blank Page is the sequence-puzzle boss: it is
// armored, so blades only chip 1 until the player performs the order of making
// (ANALYZE -> DEFEND -> REMEMBER -> CREATE). Completing all four steps breaks
// the armor ("THE PAGE UNDERSTANDS…") and normal attacks then land full. Each
// step costs a boss turn, so the fight carries real risk. Its reward is the
// castle key, forged from the three memory-world fragments (grantReward also
// auto-forges it at three fragments — see state/save.ts). Telegraphs are
// authored WITHOUT a leading boss name: the engine renders `${def.name}
// ${move.telegraph}.`, so a name-prefixed telegraph would read doubled.
import type { BossDefinition } from "../combat/types";

export const BLANK_PAGE: BossDefinition = {
  id: "blank-page", name: "The Blank Page", maxHealth: 50, armored: true,
  phases: [{ exitBelow: 0, movePool: ["doubt", "erase", "silence"], tempoScale: 1 }],
  weaknesses: ["Swords don't work on emptiness. Understand it instead.",
               "It fears the order of making: see clearly, hold steady, recall, begin.",
               "ANALYZE → DEFEND → REMEMBER → CREATE."],
  typingPrompts: ["build", "learn", "create", "persist", "begin"],
  moves: [
    { id: "doubt", name: "Whisper of Doubt", damage: 2, parryable: true, telegraph: "The page ripples: 'why bother?'…" },
    { id: "erase", name: "Erase", damage: 2, parryable: false,
      qte: { kind: "type-word", word: "begin", timeLimitMs: 2600 }, telegraph: "White nothing reaches for your outline…" },
    { id: "silence", name: "Silence", damage: 1, parryable: true, telegraph: "Sound drains from the room…" },
  ],
  mechanic: "sequence-puzzle",
  rewards: [{ kind: "castle-key", id: "castle" }],
  intro: [
    "THE BLANK PAGE: I am every chapter you never started.",
    "THE BLANK PAGE: Strike me. See how little it matters.",
  ],
  defeatLines: [
    "THE BLANK PAGE: …oh. You began.",
    "The three fragments fuse — CASTLE KEY FORGED.",
    "The Devil King's gate is open. Finish this.",
  ],
};
