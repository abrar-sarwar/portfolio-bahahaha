import { MAP_W, MAP_H, ENEMY_DATA } from './constants.js';

export function createEnemy(index) {
  const data = ENEMY_DATA[index];
  // Spawn at random edge position, opposite side from player
  const spawnAngles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI];
  const spawnAngle = spawnAngles[index % spawnAngles.length] + Math.PI; // opposite side
  const spawnR = MAP_W * 0.44;
  const cx = MAP_W/2, cy = MAP_H/2;

  return {
    ...data,
    index,
    x: cx + Math.cos(spawnAngle) * spawnR,
    y: cy + Math.sin(spawnAngle) * spawnR,
    hp: data.maxHp,
    vx: 0,
    vy: 0,
    radius: index === 2 ? 40 : 30,  // Risk Golem bigger
    facing: Math.PI,
    dead: false,
    deathTimer: 0,
    deathDuration: 80,
    attackTimer: 0,
    stunned: false,
    stunTimer: 0,
    projectiles: [],
    walkFrame: 0,
    aggroRange: MAP_W * 0.6,  // Large range — enemy almost always sees you
    attackRange: 300 + index * 20,
    isChasing: true,  // Start chasing immediately
    spawnTimer: 90,   // Spawn animation frames

    // Enemy-specific
    clones: index === 1 ? [
      { x: cx + Math.cos(spawnAngle + 1.2) * spawnR * 0.7, y: cy + Math.sin(spawnAngle + 1.2) * spawnR * 0.7 },
      { x: cx + Math.cos(spawnAngle - 1.2) * spawnR * 0.7, y: cy + Math.sin(spawnAngle - 1.2) * spawnR * 0.7 },
    ] : [],
    teleportTimer: 0,
    shieldActive: index === 4,
    shieldHits: 0,
    shieldHp: 80,
    phase: index + 1,
    animTimer: 0,
  };
}

export function updateEnemy(enemy, player, ps, frame) {
  if (enemy.dead) {
    enemy.deathTimer++;
    return;
  }

  // Handle spawn animation
  if (enemy.spawnTimer > 0) {
    enemy.spawnTimer--;
    // Slowly move toward center during spawn
    const scx = MAP_W/2, scy = MAP_H/2;
    const sdx = scx - enemy.x, sdy = scy - enemy.y;
    const sd = Math.hypot(sdx, sdy);
    if (sd > 0) {
      enemy.x += (sdx/sd) * enemy.speed * 0.5;
      enemy.y += (sdy/sd) * enemy.speed * 0.5;
    }
    return; // no attacks during spawn
  }

  enemy.attackTimer++;
  enemy.animTimer++;
  enemy.walkFrame += 0.08;

  // Stun
  if (enemy.stunned) {
    enemy.stunTimer--;
    if (enemy.stunTimer <= 0) enemy.stunned = false;
    // Update projectiles even when stunned
    for (const p of enemy.projectiles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    }
    enemy.projectiles = enemy.projectiles.filter(p => p.life > 0);
    return;
  }

  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distToPlayer = Math.sqrt(dx * dx + dy * dy);

  // Aggro: start chasing when player is close
  if (distToPlayer < enemy.aggroRange) enemy.isChasing = true;

  // Face player
  enemy.facing = Math.atan2(dy, dx);

  if (enemy.isChasing) {
    if (distToPlayer > enemy.attackRange) {
      // Chase player
      enemy.vx = (dx / distToPlayer) * enemy.speed;
      enemy.vy = (dy / distToPlayer) * enemy.speed;
    } else {
      // In attack range — stop and attack
      enemy.vx *= 0.7;
      enemy.vy *= 0.7;

      if (enemy.attackTimer >= enemy.attackInterval) {
        enemy.attackTimer = 0;
        fireEnemyAttack(enemy, player, ps);
      }
    }
  }

  // Apply velocity
  enemy.x += enemy.vx;
  enemy.y += enemy.vy;

  // Keep in map bounds
  enemy.x = Math.max(50, Math.min(MAP_W - 50, enemy.x));
  enemy.y = Math.max(50, Math.min(MAP_H - 50, enemy.y));

  // Update enemy projectiles
  for (const p of enemy.projectiles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  }
  enemy.projectiles = enemy.projectiles.filter(p => p.life > 0);

  // Enemy 2: teleport mechanic
  if (enemy.index === 1 && enemy.isChasing) {
    enemy.teleportTimer++;
    if (enemy.teleportTimer > 300) {
      enemy.teleportTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 200;
      enemy.x = Math.max(50, Math.min(MAP_W - 50, player.x + Math.cos(angle) * dist));
      enemy.y = Math.max(50, Math.min(MAP_H - 50, player.y + Math.sin(angle) * dist));
      enemy.clones = [
        { x: enemy.x + (Math.random() - 0.5) * 300, y: enemy.y + (Math.random() - 0.5) * 300 },
        { x: enemy.x + (Math.random() - 0.5) * 300, y: enemy.y + (Math.random() - 0.5) * 300 },
      ];
    }
  }
}

function fireEnemyAttack(enemy, player, ps) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const speed = enemy.projectileSpeed;

  // Enemy 3 (Risk Golem): ground slam — radial projectiles
  if (enemy.index === 2) {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      enemy.projectiles.push({
        x: enemy.x, y: enemy.y,
        vx: Math.cos(a) * 3, vy: Math.sin(a) * 3,
        dmg: 16, life: 60, r: 10,
        color: '#AA8822',
      });
    }
    return;
  }

  // Enemy 4 (Hydra): triple shot spread
  if (enemy.index === 3) {
    for (let i = -1; i <= 1; i++) {
      const a = Math.atan2(dy, dx) + i * 0.3;
      enemy.projectiles.push({
        x: enemy.x, y: enemy.y,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        dmg: 14, life: 70, r: 8,
        color: '#FF4400',
      });
    }
    return;
  }

  // Default: single shot toward player
  if (dist > 0) {
    const dmg = enemy.index === 4 ? 22 : enemy.index === 1 ? 16 : 12;
    const col = enemy.index === 4 ? '#8800AA' : (enemy.index === 1 ? '#CC44FF' : '#22FF44');
    enemy.projectiles.push({
      x: enemy.x, y: enemy.y,
      vx: (dx / dist) * speed, vy: (dy / dist) * speed,
      dmg, life: 80, r: 8,
      color: col,
    });
  }
}
