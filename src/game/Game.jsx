import { useRef, useEffect, useCallback } from 'react';
import { LOGICAL_W, LOGICAL_H, MAP_W, MAP_H, STATES } from './constants.js';
import { createPlayer, updatePlayer, fireQAbility, fireWAbility, fireEAbility, startRCharge, releaseRAbility } from './player.js';
import { createEnemy, updateEnemy } from './enemies.js';
import {
  drawMap, drawJhin, drawPlayerProjectiles, drawWBeam,
  drawTraps, drawEnemyProjectiles, drawEnemy, drawMagician as _drawMagician,
} from './draw.js';
import { drawHUD } from './ui.js';
import {
  createParticleSystem, updateParticles, drawParticles,
  spawnClickRipple, spawnMuzzleFlash, spawnHitSparks, spawnBeamParticles,
  spawnDamageNumber,
} from './particles.js';

export default function Game({ onEnemyDead, onVictory, gameState }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // All mutable game state in refs (no re-renders)
  const frameRef = useRef(0);
  const playerRef = useRef(createPlayer());
  const enemyIndexRef = useRef(0);
  const currentEnemyRef = useRef(createEnemy(0));
  const psRef = useRef(createParticleSystem());
  const keysRef = useRef({});
  const gameStateRef = useRef(gameState);
  const killFeedRef = useRef([]);
  const magicianRef = useRef({ visible: false, x: LOGICAL_W + 100, slideTarget: 900, timer: 0 });
  const autoFireTimerRef = useRef(0);
  const cameraRef = useRef({ x: 0, y: 0 });

  // Keep gameState ref in sync
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Convert canvas event coords to map coords
  const getMapCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_W / rect.width;
    const scaleY = LOGICAL_H / rect.height;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    const cam = cameraRef.current;
    return {
      mx: screenX + cam.x,
      my: screenY + cam.y,
    };
  }, []);

  // ── Input handlers ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStateRef.current !== STATES.PLAYING) return;
      keysRef.current[e.key] = true;

      const player = playerRef.current;
      const enemy = currentEnemyRef.current;
      const ps = psRef.current;

      switch (e.key.toUpperCase()) {
        case 'Q':
          e.preventDefault();
          if (!player.reloading && player.bullets > 0) {
            if (fireQAbility(player)) {
              const mfx = player.x + Math.cos(player.facing) * 44;
              const mfy = player.y + Math.sin(player.facing) * 44;
              const cam = cameraRef.current;
              spawnMuzzleFlash(ps, mfx - cam.x, mfy - cam.y);
            }
          }
          break;
        case 'W':
          e.preventDefault();
          if (fireWAbility(player, enemy)) {
            const cam = cameraRef.current;
            spawnBeamParticles(
              ps,
              player.x - cam.x, player.y - cam.y,
              enemy.x - cam.x, enemy.y - cam.y
            );
            spawnDamageNumber(ps, enemy.x - cam.x, enemy.y - cam.y - 40, 'STUN!', 'beam');
          }
          break;
        case 'E':
          e.preventDefault();
          fireEAbility(player);
          break;
        case 'R':
          e.preventDefault();
          if (!player.rCharging) {
            startRCharge(player);
          }
          break;
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;

      if (e.key.toUpperCase() === 'R' && playerRef.current.rCharging) {
        const player = playerRef.current;
        const enemy = currentEnemyRef.current;
        const ps = psRef.current;
        const cam = cameraRef.current;
        const dmg = releaseRAbility(player, enemy, ps);
        if (dmg) {
          spawnMuzzleFlash(ps, player.x - cam.x, player.y - cam.y);
          if (enemy && !enemy.dead) {
            spawnHitSparks(ps, enemy.x - cam.x, enemy.y - cam.y, '#CC2222');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ── Canvas mouse events ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e) => {
      if (gameStateRef.current !== STATES.PLAYING) return;
      e.preventDefault();

      const { mx, my } = getMapCoords(e);
      const player = playerRef.current;
      const enemy = currentEnemyRef.current;
      const ps = psRef.current;
      const cam = cameraRef.current;

      const isOnEnemy = enemy && !enemy.dead &&
        Math.hypot(mx - enemy.x, my - enemy.y) < enemy.radius + 20;

      if (e.button === 0 || e.button === 2) {
        if (isOnEnemy) {
          // Move toward enemy
          player.moveTarget = {
            x: enemy.x - Math.cos(player.facing) * 80,
            y: enemy.y - Math.sin(player.facing) * 80,
          };
          player.attackTarget = true;
          player.facing = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          spawnClickRipple(ps, mx - cam.x, my - cam.y, '#FF4444');
        } else {
          player.moveTarget = { x: mx, y: my };
          player.attackTarget = false;
          spawnClickRipple(ps, mx - cam.x, my - cam.y, '#22FF55');
        }
      }
    };

    // Track mouse for facing direction
    const handleMouseMove = (e) => {
      if (gameStateRef.current !== STATES.PLAYING) return;
      const { mx, my } = getMapCoords(e);
      const player = playerRef.current;
      // Update facing toward mouse when not moving
      const moving = Math.abs(player.vx) > 0.3 || Math.abs(player.vy) > 0.3;
      if (!moving) {
        player.facing = Math.atan2(my - player.y, mx - player.x);
      }
    };

    const handleContextMenu = (e) => e.preventDefault();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('contextmenu', handleContextMenu);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [getMapCoords]);

  // ── Game loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const addKillFeed = (msg) => {
      killFeedRef.current.unshift({ name: msg, age: 0 });
    };

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const state = gameStateRef.current;
      if (state === STATES.VICTORY) return;

      frameRef.current++;
      const frame = frameRef.current;
      const player = playerRef.current;
      const enemy = currentEnemyRef.current;
      const ps = psRef.current;
      const cam = cameraRef.current;

      // ── Update ──────────────────────────────────────────────────────────────
      if (state === STATES.PLAYING) {
        // Update R charge timer
        if (player.rCharging) {
          player.rChargeTimer++;
        }

        // Auto-attack when reached attack target
        autoFireTimerRef.current++;
        if (player.attackTarget && player.moveTarget === null && autoFireTimerRef.current > 15) {
          autoFireTimerRef.current = 0;
          if (!player.reloading && player.bullets > 0 && enemy && !enemy.dead) {
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < 500) {
              if (fireQAbility(player)) {
                const mfx = player.x + Math.cos(player.facing) * 44;
                const mfy = player.y + Math.sin(player.facing) * 44;
                spawnMuzzleFlash(ps, mfx - cam.x, mfy - cam.y);
              }
            }
          }
        }

        updatePlayer(
          player,
          keysRef.current,
          enemy,
          ps,
          (x, y) => spawnMuzzleFlash(ps, x - cam.x, y - cam.y),
          (x, y, color) => spawnHitSparks(ps, x - cam.x, y - cam.y, color)
        );

        updateEnemy(enemy, player, ps, frame);

        // ── Collision: player projectiles vs enemy ───────────────────────────
        if (enemy && !enemy.dead) {
          for (const p of player.projectiles) {
            if (p.life <= 0) continue;
            const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            if (dist < enemy.radius + 8) {
              const shieldBlocked = enemy.index === 4 && enemy.shieldActive;
              if (shieldBlocked) {
                enemy.shieldHits++;
                if (enemy.shieldHits >= 4) {
                  enemy.shieldActive = false;
                  addKillFeed('SHIELD BROKEN!');
                }
                spawnDamageNumber(ps, p.x - cam.x, p.y - cam.y - 20, 'BLOCKED', 'beam');
              } else {
                enemy.hp = Math.max(0, enemy.hp - p.dmg);
                player.totalDamageDealt += p.dmg;
                if (p.isCrit) player.critHits++;
                spawnHitSparks(ps, p.x - cam.x, p.y - cam.y, p.isCrit ? '#FFD700' : '#C89B3C');
                spawnDamageNumber(ps, p.x - cam.x, p.y - cam.y - 20, p.dmg, p.isCrit ? 'crit' : 'normal');
              }
              p.life = 0;
              if (enemy.hp <= 0 && !enemy.dead) {
                enemy.dead = true;
                enemy.deathTimer = 0;
              }
            }
          }
        }

        // ── Collision: enemy projectiles vs player ───────────────────────────
        if (enemy) {
          for (const ep of enemy.projectiles) {
            if (ep.life <= 0) continue;
            const dist = Math.hypot(ep.x - player.x, ep.y - player.y);
            if (dist < player.radius + (ep.r || 8)) {
              if (player.iFrames <= 0) {
                player.health = Math.max(1, player.health - ep.dmg);
                player.hitFlash = 10;
                player.iFrames = 45;
                spawnDamageNumber(ps, player.x - cam.x, player.y - cam.y - 30, ep.dmg, 'player');
                spawnHitSparks(ps, player.x - cam.x, player.y - cam.y, '#FF4444');
              }
              ep.life = 0;
            }
          }
        }

        // ── Trap vs enemy collision (handled inside updatePlayer) ────────────

        // ── Magician NPC ─────────────────────────────────────────────────────
        const mag = magicianRef.current;
        if (mag.visible) {
          mag.timer++;
          if (mag.x > mag.slideTarget) {
            mag.x -= 5;
          }
          if (mag.timer > 300) {
            mag.x += 6;
            if (mag.x > LOGICAL_W + 100) {
              mag.visible = false;
            }
          }
        }

        // Kill feed aging
        for (const entry of killFeedRef.current) {
          entry.age = (entry.age || 0) + 1;
        }
        killFeedRef.current = killFeedRef.current.filter(e => (e.age || 0) < 200);

        // Check enemy death
        if (enemy.dead && enemy.deathTimer === 1) {
          const idx = enemyIndexRef.current;

          killFeedRef.current.unshift({ name: enemy.name, age: 0 });

          // Trigger magician after enemy 2
          if (idx === 1) {
            magicianRef.current = {
              visible: true,
              x: LOGICAL_W + 80,
              slideTarget: 900,
              timer: 0,
            };
            player.speedBuff = 1.5;
            player.speedBuffTimer = 600;
          }

          if (idx >= 4) {
            onVictory({ player, killFeed: killFeedRef.current });
          } else {
            onEnemyDead(idx, () => {
              const nextIdx = idx + 1;
              enemyIndexRef.current = nextIdx;
              currentEnemyRef.current = createEnemy(nextIdx);
            });
          }
        }

        // Player death — cap at 1
        if (player.health <= 0) {
          player.health = 1;
        }

        // ── Camera follows player ────────────────────────────────────────────
        const targetCamX = player.x - LOGICAL_W / 2;
        const targetCamY = player.y - LOGICAL_H / 2;
        cam.x += (targetCamX - cam.x) * 0.1;
        cam.y += (targetCamY - cam.y) * 0.1;
        cam.x = Math.max(0, Math.min(MAP_W - LOGICAL_W, cam.x));
        cam.y = Math.max(0, Math.min(MAP_H - LOGICAL_H, cam.y));
      }

      // Always update particles
      updateParticles(ps);

      // ── Draw ────────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

      // Top-down map
      drawMap(ctx, frame, cam);

      // Particles (screen space)
      drawParticles(ctx, ps);

      // Traps (map space -> screen via camera)
      drawTraps(ctx, player, frame, cam);

      // Enemy
      if (enemy) {
        drawEnemyProjectiles(ctx, enemy, cam);
        drawEnemy(ctx, enemy, frame, cam);
      }

      // Magician (screen space NPC)
      if (magicianRef.current.visible) {
        drawMagicianWithDialogue(ctx, magicianRef.current, frame);
      }

      // Player
      drawPlayerProjectiles(ctx, player, frame, cam);
      drawWBeam(ctx, player, cam);
      drawJhin(ctx, player, frame, cam);

      // HUD (always screen space)
      drawHUD(ctx, player, enemy && !enemy.dead ? enemy : null, killFeedRef.current, frame);

      // Speed buff indicator
      if (player.speedBuffTimer > 0) {
        ctx.fillStyle = '#C89B3C';
        ctx.globalAlpha = 0.7;
        ctx.font = '11px "Share Tech Mono"';
        ctx.textAlign = 'center';
        ctx.fillText('HASTE', LOGICAL_W / 2, LOGICAL_H - 20);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      }

      // Paused overlay
      if (state === STATES.REVEAL || state === STATES.MAGICIAN) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onEnemyDead, onVictory]);

  // ── Canvas scaling ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const aspect = LOGICAL_W / LOGICAL_H;
      let w = vw;
      let h = vw / aspect;
      if (h > vh) {
        h = vh;
        w = vh * aspect;
      }
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={LOGICAL_W}
      height={LOGICAL_H}
      style={{ display: 'block', cursor: 'crosshair' }}
    />
  );
}

function drawMagicianWithDialogue(ctx, magician, frame) {
  _drawMagician(ctx, magician, frame);

  if (magician.x <= 950) {
    const bx = magician.x - 200;
    const by = 180;
    ctx.fillStyle = 'rgba(2,4,12,0.92)';
    ctx.fillRect(bx, by, 260, 75);
    ctx.strokeStyle = '#C89B3C';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, 260, 75);

    ctx.fillStyle = '#C89B3C';
    ctx.font = '9px "Cinzel"';
    ctx.textAlign = 'center';
    ctx.fillText('THE MAGICIAN', bx + 130, by + 14);

    ctx.fillStyle = '#F0E6A0';
    ctx.font = '10px "Rajdhani"';
    const lines = [
      '"You seek the one who built',
      'CounterStack? He is closer',
      'than you think..."',
    ];
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], bx + 130, by + 30 + i * 14);
    }
    ctx.textAlign = 'left';
    ctx.lineWidth = 1;
  }
}
