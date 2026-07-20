// features/adventure/dialogue/scripts.ts
// Static dialogue script table (typewriter lines Dialogue.tsx plays through)
// plus dynamic resolution for boss intro/defeat scripts. Boss lines are NOT
// duplicated here — they read straight off the registered BossDefinition
// (BOSSES), which stays the single source of truth for a boss's own story
// beats; resolveScript just re-surfaces `intro` / `defeatLines` through the
// same dialogue pipeline every other script id uses.
import { BOSSES } from "../bosses";
import type { BossId } from "../ids";

export const SCRIPTS: Record<string, string[]> = {
  // Bug Fields (1-1) level intro — plays once per save on first entry (see
  // PlatformLevelScene + state/save.ts's additive `seenIntros`).
  "intro-1-1": [
    "BUG FIELDS: every untested commit that ever shipped ended up out here.",
    "They breed in the tall grass now. Loud, dumb, and surprisingly bitey.",
    "Patch what you can. Stomp the rest. Welcome to the fields.",
  ],

  // Memory fragment notes — VERBATIM per task-17-brief.md. Do not paraphrase.
  // One line each: a fragment note is a single dialogue "page", not a script.
  "frag-1-1": [
    "First bug I ever fixed took me six hours. It was a semicolon. NetWraith watches millions of packets now — same person, better tools.",
  ],
  "frag-1-2": [
    "Phishing works because it looks legit. So does self-doubt. Verify the source on both.",
  ],
  "frag-1-3": [
    "TripWire fires in under 60 seconds. Discipline is just automation for humans.",
  ],
  "frag-1-4": [
    "There's a manga chapter I never drew. This game exists because blank pages lose if you start anyway.",
  ],
};

/** Resolve a dialogue script id to its lines, or null if nothing matches.
 *  Lookup order: the static SCRIPTS table first, then two dynamic id shapes
 *  — `boss-intro-<bossId>` / `boss-defeat-<bossId>` — which resolve
 *  `BOSSES[bossId].intro` / `.defeatLines` at call time. An id naming a boss
 *  that isn't registered in BOSSES (or that just isn't recognized at all)
 *  returns null; callers (dialogueController's openDialogue) treat that as
 *  "no dialogue for this beat", not an error, so new levels/bosses without
 *  authored copy yet are silent no-ops rather than crashes. */
export function resolveScript(id: string): string[] | null {
  const fromTable = SCRIPTS[id];
  if (fromTable) return fromTable;

  const introPrefix = "boss-intro-";
  const defeatPrefix = "boss-defeat-";
  if (id.startsWith(introPrefix)) {
    const bossId = id.slice(introPrefix.length) as BossId;
    return BOSSES[bossId]?.intro ?? null;
  }
  if (id.startsWith(defeatPrefix)) {
    const bossId = id.slice(defeatPrefix.length) as BossId;
    return BOSSES[bossId]?.defeatLines ?? null;
  }
  return null;
}
