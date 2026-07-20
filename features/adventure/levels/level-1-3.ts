import type { LevelDefinition } from "./types";

// Firewall Factory (1-3): an industrial foundry of steel plates and molten
// metal. Left→right beats: a conveyor gauntlet over molten (belts `>`/`<` ride
// over a lava floor with 2-tile gaps), a timed-gate lock (`G`), a knight-guarded
// one-way ascent bridging a molten pit, a laser hall (`L`) where the 1-1 dash
// shines, a second gate lock, a checkpoint before a Brute double-charge arena
// (end-cap walls the brutes bounce off to self-stun), then the fortress: a
// memory fragment (`M`) behind a disable-able laser and the boss door (`D`) at
// the gate. Molten uses the shared `^` hazard.
//
// Playability self-checked against config.ts jump math (jumpVel 360 / gravity
// 1400 → ~46px apex ≈ 2.9 tiles up, ~4.8-tile flat airtime; dash +51px):
//  - Conveyor gauntlet: belts are 6 tiles wide, gaps are 2 tiles of molten —
//    a 2-tile jump clears them even into a left-pushing belt (moveSpeed 150 >
//    conveyor 60, so the player always out-muscles the belt). A right belt at
//    takeoff only lengthens the hop.
//  - Molten pit (cols 63-76, 14 tiles, uncrossable in one jump) is bridged by
//    one-way steps at rows 10/8/10: floor(62)→P1(63,r10) 1up, P1→P2(68,r8) 2up
//    2across, P2→P3(73,r10) 2down, P3→floor(77) — every hop ≤2 tiles vertical /
//    ≤2 horizontal. Dash NOT required anywhere on the critical path.
//  - Gates cap their corridors with a solid ceiling (rows 8-9) so you can't jump
//    over; the 1.6s open window >> the ~0.3s to cross a 1-tile gap.
//  - Laser hall: 1.2s on / 0.8s off; emitters 7-8 tiles apart — walkable by
//    timing, faster by dashing (the whole point). Every emitter is floor-level
//    and attackable to knock it out for 4s.
//  - Brute arena: 2-tile end-caps the player hops in/out of, but brutes (no
//    jump) charge into them and stun — the intended bait. Checkpoint sits at the
//    entrance (col 119) so a death re-drops you at the arena mouth.
//  - Fragment: reachable by disabling the guard laser (attack the emitter) OR
//    timing its off-window — no dash needed. Every non-flying spawn stands on
//    solid/one-way ground. Every row is exactly 180 chars.
const ROWS = [
  "....................................................................................................................................................................................",
  "....................................................................................................................................................................................",
  "....................................................................................................................................................................................",
  "................................................................................#########################...........................................................................",
  "................................................................................#########################...........................................................................",
  "....................................................................................................................................................................................",
  "....................................................................................................................................................................................",
  ".....................................................................k..............................................................................................................",
  "..............................................#####.................====....................................#####...................................................................",
  "..............................................#####.........................................................#####...................................................................",
  "................................................G..............====......====.................................G...........#..........................#..............................",
  "..P...C...s................................C............k.....................s......L.......L......L.............k....C..#.......B..........B.......#......s...........L..M.....D..",
  "#################>>>>>>^^<<<<<<^^>>>>>>^^######################^^^^^^^^^^^^^^#######################################################################################################",
  "#################^^^^^^^^^^^^^^^^^^^^^^^^######################^^^^^^^^^^^^^^#######################################################################################################",
  "#################^^^^^^^^^^^^^^^^^^^^^^^^######################^^^^^^^^^^^^^^#######################################################################################################",
  "#################^^^^^^^^^^^^^^^^^^^^^^^^######################^^^^^^^^^^^^^^#######################################################################################################",
];

export const LEVEL_1_3: LevelDefinition = {
  id: "1-3",
  name: "Firewall Factory",
  theme: "factory",
  bossId: "warden",
  music: "level-3",
  map: ROWS.join("\n"),
  introDialogueId: "intro-1-3",
  fragmentDialogueId: "frag-1-3",
};
