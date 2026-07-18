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

/**
 * The bare texture key a single-frame SpriteDef is ALSO addressable by, or null
 * when aliasing does not apply. registerSprites always rasterizes frames under
 * `key#i`; single-frame defs (tiles, parallax, pickups) additionally get an
 * alias at the plain `key` so callers can `add.image(x, y, def.key)` without the
 * `#0` suffix. Multi-frame (animated) defs return null — a bare key would be
 * ambiguous. Pure contract, unit-tested without a Phaser scene.
 */
export function bareKeyFor(def: SpriteDef): string | null {
  return def.frames.length === 1 ? def.key : null;
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
    // Single-frame defs are also addressable by their bare key (no `#0`), so
    // the scene's tile/parallax references and Task 8 pickups resolve without a
    // suffix. Same parseGrid -> createCanvas -> fill -> refresh flow.
    const bare = bareKeyFor(def);
    if (bare && !scene.textures.exists(bare)) {
      const g = parseGrid(def.frames[0]);
      const canvas = scene.textures.createCanvas(bare, g.w, g.h);
      if (canvas) {
        const ctx = canvas.getContext();
        g.px.forEach((row, y) =>
          row.forEach((ch, x) => {
            if (!ch) return;
            ctx.fillStyle = PALETTE[ch];
            ctx.fillRect(x, y, 1, 1);
          }),
        );
        canvas.refresh();
      }
    }
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
