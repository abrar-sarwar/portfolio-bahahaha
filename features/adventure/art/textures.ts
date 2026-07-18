import type Phaser from "phaser";
import { PALETTE } from "./palette";
import { parseGrid } from "./grid";

export interface SpriteAnim {
  key: string;
  frames: number[];
  frameRate: number;
  repeat: number; // -1 loop, 0 once
}

export interface SpriteDef {
  key: string;
  w: number;
  h: number;
  frames: string[][]; // each entry is rows[] for one frame
  anims?: SpriteAnim[];
}

export function frameKey(key: string, i: number): string {
  return `${key}#${i}`;
}

export function animKey(key: string, anim: string): string {
  return `${key}:${anim}`;
}

export function registerSprites(scene: Phaser.Scene, defs: SpriteDef[]): void {
  for (const def of defs) {
    def.frames.forEach((rows, i) => {
      const tex = frameKey(def.key, i);
      if (scene.textures.exists(tex)) return;
      const g = parseGrid(rows);
      if (g.w !== def.w || g.h !== def.h)
        throw new Error(`${tex}: expected ${def.w}x${def.h}, got ${g.w}x${g.h}`);
      const canvas = scene.textures.createCanvas(tex, g.w, g.h);
      if (!canvas) return;
      const ctx = canvas.getContext();
      g.px.forEach((row, y) =>
        row.forEach((ch, x) => {
          if (!ch) return;
          ctx.fillStyle = PALETTE[ch];
          ctx.fillRect(x, y, 1, 1);
        }),
      );
      canvas.refresh();
    });
    for (const anim of def.anims ?? []) {
      const key = animKey(def.key, anim.key);
      if (scene.anims.exists(key)) continue;
      scene.anims.create({
        key,
        frames: anim.frames.map((i) => ({ key: frameKey(def.key, i) })),
        frameRate: anim.frameRate,
        repeat: anim.repeat,
      });
    }
  }
}
