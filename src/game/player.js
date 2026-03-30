import { LOGICAL_W, GROUND_Y } from './constants.js';
import { spawnDamageNumber, spawnTrapExplosion } from './particles.js';

export function createPlayer() {
  return {
    x: 200,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    speed: 3.5,
    facing: 1, // 1 = right, -1 = left

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

    // W stun beam active
    wBeamActive: false,
    wBeamTimer: 0,

    // Movement
    moveTarget: null,
    attackTarget: false,

    // Walk animation
    walkFrame: 0,

    // Traps on ground
    traps: [],

    // Active projectiles
    projectiles: [],

    // Beam targets enemy x/y
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
  };
}

export function updatePlayer(player, keys, currentEnemy, ps, onMuzzleFlash, onHitSparks) {
  // Speed buff
  if (player.speedBuffTimer > 0) {
    player.speedBuffTimer--;
    if (player.speedBuffTimer === 0) player.speedBuff = 0;
  }
  const effectiveSpeed = player.speed + player.speedBuff;

  // Walk animation
  if (Math.abs(player.vx) > 0.1) {
    player.walkFrame += 0.15;
  } else {
    player.walkFrame *= 0.85;
  }

  // Keyboard movement (overrides click-to-move)
  let keyMoving = false;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
    player.vx = -effectiveSpeed;
    player.facing = -1;
    player.moveTarget = null;
    keyMoving = true;
  } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
    player.vx = effectiveSpeed;
    player.facing = 1;
    player.moveTarget = null;
    keyMoving = true;
  } else if (!keyMoving && player.moveTarget === null) {
    player.vx *= 0.7;
  }

  // Click-to-move
  if (player.moveTarget !== null) {
    const dx = player.moveTarget - player.x;
    if (Math.abs(dx) > 5) {
      player.vx = Math.sign(dx) * effectiveSpeed;
      player.facing = Math.sign(dx);
    } else {
      player.vx = 0;
      player.moveTarget = null;
    }
  }

  player.x += player.vx;
  player.x = Math.max(30, Math.min(LOGICAL_W - 30, player.x));
  player.y = GROUND_Y;

  // Reload
  if (player.reloading) {
    player.reloadTimer++;
    if (player.reloadTimer >= player.reloadDuration) {
      player.bullets = player.maxBullets;
      player.reloading = false;
      player.reloadTimer = 0;
    }
  }

  // Cooldowns
  if (player.wCooldown > 0) player.wCooldown--;
  if (player.eCooldown > 0) player.eCooldown--;
  if (player.rCooldown > 0) player.rCooldown--;

  // W beam duration
  if (player.wBeamActive) {
    player.wBeamTimer--;
    if (player.wBeamTimer <= 0) {
      player.wBeamActive = false;
      player.beamTarget = null;
    }
  }

  // Iframes
  if (player.iFrames > 0) player.iFrames--;
  if (player.hitFlash > 0) player.hitFlash--;

  // Update player projectiles
  for (let i = player.projectiles.length - 1; i >= 0; i--) {
    const proj = player.projectiles[i];
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.life--;

    // Hit enemy
    if (currentEnemy && !currentEnemy.dead) {
      const dx = proj.x - currentEnemy.x;
      const dy = proj.y - (currentEnemy.y - 80);
      if (Math.abs(dx) < 50 && Math.abs(dy) < 80) {
        const dmg = proj.isCrit ? 55 : 25;
        applyDamageToEnemy(currentEnemy, dmg, ps, proj.x, proj.y, proj.isCrit ? 'crit' : 'normal');
        onHitSparks(proj.x, proj.y, proj.isCrit ? '#C89B3C' : '#AAFFAA');
        player.totalDamageDealt += dmg;
        if (proj.isCrit) player.critHits++;
        player.projectiles.splice(i, 1);
        continue;
      }
    }

    if (proj.life <= 0 || proj.x > LOGICAL_W + 50 || proj.x < -50) {
      player.projectiles.splice(i, 1);
    }
  }

  // Update traps
  for (let i = player.traps.length - 1; i >= 0; i--) {
    const trap = player.traps[i];
    trap.life--;

    if (currentEnemy && !currentEnemy.dead) {
      const dx = trap.x - currentEnemy.x;
      const dy = trap.y - currentEnemy.y;
      if (Math.abs(dx) < 60 && Math.abs(dy) < 40) {
        applyDamageToEnemy(currentEnemy, 45, ps, trap.x, trap.y - 30, 'normal');
        player.totalDamageDealt += 45;
        spawnTrapExplosion(ps, trap.x, trap.y);
        player.traps.splice(i, 1);
        continue;
      }
    }

    if (trap.life <= 0) player.traps.splice(i, 1);
  }
}

