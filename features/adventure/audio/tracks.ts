// features/adventure/audio/tracks.ts
// Chiptune track data. 4 voices per track (sq1 melody, sq2 harmony/counter,
// tri bass, noise drums). A step is a note ("attack"), "—" (sustain) or null
// (rest). noise: 1 = hat, 2 = snare/boom, 0/null = silence.
//
// Each track is authored in bars of 16 sixteenth-note steps. All four voice
// arrays share the same length (>= 64, multiple of 16) — enforced by
// tracks.test.ts. Bass follows the harmony implied by the melody.

import type { Step } from "./notes";

export interface Track {
  bpm: number;
  loop: boolean;
  sq1: Step[];
  sq2: Step[];
  tri: Step[];
  noise: (0 | 1 | 2 | null)[];
}

const _ = null;
const S = "—";

// --- transposition helper (used to derive devil-3 from devil-1) ------------
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SEMI: Record<string, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};
function noteToMidi(n: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) throw new Error(`bad note: ${n}`);
  return 12 * (Number(m[2]) + 1) + SEMI[m[1]];
}
function midiToNote(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NAMES[((midi % 12) + 12) % 12];
  return `${name}${octave}`;
}
function transpose(steps: Step[], semis: number): Step[] {
  return steps.map((s) => (s === null || s === S ? s : midiToNote(noteToMidi(s) + semis)));
}

// ===========================================================================
// TITLE — A minor, 96 bpm, moody-heroic (verbatim reference track)
// ===========================================================================
export const TITLE: Track = {
  bpm: 96,
  loop: true,
  sq1: [
    "A4", S, S, S, "C5", S, "B4", S, "A4", S, S, S, "E4", S, S, S,
    "F4", S, S, S, "A4", S, "G4", S, "E4", S, S, S, S, S, _, _,
    "A4", S, S, S, "C5", S, "B4", S, "D5", S, S, S, "C5", S, "B4", S,
    "A4", S, S, S, "G4", S, "E4", S, "A4", S, S, S, S, S, _, _,
  ],
  sq2: [
    "E3", S, _, "E3", S, _, "E3", S, "E3", S, _, "E3", S, _, "E3", S,
    "D3", S, _, "D3", S, _, "D3", S, "C3", S, _, "C3", S, _, "C3", S,
    "E3", S, _, "E3", S, _, "E3", S, "F3", S, _, "F3", S, _, "F3", S,
    "E3", S, _, "E3", S, _, "D3", S, "A2", S, S, S, S, S, _, _,
  ],
  tri: [
    "A2", S, S, S, S, S, S, S, "A2", S, S, S, S, S, S, S,
    "D2", S, S, S, S, S, S, S, "C2", S, S, S, S, S, S, S,
    "A2", S, S, S, S, S, S, S, "F2", S, S, S, S, S, S, S,
    "E2", S, S, S, S, S, S, S, "A2", S, S, S, S, S, S, S,
  ],
  noise: [
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 1, _, 1, 1,
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 1, _, 1, 1,
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 1, _, 1, 1,
    2, _, 1, _, 1, _, 1, _, 2, _, 1, 1, 2, _, 2, 2,
  ],
};

