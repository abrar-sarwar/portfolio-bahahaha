import { useState, useEffect, useRef } from 'react';

const CONFETTI_COLORS = ['#C89B3C', '#F0E6A0', '#0BC4C4', '#CC2222', '#FFFFFF', '#6699FF'];

function useConfetti(count = 80) {
  const [particles, setParticles] = useState([]);
  const animRef = useRef(null);
  const stateRef = useRef([]);

  useEffect(() => {
    stateRef.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 0.5 + Math.random() * 1.5,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    const tick = () => {
      stateRef.current = stateRef.current.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        rot: p.rot + p.vrot,
        vy: p.vy + 0.02,
      })).filter(p => p.y < 120).concat(
        stateRef.current.filter(p => p.y >= 120).map(() => ({
          id: Math.random(),
          x: Math.random() * 100,
          y: -10,
          vx: (Math.random() - 0.5) * 0.8,
          vy: 0.5 + Math.random() * 1.5,
          rot: Math.random() * 360,
          vrot: (Math.random() - 0.5) * 5,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 6 + Math.random() * 8,
          shape: Math.random() > 0.5 ? 'rect' : 'circle',
        }))
      );
      setParticles([...stateRef.current]);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [count]);

  return particles;
}

export default function VictoryScreen({ stats, onRestart }) {
  const [visible, setVisible] = useState(false);
  const confetti = useConfetti(60);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #020710 0%, #050D1C 40%, #0A1628 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontFamily: "'Rajdhani', sans-serif",
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      {/* Confetti */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {confetti.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            width: p.shape === 'circle' ? `${p.size}px` : `${p.size}px`,
            height: p.shape === 'circle' ? `${p.size}px` : `${p.size * 0.5}px`,
            borderRadius: p.shape === 'circle' ? '50%' : '1px',
            background: p.color,
            transform: `rotate(${p.rot}deg)`,
            opacity: 0.85,
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '760px',
        padding: '40px 20px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(30px)',
        transition: 'all 0.8s ease',
      }}>
        {/* PENTAKILL header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(32px, 6vw, 60px)',
            color: '#F0E6A0',
            textShadow: '0 0 40px rgba(200,155,60,0.8), 0 0 80px rgba(200,155,60,0.4)',
            letterSpacing: '8px',
            marginBottom: '4px',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            PENTAKILL
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 'clamp(10px, 1.5vw, 14px)',
            color: '#0BC4C4',
            letterSpacing: '6px',
          }}>
            VIRTUOSO PROTOCOL: COMPLETE
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #C89B3C)' }} />
          <div style={{ color: '#C89B3C' }}>◆</div>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #C89B3C, transparent)' }} />
        </div>

        {/* Resume card */}
        <div style={{
          background: 'linear-gradient(180deg, #060D1A 0%, #030810 100%)',
          border: '1px solid rgba(200,155,60,0.5)',
          borderRadius: '2px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 0 30px rgba(200,155,60,0.1)',
          position: 'relative',
        }}>
          {/* Name header */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid rgba(200,155,60,0.3)', paddingBottom: '16px' }}>
            <h2 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(22px, 3.5vw, 32px)',
              color: '#F0E6A0',
              marginBottom: '4px',
            }}>
              ABRAR SARWAR
            </h2>
            <div style={{ color: '#C89B3C', fontSize: '14px', letterSpacing: '2px' }}>
              Cybersecurity Analyst · GRC · Offensive Security
            </div>
          </div>

          {/* Resume sections in grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

            {/* Education */}
            <ResumeBlock title="EDUCATION">
              <ResumeItem label="University" value="Georgia State University" />
              <ResumeItem label="Degree" value="B.S. Computer Information Systems" />
              <ResumeItem label="GPA" value="3.6 / 4.0" />
              <ResumeItem label="Cert" value="CompTIA Security+" />
            </ResumeBlock>

            {/* Technical Skills */}
            <ResumeBlock title="TECHNICAL SKILLS">
              <ResumeItem label="Languages" value="Python · SQL · TypeScript · PowerShell · Bash" />
              <ResumeItem label="Security" value="Splunk · Wireshark · Nmap · Nessus · Burp Suite" />
              <ResumeItem label="Cloud" value="AWS · Azure · Terraform" />
              <ResumeItem label="OS" value="Linux (Kali/Ubuntu) · Windows Server · AD" />
            </ResumeBlock>

            {/* CounterStack */}
            <ResumeBlock title="COUNTERSTACK PROJECT">
              <ResumeItem label="Award" value="Hackathon Winner — 1st Place" accent />
              <ResumeItem label="Scale" value="10,000+ security events/day" />
              <ResumeItem label="Framework" value="MITRE ATT&CK gamification" />
              <ResumeItem label="Stack" value="React · FastAPI · PostgreSQL · Docker" />
            </ResumeBlock>

            {/* GRC */}
            <ResumeBlock title="GRC & RISK ANALYSIS">
              <ResumeItem label="Dataset" value="World Bank — 11,000+ projects" />
              <ResumeItem label="Finding" value="64.1% cancellation rate (South Asia)" accent />
              <ResumeItem label="Tools" value="Excel · Power BI · Risk Modeling" />
              <ResumeItem label="Output" value="Predictive risk dashboard" />
            </ResumeBlock>

            {/* Homelab */}
            <ResumeBlock title="HOMELAB & CLOUD">
              <ResumeItem label="SIEM" value="Splunk — 5,000+ logs/day pipeline" />
              <ResumeItem label="Network" value="Snort IDS · pfSense · VLAN segments" />
              <ResumeItem label="IaC" value="Terraform on AWS + Azure" />
              <ResumeItem label="Pentesting" value="20+ authorized assessments" accent />
            </ResumeBlock>

            {/* Leadership */}
            <ResumeBlock title="LEADERSHIP">
              <ResumeItem label="Role" value="Cybersecurity Club Officer" />
              <ResumeItem label="Event" value="Hosted CTF workshop (60+ students)" />
              <ResumeItem label="Mentor" value="Peer mentoring program (2 cycles)" />
              <ResumeItem label="GPA" value="Dean's List — 2 semesters" accent />
            </ResumeBlock>
          </div>

          {/* Contact */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(200,155,60,0.2)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <ContactLink icon="✉" text="abrarsarwar98@gmail.com" href="mailto:abrarsarwar98@gmail.com" />
            <ContactLink icon="🔗" text="linkedin.com/in/abrar-sarwar" href="https://linkedin.com/in/abrar-sarwar" />
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{
            background: 'rgba(5,13,28,0.8)',
            border: '1px solid rgba(200,155,60,0.3)',
            borderRadius: '2px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <StatBadge label="TOTAL DAMAGE" value={stats.player?.totalDamageDealt || 0} color="#CC2222" />
            <StatBadge label="CRIT HITS" value={stats.player?.critHits || 0} color="#C89B3C" />
            <StatBadge label="SHOTS FIRED" value={stats.player?.shots || 0} color="#0BC4C4" />
            <StatBadge label="ENEMIES SLAIN" value="5" color="#22FF88" />
          </div>
        )}

        {/* Virtuoso quote */}
        <div style={{
          textAlign: 'center',
          color: '#4A5A6A',
          fontStyle: 'italic',
          fontSize: '13px',
          fontFamily: "'Share Tech Mono', monospace",
          marginBottom: '24px',
        }}>
          "I promise I won't miss." — The Virtuoso
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <ActionButton onClick={onRestart} color="#C89B3C">
            ↩ PLAY AGAIN
          </ActionButton>
          <ActionButton href="mailto:abrarsarwar98@gmail.com" color="#0BC4C4">
            ✉ CONTACT
          </ActionButton>
          <ActionButton href="https://linkedin.com/in/abrar-sarwar" color="#6699FF">
            🔗 LINKEDIN
          </ActionButton>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

