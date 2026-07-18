// features/adventure/audio/notes.ts
// Pure music helpers — no WebAudio, no DOM. Safe to import anywhere (SSR/test).

const SEMITONE: Record<string, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

/** "C4" → 261.63, "A4" → 440, "F#3" → 185.0. Throws on garbage. */
export function noteToFreq(note: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(note);
  if (!m) throw new Error(`bad note: ${note}`);
  const idx = SEMITONE[m[1]];
  const octave = Number(m[2]);
  const midi = 12 * (octave + 1) + idx;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Duration of one 16th-note step in ms for a given bpm. */
export function stepDurationMs(bpm: number): number {
  return 15000 / bpm; // 16th notes: (60/bpm)/4 * 1000
}

/** A single step: note = attack, "—" = sustain previous, null = rest. */
export type Step = string | "—" | null;
