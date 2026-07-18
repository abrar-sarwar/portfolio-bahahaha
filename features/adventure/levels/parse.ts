import type { LevelDefinition, ParsedLevel, Pt, EnemyKind } from "./types";

const ENEMY_CHARS: Record<string, EnemyKind> = {
  b: "bugling", p: "phishling", m: "malware-bat",
  B: "brute", k: "firewall-knight", s: "rootkit-slime",
};

export function parseLevel(def: LevelDefinition): ParsedLevel {
  const rows = def.map.split("\n").filter((r) => r.length > 0);
  const w = rows[0].length;
  const grid = <T,>(v: T) => rows.map(() => Array<T>(w).fill(v));
  const solids = grid(false), oneWays = grid(false), hazards = grid(false);
  let playerStart: Pt | null = null, bossDoor: Pt | null = null, fragment: Pt | null = null;
  const checkpoints: Pt[] = [];
  const spawns: { kind: EnemyKind; at: Pt }[] = [];

  rows.forEach((row, ty) => {
    if (row.length !== w) throw new Error(`ragged map at row ${ty}`);
    [...row].forEach((ch, tx) => {
      const at = { tx, ty };
      if (ch === "#") solids[ty][tx] = true;
      else if (ch === "=") oneWays[ty][tx] = true;
      else if (ch === "^") hazards[ty][tx] = true;
      else if (ch === "P") playerStart = at;
      else if (ch === "D") bossDoor = at;
      else if (ch === "M") fragment = at;
      else if (ch === "C") checkpoints.push(at);
      else if (ENEMY_CHARS[ch]) spawns.push({ kind: ENEMY_CHARS[ch], at });
      else if (ch !== ".") throw new Error(`unknown map char "${ch}" at ${tx},${ty}`);
    });
  });
  if (!playerStart) throw new Error("missing player start (P)");
  if (!bossDoor) throw new Error("missing boss door (D)");
  return {
    widthTiles: w, heightTiles: rows.length,
    solids, oneWays, hazards,
    playerStart, checkpoints, fragment, bossDoor, spawns,
  };
}
