import type { LevelDefinition, DecorMark } from "./types";

// The Devil King's Castle: the dramatic final gauntlet. Black basalt over rivers
// of red lava, fireball fountains, collapsing iron bridges, a rising tide of
// corruption, a strong Knight+Brute gauntlet, then a long staircase to the
// throne door. NO memory fragment (the castle has none — the three fragments
// already forged the castle key that unseals this door). Every enemy here is a
// "strong" variant: theme "castle" tints spawns blood-dark and gives them +10
// patrol speed (see PlatformLevelScene.spawnEnemies + Enemy.makeShadow).
//
// The map is BUILT (not hand-typed): a 16x200 char grid stamped by segment so
// every row is guaranteed exactly 200 wide. Legend: # solid, = one-way, ^ lava
// hazard, ! fireball fountain, ~ collapsing bridge, C checkpoint, P start, D
// throne door, B brute, k firewall-knight, s rootkit-slime.
//
// Playability self-checked against config.ts jump math (jumpVel 360 / gravity
// 1400 -> ~46px apex ~= 2.9 tiles up, ~4.8-tile flat airtime; dash +51px):
//  - Chain climb (cols 18-44): a wall at cols 34-35 forces a one-way climb
//    (steps <=2 up / <=3 across) over the top and back down; solid floor beneath
//    the whole climb, so a slip just drops you home — nothing lethal.
//  - Fireball bridge (cols 48-66): 2-tile gaps over lava between short plats,
//    a fountain erupting in each gap. Checkpoint at col 46 sits right before it.
//  - Collapsing sprint (cols 67-88): a contiguous run of `~` bridges over lava
//    — each shakes 400ms after first touch then falls (respawns 3s), so keep
//    moving; a fall respawns you at the col-92 checkpoint just past it.
//  - Corruption shaft (cols 96-113): the red tide rises 12px/s while you're in
//    the span (caps at row 10 so it is never instant death); cross briskly. A
//    checkpoint sits at col 92 right before it.
//  - Gauntlet (cols 114-156): flat basalt floor so the strong brutes get their
//    charge runway; strong knights shield between them. Final checkpoint col 156.
//  - Staircase (cols 158-187): 6 steps rising 2 rows each over 5 cols — every
//    hop is a <=2-up / short-across jump, a dramatic ascent to the throne (D).
//  - Every non-flying spawn stands on solid floor; every row is exactly 200.

const W = 200;
const H = 16;
const FLOOR_TOP = 13; // solids at rows 13,14,15
const STAND = 12; // the row an actor stands on above FLOOR_TOP

/** Rising-corruption shaft span (hardcoded per the brief — a scene-driven region,
 *  not a map tile). The tide rises between these columns while the player is in
 *  the span; see PlatformLevelScene.updateCorruption. */
const CORRUPTION = { fromTx: 96, toTx: 113, floorTy: FLOOR_TOP, ceilTy: 10 } as const;

function buildMap(): string {
  const g: string[][] = Array.from({ length: H }, () => Array<string>(W).fill("."));
  const set = (tx: number, ty: number, ch: string) => {
    if (tx >= 0 && tx < W && ty >= 0 && ty < H) g[ty][tx] = ch;
  };
  const fillRect = (x0: number, x1: number, y0: number, y1: number, ch: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, ch);
  };
  const floor = (x0: number, x1: number) => fillRect(x0, x1, FLOOR_TOP, H - 1, "#");
  const lava = (x0: number, x1: number) => fillRect(x0, x1, FLOOR_TOP, H - 1, "^");

  // A. Entrance --------------------------------------------------------------
  floor(0, 47);
  set(2, STAND, "P");

  // B. Chain climb over a forcing wall (cols 18-44) --------------------------
  fillRect(34, 35, 4, H - 1, "#"); // the wall (floor already solid below)
  // ascend one-ways up the left face
  set(20, 11, "=");
  set(23, 9, "=");
  set(26, 7, "=");
  set(29, 5, "=");
  set(32, 4, "=");
  fillRect(30, 38, 3, 3, "#"); // walkway across the wall top
  // descend one-ways on the right face back to the floor
  set(38, 5, "=");
  set(40, 7, "=");
  set(42, 9, "=");
  set(44, 11, "=");
  set(46, STAND, "C"); // checkpoint #1 (before the fireball bridge)

  // C. Fireball bridge over lava (cols 48-66) --------------------------------
  lava(48, 66);
  fillRect(48, 50, STAND, STAND, "#"); // plat A
  set(51, 11, "!"); // fountain in gap
  fillRect(53, 55, STAND, STAND, "#"); // plat B
  set(56, 11, "!");
  fillRect(58, 60, STAND, STAND, "#"); // plat C
  set(61, 11, "!");
  fillRect(63, 66, STAND, STAND, "#"); // plat D (landing)

  // D. Collapsing-bridge sprint over lava (cols 67-88) -----------------------
  lava(67, 88);
  for (let x = 67; x <= 88; x++) set(x, STAND, "~");
  floor(89, 160); // landing + shaft + gauntlet share the base floor

  // E. Corruption shaft (cols 96-113) ----------------------------------------
  set(92, STAND, "C"); // checkpoint #2 (before the shaft)
  set(104, 9, "="); // one optional high perch mid-shaft
  set(100, 4, "*"); // absorbed Giant: marked falling hand/debris
  set(108, 5, "*");

  // F. Strong Knight + Brute gauntlet (flat floor cols 114-156) --------------
  set(118, STAND, "L"); // absorbed Dealer: disable the glow turret to pass
  set(122, STAND, "B");
  set(128, STAND, "k");
  set(132, 9, "@"); // absorbed Scythebound: rotating three-arm sweep
  set(134, STAND, "s");
  set(138, STAND, "L");
  set(140, STAND, "B");
  set(144, 4, "*"); // absorbed Archer: marked overhead fall
  set(146, STAND, "k");
  set(152, STAND, "k");
  set(156, STAND, "C"); // FINAL checkpoint (before the staircase)

  // G. Long staircase to the throne (cols 158-187) ---------------------------
  for (let i = 0; i < 6; i++) {
    const x0 = 158 + i * 5;
    const top = STAND - 2 * i; // 12,10,8,6,4,2
    fillRect(x0, x0 + 4, top, H - 1, "#");
  }

  // H. Throne (cols 188-199) -------------------------------------------------
  fillRect(188, 199, 2, H - 1, "#"); // throne plateau, top row 2 (stand row 1)
  set(190, 1, "C"); // checkpoint directly outside the throne room
  set(196, 1, "D"); // throne door

  return g.map((r) => r.join("")).join("\n");
}

const DECOR: DecorMark[] = [
  // Chains hanging over the chain-climb wall.
  { kind: "chain", tx: 22, ty: 0 },
  { kind: "chain", tx: 26, ty: 0 },
  { kind: "chain", tx: 30, ty: 0 },
  // Glitching banners flanking the staircase ascent.
  { kind: "banner", tx: 165, ty: 6 },
  { kind: "banner", tx: 175, ty: 4 },
  { kind: "banner", tx: 185, ty: 2 },
  // Demonic statues flanking the throne door.
  { kind: "statue", tx: 189, ty: 0 },
  { kind: "statue", tx: 198, ty: 0 },
];

export const CASTLE: LevelDefinition = {
  id: "castle",
  name: "The Rift Castle",
  theme: "rift",
  bossId: "devil-king",
  music: "castle",
  map: buildMap(),
  introDialogueId: null,
  fragmentDialogueId: null, // the castle has no memory fragment
  corruption: CORRUPTION,
  decor: DECOR,
};