function ResumeBlock({ title, children }) {
  return (
    <div>
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '10px',
        color: '#C89B3C',
        letterSpacing: '2px',
        marginBottom: '10px',
        paddingBottom: '4px',
        borderBottom: '1px solid rgba(200,155,60,0.2)',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ResumeItem({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
      <div style={{
        width: '2px',
        minWidth: '2px',
        background: accent ? '#0BC4C4' : 'rgba(200,155,60,0.4)',
        alignSelf: 'stretch',
        marginTop: '2px',
      }} />
      <div>
        <span style={{
          color: '#6A7A8A',
          fontSize: '10px',
          fontFamily: "'Share Tech Mono', monospace",
          marginRight: '6px',
        }}>{label}:</span>
        <span style={{
          color: accent ? '#0BC4C4' : '#C8D8E8',
          fontSize: '13px',
          fontWeight: 500,
        }}>{value}</span>
      </div>
    </div>
  );
}

function ContactLink({ icon, text, href }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#8899BB',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '12px',
      textDecoration: 'none',
      transition: 'color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.color = '#C89B3C'}
    onMouseLeave={e => e.currentTarget.style.color = '#8899BB'}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </a>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '22px',
        color,
        textShadow: `0 0 10px ${color}66`,
        fontWeight: 'bold',
      }}>{value}</div>
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '8px',
        color: '#4A5A6A',
        letterSpacing: '1px',
        marginTop: '2px',
      }}>{label}</div>
    </div>
  );
}

function ActionButton({ onClick, href, color, children }) {
  const style = {
    background: 'rgba(5,13,28,0.9)',
    border: `1px solid ${color}`,
    color: color,
    fontFamily: "'Cinzel', serif",
    fontSize: '13px',
    letterSpacing: '2px',
    padding: '12px 24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: `0 0 10px ${color}22`,
  };

  const hoverIn = e => {
    e.currentTarget.style.background = `${color}22`;
    e.currentTarget.style.boxShadow = `0 0 20px ${color}66`;
  };
  const hoverOut = e => {
    e.currentTarget.style.background = 'rgba(5,13,28,0.9)';
    e.currentTarget.style.boxShadow = `0 0 10px ${color}22`;
  };

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        style={style} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
        {children}
      </a>
    );
  }
  return (
    <button style={style} onClick={onClick} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
      {children}
    </button>
  );
}
