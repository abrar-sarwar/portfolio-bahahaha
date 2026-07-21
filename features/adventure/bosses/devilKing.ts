// features/adventure/bosses/devilKing.ts — VERBATIM from the plan's CURRENT
// block (docs/superpowers/plans/2026-07-17-abrars-adventure.md DEVIL_KING). The
// Devil King is the final boss and the only "devil-king" mechanic: three phases
// (0.6 / 0.2 / 0). The engine (LOCKED) clamps him to ceil(0.2*90)=18 HP on
// entering the last phase, tags the fight "scripted", heals the player +2
// ("Resolve steadies you"), and drives the five-step finale (analyze → parry →
// command → root-access → strike). corruptedPrompts auto-engage at phase ≥ 1
// (COMMAND then shows the typo'd `shown` but grades against `correct`).
//
// Balance (round-2 sim, verbatim def): typical castle loadout AVERAGE ≈ 52%,
// assist-3 unbuffed ≈ 24% — both above the plan floors (≥40% / ≥15%). The
// `sword` (Ruin Cleave) damage was cut 3→2 in that pass; `flurry` (Kingslayer
// Flurry) keeps the heavy 3 as the phase-2 spike.
//
// Telegraphs are authored WITHOUT a leading boss name: the engine renders
// `${def.name} ${move.telegraph}.`, so a name-prefixed telegraph would read
// doubled. defeatLines stay [] on purpose — Task 23 drives the scripted defeat
// through the `devil-defeat` dialogue, not this static list.
import type { BossDefinition } from "../combat/types";

export const DEVIL_KING: BossDefinition = {
  id: "devil-king", name: "The Devil King", maxHealth: 90,
  phases: [
    { exitBelow: 0.6, movePool: ["sword", "fire", "wave", "summon"], tempoScale: 1 },
    { exitBelow: 0.2, movePool: ["sword", "fire", "wave", "summon", "flurry"], tempoScale: 0.7,
      enterLines: ["The throne room SHATTERS. The Devil King descends into the breach.",
                   "DEVIL KING: You patch. I corrupt. Let us see which is faster."] },
    { exitBelow: 0, movePool: [], tempoScale: 0.6,
      enterLines: ["DEVIL KING: ENOUGH. I will delete the whole chapter — and you with it."] },
  ],
  weaknesses: ["His flurry always follows a missed fire volley.",
               "Corrupted commands must be TYPED CORRECTLY — fix the typo.",
               "When he charges the final attack, remember everything you've learned."],
  typingPrompts: ["scan target", "deploy patch", "enable firewall", "verify identity",
                  "encrypt memory", "restore system", "remove malware"],
  corruptedPrompts: [
    { shown: "encrpyt memory", correct: "encrypt memory" },
    { shown: "restoer system", correct: "restore system" },
    { shown: "remvoe malware", correct: "remove malware" },
    { shown: "vrify identity", correct: "verify identity" },
  ],
  moves: [
    { id: "sword", name: "Ruin Cleave", damage: 2, parryable: true, telegraph: "The greatsword drinks the light…" }, // 3→2 balance sim; flurry keeps the heavy 3 in phase 2
    { id: "fire", name: "Hellfire Volley", damage: 2, parryable: false,
      qte: { kind: "marker", travelMs: 1000, targetStart: 0.45, targetEnd: 0.6 }, telegraph: "Three cinders orbit his crown…" },
    { id: "wave", name: "Corruption Wave", damage: 2, parryable: false,
      qte: { kind: "type-word", word: "BLOCK", timeLimitMs: 2200 }, telegraph: "A wall of red static builds…" },
    { id: "summon", name: "Court of Bugs", damage: 1, parryable: false, summons: 2,
      qte: { kind: "choice", promptText: "Buglings swarm the arena!", options: ["HOLD THE LINE", "CHASE THEM", "IGNORE THEM"], correctIndex: 0, timeLimitMs: 2400 },
      telegraph: "He snaps his gauntleted fingers…" },
    { id: "flurry", name: "Kingslayer Flurry", damage: 3, parryable: true, telegraph: "He vanishes — reappears mid-swing!" },
  ],
  mechanic: "devil-king",
  rewards: [],
  intro: [
    "DEVIL KING: The archivist himself. I wondered when you'd crawl up my stairs.",
    "DEVIL KING: Your chapter was DELIGHTFUL to steal.",
    "DEVIL KING: Come, then. Show me your security posture.",
  ],
  defeatLines: [], // Task 23 drives the scripted defeat via dialogue "devil-defeat"
};
