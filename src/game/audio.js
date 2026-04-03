// ─────────────────────────────────────────────────────────────────────────────
// AUDIO ENGINE — Web Audio API synthesized sounds (no external files)
// ─────────────────────────────────────────────────────────────────────────────

let audioCtx = null;
let masterGain = null;
let enabled = true;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function setAudioEnabled(val) { enabled = val; }
export function isAudioEnabled() { return enabled; }

function playTone({ freq = 440, type = 'sine', duration = 0.15, volume = 0.5,
                    attack = 0.005, decay = 0.1, freqEnd = null, detune = 0 }) {
  if (!enabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(masterGain);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.detune.value = detune;
    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.02);
  } catch (e) { /* ignore audio errors */ }
}

function playNoise({ duration = 0.08, volume = 0.3, filterFreq = 2000, filterQ = 1 }) {
  if (!enabled) return;
  try {
    const ctx = getCtx();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    const gain = ctx.createGain();
    source.connect(filter); filter.connect(gain); gain.connect(masterGain);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.start(); source.stop(ctx.currentTime + duration + 0.02);
  } catch (e) { /* ignore audio errors */ }
}

// ── ABILITY SOUNDS ────────────────────────────────────────────────────────────

export function soundShoot() {
  try {
    // Quick mechanical click + high freq sweep
    playNoise({ duration: 0.04, volume: 0.4, filterFreq: 3000 });
    playTone({ freq: 800, type: 'square', duration: 0.08, volume: 0.2, freqEnd: 400, attack: 0.002 });
  } catch (e) { /* ignore */ }
}

export function soundCritShoot() {
  try {
    // Heavier crack
    playNoise({ duration: 0.06, volume: 0.6, filterFreq: 4000, filterQ: 2 });
    playTone({ freq: 1200, type: 'sawtooth', duration: 0.12, volume: 0.35, freqEnd: 200, attack: 0.002 });
    // Metallic ring
    setTimeout(() => playTone({ freq: 900, type: 'sine', duration: 0.2, volume: 0.15, decay: 0.15 }), 40);
  } catch (e) { /* ignore */ }
}

export function soundReload() {
  try {
    // Two-click reload sound
    playNoise({ duration: 0.03, volume: 0.3, filterFreq: 1500 });
    setTimeout(() => playNoise({ duration: 0.05, volume: 0.4, filterFreq: 2500 }), 80);
    playTone({ freq: 300, type: 'square', duration: 0.06, volume: 0.15, attack: 0.002 });
  } catch (e) { /* ignore */ }
}

export function soundWBeam() {
  try {
    // Sustained energy beam (rising then holding)
    playTone({ freq: 200, type: 'sawtooth', duration: 0.4, volume: 0.25, freqEnd: 600, attack: 0.02 });
    playTone({ freq: 150, type: 'sine', duration: 0.5, volume: 0.2, freqEnd: 300, attack: 0.01 });
    setTimeout(() => playTone({ freq: 800, type: 'sine', duration: 0.2, volume: 0.15 }), 200);
  } catch (e) { /* ignore */ }
}

export function soundETrap() {
  try {
    // Soft click + energy set
    playNoise({ duration: 0.03, volume: 0.25, filterFreq: 1000 });
    playTone({ freq: 400, type: 'sine', duration: 0.15, volume: 0.15, freqEnd: 600, attack: 0.01 });
  } catch (e) { /* ignore */ }
}

export function soundTrapExplode() {
  try {
    // Big bang
    playNoise({ duration: 0.15, volume: 0.7, filterFreq: 800, filterQ: 0.5 });
    playTone({ freq: 100, type: 'sawtooth', duration: 0.3, volume: 0.4, freqEnd: 30, attack: 0.005 });
    setTimeout(() => playTone({ freq: 300, type: 'sine', duration: 0.2, volume: 0.2, freqEnd: 100 }), 50);
  } catch (e) { /* ignore */ }
}

export function soundRCharge() {
  try {
    // Rising charge tone
    playTone({ freq: 200, type: 'sine', duration: 1.5, volume: 0.15, freqEnd: 800, attack: 0.1 });
  } catch (e) { /* ignore */ }
}

