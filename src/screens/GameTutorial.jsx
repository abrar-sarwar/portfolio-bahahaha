import { useState } from 'react';

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
      background: 'rgba(1, 4, 12, 0.92)',
      fontFamily: "'Rajdhani', sans-serif",
      animation: 'tutFadeIn 0.5s ease both',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #070F1E 0%, #040A14 100%)',
        border: '1px solid rgba(200,155,60,0.4)',
        borderRadius: '4px',
        padding: '32px 36px',
        maxWidth: '580px',
        width: '92%',
        boxShadow: '0 0 80px rgba(200,155,60,0.08), 0 30px 80px rgba(0,0,0,0.9)',
        position: 'relative',
        animation: 'tutSlideIn 0.45s cubic-bezier(0.34, 1.2, 0.64, 1) both',
      }}>
        {/* Corner ornaments */}
        <div style={{ position:'absolute', top:0, left:0, width:16, height:16, borderTop:'2px solid #C89B3C', borderLeft:'2px solid #C89B3C' }} />
        <div style={{ position:'absolute', top:0, right:0, width:16, height:16, borderTop:'2px solid #C89B3C', borderRight:'2px solid #C89B3C' }} />
        <div style={{ position:'absolute', bottom:0, left:0, width:16, height:16, borderBottom:'2px solid #C89B3C', borderLeft:'2px solid #C89B3C' }} />
        <div style={{ position:'absolute', bottom:0, right:0, width:16, height:16, borderBottom:'2px solid #C89B3C', borderRight:'2px solid #C89B3C' }} />

        {/* Gold top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, #C89B3C88, #F0E6A0, #C89B3C88, transparent)',
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '10px',
            color: '#4A6A8A',
            letterSpacing: '4px',
            marginBottom: '8px',
          }}>
            PORTFOLIO.EXE // VIRTUOSO PROTOCOL
          </div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '26px',
            color: '#F0E6A0',
            letterSpacing: '5px',
            textShadow: '0 0 24px rgba(200,155,60,0.35)',
          }}>
            HOW TO PLAY
          </div>
        </div>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'22px' }}>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,transparent,rgba(200,155,60,0.3))' }} />
          <div style={{ color:'#C89B3C', fontSize:'8px', letterSpacing:'3px' }}>CONTROLS</div>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,rgba(200,155,60,0.3),transparent)' }} />
        </div>

        {/* Movement row */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'Left Click', desc: 'Move to location' },
              { key: 'Right Click', desc: 'Attack enemy' },
              { key: 'WASD', desc: 'Move' },
            ].map(({ key, desc }) => (
              <div key={key} style={{
                flex: 1,
                background: 'rgba(200,155,60,0.04)',
                border: '1px solid rgba(200,155,60,0.18)',
                borderRadius: '3px',
                padding: '10px 10px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '11px',
                  color: '#F0E6A0',
                  background: 'rgba(200,155,60,0.1)',
                  border: '1px solid rgba(200,155,60,0.35)',
                  borderRadius: '2px',
                  padding: '2px 8px',
                  display: 'inline-block',
                  marginBottom: '6px',
                }}>{key}</div>
                <div style={{ color: '#6A8AA0', fontSize: '11px', fontFamily: "'Rajdhani', sans-serif" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Abilities divider */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,transparent,rgba(11,196,196,0.2))' }} />
          <div style={{ color:'#0BC4C4', fontSize:'8px', letterSpacing:'3px' }}>ABILITIES</div>
          <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,rgba(11,196,196,0.2),transparent)' }} />
        </div>

        {/* Abilities grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
          {[
            { key: 'Q', label: 'Whisper Shot', note: '4th = CRIT', color: '#AADDAA' },
            { key: 'X', label: 'Stun Beam', note: 'long range', color: '#0BC4C4' },
            { key: 'E', label: 'Drop Trap', note: 'area denial', color: '#FFAA44' },
            { key: 'R', label: 'Curtain Call', note: 'hold to charge', color: '#FF4444' },
          ].map(({ key, label, note, color }) => (
            <div key={key} style={{
              background: 'rgba(5,12,24,0.8)',
              border: `1px solid ${color}33`,
              borderTop: `2px solid ${color}88`,
              borderRadius: '3px',
              padding: '10px 8px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '20px',
                color: color,
                textShadow: `0 0 12px ${color}88`,
                marginBottom: '6px',
                lineHeight: 1,
              }}>{key}</div>
              <div style={{ color: '#C8D8E8', fontSize: '11px', fontWeight: 600, marginBottom: '3px' }}>{label}</div>
              <div style={{
                color: '#3A5060',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '9px',
                letterSpacing: '0.5px',
              }}>{note}</div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div style={{
          background: 'rgba(200,0,0,0.06)',
          border: '1px solid rgba(200,0,0,0.18)',
          borderLeft: '3px solid rgba(200,0,0,0.5)',
          borderRadius: '2px',
          padding: '9px 14px',
          marginBottom: '22px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '11px',
          color: '#AA5555',
          letterSpacing: '0.5px',
        }}>
          you have 120 HP. five bosses stand between you and the resume. don't get hit.
        </div>

        {/* Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onDismiss}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              background: hover
                ? 'linear-gradient(180deg, #2A2010 0%, #1A1008 100%)'
                : 'linear-gradient(180deg, #1A1408 0%, #0A0804 100%)',
              border: '1px solid #C89B3C',
              color: '#F0E6A0',
              fontFamily: "'Cinzel', serif",
              fontSize: '14px',
              letterSpacing: '5px',
              padding: '13px 48px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: hover
                ? '0 0 32px rgba(200,155,60,0.45)'
                : '0 0 14px rgba(200,155,60,0.15)',
              outline: 'none',
            }}
          >
            ENTER THE RIFT
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tutFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tutSlideIn {
          from { opacity: 0; transform: scale(0.92) translateY(-16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
