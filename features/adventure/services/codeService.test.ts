import { describe, expect, it } from "vitest";
import { codeService } from "./codeService";

describe("codeService", () => {
  it("returns the swappable development unlock code", async () => {
    await expect(codeService.getUnlockCode()).resolves.toBe("INK-7F2A");
  });

  it("validates case-insensitively with surrounding whitespace", async () => {
    await expect(codeService.validate(" ink-7f2a ")).resolves.toBe(true);
    await expect(codeService.validate("INK-0000")).resolves.toBe(false);
  });
});