export function soundRRelease() {
  try {
    // Massive boom
    playNoise({ duration: 0.25, volume: 0.8, filterFreq: 600, filterQ: 0.3 });
    playTone({ freq: 80, type: 'sawtooth', duration: 0.5, volume: 0.5, freqEnd: 20, attack: 0.01 });
    playTone({ freq: 1000, type: 'sine', duration: 0.15, volume: 0.3, freqEnd: 200, attack: 0.005 });
    setTimeout(() => playTone({ freq: 400, type: 'triangle', duration: 0.3, volume: 0.2, freqEnd: 100 }), 100);
  } catch (e) { /* ignore */ }
}

// ── HIT SOUNDS ────────────────────────────────────────────────────────────────

export function soundEnemyHit() {
  try {
    playNoise({ duration: 0.05, volume: 0.35, filterFreq: 1800, filterQ: 1.5 });
    playTone({ freq: 250, type: 'square', duration: 0.06, volume: 0.1, freqEnd: 180, attack: 0.002 });
  } catch (e) { /* ignore */ }
}

export function soundPlayerHit() {
  try {
    playNoise({ duration: 0.08, volume: 0.5, filterFreq: 500, filterQ: 0.8 });
    playTone({ freq: 150, type: 'sine', duration: 0.2, volume: 0.3, freqEnd: 60, attack: 0.005 });
  } catch (e) { /* ignore */ }
}

export function soundEnemyDeath() {
  try {
    // Descending sweep
    playTone({ freq: 600, type: 'sawtooth', duration: 0.8, volume: 0.4, freqEnd: 40, attack: 0.01 });
    playNoise({ duration: 0.12, volume: 0.5, filterFreq: 1000 });
    setTimeout(() => playTone({ freq: 440, type: 'sine', duration: 0.4, volume: 0.2, freqEnd: 110 }), 150);
  } catch (e) { /* ignore */ }
}

export function soundStun() {
  try {
    // Electrical zap
    playTone({ freq: 800, type: 'square', duration: 0.15, volume: 0.3, freqEnd: 400, detune: 100, attack: 0.002 });
    playNoise({ duration: 0.1, volume: 0.4, filterFreq: 5000, filterQ: 3 });
  } catch (e) { /* ignore */ }
}

// ── UI SOUNDS ─────────────────────────────────────────────────────────────────

export function soundLevelUp() {
  try {
    // Ascending triumphant tones
    [261, 330, 392, 523].forEach((f, i) => {
      setTimeout(() => playTone({ freq: f, type: 'sine', duration: 0.3, volume: 0.25, attack: 0.01 }), i * 80);
    });
  } catch (e) { /* ignore */ }
}

export function soundVictory() {
  try {
    // Pentakill fanfare
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone({ freq: f, type: 'sine', duration: 0.5, volume: 0.3, attack: 0.02 }), i * 120);
    });
    setTimeout(() => {
      try {
        [1047, 784, 1047].forEach((f, i) => {
          setTimeout(() => playTone({ freq: f, type: 'triangle', duration: 0.3, volume: 0.2, attack: 0.01 }), i * 80);
        });
      } catch (e) { /* ignore */ }
    }, 600);
  } catch (e) { /* ignore */ }
}

export function soundMenuClick() {
  try {
    playTone({ freq: 660, type: 'sine', duration: 0.08, volume: 0.15, freqEnd: 880, attack: 0.002 });
  } catch (e) { /* ignore */ }
}

export function soundEnemySpawn() {
  try {
    // Ominous arrival
    playTone({ freq: 80, type: 'sawtooth', duration: 0.6, volume: 0.3, freqEnd: 200, attack: 0.05 });
    playNoise({ duration: 0.1, volume: 0.3, filterFreq: 300, filterQ: 1 });
  } catch (e) { /* ignore */ }
}

// ── LEAGUE-STYLE CINEMATIC SOUNDS ─────────────────────────────────────────────

