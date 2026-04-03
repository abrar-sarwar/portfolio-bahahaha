import { useState, useEffect, useRef } from 'react';

const SECRET_CODE = 'YWJyYXI=';
const VIDEO_SRC = '/assets/video/89FEEA11-2EE9-4A5D-864A-D51857B88D13.mov';

// ── Replace this with your Google Apps Script Web App URL after setup ──
const SHEET_WEBHOOK = 'https://script.google.com/macros/s/AKfycbxsOWnl5SbeheX3E4JgUFY2VpF29IGTAQIgONA6LskrRfLdr3y0_qiwqegsI748Hvua/exec';

async function submitName(name) {
  try {
    await fetch(SHEET_WEBHOOK, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, timestamp: new Date().toISOString() }),
    });
  } catch (_) { /* silent fail — don't block the user */ }
}

// ── MAIN OVERLAY ──────────────────────────────────────────────────────────────
export default function SecretOverlay({ onClose }) {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('input'); // input | denied | decoding | confirmed | mfa | video | locked
  const [lines, setLines] = useState(['> Enter Password to get in']);
  const [tries, setTries] = useState(0);
  const inputRef = useRef(null);
  const videoRef = useRef(null);

  const MAX_TRIES = 5;

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  // Escape closes only on input phase
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && phase === 'input') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onClose]);

  const handleSubmit = () => {
    const val = input.trim();
    if (!val) return;

    if (val === SECRET_CODE) {
      setLines(prev => [...prev, `> ${val}`, '> decoding...']);
      setPhase('decoding');
      setTimeout(() => {
        setLines(prev => [...prev, '> identity confirmed.']);
        setPhase('confirmed');
      }, 1600);
      setTimeout(() => setPhase('mfa'), 3000);
    } else {
      const newTries = tries + 1;
      setTries(newTries);
      setInput('');

      if (newTries >= MAX_TRIES) {
        setLines(prev => [...prev, `> ${val}`, '> access denied.', `> [${MAX_TRIES}/${MAX_TRIES}] attempts used.`]);
        setPhase('locked');
      } else {
        setLines(prev => [...prev, `> ${val}`, `> access denied. [${newTries}/${MAX_TRIES}]`]);
        setPhase('denied');
        setTimeout(() => {
          setPhase('input');
          inputRef.current?.focus();
        }, 1200);
      }
    }
  };

  const isTypeable = phase === 'input' || phase === 'denied';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(1,4,12,0.97)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Share Tech Mono', monospace",
      animation: 'secretFadeIn 0.3s ease both',
    }}>

      {phase === 'mfa'      && <MfaPhase onComplete={() => setPhase('initiating')} />}
      {phase === 'initiating' && <InitiatingPhase onComplete={() => setPhase('video')} />}
      {phase === 'video'  && <VideoPhase videoRef={videoRef} onNext={() => setPhase('goated')} />}
      {phase === 'goated' && <GoatedPhase onClose={onClose} />}
      {phase === 'locked' && <LockedPhase lines={lines} onClose={onClose} />}

      {phase !== 'mfa' && phase !== 'initiating' && phase !== 'video' && phase !== 'locked' && (
        <div style={{
          width: 'min(520px, 90vw)',
          background: 'linear-gradient(160deg, #060E1C 0%, #030810 100%)',
          border: '1px solid rgba(200,155,60,0.35)',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(0,0,0,0.8)',
          animation: 'secretSlideIn 0.35s cubic-bezier(0.34,1.2,0.64,1) both',
        }}>
          {/* Title bar */}
          <div style={{
            padding: '12px 18px',
            borderBottom: '1px solid rgba(200,155,60,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(200,155,60,0.5)' }} />
              <span style={{ color: '#C89B3C', fontSize: '11px', letterSpacing: '3px' }}>ABRAR'S SECRET</span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#3A4A5A', fontSize: '14px', cursor: 'pointer', padding: '0 4px', fontFamily: "'Share Tech Mono', monospace" }}
              onMouseEnter={e => e.currentTarget.style.color = '#888'}
              onMouseLeave={e => e.currentTarget.style.color = '#3A4A5A'}
            >✕</button>
          </div>

          {/* Terminal output */}
          <div style={{ padding: '20px 20px 12px', minHeight: '110px' }}>
            {lines.map((line, i) => (
              <div key={i} style={{
                fontSize: '13px',
                color: line.includes('denied') ? '#884444'
                  : line.includes('confirmed') ? '#44AA66'
                  : line.includes('decoding') ? '#C89B3C'
                  : '#5A7A6A',
                lineHeight: 1.8,
              }}>{line}</div>
            ))}
            {phase === 'decoding' && (
              <div style={{ color: '#C89B3C', fontSize: '13px', animation: 'secretBlink 0.6s step-end infinite' }}>▋</div>
            )}
          </div>

          {/* Input row */}
          <form
            onSubmit={e => { e.preventDefault(); handleSubmit(); }}
            style={{
              padding: '0 20px 20px',
              display: 'flex', alignItems: 'center', gap: '10px',
              opacity: isTypeable ? 1 : 0.3,
              transition: 'opacity 0.3s',
            }}
          >
            <span style={{ color: '#C89B3C', fontSize: '13px', flexShrink: 0 }}>{'>'}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => isTypeable && setInput(e.target.value)}
              disabled={!isTypeable}
              placeholder="enter code..."
              style={{
                flex: 1, background: 'transparent', border: 'none',
                borderBottom: `1px solid ${phase === 'denied' ? '#663333' : 'rgba(200,155,60,0.3)'}`,
                color: '#F0E6A0', fontFamily: "'Share Tech Mono', monospace",
                fontSize: '13px', outline: 'none', padding: '4px 0',
                caretColor: '#C89B3C', letterSpacing: '2px',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!isTypeable}
              style={{
                background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.3)',
                color: '#C89B3C', fontFamily: "'Share Tech Mono', monospace",
                fontSize: '11px', padding: '5px 14px',
                cursor: isTypeable ? 'pointer' : 'default', letterSpacing: '1px', transition: 'all 0.15s',
              }}
              onMouseEnter={e => isTypeable && (e.currentTarget.style.background = 'rgba(200,155,60,0.18)')}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,155,60,0.08)'}
            >ENTER</button>
          </form>

          <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(200,155,60,0.1)', color: '#2A3A3A', fontSize: '10px', letterSpacing: '1px' }}>
            ESC to close
          </div>
        </div>
      )}

      <style>{`
        @keyframes secretFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes secretSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes secretBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

// ── LOCKED PHASE ──────────────────────────────────────────────────────────────
function LockedPhase({ lines, onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  return (
    <div style={{
      width: 'min(520px, 90vw)',
      background: 'linear-gradient(160deg, #060E1C 0%, #030810 100%)',
      border: '1px solid rgba(200,155,60,0.35)',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 0 60px rgba(0,0,0,0.8)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
      transition: 'all 0.4s cubic-bezier(0.34,1.2,0.64,1)',
    }}>
      {/* Title bar */}
      <div style={{
        padding: '12px 18px',
        borderBottom: '1px solid rgba(200,155,60,0.15)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(200,60,60,0.7)' }} />
        <span style={{ color: '#AA4444', fontSize: '11px', letterSpacing: '3px' }}>ACCESS LOCKED</span>
      </div>

      {/* Terminal output */}
      <div style={{ padding: '20px 20px 12px', minHeight: '90px' }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            fontSize: '13px',
            color: line.includes('denied') || line.includes('attempts') ? '#884444' : '#5A7A6A',
            lineHeight: 1.8,
          }}>{line}</div>
        ))}
      </div>

      {/* Message */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(200,155,60,0.1)',
        borderBottom: '1px solid rgba(200,155,60,0.1)',
        fontFamily: "'Cinzel', serif",
        fontSize: '18px',
        color: '#F0E6A0',
        textAlign: 'center',
        letterSpacing: '1px',
        lineHeight: 1.5,
      }}>
        Bro just play the game dawg
      </div>

      {/* Buttons */}
      <div style={{ padding: '20px', display: 'flex', gap: '12px' }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            background: 'rgba(200,155,60,0.06)',
            border: '1px solid rgba(200,155,60,0.25)',
            color: '#8A7A5A',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '11px', letterSpacing: '2px',
            padding: '11px 0', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,155,60,0.12)'; e.currentTarget.style.color = '#C89B3C'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,155,60,0.06)'; e.currentTarget.style.color = '#8A7A5A'; }}
        >SKIP</button>
        <button
          onClick={onClose}
          style={{
            flex: 2,
            background: 'linear-gradient(180deg, #1A1408 0%, #0A0804 100%)',
            border: '1px solid #C89B3C',
            color: '#F0E6A0',
            fontFamily: "'Cinzel', serif",
            fontSize: '13px', letterSpacing: '3px',
            padding: '11px 0', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 0 14px rgba(200,155,60,0.15)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(180deg, #2A2010 0%, #1A1008 100%)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(200,155,60,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(180deg, #1A1408 0%, #0A0804 100%)'; e.currentTarget.style.boxShadow = '0 0 14px rgba(200,155,60,0.15)'; }}
        >PLAY</button>
      </div>
    </div>
  );
}

// ── MFA PHASE ─────────────────────────────────────────────────────────────────
function MfaPhase({ onComplete }) {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    setTimeout(() => { setVisible(true); nameRef.current?.focus(); }, 80);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitted(true);
    await submitName(trimmed);
    setTimeout(onComplete, 1200);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      width: 'min(820px, 94vw)',
      background: 'linear-gradient(160deg, #060E1C 0%, #030810 100%)',
      border: '1px solid rgba(200,155,60,0.35)',
      borderRadius: '6px',
      overflow: 'hidden',
      boxShadow: '0 0 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(200,155,60,0.08)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
      transition: 'all 0.45s cubic-bezier(0.34,1.2,0.64,1)',
    }}>

      {/* Left — full picture, no crop */}
      <div style={{
        flexShrink: 0,
        width: '45%',
        background: '#000',
        borderRight: '1px solid rgba(200,155,60,0.15)',
        display: 'flex',
        alignItems: 'stretch',
      }}>
        <img
          src="/assets/sprites/mfapic.png"
          alt="MFA"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            objectPosition: 'center center',
          }}
        />
      </div>

      {/* Right — name form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(200,155,60,0.12)',
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(200,155,60,0.03)',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(200,155,60,0.6)' }} />
          <span style={{ color: '#C89B3C', fontSize: '10px', letterSpacing: '3px', opacity: 0.8 }}>IDENTITY VERIFICATION</span>
        </div>

        <div style={{
          flex: 1,
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '24px',
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '22px', color: '#F0E6A0', lineHeight: 1.4, letterSpacing: '0.5px' }}>
            Ay bro, What's your name btw?
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                ref={nameRef}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="your name... (not abrar pls)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(200,155,60,0.4)',
                  color: '#F0E6A0',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '20px',
                  fontWeight: 600,
                  padding: '8px 4px',
                  outline: 'none',
                  caretColor: '#C89B3C',
                  width: '100%',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(180deg, #1A1408 0%, #0A0804 100%)',
                  border: '1px solid #C89B3C',
                  color: '#F0E6A0',
                  fontFamily: "'Cinzel', serif",
                  fontSize: '13px',
                  letterSpacing: '3px',
                  padding: '13px 0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 0 14px rgba(200,155,60,0.15)',
                  width: '100%',
                  borderRadius: '2px',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(180deg, #2A2010 0%, #1A1008 100%)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(200,155,60,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(180deg, #1A1408 0%, #0A0804 100%)'; e.currentTarget.style.boxShadow = '0 0 14px rgba(200,155,60,0.15)'; }}
              >
                LET'S GO
              </button>
            </form>
          ) : (
            <div style={{ color: '#44AA66', fontFamily: "'Share Tech Mono', monospace", fontSize: '13px', lineHeight: 1.8 }}>
              <div>{'> identity logged.'}</div>
              <div style={{ animation: 'secretBlink 0.6s step-end infinite' }}>{'> loading...'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── INITIATING PHASE ──────────────────────────────────────────────────────────
function InitiatingPhase({ onComplete }) {
  const [step, setStep] = useState(0);
  const lines = [
    '> identity confirmed.',
    '> decrypting classified file...',
    '> INITIATING ABRAR\'S SECRET',
  ];

  useEffect(() => {
    const timers = lines.map((_, i) =>
      setTimeout(() => setStep(i + 1), 600 + i * 700)
    );
    const done = setTimeout(onComplete, 600 + lines.length * 700 + 800);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []);

  return (
    <div style={{
      width: 'min(480px, 90vw)',
      background: 'linear-gradient(160deg, #060E1C 0%, #030810 100%)',
      border: '1px solid rgba(200,155,60,0.35)',
      borderRadius: '4px',
      padding: '36px 32px',
      boxShadow: '0 0 80px rgba(0,0,0,0.9)',
      animation: 'secretSlideIn 0.35s cubic-bezier(0.34,1.2,0.64,1) both',
    }}>
      {lines.slice(0, step).map((line, i) => (
        <div key={i} style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: i === 2 ? '16px' : '13px',
          color: i === 2 ? '#C89B3C' : '#44AA66',
          letterSpacing: i === 2 ? '3px' : '1px',
          lineHeight: 2,
          fontWeight: i === 2 ? 'bold' : 'normal',
        }}>{line}</div>
      ))}
      {step > 0 && step <= lines.length && (
        <div style={{ color: '#C89B3C', fontSize: '13px', animation: 'secretBlink 0.6s step-end infinite' }}>▋</div>
      )}
    </div>
  );
}

// ── VIDEO PHASE ───────────────────────────────────────────────────────────────
function VideoPhase({ videoRef, onNext }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '20px', padding: '24px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
      width: 'min(720px, 94vw)',
    }}>
      <div style={{ color: '#C89B3C', fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', letterSpacing: '4px' }}>
        ACCESS GRANTED
      </div>
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        autoPlay
        controls
        style={{
          width: '100%',
          border: '1px solid rgba(200,155,60,0.3)',
          borderRadius: '3px',
          background: '#000',
          boxShadow: '0 0 40px rgba(0,0,0,0.8)',
        }}
      />
      <button
        onClick={onNext}
        style={{
          background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.35)',
          color: '#C89B3C', fontFamily: "'Share Tech Mono', monospace",
          fontSize: '11px', letterSpacing: '2px', padding: '10px 28px',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,155,60,0.18)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,155,60,0.08)'}
      >CONTINUE</button>
    </div>
  );
}

// ── GOATED PHASE ──────────────────────────────────────────────────────────────
function GoatedPhase({ onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '28px', padding: '24px', textAlign: 'center',
      width: 'min(520px, 90vw)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
      transition: 'all 0.5s cubic-bezier(0.34,1.2,0.64,1)',
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: 'clamp(36px, 8vw, 60px)',
        color: '#F0E6A0',
        letterSpacing: '4px',
        lineHeight: 1.1,
        textShadow: '0 0 40px rgba(200,155,60,0.6), 0 0 80px rgba(200,155,60,0.3)',
        animation: 'goatedPulse 2.5s ease-in-out infinite',
      }}>
        YOU ARE GOATED!!
      </div>

      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '15px',
        color: '#C89B3C',
        letterSpacing: '2px',
        lineHeight: 1.8,
      }}>
        follow me on insta bro<br />
        <a
          href="https://www.instagram.com/abrartsarwar/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#F0E6A0',
            textDecoration: 'none',
            borderBottom: '1px solid rgba(200,155,60,0.5)',
            paddingBottom: '2px',
            fontSize: '17px',
            letterSpacing: '1px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderBottomColor = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#F0E6A0'; e.currentTarget.style.borderBottomColor = 'rgba(200,155,60,0.5)'; }}
        >@abrartsarwar</a>
      </div>

      <button
        onClick={onClose}
        style={{
          background: 'rgba(200,155,60,0.06)', border: '1px solid rgba(200,155,60,0.3)',
          color: '#6A5A3A', fontFamily: "'Share Tech Mono', monospace",
          fontSize: '10px', letterSpacing: '2px', padding: '10px 28px',
          cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,155,60,0.14)'; e.currentTarget.style.color = '#C89B3C'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,155,60,0.06)'; e.currentTarget.style.color = '#6A5A3A'; }}
      >close</button>

      <style>{`
        @keyframes goatedPulse {
          0%, 100% { text-shadow: 0 0 40px rgba(200,155,60,0.6), 0 0 80px rgba(200,155,60,0.3); }
          50% { text-shadow: 0 0 60px rgba(200,155,60,0.9), 0 0 120px rgba(200,155,60,0.5), 0 0 160px rgba(200,155,60,0.2); }
        }
      `}</style>
    </div>
  );
}
