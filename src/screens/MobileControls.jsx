import { useEffect, useRef, useState, useCallback } from 'react';

// ── SVG ABILITY ICONS ─────────────────────────────────────────────────────────

function IconQ() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <ellipse cx="24" cy="24" rx="16" ry="7" fill="#AADDAA" fillOpacity="0.18" />
      <ellipse cx="24" cy="24" rx="16" ry="7" stroke="#AADDAA" strokeWidth="1.5" />
      <path d="M38 20 L44 24 L38 28" fill="#AADDAA" />
      <line x1="4" y1="24" x2="8" y2="24" stroke="#AADDAA" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
      <line x1="4" y1="20" x2="6" y2="20" stroke="#AADDAA" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      <line x1="4" y1="28" x2="6" y2="28" stroke="#AADDAA" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      <ellipse cx="24" cy="24" rx="5" ry="3" fill="#AADDAA" fillOpacity="0.6" />
      <circle cx="36" cy="18" r="2.5" fill="#F0E6A0" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect x="6" y="22" width="36" height="4" rx="2" fill="#0BC4C4" fillOpacity="0.25" />
      <rect x="6" y="22" width="36" height="4" rx="2" stroke="#0BC4C4" strokeWidth="1" />
      <path d="M26 8 L18 26 L24 26 L22 40 L30 22 L24 22 Z" fill="#0BC4C4" fillOpacity="0.9" />
      <circle cx="10" cy="24" r="2.5" fill="#0BC4C4" fillOpacity="0.7" />
      <circle cx="38" cy="24" r="2" fill="#0BC4C4" fillOpacity="0.5" />
      <line x1="9" y1="18" x2="12" y2="21" stroke="#0BC4C4" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1="9" y1="30" x2="12" y2="27" stroke="#0BC4C4" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
    </svg>
  );
}

function IconE() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <path d="M24 6 L42 24 L24 42 L6 24 Z" stroke="#C89B3C" strokeWidth="1.5" fill="#C89B3C" fillOpacity="0.1" />
      <path d="M24 14 L34 24 L24 34 L14 24 Z" stroke="#C89B3C" strokeWidth="1.5" fill="#C89B3C" fillOpacity="0.25" />
      <path d="M24 19 L29 24 L24 29 L19 24 Z" fill="#F0E6A0" />
      <line x1="24" y1="6" x2="24" y2="10" stroke="#C89B3C" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="38" x2="24" y2="42" stroke="#C89B3C" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="24" x2="10" y2="24" stroke="#C89B3C" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="24" x2="42" y2="24" stroke="#C89B3C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconR() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <circle cx="24" cy="24" r="18" stroke="#CC2222" strokeWidth="1.5" fill="#CC2222" fillOpacity="0.08" />
      <circle cx="24" cy="24" r="11" stroke="#CC2222" strokeWidth="1" fill="#CC2222" fillOpacity="0.15" strokeOpacity="0.7" />
      <line x1="24" y1="4" x2="24" y2="44" stroke="#CC2222" strokeWidth="1.5" strokeOpacity="0.8" />
      <line x1="4" y1="24" x2="44" y2="24" stroke="#CC2222" strokeWidth="1.5" strokeOpacity="0.8" />
      <line x1="11" y1="11" x2="16" y2="16" stroke="#CC2222" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
      <line x1="37" y1="11" x2="32" y2="16" stroke="#CC2222" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
      <line x1="11" y1="37" x2="16" y2="32" stroke="#CC2222" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
      <line x1="37" y1="37" x2="32" y2="32" stroke="#CC2222" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
      <circle cx="24" cy="24" r="4" fill="#FF4444" />
      <circle cx="24" cy="24" r="2" fill="#FF8888" />
    </svg>
  );
}

const ABILITIES = [
  { key: 'Q', label: 'Whisper Shot', note: '4th = CRIT', color: '#AADDAA', glow: 'rgba(170,221,170,0.5)', Icon: IconQ, isHold: false },
  { key: 'X', label: 'Stun Beam',    note: 'long range',  color: '#0BC4C4', glow: 'rgba(11,196,196,0.5)',  Icon: IconX, isHold: false },
  { key: 'E', label: 'Drop Trap',    note: 'area denial', color: '#C89B3C', glow: 'rgba(200,155,60,0.5)',  Icon: IconE, isHold: false },
  { key: 'R', label: 'Curtain Call', note: 'hold charge', color: '#CC2222', glow: 'rgba(204,34,34,0.55)',  Icon: IconR, isHold: true  },
];

