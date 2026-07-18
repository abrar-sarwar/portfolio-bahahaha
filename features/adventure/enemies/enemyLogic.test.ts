import { describe, it, expect } from "vitest";
import { resolvePlayerContact, phishlingNext, type PhishlingInputs } from "./enemyLogic";

describe("resolvePlayerContact", () => {
  it("stomps when falling onto a stompable enemy from above the 6px lip", () => {
    expect(resolvePlayerContact(120, 90, 100, true)).toBe("stomp"); // playerY 90 < 100-6
  });

  it("is contact damage at exactly the -6 offset (strict boundary)", () => {
    // playerY === enemyY - 6 is NOT above enough -> damage.
    expect(resolvePlayerContact(120, 94, 100, true)).toBe("damage");
  });

  it("is contact damage when rising into the enemy even if above it", () => {
    expect(resolvePlayerContact(-120, 90, 100, true)).toBe("damage");
  });

  it("is contact damage when standing still (vy === 0)", () => {
    expect(resolvePlayerContact(0, 90, 100, true)).toBe("damage");
  });

  it("never stomps a non-stompable enemy, even falling from above", () => {
    expect(resolvePlayerContact(120, 90, 100, false)).toBe("damage");
  });
});

describe("phishlingNext", () => {
  const base: PhishlingInputs = { dist: 999, revealed: false, cooldownOver: false, analyzed: false };

  it("disguised + analyze -> exposed (exploit)", () => {
    expect(phishlingNext("disguised", { ...base, analyzed: true })).toBe("exposed");
    // analyze wins even when the player is also in reveal range
    expect(phishlingNext("disguised", { ...base, dist: 10, analyzed: true })).toBe("exposed");
  });

  it("disguised reveals when the player closes within 40px", () => {
    expect(phishlingNext("disguised", { ...base, dist: 39 })).toBe("revealed");
    expect(phishlingNext("disguised", { ...base, dist: 40 })).toBe("disguised"); // boundary: still hidden
    expect(phishlingNext("disguised", { ...base, dist: 80 })).toBe("disguised");
  });

  it("revealed lunges only after the reveal anim AND cooldown finish", () => {
    expect(phishlingNext("revealed", { ...base, revealed: true, cooldownOver: true })).toBe("lunging");
    expect(phishlingNext("revealed", { ...base, revealed: true, cooldownOver: false })).toBe("revealed");
    expect(phishlingNext("revealed", { ...base, revealed: false, cooldownOver: true })).toBe("revealed");
  });

  it("lunging returns to a revealed hover once the lunge is over", () => {
    expect(phishlingNext("lunging", { ...base, cooldownOver: true })).toBe("revealed");
    expect(phishlingNext("lunging", { ...base, cooldownOver: false })).toBe("lunging");
  });

  it("exposed is terminal (stays defanged)", () => {
    expect(phishlingNext("exposed", { ...base, dist: 5, cooldownOver: true })).toBe("exposed");
  });
});
