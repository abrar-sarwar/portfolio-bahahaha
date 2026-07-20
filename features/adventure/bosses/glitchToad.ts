// features/adventure/bosses/glitchToad.ts — verbatim from task-14-brief.md
import type { BossDefinition } from "../combat/types";

export const GLITCH_TOAD: BossDefinition = {
  id: "glitch-toad",
  name: "The Glitch Toad",
  maxHealth: 30,
  phases: [
    { exitBelow: 0.5, movePool: ["hop", "lick"], tempoScale: 1 },
    { exitBelow: 0, movePool: ["hop", "lick", "swarm"], tempoScale: 0.9,
      enterLines: ["The Toad croaks in corrupted hex!"] },
  ],
  weaknesses: ["Clean code disgusts it — typed COMMANDs hit hard.", "Its hop is slow. Parry when it flashes."],
  typingPrompts: ["scan", "patch", "block", "debug"],
  moves: [
    { id: "hop", name: "Glitch Hop", damage: 2, parryable: true, telegraph: "The Toad crouches, flashing red…" },
    { id: "lick", name: "Data Lick", damage: 1, parryable: true, telegraph: "A corrupted tongue coils back…" },
    { id: "swarm", name: "Bug Swarm", damage: 1, parryable: false, summons: 1,
      qte: { kind: "choice", promptText: "A swarm incoming — what do you do?", options: ["SWAT BUGS", "PET BUGS", "EAT BUGS"], correctIndex: 0, timeLimitMs: 2500 },
      telegraph: "Buglings pour from its back…" },
  ],
  mechanic: "tutorial",
  rewards: [{ kind: "ability", id: "dash" }, { kind: "key-fragment", id: "bronze" }],
  intro: [
    "GLITCH TOAD: ribbit.exe has encountered a problem.",
    "GLITCH TOAD: You. Small developer. This field is MY heap now.",
    "Type commands. Parry the flash. You've got this.",
  ],
  defeatLines: [
    "GLITCH TOAD: segmentation fault (core dumped)…",
    "The Bronze Key Fragment materializes!",
    "New ability: DASH (Shift). The Toad's speed is yours.",
  ],
};