// ── SINGLE BUTTON ─────────────────────────────────────────────────────────────
function AbilityButton({ ability, size }) {
  const [pressed, setPressed] = useState(false);
  const holdRef = useRef(null);

  const fire = useCallback((type) => {
    window.dispatchEvent(new KeyboardEvent(type, { key: ability.key, bubbles: true, cancelable: true }));
  }, [ability.key]);

  const handleDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setPressed(true);
    fire('keydown');
    if (!ability.isHold) {
      holdRef.current = setTimeout(() => { fire('keyup'); setPressed(false); }, 120);
    }
  }, [fire, ability.isHold]);

  const handleUp = useCallback((e) => {
    e.preventDefault();
    if (holdRef.current) clearTimeout(holdRef.current);
    if (ability.isHold && pressed) fire('keyup');
    setPressed(false);
  }, [fire, ability.isHold, pressed]);

  const { Icon, color, glow, label, note, key } = ability;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onContextMenu={e => e.preventDefault()}
        style={{
          width: size, height: size,
          position: 'relative',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          borderRadius: '50%',
          border: `2px solid ${pressed ? color : color + '66'}`,
          background: pressed
            ? `radial-gradient(circle at 40% 35%, ${color}44, ${color}18 60%, rgba(2,7,16,0.95))`
            : `radial-gradient(circle at 40% 35%, ${color}1A, rgba(2,7,16,0.92))`,
          boxShadow: pressed
            ? `0 0 20px ${glow}, 0 0 40px ${glow}, inset 0 0 14px ${color}33`
            : `0 0 8px ${color}33, inset 0 0 8px rgba(0,0,0,0.5)`,
          transform: pressed ? 'scale(0.91)' : 'scale(1)',
          transition: 'transform 0.08s, box-shadow 0.08s, background 0.08s, border-color 0.08s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* inner ring */}
        <div style={{
          position: 'absolute', inset: '6px', borderRadius: '50%',
          border: `1px solid ${color}33`, pointerEvents: 'none',
        }} />
        {/* icon */}
        <div style={{
          width: '55%', height: '55%',
          filter: pressed ? `drop-shadow(0 0 6px ${color})` : `drop-shadow(0 0 3px ${color}88)`,
          transition: 'filter 0.08s',
          pointerEvents: 'none',
        }}>
          <Icon />
        </div>
      </div>
      {/* key + label */}
      <div style={{ textAlign: 'center', pointerEvents: 'none', lineHeight: 1.2 }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: `${size * 0.18}px`,
          color: pressed ? color : color + 'CC',
          letterSpacing: '1px',
          textShadow: pressed ? `0 0 8px ${color}` : 'none',
          transition: 'color 0.08s',
        }}>{key}</div>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: `${size * 0.12}px`,
          color: '#4A5A6A',
          letterSpacing: '0.3px',
        }}>{note}</div>
      </div>
    </div>
  );
}

// ── PORTRAIT OVERLAY ─────────────────────────────────────────────────────────
function RotateHint() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(2,7,16,0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '20px',
      fontFamily: "'Rajdhani', sans-serif",
    }}>
      <div style={{
        fontSize: '52px',
        animation: 'rotateHint 2s ease-in-out infinite',
      }}>📱</div>
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '18px',
        color: '#F0E6A0',
        letterSpacing: '4px',
        textAlign: 'center',
      }}>ROTATE DEVICE</div>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '11px',
        color: '#4A6A8A',
        letterSpacing: '2px',
        textAlign: 'center',
        lineHeight: 1.8,
      }}>
        this game plays best in landscape<br />turn your phone sideways to play
      </div>
      <div style={{
        width: '120px', height: '1px',
        background: 'linear-gradient(90deg, transparent, #C89B3C, transparent)',
      }} />
      <style>{`
        @keyframes rotateHint {
          0%, 100% { transform: rotate(0deg); }
          40%       { transform: rotate(90deg); }
          60%       { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function MobileControls() {
  const [isTouch, setIsTouch] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkTouch = () =>
      window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

    const checkOrientation = () =>
      window.innerHeight > window.innerWidth;

    const update = () => {
      setIsTouch(checkTouch());
      setIsPortrait(checkOrientation());
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  if (!isTouch) return null;
  if (isPortrait) return <RotateHint />;

  // landscape: size buttons relative to screen height so they fit well
  const vh = window.innerHeight;
  const btnSize = Math.min(72, Math.floor(vh * 0.18));
  const gap = Math.floor(btnSize * 0.22);

  return (
    <div style={{
      position: 'fixed',
      bottom: '12px',
      right: '14px',
      zIndex: 50,
      display: 'grid',
      gridTemplateColumns: `${btnSize}px ${btnSize}px`,
      gap: `${gap}px`,
      pointerEvents: 'all',
    }}>
      {ABILITIES.map(ab => (
        <AbilityButton key={ab.key} ability={ab} size={btnSize} />
      ))}
    </div>
  );
}
