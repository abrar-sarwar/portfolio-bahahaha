import { useState, useEffect, useRef } from 'react';

const CONFETTI_COLORS = ['#C89B3C', '#F0E6A0', '#FF4400', '#FF8800', '#FFCC00', '#FF2200', '#FFE066'];

function useConfetti(count = 120) {
  const [particles, setParticles] = useState([]);
  const animRef = useRef(null);
  const stateRef = useRef([]);

  useEffect(() => {
    stateRef.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 30,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 0.8 + Math.random() * 2,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 10,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    const tick = () => {
      stateRef.current = stateRef.current.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        rot: p.rot + p.vrot,
        vy: p.vy + 0.03,
      })).filter(p => p.y < 120).concat(
        stateRef.current.filter(p => p.y >= 120).map(() => ({
          id: Math.random(),
          x: Math.random() * 100,
          y: -10,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 0.8 + Math.random() * 2,
          rot: Math.random() * 360,
          vrot: (Math.random() - 0.5) * 8,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 8 + Math.random() * 10,
          shape: Math.random() > 0.5 ? 'rect' : 'circle',
        }))
      );
      setParticles([...stateRef.current]);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [count]);

  return particles;
}

export default function VictoryScreen({ stats, onRestart }) {
  const [phase, setPhase] = useState('splash'); // 'splash' | 'resume'
  const [splashVisible, setSplashVisible] = useState(false);
  const [resumeVisible, setResumeVisible] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const confetti = useConfetti(120);

  useEffect(() => {
    setTimeout(() => setSplashVisible(true), 100);
    // Glitch effect on pentakill text
    const gi = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 60);
    }, 1800 + Math.random() * 1200);
    return () => clearInterval(gi);
  }, []);

  const goToResume = () => {
    setPhase('resume');
    setTimeout(() => setResumeVisible(true), 50);
  };

  if (phase === 'resume') {
    return <ResumePhase visible={resumeVisible} stats={stats} onRestart={onRestart} confetti={confetti} />;
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Rajdhani', sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Confetti */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {confetti.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            width: `${p.size}px`,
            height: p.shape === 'circle' ? `${p.size}px` : `${p.size * 0.4}px`,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            background: p.color,
            transform: `rotate(${p.rot}deg)`,
            opacity: 0.9,
          }} />
        ))}
      </div>

      {/* Fire background pulses */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 60%, rgba(255,80,0,0.25) 0%, rgba(200,50,0,0.1) 40%, transparent 70%)',
        animation: 'firePulse 1.2s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, rgba(255,200,0,0.15) 0%, transparent 50%)',
        animation: 'firePulse 0.9s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        opacity: splashVisible ? 1 : 0,
        transform: splashVisible ? 'scale(1)' : 'scale(0.85)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Kill counter */}
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '14px',
          color: '#FF8800',
          letterSpacing: '6px',
          marginBottom: '12px',
          animation: 'fadeInUp 0.5s ease both',
          animationDelay: '0.2s',
          opacity: 0,
        }}>
          ★ ★ ★ &nbsp; 5 / 5 SLAIN &nbsp; ★ ★ ★
        </div>

        {/* PENTAKILL */}
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(52px, 10vw, 110px)',
          color: glitch ? '#FF2200' : '#FFD700',
          textShadow: glitch
            ? '6px 0 #FF4400, -6px 0 #FF0000, 0 0 60px #FF2200, 0 0 120px #FF4400'
            : '0 0 40px rgba(255,180,0,0.9), 0 0 80px rgba(255,100,0,0.6), 0 0 160px rgba(255,50,0,0.3)',
          letterSpacing: '8px',
          marginBottom: '8px',
          animation: 'splashIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          animationDelay: '0.1s',
          transition: 'color 0.04s, text-shadow 0.04s',
          lineHeight: 1,
        }}>
          PENTAKILL
        </div>

        {/* Subtitle */}
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 'clamp(11px, 1.8vw, 15px)',
          color: '#CC8800',
          letterSpacing: '8px',
          marginBottom: '48px',
          animation: 'fadeInUp 0.5s ease both',
          animationDelay: '0.4s',
          opacity: 0,
        }}>
          PORTFOLIO.EXE — ALL THREATS NEUTRALIZED
        </div>

        {/* Virtuoso quote */}
        <div style={{
          color: '#886600',
          fontStyle: 'italic',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '13px',
          marginBottom: '40px',
          animation: 'fadeInUp 0.5s ease both',
          animationDelay: '0.6s',
          opacity: 0,
        }}>
          "They said I was overqualified. They were correct." — The Virtuoso
        </div>

        {/* CTA */}
        <div style={{
          animation: 'fadeInUp 0.5s ease both',
          animationDelay: '0.9s',
          opacity: 0,
        }}>
          <button
            onClick={goToResume}
            style={{
              background: 'linear-gradient(180deg, #CC6600 0%, #882200 100%)',
              border: '2px solid #FFD700',
              color: '#FFD700',
              fontFamily: "'Cinzel', serif",
              fontSize: '18px',
              letterSpacing: '4px',
              padding: '16px 56px',
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(255,150,0,0.5), 0 0 60px rgba(255,50,0,0.3)',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.06)';
              e.currentTarget.style.boxShadow = '0 0 50px rgba(255,150,0,0.8), 0 0 100px rgba(255,50,0,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255,150,0,0.5), 0 0 60px rgba(255,50,0,0.3)';
            }}
          >
            OK FINE, VIEW MY RESUME →
          </button>
          <div style={{ color: '#554400', fontSize: '11px', marginTop: '10px', fontFamily: "'Share Tech Mono', monospace" }}>
            (seriously though, hire me)
          </div>
        </div>
      </div>

      <style>{`
        @keyframes firePulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes splashIn {
          0% { opacity: 0; transform: scale(0.4) rotate(-3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function ResumePhase({ visible, stats, onRestart, confetti }) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #020710 0%, #050D1C 50%, #0A1628 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontFamily: "'Rajdhani', sans-serif",
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      {/* Confetti still going */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {confetti.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            width: `${p.size}px`,
            height: p.shape === 'circle' ? `${p.size}px` : `${p.size * 0.4}px`,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            background: p.color,
            transform: `rotate(${p.rot}deg)`,
            opacity: 0.7,
          }} />
        ))}
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '800px',
        padding: '40px 20px 60px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'all 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)',
      }}>

        {/* HIRE ME hero banner */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(200,155,60,0.15) 0%, rgba(255,100,0,0.08) 100%)',
          border: '2px solid #C89B3C',
          borderRadius: '4px',
          boxShadow: '0 0 40px rgba(200,155,60,0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Shimmer bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, transparent, #FFD700, #FF8800, #FFD700, transparent)',
            animation: 'shimmer 2s ease-in-out infinite',
          }} />

          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '11px',
            color: '#886600',
            letterSpacing: '4px',
            marginBottom: '8px',
          }}>
            YOU BEAT THE GAME. HERE'S YOUR REWARD:
          </div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(36px, 7vw, 72px)',
            color: '#FFD700',
            textShadow: '0 0 30px rgba(255,180,0,0.7), 0 0 60px rgba(255,100,0,0.4)',
            letterSpacing: '10px',
            lineHeight: 1,
            marginBottom: '8px',
          }}>
            HIRE ME
          </div>
          <div style={{
            color: '#C89B3C',
            fontSize: '13px',
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: '2px',
          }}>
            (no seriously. i built a video game for my portfolio. come on.)
          </div>
        </div>

        {/* Resume card */}
        <div style={{
          background: 'linear-gradient(180deg, #060D1A 0%, #030810 100%)',
          border: '1px solid rgba(200,155,60,0.5)',
          borderRadius: '2px',
          padding: '28px',
          marginBottom: '20px',
          boxShadow: '0 0 30px rgba(200,155,60,0.1)',
          position: 'relative',
        }}>
          {/* Corner ornaments */}
          {['top:0;left:0', 'top:0;right:0', 'bottom:0;left:0', 'bottom:0;right:0'].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute',
              ...Object.fromEntries(pos.split(';').map(s => s.split(':'))),
              width: '16px', height: '16px',
              borderTop: i < 2 ? '2px solid #C89B3C' : 'none',
              borderBottom: i >= 2 ? '2px solid #C89B3C' : 'none',
              borderLeft: i % 2 === 0 ? '2px solid #C89B3C' : 'none',
              borderRight: i % 2 === 1 ? '2px solid #C89B3C' : 'none',
            }} />
          ))}

          {/* Name + contact */}
          <div style={{ marginBottom: '20px', borderBottom: '1px solid rgba(200,155,60,0.3)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(22px, 3.5vw, 34px)',
                  color: '#F0E6A0',
                  marginBottom: '4px',
                }}>
                  ABRAR SARWAR
                </h2>
                <div style={{ color: '#C89B3C', fontSize: '13px', letterSpacing: '2px' }}>
                  Cybersecurity Analyst · GRC · Offensive Security
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <ContactLink icon="✉" text="abrarsarwar98@gmail.com" href="mailto:abrarsarwar98@gmail.com" />
                <ContactLink icon="🔗" text="linkedin.com/in/abrar-sarwar" href="https://linkedin.com/in/abrar-sarwar" />
              </div>
            </div>
          </div>

          {/* Education — full row */}
          <ResumeBlock title="EDUCATION" funny="(3.6 GPA. yes really.)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
              <ResumeItem label="University" value="Georgia State University" />
              <ResumeItem label="Degree" value="B.S. Computer Information Systems" />
              <ResumeItem label="GPA" value="3.6 / 4.0" accent />
              <ResumeItem label="Cert" value="CompTIA Security+" accent />
              <ResumeItem label="Honors" value="Dean's List — 2 semesters" />
            </div>
          </ResumeBlock>

          <Divider />

          {/* Skills grid */}
          <ResumeBlock title="TECHNICAL SKILLS" funny="(not just vibes, actual skills)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
              <ResumeItem label="Languages" value="Python · SQL · TypeScript · PowerShell · Bash" />
              <ResumeItem label="Security Tools" value="Splunk · Wireshark · Nmap · Nessus · Burp Suite" />
              <ResumeItem label="Cloud" value="AWS · Azure · Terraform (IaC)" />
              <ResumeItem label="OS & Admin" value="Linux (Kali/Ubuntu) · Windows Server · Active Directory" />
              <ResumeItem label="Frameworks" value="MITRE ATT&CK · NIST · ISO 27001 · OWASP Top 10" />
            </div>
          </ResumeBlock>

          <Divider />

          {/* Projects */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <ResumeBlock title="COUNTERSTACK PROJECT" funny="(hackathon winner btw 👑)">
              <ResumeItem label="Award" value="Hackathon Winner — 1st Place" accent />
              <ResumeItem label="Scale" value="10,000+ security events processed daily" />
              <ResumeItem label="Framework" value="MITRE ATT&CK gamification engine" />
              <ResumeItem label="Stack" value="React · FastAPI · PostgreSQL · Docker" />
              <ResumeItem label="Impact" value="Reduced analyst triage time by 40%" />
            </ResumeBlock>

            <ResumeBlock title="GRC & RISK ANALYSIS" funny="(real data, real findings)">
              <ResumeItem label="Dataset" value="World Bank — 11,000+ global projects" />
              <ResumeItem label="Finding" value="64.1% cancellation rate (South Asia)" accent />
              <ResumeItem label="Tools" value="Excel · Power BI · Risk Modeling" />
              <ResumeItem label="Output" value="Predictive risk dashboard" />
              <ResumeItem label="Methodology" value="Quantitative risk analysis + regression" />
            </ResumeBlock>

            <ResumeBlock title="HOMELAB & CLOUD" funny="(yes i have a homelab, yes it's overkill)">
              <ResumeItem label="SIEM" value="Splunk — 5,000+ logs/day pipeline" />
              <ResumeItem label="Network" value="Snort IDS · pfSense · VLAN segmentation" />
              <ResumeItem label="IaC" value="Terraform on AWS + Azure" />
              <ResumeItem label="Pentesting" value="20+ authorized assessments completed" accent />
              <ResumeItem label="Detection" value="Custom Sigma rules + alerting workflows" />
            </ResumeBlock>

            <ResumeBlock title="LEADERSHIP" funny="(i actually like talking to people)">
              <ResumeItem label="Role" value="Cybersecurity Club Officer" />
              <ResumeItem label="Event" value="Hosted CTF workshop — 60+ students" accent />
              <ResumeItem label="Mentor" value="Peer mentoring program (2 cycles)" />
              <ResumeItem label="Community" value="Open source contributor" />
            </ResumeBlock>
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
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ color: '#888', fontSize: '10px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '1px', marginBottom: '4px' }}>YOUR SCORE</div>
              <StatBadge label="TOTAL DAMAGE" value={stats.player?.totalDamageDealt || 0} color="#CC2222" />
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <StatBadge label="CRIT HITS" value={stats.player?.critHits || 0} color="#C89B3C" />
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <StatBadge label="SHOTS FIRED" value={stats.player?.shots || 0} color="#0BC4C4" />
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <StatBadge label="ENEMIES SLAIN" value="5/5" color="#22FF88" />
            </div>
          </div>
        )}

        {/* Final funny quote */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          marginBottom: '28px',
          border: '1px solid rgba(200,155,60,0.15)',
          borderRadius: '2px',
          background: 'rgba(5,10,20,0.5)',
        }}>
          <div style={{ color: '#C89B3C', fontFamily: "'Cinzel', serif", fontSize: '11px', letterSpacing: '2px', marginBottom: '8px' }}>
            CLOSING STATEMENT
          </div>
          <div style={{ color: '#8899BB', fontStyle: 'italic', fontSize: '14px', lineHeight: 1.7 }}>
            You just beat five cyber-threats, witnessed a pentakill, and unlocked my entire resume.<br />
            <span style={{ color: '#F0E6A0' }}>The ball is in your court now.</span>{' '}
            <span style={{ color: '#666' }}>(please, the internship market is rough)</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <ActionButton onClick={onRestart} color="#C89B3C">
            ↩ PLAY AGAIN
          </ActionButton>
          <ActionButton href="mailto:abrarsarwar98@gmail.com" color="#FF8800">
            ✉ HIRE ME (EMAIL)
          </ActionButton>
          <ActionButton href="https://linkedin.com/in/abrar-sarwar" color="#0BC4C4">
            🔗 LINKEDIN
          </ActionButton>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#2A3A4A', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px' }}>
          built with react + canvas + way too much free time · PORTFOLIO.EXE v1.0
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(200,155,60,0.2)' }} />
      <div style={{ color: '#C89B3C', fontSize: '10px' }}>◆</div>
      <div style={{ flex: 1, height: '1px', background: 'rgba(200,155,60,0.2)' }} />
    </div>
  );
}

function ResumeBlock({ title, funny, children }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '10px',
          color: '#C89B3C',
          letterSpacing: '2px',
        }}>
          {title}
        </div>
        {funny && (
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '10px',
            color: '#3A4A3A',
            fontStyle: 'italic',
          }}>
            {funny}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function ResumeItem({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
      <div style={{
        width: '2px', minWidth: '2px',
        background: accent ? '#0BC4C4' : 'rgba(200,155,60,0.4)',
        alignSelf: 'stretch',
        marginTop: '2px',
      }} />
      <div>
        <span style={{ color: '#6A7A8A', fontSize: '10px', fontFamily: "'Share Tech Mono', monospace", marginRight: '6px' }}>{label}:</span>
        <span style={{ color: accent ? '#0BC4C4' : '#C8D8E8', fontSize: '13px', fontWeight: 500 }}>{value}</span>
      </div>
    </div>
  );
}

function ContactLink({ icon, text, href }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      color: '#8899BB', fontFamily: "'Share Tech Mono', monospace",
      fontSize: '11px', textDecoration: 'none', transition: 'color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.color = '#C89B3C'}
    onMouseLeave={e => e.currentTarget.style.color = '#8899BB'}
    >
      <span>{icon}</span><span>{text}</span>
    </a>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '22px', color,
        textShadow: `0 0 10px ${color}66`,
        fontWeight: 'bold',
      }}>{value}</div>
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '8px', color: '#4A5A6A',
        letterSpacing: '1px', marginTop: '2px',
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
    return <a href={href} target="_blank" rel="noopener noreferrer" style={style} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{children}</a>;
  }
  return <button style={style} onClick={onClick} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{children}</button>;
}