// ===========================================================================
// OVERWORLD — C major, 104 bpm, strolling. I–vi–IV–V (C Am F G)
// ===========================================================================
const OVERWORLD: Track = {
  bpm: 104,
  loop: true,
  sq1: [
    "C5", S, "B4", S, "C5", S, "D5", S, "E5", S, "D5", S, "C5", S, _, _,
    "A4", S, "B4", S, "C5", S, "B4", S, "A4", S, "G4", S, "A4", S, _, _,
    "F4", S, "G4", S, "A4", S, "C5", S, "A4", S, "G4", S, "F4", S, _, _,
    "G4", S, "A4", S, "B4", S, "D5", S, "B4", S, "A4", S, "G4", S, _, _,
  ],
  sq2: [
    "C4", S, "E4", S, "G4", S, "E4", S, "C4", S, "E4", S, "G4", S, "E4", S,
    "A3", S, "C4", S, "E4", S, "C4", S, "A3", S, "C4", S, "E4", S, "C4", S,
    "F3", S, "A3", S, "C4", S, "A3", S, "F3", S, "A3", S, "C4", S, "A3", S,
    "G3", S, "B3", S, "D4", S, "B3", S, "G3", S, "B3", S, "D4", S, "B3", S,
  ],
  tri: [
    "C2", S, S, S, "G2", S, S, S, "C2", S, S, S, "G2", S, S, S,
    "A2", S, S, S, "E2", S, S, S, "A2", S, S, S, "E2", S, S, S,
    "F2", S, S, S, "C3", S, S, S, "F2", S, S, S, "C3", S, S, S,
    "G2", S, S, S, "D3", S, S, S, "G2", S, S, S, "D3", S, S, S,
  ],
  noise: [
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 1, _, 1, _,
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 1, _, 1, _,
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 1, _, 1, _,
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 2, _, 1, 1,
  ],
};

// ===========================================================================
// LEVEL-1 — G major, 112 bpm, bright & bouncy. I–V–vi–IV (G D Em C)
// ===========================================================================
const LEVEL_1: Track = {
  bpm: 100,
  loop: true,
  sq1: [
    "B4", S, "E5", S, "F#5", S, "G5", S, "F#5", S, "E5", S, "B4", S, _, _,
    "C5", S, "D5", S, "E5", S, "G5", S, "E5", S, "D5", S, "C5", S, _, _,
    "D5", S, S, S, "E5", S, S, S, "G5", S, S, S, "E5", S, "D5", S,
    "B4", S, S, S, "D5", S, S, S, "A4", S, S, S, "B4", S, S, S,
  ],
  sq2: [
    "E4", S, "B3", S, "E4", S, "G4", S, "E4", S, "B3", S, "G4", S, "B3", S,
    "C4", S, "G3", S, "C4", S, "E4", S, "C4", S, "G3", S, "E4", S, "G3", S,
    "G3", S, "D4", S, "G4", S, "D4", S, "B3", S, "D4", S, "G4", S, "D4", S,
    "D4", S, "A3", S, "D4", S, "F#4", S, "A3", S, "F#4", S, "D4", S, "A3", S,
  ],
  tri: [
    "E2", S, S, S, "B2", S, S, S, "E2", S, S, S, "B2", S, S, S,
    "C2", S, S, S, "G2", S, S, S, "C2", S, S, S, "G2", S, S, S,
    "G2", S, S, S, "D3", S, S, S, "G2", S, S, S, "D3", S, S, S,
    "D2", S, S, S, "A2", S, S, S, "D2", S, S, S, "A2", S, S, S,
  ],
  noise: [
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 1, _, 1, _,
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 1, _, 1, _,
    2, _, _, _, 1, _, _, _, 2, _, _, _, 1, _, _, _,
    2, _, _, _, 1, _, _, _, 2, _, _, _, 1, _, 1, _,
  ],
};

// ===========================================================================
// LEVEL-2 — D minor, 100 bpm, harbor sway. i–iv–VI–V (Dm Gm A#(Bb) A)
// ===========================================================================
const LEVEL_2: Track = {
  bpm: 92,
  loop: true,
  sq1: [
    "A4", S, S, "A#4", "C#5", S, "D5", S, S, S, "A4", S, S, S, _, _,
    "D5", S, "C#5", S, "A#4", S, "A4", S, S, S, "G4", S, "A4", S, S, _,
    "D4", S, S, S, S, S, S, S, "F4", S, S, S, S, S, S, S,
    "A4", S, S, S, "G4", S, "F4", S, "E4", S, S, S, "D4", S, S, S,
  ],
  sq2: [
    "A3", S, S, S, S, S, S, S, "F3", S, S, S, S, S, S, S,
    "A3", S, S, S, S, S, S, S, "E3", S, S, S, S, S, S, S,
    "D3", S, "A3", S, "D3", S, "A3", S, "D3", S, "A3", S, "D3", S, "A3", S,
    "A3", S, "E3", S, "A3", S, "C#4", S, "A3", S, "E3", S, "A3", S, "E3", S,
  ],
  tri: [
    "D2", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
    "A1", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
    "D2", S, "D2", S, "A2", S, "D2", S, "D2", S, "D2", S, "A2", S, "D2", S,
    "A1", S, "A1", S, "E2", S, "A1", S, "A1", S, "A1", S, "E2", S, "A1", S,
  ],
  noise: [
    _, _, _, _, 1, _, _, _, _, _, _, _, 1, _, _, _,
    _, _, _, _, 1, _, _, _, _, _, _, _, 1, _, _, _,
    2, _, _, _, 2, _, _, _, 2, _, _, _, 2, _, _, _,
    2, _, _, _, 2, _, _, _, 2, _, _, _, 2, _, 2, 2,
  ],
};

