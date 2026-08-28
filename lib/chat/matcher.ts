// Trigger matching. Most-specific phrase wins: more tokens first, then entry
// priority, then more characters, then config order.

import { containsSequence, normalize, tokenize } from "./normalize";
import type { ChatEntry } from "./types";

export type TriggerMatch = {
  entry: ChatEntry;
  trigger: string;
  /** Number of tokens in the trigger, the main specificity measure. */
  tokens: number;
};

export type PhraseMatch = { phrase: string; tokens: number; length: number };

/** Best-matching phrase out of `phrases` for the given input, or null. */
export function bestPhrase(inputTokens: string[], phrases: string[]): PhraseMatch | null {
  let best: PhraseMatch | null = null;
  for (const phrase of phrases) {
    const needle = tokenize(phrase);
    if (needle.length === 0) continue;
    if (!containsSequence(inputTokens, needle)) continue;
    const candidate = { phrase, tokens: needle.length, length: normalize(phrase).length };
    if (
      !best ||
      candidate.tokens > best.tokens ||
      (candidate.tokens === best.tokens && candidate.length > best.length)
    ) {
      best = candidate;
    }
  }
  return best;
}

export function findBestMatch(input: string, entries: ChatEntry[]): TriggerMatch | null {
  const inputTokens = tokenize(input);
  if (inputTokens.length === 0) return null;

  let best: (TriggerMatch & { length: number; priority: number }) | null = null;
  for (const entry of entries) {
    const hit = bestPhrase(inputTokens, entry.triggers);
    if (!hit) continue;
    const priority = entry.priority ?? 0;
    const beats =
      !best ||
      hit.tokens > best.tokens ||
      (hit.tokens === best.tokens &&
        (priority > best.priority ||
          (priority === best.priority && hit.length > best.length)));
    if (beats) {
      best = { entry, trigger: hit.phrase, tokens: hit.tokens, length: hit.length, priority };
    }
  }
  if (!best) return null;
  return { entry: best.entry, trigger: best.trigger, tokens: best.tokens };
}
