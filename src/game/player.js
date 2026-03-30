import { MAP_W, MAP_H } from './constants.js';
import { spawnTrapExplosion } from './particles.js';

export function createPlayer() {
  return {
    x: MAP_W * 0.2,
    y: MAP_H * 0.5,
    vx: 0,
    vy: 0,
    speed: 3.5,

    // facing is now an angle in radians
    facing: 0,

    health: 300,
    maxHealth: 300,

    // 4-shot mechanic
    bullets: 4,
    maxBullets: 4,
    reloading: false,
    reloadTimer: 0,
    reloadDuration: 120,

    // Ability cooldowns (in frames)
    wCooldown: 0,
    wMaxCooldown: 480,
    eCooldown: 0,
    eMaxCooldown: 600,
    rCooldown: 0,
    rMaxCooldown: 1200,

    // R charge state
    rCharging: false,
    rChargeTimer: 0,
    rMaxCharge: 120,

    // W stun beam active
    wBeamActive: false,
    wBeamTimer: 0,

    // Movement
    moveTarget: null,
    attackTarget: false,

    // Walk animation
    walkFrame: 0,

    // Traps on map
    traps: [],

    // Active projectiles
    projectiles: [],

    // Beam target
    beamTarget: null,

    // Speed buff from magician
    speedBuff: 0,
    speedBuffTimer: 0,

    // Stats
    totalDamageDealt: 0,
    critHits: 0,
    shots: 0,

    // Invincibility frames after hit
    iFrames: 0,

    // Flash when hit
    hitFlash: 0,

    // Radius for top-down collision
    radius: 22,

    // Muzzle flash timer
    lastShotFlash: 0,
  };
}

export function updatePlayer(player, keys, currentEnemy, ps, onMuzzleFlash, onHitSparks) {
  // Speed buff
  const spd = player.speed * (1 + player.speedBuff);

  // Keyboard movement (8-directional WASD)
  let kx = 0, ky = 0;
  if (keys['a'] || keys['A'] || keys['ArrowLeft']) kx -= 1;
  if (keys['d'] || keys['D'] || keys['ArrowRight']) kx += 1;
  if (keys['w'] || keys['W'] || keys['ArrowUp']) ky -= 1;
  if (keys['s'] || keys['S'] || keys['ArrowDown']) ky += 1;

  if (kx !== 0 || ky !== 0) {
    // Keyboard overrides click target
    player.moveTarget = null;
    const mag = Math.sqrt(kx * kx + ky * ky);
    player.vx = (kx / mag) * spd;
    player.vy = (ky / mag) * spd;
    player.facing = Math.atan2(ky, kx);
  } else if (player.moveTarget) {
    const dx = player.moveTarget.x - player.x;
    const dy = player.moveTarget.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 6) {
      player.vx = (dx / dist) * spd;
      player.vy = (dy / dist) * spd;
      player.facing = Math.atan2(dy, dx);
    } else {
      player.vx = 0;
      player.vy = 0;
      player.moveTarget = null;
    }
  } else {
    player.vx *= 0.8;
    player.vy *= 0.8;
  }

  // Apply velocity
  player.x += player.vx;
  player.y += player.vy;

  // Keep in map bounds
  player.x = Math.max(player.radius, Math.min(MAP_W - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(MAP_H - player.radius, player.y));

  // Arena boundary: circular arena (radius ~MAP_W*0.5)
  const arenaCX = MAP_W / 2, arenaCY = MAP_H / 2;
  const arenaR = MAP_W * 0.50;
  const dFromCenter = Math.hypot(player.x - arenaCX, player.y - arenaCY);
  if (dFromCenter > arenaR) {
    // Push back toward center
    const ang = Math.atan2(player.y - arenaCY, player.x - arenaCX);
    player.x = arenaCX + Math.cos(ang) * arenaR;
    player.y = arenaCY + Math.sin(ang) * arenaR;
    player.vx *= -0.3; player.vy *= -0.3;
    player.moveTarget = null;
  }

  // Walk frame animation
  const moving = Math.abs(player.vx) > 0.3 || Math.abs(player.vy) > 0.3;
  if (moving) player.walkFrame += 0.12;

  // Face enemy when idle
  if (!moving && currentEnemy && !currentEnemy.dead) {
    const dx = currentEnemy.x - player.x;
    const dy = currentEnemy.y - player.y;
    player.facing = Math.atan2(dy, dx);
  }

  // Cooldowns
  if (player.wCooldown > 0) player.wCooldown--;
  if (player.eCooldown > 0) player.eCooldown--;
  if (player.rCooldown > 0) player.rCooldown--;
  if (player.speedBuffTimer > 0) {
    player.speedBuffTimer--;
    if (!player.speedBuffTimer) player.speedBuff = 0;
  }
  if (player.hitFlash > 0) player.hitFlash--;
  if (player.iFrames > 0) player.iFrames--;
  if (player.lastShotFlash > 0) player.lastShotFlash--;

  // W beam duration
  if (player.wBeamActive) {
    player.wBeamTimer--;
    if (player.wBeamTimer <= 0) {
      player.wBeamActive = false;
      player.beamTarget = null;
    }
  }

  // Reload
  if (player.reloading) {
    player.reloadTimer++;
    if (player.reloadTimer >= player.reloadDuration) {
      player.reloading = false;
      player.reloadTimer = 0;
      player.bullets = player.maxBullets;
    }
  }

  // Update projectiles
  for (const p of player.projectiles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  }
  player.projectiles = player.projectiles.filter(p => p.life > 0);

  // Update traps — check for enemy proximity
  for (let i = player.traps.length - 1; i >= 0; i--) {
    const trap = player.traps[i];
    trap.life--;

    if (currentEnemy && !currentEnemy.dead) {
      const dx = trap.x - currentEnemy.x;
      const dy = trap.y - currentEnemy.y;
      if (Math.sqrt(dx * dx + dy * dy) < trap.r + currentEnemy.radius) {
        const dmg = 45;
        currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
        player.totalDamageDealt += dmg;
        spawnTrapExplosion(ps, trap.x, trap.y);
        if (currentEnemy.hp <= 0 && !currentEnemy.dead) {
          currentEnemy.dead = true;
          currentEnemy.deathTimer = 0;
        }
        player.traps.splice(i, 1);
        continue;
      }
    }

    if (trap.life <= 0) {
      player.traps.splice(i, 1);
    }
  }
}