// ===========================================================================
// LEVEL-3 — E minor, 126 bpm, driving factory. i–VI–III–VII (Em C G D)
// ===========================================================================
const LEVEL_3: Track = {
  bpm: 126,
  loop: true,
  sq1: [
    "E5", S, "F#5", S, "G5", S, "F#5", S, "E5", S, "D5", S, "E5", S, _, _,
    "G5", S, "F#5", S, "E5", S, "D5", S, "C5", S, "D5", S, "E5", S, _, _,
    "D5", S, "E5", S, "G5", S, "F#5", S, "E5", S, "D5", S, "B4", S, _, _,
    "F#5", S, "E5", S, "F#5", S, "G5", S, "F#5", S, "E5", S, "D5", S, _, _,
  ],
  sq2: [
    "E3", S, "B3", S, "E4", S, "B3", S, "E3", S, "B3", S, "E4", S, "B3", S,
    "C3", S, "E3", S, "G3", S, "E3", S, "C3", S, "E3", S, "G3", S, "E3", S,
    "G3", S, "B3", S, "D4", S, "B3", S, "G3", S, "B3", S, "D4", S, "B3", S,
    "D3", S, "F#3", S, "A3", S, "F#3", S, "D3", S, "F#3", S, "A3", S, "F#3", S,
  ],
  tri: [
    "E2", S, "E2", S, "E2", S, "E2", S, "E2", S, "E2", S, "E2", S, "E2", S,
    "C2", S, "C2", S, "C2", S, "C2", S, "C2", S, "C2", S, "C2", S, "C2", S,
    "G2", S, "G2", S, "G2", S, "G2", S, "G2", S, "G2", S, "G2", S, "G2", S,
    "D2", S, "D2", S, "D2", S, "D2", S, "D2", S, "D2", S, "D2", S, "D2", S,
  ],
  noise: [
    2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1,
    2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1,
    2, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1,
    2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 2, 2,
  ],
};

// ===========================================================================
// LEVEL-4 — A minor, 84 bpm, sparse archive (long rests). i–VI–iv–V
// ===========================================================================
const LEVEL_4: Track = {
  bpm: 84,
  loop: true,
  sq1: [
    "E4", S, S, S, "A4", S, S, S, "B4", S, "C5", S, _, _, _, _,
    "C5", S, S, S, "A4", S, S, S, _, _, _, _, _, _, _, _,
    "D5", S, S, S, "C5", S, "B4", S, "A4", S, S, S, _, _, _, _,
    "B4", S, S, S, "A4", S, S, S, "G#4", S, S, S, _, _, _, _,
  ],
  sq2: [
    "C4", S, S, S, S, S, S, S, "E4", S, S, S, S, S, S, S,
    "A3", S, S, S, S, S, S, S, "C4", S, S, S, S, S, S, S,
    "F4", S, S, S, S, S, S, S, "D4", S, S, S, S, S, S, S,
    "B3", S, S, S, S, S, S, S, "G#3", S, S, S, S, S, S, S,
  ],
  tri: [
    "A2", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
    "F2", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
    "D2", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
    "E2", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
  ],
  noise: [
    2, _, _, _, _, _, _, _, 1, _, _, _, _, _, _, _,
    2, _, _, _, _, _, _, _, 1, _, _, _, _, _, _, _,
    2, _, _, _, _, _, _, _, 1, _, _, _, _, _, _, _,
    2, _, _, _, _, _, _, _, 1, _, _, _, _, _, 1, _,
  ],
};

