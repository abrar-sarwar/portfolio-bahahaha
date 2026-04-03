import { useState, useEffect, useRef } from 'react';
import SecretOverlay from './SecretOverlay.jsx';

// ── FAST BOOT LINES ───────────────────────────────────────────────────────────
const BOOT_LINES = [
  { text: 'VIRTUOSO BIOS v2.0 — PORTFOLIO ARCHITECTURE', color: '#555' },
  { text: 'CPU: VIRTUOSO-X1 @ 4.20GHz  [8 CORES OK]', color: '#444' },
  { text: 'RAM: 16384MB DDR5  [OK]', color: '#444' },
  { text: 'STORAGE: 2TB NVMe  [OK]', color: '#444' },
  { text: '', gap: 40 },
  { text: 'Loading GRUB bootloader...', color: '#666' },
  { text: 'Mounting /dev/portfolio...', color: '#666' },
  { text: 'fsck /dev/portfolio: clean, 0 errors', color: '#22AA44' },
  { text: '', gap: 30 },
  { text: '[ OK ]  Started Kernel Device Manager', color: '#22BB55' },
  { text: '[ OK ]  Reached target Local Encrypted Volumes', color: '#22BB55' },
  { text: '[ OK ]  Network interfaces configured', color: '#22BB55' },
  { text: '[ OK ]  Portfolio payload service started', color: '#22BB55' },
  { text: '[ OK ]  Champion manifest loaded: THE_VIRTUOSO', color: '#22BB55' },
  { text: '[ OK ]  Threat detection engine online', color: '#22BB55' },
  { text: '[ OK ]  Resume payload compiled and verified', color: '#22BB55' },
  { text: '', gap: 30 },
  { text: 'SCANNING THREAT MATRIX — 5 TARGETS IDENTIFIED', color: '#FFAA22' },
  { text: '  [01]  Script Kiddie      HP:  80   STATUS: HOSTILE', color: '#22FF66' },
  { text: '  [02]  Phantom Threat     HP: 130   STATUS: HOSTILE', color: '#CC55FF' },
  { text: '  [03]  Risk Golem         HP: 170   STATUS: HOSTILE', color: '#FFAA22' },
  { text: '  [04]  Firewall Hydra     HP: 220   STATUS: HOSTILE', color: '#FF5522' },
  { text: '  [05]  Final Audit        HP: 280   STATUS: HOSTILE', color: '#AA33FF' },
  { text: '', gap: 30 },
  { text: '[ WARN ]  Resume access: LOCKED BEHIND ENEMY LINES', color: '#FF4444' },
  { text: '[ WARN ]  Unauthorized access will result in getting hired', color: '#FF6622' },
  { text: '[ INFO ]  Virtuoso protocol: ARMED', color: '#0BC4C4' },
  { text: '[ INFO ]  All systems nominal', color: '#0BC4C4' },
  { text: '', gap: 50 },
  { text: '████████████████████████████████████████████████', color: '#C89B3C44' },
  { text: '        PORTFOLIO.EXE — VIRTUOSO PROTOCOL v2.0   ', color: '#F0E6A0' },
  { text: '████████████████████████████████████████████████', color: '#C89B3C44' },
  { text: '', gap: 60 },
];

// ── SKIP BUTTON ───────────────────────────────────────────────────────────────
function SkipButton({ onSkip }) {
  const [skipping, setSkipping] = useState(false);
  const handle = () => {
    if (skipping) return;
    setSkipping(true);
    setTimeout(onSkip, 600);
  };
  return (
    <div style={{ position: 'fixed', top: '18px', right: '22px', zIndex: 200 }}>
      {skipping ? (
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '13px', color: '#FF5555', letterSpacing: '1px',
          padding: '11px 22px',
          border: '1px solid rgba(255,60,60,0.3)',
          background: 'rgba(80,0,0,0.4)',
        }}>
          dayum you suck ig... 💀
        </div>
      ) : (
        <button
          onClick={handle}
          style={{
            background: 'linear-gradient(180deg, #1A0505 0%, #0A0202 100%)',
            border: '2px solid #CC3333',
            color: '#FF7777',
            fontFamily: "'Cinzel', serif",
            fontSize: '13px', letterSpacing: '4px',
            padding: '10px 28px',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 0 18px rgba(200,0,0,0.2)',
            outline: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #2A0808 0%, #180404 100%)';
            e.currentTarget.style.boxShadow = '0 0 32px rgba(200,0,0,0.5)';
            e.currentTarget.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #1A0505 0%, #0A0202 100%)';
            e.currentTarget.style.boxShadow = '0 0 18px rgba(200,0,0,0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          SKIP
        </button>
      )}
    </div>
  );
}

