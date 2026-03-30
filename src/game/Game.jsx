import { useRef, useEffect, useCallback } from 'react';
import { LOGICAL_W, LOGICAL_H, GROUND_Y, STATES } from './constants.js';
import { createPlayer, updatePlayer, fireQAbility, fireWAbility, fireEAbility, startRCharge, releaseRAbility } from './player.js';
import { createEnemy, updateEnemy } from './enemies.js';
import { drawBackground, drawJhin, drawPlayerProjectiles, drawWBeam, drawTraps, drawEnemyProjectiles, drawEnemy, drawMagician as _drawMagician } from './draw.js';
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
  const pendingAbilityRef = useRef(null);
  const autoFireTimerRef = useRef(0);

  // Keep gameState ref in sync
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const isInEnemy = useCallback((ex, ey, mx, my) => {
    return Math.abs(mx - ex) < 60 && Math.abs(my - (ey - 80)) < 100;
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
              spawnMuzzleFlash(ps, player.x + player.facing * 80, player.y - 108);
            }
          }
          break;
        case 'W':
          e.preventDefault();
          if (fireWAbility(player, enemy)) {
            spawnBeamParticles(ps, player.x + player.facing * 50, player.y - 108, enemy.x, enemy.y - 80);
            spawnDamageNumber(ps, enemy.x, enemy.y - 120, 'STUN!', 'beam');
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
        const dmg = releaseRAbility(player, enemy, ps);
        if (dmg) {
          spawnMuzzleFlash(ps, player.x + player.facing * 60, player.y - 108);
          spawnHitSparks(ps, enemy.x, enemy.y - 80, '#CC2222');
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

    const getLogicalCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = LOGICAL_W / rect.width;
      const scaleY = LOGICAL_H / rect.height;
      return {
        lx: (e.clientX - rect.left) * scaleX,
        ly: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseDown = (e) => {
      if (gameStateRef.current !== STATES.PLAYING) return;
      e.preventDefault();

      const { lx, ly } = getLogicalCoords(e);
      const player = playerRef.current;
      const enemy = currentEnemyRef.current;
      const ps = psRef.current;

      if (e.button === 2) {
        // Right click — attack or target enemy
        if (enemy && !enemy.dead && isInEnemy(enemy.x, enemy.y, lx, ly)) {
          player.moveTarget = enemy.x - 80;
          player.attackTarget = true;
          spawnClickRipple(ps, lx, ly, '#FF4444');
        } else {
          // Right click on ground — also move
          player.moveTarget = lx;
          player.attackTarget = false;
          spawnClickRipple(ps, lx, GROUND_Y + 40, '#22FF55');
        }
      } else if (e.button === 0) {
        // Left click
        if (enemy && !enemy.dead && isInEnemy(enemy.x, enemy.y, lx, ly)) {
          // Click on enemy — move toward it and auto-attack
          player.moveTarget = enemy.x - 80;
          player.attackTarget = true;
          spawnClickRipple(ps, lx, ly, '#FF4444');
        } else if (ly > GROUND_Y - 60) {
          // Click on ground — move
          player.moveTarget = lx;
          player.attackTarget = false;
          spawnClickRipple(ps, lx, GROUND_Y + 40, '#22FF55');
        }
      }
    };

    const handleContextMenu = (e) => e.preventDefault();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('contextmenu', handleContextMenu);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isInEnemy]);

  // ── Game loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const state = gameStateRef.current;
      if (state === STATES.VICTORY) return;

      frameRef.current++;
      const frame = frameRef.current;
      const player = playerRef.current;
      const enemy = currentEnemyRef.current;
      const ps = psRef.current;

      // ── Update ──────────────────────────────────────────────────────────────
      if (state === STATES.PLAYING) {
        // Update R charge timer
        if (player.rCharging) {
          player.rChargeTimer++;
        }

        // Auto-attack when reached target
        autoFireTimerRef.current++;
        if (player.attackTarget && player.moveTarget === null && autoFireTimerRef.current > 15) {
          autoFireTimerRef.current = 0;
          if (!player.reloading && player.bullets > 0 && enemy && !enemy.dead) {
            const dx = Math.abs(player.x - enemy.x);
            if (dx < 500) {
              if (fireQAbility(player)) {
                spawnMuzzleFlash(ps, player.x + player.facing * 80, player.y - 108);
              }
            }
          }
        }

        updatePlayer(
          player,
          keysRef.current,
          enemy,
          ps,
          (x, y) => spawnMuzzleFlash(ps, x, y),
          (x, y, color) => spawnHitSparks(ps, x, y, color)
        );

        // Keep player facing enemy
        if (enemy && !enemy.dead) {
          const dx = enemy.x - player.x;
          if (Math.abs(dx) > 20 && player.moveTarget === null && !keysRef.current['ArrowLeft'] && !keysRef.current['ArrowRight'] && !keysRef.current['a'] && !keysRef.current['d']) {
            player.facing = Math.sign(dx);
          }
        }

        updateEnemy(enemy, player, ps, frame);

        // Magician NPC
        const mag = magicianRef.current;
        if (mag.visible) {
          mag.timer++;
          if (mag.x > mag.slideTarget) {
            mag.x -= 5;
          }
          if (mag.timer > 300) {
            // Slide out
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

          // Add to kill feed
          killFeedRef.current.unshift({ name: enemy.name, age: 0 });

          // Trigger magician after enemy 2
          if (idx === 1) {
            magicianRef.current = {
              visible: true,
              x: LOGICAL_W + 80,
              slideTarget: 900,
              timer: 0,
            };
            // Speed buff
            player.speedBuff = 1.5;
            player.speedBuffTimer = 600;
          }

          // Notify React (shows resume popup or victory)
          if (idx >= 4) {
            onVictory({ player, killFeed: killFeedRef.current });
          } else {
            onEnemyDead(idx, () => {
              // Called when player clicks "CONTINUE" on popup
              const nextIdx = idx + 1;
              enemyIndexRef.current = nextIdx;
              currentEnemyRef.current = createEnemy(nextIdx);
            });
          }
        }

        // Player death — reset health for now (just cap at 1)
        if (player.health <= 0) {
          player.health = 1;
        }
      }

      // Always update particles
      updateParticles(ps);

      // ── Draw ────────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

      drawBackground(ctx, frame);
      drawParticles(ctx, ps);
      drawTraps(ctx, player, frame);

      // Enemy
      if (enemy) {
        drawEnemyProjectiles(ctx, enemy);
        drawEnemy(ctx, enemy, frame);
      }

      // Magician
      if (magicianRef.current.visible) {
        drawMagicianWithDialogue(ctx, magicianRef.current, frame);
      }

      // Player
      drawPlayerProjectiles(ctx, player, frame);
      drawWBeam(ctx, player);
      drawJhin(ctx, player, frame);

      // HUD
      drawHUD(ctx, player, enemy && !enemy.dead ? enemy : null, killFeedRef.current, frame);

      // Speed buff indicator
      if (player.speedBuffTimer > 0) {
        ctx.fillStyle = '#C89B3C';
        ctx.globalAlpha = 0.7;
        ctx.font = '11px "Share Tech Mono"';
        ctx.textAlign = 'center';
        ctx.fillText('✦ HASTE ✦', LOGICAL_W / 2, LOGICAL_H - 20);
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
    const by = GROUND_Y - 300;
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
