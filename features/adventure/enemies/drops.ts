import type { BuffId } from "../ids";
import type { EnemyKind } from "../levels/types";

export type Drop = BuffId | "heart" | null;
/** A drop that actually materializes as a pickup (never the null "no drop"). */
export type DropItem = Exclude<Drop, null>;

// Cumulative thresholds: the first row whose threshold the roll falls under
// wins, otherwise nothing drops. Table is locked (see task-8-brief).
const TABLE: Record<EnemyKind, [number, Drop][]> = {
  bugling: [[0.5, "heart"], [0.7, "attack-byte"]],
  phishling: [[0.6, "focus-chip"], [0.9, "firewall-layer"]],
  "malware-bat": [[0.5, "focus-chip"], [0.7, "cache-boost"]],
  brute: [[0.4, "firewall-layer"], [0.8, "heart"]],
  "firewall-knight": [[0.5, "parry-module"], [0.7, "recovery-packet"]],
  "rootkit-slime": [[0.4, "root-access"], [0.6, "exploit-insight"]],
  // Crown Imp (realtime rework): a two-stomp demon whose real reward is the
  // POWER stack — the drop table just tops hearts up on the road to the King.
  "crown-imp": [[0.35, "heart"]],
};

export function rollDrop(kind: EnemyKind, rand: number): Drop {
  for (const [threshold, drop] of TABLE[kind]) if (rand < threshold) return drop;
  return null;
}
