import { PALETTE } from "./palette";

export interface ParsedGrid {
  w: number;
  h: number;
  px: (string | null)[][]; // palette char or null (transparent)
}

export function parseGrid(rows: string[]): ParsedGrid {
  if (rows.length === 0) throw new Error("empty grid");
  const w = rows[0].length;
  const px: (string | null)[][] = rows.map((row, y) => {
    if (row.length !== w) throw new Error(`ragged grid at row ${y}`);
    return [...row].map((ch, x) => {
      if (ch === ".") return null;
      if (!PALETTE[ch]) throw new Error(`char "${ch}" at ${x},${y} not in palette`);
      return ch;
    });
  });
  return { w, h: rows.length, px };
}

/** Convenience for sprite files: template string → trimmed rows. */
export function frame(str: string): string[] {
  return str
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function mirrorFrame(rows: string[]): string[] {
  return rows.map((r) => [...r].reverse().join(""));
}
