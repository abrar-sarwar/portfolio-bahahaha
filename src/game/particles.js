import { GROUND_Y } from './constants.js';

// ── Particle pool ─────────────────────────────────────────────────────────────
export function createParticleSystem() {
  return {
    particles: [],
    damageNumbers: [],
    clickRipples: [],
    riftParticles: Array.from({ length: 70 }, () => createRiftParticle()),
  };
}

function createRiftParticle() {
  return {
    x: Math.random() * 1280,
    y: GROUND_Y + Math.random() * 100,
    vx: (Math.random() - 0.5) * 0.5,
    vy: -(Math.random() * 0.8 + 0.2),
    size: Math.random() * 3 + 1,
    alpha: Math.random() * 0.6 + 0.2,
    color: Math.random() > 0.5 ? '#0BC4C4' : '#C89B3C',
    life: Math.random() * 180,
    maxLife: 180 + Math.random() * 120,
  };
}

export function spawnParticle(ps, x, y, vx, vy, color, size, life) {
  ps.particles.push({ x, y, vx, vy, color, size, alpha: 1, life, maxLife: life });
}

export function spawnDamageNumber(ps, x, y, text, type) {
  // type: 'normal' | 'crit' | 'beam' | 'player'
  const colors = { normal: '#FFFFFF', crit: '#C89B3C', beam: '#0BC4C4', player: '#FF4444', heal: '#44FF88' };
  ps.damageNumbers.push({
    x, y,
    vy: -1.8,
    text: String(text),
    color: colors[type] || '#FFFFFF',
    alpha: 1,
    life: 70,
    isCrit: type === 'crit',
  });
}

export function spawnClickRipple(ps, x, y, color) {
  ps.clickRipples.push({ x, y, r: 4, maxR: 40, alpha: 0.9, color: color || '#22FF55' });
}

export function spawnHitSparks(ps, x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
    const speed = Math.random() * 3 + 1;
    spawnParticle(ps, x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, Math.random() * 3 + 1, 20 + Math.random() * 15);
  }
}

export function spawnMuzzleFlash(ps, x, y) {
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.8;
    const speed = Math.random() * 5 + 2;
    spawnParticle(ps, x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, '#F0E6A0', Math.random() * 4 + 2, 12);
  }
  spawnParticle(ps, x, y, 0, 0, '#FFFFFF', 10, 5);
}

export function spawnTrapExplosion(ps, x, y) {
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    spawnParticle(ps, x, y - 20, Math.cos(angle) * speed, Math.sin(angle) * speed - 2, '#C89B3C', Math.random() * 5 + 2, 30);
  }
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    spawnParticle(ps, x, y - 20, Math.cos(angle) * 3, Math.sin(angle) * 3 - 1, '#FF8800', Math.random() * 3 + 1, 20);
  }
}

export function spawnBeamParticles(ps, x1, y1, x2, y2) {
  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const px = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20;
    const py = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
    spawnParticle(ps, px, py, (Math.random() - 0.5) * 1, -Math.random() * 1, '#C89B3C', Math.random() * 4 + 2, 25);
  }
}

export function updateParticles(ps) {
  // Standard particles
  for (let i = ps.particles.length - 1; i >= 0; i--) {
    const p = ps.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08; // gravity
    p.life--;
    p.alpha = p.life / p.maxLife;
    if (p.life <= 0) ps.particles.splice(i, 1);
  }

  // Damage numbers
  for (let i = ps.damageNumbers.length - 1; i >= 0; i--) {
    const d = ps.damageNumbers[i];
    d.y += d.vy;
    d.vy *= 0.95;
    d.life--;
    d.alpha = Math.min(1, d.life / 20);
    if (d.life <= 0) ps.damageNumbers.splice(i, 1);
  }

  // Click ripples
  for (let i = ps.clickRipples.length - 1; i >= 0; i--) {
    const r = ps.clickRipples[i];
    r.r += 2;
    r.alpha -= 0.045;
    if (r.alpha <= 0) ps.clickRipples.splice(i, 1);
  }

  // Rift particles
  for (let i = 0; i < ps.riftParticles.length; i++) {
    const p = ps.riftParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life++;
    if (p.life >= p.maxLife || p.y < GROUND_Y - 200) {
      ps.riftParticles[i] = createRiftParticle();
    }
  }
}

export function drawParticles(ctx, ps) {
  // Rift ambient particles
  for (const p of ps.riftParticles) {
    const t = p.life / p.maxLife;
    const alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
    ctx.globalAlpha = p.alpha * alpha * 0.6;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Standard particles
  for (const p of ps.particles) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Click ripples
  for (const r of ps.clickRipples) {
    ctx.globalAlpha = r.alpha;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Damage numbers
  for (const d of ps.damageNumbers) {
    ctx.globalAlpha = d.alpha;
    if (d.isCrit) {
      ctx.font = 'bold 22px "Share Tech Mono"';
      ctx.fillStyle = '#C89B3C';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(`★${d.text}`, d.x, d.y);
      ctx.fillText(`★${d.text}`, d.x, d.y);
    } else {
      ctx.font = '16px "Share Tech Mono"';
      ctx.fillStyle = d.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText(d.text, d.x, d.y);
      ctx.fillText(d.text, d.x, d.y);
    }
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}