// ===========================================================================
// BOSS — D minor (harmonic), 140 bpm, aggressive. i–iv–VI–V
// ===========================================================================
const BOSS: Track = {
  bpm: 140,
  loop: true,
  sq1: [
    "A4", S, "D5", S, "F5", S, "E5", S, "D5", S, "C#5", S, "D5", S, _, _,
    "D5", S, "G5", S, "F5", S, "D5", S, "A#4", S, "A4", S, "G4", S, _, _,
    "F5", S, "E5", S, "D5", S, "C5", S, "A#4", S, "C5", S, "D5", S, _, _,
    "E5", S, "D5", S, "C#5", S, "E5", S, "A4", S, "C#5", S, "A4", S, _, _,
  ],
  sq2: [
    "D3", S, "A3", S, "D4", S, "A3", S, "D3", S, "A3", S, "D4", S, "A3", S,
    "G3", S, "A#3", S, "D4", S, "A#3", S, "G3", S, "A#3", S, "D4", S, "A#3", S,
    "A#3", S, "D4", S, "F4", S, "D4", S, "A#3", S, "D4", S, "F4", S, "D4", S,
    "A3", S, "C#4", S, "E4", S, "C#4", S, "A3", S, "C#4", S, "E4", S, "C#4", S,
  ],
  tri: [
    "D2", S, "D2", S, "A2", S, "A2", S, "D2", S, "D2", S, "A2", S, "A2", S,
    "G2", S, "G2", S, "D3", S, "D3", S, "G2", S, "G2", S, "D3", S, "D3", S,
    "A#2", S, "A#2", S, "F2", S, "F2", S, "A#2", S, "A#2", S, "F2", S, "F2", S,
    "A2", S, "A2", S, "E2", S, "E2", S, "A2", S, "A2", S, "E2", S, "E2", S,
  ],
  noise: [
    2, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 1,
    2, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 1,
    2, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 1,
    2, 1, 2, 1, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2,
  ],
};

// ===========================================================================
// CASTLE — C# minor, 92 bpm, ominous, low tri. i–VI–III–V
// ===========================================================================
const CASTLE: Track = {
  bpm: 92,
  loop: true,
  sq1: [
    "E4", S, "F#4", S, "G#4", S, "F#4", S, "E4", S, "D#4", S, "E4", S, _, _,
    "E4", S, "G#4", S, "A4", S, "G#4", S, "E4", S, "C#4", S, "E4", S, _, _,
    "B4", S, "A4", S, "G#4", S, "F#4", S, "E4", S, "F#4", S, "G#4", S, _, _,
    "G#4", S, "A4", S, "B4", S, "C5", S, "B4", S, "A4", S, "G#4", S, _, _,
  ],
  sq2: [
    "C#3", S, "E3", S, "G#3", S, "E3", S, "C#3", S, "E3", S, "G#3", S, "E3", S,
    "A2", S, "C#3", S, "E3", S, "C#3", S, "A2", S, "C#3", S, "E3", S, "C#3", S,
    "E3", S, "G#3", S, "B3", S, "G#3", S, "E3", S, "G#3", S, "B3", S, "G#3", S,
    "G#2", S, "C3", S, "D#3", S, "C3", S, "G#2", S, "C3", S, "D#3", S, "C3", S,
  ],
  tri: [
    "C#2", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
    "A1", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
    "E2", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
    "G#1", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
  ],
  noise: [
    2, _, _, _, _, _, 1, _, 2, _, _, _, _, _, 1, _,
    2, _, _, _, _, _, 1, _, 2, _, _, _, _, _, 1, _,
    2, _, _, _, _, _, 1, _, 2, _, _, _, _, _, 1, _,
    2, _, _, _, 1, _, 1, _, 2, _, _, _, 2, _, 2, _,
  ],
};

