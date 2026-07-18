import type { BuffId } from "../ids";
import type { ActiveEffects, PlayerCombat } from "./types";

export const COMBAT_USABLE: BuffId[] = [
  "attack-byte", "firewall-layer", "focus-chip", "parry-module",
  "recovery-packet", "root-access", "exploit-insight",
];

const BUFF_NAMES: Record<BuffId, string> = {
  "attack-byte": "Attack Byte",
  "firewall-layer": "Firewall Layer",
  "focus-chip": "Focus Chip",
  "parry-module": "Parry Module",
  "recovery-packet": "Recovery Packet",
  "root-access": "Root Access",
  "exploit-insight": "Exploit Insight",
  "cache-boost": "Cache Boost",
};

export function applyItem(
  fx: ActiveEffects,
  player: PlayerCombat,
  buff: BuffId,
): { fx: ActiveEffects; player: PlayerCombat; log: string } {
  const name = BUFF_NAMES[buff];
  switch (buff) {
    case "recovery-packet": {
      const healed = Math.max(0, Math.min(3, player.maxHealth - player.health));
      return {
        fx,
        player: { ...player, health: player.health + healed },
        log: `${name} heals ${healed} HP.`,
      };
    }
    case "attack-byte":
      return {
        fx: { ...fx, attackBonus: fx.attackBonus + 1 },
        player,
        log: `${name} raises your attack power.`,
      };
    case "firewall-layer":
      return {
        fx: { ...fx, firewallLayers: Math.min(2, fx.firewallLayers + 1) },
        player,
        log: `${name} reinforces your defenses.`,
      };
    case "focus-chip":
      return {
        fx: { ...fx, focusChips: Math.min(2, fx.focusChips + 1) },
        player,
        log: `${name} sharpens your focus.`,
      };
    case "parry-module":
      return {
        fx: { ...fx, parryModules: Math.min(3, fx.parryModules + 1) },
        player,
        log: `${name} widens your parry window.`,
      };
    case "root-access":
      return {
        fx: { ...fx, rootAccessCharges: fx.rootAccessCharges + 1 },
        player,
        log: `${name} grants a charge.`,
      };
    case "exploit-insight":
      return {
        fx: { ...fx, analyzed: true, exploitInsight: true },
        player,
        log: `${name} exposes a weakness.`,
      };
    case "cache-boost":
      return { fx, player, log: `${name} is already active.` };
  }
}
