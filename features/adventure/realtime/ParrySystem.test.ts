import { describe, it, expect } from "vitest";
import {
  effectiveParryWindowMs,
  parryBounds,
  judgeParry,
  PARRY_LATE_GRACE_MS,
} from "./ParrySystem";
import { RT_PLAYER } from "./config";

// A parryable attack becomes active at t = 1000ms; base window 200ms.
const timing = { activeStartMs: 1000, parryWindowMs: 200 };

describe("effectiveParryWindowMs", () => {
  it("is the base window with no scaling", () => {
    expect(effectiveParryWindowMs(200)).toBe(200);
  });
  it("widerParry multiplies the window ×1.3", () => {
    expect(effectiveParryWindowMs(200, { widerParry: true })).toBeCloseTo(260);
  });
  it("assist multiplies the window ×1.25", () => {
    expect(effectiveParryWindowMs(200, { assist: true })).toBeCloseTo(250);
  });
  it("widerParry and assist stack multiplicatively", () => {
    expect(effectiveParryWindowMs(200, { widerParry: true, assist: true })).toBeCloseTo(325);
  });
});

describe("parryBounds", () => {
  it("opens parryWindowMs before active-start and closes at active-start + late grace", () => {
    const b = parryBounds(timing);
    expect(b.start).toBe(800);
    expect(b.end).toBe(1000 + PARRY_LATE_GRACE_MS);
  });
  it("only the pre-window scales; the late grace is fixed", () => {
    const b = parryBounds(timing, { widerParry: true });
    expect(b.start).toBeCloseTo(1000 - 260);
    expect(b.end).toBe(1040);
  });
});

describe("judgeParry", () => {
  it("succeeds inside the window and reports the offset from active-start", () => {
    const r = judgeParry(950, timing);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.offsetMs).toBe(-50);
  });

  it("succeeds on the exact open and close boundaries (inclusive)", () => {
    expect(judgeParry(800, timing).ok).toBe(true); // exact open
    expect(judgeParry(1040, timing).ok).toBe(true); // exact close (active + 40)
  });

  it("fails just before the window opens, carrying the fail-vulnerable time", () => {
    const r = judgeParry(799, timing);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.vulnerableMs).toBe(RT_PLAYER.parryFailVulnerableMs);
  });

  it("fails just after the late grace closes", () => {
    expect(judgeParry(1041, timing).ok).toBe(false);
  });

  it("widerParry lets an otherwise-early press land", () => {
    expect(judgeParry(790, timing).ok).toBe(false);
    expect(judgeParry(790, timing, { scaling: { widerParry: true } }).ok).toBe(true);
  });

  it("honours a custom fail-vulnerable duration", () => {
    const r = judgeParry(0, timing, { failVulnerableMs: 999 });
    if (!r.ok) expect(r.vulnerableMs).toBe(999);
  });
});
