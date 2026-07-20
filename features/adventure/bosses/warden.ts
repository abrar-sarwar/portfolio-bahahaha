// features/adventure/bosses/warden.ts — from the current plan (balance-amended:
// maxHealth 44, crush damage 2, breach threshold 2 parries). Telegraphs are
// authored WITHOUT a leading boss name: the engine renders `${def.name} ${move
// .telegraph}.`, so a name-prefixed telegraph would read doubled ("The Warden
// The Warden's gauntlet…").
import type { BossDefinition } from "../combat/types";

export const WARDEN: BossDefinition = {
  id: "warden", name: "The Warden", maxHealth: 44, armored: true,
  phases: [
    { exitBelow: 0.5, movePool: ["crush", "beam"], tempoScale: 1 },
    { exitBelow: 0, movePool: ["crush", "beam", "lockdown"], tempoScale: 0.8,
      enterLines: ["THE WARDEN: PERIMETER BREACH. ESCALATING."] },
  ],
  weaknesses: ["Armor absorbs blades. PARRY his strikes to fill the BREACH meter.",
               "Two clean parries and the wall comes down.",
               "Once breached, COMMAND and ULTIMATE hit full force."],
  typingPrompts: ["nmap", "deny", "allow", "encrypt", "sudo"],
  moves: [
    { id: "crush", name: "Gate Crush", damage: 2, parryable: true, telegraph: "a massive gauntlet rises to crush the gate…" },
    { id: "beam", name: "Deny Beam", damage: 2, parryable: false,
      qte: { kind: "marker", travelMs: 1100, targetStart: 0.45, targetEnd: 0.6 },
      telegraph: "a red scanline sweeps toward you…" },
    { id: "lockdown", name: "Full Lockdown", damage: 3, parryable: true, telegraph: "every port slams shut…" },
  ],
  mechanic: "breach-meter",
  rewards: [{ kind: "ability", id: "improvedParry" }, { kind: "key-fragment", id: "gold" }],
  intro: ["THE WARDEN: STATE YOUR CREDENTIALS.", "THE WARDEN: …DENIED."],
  defeatLines: [
    "THE WARDEN: rule… deleted…",
    "The Gold Key Fragment clangs to the floor!",
    "Parry upgraded: wider window, brighter flash. You've earned it.",
  ],
};
