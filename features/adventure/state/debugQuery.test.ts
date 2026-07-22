import { describe, expect, it } from "vitest";
import { debugLevelFrom, isDebugEnabled } from "./debugQuery";

describe("debug query gating", () => {
  it("only enables debug tools for the exact ?debug=1 flag", () => {
    expect(isDebugEnabled(new URLSearchParams("debug=1"))).toBe(true);
    expect(isDebugEnabled(new URLSearchParams("debug=0"))).toBe(false);
    expect(isDebugEnabled(new URLSearchParams("debug"))).toBe(false);
  });

  it("rejects level shortcuts unless debug mode is enabled", () => {
    expect(debugLevelFrom(new URLSearchParams("level=1-4"))).toBeNull();
    expect(debugLevelFrom(new URLSearchParams("debug=1&level=1-4"))).toBe("1-4");
    expect(debugLevelFrom(new URLSearchParams("debug=1&level=not-a-level"))).toBeNull();
  });
});
