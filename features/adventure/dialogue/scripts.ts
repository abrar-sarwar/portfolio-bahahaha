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

  // Phishing Harbor (1-2) level intro (Task 18) — harbor / phishing tone.
  "intro-1-2": [
    "PHISHING HARBOR: everything here is a great deal, and every deal is a lie.",
    "That gold plank? Fake. That free upgrade? Bait. Read the source, not the shine.",
    "Ride the honest boats. Trust the water even less than the captains.",
  ],

  // Firewall Factory (1-3) level intro (Task 19) — industrial / defense tone.
  "intro-1-3": [
    "FIREWALL FACTORY: the automated defenses never clocked out. They just forgot who was friendly.",
    "Belts, molten vats, blast gates, tripwire lasers — all still running the old rules.",
    "Bait the heavies into a wall. Parry the strikes. The Warden holds the gate at the end.",
  ],

  // The Corrupted Archive (1-4) level intro (Task 20) — melancholy, self-aware:
  // this world is made of unfinished things, and its shadows are your own.
  "intro-1-4": [
    "THE CORRUPTED ARCHIVE: shelves of chapters no one finished. Yours are here too.",
    "The pages still turn. The enemies wear your shadow — darker, heavier, harder to end.",
    "Something waits at the back that has never been written. It would rather you didn't start.",
  ],

  // The Devil King's Castle intro (Task 21) — the tone shift: storm, dread, and
  // the resolve to finish what was started. This is the last climb.
  "intro-castle": [
    "THE DEVIL KING'S CASTLE: the sky bleeds red and the stone drinks the light.",
    "Fireballs, falling bridges, a rising tide that wants you to stop climbing.",
    "Three fragments forged the key. Everything after this is just the stairs. Go up.",
  ],

  // Shown at the throne DOOR when the player lacks the castle key (Task 21).
  // A single short line — a locked-door beat, not a full script.
  "castle-seal": [
    "The seal holds. Three fragments forge the key.",
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