// ===========================================================================
// DEVIL-1 — B minor, 132 bpm. i–VI–III–V (Bm G D F#). Master motif.
// devil-2 and devil-3 are literal transforms of this sq1.
// ===========================================================================
const DEVIL_1: Track = {
  bpm: 132,
  loop: true,
  sq1: [
    "F#4", S, "A4", S, "B4", S, "C#5", S, "D5", S, "C#5", S, "B4", S, _, _,
    "D5", S, "C#5", S, "B4", S, "A4", S, "B4", S, "D5", S, "B4", S, _, _,
    "A4", S, "B4", S, "C#5", S, "D5", S, "F#5", S, "D5", S, "A4", S, _, _,
    "E5", S, "D5", S, "C#5", S, "B4", S, "A#4", S, "B4", S, "F#4", S, _, _,
  ],
  sq2: [
    "B3", S, "D4", S, "F#4", S, "D4", S, "B3", S, "D4", S, "F#4", S, "D4", S,
    "G3", S, "B3", S, "D4", S, "B3", S, "G3", S, "B3", S, "D4", S, "B3", S,
    "D3", S, "F#3", S, "A3", S, "F#3", S, "D3", S, "F#3", S, "A3", S, "F#3", S,
    "F#3", S, "A#3", S, "C#4", S, "A#3", S, "F#3", S, "A#3", S, "C#4", S, "A#3", S,
  ],
  tri: [
    "B1", S, "B1", S, "F#2", S, "F#2", S, "B1", S, "B1", S, "F#2", S, "F#2", S,
    "G1", S, "G1", S, "D2", S, "D2", S, "G1", S, "G1", S, "D2", S, "D2", S,
    "D2", S, "D2", S, "A2", S, "A2", S, "D2", S, "D2", S, "A2", S, "A2", S,
    "F#2", S, "F#2", S, "C#3", S, "C#3", S, "F#2", S, "F#2", S, "C#3", S, "C#3", S,
  ],
  noise: [
    2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1,
    2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1,
    2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1,
    2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1, 2, 2,
  ],
};

// DEVIL-2 — SAME motif, 152 bpm, denser noise.
const DEVIL_2: Track = {
  bpm: 152,
  loop: true,
  sq1: DEVIL_1.sq1,
  sq2: DEVIL_1.sq2,
  tri: DEVIL_1.tri,
  noise: [
    2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1,
    2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1,
    2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1,
    2, 2, 1, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  ],
};

// DEVIL-3 — SAME motif transposed up a perfect 4th (+5), 160 bpm (E minor).
const DEVIL_3: Track = {
  bpm: 160,
  loop: true,
  sq1: transpose(DEVIL_1.sq1, 5),
  sq2: transpose(DEVIL_1.sq2, 5),
  tri: transpose(DEVIL_1.tri, 5),
  noise: [
    2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1,
    2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1,
    2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  ],
};

