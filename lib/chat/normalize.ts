// Input normalization for the chat matcher.
//
// Everything, visitor input, triggers, follow-up keys, goes through the same
// function so "Bleach!!!", "bleach" and "BLEACH" all compare equal.

/**
 * Lowercase, strip accents, drop apostrophes ("gojo's" -> "gojos", "what's"
 * -> "whats"), turn every other punctuation mark into a space, collapse
 * whitespace. "+" and "#" survive so "c++" and "c#" can be triggers.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’ʼ']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  const n = normalize(text);
  return n ? n.split(" ") : [];
}

/**
 * Whole-token comparison with one forgiving rule: a trailing "s" on the
 * input token is ignored ("hackers" matches "hacker", "gojos" matches
 * "gojo"). Never the other way round, and never a substring, "johnson"
 * does not match "john".
 */
export function tokenMatches(inputToken: string, triggerToken: string): boolean {
  if (inputToken === triggerToken) return true;
  return (
    inputToken.length === triggerToken.length + 1 &&
    inputToken.endsWith("s") &&
    inputToken.slice(0, -1) === triggerToken
  );
}

/** True when `needle` appears as a contiguous run of tokens inside `haystack`. */
export function containsSequence(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (!tokenMatches(haystack[i + j], needle[j])) continue outer;
    }
    return true;
  }
  return false;
}
