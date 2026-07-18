// features/adventure/audio/synth.ts
// WebAudio chiptune engine. No dependencies. SSR-safe: no AudioContext is
// created until unlock() runs inside a user gesture. Exposes the `audio`
// singleton other features drive.
//
// Voices: two square oscillators (sq1 melody, sq2 harmony), one triangle
// (tri bass), one looping white-noise source (drums). Each pitched voice is a
// single continuously-running oscillator whose frequency is retuned per note
// and whose gain follows an ADSR envelope. A lookahead scheduler
// (setInterval 25ms, scheduling 100ms ahead of AudioContext.currentTime)
// walks the track step arrays.

import type { TrackId, SfxId } from "../ids";
import { noteToFreq, stepDurationMs, type Step } from "./notes";
import { TRACKS, type Track } from "./tracks";
import { playSfx, type SfxContext } from "./sfx";

// ADSR (seconds) — per brief: a 5ms, d 40ms, s 0.6, r 30ms.
const ATTACK = 0.005;
const DECAY = 0.04;
const SUSTAIN = 0.6;
const RELEASE = 0.03;

// Scheduler constants.
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;
const START_DELAY_S = 0.06;

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
  peak: number;
  on: boolean;
  sustain: number;
}

interface Playing {
  track: Track;
  step: number;
  nextTime: number;
  ended: boolean;
}

type WithWebkit = { webkitAudioContext?: typeof AudioContext };

class ChiptuneAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sq1: Voice | null = null;
  private sq2: Voice | null = null;
  private tri: Voice | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private noiseGain: GainNode | null = null;

  private volume = 0.7;
  private muted = false;

  private playing: Playing | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  // --- public contract -----------------------------------------------------

  /** Create/resume the AudioContext. Safe to call repeatedly. SSR no-op. */
  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC =
        window.AudioContext ?? (window as unknown as WithWebkit).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.buildGraph();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  playTrack(id: TrackId): void {
    this.unlock();
    if (!this.ctx) return;
    this.stopTrack();
    this.playing = {
      track: TRACKS[id],
      step: 0,
      nextTime: this.ctx.currentTime + START_DELAY_S,
      ended: false,
    };
    this.timer = setInterval(this.tick, LOOKAHEAD_MS);
    this.tick();
  }

  stopTrack(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.playing = null;
    if (this.ctx) this.releaseAll(this.ctx.currentTime);
  }

  sfx(id: SfxId): void {
    if (!this.ctx || !this.master || !this.noiseBuffer) return; // no-op before unlock
    const sc: SfxContext = {
      ctx: this.ctx,
      dest: this.master,
      noiseBuffer: this.noiseBuffer,
    };
    playSfx(sc, id);
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    this.applyMasterGain();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.applyMasterGain();
  }

  getState(): { volume: number; muted: boolean } {
    return { volume: this.volume, muted: this.muted };
  }

  // --- graph setup ---------------------------------------------------------

  private buildGraph(): void {
    const ctx = this.ctx!;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    // Soft limiter so summed voices never clip harshly.
    const comp = ctx.createDynamicsCompressor();
    this.master.connect(comp);
    comp.connect(ctx.destination);

    this.sq1 = this.makeVoice("square", 0.2);
    this.sq2 = this.makeVoice("square", 0.13);
    this.tri = this.makeVoice("triangle", 0.26);

    // Drum noise: one looping white-noise buffer gated per hit.
    this.noiseBuffer = this.makeNoiseBuffer(0.2);
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0;
    this.noiseGain.connect(this.master);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    src.connect(this.noiseGain);
    src.start();
  }

  private makeVoice(type: OscillatorType, peak: number): Voice {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = 440;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(this.master!);
    osc.start();
    return { osc, gain, peak, on: false, sustain: 0 };
  }

  private makeNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private applyMasterGain(): void {
    if (!this.master || !this.ctx) return;
    const target = this.muted ? 0 : this.volume;
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.01);
  }

  // --- scheduler -----------------------------------------------------------

  private tick = (): void => {
    const ctx = this.ctx;
    const cur = this.playing;
    if (!ctx || !cur) return;
    const stepDur = stepDurationMs(cur.track.bpm) / 1000;
    const horizon = ctx.currentTime + SCHEDULE_AHEAD_S;

    while (cur.nextTime < horizon) {
      if (cur.step >= cur.track.sq1.length) {
        if (cur.track.loop) {
          cur.step = 0;
        } else {
          cur.ended = true;
          break;
        }
      }
      this.scheduleStep(cur, cur.step, cur.nextTime);
      cur.nextTime += stepDur;
      cur.step++;
    }

    // Non-looping track: tear down once its tail has rung out.
    if (cur.ended && ctx.currentTime > cur.nextTime + 0.3) {
      this.stopTrack();
    }
  };

  private scheduleStep(cur: Playing, step: number, time: number): void {
    this.pitch(this.sq1!, cur.track.sq1[step], time);
    this.pitch(this.sq2!, cur.track.sq2[step], time);
    this.pitch(this.tri!, cur.track.tri[step], time);
    const n = cur.track.noise[step];
    if (n === 1) this.drum(time, false);
    else if (n === 2) this.drum(time, true);
  }

  private pitch(v: Voice, step: Step, time: number): void {
    const g = v.gain.gain;
    if (step === null) {
      if (v.on) {
        g.cancelScheduledValues(time);
        g.setValueAtTime(v.sustain, time);
        g.linearRampToValueAtTime(0.0001, time + RELEASE);
        v.on = false;
      }
      return;
    }
    if (step === "—") return; // sustain: leave the envelope untouched
    // Attack: retune + ADSR.
    v.osc.frequency.setValueAtTime(noteToFreq(step), time);
    const sustainLevel = v.peak * SUSTAIN;
    g.cancelScheduledValues(time);
    g.setValueAtTime(0.0001, time);
    g.linearRampToValueAtTime(v.peak, time + ATTACK);
    g.linearRampToValueAtTime(sustainLevel, time + ATTACK + DECAY);
    v.sustain = sustainLevel;
    v.on = true;
  }

  private drum(time: number, boom: boolean): void {
    if (!this.noiseGain) return;
    const g = this.noiseGain.gain;
    const peak = boom ? 0.34 : 0.14;
    const dur = boom ? 0.13 : 0.03;
    g.cancelScheduledValues(time);
    g.setValueAtTime(0.0001, time);
    g.linearRampToValueAtTime(peak, time + 0.002);
    g.linearRampToValueAtTime(0.0001, time + dur);
  }

  private releaseAll(time: number): void {
    for (const v of [this.sq1, this.sq2, this.tri]) {
      if (!v) continue;
      const g = v.gain.gain;
      g.cancelScheduledValues(time);
      g.setValueAtTime(v.on ? v.sustain : 0.0001, time);
      g.linearRampToValueAtTime(0.0001, time + RELEASE);
      v.on = false;
    }
    if (this.noiseGain) {
      this.noiseGain.gain.cancelScheduledValues(time);
      this.noiseGain.gain.setValueAtTime(0.0001, time);
    }
  }
}

export const audio = new ChiptuneAudio();
