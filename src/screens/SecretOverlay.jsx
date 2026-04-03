import { useState, useEffect, useRef } from 'react';

const SECRET_CODE = 'YWJyYXI=';
const VIDEO_SRC = '/assets/video/89FEEA11-2EE9-4A5D-864A-D51857B88D13.mov';

export default function SecretOverlay({ onClose }) {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('input'); // 'input' | 'denied' | 'decoding' | 'confirmed' | 'video'
  const [lines, setLines] = useState(['> Enter Password to get in']);
  const inputRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  // Close on Escape
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
      setTimeout(() => setPhase('video'), 3000);
    } else {
      setLines(prev => [...prev, `> ${val}`, '> access denied.']);
      setPhase('denied');
      setInput('');
      setTimeout(() => {
        setPhase('input');
        inputRef.current?.focus();
      }, 1200);
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
      {phase === 'video' ? (
        <VideoPhase videoRef={videoRef} onClose={onClose} />
      ) : (
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
              <span style={{ color: '#C89B3C', fontSize: '11px', letterSpacing: '3px' }}>
                ABRAR'S SECRET
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', color: '#3A4A5A',
                fontSize: '14px', cursor: 'pointer', padding: '0 4px',
                fontFamily: "'Share Tech Mono', monospace",
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#888'}
              onMouseLeave={e => e.currentTarget.style.color = '#3A4A5A'}
            >
              ✕
            </button>
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
              }}>
                {line}
              </div>
            ))}
            {phase === 'decoding' && (
              <div style={{ color: '#C89B3C', fontSize: '13px', animation: 'secretBlink 0.6s step-end infinite' }}>
                ▋
              </div>
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
                flex: 1,
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${phase === 'denied' ? '#663333' : 'rgba(200,155,60,0.3)'}`,
                color: '#F0E6A0',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '13px',
                outline: 'none',
                padding: '4px 0',
                caretColor: '#C89B3C',
                letterSpacing: '2px',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!isTypeable}
              style={{
                background: 'rgba(200,155,60,0.08)',
                border: '1px solid rgba(200,155,60,0.3)',
                color: '#C89B3C',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '11px',
                padding: '5px 14px',
                cursor: isTypeable ? 'pointer' : 'default',
                letterSpacing: '1px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => isTypeable && (e.currentTarget.style.background = 'rgba(200,155,60,0.18)')}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,155,60,0.08)'}
            >
              ENTER
            </button>
          </form>

          {/* Hint line */}
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid rgba(200,155,60,0.1)',
            color: '#2A3A3A',
            fontSize: '10px',
            letterSpacing: '1px',
          }}>
            ESC to close
          </div>
        </div>
      )}

      <style>{`
        @keyframes secretFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes secretSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes secretBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function VideoPhase({ videoRef, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '20px', padding: '24px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
      width: 'min(720px, 94vw)',
    }}>
      <div style={{
        color: '#C89B3C',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '10px',
        letterSpacing: '4px',
      }}>
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
        onClick={onClose}
        style={{
          background: 'rgba(200,155,60,0.08)',
          border: '1px solid rgba(200,155,60,0.35)',
          color: '#C89B3C',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '11px',
          letterSpacing: '2px',
          padding: '10px 28px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,155,60,0.18)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,155,60,0.08)'}
      >
        CLOSE
      </button>
    </div>
  );
}
