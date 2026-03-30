import { useState, useEffect } from 'react';
import { RESUME_SECTIONS, ENEMY_DATA } from '../game/constants.js';

export default function ResumePopup({ enemyIndex, onContinue }) {
  const [visible, setVisible] = useState(false);
  const section = RESUME_SECTIONS[enemyIndex];
  const enemy = ENEMY_DATA[enemyIndex];

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  const handleContinue = () => {
    setVisible(false);
    setTimeout(onContinue, 400);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(2px)',
        pointerEvents: 'all',
      }} />

      {/* Panel */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #050D1C 0%, #020710 100%)',
        border: '2px solid #C89B3C',
        borderRadius: '2px',
        width: 'min(520px, 90vw)',
        padding: '0',
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.9)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 0 60px rgba(200,155,60,0.2), inset 0 0 40px rgba(0,0,0,0.5)',
        pointerEvents: 'all',
      }}>
        {/* Top gold bar */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #C89B3C, #F0E6A0, #C89B3C, transparent)' }} />

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(200,155,60,0.3)' }}>
          {/* Enemy defeated badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(204,34,34,0.15)',
            border: '1px solid rgba(204,34,34,0.5)',
            borderRadius: '2px',
            padding: '3px 10px',
            marginBottom: '12px',
          }}>
            <span style={{ color: '#CC2222', fontSize: '10px', fontFamily: "'Share Tech Mono', monospace" }}>
              DEFEATED
            </span>
            <span style={{ color: '#FF8888', fontSize: '10px', fontFamily: "'Share Tech Mono', monospace" }}>
              {enemy?.name?.toUpperCase()}
            </span>
          </div>

          {/* Death quote */}
          <div style={{
            color: '#8899AA',
            fontStyle: 'italic',
            fontSize: '13px',
            fontFamily: "'Share Tech Mono', monospace",
            marginBottom: '12px',
          }}>
            {enemy?.deathQuote}
          </div>

          {/* Section title */}
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '20px',
            color: '#F0E6A0',
            letterSpacing: '2px',
          }}>
            {section?.title}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px' }}>
          {section?.items.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '14px',
              alignItems: 'flex-start',
            }}>
              {/* Left accent */}
              <div style={{
                width: '3px',
                minWidth: '3px',
                background: 'linear-gradient(180deg, #C89B3C, rgba(200,155,60,0))',
                alignSelf: 'stretch',
                marginTop: '2px',
              }} />

              <div style={{ flex: 1 }}>
                <div style={{
                  color: '#C89B3C',
                  fontSize: '10px',
                  fontFamily: "'Cinzel', serif",
                  letterSpacing: '2px',
                  marginBottom: '3px',
                }}>
                  {item.label}
                </div>
                <div style={{
                  color: '#D0E0F0',
                  fontSize: '14px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}>
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px 20px',
          borderTop: '1px solid rgba(200,155,60,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            color: '#4A5A6A',
            fontSize: '11px',
            fontFamily: "'Share Tech Mono', monospace",
          }}>
            {enemyIndex + 1} / 5 THREATS ELIMINATED
          </div>

          <button
            onClick={handleContinue}
            style={{
              background: 'linear-gradient(180deg, #1A1408, #0A0804)',
              border: '1px solid #C89B3C',
              color: '#F0E6A0',
              fontFamily: "'Cinzel', serif",
              fontSize: '13px',
              letterSpacing: '3px',
              padding: '10px 28px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 0 10px rgba(200,155,60,0.2)',
            }}
            onMouseEnter={e => {
              e.target.style.background = 'linear-gradient(180deg, #2A2010, #1A1008)';
              e.target.style.boxShadow = '0 0 20px rgba(200,155,60,0.5)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'linear-gradient(180deg, #1A1408, #0A0804)';
              e.target.style.boxShadow = '0 0 10px rgba(200,155,60,0.2)';
            }}
          >
            CONTINUE
          </button>
        </div>

        {/* Corner ornaments */}
        <CornerOrnaments />
      </div>
    </div>
  );
}

function CornerOrnaments() {
  const style = (pos) => ({
    position: 'absolute',
    width: '12px',
    height: '12px',
    ...pos,
  });

  return (
    <>
      <svg style={style({ top: 5, left: 5 })} viewBox="0 0 12 12" fill="none">
        <path d="M0 8 L0 0 L8 0" stroke="#C89B3C" strokeWidth="1.5"/>
      </svg>
      <svg style={style({ top: 5, right: 5 })} viewBox="0 0 12 12" fill="none">
        <path d="M12 8 L12 0 L4 0" stroke="#C89B3C" strokeWidth="1.5"/>
      </svg>
      <svg style={style({ bottom: 5, left: 5 })} viewBox="0 0 12 12" fill="none">
        <path d="M0 4 L0 12 L8 12" stroke="#C89B3C" strokeWidth="1.5"/>
      </svg>
      <svg style={style({ bottom: 5, right: 5 })} viewBox="0 0 12 12" fill="none">
        <path d="M12 4 L12 12 L4 12" stroke="#C89B3C" strokeWidth="1.5"/>
      </svg>
    </>
  );
}
