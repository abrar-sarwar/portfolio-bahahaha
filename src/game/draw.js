import { LOGICAL_W, LOGICAL_H, GROUND_Y, COLORS } from './constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
export function drawBackground(ctx, frame) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
  sky.addColorStop(0, '#020710');
  sky.addColorStop(0.5, '#050D1C');
  sky.addColorStop(1, '#0A1628');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Distant nexus structure
  drawNexus(ctx, frame);

  // Tree silhouettes
  drawTrees(ctx);

  // Stone tile floor
  drawFloor(ctx);

  // Rune circles
  drawRuneCircles(ctx, frame);

  // Gold ground line
  const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 8);
  groundGrad.addColorStop(0, '#C89B3C');
  groundGrad.addColorStop(1, '#0BC4C4');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND_Y, LOGICAL_W, 4);

  // Glow under ground line
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#0BC4C4';
  ctx.fillRect(0, GROUND_Y + 4, LOGICAL_W, 6);
  ctx.globalAlpha = 1;
}

function drawNexus(ctx, frame) {
  const cx = LOGICAL_W / 2;
  const cy = 200;

  // Outer rings
  const pulse = 0.5 + Math.sin(frame * 0.02) * 0.5;
  ctx.globalAlpha = 0.15 + pulse * 0.1;
  ctx.strokeStyle = '#0BC4C4';
  ctx.lineWidth = 2;
  for (let r = 80; r <= 200; r += 40) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Central tower
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#0A1020';
  ctx.fillRect(cx - 12, cy - 140, 24, 140);

  // Tower top
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy - 140);
  ctx.lineTo(cx, cy - 180);
  ctx.lineTo(cx + 20, cy - 140);
  ctx.fillStyle = '#0A1628';
  ctx.fill();

  // Glowing core
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
  grd.addColorStop(0, 'rgba(11,196,196,0.8)');
  grd.addColorStop(0.5, 'rgba(11,196,196,0.3)');
  grd.addColorStop(1, 'rgba(11,196,196,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, 30 + pulse * 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Arch pillars
  for (let side = -1; side <= 1; side += 2) {
    const px = cx + side * 180;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#0A1020';
    ctx.fillRect(px - 8, cy - 100, 16, 260);
    ctx.fillRect(px - 20, cy + 120, 40, 20);

    // Pillar glow
    ctx.globalAlpha = 0.2 + pulse * 0.1;
    ctx.fillStyle = '#C89B3C';
    ctx.fillRect(px - 2, cy - 90, 4, 200);
    ctx.globalAlpha = 1;
  }
}

function drawTrees(ctx) {
  // Left trees
  drawTreeGroup(ctx, -30, GROUND_Y, 1);
  drawTreeGroup(ctx, 80, GROUND_Y, 0.9);

  // Right trees
  drawTreeGroup(ctx, LOGICAL_W + 30, GROUND_Y, 1);
  drawTreeGroup(ctx, LOGICAL_W - 80, GROUND_Y, 0.85);
}

function drawTreeGroup(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Trunk
  ctx.fillStyle = '#0A0F18';
  ctx.fillRect(-10, -180, 20, 180);

  // Canopy layers
  const canopyColor = '#060C16';
  const glowColor = 'rgba(11,196,196,0.15)';

  for (let layer = 0; layer < 3; layer++) {
    const ly = -140 - layer * 50;
    const lw = 90 - layer * 20;

    // Dark canopy
    ctx.fillStyle = canopyColor;
    ctx.beginPath();
    ctx.moveTo(-lw, ly);
    ctx.lineTo(0, ly - 60);
    ctx.lineTo(lw, ly);
    ctx.closePath();
    ctx.fill();

    // Teal edge glow
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

function drawFloor(ctx) {
  // Stone base
  const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, LOGICAL_H);
  floorGrad.addColorStop(0, '#060D1A');
  floorGrad.addColorStop(1, '#020710');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, GROUND_Y, LOGICAL_W, LOGICAL_H - GROUND_Y);

  // Grid tiles
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = '#1A3050';
  ctx.lineWidth = 1;
  const tileW = 80;
  const tileH = 40;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < Math.ceil(LOGICAL_W / tileW) + 1; col++) {
      const tx = col * tileW;
      const ty = GROUND_Y + row * tileH;
      ctx.strokeRect(tx, ty, tileW, tileH);
    }
  }
  ctx.globalAlpha = 1;
}