export function fireQAbility(player) {
  if (player.reloading || player.bullets <= 0) return false;
  const isCrit = player.bullets === 1; // last bullet crits
  const dmg = isCrit ? 55 : 25;
  const speed = 9;
  player.projectiles.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(player.facing) * speed,
    vy: Math.sin(player.facing) * speed,
    dmg,
    isCrit,
    isR: false,
    life: 55,
    w: 10,
    h: 10,
  });
  player.bullets--;
  player.shots++;
  player.lastShotFlash = 5;
  if (isCrit) {
    player.critHits++;
    player.reloading = true;
    player.reloadTimer = 0;
  }
  if (player.bullets <= 0 && !player.reloading) {
    player.reloading = true;
    player.reloadTimer = 0;
  }
  return true;
}

export function fireWAbility(player, enemy) {
  if (player.wCooldown > 0 || !enemy || enemy.dead) return false;
  player.wBeamActive = true;
  player.wBeamTimer = 15;
  player.beamTarget = { x: enemy.x, y: enemy.y };
  player.wCooldown = player.wMaxCooldown;
  const dmg = 40;
  enemy.hp = Math.max(0, enemy.hp - dmg);
  enemy.stunned = true;
  enemy.stunTimer = 150;
  player.totalDamageDealt += dmg;
  if (enemy.hp <= 0 && !enemy.dead) {
    enemy.dead = true;
    enemy.deathTimer = 0;
  }
  return true;
}

export function fireEAbility(player) {
  if (player.eCooldown > 0) return false;
  player.traps.push({ x: player.x, y: player.y, r: 30, triggered: false, life: 600 });
  player.eCooldown = player.eMaxCooldown;
  return true;
}

export function startRCharge(player) {
  if (player.rCooldown > 0) return false;
  player.rCharging = true;
  player.rChargeTimer = 0;
  return true;
}

export function releaseRAbility(player, enemy, ps) {
  if (!player.rCharging) return 0;
  player.rCharging = false;
  if (player.rCooldown > 0) return 0;
  const chargeRatio = Math.min(1, player.rChargeTimer / player.rMaxCharge);
  const dmg = Math.floor(100 + chargeRatio * 150);
  const speed = 14;
  player.projectiles.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(player.facing) * speed,
    vy: Math.sin(player.facing) * speed,
    dmg,
    isCrit: false,
    isR: true,
    life: 80,
    w: 16,
    h: 16,
  });
  player.rCooldown = player.rMaxCooldown;
  player.rChargeTimer = 0;
  player.lastShotFlash = 8;
  return dmg;
}

// Keep for backward compat
export function applyDamageToEnemy(enemy, dmg, ps, x, y, type) {
  if (enemy.dead) return;
  enemy.hp = Math.max(0, enemy.hp - dmg);
  if (enemy.hp <= 0) {
    enemy.dead = true;
    enemy.deathTimer = 0;
  }
}
