import { useState, useEffect, useRef, useCallback } from 'react';
import emailjs from '@emailjs/browser';
import { soundLoLVictory } from '../game/audio.js';
import { PERSONAL_PHOTOS } from '../game/constants.js';

// ── EMAILJS CONFIG ────────────────────────────────────────────────────────────
// Setup (free, 200 emails/month):
// 1. Go to emailjs.com → sign up
// 2. Email Services → Add Service → Gmail → connect abrartsarwar@gmail.com → copy Service ID
// 3. Email Templates → Create Template:
//    Template A (owner notification) — To: abrartsarwar@gmail.com
//      Subject: Coffee Chat Request — {{visitor_name}} on {{date}} at {{time}}
//      Body: Hey! {{visitor_name}} ({{visitor_email}}) booked a coffee chat for {{date}} at {{time}} EST.
//    Template B (visitor confirmation) — To: {{visitor_email}}
//      Subject: Your Coffee Chat with Abrar — {{date}} at {{time}} EST ☕
//      Body: Hey {{visitor_name}}! Just confirming your coffee chat with Abrar Sarwar on {{date}} at {{time}} EST. Talk soon!
// 4. Account → General → copy Public Key
// Replace the values below:
const EMAILJS_SERVICE_ID  = 'service_wjavhef';
const EMAILJS_OWNER_TPL   = 'template_g7nyx5g';   // Template A → to Abrar
const EMAILJS_VISITOR_TPL = 'template_bzlavjf';   // Template B → to visitor
const EMAILJS_PUBLIC_KEY  = 'EHRaMF15kL1qMpqQT';

