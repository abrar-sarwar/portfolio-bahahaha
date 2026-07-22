import { describe, expect, it } from "vitest";
import { shouldPuntDealerMask } from "./oneEyedDealer";

describe("One-Eyed Dealer mask punt", () => {
  it("only allows one punt until the Dealer recovers the mask", () => {
    expect(shouldPuntDealerMask(false, 20, false)).toBe(true);
    expect(shouldPuntDealerMask(false, 50, true)).toBe(true);
    expect(shouldPuntDealerMask(false, 50, false)).toBe(false);
    expect(shouldPuntDealerMask(true, 20, true)).toBe(false);
  });
});
