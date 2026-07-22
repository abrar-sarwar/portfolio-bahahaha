import type { SpriteDef } from "../textures";

type Pose =
  | "idle-a" | "idle-b" | "move-a" | "move-b"
  | "slash-prep" | "slash" | "delayed" | "dash" | "air" | "counter"
  | "bow" | "spear" | "spear-spin" | "hammer" | "hammer-slam"
  | "transform" | "hurt" | "defeat";

/**
 * Human-scale final-boss art, deliberately descended from the Rift
 * Swordsman's silhouette: the same hood, high collar, violet eye and pale
 * blade, now opened into a crimson royal mantle and four stolen weapons.
 */
function poseFrame(pose: Pose): string[] {
  const w = 24;
  const h = 40;
  const g = Array.from({ length: h }, () => Array<string>(w).fill("."));
  const px = (x: number, y: number, c: string) => {
    if (x >= 0 && x < w && y >= 0 && y < h) g[y][x] = c;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) px(x, y, c);
  };
  const line = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= steps; i++) {
      px(Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), c);
    }
  };

  const airborne = pose === "air";
  const defeated = pose === "defeat";
  const lean = pose === "dash" ? 2 : pose === "move-b" ? -1 : 0;
  const lift = airborne ? -3 : defeated ? 5 : 0;

  if (!defeated) {
    // Hood, hidden face and the swordsman's single rift eye.
    rect(9 + lean, 2 + lift, 14 + lean, 3 + lift, "k");
    rect(7 + lean, 4 + lift, 16 + lean, 9 + lift, "K");
    rect(9 + lean, 6 + lift, 14 + lean, 8 + lift, "O");
    px(13 + lean, 7 + lift, pose === "transform" ? "R" : "V");
    // Crown-like collar and split royal cloak.
    px(6 + lean, 9 + lift, "v"); px(17 + lean, 9 + lift, "v");
    px(5 + lean, 10 + lift, "R"); px(18 + lean, 10 + lift, "R");
    rect(6 + lean, 11 + lift, 17 + lean, 14 + lift, "K");
    rect(5 + lean, 15 + lift, 18 + lean, 27 + lift, "k");
    rect(8 + lean, 14 + lift, 15 + lean, 25 + lift, "K");
    for (let y = 14; y <= 28; y++) {
      px(4 + lean, y + lift, y % 3 === 0 ? "R" : "r");
      px(19 + lean, y + lift, y % 3 === 0 ? "R" : "r");
    }

    const strideA = pose === "move-a" || pose === "dash";
    const strideB = pose === "move-b";
    rect(8 + lean, 26 + lift, 10 + lean, 34 + lift, "K");
    rect(13 + lean, 26 + lift, 15 + lean, 34 + lift, "K");
    rect((strideA ? 6 : 8) + lean, 35 + lift, 10 + lean, 36 + lift, "O");
    rect(13 + lean, 35 + lift, (strideB ? 17 : 15) + lean, 36 + lift, "O");
  } else {
    // The final kneel: mantle pooled around him, sword point in the floor.
    rect(8, 10, 15, 15, "K");
    rect(9, 12, 14, 14, "O"); px(13, 13, "V");
    rect(6, 16, 17, 27, "k");
    rect(4, 27, 19, 34, "r");
    line(13, 20, 13, 38, "C"); px(13, 39, "W");
  }

  // Weapon silhouettes make every arsenal form readable before hit geometry.
  if (pose === "slash" || pose === "dash") {
    line(2, 17 + lift, 22, 17 + lift, "C"); px(22, 17 + lift, "W");
    rect(6 + lean, 18 + lift, 8 + lean, 19 + lift, "Y");
  } else if (pose === "slash-prep") {
    line(7, 20 + lift, 18, 5 + lift, "C"); px(19, 4 + lift, "W");
  } else if (pose === "delayed" || pose === "counter") {
    line(5, 27 + lift, 18, 9 + lift, pose === "counter" ? "Y" : "C");
    if (pose === "counter") for (const [x, y] of [[3, 7], [20, 9], [2, 21], [21, 25]] as const) px(x, y, "Y");
  } else if (pose === "air") {
    line(4, 25 + lift, 20, 8 + lift, "C"); px(21, 7 + lift, "W");
  } else if (pose === "bow") {
    for (let y = 7; y <= 27; y++) px(20, y + lift, y === 7 || y === 27 ? "Y" : "P");
    line(20, 7 + lift, 16, 17 + lift, "C"); line(16, 17 + lift, 20, 27 + lift, "C");
    line(10, 17 + lift, 23, 17 + lift, "j");
  } else if (pose === "spear" || pose === "spear-spin") {
    if (pose === "spear-spin") {
      line(1, 10 + lift, 22, 29 + lift, "Y"); line(1, 29 + lift, 22, 10 + lift, "C");
    } else {
      line(2, 25 + lift, 22, 7 + lift, "C"); px(23, 6 + lift, "j");
    }
  } else if (pose === "hammer" || pose === "hammer-slam") {
    const hx = pose === "hammer-slam" ? 19 : 4;
    const hy = pose === "hammer-slam" ? 30 : 7;
    line(9, 21 + lift, hx, hy + lift, "P");
    rect(hx - 3, hy - 2 + lift, hx + 3, hy + 2 + lift, "D");
    rect(hx - 2, hy - 1 + lift, hx + 2, hy + 1 + lift, "R");
  } else if (!defeated) {
    line(16 + lean, 28 + lift, 19 + lean, 13 + lift, "C"); px(19 + lean, 12 + lift, "W");
  }

  if (pose === "transform") {
    for (const [x, y] of [[2, 5], [21, 6], [1, 17], [22, 19], [3, 31], [20, 33], [11, 0], [12, 38]] as const) px(x, y, "R");
  }
  if (pose === "hurt") {
    px(5, 16, "W"); px(18, 19, "W"); px(10, 24, "R");
  }

  return g.map((row) => row.join(""));
}

