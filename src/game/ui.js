import { LOGICAL_W, LOGICAL_H, GROUND_Y, COLORS } from './constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// FULL HUD
// ─────────────────────────────────────────────────────────────────────────────
export function drawHUD(ctx, player, currentEnemy, killFeed, frame) {
  drawChampionPanel(ctx, player, frame);
  drawAmmoCounter(ctx, player);
  drawAbilityBar(ctx, player, frame);
  if (currentEnemy && !currentEnemy.dead) {
    drawBossHPBar(ctx, currentEnemy, frame);
  }
  drawKillFeed(ctx, killFeed);
  drawMinimap(ctx, player, currentEnemy);
  if (player.rCharging) {
    drawRChargeBar(ctx, player);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Champion Panel (bottom-left)
// ─────────────────────────────────────────────────────────────────────────────
function drawChampionPanel(ctx, player, frame) {
  const px = 12;
  const py = LOGICAL_H - 120;
  const panelW = 210;
  const panelH = 108;

  // Panel background
  ctx.fillStyle = 'rgba(2,4,12,0.85)';
  ctx.fillRect(px, py, panelW, panelH);

  // Gold border
  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, panelW, panelH);

  // Corner ornaments
  drawCornerOrnaments(ctx, px, py, panelW, panelH, 10, '#C89B3C');

  // Portrait area
  const portX = px + 6;
  const portY = py + 6;
  const portW = 72;
  const portH = 72;

  // Portrait background
  ctx.fillStyle = '#0A1020';
  ctx.fillRect(portX, portY, portW, portH);
  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(portX, portY, portW, portH);

  // Draw mini Jhin portrait
  drawJhinPortrait(ctx, portX + portW / 2, portY + portH - 5, frame);

  // Champion name
  ctx.fillStyle = '#C89B3C';
  ctx.font = '10px "Cinzel"';
  ctx.fillText('JHIN', portX + portW + 8, portY + 14);
  ctx.fillStyle = '#888';
  ctx.font = '8px "Share Tech Mono"';
  ctx.fillText('THE VIRTUOSO', portX + portW + 8, portY + 26);

  // HP Bar
  const barX = portX + portW + 6;
  const barY = portY + 35;
  const barW = panelW - portW - 20;
  const barH = 12;

  drawStatBar(ctx, barX, barY, barW, barH, player.health / player.maxHealth, '#1EAF4A', '#CC2222', 'HP');

  // Ammo/resource bar (blue)
  const ammoFill = player.reloading ? player.reloadTimer / player.reloadDuration : player.bullets / player.maxBullets;
  drawStatBar(ctx, barX, barY + 18, barW, barH, ammoFill, '#1A6ED8', '#0A3060', player.reloading ? 'RLD' : 'AMO');

  // XP bar (thin, full width)
  const xpBarY = py + panelH - 8;
  ctx.fillStyle = '#0A1020';
  ctx.fillRect(px + 2, xpBarY, panelW - 4, 5);
  ctx.fillStyle = '#1A6ED8';
  ctx.fillRect(px + 2, xpBarY, (panelW - 4) * 0.65, 5);
  ctx.fillStyle = '#6699FF';
  ctx.font = '7px "Share Tech Mono"';
  ctx.fillText('XP', px + 4, xpBarY - 2);
}

function drawStatBar(ctx, x, y, w, h, fill, colorFull, colorEmpty, label) {
  // Background
  ctx.fillStyle = '#080E1C';
  ctx.fillRect(x, y, w, h);

  // Fill gradient
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, colorFull);
  grad.addColorStop(1, colorEmpty);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, fill)), h);

  // Border
  ctx.strokeStyle = 'rgba(200,155,60,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Label
  if (label) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '7px "Share Tech Mono"';
    ctx.fillText(label, x + 3, y + h - 2);
  }
}

