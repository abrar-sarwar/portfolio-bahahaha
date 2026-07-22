// features/adventure/realtime/BossArenaScene.ts
//
// The real-time boss arena (amendment §4). It SUBCLASSES PlatformLevelScene to
// reuse the platform movement/feel wholesale (coyote/buffer/variable-jump/dash/
// knockback/iframes/pit-respawn/animation) and layers boss combat on top:
//   • resolveLevelDef → renders an enclosed arena map from realtime/arenas.ts
//     through the existing tile pipeline (no checkpoint/fragment/enemy chars, so
//     those systems no-op; the required `D` marker is parked under the boss and
//     neutralised by the enterBoss() no-op override).
//   • onCreated → spawns the boss sprite and wires the Task-33 stack: the
//     BossController (pure machine + presentation + per-boss mechanics), the
//     ProjectileManager, the ArenaHazardSystem, and the PlayerCombatController
//     (attack/parry/stomp), publishing BossHealthBar / ActionBar store fields.
//   • update → runs super.update() (movement) then steps the combat stack; a
//     full state reset happens at create()/onCreated() top.
//   • afterDeath → fade + scene.restart with full hearts ("retry before the
//     boss"). Victory → the existing save/overworld completion path when the
//     arena was entered from a level, else the `returnScene` (debug entry).
import Phaser from "phaser";
import { PlatformLevelScene, type LevelSceneData } from "../scenes/PlatformLevelScene";
import type { LevelDefinition } from "../levels/types";
import type { BossId, LevelId, SceneKey } from "../ids";
import { PHYSICS, TILE } from "../config";
import { POWER_STACK_MAX, RT_PLAYER } from "./config";
import { validateDef } from "./BossStateMachine";
import type { RtAttackSpec, RtBossDef, RtBossId } from "./types";
import { getRtBoss, getRtMechanics } from "./bossDefinitions";
import { getArena } from "./arenas";
import { classifyStomp } from "./StompSystem";
import { PlayerCombatController } from "./PlayerCombatController";
import { BossController } from "./BossController";
import { ProjectileManager } from "./ProjectileManager";
import { ArenaHazardSystem } from "./ArenaHazardSystem";
import { impactSparks, hitFlash, cameraKick } from "./effects";
import { fracFromReadyAt } from "./ui/actionBarMath";
import { registerSprites, animKey, frameKey } from "../art/textures";
import { BOSSES2_SPRITES } from "../art/sprites/bosses2";
import { gameStore } from "../bridge/GameStore";
import { input } from "../input/InputState";
import { audio } from "../audio/synth";
import { completeLevel, loadSave, markBossDefeated, persistSave, recordDeath } from "../state/save";
import { assistRTProfile, effectiveAttempts } from "./assistRT";
import { bus } from "../bridge/EventBus";

type Body = Phaser.Physics.Arcade.Body;

// Silent-assist attempt tracking (amendment §6): in-session fail counts per
// boss, floored by the persisted per-boss death count (save.deaths). Module
// scope on purpose — it must survive scene restarts, never scene instances.
const SESSION_FAILS = new Map<RtBossId, number>();

export interface ArenaSceneData {
  bossId: RtBossId;
  /** Level to credit + return through on victory (the real boss-door flow). */
  fromLevel?: LevelId;
  /** Scene to return to on victory/exit when no fromLevel (`?arena=` entry). */
  returnScene?: SceneKey;
  /** POWER stacks stomped out of the level's enemies (each = +1 swing damage
   *  before the boss's damageScale). Rides the scene data so a death-retry
   *  restart keeps what was earned. */
  power?: number;
}

const STOMP_COOLDOWN_MS = 300; // guard a single overlap from registering many stomps
const FADE_MS = 260;

export class BossArenaScene extends PlatformLevelScene {
  private arenaData!: ArenaSceneData;
  private bossDef!: RtBossDef;
  private arenaDef!: LevelDefinition;
  private returnScene: SceneKey = "Title";

  private bossSprite!: Phaser.Physics.Arcade.Sprite;
  private bossAttackZone!: Phaser.GameObjects.Zone;
  private combat!: PlayerCombatController;
  private controller!: BossController;
  private projectiles!: ProjectileManager;
  private hazards!: ArenaHazardSystem;

  private activeAttackParryable = false;
  private activeAttackDamage: 1 | 2 = 1;
  private machineFreezeUntil = 0;
  private stompReadyAt = 0;
  private victory = false;
  private defaultZone = { w: 70, h: 48, ox: 0, oy: 0 };
  private zoneShape = { w: 70, h: 48, ox: 0, oy: 0 };

