import { describe, it, expect } from "vitest";
import { gradeTyping, typingTimeLimitMs, TYPING_DAMAGE_MULT } from "./typing";

describe("gradeTyping", () => {
  it("exact + fast = perfect", () => {
    expect(gradeTyping("scan target", "scan target", 1500, 4000)).toBe("perfect");
  });
  it("exact + slow = good", () => {
    expect(gradeTyping("scan target", "scan target", 3900, 4000)).toBe("good");
  });
  it("half-or-more correct prefix = incomplete", () => {
    expect(gradeTyping("scan target", "scan t", 4000, 4000)).toBe("incomplete");
  });
  it("wrong text = incorrect, never zero damage", () => {
    expect(gradeTyping("scan target", "scam targe", 2000, 4000)).toBe("incorrect");
    expect(TYPING_DAMAGE_MULT.incorrect).toBeGreaterThan(0);
  });
  it("trims and ignores case", () => {
    expect(gradeTyping("scan", " SCAN ", 100, 4000)).toBe("perfect");
  });
  it("focus chips and assist widen the timer, capped at 2 chips", () => {
    expect(typingTimeLimitMs(4000, 1, 1)).toBe(5000);
    expect(typingTimeLimitMs(4000, 5, 1)).toBe(6000);
    expect(typingTimeLimitMs(4000, 0, 1.5)).toBe(6000);
  });
});
