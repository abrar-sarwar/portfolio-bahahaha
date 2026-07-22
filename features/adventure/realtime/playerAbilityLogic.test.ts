import { describe, expect, it } from "vitest";
import {
  abilityHudSnapshot,
  initialAbilityState,
  isAbilityInvulnerable,
  movementSpeedFor,
  playerDamageFor,
  stepAbilityState,
  tryUseAbility,
} from "./playerAbilityLogic";

describe("player ability state", () => {
  it("walks normally and runs only while Shift is held", () => {
    expect(movementSpeedFor(false, false)).toBe(150);
    expect(movementSpeedFor(true, false)).toBe(240);
    expect(movementSpeedFor(true, true)).toBe(384);
  });

  it("spends two rift-swing charges and refills them on landing", () => {
    const first = tryUseAbility(initialAbilityState(), "grapple", 100);
    expect(first.activated).toBe(true);
    expect(first.state.grappleCharges).toBe(1);
    const second = tryUseAbility(first.state, "grapple", 200);
    expect(second.state.grappleCharges).toBe(0);
    expect(tryUseAbility(second.state, "grapple", 300).activated).toBe(false);
    expect(stepAbilityState(second.state, { now: 400, grounded: true }).grappleCharges).toBe(2);
  });

  it("gates slash rush and sword wave by their cooldowns", () => {
    const rush = tryUseAbility(initialAbilityState(), "slashRush", 1_000);
    expect(rush.state.slashRushEndsAt).toBe(1_240);
    expect(rush.state.slashRushReadyAt).toBe(3_400);
    expect(tryUseAbility(rush.state, "slashRush", 3_399).activated).toBe(false);
    expect(tryUseAbility(rush.state, "slashRush", 3_400).activated).toBe(true);

    const wave = tryUseAbility(initialAbilityState(), "swordWave", 500);
    expect(wave.state.swordWaveReadyAt).toBe(4_100);
    expect(tryUseAbility(wave.state, "swordWave", 4_099).activated).toBe(false);
  });

  it("makes slash rush invulnerable for 240ms", () => {
    const rush = tryUseAbility(initialAbilityState(), "slashRush", 100).state;
    expect(isAbilityInvulnerable(rush, 339)).toBe(true);
    expect(isAbilityInvulnerable(rush, 340)).toBe(false);
  });

  it("allows one 30-second demon form per run", () => {
    const demon = tryUseAbility(initialAbilityState(), "ultimate", 2_000);
    expect(demon.activated).toBe(true);
    expect(demon.state.ultimateEndsAt).toBe(32_000);
    expect(isAbilityInvulnerable(demon.state, 31_999)).toBe(true);
    expect(playerDamageFor(5, demon.state, 31_999)).toBe(10);
    expect(playerDamageFor(5, demon.state, 32_000)).toBe(5);
    expect(tryUseAbility(demon.state, "ultimate", 40_000).activated).toBe(false);
  });

  it("publishes ready, active, and spent ultimate HUD states", () => {
    expect(abilityHudSnapshot(initialAbilityState(), 0).ultimate).toEqual({
      status: "ready",
      remainingFrac: 1,
    });
    const demon = tryUseAbility(initialAbilityState(), "ultimate", 1_000).state;
    expect(abilityHudSnapshot(demon, 16_000).ultimate).toEqual({
      status: "active",
      remainingFrac: 0.5,
    });
    expect(abilityHudSnapshot(demon, 31_000).ultimate).toEqual({
      status: "spent",
      remainingFrac: 0,
    });
  });
});
