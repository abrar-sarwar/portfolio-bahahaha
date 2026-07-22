import type { SpriteDef } from "../textures";

type Pose = "idle-a" | "idle-b" | "walk-a" | "walk-b" | "draw" | "slash" | "absorb" | "transform" | "run-a" | "run-b";

// Original 20×34 cloaked swordsman. Building the silhouettes with pixel
// primitives keeps every frame code-generated while making the shared visual
// DNA (dark crown collar, long pale blade, violet-to-crimson absorbed energy)
// easy to carry into the human-scale Devil King sprite later.
function poseFrame(pose: Pose): string[] {
  const w = 20;
  const h = 34;
  const g = Array.from({ length: h }, () => Array<string>(w).fill("."));
  const px = (x: number, y: number, c: string) => {
    if (x >= 0 && x < w && y >= 0 && y < h) g[y][x] = c;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) px(x, y, c);
  };

  const lean = pose === "run-a" || pose === "run-b" ? 1 : pose === "walk-b" ? -1 : 0;
  // hood + hidden face / single energy eye
  rect(7 + lean, 2, 12 + lean, 3, "k");
  rect(6 + lean, 4, 13 + lean, 8, "K");
  rect(7 + lean, 5, 12 + lean, 7, "O");
  px(11 + lean, 6, pose === "transform" ? "R" : "V");
  // high royal collar and layered cloak
  px(5 + lean, 8, "v"); px(14 + lean, 8, "v");
  rect(5 + lean, 9, 14 + lean, 11, "K");
  rect(4 + lean, 12, 15 + lean, 22, "k");
  rect(6 + lean, 12, 13 + lean, 20, "K");
  for (let y = 15; y <= 25; y++) {
    px(3 + lean, y, "v");
    px(16 + lean, y, "v");
  }
  // legs vary for walk/run readability
  const leftFoot = pose === "walk-a" || pose === "run-a" ? 5 : 7;
  const rightFoot = pose === "walk-b" || pose === "run-b" ? 14 : 12;
  rect(6 + lean, 22, 8 + lean, 29, "K");
  rect(11 + lean, 22, 13 + lean, 29, "K");
  rect(leftFoot + lean, 30, 8 + lean, 31, "O");
  rect(11 + lean, 30, rightFoot + lean, 31, "O");

  // sword poses: sheathed/raised/drawn/horizontal slash.
  if (pose === "slash") {
    for (let x = 1; x <= 18; x++) px(x, 14, x > 14 ? "W" : "C");
    px(5, 15, "Y"); px(6, 15, "Y");
  } else if (pose === "draw") {
    for (let i = 0; i < 12; i++) px(10 + Math.floor(i / 3), 15 - i, i > 8 ? "W" : "C");
    px(9, 16, "Y");
  } else {
    for (let i = 0; i < 14; i++) px(14 + lean - Math.floor(i / 5), 24 - i, i > 10 ? "W" : "C");
    px(13 + lean, 25, "Y");
  }

  if (pose === "absorb" || pose === "transform") {
    const energy = pose === "transform" ? "R" : "V";
    for (const [x, y] of [[2, 5], [17, 7], [1, 15], [18, 17], [3, 26], [16, 28], [9, 0], [11, 32]] as const) {
      px(x, y, energy);
    }
    rect(8 + lean, 10, 11 + lean, 12, energy);
  }

  return g.map((row) => row.join(""));
}

const POSES: Pose[] = ["idle-a", "idle-b", "walk-a", "walk-b", "draw", "slash", "absorb", "transform", "run-a", "run-b"];

export const RIFT_SWORDSMAN_SPRITE: SpriteDef = {
  key: "rift-swordsman",
  w: 20,
  h: 34,
  frames: POSES.map(poseFrame),
  anims: [
    { key: "idle", frames: [0, 1], frameRate: 3, repeat: -1 },
    { key: "walk", frames: [2, 3], frameRate: 7, repeat: -1 },
    { key: "draw", frames: [4], frameRate: 1, repeat: 0 },
    { key: "slash", frames: [5], frameRate: 1, repeat: 0 },
    { key: "absorb", frames: [6, 7], frameRate: 5, repeat: 0 },
    { key: "transform", frames: [7], frameRate: 1, repeat: 0 },
    { key: "run", frames: [8, 9], frameRate: 12, repeat: -1 },
  ],
};
