import { useState } from 'react';

const CONTROLS = [
  { key: 'Left Click', desc: 'Move to location', icon: '🖱️' },
  { key: 'Right Click', desc: 'Auto-attack enemy', icon: '⚔️' },
  { key: 'WASD', desc: 'Move', icon: '⌨️' },
  { key: 'Q', desc: 'Whisper Shot (4th = CRIT)', icon: '🔫' },
  { key: 'W', desc: 'Stun beam (long range)', icon: '⚡' },
  { key: 'E', desc: 'Drop a trap', icon: '💣' },
  { key: 'R (hold)', desc: 'Charged ultimate shot', icon: '🔴' },
];

export default function GameTutorial({ onDismiss }) {
  const [hover, setHover] = useState(false);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(1, 4, 12, 0.88)',
      fontFamily: "'Rajdhani', sans-serif",
      animation: 'tutFadeIn 0.4s ease both',
    }}>
      {/* Panel */}
      <div style={{
        background: 'linear-gradient(160deg, #060E1C 0%, #030810 100%)',
        border: '1px solid rgba(200,155,60,0.5)',
        borderRadius: '4px',
        padding: '28px 32px',
        maxWidth: '520px',
        width: '90%',
        boxShadow: '0 0 60px rgba(200,155,60,0.12), 0 0 120px rgba(0,0,0,0.8)',
        position: 'relative',
        animation: 'tutSlideIn 0.4s cubic-bezier(0.34, 1.3, 0.64, 1) both',
      }}>
        {/* Corner ornaments */}
        <div style={{ position:'absolute', top:0, left:0, width:14, height:14, borderTop:'2px solid #C89B3C', borderLeft:'2px solid #C89B3C' }} />
        <div style={{ position:'absolute', top:0, right:0, width:14, height:14, borderTop:'2px solid #C89B3C', borderRight:'2px solid #C89B3C' }} />
        <div style={{ position:'absolute', bottom:0, left:0, width:14, height:14, borderBottom:'2px solid #C89B3C', borderLeft:'2px solid #C89B3C' }} />
        <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderBottom:'2px solid #C89B3C', borderRight:'2px solid #C89B3C' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '22px',
            color: '#F0E6A0',
            letterSpacing: '4px',
            marginBottom: '4px',
          }}>
            CONTROLS
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '11px',
            color: '#4A6A4A',
            letterSpacing: '2px',
          }}>
            PORTFOLIO.EXE — SURVIVE TO SEE THE RESUME
          </div>
        </div>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'18px' }}>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,transparent,#C89B3C44)' }} />
          <div style={{ color:'#C89B3C', fontSize:'10px' }}>◆</div>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,#C89B3C44,transparent)' }} />
        </div>

        {/* Controls grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          {CONTROLS.map(({ key, desc, icon }) => (
            <div key={key} style={{
              background: 'rgba(10,22,40,0.6)',
              border: '1px solid rgba(200,155,60,0.2)',
              borderRadius: '3px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '14px' }}>{icon}</span>
              <div>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '11px',
                  color: '#F0E6A0',
                  background: 'rgba(200,155,60,0.12)',
                  border: '1px solid rgba(200,155,60,0.3)',
                  borderRadius: '2px',
                  padding: '1px 6px',
                  display: 'inline-block',
                  marginBottom: '3px',
                }}>
                  {key}
                </div>
                <div style={{ color: '#8899AA', fontSize: '11px' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div style={{
          background: 'rgba(200,0,0,0.08)',
          border: '1px solid rgba(200,0,0,0.2)',
          borderRadius: '3px',
          padding: '8px 12px',
          marginBottom: '20px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '11px',
          color: '#CC6666',
          textAlign: 'center',
        }}>
          ⚠ you have 120 HP. enemies hit hard. don't get hit.
        </div>

        {/* Dismiss button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onDismiss}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              background: hover
                ? 'linear-gradient(180deg, #2A2010 0%, #1A1008 100%)'
                : 'linear-gradient(180deg, #1A1408 0%, #0A0804 100%)',
              border: '2px solid #C89B3C',
              color: '#F0E6A0',
              fontFamily: "'Cinzel', serif",
              fontSize: '15px',
              letterSpacing: '4px',
              padding: '12px 40px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: hover
                ? '0 0 30px rgba(200,155,60,0.5)'
                : '0 0 15px rgba(200,155,60,0.2)',
            }}
          >
            LET'S GO
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tutFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tutSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(-20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
