import { describe, expect, it } from "vitest";
import { parseGrid } from "../grid";
import { ENDING_SPRITES } from "./ending";

describe("ending sprite integrity", () => {
  for (const def of ENDING_SPRITES) {
    it(`${def.key} frames match their declared size`, () => {
      for (const rows of def.frames) {
        const parsed = parseGrid(rows);
        expect({ w: parsed.w, h: parsed.h }).toEqual({ w: def.w, h: def.h });
      }
    });
  }
});