  constructor() {
    super("Arena");
    this.drawDoorMarker = false; // the arena's D is inert scaffolding
  }

  init(data: ArenaSceneData): void {
    this.arenaData = data;
    this.returnScene = data.returnScene ?? "Title";
    const def = getRtBoss(data.bossId);
    if (!def) throw new Error(`[arena] unknown boss ${data.bossId}`);
    validateDef(def); // enforce the machine invariants at registration
    this.bossDef = def;
    const arena = getArena(def.arenaKey);
    if (!arena) throw new Error(`[arena] unknown arena ${def.arenaKey}`);
    this.arenaDef = arena;
  }

  /** The arena renders its enclosed map, not a LEVELS entry. */
  protected resolveLevelDef(_data: LevelSceneData): LevelDefinition {
    return this.arenaDef;
  }

  /** No boss door inside the arena — the `D` marker under the boss is inert. */
  protected enterBoss(): void {
    /* intentionally empty */
  }

  protected onCreated(_data: LevelSceneData): void {
    // Scene-instance hygiene: reset every accumulated flag/ref before building.
    this.activeAttackParryable = false;
    this.activeAttackDamage = 1;
    this.machineFreezeUntil = 0;
    this.stompReadyAt = 0;
    this.victory = false;

    // Interior veil: arenas are enclosed halls, but their world tilesets ship
    // outdoor parallax. A dark translucent sheet between parallax and tiles
    // sells "indoors, lit from the ceiling gap" without a bespoke backdrop.
    this.add
      .rectangle(0, 0, this.lvl.widthTiles * TILE, this.lvl.heightTiles * TILE, 0x0a0a0d, 0.72)
      .setOrigin(0, 0)
      .setDepth(-5);

    // Full moveset in arenas regardless of save state (amendment §6).
    this.fullMoveset = true;

    // Silent assist (amendment §6): 3+ failed attempts on this boss quietly
    // ease the fight — one bonus heart, recovery ×1.2, projectiles ×0.85,
    // parry window ×1.25. Never announced.
    const persistedFails =
      this.bossDef.id === "training-dummy"
        ? 0
        : loadSave().deaths[this.bossDef.id as BossId] ?? 0;
    const fails = effectiveAttempts(SESSION_FAILS.get(this.bossDef.id) ?? 0, persistedFails);
    const assist = assistRTProfile(fails);
    if (assist.bonusMaxHearts > 0) {
      this.maxHealth = RT_PLAYER.maxHearts + assist.bonusMaxHearts;
      this.health = this.maxHealth;
      this.pushHud();
    }

    // Boss sprite (idempotent registration) + physics body (immovable, static).
    // The body comes from the def (default 18×30); the sprite is placed so its
    // FEET sit on the bottom edge of the spawn tile (dais-aware, not floor-2).
    registerSprites(this, BOSSES2_SPRITES);
    const bw = this.bossDef.body?.w ?? 18;
    const bh = this.bossDef.body?.h ?? 30;
    const bx = this.bossDef.spawn.tx * TILE + TILE / 2;
    const feetY = (this.bossDef.spawn.ty + 1) * TILE;
    this.bossSprite = this.physics.add.sprite(bx, feetY - bh / 2, frameKey(this.bossDef.id, 0));
    // Art-aware grounding: when the def declares where the drawn feet END,
    // align that line to the spawn tile's bottom — the body-height formula
    // above assumes the feet reach the sprite's bottom edge, which sinks (or
    // floats) any art with bottom padding by |spriteH - bodyH| px.
    if (this.bossDef.spriteFeetY !== undefined) {
      this.bossSprite.setY(feetY - this.bossDef.spriteFeetY + this.bossSprite.height / 2);
    }
    this.bossSprite.setDepth(12);
    const bb = this.bossSprite.body as Body;
    bb.setAllowGravity(false);
    bb.setImmovable(true);
    bb.setSize(bw, bh);
    bb.setOffset((this.bossSprite.width - bw) / 2, this.bossSprite.height - bh);

    // Player combat layer: swing damages the boss (hit-stop + sparks on land).
    this.combat = new PlayerCombatController(this, this.player, assist.parryWindowScale);
    // POWER stacks earned in the level (stomped enemies) sharpen every swing;
    // they ride arenaData so a death-retry keeps them, and surface in the HUD.
    this.powerStacks = Math.max(0, Math.min(POWER_STACK_MAX, this.arenaData.power ?? 0));
    this.combat.setAttackBonus(this.powerStacks);
    this.pushHud();
    this.combat.bindTarget(this.bossSprite, () => {
      this.machineFreezeUntil = this.time.now + RT_PLAYER.hitStopMs;
      impactSparks(this, this.bossSprite.x, this.bossSprite.y - 4);
      hitFlash(this, this.bossSprite);
      cameraKick(this);
    });

    // Boss attack hitbox (enabled during an attack's active window). Default
    // geometry scales with the body; mechanics reshape it per attack via
    // MechanicsApi.shapeBossAttack (the Broken King's arena-wide sweep).
    this.defaultZone = { w: Math.max(70, bw + 52), h: bh + 18, ox: 0, oy: 0 };
    this.zoneShape = { ...this.defaultZone };
    this.bossAttackZone = this.add.zone(bx, feetY - bh / 2, this.defaultZone.w, this.defaultZone.h);
    this.physics.add.existing(this.bossAttackZone);
    const zb = this.bossAttackZone.body as Body;
    zb.setAllowGravity(false);
    zb.enable = false;
    this.physics.add.overlap(this.bossAttackZone, this.player, () => this.onBossAttackHitsPlayer());

    // Player-vs-boss body: falling stomp (bounce + damage) or contact damage.
    // Background-anchored bosses (noContact) skip body interactions entirely.
    if (!this.bossDef.noContact) {
      this.physics.add.overlap(this.player, this.bossSprite, () => this.onBodyContact());
    }

    // Projectiles + hazards (pooled; reset on every restart via create()).
    const widthPx = this.lvl.widthTiles * TILE;
    const heightPx = this.lvl.heightTiles * TILE;
    // Main-floor top: first solid row under the player start (arenas differ in
    // floor thickness — training 2 rows, temple 3 — and may have raised dais
    // platforms, so the old heightTiles-2 assumption doesn't generalize).
    const ps = this.lvl.playerStart;
    let floorRow = this.lvl.heightTiles - 2;
    for (let ty = ps.ty + 1; ty < this.lvl.heightTiles; ty++) {
      if (this.lvl.solids[ty][ps.tx]) {
        floorRow = ty;
        break;
      }
    }
    const floorTopY = floorRow * TILE;
    this.projectiles = new ProjectileManager(this, {
      player: this.player,
      boss: this.bossSprite,
      walls: () => [
        { x: -16, y: 0, w: TILE + 16, h: heightPx }, // left wall
        { x: widthPx - TILE, y: 0, w: TILE + 16, h: heightPx }, // right wall
        { x: 0, y: -16, w: widthPx, h: TILE + 16 }, // ceiling
        { x: 0, y: floorTopY, w: widthPx, h: TILE * 2 + 16 }, // floor
      ],
      isParrying: (now) => this.combat.isParrying(now),
      consumeParry: (now) => this.combat.consumeParry(now),
      onPlayerHit: (dmg) => this.takeDamage(dmg),
      speedScale: assist.projectileSpeedScale,
    });
    this.hazards = new ArenaHazardSystem(this, {
      player: this.player,
      bounds: () => ({
        minX: TILE + 4,
        maxX: widthPx - TILE - 4,
        floorY: floorTopY,
        ceilingY: TILE,
      }),
      onPlayerHit: (dmg) => this.takeDamage(dmg),
    });

    // The boss brain: pure machine + presentation + per-boss mechanics.
    this.controller = new BossController({
      scene: this,
      def: this.bossDef,
      boss: this.bossSprite,
      player: this.player,
      projectiles: this.projectiles,
      hazards: this.hazards,
      mechanicsFactory: getRtMechanics(this.bossDef.id),
      onAttackActive: (spec) => this.armBossAttack(spec),
      onAttackEnd: () => this.disarmBossAttack(),
      shapeAttack: (shape) => this.shapeBossAttack(shape),
      bindSwing: (target, cb) => this.combat.onSwingOverlap(target, cb),
      onDefeated: () => this.onDefeat(),
      recoveryScale: assist.recoveryScale,
    });

    this.syncActions(true);

    this.cameras.main.fadeIn(200, 0, 0, 0);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameStore.set({ rtBoss: null, rtObjective: null, rtSeals: null });
      this.projectiles?.resetAll();
      this.hazards?.resetAll();
      this.controller?.destroy();
      this.combat?.destroy();
    });
  }

  update(t: number, dtMs: number): void {
    // Capture the parry/interact presses BEFORE super.update() consumes the
    // input snapshot (interact drives mash mechanics — the King's truth tear).
    const snap = input.read();
    const parryPressed = snap.parryPressed;
    const interactPressed = snap.interactPressed;
    super.update(t, dtMs);
    this.stepArena(dtMs, parryPressed, interactPressed);

    // Augment the base `?debug=1` telemetry with arena/machine state — here,
    // not in stepArena, so the defeated/victory frames still publish.
    if (this.debugTelemetry && this.controller) {
      const adv = (window as unknown as Record<string, unknown>).__adv as
        | Record<string, unknown>
        | undefined;
      if (adv) {
        adv.fsm = this.controller.state.fsm;
        adv.atk = this.controller.state.currentAttackId;
        adv.ms = this.controller.state.msInState;
        adv.bossHp = this.controller.state.hp;
        adv.bx = this.bossSprite.x;
        adv.proj = this.projectiles.count();
        adv.ctx = gameStore.get().rtActions.context?.label ?? null;
      }
    }
  }

  /** Route the base attack input through the combat controller (slash-vs-boss),
   *  reusing the base `attacking` anim lock. Cooldown-gated by the controller. */
  protected doAttack(): void {
    const now = this.time.now;
    const facing: 1 | -1 = this.player.flipX ? -1 : 1;
    if (!this.combat.attack(now, facing)) return;
    this.attacking = true;
    this.attackUntil = now + RT_PLAYER.attackActiveMs;
    this.player.play(animKey("player", "attack"), true);
  }

  private stepArena(dtMs: number, parryPressed: boolean, interactPressed = false): void {
    if (gameStore.get().paused || this.dead || this.victory) {
      if (this.dead || this.victory) this.disarmBossAttack();
      return;
    }

    const now = this.time.now;

    // Parry press → open the stance + hold the parry pose for the window.
    if (parryPressed && this.combat.parry(now)) {
      this.player.play(animKey("player", "parry"), true);
      this.attacking = true; // reuse the anim lock so playAnimFor holds the pose
      this.attackUntil = now + RT_PLAYER.parryWindowMs;
    }
    this.combat.followHitbox();

    // The armed melee window follows the boss (a charging King carries his
    // hitbox across the arena; static bosses are unaffected).
    const zb = this.bossAttackZone.body as Body;
    if (zb.enable) {
      this.bossAttackZone.setPosition(
        this.bossSprite.x + this.zoneShape.ox,
        this.bossSprite.y + this.zoneShape.oy,
      );
    }

    // Step the boss brain — hit-stop / parry-freeze skips the machine but the
    // queued events land on the first live step after.
    const frozen = now < this.machineFreezeUntil;
    this.controller.update(dtMs, frozen, this.combat.drainEvents(), interactPressed);
    this.projectiles.update(dtMs);
    this.hazards.update(dtMs);

    this.syncActions(false);
  }

  // ── boss attack window (armed by the BossController) ───────────────────────

  private armBossAttack(spec: RtAttackSpec): void {
    this.activeAttackParryable = !!spec.parryable;
    this.activeAttackDamage = spec.damage;
    const zb = this.bossAttackZone.body as Body;
    this.bossAttackZone.setSize(this.zoneShape.w, this.zoneShape.h);
    zb.setSize(this.zoneShape.w, this.zoneShape.h);
    this.bossAttackZone.setPosition(
      this.bossSprite.x + this.zoneShape.ox,
      this.bossSprite.y + this.zoneShape.oy,
    );
    zb.enable = true;
  }

  private disarmBossAttack(): void {
    (this.bossAttackZone.body as Body).enable = false;
    this.zoneShape = { ...this.defaultZone };
  }

  /** Reshape the NEXT armed attack window (mechanics, per attack). Cleared
   *  back to the default on every attack-end/stagger/defeat. */
  shapeBossAttack(shape: { w: number; h: number; ox?: number; oy?: number }): void {
    this.zoneShape = { w: shape.w, h: shape.h, ox: shape.ox ?? 0, oy: shape.oy ?? 0 };
  }

  // ── overlaps ───────────────────────────────────────────────────────────────

  private onBossAttackHitsPlayer(): void {
    if (this.dead || this.victory) return;
    const now = this.time.now;
    if (this.combat.resolveBossAttack(now, this.activeAttackParryable)) {
      this.machineFreezeUntil = now + RT_PLAYER.parryFreezeMs;
      this.disarmBossAttack(); // consume the attack — no repeat this swing
    } else {
      this.takeDamage(this.activeAttackDamage); // base iframes gate repeats
    }
  }

  private onBodyContact(): void {
    if (this.dead || this.victory) return;
    // A staggered/DOWNED boss is safe to touch — the mash window sends the
    // player right up against (and on top of) him; contact damage there would
    // punish doing the intended thing.
    if (this.controller?.state.fsm === "stagger") return;
    const body = this.player.body as Body;
    const bb = this.bossSprite.body as Body;
    const contact = classifyStomp(
      { vy: body.velocity.y, feetY: body.bottom },
      { topY: bb.top, height: bb.height, stompable: true },
    );
    if (contact === "stomp") {
      const now = this.time.now;
      if (now < this.stompReadyAt) return;
      this.stompReadyAt = now + STOMP_COOLDOWN_MS;
      body.setVelocityY(RT_PLAYER.stompBounceVel);
      this.combat.registerStomp();
      this.machineFreezeUntil = now + RT_PLAYER.hitStopMs;
      audio.sfx("stomp");
      impactSparks(this, this.bossSprite.x, bb.top);
      hitFlash(this, this.bossSprite);
    } else {
      this.takeDamage(this.bossDef.contactDamage);
    }
  }

  // ── victory ────────────────────────────────────────────────────────────────

  private onDefeat(): void {
    if (this.victory) return;
    this.victory = true;
    this.disarmBossAttack();
    audio.sfx("collect");
    // Victory fanfare (loop:false) — replaces the boss theme for the beat
    // before the fade; the next scene's create() takes over the music.
    audio.playTrack("victory");

    const fromLevel = this.arenaData.fromLevel;
    const isTraining = this.bossDef.id === "training-dummy";
    const cam = this.cameras.main;
    this.add
      .text(cam.midPoint.x, cam.midPoint.y - 20, isTraining ? "TRAINING COMPLETE" : "VICTORY", {
        fontFamily: "monospace",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#ffd75e",
        backgroundColor: "#000000cc",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(100);

    // Long enough for the fanfare's opening phrase to land before the fade.
    this.time.delayedCall(2600, () => {
      cam.fadeOut(FADE_MS, 0, 0, 0);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        gameStore.set({ rtBoss: null, rtObjective: null, rtSeals: null });
        if (fromLevel) {
          // The real boss-door flow: persist completion + the defeated boss,
          // seed the runtime store, and land on the Overworld with the flag.
          // (The dormant combat controller's level:complete listener is no
          // longer wired into any active path, so persistence happens here.)
          const save = markBossDefeated(
            completeLevel(loadSave(), fromLevel),
            this.bossDef.id as BossId,
          );
          persistSave(save);
          gameStore.set({ completed: save.completed, unlocked: save.unlocked });
          bus.emit("level:complete", { levelId: fromLevel });
          this.scene.start("Overworld", { justCompleted: fromLevel });
        } else {
          this.scene.start(this.returnScene);
        }
      });
    });
  }

  /** Death → short fade → full-state restart with full hearts. The failed
   *  attempt is counted for the silent assist (session + persisted). */
  protected afterDeath(): void {
    SESSION_FAILS.set(this.bossDef.id, (SESSION_FAILS.get(this.bossDef.id) ?? 0) + 1);
    // The training dummy is debug-only and outside the BossId union — its
    // assist stays session-scoped; real bosses persist their death count.
    if (this.bossDef.id !== "training-dummy") {
      persistSave(recordDeath(loadSave(), this.bossDef.id as BossId));
    }
    const cam = this.cameras.main;
    cam.fadeOut(FADE_MS, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart(this.arenaData);
    });
  }

  // ── store sync ──────────────────────────────────────────────────────────────

  private lastActions = "";
  private syncActions(force: boolean): void {
    const now = this.time.now;
    const fracs = this.combat.cooldownFracs(now);
    const dash = fracFromReadyAt(now, this.dashStartedAt + PHYSICS.dashCooldownMs, PHYSICS.dashCooldownMs);
    const context = gameStore.get().rtActions.context; // mechanics-owned slot
    const next = {
      attack: { cooldownFrac: round2(fracs.attack) },
      dash: { cooldownFrac: round2(dash) },
      parry: { cooldownFrac: round2(fracs.parry) },
      context,
    };
    const key = JSON.stringify(next);
    if (!force && key === this.lastActions) return; // avoid idle store churn
    this.lastActions = key;
    gameStore.set({ rtActions: next });
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
