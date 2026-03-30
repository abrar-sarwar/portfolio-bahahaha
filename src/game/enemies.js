import { LOGICAL_W, GROUND_Y, ENEMY_DATA } from './constants.js';
import { spawnDamageNumber, spawnHitSparks } from './particles.js';

export function createEnemy(index) {
  const data = ENEMY_DATA[index];
  const enemy = {
    ...data,
    index,
    hp: data.maxHp,
    x: 1050,
    y: GROUND_Y,
    vx: 0,
    facing: -1,
    dead: false,
    deathTimer: 0,
    deathDuration: 60,
    attackTimer: 0,
    projectiles: [],
    stunned: false,
    stunTimer: 0,
    walkFrame: 0,
    phase: 0,
    phaseTimer: 0,

    // Enemy 2 phantom clones
    clones: [],
    cloneTimer: 0,

    // Enemy 5 shield
    shieldActive: index === 4,
    shieldHp: 80,

    // Enemy 4 hydra attack pattern
    hydraPattern: 0,
    hydraPatternTimer: 0,

    // Enemy 3 golem slam
    slamActive: false,
    slamX: 0,

    // General animation frames
    frame: 0,
    animTimer: 0,
  };

  // Enemy 2: spawn initial clones
  if (index === 1) {
    spawnPhantomClones(enemy);
  }

  return enemy;
}

function spawnPhantomClones(enemy) {
  enemy.clones = [
    { x: enemy.x - 80, y: enemy.y, isReal: false, alpha: 0.4 },
    { x: enemy.x + 80, y: enemy.y, isReal: false, alpha: 0.4 },
  ];
}

export function updateEnemy(enemy, player, ps, gameFrame) {
  if (enemy.dead) {
    enemy.deathTimer++;
    return;
  }

  enemy.animTimer++;
  enemy.frame = Math.floor(enemy.animTimer / 8) % 4;

  // Stun
  if (enemy.stunned) {
    enemy.stunTimer--;
    if (enemy.stunTimer <= 0) enemy.stunned = false;
    // Even when stunned, projectiles keep moving
    updateEnemyProjectiles(enemy, player, ps);
    return;
  }

  enemy.attackTimer++;

  // Update walk
  if (Math.abs(enemy.vx) > 0.1) enemy.walkFrame += 0.1;
  else enemy.walkFrame *= 0.9;

  // Per-enemy AI
  switch (enemy.index) {
    case 0: updateScriptKiddie(enemy, player, ps); break;
    case 1: updatePhantomThreat(enemy, player, ps, gameFrame); break;
    case 2: updateRiskGolem(enemy, player, ps); break;
    case 3: updateFirewallHydra(enemy, player, ps, gameFrame); break;
    case 4: updateFinalAudit(enemy, player, ps, gameFrame); break;
  }

  // Move
  enemy.x += enemy.vx;
  enemy.x = Math.max(600, Math.min(LOGICAL_W - 60, enemy.x));
  enemy.y = GROUND_Y;
  enemy.facing = player.x < enemy.x ? -1 : 1;

  updateEnemyProjectiles(enemy, player, ps);
}

function updateScriptKiddie(enemy, player, ps) {
  // Slow patrol
  enemy.vx = Math.sin(enemy.animTimer * 0.01) * 0.6;

  if (enemy.attackTimer >= enemy.attackInterval) {
    enemy.attackTimer = 0;
    // Fire slow green projectile
    const dx = player.x - enemy.x;
    const dy = (player.y - 80) - (enemy.y - 80);
    const dist = Math.sqrt(dx * dx + dy * dy);
    enemy.projectiles.push({
      x: enemy.x - 30,
      y: enemy.y - 60,
      vx: (dx / dist) * enemy.projectileSpeed,
      vy: (dy / dist) * enemy.projectileSpeed,
      damage: 18,
      color: '#22FF44',
      size: 8,
      life: 120,
      type: 'normal',
    });
  }
}

function updatePhantomThreat(enemy, player, ps, frame) {
  // Teleport occasionally
  enemy.cloneTimer++;
  if (enemy.cloneTimer > 200) {
    enemy.cloneTimer = 0;
    // Randomly reposition
    enemy.x = 700 + Math.random() * 400;
    spawnPhantomClones(enemy);
  }

  // Fast directional movement
  const targetX = enemy.x + Math.sin(frame * 0.02) * 2;
  enemy.vx = (targetX - enemy.x) * 0.5;

  if (enemy.attackTimer >= enemy.attackInterval) {
    enemy.attackTimer = 0;
    // Fast homing shot
    const dx = player.x - enemy.x;
    const dy = (player.y - 80) - (enemy.y - 80);
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    enemy.projectiles.push({
      x: enemy.x - 30,
      y: enemy.y - 80,
      vx: (dx / dist) * enemy.projectileSpeed,
      vy: (dy / dist) * enemy.projectileSpeed,
      damage: 22,
      color: '#CC44FF',
      size: 7,
      life: 100,
      type: 'normal',
    });
  }
}

