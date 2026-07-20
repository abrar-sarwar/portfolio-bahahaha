import type { LevelDefinition } from "./types";

// The Corrupted Archive (1-4): a sepia library of unfinished stories. Warm
// bookshelf plates (p/P/h), fluttering floating-page platforms (the one-way `=`,
// the `F` fakes, and the `@` rotator arms all render the same page tile), and
// pools of corrupt ink (`^`). Every enemy here is a "shadow" — the scene tints
// spawns 0x333333 and gives them +1 hp for theme "archive" (see spawnEnemies).
// The four verb glyphs of the boss order (see clearly → hold steady → recall →
// begin) are painted into the mid-parallax as a mural clue (art/tiles-archive).
//
// Left→right beats: an intro floor with shadow buglings and a checkpoint; an
// ink pit crossed on `F` page fakes (a shadow bat wheeling above); a mid stretch
// with a shadow slime and a page ledge; a ROTATOR pit (`@` at col 65) whose 3
// arms bridge the gap at rest and carry a rider gracefully through each 90° step
// (checkpoints flank it); a page-step ascent onto a shelf with more shadows; a
// second ink pit on `F` fakes; a second, elevated rotator over solid ground
// (safe to practice a ride); then the fragment (`M`) high on a shelf reached by
// a page staircase; and finally a quiet, enemy-free corridor to the boss door
// (`D`) — the hush before The Blank Page.
//
// Playability self-checked against config.ts jump math (jumpVel 360 / gravity
// 1400 → ~46px apex ≈ 2.9 tiles up, ~4.8-tile flat airtime; dash +51px):
//  - Pit A (ink cols 30-36) is bridged by `F` pages at cols 30/33/36 (≤3-tile
//    hops); fakes collapse 300ms after you stand and respawn after 2s, so keep
//    moving. Pit C (cols 104-109) works the same on pages 104/107/110.
//  - Rotator pit (cols 66-71, empty air): the 3 arms rest to the RIGHT of the
//    pivot (cols 66-68 at row 11) for ~1.55s of every 2s, forming a walkable
//    bridge; the left floor ends at col 65 (a 1-tile hop onto the first arm) and
//    the right floor resumes at col 72. Caught mid-swing you are CARRIED (both
//    axes) down into the pit and back around — never flung off — so a miss costs
//    a lap, not a life. Checkpoints sit at col 62 (before) and col 76 (after).
//  - Every page ascent (cols 88/90 → shelf 92-95; cols 133/135/137 → shelf
//    139-142) steps ≤2 tiles up / ≤2 across — dash never required on the path.
//  - Every non-flying shadow spawn (bugling/slime) stands on solid or one-way
//    ground; the shadow bats hover over the pits by design. Every row is 160.
const ROWS = [
  "................................................................................................................................................................",
  "................................................................................................................................................................",
  "................................................................................................................................................................",
  "................................................................................................................................................................",
  "............................................................................................................................................M...................",
  "...........................................................................................................................................####.................",
  "....................................................................m........................s............m..............................=.####.................",
  ".................................m..........................................................####...........................................####.................",
  "..........................................................................................=.####......................@................=...####.................",
  "........................................................===.................................####..............F............................####.................",
  "..............................F..F..F...................................................=...####........F..F.........................=.....####.................",
  "..P...C...b.........b.....C.................b.......s.........C....@........C.......s.......####..b.C.......................s.....C........####..............D..",
  "##############################^^^^^^^#############################......################################^^^^^^##################################################",
  "##############################^^^^^^^#############################......################################^^^^^^##################################################",
  "##############################^^^^^^^#############################......################################^^^^^^##################################################",
  "##############################^^^^^^^#############################......################################^^^^^^##################################################",
];

export const LEVEL_1_4: LevelDefinition = {
  id: "1-4",
  name: "The Corrupted Archive",
  theme: "archive",
  bossId: "blank-page",
  music: "level-4",
  map: ROWS.join("\n"),
  introDialogueId: "intro-1-4",
  fragmentDialogueId: "frag-1-4",
};
