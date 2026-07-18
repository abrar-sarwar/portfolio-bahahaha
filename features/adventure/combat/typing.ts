export type TypingGrade = "perfect" | "good" | "incomplete" | "incorrect";

export const TYPING_DAMAGE_MULT: Record<TypingGrade, number> = {
  perfect: 2, good: 1.2, incomplete: 0.6, incorrect: 0.25,
};

export function gradeTyping(prompt: string, typed: string, elapsedMs: number, timeLimitMs: number): TypingGrade {
  const want = prompt.trim().toLowerCase();
  const got = typed.trim().toLowerCase();
  if (got === want) return elapsedMs <= timeLimitMs * 0.5 ? "perfect" : "good";
  if (want.startsWith(got) && got.length >= Math.ceil(want.length / 2)) return "incomplete";
  return "incorrect";
}

export function typingTimeLimitMs(base: number, focusChips: number, assistScale: number): number {
  return base * (1 + 0.25 * Math.min(focusChips, 2)) * assistScale;
}