const TIME_SLOTS = ['10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

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

export default function VictoryScreen({ stats, skipped, onRestart }) {
  const [phase, setPhase] = useState('splash'); // 'splash' | 'resume'
  const [splashVisible, setSplashVisible] = useState(false);
  const [resumeVisible, setResumeVisible] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const confetti = useConfetti(120);

  useEffect(() => {
    setTimeout(() => setSplashVisible(true), 100);
    try { setTimeout(() => soundLoLVictory(), 400); } catch (e) { /* ignore */ }
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
    return <ResumePhase visible={resumeVisible} stats={stats} skipped={skipped} onRestart={onRestart} confetti={confetti} />;
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

function CalendarModal({ onClose }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [name, setName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [step, setStep] = useState('calendar'); // 'calendar' | 'time' | 'name' | 'sent'
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const isAvailable = useCallback((d) => {
    if (!d) return false;
    const day = d.getDay();
    // weekdays only, must be in the future (not today)
    return day !== 0 && day !== 6 && d > today;
  }, [today]);

  const navMonth = (dir) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
  };

  const handleDayClick = (d) => {
    if (!isAvailable(d)) return;
    setSelectedDate(d);
    setStep('time');
  };

  const handleTimeClick = (t) => {
    setSelectedTime(t);
    setStep('name');
  };

  const formatDate = (d) => d
    ? `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    : '';

  const handleSend = useCallback(async () => {
    if (!name.trim() || !visitorEmail.trim() || !selectedDate || !selectedTime) return;
    setSending(true);
    setError('');
    const dateStr = formatDate(selectedDate);
    const params = {
      visitor_name: name.trim(),
      visitor_email: visitorEmail.trim(),
      date: dateStr,
      time: selectedTime,
    };
    try {
      // Email 1 → Abrar: booking notification
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_OWNER_TPL, params, EMAILJS_PUBLIC_KEY);
      // Email 2 → visitor: confirmation reminder
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_VISITOR_TPL, params, EMAILJS_PUBLIC_KEY);
      setStep('sent');
    } catch {
      setError('Could not send — EmailJS not configured yet. Check the config at top of VictoryScreen.jsx.');
    }
    setSending(false);
  }, [name, visitorEmail, selectedDate, selectedTime]);

  // Build calendar grid for current view month
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  const gold = '#C89B3C';
  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(0,0,0,0.5)', border: `1px solid rgba(200,155,60,0.4)`,
    color: '#F0E6A0', fontFamily: "'Share Tech Mono', monospace", fontSize: '13px',
    padding: '10px 12px', outline: 'none', borderRadius: '2px',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(180deg, #060D1A 0%, #030810 100%)',
        border: `2px solid ${gold}`,
        borderRadius: '4px',
        padding: '28px',
        maxWidth: '440px',
        width: '94%',
        boxShadow: '0 0 60px rgba(200,155,60,0.3)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ fontFamily: "'Cinzel', serif", color: '#FFD700', fontSize: '18px', letterSpacing: '3px', marginBottom: '4px' }}>
          ☕ BOOK A COFFEE CHAT
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", color: '#445', fontSize: '10px', marginBottom: '20px' }}>
          pick a day · pick a time · message sends automatically
        </div>

        {step === 'calendar' && (
          <>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <button onClick={() => navMonth(-1)} style={{ background: 'transparent', border: `1px solid ${gold}44`, color: gold, cursor: 'pointer', padding: '4px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: '12px' }}>‹</button>
              <div style={{ color: '#F0E6A0', fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '2px' }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </div>
              <button onClick={() => navMonth(1)} style={{ background: 'transparent', border: `1px solid ${gold}44`, color: gold, cursor: 'pointer', padding: '4px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: '12px' }}>›</button>
            </div>

            {/* Day labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
              {DAY_LABELS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '9px', color: '#334', fontFamily: "'Share Tech Mono', monospace", padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Calendar cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
              {cells.map((d, i) => {
                if (!d) return <div key={`e${i}`} />;
                const avail = isAvailable(d);
                const isToday = d.getTime() === today.getTime();
                return (
                  <button
                    key={d.getDate()}
                    onClick={() => handleDayClick(d)}
                    disabled={!avail}
                    style={{
                      background: avail ? 'rgba(200,155,60,0.1)' : 'transparent',
                      border: isToday ? `1px solid ${gold}88` : avail ? `1px solid ${gold}44` : '1px solid #111',
                      color: avail ? '#F0E6A0' : '#2A2A2A',
                      cursor: avail ? 'pointer' : 'default',
                      padding: '7px 0',
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '12px',
                      borderRadius: '2px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => avail && (e.currentTarget.style.background = 'rgba(200,155,60,0.25)')}
                    onMouseLeave={e => avail && (e.currentTarget.style.background = 'rgba(200,155,60,0.1)')}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: '14px', fontSize: '10px', color: '#334', fontFamily: "'Share Tech Mono', monospace" }}>
              ◆ highlighted = i'm free &nbsp;|&nbsp; weekdays only &nbsp;|&nbsp; all times EST
            </div>

            <button onClick={onClose} style={{ marginTop: '16px', background: 'transparent', border: '1px solid #222', color: '#334', fontFamily: "'Cinzel', serif", fontSize: '11px', padding: '7px 18px', cursor: 'pointer', letterSpacing: '1px' }}>
              CANCEL
            </button>
          </>
        )}

        {step === 'time' && (
          <>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: gold, marginBottom: '14px' }}>
              {formatDate(selectedDate)} — pick a time:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {TIME_SLOTS.map(t => (
                <button key={t} onClick={() => handleTimeClick(t)} style={{
                  background: 'rgba(200,155,60,0.08)', border: `1px solid ${gold}55`,
                  color: '#F0E6A0', fontFamily: "'Share Tech Mono', monospace", fontSize: '13px',
                  padding: '12px', cursor: 'pointer', borderRadius: '2px', transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,155,60,0.22)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(200,155,60,0.08)')}
                >
                  {t} <span style={{ fontSize: '10px', color: '#445' }}>EST</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('calendar')} style={{ background: 'transparent', border: '1px solid #222', color: '#445', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', padding: '6px 14px', cursor: 'pointer' }}>
              ← back
            </button>
          </>
        )}

        {step === 'name' && (
          <>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: gold, marginBottom: '14px' }}>
              {formatDate(selectedDate)} @ {selectedTime} EST
            </div>

            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#8899BB', marginBottom: '6px' }}>YOUR NAME</div>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Tab' && e.preventDefault()}
              placeholder="enter your name..."
              style={{ ...inputStyle, marginBottom: '12px' }}
            />

            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', color: '#8899BB', marginBottom: '4px' }}>YOUR EMAIL</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#334', marginBottom: '6px' }}>
              so i can send you a reminder ☕
            </div>
            <input
              value={visitorEmail}
              onChange={e => setVisitorEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="your@email.com"
              type="email"
              style={{ ...inputStyle, marginBottom: '0' }}
            />

            {error && (
              <div style={{ color: '#CC4444', fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', marginTop: '8px' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={handleSend}
                disabled={!name.trim() || !visitorEmail.trim() || sending}
                style={{
                  flex: 1,
                  background: name.trim() && visitorEmail.trim() && !sending ? 'linear-gradient(180deg,#AA6600,#662200)' : 'rgba(20,20,20,0.8)',
                  border: `1px solid ${name.trim() && visitorEmail.trim() && !sending ? '#FFD700' : '#333'}`,
                  color: name.trim() && visitorEmail.trim() && !sending ? '#FFD700' : '#444',
                  fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '2px',
                  padding: '10px', cursor: name.trim() && visitorEmail.trim() && !sending ? 'pointer' : 'default', transition: 'all 0.2s',
                }}
              >
                {sending ? 'SENDING...' : 'LOCK IT IN ☕'}
              </button>
              <button onClick={() => setStep('time')} style={{ background: 'transparent', border: '1px solid #222', color: '#445', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', padding: '10px 14px', cursor: 'pointer' }}>←</button>
            </div>
          </>
        )}

        {step === 'sent' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🤝</div>
            <div style={{ color: '#0BC4C4', fontFamily: "'Cinzel', serif", fontSize: '14px', letterSpacing: '2px', marginBottom: '6px' }}>REQUEST SENT!</div>
            <div style={{ color: '#556', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', lineHeight: 1.6 }}>
              {name.trim()} — i got you. {formatDate(selectedDate)} @ {selectedTime} EST.<br />
              <span style={{ color: '#334' }}>talk soon gang 👊</span>
            </div>
            <button onClick={onClose} style={{ marginTop: '20px', background: 'transparent', border: `1px solid ${gold}`, color: gold, fontFamily: "'Cinzel', serif", fontSize: '12px', letterSpacing: '2px', padding: '8px 24px', cursor: 'pointer' }}>CLOSE</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoStrip({ side }) {
  // Duplicate photos for seamless infinite scroll
  const photos = [...PERSONAL_PHOTOS, ...PERSONAL_PHOTOS, ...PERSONAL_PHOTOS];
  const totalHeight = PERSONAL_PHOTOS.length * 340;
  const dir = side === 'left' ? 'scrollDown' : 'scrollUp';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      [side]: 0,
      width: '26%',
      height: '100vh',
      overflow: 'hidden',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      {/* Scrolling strip */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '6px',
        animation: `${dir} ${PERSONAL_PHOTOS.length * 6}s linear infinite`,
        willChange: 'transform',
      }}>
        {photos.map((src, i) => (
          <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={src}
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '4px',
                display: 'block',
              }}
              alt=""
              onError={e => { e.target.parentElement.style.display = 'none'; }}
            />
          </div>
        ))}
      </div>

      {/* Low dark overlay over photos */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'rgba(2,7,16,0.35)',
        pointerEvents: 'none',
      }} />

      {/* Top fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '140px', zIndex: 2,
        background: 'linear-gradient(180deg, #020710 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px', zIndex: 2,
        background: 'linear-gradient(0deg, #020710 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      {/* Inner edge fade — blends into resume */}
      <div style={{
        position: 'absolute',
        top: 0,
        [side === 'left' ? 'right' : 'left']: 0,
        width: '80px',
        height: '100%',
        zIndex: 2,
        background: side === 'left'
          ? 'linear-gradient(270deg, #020710 0%, transparent 100%)'
          : 'linear-gradient(90deg, #020710 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes scrollUp {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-${totalHeight}px); }
        }
        @keyframes scrollDown {
          0%   { transform: translateY(-${totalHeight}px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function ResumePhase({ visible, stats, skipped, onRestart, confetti }) {
  const [showCoffee, setShowCoffee] = useState(false);
  return (
    <>
    {showCoffee && <CalendarModal onClose={() => setShowCoffee(false)} />}
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
      {/* Photo strips — left and right */}
      <PhotoStrip side="left" />
      <PhotoStrip side="right" />

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
        width: '48%',
        minWidth: '340px',
        maxWidth: '700px',
        padding: '40px 24px 60px 24px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'all 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)',
      }}>

        {/* Skip shame banner */}
        {skipped && (
          <div style={{
            marginBottom: '24px',
            padding: '18px 24px',
            background: 'rgba(180,60,0,0.07)',
            border: '1px solid rgba(200,80,0,0.25)',
            borderLeft: '3px solid rgba(200,80,0,0.6)',
            borderRadius: '3px',
            textAlign: 'left',
          }}>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              color: 'rgba(200,80,0,0.6)',
              letterSpacing: '3px',
              marginBottom: '8px',
            }}>
              EASY ROUTE DETECTED
            </div>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '16px',
              color: '#C8A080',
              lineHeight: 1.7,
              fontWeight: 500,
            }}>
              damn. you took the easy way out.
              <br />
              <span style={{ color: '#7A6050' }}>
                i guess you can see my stuff...
              </span>
            </div>
          </div>
        )}

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
                <ContactLink icon="✉" text="abrartsarwar@gmail.com" href="mailto:abrartsarwar@gmail.com" />
                <ContactLink icon="📞" text="470-399-2597" href="tel:4703992597" />
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
            <ResumeBlock title="COUNTERSTACK PROJECT" funny="(Hacklanta winner btw 🏆)">
              <ResumeItem label="Award" value="Hacklanta Winner! 🏆" accent />
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
          <ActionButton href="mailto:abrartsarwar@gmail.com" color="#FF8800">
            ✉ HIRE ME (EMAIL)
          </ActionButton>
          <ActionButton href="https://linkedin.com/in/abrar-sarwar" color="#0BC4C4">
            🔗 LINKEDIN
          </ActionButton>
          <ActionButton onClick={() => setShowCoffee(true)} color="#22FF88">
            ☕ BOOK A COFFEE CHAT
          </ActionButton>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#2A3A4A', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px' }}>
          built with react + canvas + way too much free time · PORTFOLIO.EXE v1.0
        </div>

        {/* Easter egg hint */}
        <div style={{
          marginTop: '28px',
          padding: '20px 24px',
          border: '1px solid rgba(200,155,60,0.4)',
          borderRadius: '3px',
          background: 'rgba(200,155,60,0.06)',
          boxShadow: '0 0 24px rgba(200,155,60,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* shimmer top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent, #C89B3C, transparent)',
            animation: 'shimmer 2.5s ease-in-out infinite',
          }} />

          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '10px',
            color: '#C89B3C',
            letterSpacing: '3px',
            marginBottom: '12px',
            opacity: 0.7,
          }}>
            CLASSIFIED
          </div>

          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '22px',
            color: '#F0E6A0',
            letterSpacing: '6px',
            marginBottom: '12px',
            textShadow: '0 0 18px rgba(200,155,60,0.4)',
          }}>
            YWJyYXI=
          </div>

          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '14px',
            color: '#8899AA',
            lineHeight: 1.7,
            marginBottom: '14px',
          }}>
            This is my name... but encoded in Base64.
          </div>

          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '14px',
            color: '#F0E6A0',
            fontWeight: 600,
            lineHeight: 1.7,
            padding: '12px 16px',
            border: '1px solid rgba(200,155,60,0.5)',
            borderLeft: '3px solid #C89B3C',
            borderRadius: '2px',
            background: 'rgba(200,155,60,0.1)',
            boxShadow: '0 0 16px rgba(200,155,60,0.1)',
          }}>
            Copy the code above, click <span style={{ color: '#C89B3C', fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '1px' }}>PLAY AGAIN</span>, and enter it into the <span style={{ color: '#C89B3C', fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '1px' }}>CLASSIFIED</span> box to unlock something special.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
    </>
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
