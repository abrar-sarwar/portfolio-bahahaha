// features/adventure/realtime/arenas.ts
//
// Boss-arena maps as small, fully-enclosed LevelDefinitions rendered through the
// existing tile/theme pipeline (amendment §4). An arena map contains NO
// checkpoint / fragment / enemy chars, so those PlatformLevelScene systems
// no-op; boss placement comes from RtBossDef.spawn, not a legend char. The one
// required `D` marker (parseLevel demands a boss door) is parked under the boss
// spawn and neutralised by BossArenaScene.enterBoss()'s no-op override, so it is
// never a turn-based launch point.
//
// The map is built procedurally so every row is guaranteed the same width (no
// hand-counted ASCII to drift).
import type { LevelDefinition } from "../levels/types";
import type { LevelId } from "../ids";

function buildEnclosedArena(opts: {
  w: number;
  h: number;
  ledges: { row: number; from: number; to: number }[];
  playerStart: { tx: number; ty: number };
  bossDoor: { tx: number; ty: number };
}): string {
  const { w, h } = opts;
  const grid: string[][] = [];
  for (let y = 0; y < h; y++) {
    const row: string[] = [];
    for (let x = 0; x < w; x++) {
      const wall = x === 0 || x === w - 1; // sealed side walls
      const ceiling = y === 0;
      const floor = y >= h - 2; // solid floor: bottom two rows
      row.push(wall || ceiling || floor ? "#" : ".");
    }
    grid.push(row);
  }
  for (const l of opts.ledges) {
    for (let x = l.from; x <= l.to; x++) grid[l.row][x] = "=";
  }
  grid[opts.playerStart.ty][opts.playerStart.tx] = "P";
  grid[opts.bossDoor.ty][opts.bossDoor.tx] = "D";
  return grid.map((r) => r.join("")).join("\n");
}

// A single-screen-plus arena: flat floor, two side one-way ledges to jump
// between (and stomp from), sealed on all sides. Boss at the right, player at
// the left. Boss spawn tile == the `D` marker tile.
// Ledge height: max jump rise is v²/2g = 360²/2800 ≈ 46px, so a reachable
// ledge must sit ≤ 2 tiles (32px) above the floor — row 14. (They originally
// sat at row 11 = 80px up: pure decoration nobody could ever stand on.)
const TRAINING_MAP = buildEnclosedArena({
  w: 40,
  h: 18,
  ledges: [
    { row: 14, from: 9, to: 13 }, // clear of the player spawn at tx 6
    { row: 14, from: 30, to: 34 }, // walk-off-left drops onto the boss head
  ],
  playerStart: { tx: 6, ty: 15 },
  bossDoor: { tx: 28, ty: 15 },
});

/** The training arena reuses the castle tileset (dark, enclosed — reads as a
 *  duel chamber). `id`/`bossId` are synthetic/vestigial: arenas do not
 *  participate in save/overworld progression, and the arena's real boss is the
 *  RtBossDef, not `bossId` (BossArenaScene overrides enterBoss so `bossId` and
 *  the `D` marker are never used to launch anything). */
export const TRAINING_ARENA: LevelDefinition = {
  // Synthetic id: never persisted; kept off the LevelId union so it can't leak
  // into completed/unlocked. Cast is contained to this module.
  id: "training-arena" as LevelId,
  name: "TRAINING ARENA",
  theme: "castle",
  // Vestigial in arenas — see the doc comment above. A valid BossId keeps the
  // LevelDefinition shape honest; BossArenaScene never reads it.
  bossId: "devil-king",
  music: "boss",
  map: TRAINING_MAP,
  introDialogueId: null,
  fragmentDialogueId: null,
};

// The Broken King's temple hall (Task 35, tightened on owner feedback): a
// 44×17 enclosed stone box with a completely FLAT floor — no dais, no pillar
// stumps (nothing to bump into approaching him, and floor-riding attacks
// never pass "through" raised ground). Side walls are the charge-stagger
// surface; the ceiling light-shaft (cols 25–29) pours onto the King's spot;
// two low side beams + one high center beam give double-jump routes and a
// stomp perch. The required `D` is parked at the King's spawn cell (28,13),
// inert under enterBoss()'s no-op. Rendered through the tiles-city kit's
// temple biome (theme "temple").
const TEMPLE_ROWS = [
  "#########################.....##############",
  "#..........................................#",
  "#..........................................#",
  "#..........................................#",
  "#..........................................#",
  "#..........................................#",
  "#..........................................#",
  "#..........................................#",
  "#..........................................#",
  "#..............============................#",
  "#..........................................#",
  "#....=====....................=====........#",
  "#..........................................#",
  "#....P......................D..............#",
  "############################################",
  "############################################",
  "############################################",
];

export const TEMPLE_ARENA: LevelDefinition = {
  id: "temple-arena" as LevelId, // synthetic — never persisted (see TRAINING_ARENA)
  name: "HALL OF THE BROKEN CROWN",
  theme: "temple",
  bossId: "broken-king",
  music: "broken-king",
  map: TEMPLE_ROWS.join("\n"),
  introDialogueId: null,
  fragmentDialogueId: null,
  decor: [
    { kind: "lantern", tx: 6, ty: 5 },
    { kind: "lantern", tx: 37, ty: 5 },
  ],
};

// The Hollow Giant's chamber (Task 37): 60×16 vault. The colossus torso is the
// background-anchored boss sprite (spawn 29,11 — embedded, feet sunk into the
// floor); three-tier one-way stacks flank it, two anchor nubs (# at 20/39)
// brace the player against the Inhale, and the `*` marks are the passive
// ceiling-debris traps. `D` is parked in the air over the player start (inert).
// Tier spacing: floor top is row 14 (y224); jump rise ≈46px < 3 tiles, so the
// flanking tiers step 2 tiles apiece (rows 12/10/8 — the forge draft's
// 11/8/5 stack was unreachable from the floor; playtest-driven fix).
const GIANT_ROWS = [
  "############################################################",
  "############################################################",
  "#...........*...........*...........*...........*..........#",
  "#..........................................................#",
  "#..........................................................#",
  "#..........................................................#",
  "#..........................................................#",
  "#..........................................................#",
  "#...====............................................====...#",
  "#...........................D..............................#",
  "#...======........................................======...#",
  "#..........................................................#",
  "#...========....................................========...#",
  "#...................#........P.........#...................#",
  "############################################################",
  "############################################################",
];

export const GIANT_ARENA: LevelDefinition = {
  id: "giant-arena" as LevelId, // synthetic — never persisted (see TRAINING_ARENA)
  name: "CHAMBER OF THE BURIED HEART",
  theme: "desert",
  bossId: "hollow-giant",
  music: "hollow-giant",
  map: GIANT_ROWS.join("\n"),
  introDialogueId: null,
  fragmentDialogueId: null,
  decor: [
    { kind: "anchor", tx: 20, ty: 13 },
    { kind: "anchor", tx: 39, ty: 13 },
    { kind: "crystal", tx: 6, ty: 3 },
    { kind: "crystal", tx: 53, ty: 3 },
  ],
};

export const ARENAS: Record<string, LevelDefinition> = {
  training: TRAINING_ARENA,
  "temple-throne": TEMPLE_ARENA,
  "hollow-giant": GIANT_ARENA,
};

export function getArena(key: string): LevelDefinition | undefined {
  return ARENAS[key];
}
