import { useRef, useEffect, useCallback, useState } from 'react';
import { LOGICAL_W, LOGICAL_H, MAP_W, MAP_H, STATES } from './constants.js';
import { createPlayer, updatePlayer, fireQAbility, fireWAbility, fireEAbility, startRCharge, releaseRAbility } from './player.js';
import { createEnemy, updateEnemy } from './enemies.js';
import {
  drawMap, drawVirtuoso, drawPlayerProjectiles, drawWBeam,
  drawTraps, drawEnemyProjectiles, drawEnemy, drawMagician as _drawMagician,
} from './draw.js';
import { drawHUD, drawMuteButton } from './ui.js';
import {
  createParticleSystem, updateParticles, drawParticles,
  spawnClickRipple, spawnMuzzleFlash, spawnHitSparks, spawnBeamParticles,
  spawnDamageNumber,
} from './particles.js';
import {
  soundShoot, soundCritShoot, soundReload, soundWBeam, soundETrap,
  soundRCharge, soundRRelease, soundEnemyHit, soundPlayerHit,
  soundEnemyDeath, soundStun, soundLevelUp, soundVictory, soundEnemySpawn,
  setAudioEnabled, isAudioEnabled,
} from './audio.js';

// Draw HP orbs on canvas
function drawHpOrbs(ctx, orbs, frame, cam) {
  for (const orb of orbs) {
    if (!orb.active) continue;
    const sx = orb.x - cam.x;
    const sy = orb.y - cam.y;
    if (sx < -40 || sx > 1320 || sy < -40 || sy > 760) continue;

    const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, orb.radius * 1.6);
    glow.addColorStop(0, `rgba(30,220,100,${0.6 * pulse})`);
    glow.addColorStop(1, 'rgba(0,180,60,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, orb.radius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring
    ctx.save();
    ctx.strokeStyle = `rgba(50,255,120,${0.7 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, orb.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle
    const inner = ctx.createRadialGradient(sx, sy - 3, 2, sx, sy, orb.radius - 4);
    inner.addColorStop(0, `rgba(180,255,200,${pulse})`);
    inner.addColorStop(1, `rgba(20,180,70,${0.8 * pulse})`);
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(sx, sy, orb.radius - 4, 0, Math.PI * 2);
    ctx.fill();

    // Cross / plus symbol
    ctx.strokeStyle = `rgba(255,255,255,${0.9 * pulse})`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy - 7); ctx.lineTo(sx, sy + 7);
    ctx.moveTo(sx - 7, sy); ctx.lineTo(sx + 7, sy);
    ctx.stroke();
    ctx.restore();
  }
}

// Crystal pickups — same positions as the blue diamonds drawn on the map
function generateCrystalPickups() {
  return [
    { x: MAP_W * 0.42, y: MAP_H * 0.42 },
    { x: MAP_W * 0.58, y: MAP_H * 0.42 },
    { x: MAP_W * 0.42, y: MAP_H * 0.58 },
    { x: MAP_W * 0.58, y: MAP_H * 0.58 },
  ].map(pos => ({ ...pos, r: 22, active: true, respawnTimer: 0, respawnDuration: 480 }));
}

// Spawn HP orbs at fixed positions around the arena
function generateHpOrbs() {
  const cx = MAP_W / 2, cy = MAP_H / 2;
  const r = MAP_W * 0.32;
  const count = 6;
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + Math.PI / count;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      heal: 30,
      radius: 18,
      active: true,
      respawnTimer: 0,
      respawnDuration: 480, // 8 seconds
    };
  });
}

export default function Game({ onEnemyDead, onVictory, onDeath, gameState, paused }) {
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
  const pausedRef = useRef(paused);
  const killFeedRef = useRef([]);
  const magicianRef = useRef({ visible: false, x: LOGICAL_W + 100, slideTarget: 900, timer: 0 });
  const autoFireTimerRef = useRef(0);
  const cameraRef = useRef({ x: 0, y: 0 });
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const rChargeSoundedRef = useRef(false);

  // HP orbs scattered around the arena
  const hpOrbsRef = useRef(generateHpOrbs());
  // Crystal pickups (the blue diamonds on the map)
  const crystalPickupsRef = useRef(generateCrystalPickups());

  // Keep gameState + paused refs in sync
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

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
            const isCritShot = player.bullets === 1;
            if (fireQAbility(player)) {
              const mfx = player.x + Math.cos(player.facing) * 44;
              const mfy = player.y + Math.sin(player.facing) * 44;
              const cam = cameraRef.current;
              spawnMuzzleFlash(ps, mfx - cam.x, mfy - cam.y);
              try { isCritShot ? soundCritShoot() : soundShoot(); } catch (err) { /* ignore */ }
            }
          }
          break;
        case 'X':
          e.preventDefault();
          if (fireWAbility(player, enemy)) {
            const cam = cameraRef.current;
            spawnBeamParticles(
              ps,
              player.x - cam.x, player.y - cam.y,
              enemy.x - cam.x, enemy.y - cam.y
            );
            spawnDamageNumber(ps, enemy.x - cam.x, enemy.y - cam.y - 40, 'STUN!', 'beam');
            try { soundWBeam(); soundStun(); } catch (err) { /* ignore */ }
          }
          break;
        case 'E':
          e.preventDefault();
          if (fireEAbility(player)) {
            try { soundETrap(); } catch (err) { /* ignore */ }
          }
          break;
        case 'R':
          e.preventDefault();
          if (!player.rCharging) {
            startRCharge(player);
            rChargeSoundedRef.current = false;
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
          try { soundRRelease(); } catch (err) { /* ignore */ }
        }
        rChargeSoundedRef.current = false;
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
      e.preventDefault();

      // Check mute button click (screen coordinates)
      if (e.button === 0) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = LOGICAL_W / rect.width;
          const scaleY = LOGICAL_H / rect.height;
          const screenX = (e.clientX - rect.left) * scaleX;
          const screenY = (e.clientY - rect.top) * scaleY;
          const bx = LOGICAL_W - 44, by = 10, bw = 34, bh = 24;
          if (screenX >= bx && screenX <= bx + bw && screenY >= by && screenY <= by + bh) {
            const newMuted = !isMutedRef.current;
            isMutedRef.current = newMuted;
            setIsMuted(newMuted);
            try { setAudioEnabled(!newMuted); } catch (err) { /* ignore */ }
            return;
          }
        }
      }

      if (gameStateRef.current !== STATES.PLAYING) return;

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
      if (pausedRef.current) {
        // Still draw the world while paused, just skip updates
        const player = playerRef.current;
        const enemy = currentEnemyRef.current;
        const ps = psRef.current;
        const cam = cameraRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
        drawMap(ctx, frameRef.current, cam);
        if (enemy && !enemy.dead) drawEnemy(ctx, enemy, frameRef.current, cam);
        drawVirtuoso(ctx, player, frameRef.current, cam);
        return;
      }

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
          if (!rChargeSoundedRef.current && player.rChargeTimer === 1) {
            rChargeSoundedRef.current = true;
            try { soundRCharge(); } catch (err) { /* ignore */ }
          }
        }

        // Auto-attack when reached attack target
        autoFireTimerRef.current++;
        if (player.attackTarget && player.moveTarget === null && autoFireTimerRef.current > 15) {
          autoFireTimerRef.current = 0;
          if (!player.reloading && player.bullets > 0 && enemy && !enemy.dead) {
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < 500) {
              const isAutoLastBullet = player.bullets === 1;
              if (fireQAbility(player)) {
                const mfx = player.x + Math.cos(player.facing) * 44;
                const mfy = player.y + Math.sin(player.facing) * 44;
                spawnMuzzleFlash(ps, mfx - cam.x, mfy - cam.y);
                try { isAutoLastBullet ? soundCritShoot() : soundShoot(); } catch (err) { /* ignore */ }
              }
            }
          }
        }

        const wasReloading = player.reloading;
        updatePlayer(
          player,
          keysRef.current,
          enemy,
          ps,
          (x, y) => spawnMuzzleFlash(ps, x - cam.x, y - cam.y),
          (x, y, color) => spawnHitSparks(ps, x - cam.x, y - cam.y, color)
        );
        // Reload start detection
        if (!wasReloading && player.reloading) {
          try { soundReload(); } catch (err) { /* ignore */ }
        }

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
                  killFeedRef.current.unshift({ name: 'SHIELD BROKEN!', age: 0, color: '#88CCFF' });
                }
                spawnDamageNumber(ps, p.x - cam.x, p.y - cam.y - 20, 'BLOCKED', 'beam');
              } else {
                enemy.hp = Math.max(0, enemy.hp - p.dmg);
                player.totalDamageDealt += p.dmg;
                if (p.isCrit) player.critHits++;
                spawnHitSparks(ps, p.x - cam.x, p.y - cam.y, p.isCrit ? '#FFD700' : '#C89B3C');
                spawnDamageNumber(ps, p.x - cam.x, p.y - cam.y - 20, p.dmg, p.isCrit ? 'crit' : 'normal');
                try { soundEnemyHit(); } catch (err) { /* ignore */ }
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
                player.health = Math.max(0, player.health - ep.dmg);
                player.hitFlash = 10;
                player.iFrames = 28;
                spawnDamageNumber(ps, player.x - cam.x, player.y - cam.y - 30, ep.dmg, 'player');
                spawnHitSparks(ps, player.x - cam.x, player.y - cam.y, '#FF4444');
                try { soundPlayerHit(); } catch (err) { /* ignore */ }
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

          killFeedRef.current.unshift({ name: enemy.name, age: 0, color: enemy.color });
          try { soundEnemyDeath(); } catch (err) { /* ignore */ }

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
            try { soundVictory(); } catch (err) { /* ignore */ }
            onVictory({ player, killFeed: killFeedRef.current });
          } else {
            onEnemyDead(idx, () => {
              const nextIdx = idx + 1;
              enemyIndexRef.current = nextIdx;
              currentEnemyRef.current = createEnemy(nextIdx);
              try { soundEnemySpawn(); soundLevelUp(); } catch (err) { /* ignore */ }
            });
          }
        }

        // ── HP Orb collection ────────────────────────────────────────────────
        for (const orb of hpOrbsRef.current) {
          if (!orb.active) {
            orb.respawnTimer++;
            if (orb.respawnTimer >= orb.respawnDuration) {
              orb.active = true;
              orb.respawnTimer = 0;
            }
            continue;
          }
          const dist = Math.hypot(player.x - orb.x, player.y - orb.y);
          if (dist < player.radius + orb.radius) {
            orb.active = false;
            orb.respawnTimer = 0;
            player.health = Math.min(player.maxHealth, player.health + orb.heal);
            spawnDamageNumber(ps, orb.x - cam.x, orb.y - cam.y - 20, `+${orb.heal}`, 'heal');
          }
        }

        // ── Crystal pickup collection ────────────────────────────────────────
        for (const c of crystalPickupsRef.current) {
          if (!c.active) {
            c.respawnTimer++;
            if (c.respawnTimer >= c.respawnDuration) { c.active = true; c.respawnTimer = 0; }
            continue;
          }
          if (Math.hypot(player.x - c.x, player.y - c.y) < player.radius + c.r) {
            c.active = false;
            c.respawnTimer = 0;
            player.damageMult = 1.5;
            player.damageBuffTimer = 360;
            spawnDamageNumber(ps, c.x - cam.x, c.y - cam.y - 30, 'DMG +50%', 'crit');
          }
        }

        // Player death
        if (player.health <= 0) {
          player.health = 0;
          if (onDeath) {
            onDeath({ player: { ...player } });
          }
          return; // stop the game loop update
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

      // HP Orbs
      drawHpOrbs(ctx, hpOrbsRef.current, frame, cam);

      // Crystal pickup overlay — pulse when active, dark when depleted
      for (const c of crystalPickupsRef.current) {
        const sx = c.x - cam.x, sy = c.y - cam.y;
        ctx.save();
        ctx.translate(sx, sy);
        if (c.active) {
          const pulse = 0.5 + Math.sin(frame * 0.08) * 0.5;
          ctx.globalAlpha = 0.55 * pulse;
          ctx.shadowColor = '#00EEFF'; ctx.shadowBlur = 22;
          ctx.strokeStyle = '#00EEFF'; ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, -c.r); ctx.lineTo(c.r * 0.65, 0);
          ctx.lineTo(0, c.r); ctx.lineTo(-c.r * 0.65, 0);
          ctx.closePath(); ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          // Dark overlay to show it's consumed
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.beginPath();
          ctx.moveTo(0, -c.r); ctx.lineTo(c.r * 0.65, 0);
          ctx.lineTo(0, c.r); ctx.lineTo(-c.r * 0.65, 0);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }

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
      drawVirtuoso(ctx, player, frame, cam);

      // HUD (always screen space)
      drawHUD(ctx, player, enemy && !enemy.dead ? enemy : null, killFeedRef.current, frame);

      // Mute button
      drawMuteButton(ctx, isMutedRef.current);

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
      // Damage buff indicator
      if (player.damageBuffTimer > 0) {
        const pulse = 0.7 + Math.sin(frame * 0.15) * 0.3;
        ctx.fillStyle = '#FFD700';
        ctx.globalAlpha = pulse;
        ctx.font = 'bold 12px "Share Tech Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(`⬥ DMG +50% ⬥`, LOGICAL_W / 2, LOGICAL_H - 36);
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
