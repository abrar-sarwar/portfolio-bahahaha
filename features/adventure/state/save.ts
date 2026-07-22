// features/adventure/state/save.ts
// Versioned localStorage save — the durable mirror of the player's progress.
//
// gameStore (bridge/GameStore.ts) is the RUNTIME source of truth for the
// current session: the live `abilities` / `keyFragments` / `deaths` fields
// there drive gameplay every frame (dash gating, reward display, the assist
// curve). This module is the DURABLE mirror of that same progress plus
// everything gameStore never tracked (unlocked/completed levels, memory
// fragments, the castle key, settings): every meaningful mutation is
// written straight through to storage via persistSave (write-through on
// change), and the save is read back once at boot (BootScene) to reseed
// gameStore for the new session (read at boot).
//
// Every exported transform here (completeLevel, grantReward, recordDeath,
// markBossDefeated, collectMemoryFragment) is a pure function over an
// AdventureSave value — nothing in this file touches gameStore or Phaser.
// Callers (combat/controller.ts, combat/rewards.ts, PlatformLevelScene,
// Overlay, BootScene) own the read-transform-persist + gameStore-sync glue.
import type { LevelId, BossId, KeyFragment, AbilityId } from "../ids";
import type { Reward } from "../combat/types";
import { SAVE_KEY } from "../config";

export interface AdventureSave {
  version: 1;
  unlocked: LevelId[];
  completed: LevelId[];
  abilities: { dash: boolean; analyze: boolean; improvedParry: boolean };
  keyFragments: KeyFragment[];
  castleKey: boolean;
  memoryFragments: LevelId[];
  bossesDefeated: BossId[];
  deaths: Partial<Record<BossId, number>>;
  gameCompleted: boolean;
  codeReceived: boolean;
  /** Level ids whose intro-<id> dialogue has already played this save (Task
   *  17). Additive field, added with NO version bump: isSaveShape below
   *  deliberately does not require it (a save written before it existed
   *  must keep loading), and loadSave backfills a missing key with [] — see
   *  both for the mechanics of that tolerance. */
  seenIntros: LevelId[];
  settings: {
    volume: number;
    muted: boolean;
    accessibility: {
      widerParry: boolean;
      slowerTyping: boolean; // persisted legacy flag; deliberately dormant
      slowerHazards: boolean;
      reduceFlash: boolean;
      noShake: boolean;
    };
  };
}

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export function defaultSave(): AdventureSave {
  return {
    version: 1,
    unlocked: ["1-1"],
    completed: [],
    abilities: { dash: false, analyze: false, improvedParry: false },
    keyFragments: [],
    castleKey: false,
    memoryFragments: [],
    bossesDefeated: [],
    deaths: {},
    gameCompleted: false,
    codeReceived: false,
    seenIntros: [],
    settings: {
      volume: 0.7,
      muted: false,
      accessibility: { widerParry: false, slowerTyping: false, slowerHazards: false, reduceFlash: false, noShake: false },
    },
  };
}

/** Resolve the default storage backend: `window.localStorage` in a browser,
 *  `undefined` everywhere else (SSR, Node/Vitest — no `window` global at
 *  all — or a browser with storage access denied, which Safari private
 *  browsing throws on rather than merely failing writes). Callers that pass
 *  their own StorageLike (tests, a future fake) skip this resolution. */
function defaultStorage(): StorageLike | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Loose shape check: version must be 1 and the array/object fields must be
 *  the right JS type. Not a full schema validation — this only exists to
 *  keep a truncated/hand-edited/future-incompatible localStorage entry from
 *  crashing downstream code that assumes e.g. `save.completed.includes`.
 *  Deliberately does NOT check `seenIntros` (Task 17, additive/no version
 *  bump): a save written before that field existed must still pass this
 *  check; loadSave backfills the missing key with [] right after. */
function isSaveShape(v: unknown): v is AdventureSave {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Partial<AdventureSave>;
  return (
    s.version === 1 &&
    Array.isArray(s.unlocked) &&
    Array.isArray(s.completed) &&
    Array.isArray(s.keyFragments) &&
    Array.isArray(s.memoryFragments) &&
    Array.isArray(s.bossesDefeated) &&
    typeof s.abilities === "object" &&
    s.abilities !== null &&
    typeof s.deaths === "object" &&
    s.deaths !== null &&
    typeof s.settings === "object" &&
    s.settings !== null
  );
}

/** Safe-parse the stored save: a missing key, corrupt JSON, an unknown
 *  version, or a version-1 payload with a malformed shape all fall back to
 *  `defaultSave()` instead of throwing. No storage resolves (SSR, or a
 *  Node context with no `window`) also falls back to defaults rather than
 *  throwing — callers never need to guard this themselves. */
export function loadSave(storage: StorageLike | undefined = defaultStorage()): AdventureSave {
  if (!storage) return defaultSave();
  let raw: string | null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    return defaultSave();
  }
  if (raw === null) return defaultSave();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isSaveShape(parsed)) return defaultSave();
    // Additive field (Task 17, no version bump): a save written before
    // seenIntros existed simply lacks the key — fill it in here so every
    // downstream `.includes()` caller can rely on it without a null-check.
    const fallback = defaultSave().settings.accessibility;
    return {
      ...parsed,
      seenIntros: Array.isArray(parsed.seenIntros) ? parsed.seenIntros : [],
      settings: {
        ...parsed.settings,
        accessibility: {
          ...fallback,
          ...(parsed.settings.accessibility ?? {}),
        },
      },
    };
  } catch {
    return defaultSave();
  }
}

