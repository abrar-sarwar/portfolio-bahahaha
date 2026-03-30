import { useState, useEffect } from 'react';

export default function TutorialScreen({ onStart }) {
  const [visible, setVisible] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 80);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #020710 0%, #050D1C 50%, #0A1628 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Rajdhani', sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Background particles (CSS) */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#0BC4C4' : '#C89B3C',
            opacity: 0.3 + Math.random() * 0.4,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}
      </div>

      {/* Gold line top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #C89B3C, #F0E6A0, #C89B3C, transparent)' }} />

      {/* Main content */}
      <div style={{
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1s ease',
        maxWidth: '800px',
        padding: '0 24px',
      }}>
        {/* Boot sequence */}
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          color: '#0BC4C4',
          fontSize: '13px',
          marginBottom: '24px',
          opacity: 0.8,
        }}>
          <BootText />
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(28px, 5vw, 52px)',
          color: glitch ? '#FF2200' : '#F0E6A0',
          textShadow: glitch
            ? '4px 0 #0BC4C4, -4px 0 #CC2222, 0 0 20px #FF2200'
            : '0 0 30px rgba(200,155,60,0.5), 0 0 60px rgba(200,155,60,0.2)',
          letterSpacing: '4px',
          marginBottom: '8px',
          transition: 'color 0.05s, text-shadow 0.05s',
        }}>
          ABRAR.EXE
        </h1>

        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(12px, 2vw, 18px)',
          color: '#C89B3C',
          letterSpacing: '6px',
          marginBottom: '32px',
        }}>
          THE VIRTUOSO PROTOCOL
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #C89B3C)' }} />
          <div style={{ color: '#C89B3C', fontSize: '16px' }}>◆</div>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #C89B3C, transparent)' }} />
        </div>

        {/* Lore text */}
        <p style={{
          color: '#A0B4CC',
          fontSize: 'clamp(13px, 1.8vw, 16px)',
          lineHeight: 1.7,
          marginBottom: '32px',
          fontWeight: 500,
        }}>
          Five cyber-threats stand between you and the resume.<br />
          Control <span style={{ color: '#F0E6A0' }}>THE VIRTUOSO</span> and eliminate them all.
        </p>

        {/* Controls grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginBottom: '32px',
          textAlign: 'left',
        }}>
          {[
            { key: 'Left Click', desc: 'Move to location' },
            { key: 'Right Click', desc: 'Move / Attack enemy' },
            { key: 'Q', desc: 'Whisper Shot (4-shot · 4th = CRIT)' },
            { key: 'W', desc: 'Deadly Flourish (stun beam)' },
            { key: 'E', desc: 'Captive Audience (trap)' },
            { key: 'R (hold)', desc: 'Curtain Call (ultimate)' },
            { key: 'WASD / Arrows', desc: 'Move' },
            { key: 'Kill all 5', desc: 'Unlock full resume' },
          ].map(({ key, desc }) => (
            <div key={key} style={{
              background: 'rgba(10,22,40,0.7)',
              border: '1px solid rgba(200,155,60,0.3)',
              borderRadius: '4px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{
                background: 'rgba(200,155,60,0.15)',
                border: '1px solid #C89B3C',
                borderRadius: '3px',
                padding: '2px 8px',
                color: '#F0E6A0',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '12px',
                whiteSpace: 'nowrap',
                minWidth: '90px',
                textAlign: 'center',
              }}>
                {key}
              </span>
              <span style={{ color: '#C8D8E8', fontSize: '13px' }}>{desc}</span>
            </div>
          ))}
        </div>

        {/* Enemies preview */}
        <div style={{
          background: 'rgba(5,13,28,0.8)',
          border: '1px solid rgba(200,155,60,0.4)',
          borderRadius: '4px',
          padding: '14px 20px',
          marginBottom: '32px',
          textAlign: 'left',
        }}>
          <div style={{ color: '#C89B3C', fontFamily: "'Cinzel', serif", fontSize: '11px', letterSpacing: '2px', marginBottom: '10px' }}>
            ENEMIES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { name: 'Script Kiddie', color: '#22FF44', hp: '80HP' },
              { name: 'Phantom Threat', color: '#CC44FF', hp: '130HP' },
              { name: 'Risk Golem', color: '#FFAA22', hp: '170HP' },
              { name: 'Firewall Hydra', color: '#FF4400', hp: '220HP' },
              { name: 'Final Audit', color: '#AA00CC', hp: '280HP' },
            ].map((e, i) => (
              <div key={e.name} style={{
                background: 'rgba(10,22,40,0.5)',
                border: `1px solid ${e.color}44`,
                borderLeft: `3px solid ${e.color}`,
                borderRadius: '3px',
                padding: '4px 10px',
                fontSize: '12px',
              }}>
                <span style={{ color: '#888' }}>#{i + 1}</span>
                {' '}
                <span style={{ color: e.color }}>{e.name}</span>
                {' '}
                <span style={{ color: '#666', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px' }}>{e.hp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          style={{
            background: 'linear-gradient(180deg, #1A1408 0%, #0A0804 100%)',
            border: '2px solid #C89B3C',
            color: '#F0E6A0',
            fontFamily: "'Cinzel', serif",
            fontSize: '16px',
            letterSpacing: '4px',
            padding: '14px 48px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 0 20px rgba(200,155,60,0.3)',
          }}
          onMouseEnter={e => {
            e.target.style.background = 'linear-gradient(180deg, #2A2010 0%, #1A1008 100%)';
            e.target.style.boxShadow = '0 0 30px rgba(200,155,60,0.6)';
          }}
          onMouseLeave={e => {
            e.target.style.background = 'linear-gradient(180deg, #1A1408 0%, #0A0804 100%)';
            e.target.style.boxShadow = '0 0 20px rgba(200,155,60,0.3)';
          }}
        >
          ENTER THE RIFT
        </button>

        {/* Virtuoso quote */}
        <div style={{
          marginTop: '20px',
          color: '#4A5A6A',
          fontStyle: 'italic',
          fontSize: '12px',
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          "They will all be beautiful." — The Virtuoso
        </div>
      </div>

      {/* Gold line bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #C89B3C, #F0E6A0, #C89B3C, transparent)' }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}

function BootText() {
  const [lines, setLines] = useState([]);
  const bootLines = [
    '> INITIALIZING VIRTUOSO.PROTOCOL.EXE...',
    '> LOADING CHAMPION DATA: THE VIRTUOSO...',
    '> SCANNING THREAT DATABASE: 5 TARGETS IDENTIFIED',
    '> SUMMONER\'S RIFT LOADED — GOOD LUCK.',
  ];

  useEffect(() => {
    let i = 0;
    const addLine = () => {
      if (i < bootLines.length) {
        setLines(prev => [...prev, bootLines[i]]);
        i++;
        setTimeout(addLine, 400 + Math.random() * 200);
      }
    };
    setTimeout(addLine, 200);
  }, []);

  return (
    <div>
      {lines.map((line, i) => (
        <div key={i} style={{ opacity: 0.7 + (i / lines.length) * 0.3 }}>{line}</div>
      ))}
    </div>
  );
}