const POSES: Pose[] = [
  "idle-a", "idle-b", "move-a", "move-b", "slash-prep", "slash",
  "delayed", "dash", "air", "counter", "bow", "spear", "spear-spin",
  "hammer", "hammer-slam", "transform", "hurt", "defeat",
];

export const DEVIL_KING_SPRITE: SpriteDef = {
  key: "devil-king",
  w: 24,
  h: 40,
  frames: POSES.map(poseFrame),
  anims: [
    { key: "idle", frames: [0, 1], frameRate: 3, repeat: -1 },
    { key: "move", frames: [2, 3], frameRate: 8, repeat: -1 },
    { key: "slash-prep", frames: [4], frameRate: 1, repeat: 0 },
    { key: "slash", frames: [5], frameRate: 1, repeat: 0 },
    { key: "delayed", frames: [6], frameRate: 1, repeat: 0 },
    { key: "dash", frames: [7, 5], frameRate: 12, repeat: 0 },
    { key: "air", frames: [8], frameRate: 1, repeat: 0 },
    { key: "counter", frames: [9], frameRate: 1, repeat: 0 },
    { key: "bow", frames: [10], frameRate: 1, repeat: 0 },
    { key: "spear", frames: [11], frameRate: 1, repeat: 0 },
    { key: "spear-spin", frames: [12, 11], frameRate: 10, repeat: -1 },
    { key: "hammer", frames: [13], frameRate: 1, repeat: 0 },
    { key: "hammer-slam", frames: [14], frameRate: 1, repeat: 0 },
    { key: "transform", frames: [0, 15, 15], frameRate: 5, repeat: 0 },
    { key: "hurt", frames: [16], frameRate: 1, repeat: 0 },
    { key: "defeat", frames: [17], frameRate: 1, repeat: 0 },
  ],
};
