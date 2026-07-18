import { describe, it, expect } from "vitest";
import { resolveParry, markerPosition, resolveMarker, scaleQte } from "./timedEvents";

describe("timed events", () => {
  it("parry inside window = normal, near impact = perfect, outside = miss", () => {
    expect(resolveParry(1000 - 150, 1000, 220, 90)).toBe("normal");
    expect(resolveParry(1000 - 50, 1000, 220, 90)).toBe("perfect");
    expect(resolveParry(1000 - 400, 1000, 220, 90)).toBe("miss");
    expect(resolveParry(1010, 1000, 220, 90)).toBe("miss"); // late = whiff
    expect(resolveParry(null, 1000, 220, 90)).toBe("miss");
  });
  it("marker ping-pongs 0..1 and resolves inside target", () => {
    expect(markerPosition(0, 1000)).toBe(0);
    expect(markerPosition(500, 1000)).toBe(0.5);
    expect(markerPosition(1500, 1000)).toBe(0.5); // bounced back
    const spec = { kind: "marker", travelMs: 1000, targetStart: 0.4, targetEnd: 0.6 } as const;
    expect(resolveMarker(500, spec)).toBe(true);
    expect(resolveMarker(100, spec)).toBe(false);
    expect(resolveMarker(null, spec)).toBe(false);
  });
  it("scaleQte widens windows", () => {
    expect(scaleQte({ kind: "parry", windowMs: 200 }, 1.5)).toEqual({ kind: "parry", windowMs: 300 });
    const c = scaleQte({ kind: "choice", promptText: "?", options: ["a"], correctIndex: 0, timeLimitMs: 2000 }, 1.25);
    expect(c.kind === "choice" && c.timeLimitMs).toBe(2500);
  });
});
