// features/adventure/audio/sfx.ts
// Fire-and-forget sound effects. Each SFX creates short-lived nodes routed to
// `dest` (the synth master gain, so mute/volume apply) and self-cleans via
// osc.stop(). No AudioContext is created here — the synth owns it.

import type { SfxId } from "../ids";
import { noteToFreq } from "./notes";

export interface SfxContext {
  ctx: AudioContext;
  dest: AudioNode;
  noiseBuffer: AudioBuffer;
}

/** One transient oscillator with an AD envelope and optional pitch bend. */
function tone(
  sc: SfxContext,
  type: OscillatorType,
  f0: number,
  f1: number,
  dur: number,
  peak: number,
  when = 0,
): void {
  const { ctx } = sc;
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) osc.frequency.linearRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.005);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(sc.dest);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

/** A transient noise burst, optionally sweeping a highpass filter (dash). */
function noise(
  sc: SfxContext,
  dur: number,
  peak: number,
  when = 0,
  sweep = false,
): void {
  const { ctx } = sc;
  const t = ctx.currentTime + when;
  const src = ctx.createBufferSource();
  src.buffer = sc.noiseBuffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.004);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  if (sweep) {
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.setValueAtTime(200, t);
    f.frequency.linearRampToValueAtTime(4000, t + dur);
    src.connect(f);
    f.connect(g);
  } else {
    src.connect(g);
  }
  g.connect(sc.dest);
  src.start(t);
  src.stop(t + dur + 0.03);
}

export function playSfx(sc: SfxContext, id: SfxId): void {
  switch (id) {
    case "jump":
      tone(sc, "square", 300, 600, 0.08, 0.22);
      break;
    case "stomp":
      noise(sc, 0.06, 0.3);
      break;
    case "slash":
      // Player sword swing (Task 32): a short airy swipe + a bright down-whoosh.
      noise(sc, 0.05, 0.2, 0, true);
      tone(sc, "square", 900, 380, 0.06, 0.16);
      break;
    // ── Task 33 realtime cues (amendment §5; boss tasks may refine) ─────────
    case "boss-hit":
      // A heavier, darker thud than the player "damage" bend.
      tone(sc, "square", 180, 90, 0.1, 0.3);
      noise(sc, 0.05, 0.22);
      break;
    case "telegraph":
      // Quiet rising warn — plays under every boss wind-up.
      tone(sc, "triangle", 300, 520, 0.09, 0.14);
      break;
    case "expose":
      // Weak-point revealed: a bright open fifth blooming upward.
      tone(sc, "triangle", noteToFreq("A4"), noteToFreq("E5"), 0.16, 0.2);
      break;
    case "seal":
      // Truth/seal activation: solemn low-to-high triangle sweep + shimmer.
      tone(sc, "triangle", noteToFreq("C4"), noteToFreq("C5"), 0.22, 0.22);
      tone(sc, "square", noteToFreq("G5"), noteToFreq("G5"), 0.06, 0.12, 0.18);
      break;
    case "mask-break":
      // Sharp metallic crack + falling debris hiss.
      tone(sc, "square", 1400, 500, 0.07, 0.24);
      noise(sc, 0.09, 0.2, 0.05);
      break;
    case "heart-hit":
      // Deep pulse-thump with a soft after-beat.
      tone(sc, "sine", 90, 60, 0.14, 0.34);
      tone(sc, "sine", 120, 80, 0.08, 0.2, 0.16);
      break;
    case "weapon-swap":
      // Quick materialization sweep — up-chirp with a metallic edge.
      tone(sc, "sawtooth", 220, 880, 0.09, 0.16);
      tone(sc, "square", 1200, 1200, 0.03, 0.1, 0.08);
      break;
    case "key-drop":
      // Bright falling chime, then a small bounce blip.
      tone(sc, "triangle", noteToFreq("E6"), noteToFreq("B5"), 0.12, 0.22);
      tone(sc, "triangle", noteToFreq("E5"), noteToFreq("E5"), 0.05, 0.14, 0.16);
      break;
    case "parry":
      tone(sc, "triangle", 1200, 1200, 0.05, 0.26);
      tone(sc, "square", 1800, 1800, 0.03, 0.18);
      break;
    case "type":
      tone(sc, "square", 2000, 2000, 0.015, 0.12);
      break;
    case "damage":
      tone(sc, "square", 110, 70, 0.12, 0.3); // down-bend
      break;
    case "collect":
      tone(sc, "square", noteToFreq("C6"), noteToFreq("C6"), 0.06, 0.2);
      tone(sc, "square", noteToFreq("E6"), noteToFreq("E6"), 0.06, 0.2, 0.06);
      break;
    case "chest": {
      const arp = ["C4", "E4", "G4", "C5"];
      arp.forEach((n, i) => {
        const f = noteToFreq(n);
        tone(sc, "triangle", f, f, 0.12, 0.22, i * 0.1); // ~400ms total
      });
      break;
    }
    case "select":
      tone(sc, "square", 800, 800, 0.025, 0.18);
      break;
    case "dash":
      noise(sc, 0.09, 0.24, 0, true);
      break;
    case "error":
      tone(sc, "sawtooth", 150, 150, 0.15, 0.24); // saw-ish
      break;
    case "crit":
      tone(sc, "square", noteToFreq("C6"), noteToFreq("C6"), 0.06, 0.22);
      tone(sc, "square", noteToFreq("G6"), noteToFreq("G6"), 0.06, 0.22, 0.07);
      break;
  }
}