function drawJhinPortrait(ctx, cx, cy, frame) {
  // Simple face portrait
  ctx.fillStyle = '#E8E0D0';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 30, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mask
  ctx.fillStyle = '#F0EAD8';
  ctx.fillRect(cx - 16, cy - 50, 32, 30);

  // Eyes
  ctx.fillStyle = '#200000';
  ctx.beginPath();
  ctx.ellipse(cx - 7, cy - 38, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 7, cy - 38, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red glow
  ctx.fillStyle = '#CC2222';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(cx - 7, cy - 38, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 7, cy - 38, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Gold teardrop
  ctx.fillStyle = '#C89B3C';
  ctx.beginPath();
  ctx.arc(cx - 7, cy - 27, 2, 0, Math.PI * 2);
  ctx.fill();

  // Hat
  ctx.fillStyle = '#0D0A06';
  ctx.fillRect(cx - 15, cy - 65, 30, 10);
  ctx.fillRect(cx - 11, cy - 76, 22, 14);
  ctx.fillStyle = '#C89B3C';
  ctx.fillRect(cx - 11, cy - 66, 22, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// Ammo Counter
// ─────────────────────────────────────────────────────────────────────────────
function drawAmmoCounter(ctx, player) {
  const startX = 14;
  const startY = LOGICAL_H - 132;
  const slotSize = 14;
  const gap = 4;

  for (let i = 0; i < player.maxBullets; i++) {
    const bx = startX + i * (slotSize + gap);
    const isFilled = i < player.bullets;
    const isCrit = i === player.maxBullets - 1;

    // Slot background
    ctx.fillStyle = '#0A0A14';
    ctx.fillRect(bx, startY, slotSize, slotSize);
    ctx.strokeStyle = isCrit ? '#C89B3C' : 'rgba(200,155,60,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, startY, slotSize, slotSize);

    if (isFilled) {
      ctx.fillStyle = isCrit ? '#F0E6A0' : '#AADDAA';
      if (isCrit) {
        ctx.shadowColor = '#C89B3C';
        ctx.shadowBlur = 6;
      }
      ctx.fillRect(bx + 2, startY + 2, slotSize - 4, slotSize - 4);
      ctx.shadowBlur = 0;
    }

    if (isCrit && isFilled) {
      ctx.fillStyle = '#C89B3C';
      ctx.font = '8px "Share Tech Mono"';
      ctx.fillText('4', bx + 4, startY + 11);
    }
  }

  // Reload bar
  if (player.reloading) {
    const barW = player.maxBullets * (slotSize + gap) - gap;
    const progress = player.reloadTimer / player.reloadDuration;
    ctx.fillStyle = '#0A0A14';
    ctx.fillRect(startX, startY + slotSize + 3, barW, 4);
    ctx.fillStyle = '#C89B3C';
    ctx.fillRect(startX, startY + slotSize + 3, barW * progress, 4);
    ctx.fillStyle = '#888';
    ctx.font = '8px "Share Tech Mono"';
    ctx.fillText('RELOADING', startX, startY + slotSize + 16);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ability Bar (bottom-center)
// ─────────────────────────────────────────────────────────────────────────────
const ABILITY_DEFS = [
  { key: 'Q', label: 'Whisper Shot', color: '#AADDAA', maxCd: 0 },
  { key: 'W', label: 'Deadly Flourish', color: '#0BC4C4', maxCd: 'wMaxCooldown' },
  { key: 'E', label: 'Captive Audience', color: '#C89B3C', maxCd: 'eMaxCooldown' },
  { key: 'R', label: 'Curtain Call', color: '#CC2222', maxCd: 'rMaxCooldown' },
];

function drawAbilityBar(ctx, player, frame) {
  const slotW = 58;
  const slotH = 58;
  const gap = 6;
  const totalW = ABILITY_DEFS.length * (slotW + gap) - gap;
  const startX = (LOGICAL_W - totalW) / 2;
  const startY = LOGICAL_H - 72;

  for (let i = 0; i < ABILITY_DEFS.length; i++) {
    const ab = ABILITY_DEFS[i];
    const bx = startX + i * (slotW + gap);
    const cdKey = ab.key === 'W' ? 'wCooldown' : ab.key === 'E' ? 'eCooldown' : ab.key === 'R' ? 'rCooldown' : null;
    const maxCdKey = ab.key === 'W' ? 'wMaxCooldown' : ab.key === 'E' ? 'eMaxCooldown' : ab.key === 'R' ? 'rMaxCooldown' : null;

    const onCd = cdKey ? player[cdKey] > 0 : false;
    const cdRatio = (cdKey && maxCdKey) ? player[cdKey] / player[maxCdKey] : 0;

    // Stone frame background
    const frameGrad = ctx.createLinearGradient(bx, startY, bx, startY + slotH);
    frameGrad.addColorStop(0, '#1A1810');
    frameGrad.addColorStop(1, '#0A0808');
    ctx.fillStyle = frameGrad;
    ctx.fillRect(bx, startY, slotW, slotH);

    // Ability icon fill (colored)
    const iconColor = onCd ? 'rgba(40,30,20,0.8)' : ab.color;
    ctx.fillStyle = iconColor;
    ctx.globalAlpha = onCd ? 0.5 : 0.3;
    ctx.fillRect(bx + 3, startY + 3, slotW - 6, slotH - 6);
    ctx.globalAlpha = 1;

    // Draw ability symbol
    drawAbilityIcon(ctx, ab.key, bx + slotW / 2, startY + slotH / 2, ab.color, onCd, frame);

    // Cooldown overlay (fills from top)
    if (onCd) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(bx + 3, startY + 3, slotW - 6, (slotH - 6) * cdRatio);
      // CD number
      const cdSec = (player[cdKey] / 60).toFixed(1);
      ctx.fillStyle = '#CCC';
      ctx.font = 'bold 14px "Share Tech Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(cdSec, bx + slotW / 2, startY + slotH / 2 + 5);
      ctx.textAlign = 'left';
    }

    // Gold border (glows when ready)
    ctx.strokeStyle = onCd ? 'rgba(100,80,30,0.6)' : '#C89B3C';
    ctx.lineWidth = onCd ? 1 : 2;
    if (!onCd) {
      ctx.shadowColor = '#C89B3C';
      ctx.shadowBlur = 5;
    }
    ctx.strokeRect(bx, startY, slotW, slotH);
    ctx.shadowBlur = 0;

    // Key label
    ctx.fillStyle = onCd ? '#555' : '#F0E6A0';
    ctx.font = 'bold 11px "Cinzel"';
    ctx.textAlign = 'center';
    ctx.fillText(ab.key, bx + slotW / 2, startY + slotH + 14);
    ctx.textAlign = 'left';

    // R charging indicator
    if (ab.key === 'R' && player.rCharging) {
      ctx.fillStyle = 'rgba(204,34,34,0.4)';
      ctx.fillRect(bx, startY, slotW, slotH);
      ctx.strokeStyle = '#CC2222';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, startY, slotW, slotH);
      ctx.lineWidth = 1;
    }
  }
  ctx.lineWidth = 1;
}

function drawAbilityIcon(ctx, key, cx, cy, color, onCd, frame) {
  ctx.fillStyle = onCd ? '#444' : color;
  ctx.strokeStyle = onCd ? '#444' : color;
  ctx.globalAlpha = onCd ? 0.4 : 0.9;
  ctx.lineWidth = 2;

  switch (key) {
    case 'Q': {
      // Bullet shape
      ctx.beginPath();
      ctx.ellipse(cx, cy, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy);
      ctx.lineTo(cx + 15, cy);
      ctx.stroke();
      break;
    }
    case 'W': {
      // Beam/lightning bolt
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 14);
      ctx.lineTo(cx + 2, cy - 2);
      ctx.lineTo(cx - 4, cy);
      ctx.lineTo(cx + 10, cy + 14);
      ctx.stroke();
      break;
    }
    case 'E': {
      // Diamond trap
      ctx.beginPath();
      ctx.moveTo(cx, cy - 14);
      ctx.lineTo(cx + 12, cy);
      ctx.lineTo(cx, cy + 14);
      ctx.lineTo(cx - 12, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'R': {
      // Cross/target sight
      const pulse = !onCd ? 0.5 + Math.sin(frame * 0.05) * 0.3 : 0;
      ctx.globalAlpha = onCd ? 0.4 : 0.7 + pulse * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy);
      ctx.lineTo(cx + 16, cy);
      ctx.moveTo(cx, cy - 16);
      ctx.lineTo(cx, cy + 16);
      ctx.stroke();
      break;
    }
  }

  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Boss HP Bar (top-center)
// ─────────────────────────────────────────────────────────────────────────────
function drawBossHPBar(ctx, enemy, frame) {
  const barW = 500;
  const barH = 18;
  const bx = (LOGICAL_W - barW) / 2;
  const by = 18;

  const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
  const hpColor = hpRatio > 0.6 ? '#CC2222' : hpRatio > 0.3 ? '#CC7700' : '#FF2200';

  // Background panel
  ctx.fillStyle = 'rgba(2,4,12,0.88)';
  ctx.fillRect(bx - 10, by - 6, barW + 20, barH + 30);
  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx - 10, by - 6, barW + 20, barH + 30);

  // LoL corner brackets
  const bracketSize = 8;
  ctx.strokeStyle = '#F0E6A0';
  ctx.lineWidth = 2;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(bx - 10, by - 6 + bracketSize);
  ctx.lineTo(bx - 10, by - 6);
  ctx.lineTo(bx - 10 + bracketSize, by - 6);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(bx + barW + 10 - bracketSize, by - 6);
  ctx.lineTo(bx + barW + 10, by - 6);
  ctx.lineTo(bx + barW + 10, by - 6 + bracketSize);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(bx - 10, by + barH + 24 - bracketSize);
  ctx.lineTo(bx - 10, by + barH + 24);
  ctx.lineTo(bx - 10 + bracketSize, by + barH + 24);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(bx + barW + 10 - bracketSize, by + barH + 24);
  ctx.lineTo(bx + barW + 10, by + barH + 24);
  ctx.lineTo(bx + barW + 10, by + barH + 24 - bracketSize);
  ctx.stroke();

  // HP bar background
  ctx.fillStyle = '#0A0808';
  ctx.fillRect(bx, by, barW, barH);

  // HP bar fill
  const hpGrad = ctx.createLinearGradient(bx, by, bx, by + barH);
  hpGrad.addColorStop(0, hpColor);
  hpGrad.addColorStop(1, '#880000');
  ctx.fillStyle = hpGrad;
  ctx.fillRect(bx, by, barW * hpRatio, barH);

  // Tick marks
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  for (let t = 1; t < 10; t++) {
    const tx = bx + (barW * t) / 10;
    ctx.beginPath();
    ctx.moveTo(tx, by);
    ctx.lineTo(tx, by + barH);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx, by, barW, barH);

  // Enemy name
  ctx.fillStyle = '#F0E6A0';
  ctx.font = '11px "Cinzel"';
  ctx.textAlign = 'center';
  ctx.fillText(enemy.name.toUpperCase(), LOGICAL_W / 2, by + barH + 18);
  ctx.textAlign = 'left';

  // HP text
  ctx.fillStyle = '#CCC';
  ctx.font = '9px "Share Tech Mono"';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(enemy.hp)} / ${enemy.maxHp}`, bx + barW, by + barH - 4);
  ctx.textAlign = 'left';
  ctx.lineWidth = 1;

  // Shield HP for enemy 5
  if (enemy.id === 5 && enemy.shieldActive) {
    ctx.fillStyle = '#88CCFF';
    ctx.font = '9px "Share Tech Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(`SHIELD: ${Math.max(0, enemy.shieldHp)} HP`, LOGICAL_W / 2, by + barH + 28);
    ctx.textAlign = 'left';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Kill Feed (top-right)
// ─────────────────────────────────────────────────────────────────────────────
function drawKillFeed(ctx, killFeed) {
  const kx = LOGICAL_W - 260;
  const ky = 70;

  for (let i = 0; i < killFeed.length; i++) {
    const entry = killFeed[i];
    const age = entry.age || 0;
    const alpha = Math.max(0, 1 - age / 180);
    if (alpha <= 0) continue;

    ctx.globalAlpha = alpha;

    const ey = ky + i * 24;

    // Background
    ctx.fillStyle = 'rgba(2,4,12,0.8)';
    ctx.fillRect(kx, ey, 250, 20);

    // Gold left accent
    ctx.fillStyle = '#C89B3C';
    ctx.fillRect(kx, ey, 3, 20);

    // Text
    ctx.fillStyle = '#F0E6A0';
    ctx.font = '9px "Share Tech Mono"';
    ctx.fillText(`JHIN slew ${entry.name}`, kx + 10, ey + 13);

    ctx.globalAlpha = 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Minimap (bottom-right)
// ─────────────────────────────────────────────────────────────────────────────
function drawMinimap(ctx, player, currentEnemy) {
  const mx = LOGICAL_W - 120;
  const my = LOGICAL_H - 120;
  const mw = 108;
  const mh = 95;

  // Panel
  ctx.fillStyle = 'rgba(2,4,12,0.88)';
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mx, my, mw, mh);

  // Title
  ctx.fillStyle = '#C89B3C';
  ctx.font = '7px "Cinzel"';
  ctx.textAlign = 'center';
  ctx.fillText('SUMMONER\'S RIFT', mx + mw / 2, my + 9);
  ctx.textAlign = 'left';

  // Simple lane
  ctx.strokeStyle = 'rgba(100,150,200,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx + 8, my + mh - 12);
  ctx.lineTo(mx + mw - 8, my + 20);
  ctx.stroke();

  // Player dot (gold)
  const px = mx + (player.x / LOGICAL_W) * mw;
  const py = my + 12 + ((player.y - 100) / (GROUND_Y - 100)) * (mh - 22);
  ctx.fillStyle = '#F0E6A0';
  ctx.shadowColor = '#C89B3C';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(Math.max(mx + 4, Math.min(mx + mw - 4, px)), Math.max(my + 12, Math.min(my + mh - 6, py)), 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Enemy dot (red)
  if (currentEnemy && !currentEnemy.dead) {
    const ex = mx + (currentEnemy.x / LOGICAL_W) * mw;
    const ey = my + 12 + ((currentEnemy.y - 100) / (GROUND_Y - 100)) * (mh - 22);
    ctx.fillStyle = '#CC2222';
    ctx.shadowColor = '#CC2222';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(Math.max(mx + 4, Math.min(mx + mw - 4, ex)), Math.max(my + 12, Math.min(my + mh - 6, ey)), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.lineWidth = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// R Charge Bar
// ─────────────────────────────────────────────────────────────────────────────
function drawRChargeBar(ctx, player) {
  const barW = 200;
  const barH = 16;
  const bx = (LOGICAL_W - barW) / 2;
  const by = LOGICAL_H - 100;
  const ratio = Math.min(1, player.rChargeTimer / 120);

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);

  const grad = ctx.createLinearGradient(bx, by, bx + barW, by);
  grad.addColorStop(0, '#880000');
  grad.addColorStop(1, '#FF4444');
  ctx.fillStyle = grad;
  ctx.fillRect(bx, by, barW * ratio, barH);

  ctx.strokeStyle = '#CC2222';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, barW, barH);

  ctx.fillStyle = '#FF8888';
  ctx.font = '10px "Share Tech Mono"';
  ctx.textAlign = 'center';
  ctx.fillText('CURTAIN CALL — HOLD R', LOGICAL_W / 2, by - 4);
  ctx.textAlign = 'left';
  ctx.lineWidth = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function drawCornerOrnaments(ctx, x, y, w, h, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + size);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + w - size, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + size);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x + size, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h - size);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + w - size, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - size);
  ctx.stroke();

  ctx.lineWidth = 1;
}
