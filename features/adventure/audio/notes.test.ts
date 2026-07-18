import { describe, it, expect } from "vitest";
import { noteToFreq, stepDurationMs } from "./notes";

describe("notes", () => {
  it("A4 is 440", () => {
    expect(noteToFreq("A4")).toBeCloseTo(440, 1);
  });
  it("C4 is middle C", () => {
    expect(noteToFreq("C4")).toBeCloseTo(261.63, 1);
  });
  it("supports sharps and octaves", () => {
    expect(noteToFreq("F#3")).toBeCloseTo(185.0, 1);
    expect(noteToFreq("C5")).toBeCloseTo(2 * noteToFreq("C4"), 1);
  });
  it("throws on invalid notes", () => {
    expect(() => noteToFreq("H2")).toThrow();
    expect(() => noteToFreq("C")).toThrow();
  });
  it("16th-note step duration from bpm", () => {
    expect(stepDurationMs(120)).toBeCloseTo(125, 5);
  });
});
