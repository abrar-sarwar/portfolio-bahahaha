import { describe, it, expect } from "vitest";
import { assistLevelFor, assistTimeScale, assistStartHeal, assistShowsHint } from "./assist";

describe("assistLevelFor", () => {
  it("maps death counts to assist levels at each boundary", () => {
    expect(assistLevelFor(0)).toBe(0);
    expect(assistLevelFor(1)).toBe(0);
    expect(assistLevelFor(2)).toBe(1);
    expect(assistLevelFor(3)).toBe(1);
    expect(assistLevelFor(4)).toBe(2);
    expect(assistLevelFor(5)).toBe(2);
    expect(assistLevelFor(6)).toBe(3);
    expect(assistLevelFor(9)).toBe(3);
  });
});

describe("assistTimeScale", () => {
  it("widens time windows at higher assist levels", () => {
    expect(assistTimeScale(0)).toBe(1);
    expect(assistTimeScale(1)).toBe(1.25);
    expect(assistTimeScale(2)).toBe(1.5);
    expect(assistTimeScale(3)).toBe(1.75);
  });
});

describe("assistStartHeal", () => {
  it("grants a starting heal only from level 2 up", () => {
    expect(assistStartHeal(0)).toBe(0);
    expect(assistStartHeal(1)).toBe(0);
    expect(assistStartHeal(2)).toBe(2);
    expect(assistStartHeal(3)).toBe(2);
  });
});

describe("assistShowsHint", () => {
  it("only shows a hint at the highest assist level (3)", () => {
    expect(assistShowsHint(0)).toBe(false);
    expect(assistShowsHint(1)).toBe(false);
    expect(assistShowsHint(2)).toBe(false);
    expect(assistShowsHint(3)).toBe(true);
  });
});
