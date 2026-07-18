import { describe, it, expect } from "vitest";
import {
  resolvePlayerContact,
  applyRestompWindow,
  phishlingNext,
  RESTOMP_WINDOW_MS,
  type PhishlingInputs,
} from "./enemyLogic";

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

describe("applyRestompWindow", () => {
  // Fix 4: same-frame double-contact after a stomp (stacked enemies) should
  // chain-stomp rather than stomp+hurt in one frame.
  it("leaves an already-resolved stomp alone", () => {
    expect(applyRestompWindow("stomp", true, 1000, 950)).toBe("stomp");
  });

  it("upgrades damage -> stomp when inside the restomp window against a stompable enemy", () => {
    expect(applyRestompWindow("damage", true, 1000, 950)).toBe("stomp"); // 50ms < 60ms window
  });

  it("leaves damage alone once the restomp window has elapsed", () => {
    expect(applyRestompWindow("damage", true, 1010, 950)).toBe("damage"); // 60ms, not < 60
  });

  it("leaves damage alone against a non-stompable enemy even inside the window", () => {
    expect(applyRestompWindow("damage", false, 1000, 950)).toBe("damage");
  });

  it("leaves damage alone when there was no recent stomp", () => {
    expect(applyRestompWindow("damage", true, 1000, -Infinity)).toBe("damage");
  });

  it("exposes the restomp window constant as 60ms", () => {
    expect(RESTOMP_WINDOW_MS).toBe(60);
  });
});

describe("phishlingNext", () => {
  const base: PhishlingInputs = {
    dist: 999,
    revealed: false,
    cooldownOver: false,
    analyzed: false,
    stunOver: false,
  };

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

  it("exposed stays exposed-stunned while the stun timer is still running", () => {
    expect(phishlingNext("exposed", { ...base, dist: 5, cooldownOver: true, stunOver: false })).toBe(
      "exposed",
    );
  });

  it("exposed transitions to a normal revealed hostile once the stun expires", () => {
    expect(phishlingNext("exposed", { ...base, dist: 5, stunOver: true })).toBe("revealed");
  });

  it("a stun-expired phishling lunges like a normally-revealed one (same downstream cycle)", () => {
    // exposed -> revealed (stun over), then revealed -> lunging exactly like the
    // ordinary disguised -> revealed -> lunging path once its own timers finish.
    const revealed = phishlingNext("exposed", { ...base, stunOver: true });
    expect(revealed).toBe("revealed");
    expect(phishlingNext(revealed, { ...base, revealed: true, cooldownOver: true })).toBe("lunging");
  });
});
