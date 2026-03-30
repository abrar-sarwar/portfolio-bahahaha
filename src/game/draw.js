import { LOGICAL_W, LOGICAL_H, MAP_W, MAP_H } from './constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// MAP DRAWING (top-down)
// ─────────────────────────────────────────────────────────────────────────────
export function drawMap(ctx, frame, camera) {
  // Base fill
  ctx.fillStyle = '#040D1A';
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  drawMapBackground(ctx, frame);
  drawMapPaths(ctx);
  drawMapJungle(ctx, frame);
  drawMapRuneCircles(ctx, frame);

  ctx.restore();
}

function drawMapBackground(ctx, frame) {
  const grad = ctx.createLinearGradient(0, 0, MAP_W, MAP_H);
  grad.addColorStop(0, '#040D1A');
  grad.addColorStop(0.5, '#060F1E');
  grad.addColorStop(1, '#040D1A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, MAP_W, MAP_H);

  // Stone tile grid
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = '#1A3050';
  ctx.lineWidth = 1;
  for (let x = 0; x < MAP_W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MAP_H); ctx.stroke();
  }
  for (let y = 0; y < MAP_H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(MAP_W, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawMapPaths(ctx) {
  // Main lane (diagonal from bottom-left to top-right)
  ctx.fillStyle = 'rgba(20,40,80,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, MAP_H * 0.7);
  ctx.lineTo(MAP_W * 0.3, MAP_H * 0.7);
  ctx.lineTo(MAP_W * 0.7, MAP_H * 0.3);
  ctx.lineTo(MAP_W, MAP_H * 0.3);
  ctx.lineTo(MAP_W, MAP_H * 0.4);
  ctx.lineTo(MAP_W * 0.75, MAP_H * 0.4);
  ctx.lineTo(MAP_W * 0.35, MAP_H * 0.75);
  ctx.lineTo(0, MAP_H * 0.75);
  ctx.closePath();
  ctx.fill();

  // Path border glow
  ctx.strokeStyle = 'rgba(200,155,60,0.12)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, MAP_H * 0.7);
  ctx.lineTo(MAP_W * 0.3, MAP_H * 0.7);
  ctx.lineTo(MAP_W * 0.7, MAP_H * 0.3);
  ctx.lineTo(MAP_W, MAP_H * 0.3);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawMapJungle(ctx, frame) {
  const jungleSpots = [
    [MAP_W * 0.2, MAP_H * 0.2, 200],
    [MAP_W * 0.8, MAP_H * 0.8, 220],
    [MAP_W * 0.15, MAP_H * 0.6, 160],
    [MAP_W * 0.85, MAP_H * 0.4, 160],
    [MAP_W * 0.45, MAP_H * 0.2, 140],
    [MAP_W * 0.55, MAP_H * 0.8, 140],
    [MAP_W * 0.1, MAP_H * 0.9, 180],
    [MAP_W * 0.9, MAP_H * 0.1, 180],
  ];

  for (const [jx, jy, jr] of jungleSpots) {
    // Dark base
    const jGrad = ctx.createRadialGradient(jx, jy, 0, jx, jy, jr);
    jGrad.addColorStop(0, 'rgba(2,10,5,0.8)');
    jGrad.addColorStop(0.7, 'rgba(3,14,8,0.5)');
    jGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = jGrad;
    ctx.beginPath(); ctx.arc(jx, jy, jr, 0, Math.PI * 2); ctx.fill();

    // Tree dots (top-down trees)
    for (let t = 0; t < 8; t++) {
      const a = (t / 8) * Math.PI * 2;
      const r = jr * 0.5 + (t % 3) * 20;
      const tx = jx + Math.cos(a) * r;
      const ty = jy + Math.sin(a) * r;

      // Tree shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(tx + 4, ty + 4, 18, 14, a, 0, Math.PI * 2); ctx.fill();

      // Tree canopy
      ctx.fillStyle = '#050E08';
      ctx.beginPath(); ctx.arc(tx, ty, 16, 0, Math.PI * 2); ctx.fill();

      // Teal edge glow
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#0BC4C4';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(tx, ty, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  ctx.lineWidth = 1;
}

function drawMapRuneCircles(ctx, frame) {
  const runes = [
    [MAP_W * 0.5, MAP_H * 0.5, 120],
    [MAP_W * 0.25, MAP_H * 0.75, 80],
    [MAP_W * 0.75, MAP_H * 0.25, 80],
  ];

  for (const [rx, ry, rr] of runes) {
    const pulse = 0.5 + Math.sin(frame * 0.02 + rx * 0.001) * 0.5;

    // Glow fill
    const rGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
    rGrad.addColorStop(0, `rgba(11,196,196,${(0.06 * pulse).toFixed(3)})`);
    rGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rGrad;
    ctx.beginPath(); ctx.arc(rx, ry, rr, 0, Math.PI * 2); ctx.fill();

    // Outer ring
    ctx.globalAlpha = 0.12 * pulse;
    ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(rx, ry, rr, 0, Math.PI * 2); ctx.stroke();

    // Inner ring
    ctx.strokeStyle = '#0BC4C4'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(rx, ry, rr * 0.6, 0, Math.PI * 2); ctx.stroke();

    // Rotating rune marks
    ctx.fillStyle = '#C89B3C';
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i / 6) + frame * 0.008;
      ctx.beginPath();
      ctx.arc(rx + Math.cos(a) * rr * 0.85, ry + Math.sin(a) * rr * 0.85, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 1;
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
      // Ultimate shot — large glowing orb
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
      // Crit bullet — gold glow
      ctx.fillStyle = '#C89B3C';
      ctx.shadowColor = '#C89B3C';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Normal bullet — small white dot with trail
      ctx.fillStyle = '#F0E6A0';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
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
  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#C89B3C';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
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

    ctx.fillStyle = p.color || '#FF4400';
    ctx.shadowColor = p.color || '#FF4400';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, p.r || 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP-DOWN JHIN
// ─────────────────────────────────────────────────────────────────────────────
export function drawJhin(ctx, player, frame, camera) {
  const sx = player.x - camera.x;
  const sy = player.y - camera.y;
  const facing = player.facing;
  const moving = Math.abs(player.vx) > 0.3 || Math.abs(player.vy) > 0.3;
  const walkBob = moving ? Math.sin(player.walkFrame) * 3 : 0;

  ctx.save();
  ctx.translate(sx, sy);

  // Move target indicator ring
  if (player.moveTarget) {
    const mtsx = player.moveTarget.x - camera.x;
    const mtsy = player.moveTarget.y - camera.y;
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#22FF44';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mtsx, mtsy, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(sx, sy);
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 6, 22, 14, 0, 0, Math.PI * 2); ctx.fill();

  // Hit flash
  if (player.hitFlash > 0 && player.hitFlash % 3 < 2) {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#FF4444';
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Cape (trails behind)
  const capeAngle = facing + Math.PI;
  ctx.fillStyle = '#0D0808';
  ctx.beginPath();
  ctx.moveTo(Math.cos(capeAngle - 0.6) * 14, Math.sin(capeAngle - 0.6) * 14);
  ctx.lineTo(
    Math.cos(capeAngle - 0.9) * 32 + walkBob * Math.cos(capeAngle + Math.PI / 2) * 0.3,
    Math.sin(capeAngle - 0.9) * 32 + walkBob * Math.sin(capeAngle + Math.PI / 2) * 0.3
  );
  ctx.lineTo(Math.cos(capeAngle) * 36, Math.sin(capeAngle) * 36);
  ctx.lineTo(Math.cos(capeAngle + 0.9) * 32, Math.sin(capeAngle + 0.9) * 32);
  ctx.lineTo(Math.cos(capeAngle + 0.6) * 14, Math.sin(capeAngle + 0.6) * 14);
  ctx.closePath(); ctx.fill();

  // Cape gold trim
  ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(Math.cos(capeAngle - 0.9) * 32, Math.sin(capeAngle - 0.9) * 32);
  ctx.lineTo(Math.cos(capeAngle) * 36, Math.sin(capeAngle) * 36);
  ctx.lineTo(Math.cos(capeAngle + 0.9) * 32, Math.sin(capeAngle + 0.9) * 32);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Body
  const bodyGrad = ctx.createRadialGradient(-2, -2, 0, 0, 0, 20);
  bodyGrad.addColorStop(0, '#2A1E0A');
  bodyGrad.addColorStop(1, '#1A1208');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();

  // Gold coat lapels
  ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.arc(0, 0, 18, facing - 0.5, facing + 0.5); ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.arc(0, 0, 14, facing - 0.3, facing + 0.3); ctx.stroke();
  ctx.globalAlpha = 1;

  // Mask/face
  const headX = Math.cos(facing) * 10;
  const headY = Math.sin(facing) * 10;
  ctx.fillStyle = '#E8E0D0';
  ctx.beginPath(); ctx.arc(headX, headY, 10, 0, Math.PI * 2); ctx.fill();

  // Eye markings
  ctx.fillStyle = '#1A0808';
  ctx.beginPath(); ctx.arc(headX + Math.cos(facing + 1.1) * 5, headY + Math.sin(facing + 1.1) * 5, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headX + Math.cos(facing - 1.1) * 5, headY + Math.sin(facing - 1.1) * 5, 2.5, 0, Math.PI * 2); ctx.fill();

  // Gold teardrop
  ctx.fillStyle = '#C89B3C';
  ctx.beginPath(); ctx.arc(headX + Math.cos(facing + 1.3) * 4, headY + Math.sin(facing + 1.3) * 4, 1.5, 0, Math.PI * 2); ctx.fill();

  // Top hat
  ctx.fillStyle = '#0A0808';
  ctx.beginPath(); ctx.arc(headX, headY, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(headX, headY, 7, 0, Math.PI * 2); ctx.stroke();

  // Whisper rifle
  const rifleStartX = Math.cos(facing) * 8;
  const rifleStartY = Math.sin(facing) * 8;
  const rifleEndX = Math.cos(facing) * 42;
  const rifleEndY = Math.sin(facing) * 42;

  ctx.strokeStyle = '#888878'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(rifleStartX, rifleStartY); ctx.lineTo(rifleEndX, rifleEndY); ctx.stroke();

  ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(Math.cos(facing) * 14, Math.sin(facing) * 14);
  ctx.lineTo(Math.cos(facing) * 30, Math.sin(facing) * 30);
  ctx.stroke();

  // Muzzle tip
  ctx.fillStyle = '#F0E6A0';
  ctx.beginPath(); ctx.arc(rifleEndX, rifleEndY, 3, 0, Math.PI * 2); ctx.fill();

  // Muzzle flash
  if (player.lastShotFlash > 0) {
    const flashSize = player.lastShotFlash * 4;
    ctx.globalAlpha = player.lastShotFlash / 5;
    ctx.fillStyle = '#FFF8C0';
    ctx.beginPath(); ctx.arc(rifleEndX, rifleEndY, flashSize, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Low HP aura
  if (player.health < player.maxHealth * 0.3) {
    const pulse = 0.3 + Math.sin(frame * 0.1) * 0.2;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#C89B3C'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
  ctx.lineCap = 'butt';
  ctx.lineWidth = 1;
}

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

  // HP bar above enemy
  drawEnemyHPBarTopDown(ctx, enemy, sx, sy);

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
