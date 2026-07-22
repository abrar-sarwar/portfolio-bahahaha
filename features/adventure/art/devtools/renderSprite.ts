/**
 * Contact-sheet renderer for code-authored pixel sprites.
 *
 * Usage:
 *   npx vite-node features/adventure/art/devtools/renderSprite.ts -- devil-king
 *   npx vite-node features/adventure/art/devtools/renderSprite.ts -- all
 *
 * Writes PPM pixels, converts them with macOS `sips`, and keeps only PNGs in
 * `.artifacts/sprites/` for visual review. No canvas/browser dependency.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { BOSSES2_SPRITES } from "../sprites/bosses2";
import { PALETTE } from "../palette";
import type { SpriteDef } from "../textures";

const SCALE = 6;
const GAP = 4;
const COLUMNS = 6;
const BG = [5, 5, 7] as const;

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function render(def: SpriteDef, outDir: string): string {
  const cols = Math.min(COLUMNS, def.frames.length);
  const rows = Math.ceil(def.frames.length / cols);
  const cellW = def.w + GAP * 2;
  const cellH = def.h + GAP * 2;
  const rawW = cols * cellW;
  const rawH = rows * cellH;
  const width = rawW * SCALE;
  const height = rawH * SCALE;
  const pixels = new Uint8Array(width * height * 3);

  for (let p = 0; p < pixels.length; p += 3) {
    pixels[p] = BG[0]; pixels[p + 1] = BG[1]; pixels[p + 2] = BG[2];
  }

  const put = (rawX: number, rawY: number, color: readonly [number, number, number]) => {
    for (let sy = 0; sy < SCALE; sy++) {
      for (let sx = 0; sx < SCALE; sx++) {
        const x = rawX * SCALE + sx;
        const y = rawY * SCALE + sy;
        const offset = (y * width + x) * 3;
        pixels[offset] = color[0]; pixels[offset + 1] = color[1]; pixels[offset + 2] = color[2];
      }
    }
  };

  def.frames.forEach((frame, index) => {
    const cellX = (index % cols) * cellW;
    const cellY = Math.floor(index / cols) * cellH;
    frame.forEach((row, y) => {
      [...row].forEach((char, x) => {
        if (char === ".") return;
        const hex = PALETTE[char];
        if (!hex) throw new Error(`${def.key} frame ${index}: unknown palette char ${char}`);
        put(cellX + GAP + x, cellY + GAP + y, rgb(hex));
      });
    });
  });

  const ppm = resolve(outDir, `${def.key}.ppm`);
  const png = resolve(outDir, `${def.key}.png`);
  const header = new TextEncoder().encode(`P6\n${width} ${height}\n255\n`);
  const contents = new Uint8Array(header.length + pixels.length);
  contents.set(header);
  contents.set(pixels, header.length);
  writeFileSync(ppm, contents);
  execFileSync("sips", ["-s", "format", "png", ppm, "--out", png], { stdio: "ignore" });
  unlinkSync(ppm);
  return png;
}

const requested = process.argv[2] ?? "all";
const defs = requested === "all"
  ? BOSSES2_SPRITES.filter((def) => def.key !== "training-dummy")
  : BOSSES2_SPRITES.filter((def) => def.key === requested);
if (defs.length === 0) throw new Error(`unknown bosses2 sprite: ${requested}`);

const outDir = resolve(process.cwd(), ".artifacts", "sprites");
mkdirSync(outDir, { recursive: true });
for (const def of defs) process.stdout.write(`${render(def, outDir)}\n`);
