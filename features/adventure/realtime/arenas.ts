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

// The Hollow Giant's chamber (Task 37, tightened on owner feedback): a 48×17
// buried vault with a completely FLAT floor and NO scaffolding — no one-way
// tiers, no debris marks, no anchor nubs. The colossus torso (128×136,
// rendered BEHIND the player) sits centre with its base flush on the floor;
// the ONLY way up to the chest cavity is the palm he occasionally plants
// (bossDefinitions/hollowGiant.ts). `D` is parked at the torso column, inert
// under enterBoss()'s no-op.
const GIANT_ROWS = [
  "################################################",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#.......P...............D......................#",
  "################################################",
  "################################################",
  "################################################",
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
    { kind: "crystal", tx: 4, ty: 3 },
    { kind: "crystal", tx: 43, ty: 3 },
  ],
};

// The One-Eyed Dealer's private casino chamber (Task 39): a 48×18 room. Flat
// plush floor for the duel, one high center beam + two mid side beams (glass
// one-ways, double-jump reachable) for dodging bullet rain, and two low trim
// blocks as ricochet cover. `D` parked in the air at the Dealer spawn (inert).
const DEALER_ROWS = [
  "################################################",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#..............................................#",
  "#...................========...................#",
  "#..............................................#",
  "#.......=======..................=======.......#",
  "#..............................................#",
  "#...P.......##..........D.........##...........#",
  "################################################",
  "################################################",
];

export const DEALER_ARENA: LevelDefinition = {
  id: "dealer-arena" as LevelId, // synthetic — never persisted (see TRAINING_ARENA)
  name: "THE PRIVATE ROOM",
  theme: "casino",
  bossId: "one-eyed-dealer",
  music: "one-eyed-dealer",
  map: DEALER_ROWS.join("\n"),
  introDialogueId: null,
  fragmentDialogueId: null,
  decor: [
    { kind: "casino-neon", tx: 8, ty: 4 },
    { kind: "casino-neon", tx: 39, ty: 4 },
    { kind: "casino-slot", tx: 3, ty: 13 },
    { kind: "casino-slot", tx: 44, ty: 13 },
  ],
};

// The Scythebound's sealed courtyard (Task 40): a 40×18 rain-slick yard —
// flat cobbles, one high center block, two low one-way ledges for the stomp
// game. The arena stays locked until stomp 15 (the counter lives in the
// mechanics; the crash-through wall beat is presentation).
const COURTYARD_ROWS = [
  "########################################",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#...............########...............#",
  "#......................................#",
  "#......................................#",
  "#....=====....................=====....#",
  "#......................................#",
  "#......................................#",
  "#..P..........................D........#",
  "########################################",
  "########################################",
  "########################################",
];

export const COURTYARD_ARENA: LevelDefinition = {
  id: "courtyard-arena" as LevelId, // synthetic — never persisted
  name: "THE SEALED COURTYARD",
  theme: "rain",
  bossId: "scythebound",
  music: "scythebound",
  map: COURTYARD_ROWS.join("\n"),
  introDialogueId: null,
  fragmentDialogueId: null,
  decor: [
    { kind: "rain-lamp", tx: 3, ty: 12 },
    { kind: "rain-lamp", tx: 36, ty: 12 },
    { kind: "rain-fence", tx: 8, ty: 13 },
    { kind: "rain-fence", tx: 31, ty: 13 },
  ],
};

// The Veiled Archer's cathedral chamber (Task 41): a 46×18 nave — three tall
// pillars carrying elevated ledges, floor one-ways, her high center perch.
// Pale-glow arrows that miss EMBED into surfaces and become temporary
// platforms — the stairway to her ledge (mechanics-spawned).
const CATHEDRAL_ROWS = [
  "##############################################",
  "#............................................#",
  "#............................................#",
  "#...........................#................#",
  "#...........#...............#.......#........#",
  "#...........#...........D...#.......#........#",
  "#...........#.........=====.#.......#........#",
  "#...........#...............#.......#........#",
  "#...........#...............#.......#........#",
  "#...........#..====.........#..====.#........#",
  "#...........#...............#.......#........#",
  "#...........#...............#.......#........#",
  "#.....====..#...............#.......#..====..#",
  "#...........#...............#.......#........#",
  "#..P........#...............#.......#........#",
  "##############################################",
  "##############################################",
  "##############################################",
];

export const CATHEDRAL_ARENA: LevelDefinition = {
  id: "cathedral-arena" as LevelId, // synthetic — never persisted
  name: "THE CENTRAL CHAMBER",
  theme: "rain",
  bossId: "veiled-archer",
  music: "veiled-archer",
  map: CATHEDRAL_ROWS.join("\n"),
  introDialogueId: null,
  fragmentDialogueId: null,
  decor: [
    { kind: "rain-glass", tx: 5, ty: 4 },
    { kind: "rain-glass", tx: 40, ty: 4 },
    { kind: "rain-chandelier", tx: 22, ty: 2 },
    { kind: "rain-bell", tx: 33, ty: 3 },
  ],
};

// The Devil King's last room (Tasks 44–45): a broad, level dueling floor with
// two low escape ledges and a broken high gallery. The uncluttered centre keeps
// the human-scale sword duel readable; the side ledges support the airborne
// spear-seal answer without turning the room into platform clutter.
const RIFT_THRONE_ROWS = [
  "####################################################",
  "#..................................................#",
  "#..................................................#",
  "#..................................................#",
  "#..................................................#",
  "#..................................................#",
  "#..................................................#",
  "#...................============...................#",
  "#..................................................#",
  "#..................................................#",
  "#..................................................#",
  "#..................................................#",
  "#......======........................======........#",
  "#..................................................#",
  "#..................................................#",
  "#....P......................................D......#",
  "####################################################",
  "####################################################",
];

export const RIFT_THRONE_ARENA: LevelDefinition = {
  id: "rift-throne-arena" as LevelId, // synthetic — never persisted
  name: "THE DARK THRONE",
  theme: "rift",
  bossId: "devil-king",
  music: "devil-duel",
  map: RIFT_THRONE_ROWS.join("\n"),
  introDialogueId: null,
  fragmentDialogueId: null,
  decor: [
    { kind: "statue", tx: 8, ty: 13 },
    { kind: "banner", tx: 17, ty: 2 },
    { kind: "banner", tx: 34, ty: 2 },
    { kind: "statue", tx: 43, ty: 13 },
  ],
};

export const ARENAS: Record<string, LevelDefinition> = {
  training: TRAINING_ARENA,
  "temple-throne": TEMPLE_ARENA,
  "hollow-giant": GIANT_ARENA,
  "dealer-room": DEALER_ARENA,
  courtyard: COURTYARD_ARENA,
  cathedral: CATHEDRAL_ARENA,
  "rift-throne": RIFT_THRONE_ARENA,
};

export function getArena(key: string): LevelDefinition | undefined {
  return ARENAS[key];
}
