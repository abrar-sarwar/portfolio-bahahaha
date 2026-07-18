import { describe, it, expect } from "vitest";
import { applyItem, COMBAT_USABLE } from "./buffs";
import type { ActiveEffects, PlayerCombat } from "./types";
import type { BuffId } from "../ids";

function makeFx(overrides: Partial<ActiveEffects> = {}): ActiveEffects {
  return {
    attackBonus: 0, firewallLayers: 0, focusChips: 0, parryModules: 0,
    exploitInsight: false, defending: false, stance: false, analyzed: false,
    rootAccessCharges: 0,
    ...overrides,
  };
}

function makePlayer(overrides: Partial<PlayerCombat> = {}): PlayerCombat {
  return {
    health: 5, maxHealth: 10, attack: 3,
    parryWindowMs: 220, perfectParryMs: 90, typingPower: 1,
    improvedParry: false,
    ...overrides,
  };
}

describe("applyItem", () => {
  it("recovery-packet heals 3 hp and names the heal in the log", () => {
    const fx = makeFx();
    const player = makePlayer({ health: 5, maxHealth: 10 });
    const result = applyItem(fx, player, "recovery-packet");
    expect(result.player.health).toBe(8);
    expect(result.log.toLowerCase()).toContain("heal");
    expect(result.log.toLowerCase()).toContain("recovery");
  });

  it("recovery-packet heal is capped at maxHealth", () => {
    const fx = makeFx();
    const player = makePlayer({ health: 9, maxHealth: 10 });
    const result = applyItem(fx, player, "recovery-packet");
    expect(result.player.health).toBe(10);
  });

  it("recovery-packet at full health stays at full health (no overheal)", () => {
    const fx = makeFx();
    const player = makePlayer({ health: 10, maxHealth: 10 });
    const result = applyItem(fx, player, "recovery-packet");
    expect(result.player.health).toBe(10);
  });

  it("attack-byte stacks attackBonus with no cap", () => {
    let result = applyItem(makeFx(), makePlayer(), "attack-byte");
    expect(result.fx.attackBonus).toBe(1);
    for (let i = 0; i < 4; i++) {
      result = applyItem(result.fx, result.player, "attack-byte");
    }
    expect(result.fx.attackBonus).toBe(5);
  });

  it("firewall-layer stacks up to a cap of 2 (3rd application is a no-op)", () => {
    let fx = makeFx();
    const player = makePlayer();
    fx = applyItem(fx, player, "firewall-layer").fx;
    expect(fx.firewallLayers).toBe(1);
    fx = applyItem(fx, player, "firewall-layer").fx;
    expect(fx.firewallLayers).toBe(2);
    fx = applyItem(fx, player, "firewall-layer").fx;
    expect(fx.firewallLayers).toBe(2);
  });

  it("focus-chip stacks up to a cap of 2", () => {
    let fx = makeFx();
    const player = makePlayer();
    fx = applyItem(fx, player, "focus-chip").fx;
    fx = applyItem(fx, player, "focus-chip").fx;
    fx = applyItem(fx, player, "focus-chip").fx;
    expect(fx.focusChips).toBe(2);
  });

  it("parry-module stacks up to a cap of 3 (4th application is a no-op)", () => {
    let fx = makeFx();
    const player = makePlayer();
    for (let i = 0; i < 4; i++) {
      fx = applyItem(fx, player, "parry-module").fx;
    }
    expect(fx.parryModules).toBe(3);
  });

  it("root-access adds a charge with no cap", () => {
    let fx = makeFx();
    const player = makePlayer();
    for (let i = 0; i < 5; i++) {
      fx = applyItem(fx, player, "root-access").fx;
    }
    expect(fx.rootAccessCharges).toBe(5);
  });

  it("exploit-insight sets analyzed and exploitInsight to true", () => {
    const result = applyItem(makeFx(), makePlayer(), "exploit-insight");
    expect(result.fx.analyzed).toBe(true);
    expect(result.fx.exploitInsight).toBe(true);
  });

  it("cache-boost has no combat effect and logs 'already active' flavor", () => {
    const fx = makeFx();
    const player = makePlayer();
    const result = applyItem(fx, player, "cache-boost");
    expect(result.fx).toEqual(fx);
    expect(result.player).toEqual(player);
    expect(result.log.toLowerCase()).toContain("already active");
  });

  it("is pure: never mutates the original fx or player objects", () => {
    const fx = makeFx({ attackBonus: 2, firewallLayers: 1 });
    const player = makePlayer({ health: 5 });
    const fxSnapshot = { ...fx };
    const playerSnapshot = { ...player };

    applyItem(fx, player, "attack-byte");
    applyItem(fx, player, "recovery-packet");
    applyItem(fx, player, "firewall-layer");

    expect(fx).toEqual(fxSnapshot);
    expect(player).toEqual(playerSnapshot);
  });

  it("returns a new fx object when fx changes, rather than the same reference", () => {
    const fx = makeFx();
    const player = makePlayer();
    const result = applyItem(fx, player, "attack-byte");
    expect(result.fx).not.toBe(fx);
  });

  it("returns a new player object when player changes, rather than the same reference", () => {
    const fx = makeFx();
    const player = makePlayer({ health: 5 });
    const result = applyItem(fx, player, "recovery-packet");
    expect(result.player).not.toBe(player);
  });
});

describe("COMBAT_USABLE", () => {
  it("excludes exactly cache-boost and includes the other 7 buffs", () => {
    const allBuffs: BuffId[] = [
      "attack-byte", "firewall-layer", "focus-chip", "parry-module",
      "recovery-packet", "root-access", "exploit-insight", "cache-boost",
    ];
    expect(COMBAT_USABLE).not.toContain("cache-boost");
    expect(COMBAT_USABLE).toHaveLength(7);
    for (const buff of allBuffs) {
      if (buff === "cache-boost") continue;
      expect(COMBAT_USABLE).toContain(buff);
    }
  });
});