export function applyDamageToEnemy(enemy, dmg, ps, x, y, type) {
  if (enemy.dead) return;

  // Shield check for enemy 5
  if (enemy.id === 5 && enemy.shieldActive && enemy.shieldHp > 0) {
    enemy.shieldHp -= dmg;
    if (enemy.shieldHp <= 0) {
      enemy.shieldActive = false;
    }
    spawnDamageNumber(ps, x, y - 20, 'BLOCKED', 'beam');
    return;
  }

  enemy.hp = Math.max(0, enemy.hp - dmg);
  spawnDamageNumber(ps, x, y - 20, dmg, type);

  if (enemy.hp <= 0) {
    enemy.dead = true;
    enemy.deathTimer = 0;
  }
}

export function fireQAbility(player) {
  if (player.reloading || player.bullets <= 0) return false;

  const isCrit = player.bullets === 1; // 4th shot (last bullet) = crit

  const angle = -0.05 + (Math.random() - 0.5) * 0.04;
  const speed = 12;

  player.projectiles.push({
    x: player.x + player.facing * 40,
    y: player.y - 80,
    vx: player.facing * speed * Math.cos(angle),
    vy: speed * Math.sin(angle),
    isCrit,
    life: 80,
  });

  player.shots++;
  player.bullets--;
  if (player.bullets <= 0) {
    player.reloading = true;
    player.reloadTimer = 0;
  }
  return true;
}

export function fireWAbility(player, enemy) {
  if (player.wCooldown > 0 || !enemy || enemy.dead) return false;
  player.wCooldown = player.wMaxCooldown;
  player.wBeamActive = true;
  player.wBeamTimer = 30;
  player.beamTarget = { x: enemy.x, y: enemy.y - 80 };
  enemy.stunned = true;
  enemy.stunTimer = 150; // 2.5s at 60fps
  return true;
}

export function fireEAbility(player) {
  if (player.eCooldown > 0) return false;
  player.eCooldown = player.eMaxCooldown;
  // Place trap near player (slightly ahead)
  player.traps.push({
    x: player.x + player.facing * 80,
    y: GROUND_Y,
    life: 600, // 10 seconds
    armTimer: 30,
  });
  return true;
}

export function startRCharge(player) {
  if (player.rCooldown > 0) return false;
  player.rCharging = true;
  player.rChargeTimer = 0;
  return true;
}

export function releaseRAbility(player, enemy, ps) {
  if (!player.rCharging) return false;
  player.rCharging = false;
  const chargeRatio = Math.min(1, player.rChargeTimer / 120);
  const damage = Math.floor(100 + chargeRatio * 100);
  player.rCooldown = player.rMaxCooldown;

  if (enemy && !enemy.dead) {
    applyDamageToEnemy(enemy, damage, ps, enemy.x, enemy.y - 80, 'crit');
    player.totalDamageDealt += damage;
    enemy.stunned = true;
    enemy.stunTimer = 60;
  }

  // Spawn ultimate beam effect
  player.projectiles.push({
    x: player.x + player.facing * 40,
    y: player.y - 80,
    vx: player.facing * 18,
    vy: 0,
    isCrit: true,
    isUltimate: true,
    life: 60,
  });

  return damage;
}
