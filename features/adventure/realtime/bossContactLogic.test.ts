import { describe, expect, it } from "vitest";
import { bossBodyContactOutcome } from "./bossContactLogic";

describe("boss body contact", () => {
  it("never turns ordinary side overlap into invisible damage", () => {
    expect(bossBodyContactOutcome("contact", true)).toBe("safe");
    expect(bossBodyContactOutcome("contact", false)).toBe("safe");
  });

  it("keeps accepted stomps and explicitly rejected stomp danger", () => {
    expect(bossBodyContactOutcome("stomp", true)).toBe("stomp");
    expect(bossBodyContactOutcome("stomp", false)).toBe("damage");
  });
});
