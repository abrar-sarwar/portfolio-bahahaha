import { MAP_W, MAP_H, ENEMY_DATA } from './constants.js';

const ENEMY_START_POSITIONS = [
  { x: MAP_W * 0.75, y: MAP_H * 0.5 },    // center right
  { x: MAP_W * 0.8,  y: MAP_H * 0.3 },    // top right
  { x: MAP_W * 0.7,  y: MAP_H * 0.7 },    // bottom right
  { x: MAP_W * 0.85, y: MAP_H * 0.5 },    // far right
  { x: MAP_W * 0.75, y: MAP_H * 0.45 },   // center right (final boss)
];

export function createEnemy(index) {
  const data = ENEMY_DATA[index];
  const pos = ENEMY_START_POSITIONS[index] || { x: MAP_W * 0.75, y: MAP_H * 0.5 };
  return {
    ...data,
    index,
    x: pos.x,
    y: pos.y,
    hp: data.maxHp,
    vx: 0,
    vy: 0,
    radius: 35,
    facing: Math.PI, // faces left initially
    dead: false,
    deathTimer: 0,
    deathDuration: 60,
    attackTimer: 0,
    stunned: false,
    stunTimer: 0,
    projectiles: [],
    walkFrame: 0,
    aggroRange: 600,
    attackRange: 350,
    isChasing: false,

    // Enemy 2 (Phantom) specific
    clones: [],
    teleportTimer: 0,

    // Enemy 5 (Final Audit) specific
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
        dmg: 18, life: 60, r: 10,
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
        dmg: 15, life: 70, r: 8,
        color: '#FF4400',
      });
    }
    return;
  }

  // Default: single shot toward player
  if (dist > 0) {
    const dmg = enemy.index === 4 ? 25 : 12;
    const col = enemy.index === 4 ? '#8800AA' : (enemy.index === 1 ? '#CC44FF' : '#22FF44');
    enemy.projectiles.push({
      x: enemy.x, y: enemy.y,
      vx: (dx / dist) * speed, vy: (dy / dist) * speed,
      dmg, life: 80, r: 8,
      color: col,
    });
  }
}
