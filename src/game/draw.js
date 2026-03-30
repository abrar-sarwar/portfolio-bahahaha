import { LOGICAL_W, LOGICAL_H, MAP_W, MAP_H } from './constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// MAP DRAWING (open hex arena)
// ─────────────────────────────────────────────────────────────────────────────
export function drawMap(ctx, frame, camera) {
  // Void background
  ctx.fillStyle = '#02050A';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Base ground fill
  drawArenaGround(ctx, frame);
  drawArenaHexGrid(ctx, frame);
  drawArenaBorderFog(ctx, frame);
  drawArenaObstacles(ctx, frame);
  drawArenaRuneCircles(ctx, frame);
  drawArenaAmbientParticles(ctx, frame);

  ctx.restore();
}

function drawArenaGround(ctx, frame) {
  // Large radial gradient from center — arena feels like a spotlight
  const cx = MAP_W / 2, cy = MAP_H / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, MAP_W * 0.65);
  grad.addColorStop(0,   '#080F1C');
  grad.addColorStop(0.4, '#060C18');
  grad.addColorStop(0.7, '#040A14');
  grad.addColorStop(1,   '#020508');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, MAP_W, MAP_H);
}

function drawArenaHexGrid(ctx, frame) {
  // Hexagonal tile pattern (top-down hex floor)
  const hexSize = 60;
  const hexW = hexSize * 2;
  const hexH = Math.sqrt(3) * hexSize;
  const cx = MAP_W / 2, cy = MAP_H / 2;

  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#1A3055';
  ctx.lineWidth = 1;

  for (let row = -20; row < 20; row++) {
    for (let col = -20; col < 20; col++) {
      const x = cx + col * hexW * 0.75;
      const y = cy + row * hexH + (col % 2 === 0 ? 0 : hexH * 0.5);

      // Only draw hexes inside the arena
      const distFromCenter = Math.hypot(x - cx, y - cy);
      if (distFromCenter > MAP_W * 0.55) continue;

      // Draw hex
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const hx = x + Math.cos(a) * hexSize * 0.95;
        const hy = y + Math.sin(a) * hexSize * 0.95;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function drawArenaBorderFog(ctx, frame) {
  // Black fog vignette at edges — arena boundary effect
  const cx = MAP_W / 2, cy = MAP_H / 2;
  const arenaR = MAP_W * 0.52;

  // Inner glow ring
  const pulse = 0.5 + Math.sin(frame * 0.015) * 0.3;
  ctx.globalAlpha = 0.15 * pulse;
  ctx.strokeStyle = '#0BC4C4';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, arenaR, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 12;
  ctx.beginPath(); ctx.arc(cx, cy, arenaR + 20, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;

  // Dark fog outside arena (radial gradient overlay)
  const fog = ctx.createRadialGradient(cx, cy, arenaR * 0.8, cx, cy, arenaR * 1.1);
  fog.addColorStop(0, 'rgba(0,0,0,0)');
  fog.addColorStop(1, 'rgba(0,0,0,0.97)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, MAP_W, MAP_H);
}

function drawArenaObstacles(ctx, frame) {
  // Scattered pillars, crystals, and energy terminals
  const obstacles = [
    // Pillars (stone)
    { type: 'pillar', x: MAP_W*0.35, y: MAP_H*0.35, r: 28 },
    { type: 'pillar', x: MAP_W*0.65, y: MAP_H*0.35, r: 28 },
    { type: 'pillar', x: MAP_W*0.35, y: MAP_H*0.65, r: 28 },
    { type: 'pillar', x: MAP_W*0.65, y: MAP_H*0.65, r: 28 },
    { type: 'pillar', x: MAP_W*0.50, y: MAP_H*0.28, r: 22 },
    { type: 'pillar', x: MAP_W*0.50, y: MAP_H*0.72, r: 22 },
    { type: 'pillar', x: MAP_W*0.28, y: MAP_H*0.50, r: 22 },
    { type: 'pillar', x: MAP_W*0.72, y: MAP_H*0.50, r: 22 },
    // Energy crystals
    { type: 'crystal', x: MAP_W*0.42, y: MAP_H*0.42, r: 16 },
    { type: 'crystal', x: MAP_W*0.58, y: MAP_H*0.42, r: 16 },
    { type: 'crystal', x: MAP_W*0.42, y: MAP_H*0.58, r: 16 },
    { type: 'crystal', x: MAP_W*0.58, y: MAP_H*0.58, r: 16 },
    // Terminals
    { type: 'terminal', x: MAP_W*0.3, y: MAP_H*0.3, r: 20 },
    { type: 'terminal', x: MAP_W*0.7, y: MAP_H*0.7, r: 20 },
  ];

  for (const obs of obstacles) {
    if (obs.type === 'pillar') {
      // Stone pillar shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(obs.x+5, obs.y+5, obs.r, obs.r*0.7, 0, 0, Math.PI*2); ctx.fill();
      // Stone body
      ctx.fillStyle = '#1A1C20';
      ctx.beginPath(); ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI*2); ctx.fill();
      // Stone texture
      ctx.strokeStyle = '#252830'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(obs.x, obs.y, obs.r-4, 0, Math.PI*2); ctx.stroke();
      // Gold rune on pillar top
      ctx.globalAlpha = 0.4 + Math.sin(frame*0.04)*0.2;
      ctx.fillStyle = '#C89B3C';
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u16EB', obs.x, obs.y+4);
      ctx.globalAlpha = 1;
    } else if (obs.type === 'crystal') {
      const crystalPulse = 0.5 + Math.sin(frame*0.06 + obs.x*0.01)*0.5;
      // Glow aura
      const cg = ctx.createRadialGradient(obs.x, obs.y, 0, obs.x, obs.y, obs.r*2.5);
      cg.addColorStop(0, `rgba(0,180,200,${0.12*crystalPulse})`);
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(obs.x, obs.y, obs.r*2.5, 0, Math.PI*2); ctx.fill();
      // Crystal body (diamond shape top-down)
      ctx.fillStyle = `rgba(0,${Math.floor(150+crystalPulse*80)},200,0.8)`;
      ctx.save(); ctx.translate(obs.x, obs.y); ctx.rotate(frame*0.01);
      ctx.beginPath();
      ctx.moveTo(0, -obs.r); ctx.lineTo(obs.r*0.7, 0);
      ctx.lineTo(0, obs.r); ctx.lineTo(-obs.r*0.7, 0);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#88EEFF'; ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    } else if (obs.type === 'terminal') {
      // Cyber terminal
      const tp = 0.5 + Math.sin(frame*0.08)*0.4;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(obs.x-obs.r, obs.y-obs.r, obs.r*2, obs.r*2);
      ctx.fillStyle = '#0A1020';
      ctx.fillRect(obs.x-obs.r+2, obs.y-obs.r+2, obs.r*2-4, obs.r*2-4);
      ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 1.5;
      ctx.strokeRect(obs.x-obs.r, obs.y-obs.r, obs.r*2, obs.r*2);
      // Screen
      ctx.fillStyle = `rgba(0,${Math.floor(200*tp)},100,${0.8*tp})`;
      ctx.fillRect(obs.x-obs.r+4, obs.y-obs.r+4, obs.r*2-8, obs.r*2-8);
      ctx.fillStyle = '#00FF88'; ctx.font = '8px "Share Tech Mono"'; ctx.textAlign = 'center';
      ctx.globalAlpha = tp;
      ctx.fillText('ACCESS', obs.x, obs.y+3);
      ctx.globalAlpha = 1;
    }
  }
  ctx.textAlign = 'left';
  ctx.lineWidth = 1;
}

function drawArenaRuneCircles(ctx, frame) {
  const cx = MAP_W/2, cy = MAP_H/2;

  // Center grand rune
  const grandPulse = 0.4 + Math.sin(frame*0.015)*0.4;

  // Rotating outer ring segments
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(frame*0.003);
  ctx.globalAlpha = 0.1 * grandPulse;
  ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI*2*i/8);
    ctx.beginPath();
    ctx.arc(0, 0, 200, a, a + Math.PI*2/16);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-frame*0.005);
  ctx.globalAlpha = 0.08 * grandPulse;
  ctx.strokeStyle = '#0BC4C4'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 140, 0, Math.PI*2); ctx.stroke();
  // Inner hex rune
  for (let i = 0; i < 6; i++) {
    const a = Math.PI*2*i/6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*80, Math.sin(a)*80);
    ctx.lineTo(Math.cos(a+Math.PI*2/6)*80, Math.sin(a+Math.PI*2/6)*80);
    ctx.stroke();
  }
  ctx.restore();

  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

function drawArenaAmbientParticles(ctx, frame) {
  // Static ambient particles - handled in particles.js
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAPS
// ─────────────────────────────────────────────────────────────────────────────
export function drawTraps(ctx, player, frame, camera) {
  for (const trap of player.traps) {
    const sx = trap.x - camera.x;
    const sy = trap.y - camera.y;
    const pulse = 0.6 + Math.sin(frame * 0.08) * 0.4;

    ctx.globalAlpha = 0.7 * pulse;
    ctx.strokeStyle = '#C89B3C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy - trap.r);
    ctx.lineTo(sx + trap.r, sy);
    ctx.lineTo(sx, sy + trap.r);
    ctx.lineTo(sx - trap.r, sy);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = 'rgba(200,155,60,0.15)';
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER PROJECTILES
// ─────────────────────────────────────────────────────────────────────────────
export function drawPlayerProjectiles(ctx, player, frame, camera) {
  for (const p of player.projectiles) {
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;

    if (p.isR) {
      // Ultimate shot — large glowing orb with trail
      const angle = Math.atan2(p.vy, p.vx);
      // Trail
      for (let t = 1; t <= 4; t++) {
        const tx = sx - Math.cos(angle) * t * 7;
        const ty = sy - Math.sin(angle) * t * 7;
        ctx.globalAlpha = 0.15 * (5 - t) / 4;
        ctx.fillStyle = '#FF8888';
        ctx.beginPath(); ctx.arc(tx, ty, 10 - t, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#CC2222';
      ctx.shadowColor = '#FF4444';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#F0E6A0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.isCrit) {
      // Crit bullet — elongated gold bullet with bright trail
      const angle = Math.atan2(p.vy, p.vx);
      // Gold trail glow
      for (let t = 1; t <= 5; t++) {
        const tx = sx - Math.cos(angle) * t * 5;
        const ty = sy - Math.sin(angle) * t * 5;
        ctx.globalAlpha = 0.25 * (6 - t) / 5;
        ctx.fillStyle = '#F0E6A0';
        ctx.beginPath(); ctx.arc(tx, ty, 5 - t * 0.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Elongated bullet body
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.fillStyle = '#F0E6A0';
      ctx.shadowColor = '#C89B3C';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    } else {
      // Normal bullet — elongated gold bullet with trail
      const angle = Math.atan2(p.vy, p.vx);
      // Trail
      for (let t = 1; t <= 3; t++) {
        const tx = sx - Math.cos(angle) * t * 4;
        const ty = sy - Math.sin(angle) * t * 4;
        ctx.globalAlpha = 0.2 * (4 - t) / 3;
        ctx.fillStyle = '#C89B3C';
        ctx.beginPath(); ctx.arc(tx, ty, 3 - t * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.fillStyle = '#C89B3C';
      ctx.shadowColor = '#F0E6A0';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
  ctx.lineWidth = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// W BEAM
// ─────────────────────────────────────────────────────────────────────────────
export function drawWBeam(ctx, player, camera) {
  if (!player.wBeamActive || !player.beamTarget) return;

  const sx = player.x - camera.x;
  const sy = player.y - camera.y;
  const tx = player.beamTarget.x - camera.x;
  const ty = player.beamTarget.y - camera.y;

  const alpha = player.wBeamTimer / 15;
  ctx.globalAlpha = alpha;

  // Outer glow beam (wide, soft)
  ctx.strokeStyle = 'rgba(200,155,60,0.3)';
  ctx.lineWidth = 18;
  ctx.shadowColor = '#C89B3C';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  // Core beam (bright gold)
  ctx.strokeStyle = '#F0E6A0';
  ctx.lineWidth = 5;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  // Sparks along beam
  const len = Math.hypot(tx - sx, ty - sy);
  const numSparks = Math.floor(len / 30);
  const angle = Math.atan2(ty - sy, tx - sx);
  ctx.shadowBlur = 6;
  for (let i = 0; i < numSparks; i++) {
    const t = (i + 0.5) / numSparks;
    const bx = sx + (tx - sx) * t;
    const by = sy + (ty - sy) * t;
    const sparkLen = 8 + Math.random() * 12;
    const sparkAngle = angle + Math.PI/2 + (Math.random() - 0.5) * Math.PI;
    ctx.strokeStyle = '#FFE080';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(sparkAngle) * sparkLen, by + Math.sin(sparkAngle) * sparkLen);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENEMY PROJECTILES
// ─────────────────────────────────────────────────────────────────────────────
export function drawEnemyProjectiles(ctx, enemy, camera) {
  for (const p of enemy.projectiles) {
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;

    if (sx < -20 || sx > LOGICAL_W + 20 || sy < -20 || sy > LOGICAL_H + 20) continue;

    const col = p.color || '#FF4400';
    const r = p.r || 8;

    if (enemy.index === 0) {
      // Script Kiddie: green spinning hex bolt
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.life * 0.1);
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.shadowColor = col; ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i / 6);
        if (i === 0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
        else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      ctx.closePath(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    } else if (enemy.index === 1) {
      // Phantom: purple glitch orb with chromatic aberration
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 12;
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#FF00FF';
      ctx.beginPath(); ctx.arc(sx+2, sy, r*0.8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath(); ctx.arc(sx-2, sy, r*0.8, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    } else if (enemy.index === 2) {
      // Risk Golem: gold rocky boulder
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#886600'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, r-2, Math.PI*0.3, Math.PI*0.9); ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (enemy.index === 3) {
      // Firewall Hydra: orange fire orb with trail
      const angle = Math.atan2(p.vy, p.vx);
      for (let t = 1; t <= 3; t++) {
        const tx2 = sx - Math.cos(angle) * t * 5;
        const ty2 = sy - Math.sin(angle) * t * 5;
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#FF6600';
        ctx.beginPath(); ctx.arc(tx2, ty2, r - t, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = col;
      ctx.shadowColor = '#FF6600'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    } else if (enemy.index === 4) {
      // Final Audit: purple arcane diamond
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.life * 0.05);
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0, -r); ctx.lineTo(r*0.7, 0);
      ctx.lineTo(0, r); ctx.lineTo(-r*0.7, 0);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#FF88FF'; ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    } else {
      // Default
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP-DOWN VIRTUOSO
// ─────────────────────────────────────────────────────────────────────────────
export function drawVirtuoso(ctx, player, frame, camera) {
  const sx = player.x - camera.x;
  const sy = player.y - camera.y;
  const facing = player.facing;
  const moving = Math.abs(player.vx) > 0.3 || Math.abs(player.vy) > 0.3;
  const walk = Math.sin(player.walkFrame) * 4;
  const isLowHp = player.health < player.maxHealth * 0.3;

  ctx.save();
  ctx.translate(sx, sy);

  // ── MOVE TARGET INDICATOR ──
  if (player.moveTarget) {
    const mtsx = player.moveTarget.x - camera.x;
    const mtsy = player.moveTarget.y - camera.y;
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#C89B3C';
    ctx.lineWidth = 2;
    // Expanding ring animation
    const ringSize = 12 + Math.sin(frame * 0.3) * 4;
    ctx.beginPath(); ctx.arc(mtsx, mtsy, ringSize, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.arc(mtsx, mtsy, ringSize * 0.5, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(sx, sy);
  }

  // ── GROUND SHADOW ──
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(2, 8, 22, 12, 0, 0, Math.PI * 2); ctx.fill();

  // ── LOW HP DANGER AURA ──
  if (isLowHp) {
    const pulse = 0.4 + Math.sin(frame * 0.12) * 0.3;
    ctx.globalAlpha = pulse;
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, 35);
    aura.addColorStop(0, 'rgba(200,50,0,0.6)');
    aura.addColorStop(1, 'rgba(200,50,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(0, 0, 35, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ── SPEED BUFF AURA ──
  if (player.speedBuffTimer > 0) {
    const pulse = 0.3 + Math.sin(frame * 0.2) * 0.2;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#C89B3C';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── CAPE (trails behind — angular, geometric) ──
  const capeDir = facing + Math.PI;
  const capeSpread = 0.8;
  const capeLen = 34 + Math.abs(walk) * 0.4;

  // Outer cape (dark charcoal with angular cut)
  ctx.fillStyle = '#0E0C10';
  ctx.beginPath();
  ctx.moveTo(Math.cos(capeDir - capeSpread) * 14, Math.sin(capeDir - capeSpread) * 14);
  ctx.lineTo(Math.cos(capeDir - capeSpread * 1.2) * capeLen, Math.sin(capeDir - capeSpread * 1.2) * capeLen);
  ctx.lineTo(Math.cos(capeDir) * (capeLen + 6), Math.sin(capeDir) * (capeLen + 6));
  ctx.lineTo(Math.cos(capeDir + capeSpread * 1.2) * capeLen, Math.sin(capeDir + capeSpread * 1.2) * capeLen);
  ctx.lineTo(Math.cos(capeDir + capeSpread) * 14, Math.sin(capeDir + capeSpread) * 14);
  ctx.closePath(); ctx.fill();

  // Cape inner lining (dark purple tint)
  ctx.fillStyle = 'rgba(60,20,80,0.5)';
  ctx.beginPath();
  ctx.moveTo(Math.cos(capeDir - capeSpread * 0.6) * 15, Math.sin(capeDir - capeSpread * 0.6) * 15);
  ctx.lineTo(Math.cos(capeDir - capeSpread * 0.8) * (capeLen * 0.7), Math.sin(capeDir - capeSpread * 0.8) * (capeLen * 0.7));
  ctx.lineTo(Math.cos(capeDir) * (capeLen * 0.8), Math.sin(capeDir) * (capeLen * 0.8));
  ctx.lineTo(Math.cos(capeDir + capeSpread * 0.8) * (capeLen * 0.7), Math.sin(capeDir + capeSpread * 0.8) * (capeLen * 0.7));
  ctx.lineTo(Math.cos(capeDir + capeSpread * 0.6) * 15, Math.sin(capeDir + capeSpread * 0.6) * 15);
  ctx.closePath(); ctx.fill();

  // Cape gold trim edge
  ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(Math.cos(capeDir - capeSpread * 1.2) * capeLen, Math.sin(capeDir - capeSpread * 1.2) * capeLen);
  ctx.lineTo(Math.cos(capeDir) * (capeLen + 6), Math.sin(capeDir) * (capeLen + 6));
  ctx.lineTo(Math.cos(capeDir + capeSpread * 1.2) * capeLen, Math.sin(capeDir + capeSpread * 1.2) * capeLen);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ── ARMOR BODY (hexagonal top-down view) ──
  // Outer dark armor ring
  ctx.fillStyle = '#14100C';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i / 6) + facing + Math.PI/6;
    const r = 21;
    if (i === 0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
    else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
  }
  ctx.closePath(); ctx.fill();

  // Inner armor (rich dark gold gradient)
  const armorGrad = ctx.createRadialGradient(-3, -3, 0, 0, 0, 20);
  armorGrad.addColorStop(0, '#2A1E0A');
  armorGrad.addColorStop(0.5, '#1E1408');
  armorGrad.addColorStop(1, '#12100A');
  ctx.fillStyle = armorGrad;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i / 6) + facing + Math.PI/6;
    const r = 18;
    if (i === 0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
    else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
  }
  ctx.closePath(); ctx.fill();

  // Armor gold edge lines (hexagon outline)
  ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.8;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i / 6) + facing + Math.PI/6;
    const r = 21;
    if (i === 0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
    else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
  }
  ctx.closePath(); ctx.stroke();
  ctx.globalAlpha = 1;

  // Armor center gem
  const gemPulse = 0.6 + Math.sin(frame * 0.08) * 0.3;
  const gemGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 7);
  gemGrad.addColorStop(0, `rgba(200,155,60,${gemPulse})`);
  gemGrad.addColorStop(1, 'rgba(100,60,10,0)');
  ctx.fillStyle = gemGrad;
  ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();

  // ── HEAD (top of hex body, in facing direction) ──
  const headDist = 12;
  const headX = Math.cos(facing) * headDist;
  const headY = Math.sin(facing) * headDist;

  // Mask base (porcelain white)
  ctx.fillStyle = '#E8E4DC';
  ctx.beginPath(); ctx.arc(headX, headY, 11, 0, Math.PI * 2); ctx.fill();

  // Mask shadow half
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(headX + Math.cos(facing+Math.PI)*3, headY + Math.sin(facing+Math.PI)*3, 9, 0, Math.PI*2);
  ctx.fill();

  // Hollow eyes (dark slits)
  const eyeOffset = 1.1;
  ctx.fillStyle = '#0A0608';
  ctx.beginPath();
  ctx.arc(headX + Math.cos(facing + eyeOffset)*5, headY + Math.sin(facing + eyeOffset)*5, 2.8, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headX + Math.cos(facing - eyeOffset)*5, headY + Math.sin(facing - eyeOffset)*5, 2.8, 0, Math.PI*2);
  ctx.fill();

  // Teardrop mark (gold, left eye area)
  ctx.fillStyle = '#C89B3C';
  const tdx = headX + Math.cos(facing + eyeOffset)*5;
  const tdy = headY + Math.sin(facing + eyeOffset)*5 + 4;
  ctx.beginPath();
  ctx.moveTo(tdx, tdy); ctx.lineTo(tdx - 1.5, tdy + 4); ctx.lineTo(tdx + 1.5, tdy + 4);
  ctx.closePath(); ctx.fill();

  // Top hat (viewed from above — two concentric dark circles with gold band)
  ctx.fillStyle = '#080608';
  ctx.beginPath(); ctx.arc(headX, headY, 10, 0, Math.PI*2); ctx.fill();
  // Brim (slightly larger circle)
  ctx.strokeStyle = '#1A1410'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(headX, headY, 12, 0, Math.PI*2); ctx.stroke();
  // Gold hat band
  ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(headX, headY, 8, 0, Math.PI*2); ctx.stroke();

  // ── WHISPER RIFLE ──
  const rifleStart = 10;
  const rifleEnd = 46;
  const sx2 = Math.cos(facing), sy2 = Math.sin(facing);

  // Rifle body (dark metal)
  ctx.strokeStyle = '#888'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx2 * rifleStart, sy2 * rifleStart);
  ctx.lineTo(sx2 * rifleEnd, sy2 * rifleEnd);
  ctx.stroke();

  // Gold filigree details
  ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx2 * 16, sy2 * 16);
  ctx.lineTo(sx2 * 26, sy2 * 26);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx2 * 30, sy2 * 30);
  ctx.lineTo(sx2 * 40, sy2 * 40);
  ctx.stroke();

  // Muzzle device (4-point star at barrel end)
  const mx = sx2 * rifleEnd, my = sy2 * rifleEnd;
  ctx.fillStyle = '#F0E6A0';
  ctx.beginPath(); ctx.arc(mx, my, 3.5, 0, Math.PI*2); ctx.fill();

  // Muzzle flash when recently shot
  if (player.lastShotFlash > 0) {
    const fl = player.lastShotFlash;
    ctx.globalAlpha = fl / 6;
    // Cross-shaped flash
    ctx.strokeStyle = '#FFF8C0'; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const fa = facing + i * Math.PI/2;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(fa) * fl * 3, my + Math.sin(fa) * fl * 3);
      ctx.stroke();
    }
    ctx.fillStyle = '#FFF8C0';
    ctx.beginPath(); ctx.arc(mx, my, fl * 2, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    player.lastShotFlash--;
  }

  // ── HIT FLASH ──
  if (player.hitFlash > 0) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#FF4444';
    ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.lineCap = 'butt';
  ctx.restore();
}

// Backward-compat alias
export const drawJhin = drawVirtuoso;

// ─────────────────────────────────────────────────────────────────────────────
// TOP-DOWN ENEMY DRAWING
// ─────────────────────────────────────────────────────────────────────────────
export function drawEnemy(ctx, enemy, frame, camera) {
  if (!enemy) return;

  const sx = enemy.x - camera.x;
  const sy = enemy.y - camera.y;

  // Cull off-screen enemies
  if (sx < -100 || sx > LOGICAL_W + 100 || sy < -100 || sy > LOGICAL_H + 100) return;

  // Draw phantom clones
  if (enemy.index === 1 && enemy.clones && enemy.clones.length) {
    for (const clone of enemy.clones) {
      const csx = clone.x - camera.x;
      const csy = clone.y - camera.y;
      if (csx > -100 && csx < LOGICAL_W + 100 && csy > -100 && csy < LOGICAL_H + 100) {
        ctx.globalAlpha = 0.3;
        ctx.save();
        ctx.translate(csx, csy);
        drawPhantomThreatTopDown(ctx, enemy, frame);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
  }

  // Spawn animation
  if (enemy.spawnTimer > 0) {
    const spawnProgress = 1 - enemy.spawnTimer / 90;
    const spawnRing = (1 - spawnProgress) * 80;
    ctx.save(); ctx.translate(sx, sy);
    ctx.globalAlpha = (1-spawnProgress) * 0.5;
    ctx.strokeStyle = '#0BC4C4'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, spawnRing, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = spawnProgress;
  }

  ctx.save();
  ctx.translate(sx, sy);

  switch (enemy.index) {
    case 0: drawScriptKiddieTopDown(ctx, enemy, frame); break;
    case 1: drawPhantomThreatTopDown(ctx, enemy, frame); break;
    case 2: drawRiskGolemTopDown(ctx, enemy, frame); break;
    case 3: drawFirewallHydraTopDown(ctx, enemy, frame); break;
    case 4: drawFinalAuditTopDown(ctx, enemy, frame); break;
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  // HP bar above enemy (only when fully spawned)
  if (!enemy.spawnTimer || enemy.spawnTimer <= 0) {
    drawEnemyHPBarTopDown(ctx, enemy, sx, sy);
  }

  // Stun stars
  if (enemy.stunned) {
    ctx.fillStyle = '#FFE066';
    ctx.font = '14px "Share Tech Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('* * *', sx, sy - 55);
    ctx.textAlign = 'left';
  }
}

function drawEnemyHPBarTopDown(ctx, enemy, sx, sy) {
  const bw = 60, bh = 7;
  const bx = sx - bw / 2, by = sy - 55;
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  ctx.fillStyle = '#1A0000'; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = ratio > 0.5 ? '#CC2222' : ratio > 0.25 ? '#CC6600' : '#880000';
  ctx.fillRect(bx, by, bw * ratio, bh);
  ctx.strokeStyle = '#5A1A1A'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
  ctx.lineWidth = 1;
}

function drawScriptKiddieTopDown(ctx, enemy, frame) {
  const bob = Math.sin(enemy.walkFrame) * 3;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(3, 5 + bob, 28, 18, 0, 0, Math.PI * 2); ctx.fill();

  // Hoodie body
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath(); ctx.arc(0, bob, 26, 0, Math.PI * 2); ctx.fill();

  // Hood top
  const hx = Math.cos(enemy.facing) * 8;
  const hy = Math.sin(enemy.facing) * 8;
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(hx, hy + bob, 20, 0, Math.PI * 2); ctx.fill();

  // Red eyes
  const ex1x = Math.cos(enemy.facing + 1.0) * 9 + hx;
  const ex1y = Math.sin(enemy.facing + 1.0) * 9 + hy;
  const ex2x = Math.cos(enemy.facing - 1.0) * 9 + hx;
  const ex2y = Math.sin(enemy.facing - 1.0) * 9 + hy;
  ctx.fillStyle = '#FF2222';
  ctx.shadowColor = '#FF2222'; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.arc(ex1x, ex1y + bob, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex2x, ex2y + bob, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Laptop
  const lpx = Math.cos(enemy.facing) * 22;
  const lpy = Math.sin(enemy.facing) * 22;
  ctx.fillStyle = '#222'; ctx.fillRect(lpx - 10, lpy + bob - 7, 20, 14);
  const lpulse = 0.6 + Math.sin(frame * 0.06) * 0.3;
  ctx.fillStyle = `rgba(0,${Math.floor(180 * lpulse)},0,0.9)`;
  ctx.fillRect(lpx - 8, lpy + bob - 5, 16, 10);
}

function drawPhantomThreatTopDown(ctx, enemy, frame) {
  const glitch = Math.random() > 0.95 ? (Math.random() - 0.5) * 6 : 0;

  // Smoke wisps
  for (let i = 0; i < 5; i++) {
    const a = frame * 0.04 + i * 1.26;
    const wx = Math.cos(a) * 18 + glitch;
    const wy = Math.sin(a) * 12;
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#6600AA';
    ctx.beginPath(); ctx.arc(wx, wy, 12 + Math.sin(a * 2) * 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Core body
  const bodyGrad = ctx.createRadialGradient(glitch, 0, 0, glitch, 0, 30);
  bodyGrad.addColorStop(0, 'rgba(80,0,140,0.9)');
  bodyGrad.addColorStop(1, 'rgba(20,0,50,0.3)');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.arc(glitch, 0, 28, 0, Math.PI * 2); ctx.fill();

  // Chromatic offset
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#FF00FF';
  ctx.beginPath(); ctx.arc(glitch + 4, 0, 24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#00FFFF';
  ctx.beginPath(); ctx.arc(glitch - 4, 0, 24, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Cyan eyes
  const ex = Math.cos(enemy.facing) * 12 + glitch;
  const ey = Math.sin(enemy.facing) * 12;
  ctx.fillStyle = '#00FFFF';
  ctx.shadowColor = '#00FFFF'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(ex - Math.cos(enemy.facing + 1.2) * 5, ey - Math.sin(enemy.facing + 1.2) * 5, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex - Math.cos(enemy.facing - 1.2) * 5, ey - Math.sin(enemy.facing - 1.2) * 5, 5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawRiskGolemTopDown(ctx, enemy, frame) {
  const stomp = Math.abs(Math.sin(enemy.walkFrame)) * 3;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.ellipse(5, 5 + stomp, 38, 28, 0, 0, Math.PI * 2); ctx.fill();

  // Stone body
  ctx.fillStyle = '#5A5A55';
  ctx.beginPath(); ctx.arc(0, stomp, 35, 0, Math.PI * 2); ctx.fill();

  // Stone texture
  ctx.strokeStyle = '#444440'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-35, stomp); ctx.lineTo(35, stomp); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, stomp - 35); ctx.lineTo(0, stomp + 35); ctx.stroke();

  // Head nub
  const hx = Math.cos(enemy.facing) * 18;
  const hy = Math.sin(enemy.facing) * 18;
  ctx.fillStyle = '#666660';
  ctx.beginPath(); ctx.arc(hx, hy + stomp, 14, 0, Math.PI * 2); ctx.fill();

  // Red eyes
  ctx.fillStyle = '#FF3300'; ctx.shadowColor = '#FF3300'; ctx.shadowBlur = 5;
  ctx.beginPath(); ctx.arc(hx + Math.cos(enemy.facing + 1.1) * 6, hy + Math.sin(enemy.facing + 1.1) * 6 + stomp, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + Math.cos(enemy.facing - 1.1) * 6, hy + Math.sin(enemy.facing - 1.1) * 6 + stomp, 3, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Paper wings
  ctx.fillStyle = 'rgba(220,220,200,0.5)';
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + frame * 0.01;
    const wx = Math.cos(a) * 30;
    const wy = Math.sin(a) * 30 + stomp;
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(a);
    ctx.fillRect(-12, -7, 24, 14);
    ctx.strokeStyle = 'rgba(100,180,100,0.4)'; ctx.lineWidth = 0.7;
    for (let row = -4; row <= 4; row += 4) {
      ctx.beginPath(); ctx.moveTo(-12, row); ctx.lineTo(12, row); ctx.stroke();
    }
    ctx.restore();
  }

  // Red tie
  ctx.fillStyle = '#CC0000';
  ctx.beginPath();
  ctx.moveTo(-3, 0 + stomp); ctx.lineTo(3, 0 + stomp);
  ctx.lineTo(1, 15 + stomp); ctx.lineTo(-1, 15 + stomp);
  ctx.closePath(); ctx.fill();
  ctx.lineWidth = 1;
}

function drawFirewallHydraTopDown(ctx, enemy, frame) {
  // Shadow
  const shadow = ctx.createRadialGradient(5, 8, 0, 5, 8, 40);
  shadow.addColorStop(0, 'rgba(0,0,0,0.5)'); shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();

  // Circuit board body
  ctx.fillStyle = '#0A1A08';
  ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();

  // Circuit lines
  ctx.strokeStyle = '#00CC44'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
    ctx.lineTo(Math.cos(a) * 26, Math.sin(a) * 26);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(Math.cos(a) * 20, Math.sin(a) * 20, 4, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Three heads
  const headAngles = [enemy.facing, enemy.facing + 2.1, enemy.facing - 2.1];
  const headColors = ['#FF4400', '#FF8800', '#4488FF'];
  for (let i = 0; i < 3; i++) {
    const ha = headAngles[i];
    const neckLen = 28 + Math.sin(frame * 0.06 + i * 2) * 5;
    const nx = Math.cos(ha) * neckLen;
    const ny = Math.sin(ha) * neckLen;

    ctx.strokeStyle = headColors[i]; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ha) * 12, Math.sin(ha) * 12);
    ctx.lineTo(nx, ny); ctx.stroke();

    ctx.fillStyle = headColors[i];
    ctx.beginPath(); ctx.arc(nx, ny, 10, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = headColors[i]; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(nx + Math.cos(ha) * 5, ny + Math.sin(ha) * 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.lineWidth = 1;
}

function drawFinalAuditTopDown(ctx, enemy, frame) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(4, 6, 32, 22, 0, 0, Math.PI * 2); ctx.fill();

  // Dark suit
  ctx.fillStyle = '#1A1A22';
  ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();

  // White shirt front
  ctx.fillStyle = '#E0E0E8';
  ctx.beginPath();
  ctx.arc(Math.cos(enemy.facing) * 12, Math.sin(enemy.facing) * 12, 12,
    enemy.facing - 0.7, enemy.facing + 0.7);
  ctx.lineTo(Math.cos(enemy.facing) * 4, Math.sin(enemy.facing) * 4);
  ctx.closePath(); ctx.fill();

  // Red tie
  ctx.fillStyle = '#CC0000';
  ctx.beginPath();
  ctx.moveTo(Math.cos(enemy.facing) * 14, Math.sin(enemy.facing) * 14);
  ctx.lineTo(Math.cos(enemy.facing + 0.15) * 10, Math.sin(enemy.facing + 0.15) * 10);
  ctx.lineTo(Math.cos(enemy.facing) * 4, Math.sin(enemy.facing) * 4);
  ctx.lineTo(Math.cos(enemy.facing - 0.15) * 10, Math.sin(enemy.facing - 0.15) * 10);
  ctx.closePath(); ctx.fill();

  // Devil horns
  const hx = Math.cos(enemy.facing) * 16;
  const hy = Math.sin(enemy.facing) * 16;
  ctx.fillStyle = '#CC0000';
  ctx.beginPath();
  ctx.moveTo(hx + Math.cos(enemy.facing + 1.4) * 10, hy + Math.sin(enemy.facing + 1.4) * 10);
  ctx.lineTo(hx + Math.cos(enemy.facing + 1.2) * 18, hy + Math.sin(enemy.facing + 1.2) * 18);
  ctx.lineTo(hx + Math.cos(enemy.facing + 0.9) * 10, hy + Math.sin(enemy.facing + 0.9) * 10);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx + Math.cos(enemy.facing - 1.4) * 10, hy + Math.sin(enemy.facing - 1.4) * 10);
  ctx.lineTo(hx + Math.cos(enemy.facing - 1.2) * 18, hy + Math.sin(enemy.facing - 1.2) * 18);
  ctx.lineTo(hx + Math.cos(enemy.facing - 0.9) * 10, hy + Math.sin(enemy.facing - 0.9) * 10);
  ctx.closePath(); ctx.fill();

  // Red eyes
  ctx.fillStyle = '#FF0000'; ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(hx + Math.cos(enemy.facing + 1.0) * 6, hy + Math.sin(enemy.facing + 1.0) * 6, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + Math.cos(enemy.facing - 1.0) * 6, hy + Math.sin(enemy.facing - 1.0) * 6, 4, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Glasses
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(hx + Math.cos(enemy.facing + 1.0) * 6, hy + Math.sin(enemy.facing + 1.0) * 6, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(hx + Math.cos(enemy.facing - 1.0) * 6, hy + Math.sin(enemy.facing - 1.0) * 6, 5, 0, Math.PI * 2); ctx.stroke();

  // Compliance shield
  if (enemy.shieldActive) {
    const shieldPulse = 0.6 + Math.sin(frame * 0.05) * 0.4;
    ctx.globalAlpha = shieldPulse * 0.5;
    ctx.strokeStyle = '#4488CC'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = shieldPulse * 0.15;
    ctx.fillStyle = '#4488CC';
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAGICIAN (kept for backward compat, drawn in screen space)
// ─────────────────────────────────────────────────────────────────────────────
export function drawMagician(ctx, magician, frame) {
  const x = magician.x;
  const y = 480;

  ctx.save();
  ctx.translate(x, y);

  // Robe
  ctx.fillStyle = '#1A0A2A';
  ctx.beginPath();
  ctx.moveTo(-20, -150);
  ctx.lineTo(-30, 0);
  ctx.lineTo(30, 0);
  ctx.lineTo(20, -150);
  ctx.closePath();
  ctx.fill();

  // Stars on robe
  ctx.fillStyle = '#C89B3C';
  ctx.globalAlpha = 0.7;
  for (let i = 0; i < 5; i++) {
    const sx = -15 + (i % 3) * 15;
    const sy = -120 + Math.floor(i / 3) * 40;
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Head
  ctx.fillStyle = '#D4A875';
  ctx.beginPath();
  ctx.arc(0, -160, 20, 0, Math.PI * 2);
  ctx.fill();

  // Hat
  ctx.fillStyle = '#1A0A2A';
  ctx.beginPath();
  ctx.moveTo(-22, -170);
  ctx.lineTo(-14, -230);
  ctx.lineTo(14, -230);
  ctx.lineTo(22, -170);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#C89B3C';
  ctx.fillRect(-24, -173, 48, 6);

  // Magic staff
  const staffBob = Math.sin(frame * 0.04) * 4;
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(25, -200 + staffBob, 6, 200);
  const glowPulse = 0.5 + Math.sin(frame * 0.06) * 0.5;
  ctx.globalAlpha = glowPulse;
  ctx.shadowColor = '#C89B3C';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#F0E6A0';
  ctx.beginPath();
  ctx.arc(28, -204 + staffBob, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy export names (kept so old imports don't break)
// ─────────────────────────────────────────────────────────────────────────────
export function drawBackground(ctx, frame) {
  drawMap(ctx, frame, { x: 0, y: 0 });
}