function drawRuneCircles(ctx, frame) {
  const centers = [
    { x: LOGICAL_W * 0.25, y: GROUND_Y + 60 },
    { x: LOGICAL_W * 0.5, y: GROUND_Y + 50 },
    { x: LOGICAL_W * 0.75, y: GROUND_Y + 60 },
  ];

  for (const c of centers) {
    const pulse = Math.sin(frame * 0.015 + c.x * 0.01) * 0.3 + 0.7;

    // Outer ring
    ctx.globalAlpha = 0.1 * pulse;
    ctx.strokeStyle = '#C89B3C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 55, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.globalAlpha = 0.15 * pulse;
    ctx.strokeStyle = '#0BC4C4';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 35, 0, Math.PI * 2);
    ctx.stroke();

    // Rune marks (6 points)
    ctx.globalAlpha = 0.2 * pulse;
    ctx.fillStyle = '#C89B3C';
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + frame * 0.005;
      const rx = c.x + Math.cos(a) * 50;
      const ry = c.y + Math.sin(a) * 50;
      ctx.beginPath();
      ctx.arc(rx, ry, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JHIN
// ─────────────────────────────────────────────────────────────────────────────
export function drawJhin(ctx, player, frame) {
  const x = player.x;
  const y = player.y;
  const facing = player.facing;
  const walkOsc = Math.sin(player.walkFrame) * 6;
  const bobY = Math.abs(Math.sin(player.walkFrame)) * 3;
  const isLowHp = player.health < player.maxHealth * 0.3;

  ctx.save();
  ctx.translate(x, y - bobY);

  // Hit flash effect
  if (player.hitFlash > 0 && player.hitFlash % 3 < 2) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(-25, -160, 50, 160);
    ctx.globalAlpha = 1;
  }

  // Shadow/ground bloom
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
  shadow.addColorStop(0, 'rgba(200,155,60,0.25)');
  shadow.addColorStop(1, 'rgba(200,155,60,0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(0, 0, 40, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Low HP golden aura
  if (isLowHp) {
    const pulse = 0.5 + Math.sin(frame * 0.1) * 0.3;
    ctx.globalAlpha = pulse * 0.4;
    const aura = ctx.createRadialGradient(0, -80, 0, 0, -80, 60);
    aura.addColorStop(0, '#C89B3C');
    aura.addColorStop(1, 'rgba(200,155,60,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -80, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.scale(facing, 1);

  // Legs (walk animation)
  const legSwing = walkOsc * 0.4;
  ctx.fillStyle = '#1A1208';

  // Left leg
  ctx.save();
  ctx.translate(-8, -30);
  ctx.rotate(legSwing * 0.06);
  ctx.fillRect(-5, 0, 10, 40);
  ctx.fillStyle = '#2A1F0A';
  ctx.fillRect(-6, 35, 13, 12);
  ctx.restore();

  // Right leg
  ctx.save();
  ctx.translate(8, -30);
  ctx.rotate(-legSwing * 0.06);
  ctx.fillRect(-5, 0, 10, 40);
  ctx.fillStyle = '#2A1F0A';
  ctx.fillRect(-6, 35, 13, 12);
  ctx.restore();

  // Cape
  ctx.fillStyle = '#0D0808';
  ctx.beginPath();
  ctx.moveTo(-20, -130);
  ctx.lineTo(-35 - walkOsc * 0.5, -60);
  ctx.lineTo(-25 - walkOsc * 0.3, 0);
  ctx.lineTo(5, 0);
  ctx.lineTo(15, -130);
  ctx.closePath();
  ctx.fill();

  // Cape gold trim
  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(-20, -130);
  ctx.lineTo(-35 - walkOsc * 0.5, -60);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Body (ornate gold coat)
  ctx.fillStyle = '#1C1408';
  ctx.fillRect(-14, -130, 30, 105);

  // Gold coat details
  ctx.fillStyle = '#C89B3C';
  // Lapels
  ctx.beginPath();
  ctx.moveTo(0, -130);
  ctx.lineTo(-10, -100);
  ctx.lineTo(0, -95);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(14, -130);
  ctx.lineTo(8, -100);
  ctx.lineTo(14, -95);
  ctx.closePath();
  ctx.fill();

  // Buttons
  ctx.fillStyle = '#F0E6A0';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(2, -118 + i * 18, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gold collar/shoulder piece
  ctx.fillStyle = '#C89B3C';
  ctx.fillRect(-16, -135, 34, 12);
  ctx.fillStyle = '#F0E6A0';
  ctx.fillRect(-14, -137, 4, 4);
  ctx.fillRect(12, -137, 4, 4);

  // Arms
  ctx.fillStyle = '#1C1408';
  // Gun arm (extended forward)
  ctx.save();
  ctx.translate(14, -115);
  ctx.rotate(-0.3);
  ctx.fillRect(0, -5, 45, 10);
  ctx.restore();

  // Off arm
  ctx.save();
  ctx.translate(-14, -115);
  ctx.rotate(0.2 + walkOsc * 0.01);
  ctx.fillRect(-30, -4, 30, 8);
  ctx.restore();

  // Neck
  ctx.fillStyle = '#E8C89A';
  ctx.fillRect(-4, -145, 8, 15);

  // Head: porcelain mask
  ctx.fillStyle = '#E8E0D0';
  ctx.beginPath();
  ctx.ellipse(2, -158, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mask hollow eyes
  ctx.fillStyle = '#1A0808';
  ctx.beginPath();
  ctx.ellipse(-5, -160, 5, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(9, -160, 5, 6, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Red glow in eyes
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#CC2222';
  ctx.beginPath();
  ctx.ellipse(-5, -160, 3, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(9, -160, 3, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Gold teardrop mark
  ctx.fillStyle = '#C89B3C';
  ctx.beginPath();
  ctx.arc(-5, -149, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Mask cracks/lines
  ctx.strokeStyle = 'rgba(200,155,60,0.4)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(2, -175);
  ctx.lineTo(-2, -165);
  ctx.lineTo(4, -155);
  ctx.stroke();

  // Feathered top hat
  ctx.fillStyle = '#0D0A06';
  ctx.fillRect(-14, -190, 32, 30); // Brim
  ctx.fillRect(-10, -225, 24, 38); // Crown

  // Gold hat band
  ctx.fillStyle = '#C89B3C';
  ctx.fillRect(-10, -193, 24, 5);

  // Feathers
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#1A1408';
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(10 + i * 4, -222);
    ctx.rotate(-0.3 + i * 0.15);
    ctx.beginPath();
    ctx.ellipse(0, -12, 3, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // WHISPER rifle
  const rifleY = -108;
  const rifleX = 14;

  // Barrel (long, ornate)
  const barrelGrad = ctx.createLinearGradient(rifleX, rifleY, rifleX + 100, rifleY);
  barrelGrad.addColorStop(0, '#C89B3C');
  barrelGrad.addColorStop(0.4, '#888');
  barrelGrad.addColorStop(1, '#555');
  ctx.fillStyle = barrelGrad;
  ctx.fillRect(rifleX, rifleY - 4, 100, 8);

  // Stock
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(rifleX - 15, rifleY - 5, 20, 10);

  // Filigree decorations
  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;
  // Scrollwork
  ctx.beginPath();
  ctx.arc(rifleX + 30, rifleY, 6, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rifleX + 50, rifleY, 5, 0, Math.PI);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Scope
  ctx.fillStyle = '#222';
  ctx.fillRect(rifleX + 35, rifleY - 8, 20, 6);
  ctx.fillStyle = '#C89B3C';
  ctx.fillRect(rifleX + 34, rifleY - 9, 2, 8);
  ctx.fillRect(rifleX + 54, rifleY - 9, 2, 8);

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER PROJECTILES
// ─────────────────────────────────────────────────────────────────────────────
export function drawPlayerProjectiles(ctx, player, frame) {
  for (const proj of player.projectiles) {
    if (proj.isUltimate) {
      // Giant golden beam
      ctx.globalAlpha = Math.min(1, proj.life / 10);
      const grad = ctx.createLinearGradient(proj.x - 50, 0, proj.x + 50, 0);
      grad.addColorStop(0, 'rgba(240,230,160,0)');
      grad.addColorStop(0.5, '#F0E6A0');
      grad.addColorStop(1, 'rgba(240,230,160,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(proj.x - 50, proj.y - 6, 100, 12);
      ctx.globalAlpha = 1;
    } else {
      // Normal bullet
      ctx.globalAlpha = 0.9;
      const bulletColor = proj.isCrit ? '#F0E6A0' : '#AADDAA';
      ctx.fillStyle = bulletColor;
      ctx.beginPath();
      ctx.ellipse(proj.x, proj.y, 10, 4, Math.atan2(proj.vy, proj.vx), 0, Math.PI * 2);
      ctx.fill();

      // Crit glow
      if (proj.isCrit) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#C89B3C';
        ctx.beginPath();
        ctx.ellipse(proj.x, proj.y, 15, 8, Math.atan2(proj.vy, proj.vx), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// W BEAM
// ─────────────────────────────────────────────────────────────────────────────
export function drawWBeam(ctx, player) {
  if (!player.wBeamActive || !player.beamTarget) return;

  const sx = player.x + player.facing * 50;
  const sy = player.y - 108;
  const ex = player.beamTarget.x;
  const ey = player.beamTarget.y;

  const alpha = player.wBeamTimer / 30;
  ctx.globalAlpha = alpha;

  // Outer glow
  ctx.strokeStyle = 'rgba(200,155,60,0.4)';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // Core beam
  ctx.strokeStyle = '#F0E6A0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAPS
// ─────────────────────────────────────────────────────────────────────────────
export function drawTraps(ctx, player, frame) {
  for (const trap of player.traps) {
    const pulse = 0.6 + Math.sin(frame * 0.1) * 0.2;
    const armed = trap.armTimer <= 0;
    const armAlpha = armed ? 1 : trap.armTimer / 30;

    ctx.globalAlpha = armAlpha * pulse;
    // Outer ring
    ctx.strokeStyle = '#C89B3C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(trap.x, trap.y - 8, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Inner diamond
    ctx.fillStyle = armed ? '#C89B3C' : '#887722';
    ctx.beginPath();
    ctx.moveTo(trap.x, trap.y - 18);
    ctx.lineTo(trap.x + 10, trap.y - 8);
    ctx.lineTo(trap.x, trap.y + 2);
    ctx.lineTo(trap.x - 10, trap.y - 8);
    ctx.closePath();
    ctx.fill();

    if (trap.armTimer > 0) trap.armTimer--;

    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENEMY PROJECTILES
// ─────────────────────────────────────────────────────────────────────────────
export function drawEnemyProjectiles(ctx, enemy) {
  for (const proj of enemy.projectiles) {
    ctx.globalAlpha = 0.9;
    if (proj.isAuditBeam) {
      // Pulsing compliance beam
      ctx.fillStyle = '#8800AA';
      ctx.shadowColor = '#AA00FF';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENEMIES
// ─────────────────────────────────────────────────────────────────────────────
export function drawEnemy(ctx, enemy, frame) {
  if (enemy.dead && enemy.deathTimer > enemy.deathDuration) return;

  const alpha = enemy.dead ? Math.max(0, 1 - enemy.deathTimer / enemy.deathDuration) : 1;
  ctx.globalAlpha = alpha;
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.scale(enemy.facing === -1 ? 1 : -1, 1);

  switch (enemy.index) {
    case 0: drawScriptKiddie(ctx, enemy, frame); break;
    case 1: drawPhantomThreat(ctx, enemy, frame); break;
    case 2: drawRiskGolem(ctx, enemy, frame); break;
    case 3: drawFirewallHydra(ctx, enemy, frame); break;
    case 4: drawFinalAudit(ctx, enemy, frame); break;
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  // Stun indicator
  if (enemy.stunned && !enemy.dead) {
    ctx.fillStyle = '#FFE066';
    ctx.font = '16px "Share Tech Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('★ STUNNED ★', enemy.x, enemy.y - 200);
    ctx.textAlign = 'left';
  }

  // Phantom clones
  if (enemy.index === 1 && enemy.clones) {
    for (const clone of enemy.clones) {
      ctx.globalAlpha = 0.35;
      ctx.save();
      ctx.translate(clone.x, clone.y);
      ctx.scale(-1, 1);
      drawPhantomThreat(ctx, enemy, frame);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }
}

function drawScriptKiddie(ctx, enemy, frame) {
  const bob = Math.sin(frame * 0.04) * 3;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 35, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hoodie body
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(-22, -100 + bob, 44, 100);

  // Hood
  ctx.beginPath();
  ctx.arc(0, -110 + bob, 28, 0, Math.PI * 2);
  ctx.fill();

  // Face in hood (dark)
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(0, -110 + bob, 22, 0, Math.PI * 2);
  ctx.fill();

  // Beady red eyes
  ctx.fillStyle = '#FF2222';
  ctx.shadowColor = '#FF2222';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(-8, -112 + bob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -112 + bob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Hunched posture
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(-35, -80 + bob, 25, 20); // left shoulder

  // Laptop
  const lpulse = 0.7 + Math.sin(frame * 0.05) * 0.2;
  ctx.fillStyle = '#222';
  ctx.fillRect(-28, -65 + bob, 45, 30);
  // Screen glow
  ctx.fillStyle = `rgba(0,${Math.floor(180 * lpulse)},0,0.8)`;
  ctx.fillRect(-24, -62 + bob, 37, 24);
  ctx.fillStyle = '#00FF44';
  ctx.font = '8px "Share Tech Mono"';
  ctx.globalAlpha = lpulse;
  ctx.fillText('0x4F 0x1A', -22, -52 + bob);
  ctx.fillText('#!/bin/sh', -22, -44 + bob);
  ctx.globalAlpha = 1;

  // Floating hex symbols
  for (let i = 0; i < 3; i++) {
    const angle = frame * 0.03 + (i * Math.PI * 2) / 3;
    const hx = Math.cos(angle) * 50;
    const hy = Math.sin(angle) * 20 - 80;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#22FF44';
    ctx.font = '10px "Share Tech Mono"';
    ctx.fillText('0x', hx - 8, hy + bob);
    ctx.globalAlpha = 1;
  }
}

function drawPhantomThreat(ctx, enemy, frame) {
  const glitch = (Math.random() > 0.95) ? (Math.random() - 0.5) * 8 : 0;

  // Dark smoke body
  const smokeGrad = ctx.createRadialGradient(glitch, -90, 10, glitch, -90, 60);
  smokeGrad.addColorStop(0, 'rgba(80,0,120,0.9)');
  smokeGrad.addColorStop(0.6, 'rgba(40,0,80,0.6)');
  smokeGrad.addColorStop(1, 'rgba(20,0,40,0)');
  ctx.fillStyle = smokeGrad;
  ctx.beginPath();
  ctx.ellipse(glitch, -90, 35, 70, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wisps
  ctx.fillStyle = 'rgba(100,0,180,0.3)';
  for (let i = 0; i < 5; i++) {
    const a = frame * 0.04 + i * 1.2;
    const wx = Math.cos(a) * 40 + glitch;
    const wy = Math.sin(a) * 20 - 90;
    ctx.beginPath();
    ctx.arc(wx, wy, 8 + Math.sin(a * 2) * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  ctx.fillStyle = '#1A0028';
  ctx.beginPath();
  ctx.arc(glitch, -145, 28, 0, Math.PI * 2);
  ctx.fill();

  // Cyan eyes
  ctx.fillStyle = '#00FFFF';
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(glitch - 9, -148, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(glitch + 9, -148, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Glitch offset clones
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#FF00FF';
  ctx.beginPath();
  ctx.ellipse(glitch + 5, -90, 35, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#00FFFF';
  ctx.beginPath();
  ctx.ellipse(glitch - 5, -90, 35, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawRiskGolem(ctx, enemy, frame) {
  const stomp = Math.abs(Math.sin(enemy.walkFrame)) * 4;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 55, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#555550';
  ctx.fillRect(-30, -60 + stomp, 22, 60);
  ctx.fillRect(8, -55 - stomp, 22, 55);

  // Body (stone blocks)
  ctx.fillStyle = '#666660';
  ctx.fillRect(-40, -150, 80, 95);

  // Block details (cracks)
  ctx.strokeStyle = '#444440';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-40, -115);
  ctx.lineTo(40, -115);
  ctx.moveTo(-40, -90);
  ctx.lineTo(40, -90);
  ctx.moveTo(0, -150);
  ctx.lineTo(0, -55);
  ctx.stroke();

  // Head
  ctx.fillStyle = '#5A5A55';
  ctx.fillRect(-25, -195, 50, 50);

  // Eyes (glowing red)
  ctx.fillStyle = '#FF4400';
  ctx.shadowColor = '#FF4400';
  ctx.shadowBlur = 8;
  ctx.fillRect(-18, -180, 12, 10);
  ctx.fillRect(6, -180, 12, 10);
  ctx.shadowBlur = 0;

  // Red tie
  ctx.fillStyle = '#CC2222';
  ctx.beginPath();
  ctx.moveTo(0, -155);
  ctx.lineTo(-8, -130);
  ctx.lineTo(0, -120);
  ctx.lineTo(8, -130);
  ctx.closePath();
  ctx.fill();
  // Tie knot
  ctx.fillStyle = '#AA1111';
  ctx.fillRect(-5, -158, 10, 8);

  // Paper wings (spreadsheet)
  const wingFlap = Math.sin(frame * 0.03) * 10;
  for (let side = -1; side <= 1; side += 2) {
    ctx.save();
    ctx.translate(side * 40, -130);
    ctx.rotate(side * (0.3 + wingFlap * 0.01));

    // Paper sheet
    ctx.fillStyle = '#F0EEE0';
    ctx.fillRect(0, -30, side * 55, 60);

    // Grid lines
    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = 0.8;
    for (let r = 0; r < 5; r++) {
      ctx.beginPath();
      ctx.moveTo(0, -30 + r * 15);
      ctx.lineTo(side * 55, -30 + r * 15);
      ctx.stroke();
    }
    for (let c = 0; c < 4; c++) {
      ctx.beginPath();
      ctx.moveTo(side * c * 14, -30);
      ctx.lineTo(side * c * 14, 30);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Clipboard
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(-15, -155, 30, 45);
  ctx.fillStyle = '#F0EEE0';
  ctx.fillRect(-12, -150, 24, 38);
  ctx.fillStyle = '#333';
  ctx.font = '6px "Share Tech Mono"';
  ctx.fillText('COMPLIANCE', -11, -138);
  ctx.fillText('REPORT', -11, -130);
  ctx.fillText('Q3-2024', -11, -122);
}

function drawFirewallHydra(ctx, enemy, frame) {
  const necks = [
    { ox: -35, oy: -140, headX: -60, headY: -190, color: '#CC2200' },
    { ox: 0, oy: -150, headX: 5, headY: -205, color: '#FF6600' },
    { ox: 35, oy: -140, headX: 50, headY: -185, color: '#0044CC' },
  ];

  // Circuit board body
  ctx.fillStyle = '#0A1510';
  ctx.fillRect(-45, -130, 90, 130);

  // Circuit traces
  ctx.strokeStyle = '#00AA44';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  const traces = [
    [-40, -100, 0, -80], [0, -80, 40, -90], [-20, -110, -20, -60],
    [20, -110, 20, -60], [-40, -70, 40, -70],
  ];
  for (const [x1, y1, x2, y2] of traces) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // IC chips on body
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#1A2A1A';
    ctx.fillRect(-35 + i * 25, -115, 18, 12);
    ctx.strokeStyle = '#00AA44';
    ctx.strokeRect(-35 + i * 25, -115, 18, 12);
  }

  // Legs
  ctx.fillStyle = '#0A1510';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-40 + i * 20, -10, 8, 15);
  }

  // Three necks and heads
  for (let ni = 0; ni < 3; ni++) {
    const n = necks[ni];
    const sway = Math.sin(frame * 0.04 + ni * 1.2) * 8;

    // Neck
    ctx.strokeStyle = n.color;
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(n.ox, n.oy);
    ctx.quadraticCurveTo(
      n.ox + sway * 0.5, (n.oy + n.headY) / 2,
      n.headX + sway, n.headY
    );
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;

    // Head
    ctx.save();
    ctx.translate(n.headX + sway, n.headY);
    ctx.fillStyle = n.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FF0';
    ctx.shadowColor = '#FF0';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-8, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Fire breath
    const breathIntensity = 0.5 + Math.sin(frame * 0.08 + ni) * 0.3;
    ctx.globalAlpha = breathIntensity * 0.7;
    for (let fi = 0; fi < 3; fi++) {
      const fx = -15 - fi * 8 + (Math.random() - 0.5) * 6;
      const fy = (Math.random() - 0.5) * 10;
      ctx.fillStyle = fi === 0 ? '#FF6600' : fi === 1 ? '#FF4400' : '#FF2200';
      ctx.beginPath();
      ctx.ellipse(fx, fy, 6 + fi * 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

function drawFinalAudit(ctx, enemy, frame) {
  const stomp = Math.abs(Math.sin(enemy.walkFrame * 0.8)) * 3;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 45, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs in suit trousers
  ctx.fillStyle = '#222228';
  ctx.fillRect(-18, -65 + stomp, 16, 65);
  ctx.fillRect(2, -60 - stomp, 16, 60);

  // Suit pants bottom
  ctx.fillStyle = '#1A1A20';
  ctx.fillRect(-20, -12, 16, 12);
  ctx.fillRect(4, -12, 16, 12);

  // Suit jacket body
  ctx.fillStyle = '#2A2A35';
  ctx.fillRect(-30, -150, 60, 90);

  // White shirt & tie
  ctx.fillStyle = '#E8E8F0';
  ctx.fillRect(-8, -148, 16, 45);

  // Tie
  ctx.fillStyle = '#440044';
  ctx.beginPath();
  ctx.moveTo(-4, -148);
  ctx.lineTo(-6, -120);
  ctx.lineTo(0, -110);
  ctx.lineTo(6, -120);
  ctx.lineTo(4, -148);
  ctx.closePath();
  ctx.fill();

  // Lapels
  ctx.fillStyle = '#252530';
  ctx.beginPath();
  ctx.moveTo(-30, -150);
  ctx.lineTo(-8, -120);
  ctx.lineTo(-8, -148);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(30, -150);
  ctx.lineTo(8, -120);
  ctx.lineTo(8, -148);
  ctx.closePath();
  ctx.fill();

  // Arms
  ctx.fillStyle = '#2A2A35';
  ctx.fillRect(-42, -150, 14, 80);
  ctx.fillRect(28, -150, 14, 80);

  // Hands (holding briefcase)
  ctx.fillStyle = '#C89060';
  ctx.fillRect(-32, -72, 12, 14);
  ctx.fillRect(20, -72, 12, 14);

  // Briefcase
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(-28, -75, 55, 38);
  ctx.fillStyle = '#6A5010';
  ctx.fillRect(-28, -58, 55, 5);
  ctx.fillStyle = '#C89B3C';
  ctx.fillRect(-4, -80, 8, 8);

  // Shoulders (power pose)
  ctx.fillStyle = '#252530';
  ctx.fillRect(-38, -155, 20, 12);
  ctx.fillRect(18, -155, 20, 12);

  // Neck
  ctx.fillStyle = '#C89060';
  ctx.fillRect(-6, -165, 12, 18);

  // Head
  ctx.fillStyle = '#D0A060';
  ctx.beginPath();
  ctx.ellipse(0, -185, 22, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Receding hair
  ctx.fillStyle = '#3A2A10';
  ctx.beginPath();
  ctx.arc(0, -203, 20, Math.PI, 0);
  ctx.fill();

  // Thick glasses
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-9, -185, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(9, -185, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-1, -185);
  ctx.lineTo(1, -185);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-19, -185);
  ctx.lineTo(-22, -183);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(19, -185);
  ctx.lineTo(22, -183);
  ctx.stroke();

  // Glowing red eyes behind glasses
  ctx.fillStyle = '#FF2200';
  ctx.shadowColor = '#FF2200';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(-9, -185, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(9, -185, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Devil horns
  ctx.fillStyle = '#880000';
  ctx.beginPath();
  ctx.moveTo(-15, -208);
  ctx.lineTo(-25, -230);
  ctx.lineTo(-8, -210);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(15, -208);
  ctx.lineTo(25, -230);
  ctx.lineTo(8, -210);
  ctx.closePath();
  ctx.fill();

  // Floating audit papers
  for (let i = 0; i < 3; i++) {
    const angle = frame * 0.02 + i * 2.1;
    const px = Math.cos(angle) * 60;
    const py = Math.sin(angle) * 25 - 150;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#F0EEE0';
    ctx.fillRect(px - 12, py - 8, 24, 18);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(px - 12, py - 8, 24, 18);
    ctx.fillStyle = '#333';
    ctx.font = '5px "Share Tech Mono"';
    ctx.fillText('DENIED', px - 10, py + 2);
    ctx.globalAlpha = 1;
  }

  // Shield (hexagonal compliance shield)
  if (enemy.shieldActive) {
    const shieldPulse = 0.6 + Math.sin(frame * 0.08) * 0.3;
    ctx.globalAlpha = 0.7 * shieldPulse;
    ctx.strokeStyle = '#0088FF';
    ctx.shadowColor = '#0088FF';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 4;

    // Hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const hx = Math.cos(a) * 80;
      const hy = Math.sin(a) * 80 - 110;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,100,200,0.15)';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Shield text
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#88CCFF';
    ctx.font = '8px "Share Tech Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('COMPLIANCE', 0, -100);
    ctx.fillText('SHIELD', 0, -90);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAGICIAN NPC
// ─────────────────────────────────────────────────────────────────────────────
export function drawMagician(ctx, magician, frame) {
  if (!magician.visible) return;

  ctx.save();
  ctx.translate(magician.x, GROUND_Y);

  const bob = Math.sin(frame * 0.04) * 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Elegant suit
  ctx.fillStyle = '#101020';
  ctx.fillRect(-18, -130, 36, 100);

  // White shirt
  ctx.fillStyle = '#E8E8F0';
  ctx.fillRect(-6, -128, 12, 35);

  // Cape (dramatic)
  ctx.fillStyle = '#080810';
  ctx.beginPath();
  ctx.moveTo(-20, -130 + bob);
  ctx.lineTo(-45, -50 + bob);
  ctx.lineTo(-15, 0);
  ctx.lineTo(18, -130 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Gold vest
  ctx.fillStyle = '#C89B3C';
  ctx.fillRect(-14, -128, 8, 30);
  ctx.fillRect(6, -128, 8, 30);

  // Arms (gesture pose)
  ctx.fillStyle = '#101020';
  ctx.save();
  ctx.translate(-18, -115 + bob);
  ctx.rotate(-0.5);
  ctx.fillRect(-30, -5, 30, 10);
  ctx.restore();
  ctx.save();
  ctx.translate(18, -115 + bob);
  ctx.rotate(0.6);
  ctx.fillRect(0, -5, 30, 10);
  ctx.restore();

  // Magic sparkles from hands
  for (let i = 0; i < 4; i++) {
    const sparkAngle = frame * 0.1 + i * 1.57;
    const sx = 35 + Math.cos(sparkAngle) * 12;
    const sy = -115 + bob + Math.sin(sparkAngle) * 12;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = i % 2 === 0 ? '#C89B3C' : '#0BC4C4';
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Head
  ctx.fillStyle = '#D0B080';
  ctx.beginPath();
  ctx.arc(0, -155 + bob, 20, 0, Math.PI * 2);
  ctx.fill();

  // Mustache
  ctx.fillStyle = '#333320';
  ctx.beginPath();
  ctx.arc(-6, -148 + bob, 5, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, -148 + bob, 5, Math.PI, 0);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-8, -158 + bob, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -158 + bob, 3, 0, Math.PI * 2);
  ctx.fill();

  // Top hat
  ctx.fillStyle = '#0D0A06';
  ctx.fillRect(-16, -188 + bob, 32, 14);
  ctx.fillRect(-12, -220 + bob, 24, 34);

  // Gold hat band
  ctx.fillStyle = '#C89B3C';
  ctx.fillRect(-12, -190 + bob, 24, 5);

  // Stars/sparkles around hat
  ctx.globalAlpha = 0.6 + Math.sin(frame * 0.05) * 0.3;
  ctx.fillStyle = '#F0E6A0';
  for (let i = 0; i < 3; i++) {
    const sa = frame * 0.05 + i * 2.1;
    const sx = Math.cos(sa) * 25;
    const sy = -210 + bob + Math.sin(sa) * 10;
    drawStar(ctx, sx, sy, 5, 2);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawStar(ctx, x, y, outerR, innerR) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const inAngle = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
    else ctx.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
    ctx.lineTo(x + Math.cos(inAngle) * innerR, y + Math.sin(inAngle) * innerR);
  }
  ctx.closePath();
  ctx.fill();
}