// ===========================================================================
// VICTORY — C major fanfare, 120 bpm, loop:false. I–V–IV–I
// ===========================================================================
const VICTORY: Track = {
  bpm: 120,
  loop: false,
  sq1: [
    "C5", S, "E5", S, "G5", S, "C6", S, "G5", S, "E5", S, "C5", S, _, _,
    "G5", S, "F5", S, "E5", S, "D5", S, "E5", S, "F5", S, "G5", S, _, _,
    "A5", S, "G5", S, "F5", S, "E5", S, "F5", S, "G5", S, "A5", S, _, _,
    "G5", S, "A5", S, "B5", S, "C6", S, S, S, S, S, S, S, _, _,
  ],
  sq2: [
    "C4", S, "E4", S, "G4", S, "E4", S, "C4", S, "E4", S, "G4", S, "E4", S,
    "G3", S, "B3", S, "D4", S, "B3", S, "G3", S, "B3", S, "D4", S, "B3", S,
    "F3", S, "A3", S, "C4", S, "A3", S, "F3", S, "A3", S, "C4", S, "A3", S,
    "G4", S, "E4", S, "G4", S, "C5", S, S, S, S, S, S, S, _, _,
  ],
  tri: [
    "C3", S, S, S, "C2", S, S, S, "G2", S, S, S, "C2", S, S, S,
    "G2", S, S, S, "D2", S, S, S, "G2", S, S, S, "D3", S, S, S,
    "F2", S, S, S, "C3", S, S, S, "F2", S, S, S, "A2", S, S, S,
    "C2", S, S, S, "G2", S, S, S, "C2", S, S, S, S, S, S, S,
  ],
  noise: [
    2, _, 2, _, 1, _, 1, _, 2, _, 2, _, 1, _, 2, 2,
    2, _, 1, _, 2, _, 1, _, 2, _, 1, _, 2, _, 1, _,
    2, _, 1, _, 2, _, 1, _, 2, _, 1, _, 2, _, 2, 2,
    2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2,
  ],
};

// ===========================================================================
// CHEST — F major slow arps, 72 bpm, loop:false. I–IV–V–I sparkle
// ===========================================================================
const CHEST: Track = {
  bpm: 72,
  loop: false,
  sq1: [
    "F5", S, S, S, "A5", S, S, S, "C6", S, S, S, "A5", S, S, S,
    "D5", S, S, S, "F5", S, S, S, "A#5", S, S, S, "F5", S, S, S,
    "C5", S, S, S, "E5", S, S, S, "G5", S, S, S, "E5", S, S, S,
    "F5", S, S, S, "A5", S, S, S, "C6", S, S, S, S, S, S, S,
  ],
  sq2: [
    "C4", S, S, S, S, S, S, S, "A3", S, S, S, S, S, S, S,
    "D4", S, S, S, S, S, S, S, "A#3", S, S, S, S, S, S, S,
    "G3", S, S, S, S, S, S, S, "E3", S, S, S, S, S, S, S,
    "A3", S, S, S, S, S, S, S, "C4", S, S, S, S, S, S, S,
  ],
  tri: [
    "F2", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
    "A#2", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
    "C2", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
    "F2", S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,
  ],
  noise: [
    2, _, _, _, 1, _, _, _, 1, _, _, _, 1, _, _, _,
    _, _, 1, _, _, _, 1, _, _, _, 1, _, _, _, 1, _,
    _, _, 1, _, _, _, 1, _, _, _, 1, _, _, _, 1, _,
    _, _, 1, _, _, _, 1, _, 2, _, _, _, _, _, _, _,
  ],
};

// Placeholder theme for the real-time rework bosses (amendment §5). Each boss
// task (35–45) REPLACES its key with an authored theme; this keeps the exhaustive
// Record<TrackId, Track> valid and synth.playTrack safe until then. A quiet
// bass+kick pulse so an accidental early play is audible-but-clearly-temp.
function placeholder(root: Step): Track {
  const mk = <T>(f: (i: number) => T): T[] => Array.from({ length: 64 }, (_v, i) => f(i));
  return {
    bpm: 120,
    loop: true,
    sq1: mk((): Step => null),
    sq2: mk((): Step => null),
    tri: mk((i): Step => (i % 8 === 0 ? root : null)),
    noise: mk((i): 0 | 1 | 2 | null => (i % 8 === 0 ? 2 : null)),
  };
}

