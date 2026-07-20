// features/adventure/combat/rewards.ts
// Pure reward-application logic (unit-tested below) plus a thin store-writing
// wrapper the combat controller's victory seam calls directly. Task 15's save
// module will eventually own persistence; until then abilities/keyFragments
// live on gameStore for the session — same pattern as `deaths` today.
import type { BossDefinition, Reward } from "./types";
import type { AbilityId, KeyFragment } from "../ids";
import { gameStore } from "../bridge/GameStore";

export interface RewardTargetState {
  abilities: Record<AbilityId, boolean>;
  keyFragments: KeyFragment[];
}

/** Apply a boss's reward list to a store-shaped snapshot. Never mutates the
 *  input; returns a NEW object only where something actually changed (the
 *  untouched field keeps its original reference, so callers can cheaply
 *  detect a no-op with `!==`). Idempotent: an ability already unlocked or a
 *  fragment already held is skipped, so replaying a cleared boss (future
 *  overworld re-entry) can never double-grant. */
export function applyRewards(state: RewardTargetState, rewards: Reward[]): RewardTargetState {
  let abilities = state.abilities;
  let keyFragments = state.keyFragments;

  for (const reward of rewards) {
    if (reward.kind === "ability") {
      const id = reward.id as AbilityId;
      if (!abilities[id]) abilities = { ...abilities, [id]: true };
    } else if (reward.kind === "key-fragment") {
      const id = reward.id as KeyFragment;
      if (!keyFragments.includes(id)) keyFragments = [...keyFragments, id];
    }
    // "castle-key" rewards are granted by a later boss task.
  }

  return { abilities, keyFragments };
}

/** Controller victory seam (see controller.ts's handleOutcome): read the
 *  current store snapshot, apply this boss's rewards, and publish only the
 *  fields that actually changed — keeps a no-op replay (RETRY after an
 *  already-won fight, or re-entering a cleared boss) churn-free. */
export function grantRewards(def: BossDefinition): void {
  const store = gameStore.get();
  const next = applyRewards({ abilities: store.abilities, keyFragments: store.keyFragments }, def.rewards);
  const patch: Partial<RewardTargetState> = {};
  if (next.abilities !== store.abilities) patch.abilities = next.abilities;
  if (next.keyFragments !== store.keyFragments) patch.keyFragments = next.keyFragments;
  if (Object.keys(patch).length > 0) gameStore.set(patch);
}
