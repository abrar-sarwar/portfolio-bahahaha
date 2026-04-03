import { useState, useEffect } from 'react';
import { ABRAR_REVEALS, RESUME_SECTIONS, ENEMY_DATA } from '../game/constants.js';

export default function ResumePopup({ enemyIndex, onContinue, onSkip }) {
  const [visible, setVisible] = useState(false);
  const [photoIn, setPhotoIn] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const reveal = ABRAR_REVEALS[enemyIndex];
  const section = RESUME_SECTIONS[enemyIndex];
  const enemy = ENEMY_DATA[enemyIndex];
  const isLast = enemyIndex === 4;

  useEffect(() => {
    setTimeout(() => setVisible(true), 80);
    setTimeout(() => setPhotoIn(true), 380); // photo slides in after card settles
  }, []);

  const handleContinue = () => {
    setVisible(false);
    setTimeout(onContinue, 400);
  };

  const handleSkip = () => {
    setVisible(false);
    setTimeout(onSkip, 400);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      pointerEvents: 'all',
    }}>
      {/* Backdrop */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(2,7,16,0.93)',
        backdropFilter: 'blur(10px)',
      }} />

      {/* Main card */}
      <div style={{
        position: 'relative',
        width: 'min(900px, 96vw)',
        maxHeight: '92vh',
        background: 'linear-gradient(135deg, #050D1C 0%, #020710 60%, #050D1C 100%)',
        border: `2px solid ${isLast ? '#FFD700' : '#C89B3C'}`,
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.93)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isLast
          ? '0 0 80px rgba(255,215,0,0.2), 0 0 200px rgba(0,0,0,0.9)'
          : '0 0 80px rgba(200,155,60,0.12), 0 0 200px rgba(0,0,0,0.9)',
        pointerEvents: 'all',
      }}>
        {/* Gold top bar */}
        <div style={{
          height: '3px',
          background: isLast
            ? 'linear-gradient(90deg, transparent, #FFD700, #FFF8CC, #FFD700, transparent)'
            : 'linear-gradient(90deg, transparent, #C89B3C, #F0E6A0, #C89B3C, transparent)',
          flexShrink: 0,
        }} />

        {/* Header */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(200,155,60,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(204,34,34,0.12)',
              border: '1px solid rgba(204,34,34,0.45)',
              borderRadius: '2px',
              padding: '3px 10px',
            }}>
              <span style={{ color: '#FF7777', fontSize: '10px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '2px' }}>
                ✓ {enemy?.name?.toUpperCase()} ELIMINATED
              </span>
            </div>
            <span style={{ color: '#3A4A5A', fontSize: '10px', fontFamily: "'Share Tech Mono', monospace" }}>
              {enemyIndex + 1} / 5 BOSSES DOWN
            </span>
          </div>

          <button
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: '1px solid rgba(100,100,100,0.35)',
              color: '#445566',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '10px',
              letterSpacing: '1px',
              padding: '4px 12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.target.style.color = '#FF6644';
              e.target.style.borderColor = 'rgba(200,80,50,0.6)';
            }}
            onMouseLeave={e => {
              e.target.style.color = '#445566';
              e.target.style.borderColor = 'rgba(100,100,100,0.35)';
            }}
          >
            aw man, skip to the end →
          </button>
        </div>

        {/* Body */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Photo panel */}
          <div style={{
            width: '260px',
            flexShrink: 0,
            background: 'rgba(3,8,18,0.7)',
            borderRight: '1px solid rgba(200,155,60,0.18)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            gap: '12px',
          }}>
            {!photoError ? (
              <img
                src={reveal?.photo}
                onError={() => setPhotoError(true)}
                style={{
                  width: '100%',
                  maxHeight: '280px',
                  objectFit: 'cover',
                  border: '2px solid rgba(200,155,60,0.25)',
                  borderRadius: '2px',
                  filter: 'brightness(0.97) contrast(1.05)',
                  display: 'block',
                  transform: photoIn ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.95)',
                  opacity: photoIn ? 1 : 0,
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
                  boxShadow: photoIn ? '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(200,155,60,0.1)' : 'none',
                }}
                alt="Abrar"
              />
            ) : (
              <div style={{
                width: '100%',
                height: '200px',
                border: '2px dashed rgba(200,155,60,0.25)',
                borderRadius: '2px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}>
                <div style={{ fontSize: '28px' }}>📸</div>
                <div style={{
                  color: '#334455',
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '9px',
                  textAlign: 'center',
                  lineHeight: 1.7,
                }}>
                  drop your photo at<br />
                  <span style={{ color: '#C89B3C88' }}>public/assets/sprites/</span><br />
                  <span style={{ color: '#C89B3C' }}>abrar{enemyIndex + 1}.png</span>
                </div>
              </div>
            )}

            {/* Chapter indicator */}
            <div style={{
              color: '#3A4A5A',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '9px',
              letterSpacing: '1px',
              textAlign: 'center',
            }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{
                  color: i <= enemyIndex ? '#C89B3C' : '#1A2A3A',
                  marginRight: '4px',
                }}>◆</span>
              ))}
            </div>
          </div>

          {/* Text panel */}
          <div style={{
            flex: 1,
            padding: '24px 26px 16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
          }}>
            {/* Chapter tag */}
            <div style={{
              color: '#C89B3C',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '9px',
              letterSpacing: '3px',
              marginBottom: '8px',
              opacity: 0.8,
            }}>
              {reveal?.tag}
            </div>

            {/* Title */}
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(16px, 2.2vw, 24px)',
              color: isLast ? '#FFD700' : '#F0E6A0',
              letterSpacing: '1px',
              lineHeight: 1.2,
              marginBottom: '16px',
            }}>
              {reveal?.title}
            </div>

            {/* Message box */}
            <div style={{
              color: '#A8C0D8',
              fontSize: '14px',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 500,
              lineHeight: 1.75,
              marginBottom: '16px',
              padding: '14px 16px',
              background: 'rgba(200,155,60,0.04)',
              border: '1px solid rgba(200,155,60,0.12)',
              borderLeft: `3px solid ${isLast ? '#FFD700' : '#C89B3C'}`,
              borderRadius: '2px',
            }}>
              {reveal?.message}
            </div>

            {/* Tags */}
            {reveal?.tags && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {reveal.tags.map(tag => (
                  <span key={tag} style={{
                    background: 'rgba(11,196,196,0.06)',
                    border: '1px solid rgba(11,196,196,0.25)',
                    color: '#0BC4C4',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '10px',
                    padding: '3px 10px',
                    borderRadius: '2px',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Resume section unlock (compact) */}
            {section && (
              <div style={{
                marginTop: 'auto',
                paddingTop: '14px',
                borderTop: '1px solid rgba(200,155,60,0.12)',
              }}>
                <div style={{
                  color: '#C89B3C',
                  fontFamily: "'Cinzel', serif",
                  fontSize: '9px',
                  letterSpacing: '2px',
                  marginBottom: '10px',
                  opacity: 0.8,
                }}>
                  PORTFOLIO UNLOCK: {section.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {section.items.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      gap: '8px',
                      fontSize: '12px',
                      fontFamily: "'Rajdhani', sans-serif",
                      alignItems: 'baseline',
                    }}>
                      <span style={{ color: '#C89B3C', minWidth: '80px', flexShrink: 0 }}>{item.label}</span>
                      <span style={{ color: '#7A8A9A' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLast && (
              <div style={{
                marginTop: 'auto',
                paddingTop: '14px',
                borderTop: '1px solid rgba(255,215,0,0.15)',
                color: '#886600',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '10px',
                letterSpacing: '1px',
                lineHeight: 1.6,
              }}>
                ◆ FULL GALLERY + RESUME UNLOCKED<br />
                <span style={{ color: '#445566' }}>click continue to see everything →</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(200,155,60,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          gap: '12px',
        }}>
          <div style={{
            color: '#2A3A4A',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '10px',
            fontStyle: 'italic',
            flex: 1,
          }}>
            {enemy?.deathQuote}
          </div>

          <button
            onClick={handleContinue}
            style={{
              background: isLast
                ? 'linear-gradient(180deg, #AA6600, #662200)'
                : 'linear-gradient(180deg, #1A1408, #0A0804)',
              border: `1px solid ${isLast ? '#FFD700' : '#C89B3C'}`,
              color: isLast ? '#FFD700' : '#F0E6A0',
              fontFamily: "'Cinzel', serif",
              fontSize: '12px',
              letterSpacing: '3px',
              padding: '10px 28px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: isLast
                ? '0 0 20px rgba(255,180,0,0.3)'
                : '0 0 10px rgba(200,155,60,0.2)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.boxShadow = isLast
                ? '0 0 40px rgba(255,180,0,0.6)'
                : '0 0 20px rgba(200,155,60,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = isLast
                ? '0 0 20px rgba(255,180,0,0.3)'
                : '0 0 10px rgba(200,155,60,0.2)';
            }}
          >
            {isLast ? 'SEE THE GALLERY →' : 'KEEP GOING ›'}
          </button>
        </div>

        {/* Bottom bar */}
        <div style={{
          height: '2px',
          background: isLast
            ? 'linear-gradient(90deg, transparent, #FFD700, transparent)'
            : 'linear-gradient(90deg, transparent, #C89B3C, transparent)',
          flexShrink: 0,
        }} />
      </div>
    </div>
  );
}
