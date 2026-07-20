import { describe, it, expect } from "vitest";
import { charsVisible, TYPEWRITER_CPS } from "./typewriter";

describe("TYPEWRITER_CPS", () => {
  it("is 30 chars/sec per spec", () => {
    expect(TYPEWRITER_CPS).toBe(30);
  });
});

describe("charsVisible", () => {
  it("shows nothing at elapsed 0", () => {
    expect(charsVisible(0, 30, "hello")).toBe(0);
  });

  it("shows nothing for negative elapsed (clock skew guard)", () => {
    expect(charsVisible(-50, 30, "hello")).toBe(0);
  });

  it("reveals characters proportional to elapsed time at the given cps", () => {
    // 30 cps -> 1 char per ~33.3ms
    expect(charsVisible(100, 30, "hello world")).toBe(3); // floor(0.1 * 30) = 3
    expect(charsVisible(500, 30, "0123456789012345")).toBe(15); // floor(0.5*30)=15
  });

  it("clamps to the full text length once elapsed exceeds the reveal time", () => {
    expect(charsVisible(10_000, 30, "hi")).toBe(2);
  });

  it("returns 0 for empty text regardless of elapsed", () => {
    expect(charsVisible(1000, 30, "")).toBe(0);
  });

  it("respects a different cps", () => {
    expect(charsVisible(1000, 10, "abcdefghij")).toBe(10);
    expect(charsVisible(500, 10, "abcdefghij")).toBe(5);
  });
});