/** Write-through persist. Swallows storage errors (full quota, Safari
 *  private-mode write-throws) — the in-session gameStore stays correct
 *  either way, so a failed persist only costs future cross-session state,
 *  not the current session. */
export function persistSave(save: AdventureSave, storage: StorageLike | undefined = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // no-op — see doc comment above
  }
}

/** The linear 1-1 → 1-2 → 1-3 → 1-4 → castle unlock chain. No entry for a
 *  level with no successor (castle). */
export const UNLOCK_NEXT: Partial<Record<LevelId, LevelId>> = {
  "1-1": "1-2",
  "1-2": "1-3",
  "1-3": "1-4",
  "1-4": "castle",
};

/** Mark a level complete and unlock its successor (UNLOCK_NEXT). Dedupes
 *  both lists, so replaying an already-complete level is a reference-stable
 *  no-op (`===` the input save) instead of a churny new object. */
export function completeLevel(save: AdventureSave, id: LevelId): AdventureSave {
  const completed = save.completed.includes(id) ? save.completed : [...save.completed, id];
  const next = UNLOCK_NEXT[id];
  const unlocked = next && !save.unlocked.includes(next) ? [...save.unlocked, next] : save.unlocked;
  if (completed === save.completed && unlocked === save.unlocked) return save;
  return { ...save, completed, unlocked };
}

/** Apply a single boss reward. Idempotent per-kind: an ability already
 *  unlocked, or a fragment already held, is a no-op. The third distinct key
 *  fragment automatically grants the castle key (three fragments ==
 *  castle-worthy, regardless of which three). A direct "castle-key" reward
 *  (a future boss's explicit grant) sets it outright. */
export function grantReward(save: AdventureSave, r: Reward): AdventureSave {
  if (r.kind === "ability") {
    const id = r.id as AbilityId;
    if (save.abilities[id]) return save;
    return { ...save, abilities: { ...save.abilities, [id]: true } };
  }
  if (r.kind === "key-fragment") {
    const id = r.id as KeyFragment;
    if (save.keyFragments.includes(id)) return save;
    const keyFragments = [...save.keyFragments, id];
    const castleKey = save.castleKey || keyFragments.length >= 3;
    return { ...save, keyFragments, castleKey };
  }
  // "castle-key"
  if (save.castleKey) return save;
  return { ...save, castleKey: true };
}

/** Increment this boss's death count — persists the same counter the
 *  session's gameStore.deaths already drives the assist curve from (see
 *  combat/controllerLogic.ts's buildCarry), so the assist carries across
 *  sessions too. */
export function recordDeath(save: AdventureSave, bossId: BossId): AdventureSave {
  return { ...save, deaths: { ...save.deaths, [bossId]: (save.deaths[bossId] ?? 0) + 1 } };
}

/** Mark a boss cleared. Dedupes — a RETRY replay or a future overworld
 *  re-entry into an already-cleared boss never double-adds. */
export function markBossDefeated(save: AdventureSave, bossId: BossId): AdventureSave {
  if (save.bossesDefeated.includes(bossId)) return save;
  return { ...save, bossesDefeated: [...save.bossesDefeated, bossId] };
}

/** Record a level's memory fragment as collected. Dedupes — the scene
 *  itself skips spawning an already-collected fragment (so re-collection
 *  should be impossible within a session), but this stays idempotent
 *  regardless. */
export function collectMemoryFragment(save: AdventureSave, levelId: LevelId): AdventureSave {
  if (save.memoryFragments.includes(levelId)) return save;
  return { ...save, memoryFragments: [...save.memoryFragments, levelId] };
}

/** Record a level's intro dialogue as played this save (Task 17, additive
 *  `seenIntros` — see the AdventureSave doc comment above). Dedupes — a
 *  replayed level entry never double-adds. */
export function markIntroSeen(save: AdventureSave, levelId: LevelId): AdventureSave {
  if (save.seenIntros.includes(levelId)) return save;
  return { ...save, seenIntros: [...save.seenIntros, levelId] };
}

/** The treasure chest is the durable end of the adventure. Keeping the two
 * flags in one transform prevents the gallery path and code receipt from
 * drifting apart if the chest scene is replayed or interrupted. */
export function finishAdventure(save: AdventureSave): AdventureSave {
  if (save.gameCompleted && save.codeReceived) return save;
  return { ...save, gameCompleted: true, codeReceived: true };
}

const LEVEL_CHAIN: LevelId[] = ["1-1", "1-2", "1-3", "1-4", "castle"];

/** Shipped `?debug=1` progression action. It intentionally reuses
 * completeLevel so debug saves obey exactly the same unlock chain as play. */
export function grantCompletionThrough(save: AdventureSave, through: LevelId): AdventureSave {
  let next = save;
  for (const id of LEVEL_CHAIN) {
    next = completeLevel(next, id);
    if (id === through) break;
  }
  return next;
}