// Realtime rework boss themes (amendment §5; music forged for Tasks 35/37).
const BROKEN_KING: Track = {
  bpm: 80,
  loop: true,
  sq1: [
    "G4", S, S, S, "C5", S, S, S, "D#5", S, S, "D5", "C5", S, S, S,
    "C5", S, S, S, "G#4", S, S, S, "F4", S, S, S, "G4", S, S, S,
    "G#4", S, S, S, "C5", S, S, S, "D#5", S, S, S, "C5", S, "G#4", S,
    "D5", S, S, S, "B4", S, S, S, "G4", S, S, S, "D4", S, S, S,
  ],
  sq2: [
    "C4", S, S, S, "D#4", S, S, S, "G4", S, S, S, "D#4", S, S, S,
    "C4", S, S, S, "F4", S, S, S, "G#4", S, S, S, "F4", S, S, S,
    "G#3", S, S, S, "C4", S, S, S, "D#4", S, S, S, "C4", S, S, S,
    "G3", S, S, S, "B3", S, S, S, "D4", S, S, S, "B3", S, S, S,
  ],
  tri: [
    "C2", S, S, S, S, S, S, S, "G2", S, S, S, S, S, S, S,
    "F2", S, S, S, S, S, S, S, "C3", S, S, S, S, S, S, S,
    "G#1", S, S, S, S, S, S, S, "D#2", S, S, S, S, S, S, S,
    "G1", S, S, S, S, S, S, S, "D2", S, S, S, S, S, S, S,
  ],
  noise: [
    2, _, _, _, _, _, _, _, 2, _, _, _, _, _, 1, _,
    2, _, _, _, _, _, _, _, 2, _, _, _, _, _, 1, _,
    2, _, _, _, _, _, _, _, 2, _, _, _, _, _, 1, _,
    2, _, _, _, _, _, 1, _, 2, _, _, _, 2, _, 2, 2,
  ],
};

const HOLLOW_GIANT: Track = {
  bpm: 72,
  loop: true,
  sq1: [
    _, _, _, _, "E4", S, S, S, "A4", S, S, S, "C5", S, S, S,
    _, _, _, _, "C5", S, S, S, S, S, "A4", S, "F4", S, S, S,
    _, _, _, _, "D5", S, S, S, "C5", S, S, S, "A4", S, S, S,
    _, _, _, _, "B4", S, S, S, "G#4", S, S, S, "E4", S, S, S,
  ],
  sq2: [
    "A3", S, S, S, S, S, S, S, "E4", S, S, S, S, S, S, S,
    "A3", S, S, S, S, S, S, S, "C4", S, S, S, S, S, S, S,
    "A3", S, S, S, S, S, S, S, "D4", S, S, S, S, S, S, S,
    "G#3", S, S, S, S, S, S, S, "B3", S, S, S, S, S, S, S,
  ],
  tri: [
    "A1", S, "A2", S, S, S, S, S, "A1", S, "A2", S, S, S, S, S,
    "F1", S, "F2", S, S, S, S, S, "F1", S, "F2", S, S, S, S, S,
    "D2", S, "D3", S, S, S, S, S, "D2", S, "D3", S, S, S, S, S,
    "E1", S, "E2", S, S, S, S, S, "E1", S, "E2", S, S, S, S, S,
  ],
  noise: [
    2, _, _, _, _, _, _, _, 2, _, _, _, _, _, _, _,
    2, _, _, _, _, _, _, _, 2, _, _, _, _, _, _, _,
    2, _, _, _, _, _, _, _, 2, _, _, _, _, _, _, _,
    2, _, _, _, _, _, _, _, 2, _, _, _, 2, _, 2, _,
  ],
};

export const TRACKS: Record<import("../ids").TrackId, Track> = {
  title: TITLE,
  overworld: OVERWORLD,
  "level-1": LEVEL_1,
  "level-2": LEVEL_2,
  "level-3": LEVEL_3,
  "level-4": LEVEL_4,
  boss: BOSS,
  castle: CASTLE,
  "devil-1": DEVIL_1,
  "devil-2": DEVIL_2,
  "devil-3": DEVIL_3,
  victory: VICTORY,
  chest: CHEST,
  // real-time rework boss themes — placeholders until their boss tasks author them.
  "broken-king": BROKEN_KING,
  "hollow-giant": HOLLOW_GIANT,
  "one-eyed-dealer": placeholder("E2"),
  scythebound: placeholder("D2"),
  "veiled-archer": placeholder("G2"),
  "devil-duel": placeholder("F2"),
  "devil-arsenal": placeholder("F2"),
};
