// features/adventure/combat/rewards.ts
// Pure reward-application logic (unit-tested below) plus a thin store-writing
// wrapper the combat controller's victory seam calls directly. The pure
// per-reward logic (ability dedupe, fragment dedupe/accumulate) now delegates
// to state/save.ts's grantReward — one source of truth for what a Reward does
// — so this module's job is purely the RewardTargetState <-> AdventureSave
// shape bridge plus the gameStore write. grantRewards() ALSO persists via
// save.ts: gameStore stays the session's runtime abilities/keyFragments, the
// save is the durable mirror written through on every victory.
import type { BossDefinition, Reward } from "./types";
import type { AbilityId, KeyFragment } from "../ids";
import { gameStore } from "../bridge/GameStore";
import { defaultSave, grantReward, loadSave, persistSave, type AdventureSave } from "../state/save";

export interface RewardTargetState {
  abilities: Record<AbilityId, boolean>;
  keyFragments: KeyFragment[];
}

/** Apply a boss's reward list to a store-shaped snapshot. Never mutates the
 *  input; returns a NEW object only where something actually changed (the
 *  untouched field keeps its original reference, so callers can cheaply
 *  detect a no-op with `!==`). Idempotent: an ability already unlocked or a
 *  fragment already held is skipped, so replaying a cleared boss (future
 *  overworld re-entry) can never double-grant. Delegates the per-reward
 *  logic to save.ts's grantReward via a throwaway AdventureSave seeded from
 *  this state — a "castle-key" reward's effect on that throwaway save's
 *  castleKey is intentionally dropped on the way back out; gameStore doesn't
 *  track castleKey (it's save-only, read by a future task's castle door). */
export function applyRewards(state: RewardTargetState, rewards: Reward[]): RewardTargetState {
  let save: AdventureSave = { ...defaultSave(), abilities: state.abilities, keyFragments: state.keyFragments };
  for (const reward of rewards) save = grantReward(save, reward);
  return { abilities: save.abilities, keyFragments: save.keyFragments };
}

/** Controller victory seam (see controller.ts's handleOutcome): read the
 *  current store snapshot, apply this boss's rewards, and publish only the
 *  fields that actually changed — keeps a no-op replay (RETRY after an
 *  already-won fight, or re-entering a cleared boss) churn-free. Also
 *  persists the same rewards to the durable save (write-through), skipping
 *  the write entirely when nothing actually changed. */
export function grantRewards(def: BossDefinition): void {
  const store = gameStore.get();
  const next = applyRewards({ abilities: store.abilities, keyFragments: store.keyFragments }, def.rewards);
  const patch: Partial<RewardTargetState> = {};
  if (next.abilities !== store.abilities) patch.abilities = next.abilities;
  if (next.keyFragments !== store.keyFragments) patch.keyFragments = next.keyFragments;
  if (Object.keys(patch).length > 0) gameStore.set(patch);

  const before = loadSave();
  let save = before;
  for (const reward of def.rewards) save = grantReward(save, reward);
  if (save !== before) persistSave(save);
}