function updateRiskGolem(enemy, player, ps) {
  // Slow charge toward player
  const dx = player.x - enemy.x;
  enemy.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.005, enemy.speed);

  if (enemy.attackTimer >= enemy.attackInterval) {
    enemy.attackTimer = 0;
    // Ground slam: spawns shockwave projectile along ground
    enemy.slamActive = true;
    enemy.slamX = enemy.x;
    enemy.projectiles.push({
      x: enemy.x - 30,
      y: GROUND_Y - 20,
      vx: -4,
      vy: 0,
      damage: 30,
      color: '#AA8822',
      size: 15,
      life: 80,
      type: 'slam',
      hitPlayer: false,
    });
  }
}

function updateFirewallHydra(enemy, player, ps, frame) {
  enemy.hydraPatternTimer++;
  if (enemy.hydraPatternTimer > 300) {
    enemy.hydraPatternTimer = 0;
    enemy.hydraPattern = (enemy.hydraPattern + 1) % 3;
  }

  // Different movement per pattern
  if (enemy.hydraPattern === 0) {
    enemy.vx = Math.sin(frame * 0.02) * 1.5;
  } else if (enemy.hydraPattern === 1) {
    const dx = player.x + 200 - enemy.x;
    enemy.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.01, 1.2);
  } else {
    enemy.vx = 0;
  }

  if (enemy.attackTimer >= enemy.attackInterval) {
    enemy.attackTimer = 0;
    // Different attack per pattern
    if (enemy.hydraPattern === 0) {
      // Rapid small shots
      for (let i = 0; i < 3; i++) {
        const spread = (i - 1) * 0.2;
        const dx = player.x - enemy.x;
        const dy = (player.y - 80) - (enemy.y - 80);
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        enemy.projectiles.push({
          x: enemy.x - 40,
          y: enemy.y - 100 + i * 30,
          vx: (dx / dist) * 6 - Math.sin(spread) * 2,
          vy: (dy / dist) * 6 + Math.cos(spread) * 2,
          damage: 15,
          color: '#FF4400',
          size: 6,
          life: 90,
          type: 'normal',
        });
      }
    } else if (enemy.hydraPattern === 1) {
      // Blue ice shard
      enemy.projectiles.push({
        x: enemy.x - 40,
        y: enemy.y - 80,
        vx: (player.x - enemy.x) / 40,
        vy: (player.y - 80 - (enemy.y - 80)) / 40,
        damage: 25,
        color: '#4488FF',
        size: 12,
        life: 100,
        type: 'normal',
      });
    } else {
      // Fire breath arc
      for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 - 0.5 + i * 0.25;
        enemy.projectiles.push({
          x: enemy.x - 20,
          y: enemy.y - 120,
          vx: Math.cos(angle) * 5,
          vy: Math.sin(angle) * 5,
          damage: 20,
          color: '#FF6600',
          size: 8,
          life: 60,
          type: 'normal',
        });
      }
    }
  }
}

function updateFinalAudit(enemy, player, ps, frame) {
  // Menacing approach
  const dx = player.x - enemy.x;
  enemy.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.006, enemy.speed);

  if (enemy.attackTimer >= enemy.attackInterval) {
    enemy.attackTimer = 0;

    // "Insufficient Experience" beam
    enemy.projectiles.push({
      x: enemy.x - 30,
      y: enemy.y - 100,
      vx: (player.x - enemy.x) / 25,
      vy: ((player.y - 80) - (enemy.y - 100)) / 25,
      damage: 35,
      color: '#8800AA',
      size: 14,
      life: 50,
      type: 'beam',
      isAuditBeam: true,
    });

    // Add a standard shot too
    if (frame % 200 < 100) {
      const ddx = player.x - enemy.x;
      const ddy = (player.y - 80) - (enemy.y - 80);
      const dist = Math.max(1, Math.sqrt(ddx * ddx + ddy * ddy));
      enemy.projectiles.push({
        x: enemy.x - 40,
        y: enemy.y - 80,
        vx: (ddx / dist) * 4,
        vy: (ddy / dist) * 4,
        damage: 20,
        color: '#AA00CC',
        size: 9,
        life: 120,
        type: 'normal',
      });
    }
  }
}

function updateEnemyProjectiles(enemy, player, ps) {
  for (let i = enemy.projectiles.length - 1; i >= 0; i--) {
    const proj = enemy.projectiles[i];
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.life--;

    // Check player hit
    if (!proj.hitPlayer && player.iFrames <= 0) {
      const dx = proj.x - player.x;
      const dy = proj.y - (player.y - 70);
      const hitRadius = proj.type === 'slam' ? 40 : 25;
      if (Math.abs(dx) < hitRadius && Math.abs(dy) < hitRadius) {
        player.health -= proj.damage;
        player.iFrames = 30;
        player.hitFlash = 10;
        spawnDamageNumber(ps, player.x, player.y - 100, proj.damage, 'player');
        spawnHitSparks(ps, player.x, player.y - 70, '#FF4444');
        proj.hitPlayer = true;
        enemy.projectiles.splice(i, 1);
        continue;
      }
    }

    if (proj.life <= 0) enemy.projectiles.splice(i, 1);
  }
}
