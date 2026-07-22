import { PHYSICS } from "../config";
import { RT_PLAYER } from "./config";

export type PlayerAbility = "grapple" | "slashRush" | "swordWave" | "ultimate";

export interface AbilityRuntimeState {
  grappleCharges: number;
  slashRushEndsAt: number;
  slashRushReadyAt: number;
  swordWaveReadyAt: number;
  ultimateEndsAt: number;
  ultimateSpent: boolean;
}

export interface AbilityHudSnapshot {
  grapple: { charges: number; maxCharges: number };
  slashRush: { cooldownFrac: number };
  swordWave: { cooldownFrac: number };
  ultimate: {
    status: "ready" | "active" | "spent";
    remainingFrac: number;
  };
}

export function initialAbilityState(ultimateSpent = false): AbilityRuntimeState {
  return {
    grappleCharges: RT_PLAYER.grappleCharges,
    slashRushEndsAt: 0,
    slashRushReadyAt: 0,
    swordWaveReadyAt: 0,
    ultimateEndsAt: 0,
    ultimateSpent,
  };
}

export function stepAbilityState(
  state: AbilityRuntimeState,
  input: { now: number; grounded: boolean },
): AbilityRuntimeState {
  if (!input.grounded || state.grappleCharges === RT_PLAYER.grappleCharges) return state;
  return { ...state, grappleCharges: RT_PLAYER.grappleCharges };
}

export function tryUseAbility(
  state: AbilityRuntimeState,
  ability: PlayerAbility,
  now: number,
): { state: AbilityRuntimeState; activated: boolean } {
  if (ability === "grapple") {
    if (state.grappleCharges <= 0) return { state, activated: false };
    return {
      state: { ...state, grappleCharges: state.grappleCharges - 1 },
      activated: true,
    };
  }
  if (ability === "slashRush") {
    if (now < state.slashRushReadyAt) return { state, activated: false };
    return {
      state: {
        ...state,
        slashRushEndsAt: now + RT_PLAYER.slashRushMs,
        slashRushReadyAt: now + RT_PLAYER.slashRushCooldownMs,
      },
      activated: true,
    };
  }
  if (ability === "swordWave") {
    if (now < state.swordWaveReadyAt) return { state, activated: false };
    return {
      state: { ...state, swordWaveReadyAt: now + RT_PLAYER.swordWaveCooldownMs },
      activated: true,
    };
  }
  if (state.ultimateSpent) return { state, activated: false };
  return {
    state: {
      ...state,
      ultimateSpent: true,
      ultimateEndsAt: now + RT_PLAYER.ultimateMs,
    },
    activated: true,
  };
}

export function isDemonActive(state: AbilityRuntimeState, now: number): boolean {
  return state.ultimateSpent && now < state.ultimateEndsAt;
}

export function isAbilityInvulnerable(state: AbilityRuntimeState, now: number): boolean {
  return now < state.slashRushEndsAt || isDemonActive(state, now);
}

export function playerDamageFor(
  baseDamage: number,
  state: AbilityRuntimeState,
  now: number,
): number {
  return baseDamage * (isDemonActive(state, now) ? RT_PLAYER.ultimateDamageMultiplier : 1);
}

export function movementSpeedFor(runHeld: boolean, demonActive: boolean): number {
  const base = runHeld ? PHYSICS.runSpeed : PHYSICS.moveSpeed;
  return base * (demonActive ? RT_PLAYER.ultimateSpeedMultiplier : 1);
}

function cooldownFrac(now: number, readyAt: number, duration: number): number {
  if (now >= readyAt) return 0;
  return Math.max(0, Math.min(1, (readyAt - now) / duration));
}

export function abilityHudSnapshot(state: AbilityRuntimeState, now: number): AbilityHudSnapshot {
  const active = isDemonActive(state, now);
  const ultimate = !state.ultimateSpent
    ? { status: "ready" as const, remainingFrac: 1 }
    : active
      ? {
          status: "active" as const,
          remainingFrac: Math.max(0, Math.min(1, (state.ultimateEndsAt - now) / RT_PLAYER.ultimateMs)),
        }
      : { status: "spent" as const, remainingFrac: 0 };
  return {
    grapple: { charges: state.grappleCharges, maxCharges: RT_PLAYER.grappleCharges },
    slashRush: {
      cooldownFrac: cooldownFrac(now, state.slashRushReadyAt, RT_PLAYER.slashRushCooldownMs),
    },
    swordWave: {
      cooldownFrac: cooldownFrac(now, state.swordWaveReadyAt, RT_PLAYER.swordWaveCooldownMs),
    },
    ultimate,
  };
}
