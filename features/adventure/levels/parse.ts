import type { LevelDefinition, ParsedLevel, Pt, EnemyKind, Conveyor } from "./types";

const ENEMY_CHARS: Record<string, EnemyKind> = {
  b: "bugling", p: "phishling", m: "malware-bat",
  B: "brute", k: "firewall-knight", s: "rootkit-slime",
  d: "crown-imp", // demon soldier of the false crown (World 1-1, two stomps)
};

export function parseLevel(def: LevelDefinition): ParsedLevel {
  const rows = def.map.split("\n").filter((r) => r.length > 0);
  const w = rows[0].length;
  const grid = <T,>(v: T) => rows.map(() => Array<T>(w).fill(v));
  const solids = grid(false), oneWays = grid(false), hazards = grid(false);
  let playerStart: Pt | null = null, bossDoor: Pt | null = null, fragment: Pt | null = null;
  const checkpoints: Pt[] = [];
  const seals: Pt[] = []; // Truth Seal pickups (Task 34)
  const debrisMarks: Pt[] = []; // ceiling-debris markers (Task 36)
  const lifts: Pt[] = []; // vertical lift movers (Task 36)
  const spawns: { kind: EnemyKind; at: Pt }[] = [];
  const fakes: Pt[] = [];
  const boats: Pt[] = [];
  const conveyors: Conveyor[] = [];
  const gates: Pt[] = [];
  const lasers: Pt[] = [];
  const rotators: Pt[] = [];
  const fountains: Pt[] = [];
  const bridges: Pt[] = [];

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
      else if (ch === "T") seals.push(at); // Truth Seal pickup (Task 34)
      else if (ch === "*") debrisMarks.push(at); // ceiling debris marker (Task 36)
      else if (ch === "I") lifts.push(at); // vertical lift (Task 36)
      else if (ch === "F") fakes.push(at); // fake platform (Task 18)
      else if (ch === "o") boats.push(at); // boat / moving platform (Task 18)
      // Conveyors (Task 19): the cell is ALSO a solid the entity rides on, so
      // it collides/merges/renders as floor; the {at,dir} record drives the
      // per-frame horizontal push in the scene.
      else if (ch === "<") { solids[ty][tx] = true; conveyors.push({ at, dir: -1 }); }
      else if (ch === ">") { solids[ty][tx] = true; conveyors.push({ at, dir: 1 }); }
      else if (ch === "G") gates.push(at); // timed gate (Task 19)
      else if (ch === "L") lasers.push(at); // laser emitter (Task 19)
      else if (ch === "@") rotators.push(at); // rotator pivot (Task 20 archive)
      // Fireball fountain (Task 21 castle): a marker cell (not a tile) the scene
      // spawns pooled arcing fireballs from every 2.2s.
      else if (ch === "!") fountains.push(at);
      // Collapsing bridge (Task 21 castle): a marker whose one-way body + sprite
      // are scene-built; NOT a plain solid, so it doesn't join the solids grid.
      else if (ch === "~") bridges.push(at);
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
    fakes, boats, conveyors, gates, lasers, rotators, fountains, bridges, seals,
    debrisMarks, lifts,
  };
}
