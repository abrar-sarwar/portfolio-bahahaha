// features/adventure/bosses/captainSpoof.ts — verbatim from task-18-brief.md
import type { BossDefinition } from "../combat/types";

export const CAPTAIN_SPOOF: BossDefinition = {
  id: "captain-spoof", name: "Captain Spoof", maxHealth: 40,
  phases: [
    { exitBelow: 0.5, movePool: ["cutlass", "fake-login"], tempoScale: 1 },
    { exitBelow: 0, movePool: ["cutlass", "fake-login", "clone-volley"], tempoScale: 0.85,
      enterLines: ["CAPTAIN SPOOF: Ye've verified yer last source, matey!"] },
  ],
  weaknesses: ["His clones can't spell. VERIFY the real one.", "After a dodged fake-login he staggers — COMMAND hits crit-hard."],
  typingPrompts: ["verify source", "check headers", "report phish", "block sender"],
  moves: [
    { id: "cutlass", name: "Hook Cutlass", damage: 2, parryable: true, telegraph: "The Captain's hook glints…" },
    { id: "fake-login", name: "Fake Login Page", damage: 2, parryable: false,
      qte: { kind: "choice", promptText: "A login portal appears!", options: ["VERIFY SOURCE", "CLICK LINK", "SEND PASSWORD"], correctIndex: 0, timeLimitMs: 2200 },
      telegraph: "A shimmering portal unfurls…" },
    { id: "clone-volley", name: "Clone Volley", damage: 2, parryable: false,
      qte: { kind: "marker", travelMs: 1200, targetStart: 0.42, targetEnd: 0.58 },
      telegraph: "Three Captains draw three pistols…" },
  ],
  mechanic: "spoof-pick",
  rewards: [{ kind: "ability", id: "analyze" }, { kind: "key-fragment", id: "silver" }],
  intro: [
    "CAPTAIN SPOOF: Welcome aboard the S.S. Free-Gift-Card!",
    "CAPTAIN SPOOF: Just sign here, here, and… everywhere.",
  ],
  defeatLines: [
    "CAPTAIN SPOOF: Unsubscribe… me…",
    "The Silver Key Fragment washes ashore!",
    "New ability: ANALYZE (E near disguised foes, and in battle).",
  ],
};
