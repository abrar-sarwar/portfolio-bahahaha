import { describe, it, expect } from "vitest";
import { TRACKS } from "./tracks";
import { noteToFreq } from "./notes";
import type { TrackId } from "../ids";

// The complete set of TrackIds this game ships. Kept in sync with ids.ts.
const ALL_IDS: TrackId[] = [
  "title", "overworld", "level-1", "level-2", "level-3", "level-4",
  "boss", "castle", "devil-1", "devil-2", "devil-3", "victory", "chest",
  // real-time rework boss themes (placeholders until their boss tasks author them)
  "broken-king", "hollow-giant", "one-eyed-dealer", "scythebound",
  "veiled-archer", "devil-duel", "devil-arsenal",
];

describe("TRACKS integrity", () => {
  it("covers exactly the TrackIds in ids.ts (no missing, no extras)", () => {
    expect(Object.keys(TRACKS).sort()).toEqual([...ALL_IDS].sort());
  });

  for (const id of ALL_IDS) {
    describe(`track: ${id}`, () => {
      const t = TRACKS[id];

      it("all four voices share one length; length >= 64 and a multiple of 16", () => {
        const len = t.sq1.length;
        expect(len).toBeGreaterThanOrEqual(64);
        expect(len % 16).toBe(0);
        expect(t.sq2.length).toBe(len);
        expect(t.tri.length).toBe(len);
        expect(t.noise.length).toBe(len);
      });

      it("every pitched step in sq1/sq2/tri parses to a finite frequency", () => {
        for (const voice of [t.sq1, t.sq2, t.tri]) {
          for (const step of voice) {
            if (step === null || step === "—") continue;
            expect(() => noteToFreq(step)).not.toThrow();
            expect(Number.isFinite(noteToFreq(step))).toBe(true);
          }
        }
      });

      it("noise entries are all in {0,1,2,null}", () => {
        for (const n of t.noise) {
          expect([0, 1, 2, null]).toContain(n);
        }
      });

      it("has a positive bpm and a boolean loop flag", () => {
        expect(t.bpm).toBeGreaterThan(0);
        expect(typeof t.loop).toBe("boolean");
      });
    });
  }
});
