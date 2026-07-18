import { describe, it, expect } from "vitest";
import { rollDrop } from "./drops";

describe("rollDrop", () => {
  it("bugling: heart at low roll, attack-byte mid, null high", () => {
    expect(rollDrop("bugling", 0.1)).toBe("heart");
    expect(rollDrop("bugling", 0.55)).toBe("attack-byte");
    expect(rollDrop("bugling", 0.9)).toBeNull();
  });
  it("phishling favors focus-chip then firewall-layer", () => {
    expect(rollDrop("phishling", 0.3)).toBe("focus-chip");
    expect(rollDrop("phishling", 0.7)).toBe("firewall-layer");
    expect(rollDrop("phishling", 0.95)).toBeNull();
  });
  it("all kinds return only legal drops across the range", () => {
    const kinds = ["bugling","phishling","malware-bat","brute","firewall-knight","rootkit-slime"] as const;
    for (const k of kinds)
      for (let r = 0; r < 1; r += 0.05)
        expect([null,"heart","attack-byte","firewall-layer","focus-chip","parry-module",
                "recovery-packet","root-access","exploit-insight","cache-boost"]).toContain(rollDrop(k, r));
  });
});