export function soundLoLVictory() {
  if (!enabled) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Snare intro roll
    [0, 0.08, 0.16, 0.22].forEach(t => {
      try {
        const bufSize = Math.floor(ctx.sampleRate * 0.08);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3500;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.45, now + t);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.1);
        src.connect(filter); filter.connect(g); g.connect(masterGain);
        src.start(now + t); src.stop(now + t + 0.15);
      } catch (e) { /* ignore */ }
    });

    // Brass fanfare: G4 → B4 → D5 → G5
    [
      { freq: 392, t: 0.3, dur: 0.25 },
      { freq: 494, t: 0.55, dur: 0.25 },
      { freq: 587, t: 0.8, dur: 0.25 },
      { freq: 784, t: 1.05, dur: 0.7 },
    ].forEach(({ freq, t, dur }) => {
      try {
        [{ type: 'sawtooth', vol: 0.18 }, { type: 'triangle', vol: 0.09, mult: 2 }].forEach(({ type, vol, mult = 1 }) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = type;
          osc.frequency.value = freq * mult;
          osc.connect(g); g.connect(masterGain);
          g.gain.setValueAtTime(0, now + t);
          g.gain.linearRampToValueAtTime(vol, now + t + 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, now + t + dur);
          osc.start(now + t); osc.stop(now + t + dur + 0.05);
        });
      } catch (e) { /* ignore */ }
    });

    // Big triumphant G major chord (G4 B4 D5 G5 B5)
    [392, 494, 587, 784, 988].forEach((freq, i) => {
      try {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i < 3 ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        osc.connect(g); g.connect(masterGain);
        const s = now + 1.85;
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(0.14 - i * 0.02, s + 0.09);
        g.gain.setValueAtTime(0.14 - i * 0.02, s + 1.4);
        g.gain.exponentialRampToValueAtTime(0.001, s + 2.4);
        osc.start(s); osc.stop(s + 2.5);
      } catch (e) { /* ignore */ }
    });

    // Shimmer highs on chord hit
    [1568, 1976, 2349].forEach((freq, i) => {
      try {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(g); g.connect(masterGain);
        const s = now + 1.9 + i * 0.1;
        g.gain.setValueAtTime(0, s);
        g.gain.linearRampToValueAtTime(0.04, s + 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, s + 2.0);
        osc.start(s); osc.stop(s + 2.1);
      } catch (e) { /* ignore */ }
    });

    // Deep bass hit
    try {
      const bass = ctx.createOscillator();
      const g = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.value = 98;
      bass.connect(g); g.connect(masterGain);
      g.gain.setValueAtTime(0, now + 1.85);
      g.gain.linearRampToValueAtTime(0.5, now + 1.9);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.7);
      bass.start(now + 1.85); bass.stop(now + 2.8);
    } catch (e) { /* ignore */ }

  } catch (e) { /* ignore */ }
}

export function soundLoLDefeat() {
  if (!enabled) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Heavy opening thud
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);
      osc.connect(g); g.connect(masterGain);
      g.gain.setValueAtTime(0.6, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now); osc.stop(now + 0.55);
    } catch (e) { /* ignore */ }

    // Low noise burst
    try {
      const bufSize = Math.floor(ctx.sampleRate * 0.3);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 180;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      src.connect(filter); filter.connect(g); g.connect(masterGain);
      src.start(now); src.stop(now + 0.4);
    } catch (e) { /* ignore */ }

    // Deep bass drone
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 55;
      osc.connect(g); g.connect(masterGain);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.3, now + 0.5);
      g.gain.setValueAtTime(0.3, now + 3.2);
      g.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
      osc.start(now); osc.stop(now + 4.6);
    } catch (e) { /* ignore */ }

    // Sad descending melody: D4 C4 A♭3 F3
    [
      { freq: 294, t: 0.4, dur: 0.75 },
      { freq: 262, t: 1.15, dur: 0.75 },
      { freq: 208, t: 1.9, dur: 0.75 },
      { freq: 175, t: 2.65, dur: 1.3 },
    ].forEach(({ freq, t, dur }) => {
      try {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(g); g.connect(masterGain);
        g.gain.setValueAtTime(0, now + t);
        g.gain.linearRampToValueAtTime(0.14, now + t + 0.1);
        g.gain.setValueAtTime(0.14, now + t + dur - 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + dur);
        osc.start(now + t); osc.stop(now + t + dur + 0.05);
      } catch (e) { /* ignore */ }
    });

    // D minor chord pad (D3 F3 A3)
    [147, 175, 220].forEach((freq, i) => {
      try {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(g); g.connect(masterGain);
        g.gain.setValueAtTime(0, now + 0.6);
        g.gain.linearRampToValueAtTime(0.09 - i * 0.02, now + 0.9);
        g.gain.setValueAtTime(0.09 - i * 0.02, now + 2.8);
        g.gain.exponentialRampToValueAtTime(0.001, now + 4.2);
        osc.start(now + 0.6); osc.stop(now + 4.3);
      } catch (e) { /* ignore */ }
    });

  } catch (e) { /* ignore */ }
}
