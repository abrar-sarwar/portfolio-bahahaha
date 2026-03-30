import { useState, useEffect } from 'react';

const ROASTS = [
  "bro really got cooked by a Script Kiddie 💀",
  "the firewall said no and so did your future",
  "died with their boots on. and their face on the floor.",
  "this is not the W you were looking for",
  "The Virtuoso has left the chat",
  "your K/D ratio is a cry for help",
  "i'm not mad. i'm just disappointed.",
  "skill issue detected. running diagnostics...",
  "even the Script Kiddie felt bad about that one",
  "bro really died to the FIRST enemy",
];

export default function DeathScreen({ stats, onRestart }) {
  const [visible, setVisible] = useState(false);
  const [roast] = useState(() => ROASTS[Math.floor(Math.random() * ROASTS.length)]);
  const [shake, setShake] = useState(false);
  const [hoverTryAgain, setHoverTryAgain] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
    // Shake on mount
    setTimeout(() => {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }, 200);
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'radial-gradient(ellipse at center, #1A0000 0%, #0A0000 50%, #000 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Rajdhani', sans-serif",
      overflow: 'hidden',
      position: 'relative',
      animation: shake ? 'deathShake 0.5s ease' : 'none',
    }}>
      {/* Blood vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,0.3) 100%)',
        animation: 'bloodPulse 2s ease-in-out infinite',
      }} />

      {/* Skull particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${5 + (i * 8.5) % 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${14 + Math.random() * 16}px`,
            opacity: 0.08 + Math.random() * 0.1,
            animation: `floatDown ${4 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
          }}>💀</div>
        ))}
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(1.3)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        maxWidth: '640px',
        padding: '0 24px',
      }}>

        {/* Skull emoji */}
        <div style={{
          fontSize: '72px',
          marginBottom: '8px',
          animation: 'bonk 0.6s cubic-bezier(0.34, 1.8, 0.64, 1) both',
          animationDelay: '0.1s',
          display: 'inline-block',
        }}>
          💀
        </div>

        {/* DEFEATED */}
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(42px, 8vw, 80px)',
          color: '#CC2222',
          textShadow: '0 0 30px rgba(200,0,0,0.8), 0 0 60px rgba(150,0,0,0.5)',
          letterSpacing: '6px',
          marginBottom: '4px',
          animation: 'splashIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          animationDelay: '0.05s',
          lineHeight: 1,
        }}>
          DEFEATED
        </div>

        {/* Sorry bro */}
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 'clamp(13px, 2.5vw, 18px)',
          color: '#884444',
          letterSpacing: '3px',
          marginBottom: '24px',
          animation: 'fadeInUp 0.4s ease both',
          animationDelay: '0.3s',
          opacity: 0,
        }}>
          sorry bro. you just not cool enough.
        </div>

        {/* Roast */}
        <div style={{
          background: 'rgba(80,0,0,0.3)',
          border: '1px solid rgba(180,0,0,0.3)',
          borderRadius: '4px',
          padding: '14px 24px',
          marginBottom: '28px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '14px',
          color: '#CC6666',
          fontStyle: 'italic',
          animation: 'fadeInUp 0.4s ease both',
          animationDelay: '0.5s',
          opacity: 0,
        }}>
          "{roast}"
        </div>

        {/* Stats (if any) */}
        {stats && (stats.player?.shots > 0) && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '28px',
            marginBottom: '28px',
            flexWrap: 'wrap',
            animation: 'fadeInUp 0.4s ease both',
            animationDelay: '0.65s',
            opacity: 0,
          }}>
            <MiniStat label="damage dealt" value={stats.player?.totalDamageDealt || 0} color="#CC4444" />
            <MiniStat label="shots fired" value={stats.player?.shots || 0} color="#886644" />
            <MiniStat label="crits landed" value={stats.player?.critHits || 0} color="#CC8822" />
          </div>
        )}

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          animation: 'fadeInUp 0.4s ease both',
          animationDelay: '0.8s',
          opacity: 0,
        }}>
          <button
            onClick={onRestart}
            onMouseEnter={() => setHoverTryAgain(true)}
            onMouseLeave={() => setHoverTryAgain(false)}
            style={{
              background: hoverTryAgain ? 'rgba(200,0,0,0.2)' : 'rgba(5,0,0,0.9)',
              border: '2px solid #CC2222',
              color: '#FF6666',
              fontFamily: "'Cinzel', serif",
              fontSize: '15px',
              letterSpacing: '3px',
              padding: '14px 36px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: hoverTryAgain ? '0 0 30px rgba(200,0,0,0.5)' : '0 0 10px rgba(200,0,0,0.2)',
            }}
          >
            {hoverTryAgain ? 'OK FINE, GO AGAIN' : 'TRY AGAIN'}
          </button>
        </div>

        <div style={{
          marginTop: '16px',
          color: '#3A1A1A',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '11px',
          animation: 'fadeInUp 0.4s ease both',
          animationDelay: '1s',
          opacity: 0,
        }}>
          the resume is still here when you're ready. no rush. (please be ready)
        </div>
      </div>

      <style>{`
        @keyframes bloodPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes floatDown {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(15px) rotate(10deg); }
        }
        @keyframes bonk {
          0% { transform: scale(0) rotate(-20deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes splashIn {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes deathShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '24px', color, textShadow: `0 0 8px ${color}66` }}>{value}</div>
      <div style={{ color: '#4A2222', fontSize: '9px', fontFamily: "'Cinzel', serif", letterSpacing: '1px', marginTop: '2px' }}>{label}</div>
    </div>
  );
}