// ── BOOT PHASE ────────────────────────────────────────────────────────────────
function BootPhase({ onComplete, onSkip, fading }) {
  // stage: 'waiting' → 'lines' → 'prompt'
  const [stage, setStage] = useState('waiting');
  const [lines, setLines] = useState([]);
  // promptStep: 0=asking(blink), 1=answered(Y), 2=confirmed(glow)
  const [promptStep, setPromptStep] = useState(0);
  const outputRef = useRef(null);

  // Stage 1: wait 3.5s then switch to lines
  useEffect(() => {
    const t = setTimeout(() => setStage('lines'), 3500);
    return () => clearTimeout(t);
  }, []);

  // Stage 2: blast lines one by one
  useEffect(() => {
    if (stage !== 'lines') return;
    let idx = 0;
    let tid;
    const addLine = () => {
      if (idx >= BOOT_LINES.length) {
        tid = setTimeout(() => setStage('prompt'), 300);
        return;
      }
      const line = BOOT_LINES[idx++];
      setLines(prev => [...prev, { text: line.text, color: line.color || '#555' }]);
      const delay = line.gap ?? (line.text === '' ? 25 : 50);
      tid = setTimeout(addLine, delay);
    };
    tid = setTimeout(addLine, 50);
    return () => clearTimeout(tid);
  }, [stage]);

  // Stage 3: prompt → auto-answer → confirm → transition
  useEffect(() => {
    if (stage !== 'prompt') return;
    const t1 = setTimeout(() => setPromptStep(1), 900);
    const t2 = setTimeout(() => setPromptStep(2), 1500);
    const t3 = setTimeout(() => onComplete(), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [stage]);

  // auto-scroll
  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [lines, stage, promptStep]);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Share Tech Mono', monospace",
      overflow: 'hidden', position: 'relative',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.7s ease',
    }}>
      {/* CRT scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
      }} />
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.82) 100%)',
      }} />

      {/* Terminal */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: 'min(860px, 92vw)',
        background: 'rgba(0,6,2,0.97)',
        border: '1px solid rgba(11,196,196,0.15)',
        boxShadow: '0 0 60px rgba(11,196,196,0.05), inset 0 0 80px rgba(0,0,0,0.5)',
        borderRadius: '2px', overflow: 'hidden',
      }}>
        {/* Title bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '10px 16px',
          background: 'rgba(11,196,196,0.04)',
          borderBottom: '1px solid rgba(11,196,196,0.08)',
        }}>
          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#CC3333', boxShadow: '0 0 4px #CC333877' }} />
          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#CC9933', boxShadow: '0 0 4px #CC993877' }} />
          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#22AA44', boxShadow: '0 0 4px #22AA4477' }} />
          <div style={{ flex: 1, textAlign: 'center', color: 'rgba(11,196,196,0.38)', fontSize: '11px', letterSpacing: '3px' }}>
            PORTFOLIO.EXE — BOOT SEQUENCE
          </div>
        </div>

        {/* Output */}
        <div
          ref={outputRef}
          style={{ padding: '18px 26px 22px', height: '62vh', overflowY: 'auto', scrollbarWidth: 'none' }}
        >
          {/* WAITING stage */}
          {stage === 'waiting' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '18px' }}>
              <div style={{ color: '#F0E6A0', fontFamily: "'Cinzel', serif", fontSize: 'clamp(20px, 3vw, 32px)', letterSpacing: '8px', animation: 'waitPulse 2s ease-in-out infinite' }}>
                PORTFOLIO.EXE
              </div>
              <div style={{ color: 'rgba(200,155,60,0.35)', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', letterSpacing: '4px' }}>
                THE VIRTUOSO PROTOCOL
              </div>
              <div style={{ marginTop: '8px', color: '#0BC4C4', fontSize: '12px', letterSpacing: '2px', fontFamily: "'Share Tech Mono', monospace", animation: 'waitFlicker 1.1s step-end infinite' }}>
                INITIALIZING...
              </div>
            </div>
          )}

          {/* LINES stage */}
          {(stage === 'lines' || stage === 'prompt') && lines.map((line, i) => (
            <div key={i} style={{
              color: line.color,
              fontSize: '12.5px',
              lineHeight: '1.75',
              whiteSpace: 'pre',
              minHeight: line.text === '' ? '0.6em' : undefined,
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              {line.text}
            </div>
          ))}

          {/* idle cursor during lines */}
          {stage === 'lines' && (
            <span style={{ color: '#0BC4C4', animation: 'termBlink 0.65s step-end infinite', fontSize: '13px' }}>▋</span>
          )}

          {/* PROMPT stage */}
          {stage === 'prompt' && (
            <div style={{ marginTop: '10px' }}>
              <div style={{
                color: '#F0E6A0', fontSize: '15px', letterSpacing: '1px',
                fontFamily: "'Share Tech Mono', monospace",
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ color: '#C89B3C' }}>{'>'}</span>
                {'  are you ready to play?  '}
                {promptStep === 0 && (
                  <span style={{ animation: 'termBlink 0.55s step-end infinite' }}>▋</span>
                )}
                {promptStep >= 1 && (
                  <span style={{ color: '#22FF66', fontWeight: 'bold' }}>Y</span>
                )}
              </div>
              {promptStep >= 2 && (
                <div style={{
                  marginTop: '14px', color: '#FFD700', fontSize: '14px',
                  letterSpacing: '3px', fontFamily: "'Share Tech Mono', monospace",
                  animation: 'termGlow 0.8s ease-in-out infinite alternate',
                }}>
                  ✓  LET'S GO — LAUNCHING PORTFOLIO...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes termBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes termGlow {
          from { text-shadow: 0 0 6px rgba(255,215,0,0.4); opacity: 0.85; }
          to   { text-shadow: 0 0 22px rgba(255,215,0,1), 0 0 44px rgba(255,140,0,0.5); opacity: 1; }
        }
        @keyframes waitPulse {
          0%, 100% { opacity: 0.7; text-shadow: 0 0 20px rgba(200,155,60,0.3); }
          50%       { opacity: 1;   text-shadow: 0 0 40px rgba(200,155,60,0.8), 0 0 80px rgba(200,155,60,0.3); }
        }
        @keyframes waitFlicker {
          0%, 80%, 100% { opacity: 0.7; }
          85%           { opacity: 0.1; }
          90%           { opacity: 0.7; }
          95%           { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}

// ── INTRO PHASE ───────────────────────────────────────────────────────────────
function IntroPhase({ onStart, onSkip }) {
  const [visible, setVisible] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
    const gi = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 80);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(gi);
  }, []);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'linear-gradient(180deg, #020710 0%, #050D1C 50%, #0A1628 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani', sans-serif",
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 37 + 7) % 100}%`,
            top: `${(i * 53 + 13) % 100}%`,
            width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#0BC4C4' : '#C89B3C',
            opacity: 0.2 + (i % 5) * 0.07,
            animation: `introFloat ${3 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.3) % 3}s`,
          }} />
        ))}
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #C89B3C, #F0E6A0, #C89B3C, transparent)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #C89B3C, #F0E6A0, #C89B3C, transparent)' }} />

      <SkipButton onSkip={onSkip} />

      <div style={{
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(22px)',
        transition: 'all 0.9s cubic-bezier(0.34, 1.1, 0.64, 1)',
        maxWidth: '820px', padding: '0 28px',
      }}>
        <h1 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(30px, 5vw, 54px)',
          color: glitch ? '#FF2200' : '#F0E6A0',
          textShadow: glitch
            ? '4px 0 #0BC4C4, -4px 0 #CC2222, 0 0 20px #FF2200'
            : '0 0 30px rgba(200,155,60,0.55), 0 0 70px rgba(200,155,60,0.2)',
          letterSpacing: '5px', marginBottom: '6px',
          transition: 'color 0.05s, text-shadow 0.05s',
        }}>
          PORTFOLIO.EXE
        </h1>

        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(11px, 1.8vw, 16px)', color: '#C89B3C', letterSpacing: '6px', marginBottom: '28px' }}>
          THE VIRTUOSO PROTOCOL — ABRAR SARWAR
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '26px' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #C89B3C)' }} />
          <div style={{ color: '#C89B3C', fontSize: '14px' }}>◆</div>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #C89B3C, transparent)' }} />
        </div>

        <p style={{ color: '#A0B4CC', fontSize: 'clamp(13px, 1.7vw, 15px)', lineHeight: 1.7, marginBottom: '28px', fontWeight: 500 }}>
          Five cyber-threats stand between you and the resume.<br />
          Control <span style={{ color: '#F0E6A0' }}>THE VIRTUOSO</span> and eliminate them all.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '26px', textAlign: 'left' }}>
          {[
            { key: 'Left Click', desc: 'Move to location' },
            { key: 'Right Click', desc: 'Move / Attack enemy' },
            { key: 'Q', desc: 'Whisper Shot (4th = CRIT)' },
            { key: 'X', desc: 'Deadly Flourish (stun beam)' },
            { key: 'E', desc: 'Captive Audience (trap)' },
            { key: 'R (hold)', desc: 'Curtain Call (ultimate)' },
            { key: 'WASD / Arrows', desc: 'Move' },
            { key: 'Kill all 5', desc: 'Unlock full resume' },
          ].map(({ key, desc }) => (
            <div key={key} style={{
              background: 'rgba(10,22,40,0.7)', border: '1px solid rgba(200,155,60,0.25)',
              borderRadius: '3px', padding: '7px 12px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{
                background: 'rgba(200,155,60,0.12)', border: '1px solid #C89B3C',
                borderRadius: '3px', padding: '2px 8px', color: '#F0E6A0',
                fontFamily: "'Share Tech Mono', monospace", fontSize: '11px',
                whiteSpace: 'nowrap', minWidth: '88px', textAlign: 'center',
              }}>{key}</span>
              <span style={{ color: '#C8D8E8', fontSize: '12px' }}>{desc}</span>
            </div>
          ))}
        </div>

        <div style={{
          background: 'rgba(5,13,28,0.8)', border: '1px solid rgba(200,155,60,0.35)',
          borderRadius: '3px', padding: '12px 18px', marginBottom: '28px', textAlign: 'left',
        }}>
          <div style={{ color: '#C89B3C', fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '2px', marginBottom: '9px' }}>ENEMIES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {[
              { name: 'Script Kiddie', color: '#22FF44', hp: '80HP' },
              { name: 'Phantom Threat', color: '#CC44FF', hp: '130HP' },
              { name: 'Risk Golem', color: '#FFAA22', hp: '170HP' },
              { name: 'Firewall Hydra', color: '#FF4400', hp: '220HP' },
              { name: 'Final Audit', color: '#AA00CC', hp: '280HP' },
            ].map((e, i) => (
              <div key={e.name} style={{
                background: 'rgba(10,22,40,0.5)', border: `1px solid ${e.color}33`,
                borderLeft: `3px solid ${e.color}`, borderRadius: '2px', padding: '4px 10px', fontSize: '12px',
              }}>
                <span style={{ color: '#666' }}>#{i + 1}</span>{' '}
                <span style={{ color: e.color }}>{e.name}</span>{' '}
                <span style={{ color: '#555', fontFamily: "'Share Tech Mono', monospace", fontSize: '10px' }}>{e.hp}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onStart}
          style={{
            background: 'linear-gradient(180deg, #1C160A 0%, #0A0804 100%)',
            border: '2px solid #C89B3C', color: '#F0E6A0',
            fontFamily: "'Cinzel', serif", fontSize: '17px',
            letterSpacing: '5px', padding: '15px 52px',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 0 22px rgba(200,155,60,0.28)', outline: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #2C2212 0%, #1A1008 100%)';
            e.currentTarget.style.boxShadow = '0 0 36px rgba(200,155,60,0.65)';
            e.currentTarget.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #1C160A 0%, #0A0804 100%)';
            e.currentTarget.style.boxShadow = '0 0 22px rgba(200,155,60,0.28)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ENTER THE RIFT
        </button>

        <div style={{ marginTop: '16px', color: '#3A4A5A', fontStyle: 'italic', fontSize: '12px', fontFamily: "'Share Tech Mono', monospace" }}>
          "They will all be beautiful." — The Virtuoso
        </div>

        {/* Secret trigger */}
        <button
          onClick={() => setShowSecret(true)}
          style={{
            marginTop: '14px',
            background: 'linear-gradient(180deg, #1C160A 0%, #0A0804 100%)',
            border: '2px solid #C89B3C',
            color: '#F0E6A0',
            fontFamily: "'Cinzel', serif",
            fontSize: '13px',
            letterSpacing: '4px',
            padding: '10px 32px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 0 22px rgba(200,155,60,0.28)',
            outline: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #2C2212 0%, #1A1008 100%)';
            e.currentTarget.style.boxShadow = '0 0 36px rgba(200,155,60,0.65)';
            e.currentTarget.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(180deg, #1C160A 0%, #0A0804 100%)';
            e.currentTarget.style.boxShadow = '0 0 22px rgba(200,155,60,0.28)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ◆ CLASSIFIED ◆
        </button>
      </div>

      {showSecret && <SecretOverlay onClose={() => setShowSecret(false)} />}

      <style>{`
        @keyframes introFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-14px); }
        }
      `}</style>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function TutorialScreen({ onStart, onSkip }) {
  const [phase, setPhase] = useState('boot');
  const [bootFading, setBootFading] = useState(false);

  const handleBootComplete = () => {
    setBootFading(true);
    setTimeout(() => setPhase('intro'), 750);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      {phase === 'boot'
        ? <BootPhase onComplete={handleBootComplete} onSkip={onSkip} fading={bootFading} />
        : <IntroPhase onStart={onStart} onSkip={onSkip} />
      }
    </div>
  );
}
