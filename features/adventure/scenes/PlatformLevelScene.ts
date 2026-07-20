import Phaser from "phaser";
import { TILE, ZOOM, PHYSICS, PLAYER_BASE } from "../config";
import type { LevelId, BuffId, AbilityId } from "../ids";
import { LEVELS } from "../levels";
import { parseLevel } from "../levels/parse";
import type { LevelDefinition, ParsedLevel, Pt } from "../levels/types";
import { registerSprites, frameKey, animKey } from "../art/textures";
import type { SpriteDef } from "../art/textures";
import { PLAYER_SPRITES } from "../art/sprites/player";
import {
  FIELDS_TILES, FIELDS_PARALLAX, FIELD_TILE_KEYS, FIELD_PARALLAX_KEYS,
} from "../art/sprites/tiles-fields";
import {
  HARBOR_TILES, HARBOR_PARALLAX, HARBOR_BOAT_SPRITE, HARBOR_TILE_KEYS,
  HARBOR_PARALLAX_KEYS, HARBOR_BOAT_KEY, HARBOR_WATER_ANIM, HARBOR_FAKE_ANIM,
} from "../art/sprites/tiles-harbor";
import {
  FACTORY_TILES, FACTORY_PARALLAX, FACTORY_TILE_KEYS, FACTORY_PARALLAX_KEYS,
  FACTORY_MOLTEN_ANIM, FACTORY_CONVEYOR_ANIM, FACTORY_LASER_ANIM, FACTORY_BEAM_ANIM,
} from "../art/sprites/tiles-factory";
import { ENEMY_SPRITES } from "../art/sprites/enemies1";
import { ENEMIES2_SPRITES } from "../art/sprites/enemies2";
import { ENEMIES3_SPRITES } from "../art/sprites/enemies3";
import { PICKUP_SPRITES, pickupKeyFor } from "../art/sprites/pickups";
import { audio } from "../audio/synth";
import { bus } from "../bridge/EventBus";
import { gameStore } from "../bridge/GameStore";
import { startCombat, registerCombatGame } from "../combat/controller";
import { collectMemoryFragment, loadSave, markIntroSeen, persistSave } from "../state/save";
import { openDialogue } from "../dialogue/dialogueController";
import { input } from "../input/InputState";
import { mergeRowRuns, runToRect, topExposed } from "./levelGeometry";
import { shouldClipAscent, movementLocked } from "./controllerGates";
import { Enemy, type EnemyHostScene } from "../enemies/Enemy";
import { Bugling } from "../enemies/Bugling";
import { MalwareBat } from "../enemies/MalwareBat";
import { Phishling, ANALYZE_RANGE_PX } from "../enemies/Phishling";
import { BruteForceBrute } from "../enemies/BruteForceBrute";
import { FirewallKnight } from "../enemies/FirewallKnight";
import { RootkitSlime } from "../enemies/RootkitSlime";
import { resolvePlayerContact, applyRestompWindow } from "../enemies/enemyLogic";
import type { DropItem } from "../enemies/drops";

const KNOCKBACK_MS = 180;

// Fake-platform + boat tuning (Task 18). Fakes flicker within 24px, collapse
// 300ms after being stood on, and reappear 2s later. Boats ferry ±64px from
// home at a steady velocity (~1.5s each way) and carry a rider by delta-x.
const FAKE_PROXIMITY_PX = 24;
const FAKE_COLLAPSE_MS = 300;
const FAKE_RESPAWN_MS = 2000;
const FAKE_H = 8; // 16x8 one-way look-alike
const BOAT_W = 32;
const BOAT_AMPLITUDE = 64;
const BOAT_SPEED = (BOAT_AMPLITUDE * 2) / 1.5 / 1000; // px/ms, ~1.5s from end to end

type Body = Phaser.Physics.Arcade.Body;

/** Per-theme tile/parallax wiring. Keeps buildTiles/buildParallax generic so a
 *  new world only adds a tileset module + a branch here (Task 18: harbor). */
interface ThemeTiles {
  register: SpriteDef[];
  parallax: { key: string; depth: number; factor: number }[];
  ground: string;
  groundFill: string;
  oneWay: string;
  hazard: string;
  /** When set, hazard cells render as animated sprites playing this anim
   *  (harbor code-water / factory molten) rather than a static image. */
  hazardAnim?: string;
  fakeKey: string;
  fakeAnim?: string;
  boatKey: string;
  // Factory-only hazard-set tiles (Task 19); undefined in other themes, where
  // the parser yields no conveyors/gates/lasers so they are never referenced.
  conveyorKey?: string;
  conveyorAnim?: string;
  gateKey?: string;
  laserEmitterKey?: string;
  laserAnim?: string;
  laserBeamKey?: string;
  laserBeamAnim?: string;
}

function themeTilesFor(theme: LevelDefinition["theme"]): ThemeTiles {
  if (theme === "harbor") {
    return {
      register: [...HARBOR_PARALLAX, ...HARBOR_TILES, HARBOR_BOAT_SPRITE],
      parallax: [
        { key: HARBOR_PARALLAX_KEYS.bg0, depth: -30, factor: 0.2 },
        { key: HARBOR_PARALLAX_KEYS.bg1, depth: -20, factor: 0.4 },
        { key: HARBOR_PARALLAX_KEYS.bg2, depth: -10, factor: 0.55 },
      ],
      ground: HARBOR_TILE_KEYS.ground,
      groundFill: HARBOR_TILE_KEYS.groundFill,
      oneWay: HARBOR_TILE_KEYS.oneWay,
      hazard: HARBOR_TILE_KEYS.water,
      hazardAnim: HARBOR_WATER_ANIM,
      fakeKey: HARBOR_TILE_KEYS.fake,
      fakeAnim: HARBOR_FAKE_ANIM,
      boatKey: HARBOR_BOAT_KEY,
    };
  }
  if (theme === "factory") {
    return {
      register: [...FACTORY_PARALLAX, ...FACTORY_TILES],
      parallax: [
        { key: FACTORY_PARALLAX_KEYS.bg0, depth: -30, factor: 0.2 },
        { key: FACTORY_PARALLAX_KEYS.bg1, depth: -20, factor: 0.4 },
        { key: FACTORY_PARALLAX_KEYS.bg2, depth: -10, factor: 0.6 },
      ],
      ground: FACTORY_TILE_KEYS.ground,
      groundFill: FACTORY_TILE_KEYS.groundFill,
      oneWay: FACTORY_TILE_KEYS.oneWay,
      hazard: FACTORY_TILE_KEYS.molten,
      hazardAnim: FACTORY_MOLTEN_ANIM,
      fakeKey: FACTORY_TILE_KEYS.oneWay, // no fakes/boats in factory levels
      boatKey: FACTORY_TILE_KEYS.oneWay,
      conveyorKey: FACTORY_TILE_KEYS.conveyor,
      conveyorAnim: FACTORY_CONVEYOR_ANIM,
      gateKey: FACTORY_TILE_KEYS.gate,
      laserEmitterKey: FACTORY_TILE_KEYS.laserEmitter,
      laserAnim: FACTORY_LASER_ANIM,
      laserBeamKey: FACTORY_TILE_KEYS.laserBeam,
      laserBeamAnim: FACTORY_BEAM_ANIM,
    };
  }
  // Default: Bug Fields (Task 6). No fakes/boats are authored in fields levels,
  // so fakeKey/boatKey fall back to the one-way tile and are never referenced.
  return {
    register: [...FIELDS_PARALLAX, ...FIELDS_TILES],
    parallax: [
      { key: FIELD_PARALLAX_KEYS.bg0, depth: -30, factor: 0.2 },
      { key: FIELD_PARALLAX_KEYS.bg1, depth: -20, factor: 0.35 },
      { key: FIELD_PARALLAX_KEYS.bg2, depth: -10, factor: 0.5 },
    ],
    ground: FIELD_TILE_KEYS.ground,
    groundFill: FIELD_TILE_KEYS.groundFill,
    oneWay: FIELD_TILE_KEYS.oneWay,
    hazard: FIELD_TILE_KEYS.hazard,
    fakeKey: FIELD_TILE_KEYS.oneWay,
    boatKey: FIELD_TILE_KEYS.oneWay,
  };
}

interface FakePlatform {
  sprite: Phaser.GameObjects.Sprite;
  rect: Phaser.GameObjects.Rectangle;
  cx: number;
  topY: number;
  glow?: Phaser.GameObjects.Rectangle;
  vanishAt: number | null;
  respawnAt: number | null;
  gone: boolean;
}

interface Boat {
  sprite: Phaser.Physics.Arcade.Sprite;
  home: number;
  prevX: number;
  dir: 1 | -1;
}

interface Gate {
  rect: Phaser.GameObjects.Rectangle;
  sprite: Phaser.GameObjects.Sprite;
}

interface Laser {
  emitter: Phaser.GameObjects.Sprite;
  beamSprite: Phaser.GameObjects.Sprite;
  beamRect: Phaser.GameObjects.Rectangle;
  disabledUntil: number;
}

// Factory hazard-set tuning (Task 19). Conveyors add ±60px/s to grounded
// entities; gates cycle 1.6s closed / 1.6s open; lasers cycle 1.2s on / 0.8s
// off and an attacked emitter goes dark for 4s.
const CONVEYOR_PUSH = 60;
const GATE_HALF_MS = 1600;
const GATE_PERIOD_MS = GATE_HALF_MS * 2;
const LASER_ON_MS = 1200;
const LASER_PERIOD_MS = LASER_ON_MS + 800;
const LASER_DISABLE_MS = 4000;
const BEAM_W = 6;

export interface LevelSceneData {
  levelId: LevelId;
  spawnAt?: "start" | "checkpoint" | "door";
}

const IFRAMES_MS = 900;
const RESPAWN_IFRAMES_MS = 600;
const HURT_ANIM_MS = 300;
const ATTACK_MS = 220;
const DEATH_MS = 750;

export class PlatformLevelScene extends Phaser.Scene implements EnemyHostScene {
  private def!: LevelDefinition;
  private lvl!: ParsedLevel;
  private player!: Phaser.Physics.Arcade.Sprite;

  public mapWidthPx = 0; // public: EnemyHostScene exposes it for spawn clamping
  private mapHeightPx = 0;

  // controller timing state
  private lastGroundedAt = -Infinity;
  private jumpQueuedAt = -Infinity;
  private jumpFiredAt = -Infinity;
  private knockbackUntil = -Infinity;
  private dashing = false;
  private dashStartedAt = -Infinity;
  private attacking = false;
  private attackUntil = -Infinity;
  /** Timestamp of the player's last stomp (Fix 4: same-frame double-contact
   *  guard — see applyRestompWindow / onEnemyContact). */
  private lastStompAt = -Infinity;
  private iframesUntil = -Infinity;
  private hurtAnimUntil = -Infinity;
  private dead = false;
  private speedScale = 1;
  private abilities: Record<AbilityId, boolean> = { dash: false, analyze: false, improvedParry: false };

  // health / progression
  private health: number = PLAYER_BASE.maxHealth;
  private maxHealth: number = PLAYER_BASE.maxHealth;
  private buffs: BuffId[] = [];
  private fragments = 0;
  private lastCheckpoint: Pt = { tx: 0, ty: 0 };
  private latchedCheckpoints = new Set<string>();
  private fragmentCollected = false;

  // proximity flags recomputed each frame
  private nearDoor = false;
  private nearFragment = false;

  // scene objects
  private theme!: ThemeTiles;
  private hazardGroup!: Phaser.Physics.Arcade.StaticGroup;
  private solidGroup!: Phaser.Physics.Arcade.StaticGroup;
  private oneWayGroup!: Phaser.Physics.Arcade.StaticGroup;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private pickupGroup!: Phaser.Physics.Arcade.Group;
  private projectileGroup!: Phaser.Physics.Arcade.Group;
  private fakeGroup!: Phaser.Physics.Arcade.StaticGroup;
  private boatGroup!: Phaser.Physics.Arcade.Group;
  private gateGroup!: Phaser.Physics.Arcade.StaticGroup;
  private laserBeamGroup!: Phaser.Physics.Arcade.StaticGroup;
  private laserEmitterGroup!: Phaser.Physics.Arcade.StaticGroup;
  private fakes: FakePlatform[] = [];
  private boats: Boat[] = [];
  private gates: Gate[] = [];
  private lasers: Laser[] = [];
  /** Conveyor cells keyed "tx,ty" -> push direction (Task 19 factory). */
  private conveyorDir = new Map<string, 1 | -1>();
  /** Monotonic swing id so one attack lands one hit per enemy (multi-hp). */
  private attackSwingId = 0;
  /** Persistent attack hitbox: one zone + one overlap for the level's whole
   *  lifetime (created once in create()). doAttack() repositions it and flips
   *  its body on/off rather than creating+destroying a Collider per swing —
   *  that used to leak a dead Collider into the world's collider list on every
   *  attack. Phaser's Arcade World skips overlap checks for disabled bodies
   *  (see World.js separate(): `!body1.enable || !body2.enable` short-circuits
   *  before any callback runs), so a disabled body is a true no-op, not just a
   *  visual/positional hide. */
  private attackHitbox!: Phaser.GameObjects.Zone;
  private fragmentSprite?: Phaser.GameObjects.GameObject;
  private checkpointMarkers: { pt: Pt; obj: Phaser.GameObjects.Rectangle }[] = [];
  private bg: { sprite: Phaser.GameObjects.TileSprite; factor: number }[] = [];
  private pausedText?: Phaser.GameObjects.Text;
  private detachInput?: () => void;

  constructor() {
    super("Level");
  }

  create(data: LevelSceneData) {
    // Phaser reuses this scene instance for every level. All GameObjects from
    // the previous run were destroyed on SHUTDOWN, but these arrays still hold
    // references to them — a stale fake-platform timer firing in the NEXT
    // level would touch a destroyed body and crash the frame loop. Reset all
    // accumulated collections before building anything.
    this.fakes = [];
    this.boats = [];
    this.gates = [];
    this.lasers = [];
    this.conveyorDir = new Map();
    this.bg = [];
    this.checkpointMarkers = [];

    const def = LEVELS[data.levelId];
    if (!def) throw new Error(`unknown level ${data.levelId}`);
    this.def = def;
    this.lvl = parseLevel(def);
    this.mapWidthPx = this.lvl.widthTiles * TILE;
    this.mapHeightPx = this.lvl.heightTiles * TILE;

    // Save check (before buildTiles): a fragment collected in a prior
    // session must not spawn again — read this ahead of buildTiles() so its
    // fragment-sprite block can skip the spawn entirely. Read once and reuse
    // below for the level-intro seenIntros check too.
    const save = loadSave();
    this.fragmentCollected = save.memoryFragments.includes(def.id);

    // Per-theme tile/parallax wiring (fields vs harbor).
    this.theme = themeTilesFor(def.theme);

    // Textures: idempotent — BootScene already registered these, but Level
    // must not assume it ran first (Task 16 will start Level from elsewhere).
    registerSprites(this, [
      PLAYER_SPRITES,
      ...this.theme.register,
      ...ENEMY_SPRITES,
      ...ENEMIES2_SPRITES,
      ...ENEMIES3_SPRITES,
      ...PICKUP_SPRITES,
    ]);

    this.buildParallax();
    this.spawnPlayer(data.spawnAt ?? "start"); // before buildTiles: colliders need the player
    this.buildTiles();
    this.buildFakes(); // fake platforms (Task 18): one-way look-alikes that collapse
    this.buildBoats(); // boats (Task 18): ferrying moving platforms
    this.spawnEnemies(); // after buildTiles: enemies collide with the tile groups
    this.setupAttackHitbox(); // after spawnEnemies: overlap needs enemyGroup
    this.setupProjectiles(); // pooled enemy-projectile group (malware-bat packets)
    this.buildFactoryHazards(); // gates + lasers (after attackHitbox: emitter overlap)
    this.setupCamera();

    // HUD / progression reset for this level.
    this.health = PLAYER_BASE.maxHealth;
    this.maxHealth = PLAYER_BASE.maxHealth;
    this.buffs = [];
    this.fragments = this.fragmentCollected ? 1 : 0; // reflect a prior-session collection in the HUD count
    this.latchedCheckpoints.clear();
    this.abilities = { ...gameStore.get().abilities };
    this.speedScale = this.buffs.includes("cache-boost") ? 1.25 : 1;

    // Positioned at the camera's world midpoint on pause (reliable under zoom,
    // unlike scrollFactor-0 which the camera zoom transform would offset).
    this.pausedText = this.add
      .text(0, 0, "PAUSED — press P to resume", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#c4b5fd",
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setVisible(false);

    gameStore.set({
      scene: "Level",
      paused: false,
      levelBuffs: [],
      hud: {
        health: this.health,
        maxHealth: this.maxHealth,
        buffs: this.buffs,
        fragments: this.fragments,
        levelId: def.id,
      },
    });
    bus.emit("scene:changed", { scene: "Level" });

    // Music: attempt now (no-op if audio still locked), and guarantee it
    // starts on the first user gesture. synth.playTrack() calls unlock()
    // internally, but a create-time call before any gesture leaves the
    // AudioContext suspended (browser autoplay policy) — no audible track —
    // so the pointerdown handler restarts it cleanly once resumed.
    audio.playTrack(def.music);
    this.input.once("pointerdown", () => {
      audio.unlock();
      audio.playTrack(def.music);
    });

    this.detachInput = input.attachKeyboard();
    input.consume();

    // Combat resume (e.g. a boss victory that just granted `dash`) doesn't
    // re-run create() — Phaser only fires RESUME on the paused scene instance
    // — so the abilities snapshot above would otherwise go stale until a full
    // scene restart. Re-read the store every time this scene resumes.
    const onResume = () => {
      this.abilities = { ...gameStore.get().abilities };
    };
    this.events.on(Phaser.Scenes.Events.RESUME, onResume);

    // Dialogue (Task 17): freeze Arcade physics while a Dialogue overlay is
    // up, independent of the P/Esc `paused` toggle (see the dialogue gate at
    // the top of update() for why the two must stay separate flags — reusing
    // `paused` would let Escape silently resume the world out from under an
    // open dialogue, since that toggle's own branch knows nothing about
    // dialogue and Dialogue.tsx treats Space/Enter/E as "advance the line").
    // update()'s early-return below already stops player/enemy logic; this
    // stops Arcade's own gravity/velocity step, which runs independently of
    // this scene's update() body every frame.
    const offDialogueOpen = bus.on("dialogue:open", () => this.physics.pause());
    const offDialogueClosed = bus.on("dialogue:closed", () => {
      this.physics.resume();
      // The Space/E press that closed the dialogue also set InputState's
      // one-shot flags in the same tick; clear them so the next update()
      // frame doesn't turn a dialogue-close into a jump or interact.
      input.consume();
    });

    // Level intro: plays intro-<levelId> once per save (seenIntros persisted
    // in the save — additive field, see state/save.ts's AdventureSave doc
    // comment). A level with no authored intro script yet (openDialogue
    // returns false) is a silent no-op and nothing is marked seen, so it can
    // play once a script lands.
    if (!save.seenIntros.includes(def.id)) {
      if (openDialogue(`intro-${def.id}`)) persistSave(markIntroSeen(loadSave(), def.id));
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.detachInput?.();
      this.events.off(Phaser.Scenes.Events.RESUME, onResume);
      offDialogueOpen();
      offDialogueClosed();
    });
  }

  // --- build ----------------------------------------------------------------

  private buildParallax() {
    // World-covering tileSprites (scrollFactor 1, no edge gaps, zoom-safe);
    // tilePositionX is driven each frame to fake depth (see update()).
    for (const l of this.theme.parallax) {
      const sprite = this.add
        .tileSprite(0, 0, this.mapWidthPx, this.mapHeightPx, l.key)
        .setOrigin(0, 0)
        .setDepth(l.depth);
      this.bg.push({ sprite, factor: l.factor });
    }
  }

  private buildTiles() {
    const { solids, oneWays, hazards } = this.lvl;

    // Conveyor lookup (Task 19): a conveyor cell is a solid the entity rides on,
    // rendered as an animated belt instead of plain ground.
    for (const c of this.lvl.conveyors) this.conveyorDir.set(`${c.at.tx},${c.at.ty}`, c.dir);

    // Visual tile images (one per set cell). A solid draws the grass-lip GROUND
    // only when its top face is exposed; covered cells in a stack draw the
    // lip-less GROUND_FILL so grass shows on the crown, not through the soil.
    for (let ty = 0; ty < this.lvl.heightTiles; ty++) {
      for (let tx = 0; tx < this.lvl.widthTiles; tx++) {
        const cx = tx * TILE + TILE / 2;
        const cy = ty * TILE + TILE / 2;
        const convDir = this.conveyorDir.get(`${tx},${ty}`);
        if (convDir && this.theme.conveyorKey) {
          const belt = this.add.sprite(cx, cy, frameKey(this.theme.conveyorKey, 0)).setDepth(0);
          if (this.theme.conveyorAnim)
            belt.play(animKey(this.theme.conveyorKey, this.theme.conveyorAnim));
          belt.setFlipX(convDir < 0); // authored pointing right; flip for left
        } else if (solids[ty][tx]) {
          const key = topExposed(solids, tx, ty) ? this.theme.ground : this.theme.groundFill;
          this.add.image(cx, cy, key).setDepth(0);
        } else if (oneWays[ty][tx]) this.add.image(cx, cy, this.theme.oneWay).setDepth(0);
        else if (hazards[ty][tx]) {
          if (this.theme.hazardAnim) {
            // Animated hazard (harbor code-water): a Sprite playing its wave anim.
            const water = this.add.sprite(cx, cy, frameKey(this.theme.hazard, 0)).setDepth(1);
            water.play(animKey(this.theme.hazard, this.theme.hazardAnim));
          } else this.add.image(cx, cy, this.theme.hazard).setDepth(1);
        }
      }
    }

    // Solid collision: merged horizontal runs -> invisible static bodies.
    this.solidGroup = this.physics.add.staticGroup();
    for (const run of mergeRowRuns(solids)) {
      const r = runToRect(run, TILE);
      const rect = this.add.rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h).setVisible(false);
      this.solidGroup.add(rect);
    }

    // One-ways: merged the same way; only the top face blocks (jump-through).
    this.oneWayGroup = this.physics.add.staticGroup();
    for (const run of mergeRowRuns(oneWays)) {
      const r = runToRect(run, TILE);
      const rect = this.add.rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h).setVisible(false);
      this.oneWayGroup.add(rect);
      const body = rect.body as Phaser.Physics.Arcade.StaticBody;
      body.checkCollision.down = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;
    }

    // Hazards: merged runs -> overlap-only static zones.
    this.hazardGroup = this.physics.add.staticGroup();
    for (const run of mergeRowRuns(hazards)) {
      const r = runToRect(run, TILE);
      const rect = this.add.rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h).setVisible(false);
      this.hazardGroup.add(rect);
    }

    // Fragment collectible — skip entirely if a prior session already
    // collected this level's fragment (this.fragmentCollected is read from
    // the save before buildTiles() runs; see create()).
    if (this.lvl.fragment && !this.fragmentCollected) {
      const f = this.lvl.fragment;
      this.fragmentSprite = this.add
        .rectangle(f.tx * TILE + TILE / 2, f.ty * TILE + TILE / 2, 8, 8, 0xffd75e)
        .setDepth(2)
        .setAngle(45);
    }

    // Boss door marker.
    const d = this.lvl.bossDoor;
    this.add.rectangle(d.tx * TILE + TILE / 2, d.ty * TILE + TILE / 2, 12, 20, 0x5b3fb8).setDepth(2);

    // Checkpoint flags (raise on latch).
    for (const cp of this.lvl.checkpoints) {
      const obj = this.add
        .rectangle(cp.tx * TILE + TILE / 2, cp.ty * TILE + TILE - 6, 4, 12, 0x8b6cf0)
        .setDepth(2);
      this.checkpointMarkers.push({ pt: cp, obj });
    }

    this.setupColliders();
  }

  private setupColliders() {
    this.physics.add.collider(this.player, this.solidGroup);
    this.physics.add.collider(this.player, this.oneWayGroup);
    this.physics.add.overlap(this.player, this.hazardGroup, () => this.onHazard(), undefined, this);
  }

  // --- fake platforms (Task 18) ---------------------------------------------

  /** Fake platforms: 16x8 one-way look-alikes that shimmer (the "shortcut"
   *  lure), flicker as the player nears, then collapse 300ms after being stood
   *  on and reappear 2s later. A cyan glow dot below each one hints at the safe
   *  route (real dock / boat) beneath — decoration, not a map legend char. */
  private buildFakes() {
    this.fakeGroup = this.physics.add.staticGroup();
    for (const f of this.lvl.fakes) {
      const cx = f.tx * TILE + TILE / 2;
      const topY = f.ty * TILE; // platform top face = top of the tile cell
      const sprite = this.add
        .sprite(cx, topY + FAKE_H / 2, frameKey(this.theme.fakeKey, 0))
        .setDepth(2);
      if (this.theme.fakeAnim) sprite.play(animKey(this.theme.fakeKey, this.theme.fakeAnim));

      // One-way collision body: only the top face blocks (jump-through look-alike).
      const rect = this.add.rectangle(cx, topY + FAKE_H / 2, TILE, FAKE_H).setVisible(false);
      this.fakeGroup.add(rect);
      const body = rect.body as Phaser.Physics.Arcade.StaticBody;
      body.checkCollision.down = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;

      const glow = this.add
        .rectangle(cx, topY + TILE * 2, 3, 3, 0x6ec1ff)
        .setDepth(2)
        .setAlpha(0.8);
      this.tweens.add({
        targets: glow, alpha: 0.25, y: topY + TILE * 2 + 4,
        duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut",
      });

      this.fakes.push({ sprite, rect, cx, topY, glow, vanishAt: null, respawnAt: null, gone: false });
    }
    this.physics.add.collider(this.player, this.fakeGroup);
  }

  private updateFakes() {
    const now = this.time.now;
    const pb = this.player.body as Body;
    for (const fk of this.fakes) {
      if (fk.gone) {
        if (fk.respawnAt !== null && now >= fk.respawnAt) this.respawnFake(fk);
        continue;
      }
      // Flicker when the player is close.
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, fk.cx, fk.topY);
      fk.sprite.setAlpha(dist <= FAKE_PROXIMITY_PX ? 0.55 + 0.45 * Math.sin(now / 55) : 1);

      // Standing-on detection: feet on the top face, horizontally overlapping.
      const standing =
        pb.blocked.down &&
        Math.abs(pb.bottom - fk.topY) < 6 &&
        Math.abs(this.player.x - fk.cx) < TILE / 2 + 2;
      if (standing && fk.vanishAt === null) fk.vanishAt = now + FAKE_COLLAPSE_MS;
      if (fk.vanishAt !== null && now >= fk.vanishAt) this.collapseFake(fk);
    }
  }

  private collapseFake(fk: FakePlatform) {
    fk.gone = true;
    fk.vanishAt = null;
    fk.respawnAt = this.time.now + FAKE_RESPAWN_MS;
    (fk.rect.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    fk.sprite.setVisible(false);
    audio.sfx("error");
  }

  private respawnFake(fk: FakePlatform) {
    fk.gone = false;
    fk.respawnAt = null;
    (fk.rect.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    fk.sprite.setVisible(true).setAlpha(1);
  }

  // --- boats (Task 18) ------------------------------------------------------

  /** Boats: 32x16 one-way moving platforms that ferry ±64px from home at a
   *  steady velocity (~1.5s each way). The rider is carried by delta-x each
   *  frame (see updateBoats) — arcade one-way bodies don't transfer horizontal
   *  motion, so we add the boat's per-frame dx to the player while they stand
   *  on it. Velocity (not a tween) drives the boat so its body position stays
   *  in sync for the delta read. */
  private buildBoats() {
    this.boatGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const b of this.lvl.boats) {
      const cx = b.tx * TILE + TILE / 2;
      const cy = b.ty * TILE + TILE / 2;
      const sprite = this.boatGroup.create(cx, cy, this.theme.boatKey) as Phaser.Physics.Arcade.Sprite;
      sprite.setDepth(4);
      const body = sprite.body as Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.checkCollision.down = false; // one-way: ride the deck, pass from below
      body.checkCollision.left = false;
      body.checkCollision.right = false;
      body.setVelocityX(BOAT_SPEED * 1000); // px/s
      this.boats.push({ sprite, home: cx, prevX: cx, dir: 1 });
    }
    this.physics.add.collider(this.player, this.boatGroup);
  }

  private updateBoats() {
    for (const boat of this.boats) {
      const sp = boat.sprite;
      const body = sp.body as Body;
      // Reverse at the ±amplitude extremes.
      if (boat.dir === 1 && sp.x >= boat.home + BOAT_AMPLITUDE) {
        boat.dir = -1;
        body.setVelocityX(-BOAT_SPEED * 1000);
      } else if (boat.dir === -1 && sp.x <= boat.home - BOAT_AMPLITUDE) {
        boat.dir = 1;
        body.setVelocityX(BOAT_SPEED * 1000);
      }
      // Delta-x carry: add the boat's movement to a rider standing on its deck.
      const dx = sp.x - boat.prevX;
      if (dx !== 0 && this.isRidingBoat(body)) this.player.x += dx;
      boat.prevX = sp.x;
    }
  }

  private isRidingBoat(boatBody: Body): boolean {
    const pb = this.player.body as Body;
    const onTop = pb.blocked.down && Math.abs(pb.bottom - boatBody.top) < 6;
    const xOverlap = pb.right > boatBody.left + 2 && pb.left < boatBody.right - 2;
    return onTop && xOverlap;
  }

  // --- factory hazard set (Task 19) -----------------------------------------

  /** Build timed gates (16x32 barriers that cycle solid/open) and laser
   *  emitters (floor devices firing an upward beam that cycles on/off and can
   *  be knocked out for 4s by attacking the emitter). No-op unless the theme
   *  wires the keys (factory only) — other themes parse zero of these markers. */
  private buildFactoryHazards() {
    this.gateGroup = this.physics.add.staticGroup();
    this.laserBeamGroup = this.physics.add.staticGroup();
    this.laserEmitterGroup = this.physics.add.staticGroup();

    // Timed gates: a 16x32 barrier over the marker cell and the one below it.
    if (this.theme.gateKey) {
      for (const g of this.lvl.gates) {
        const cx = g.tx * TILE + TILE / 2;
        const topY = g.ty * TILE;
        const cy = topY + TILE; // centre of a 32px-tall barrier
        const sprite = this.add.sprite(cx, cy, frameKey(this.theme.gateKey, 0)).setDepth(2);
        const rect = this.add.rectangle(cx, cy, TILE, TILE * 2).setVisible(false);
        this.gateGroup.add(rect);
        this.gates.push({ rect, sprite });
      }
      this.physics.add.collider(this.player, this.gateGroup);
    }

    // Laser emitters: floor-mounted, beam projects up to the first solid above.
    if (this.theme.laserEmitterKey && this.theme.laserBeamKey) {
      for (const l of this.lvl.lasers) {
        const cx = l.tx * TILE + TILE / 2;
        const cy = l.ty * TILE + TILE / 2;
        const emitter = this.add.sprite(cx, cy, frameKey(this.theme.laserEmitterKey, 0)).setDepth(4);
        if (this.theme.laserAnim)
          emitter.play(animKey(this.theme.laserEmitterKey, this.theme.laserAnim));
        this.laserEmitterGroup.add(emitter);

        // Beam column: up from the top of the emitter cell to the first solid.
        let r = l.ty - 1;
        while (r >= 0 && !this.lvl.solids[r][l.tx]) r--;
        const beamTopPx = (r + 1) * TILE;
        const beamBottomPx = l.ty * TILE;
        const beamH = Math.max(TILE, beamBottomPx - beamTopPx);
        const beamCy = (beamTopPx + beamBottomPx) / 2;
        const beamSprite = this.add
          .sprite(cx, beamCy, frameKey(this.theme.laserBeamKey, 0))
          .setDepth(3)
          .setDisplaySize(BEAM_W, beamH);
        if (this.theme.laserBeamAnim)
          beamSprite.play(animKey(this.theme.laserBeamKey, this.theme.laserBeamAnim));
        const beamRect = this.add.rectangle(cx, beamCy, BEAM_W, beamH).setVisible(false);
        this.laserBeamGroup.add(beamRect);

        const laser: Laser = { emitter, beamSprite, beamRect, disabledUntil: -Infinity };
        emitter.setData("laser", laser);
        this.lasers.push(laser);
      }
      this.physics.add.overlap(this.player, this.laserBeamGroup, () => this.onHazard());
      // Attacking an emitter knocks its beam out for LASER_DISABLE_MS.
      this.physics.add.overlap(this.attackHitbox, this.laserEmitterGroup, (_hb, emitterObj) => {
        const laser = (emitterObj as Phaser.GameObjects.Sprite).getData("laser") as Laser | undefined;
        if (!laser) return;
        if (this.time.now >= laser.disabledUntil - LASER_DISABLE_MS + 200) audio.sfx("crit");
        laser.disabledUntil = this.time.now + LASER_DISABLE_MS;
      });
    }
  }

  private updateGates() {
    if (this.gates.length === 0) return;
    const closed = this.time.now % GATE_PERIOD_MS < GATE_HALF_MS;
    for (const gate of this.gates) {
      (gate.rect.body as Phaser.Physics.Arcade.StaticBody).enable = closed;
      gate.sprite.setTexture(frameKey(this.theme.gateKey!, closed ? 0 : 1));
    }
  }

  private updateLasers() {
    if (this.lasers.length === 0) return;
    const cycleOn = this.time.now % LASER_PERIOD_MS < LASER_ON_MS;
    for (const laser of this.lasers) {
      const on = cycleOn && this.time.now >= laser.disabledUntil;
      laser.beamSprite.setVisible(on);
      (laser.beamRect.body as Phaser.Physics.Arcade.StaticBody).enable = on;
      laser.emitter.setAlpha(this.time.now < laser.disabledUntil ? 0.4 : 1);
    }
  }

  /** Conveyors add ±60px/s to any grounded entity (player + enemies) standing
   *  on a conveyor cell, layered on top of its own movement velocity. */
  private applyConveyors() {
    if (this.conveyorDir.size === 0) return;
    this.pushIfOnConveyor(this.player);
    for (const obj of this.enemyGroup.getChildren())
      this.pushIfOnConveyor(obj as Phaser.Physics.Arcade.Sprite);
  }

  private pushIfOnConveyor(sprite: Phaser.Physics.Arcade.Sprite) {
    const body = sprite.body as Body | null;
    if (!body || !body.blocked.down) return;
    const tx = Math.floor(sprite.x / TILE);
    const ty = Math.floor((body.bottom + 1) / TILE);
    const dir = this.conveyorDir.get(`${tx},${ty}`);
    if (dir) body.velocity.x += dir * CONVEYOR_PUSH;
  }

  // --- enemy projectiles (Task 18) ------------------------------------------

  /** Pooled 4x4 hazard packets (malware-bat fire). One group + one collider +
   *  one overlap for the level lifetime; members are recycled via getFirstDead.
   *  A packet despawns on a solid or once older than 2s (checked in update()). */
  private setupProjectiles() {
    this.projectileGroup = this.physics.add.group({ allowGravity: false });
    this.physics.add.collider(this.projectileGroup, this.solidGroup, (proj) =>
      this.despawnProjectile(proj as Phaser.GameObjects.Rectangle),
    );
    this.physics.add.overlap(this.player, this.projectileGroup, (_pl, proj) => {
      this.despawnProjectile(proj as Phaser.GameObjects.Rectangle);
      this.takeDamage(1);
    });
  }

  /** EnemyHostScene: launch a pooled projectile. */
  fireEnemyProjectile(x: number, y: number, vx: number, vy: number) {
    let p = this.projectileGroup.getFirstDead(false) as Phaser.GameObjects.Rectangle | null;
    if (!p) {
      p = this.add.rectangle(x, y, 4, 4, 0xef4444).setDepth(6);
      this.physics.add.existing(p);
      this.projectileGroup.add(p);
    }
    p.setActive(true).setVisible(true);
    const body = p.body as Body;
    body.enable = true;
    body.reset(x, y);
    body.setAllowGravity(false);
    body.setVelocity(vx, vy);
    p.setData("bornAt", this.time.now);
  }

  private despawnProjectile(p: Phaser.GameObjects.Rectangle) {
    if (!p.active) return;
    p.setActive(false).setVisible(false);
    const body = p.body as Body;
    body.stop();
    body.enable = false;
  }

  private updateProjectiles() {
    const now = this.time.now;
    for (const obj of this.projectileGroup.getChildren()) {
      const p = obj as Phaser.GameObjects.Rectangle;
      if (!p.active) continue;
      if (now - (p.getData("bornAt") as number) > 2000) this.despawnProjectile(p);
    }
  }

  // --- enemies + pickups ----------------------------------------------------

  private spawnEnemies() {
    this.enemyGroup = this.physics.add.group();
    for (const s of this.lvl.spawns) {
      const x = s.at.tx * TILE + TILE / 2;
      const y = s.at.ty * TILE + TILE / 2;
      let enemy: Enemy | null = null;
      if (s.kind === "bugling") enemy = new Bugling(this, x, y);
      else if (s.kind === "phishling") enemy = new Phishling(this, x, y);
      else if (s.kind === "malware-bat") enemy = new MalwareBat(this, x, y);
      else if (s.kind === "brute") enemy = new BruteForceBrute(this, x, y);
      else if (s.kind === "firewall-knight") enemy = new FirewallKnight(this, x, y);
      else if (s.kind === "rootkit-slime") enemy = new RootkitSlime(this, x, y);
      if (enemy) this.enemyGroup.add(enemy);
    }

    // All enemies collide with solids; only gravity enemies (walkers) collide
    // with one-ways — floaters (phishling) pass through so lunges aren't caught.
    this.physics.add.collider(this.enemyGroup, this.solidGroup);
    // Enemies respect closed timed gates too — without this a patrolling
    // Brute/Knight walks straight through a visually-solid barrier.
    this.physics.add.collider(this.enemyGroup, this.gateGroup);
    this.physics.add.collider(
      this.enemyGroup,
      this.oneWayGroup,
      undefined,
      (enemyObj) => ((enemyObj as Phaser.Physics.Arcade.Sprite).body as Body).allowGravity,
      this,
    );
    this.physics.add.overlap(this.player, this.enemyGroup, this.onEnemyContact, undefined, this);

    // Pickups: pop up on spawn, land on solids/one-ways, collect on touch.
    this.pickupGroup = this.physics.add.group();
    this.physics.add.collider(this.pickupGroup, this.solidGroup);
    this.physics.add.collider(this.pickupGroup, this.oneWayGroup);
    this.physics.add.overlap(this.player, this.pickupGroup, this.onPickup, undefined, this);
  }

  /** One persistent zone + one overlap for the attack hitbox's whole level
   *  lifetime (Fix 2: previously doAttack() created a fresh overlap Collider
   *  per swing and only ever destroyed the zone, leaking a dead Collider into
   *  the world every attack). Body starts disabled; doAttack() flips it on for
   *  ATTACK_MS then off — a disabled body makes Phaser's Arcade World skip the
   *  overlap check entirely (see the setupAttackHitbox doc above), so the
   *  callback below is a true no-op outside the attack window, not merely
   *  positioned off-screen. */
  private setupAttackHitbox() {
    const hitbox = this.add.zone(0, 0, 14, 18);
    this.physics.add.existing(hitbox);
    const body = hitbox.body as Body;
    body.setAllowGravity(false);
    body.enable = false;
    this.attackHitbox = hitbox;
    this.physics.add.overlap(hitbox, this.enemyGroup, (_hb, enemyObj) => {
      (enemyObj as Enemy).hitByAttack(this.attackSwingId);
    });
  }

  // Falling onto a stompable enemy's top kills it (with a bounce); anything else
  // is contact damage. Stomp-vs-touch decision is the pure resolvePlayerContact,
  // upgraded to a chain-stomp via applyRestompWindow when it lands just after
  // another stomp this same fall (stacked enemies).
  private onEnemyContact: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_p, enemyObj) => {
    const enemy = enemyObj as Enemy;
    if (enemy.dying || this.dead) return;
    const body = this.player.body as Body;
    const raw = resolvePlayerContact(body.velocity.y, this.player.y, enemy.y, enemy.stompable);
    const decision = applyRestompWindow(raw, enemy.stompable, this.time.now, this.lastStompAt);
    if (decision === "stomp") {
      this.lastStompAt = this.time.now;
      enemy.hitByStomp();
    } else enemy.hurtPlayer();
  };

  private onPickup: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_p, pickupObj) => {
    const pickup = pickupObj as Phaser.Physics.Arcade.Sprite;
    const drop = pickup.getData("drop") as DropItem | undefined;
    if (!drop) return;
    if (drop === "heart") {
      this.health = Math.min(this.maxHealth, this.health + 1);
    } else {
      // Buffs stack: every pickup appends, even repeats of the same buff (the
      // HUD groups repeats into one chip with an xN count via countBuffs()).
      this.buffs.push(drop);
      bus.emit("buff:collected", { buff: drop });
      if (drop === "cache-boost") this.speedScale = 1.25; // level-wide move-speed boost
    }
    audio.sfx("collect");
    this.pushHud();
    pickup.destroy();
  };

  /** EnemyHostScene: materialize a dropped pickup with a little pop. */
  spawnPickup(x: number, y: number, drop: DropItem) {
    const pickup = this.pickupGroup.create(x, y, pickupKeyFor(drop)) as Phaser.Physics.Arcade.Sprite;
    pickup.setDepth(3);
    pickup.setData("drop", drop);
    const body = pickup.body as Body;
    body.setAllowGravity(true);
    body.setVelocity(Phaser.Math.Between(-30, 30), -120); // pop out of the corpse
    this.tweens.add({ targets: pickup, scaleX: 1.2, scaleY: 0.85, duration: 120, yoyo: true });
  }

  /** EnemyHostScene: solid-tile lookup in world px (ledge probing). */
  isSolidAt(px: number, py: number): boolean {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (ty < 0 || ty >= this.lvl.heightTiles || tx < 0 || tx >= this.lvl.widthTiles) return false;
    return this.lvl.solids[ty][tx];
  }

  /** EnemyHostScene: apply contact damage (respects iframes/dead internally). */
  damagePlayer(n: number) {
    this.takeDamage(n);
  }

  /** EnemyHostScene: the player sprite (stomp-bounce + phishling targeting). */
  get playerSprite(): Phaser.Physics.Arcade.Sprite {
    return this.player;
  }

  /** EnemyHostScene: add a runtime-spawned enemy (slime split) to the live
   *  group so it inherits the group colliders + the player overlap. */
  registerEnemy(enemy: Enemy) {
    this.enemyGroup.add(enemy);
  }

  /** EnemyHostScene: drop a short-lived corrupt hazard tile (slime burrow). It
   *  joins the hazardGroup so the existing player-overlap damages on contact,
   *  then self-destructs (time events + GameObjects are cleared on shutdown, so
   *  no persistent array to reset). */
  spawnCorruptHazard(x: number, y: number, ttlMs: number) {
    const rect = this.add.rectangle(x, y, 12, 12, 0xa02030).setDepth(6).setAngle(45).setAlpha(0.85);
    this.hazardGroup.add(rect);
    this.tweens.add({ targets: rect, alpha: 0.4, duration: 300, yoyo: true, repeat: -1 });
    this.time.delayedCall(ttlMs, () => rect.destroy());
  }

  private spawnPlayer(spawnAt: "start" | "checkpoint" | "door") {
    let at: Pt = this.lvl.playerStart;
    if (spawnAt === "door") at = this.lvl.bossDoor;
    else if (spawnAt === "checkpoint" && this.lvl.checkpoints.length > 0)
      at = this.lvl.checkpoints[0];
    this.lastCheckpoint = { ...this.lvl.playerStart };

    this.player = this.physics.add.sprite(
      at.tx * TILE + TILE / 2,
      at.ty * TILE + TILE / 2,
      frameKey("player", 0),
    );
    this.player.setDepth(10);
    this.player.play(animKey("player", "idle"));
    const body = this.player.body as Body;
    body.setSize(10, 22);
    body.setOffset(3, 2);
    this.player.setCollideWorldBounds(false);
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.mapWidthPx, this.mapHeightPx);
    cam.setZoom(ZOOM);
    cam.startFollow(this.player, true, 0.12, 0.12);
  }

  // --- update loop (verbatim core) ------------------------------------------

  update(_t: number, dtMs: number) {
    const snap = input.read();

    if (gameStore.get().dialogue) {
      // A Dialogue overlay owns the screen (level intro / fragment note) —
      // freeze the world exactly like the `paused` branch below, but gated
      // on its own flag (see the dialogue:open/:closed listeners in create()
      // for why `paused` itself is deliberately not reused here). No P/Esc
      // escape hatch on this branch — the dialogue is dismissed by advancing
      // or SKIP (Dialogue.tsx), not by the pause key.
      input.consume();
      return;
    }

    if (gameStore.get().paused) {
      // Consume input while paused; P/Esc toggles back out (no soft-lock).
      if (snap.pausePressed) {
        gameStore.set({ paused: false });
        this.pausedText?.setVisible(false);
        this.physics.resume(); // unfreeze enemies/pickups
      }
      input.consume();
      return;
    }

    // Parallax scroll (depth illusion; scrollFactor-1 sprites cover the world).
    const cam = this.cameras.main;
    for (const layer of this.bg) layer.sprite.tilePositionX = -cam.scrollX * (1 - layer.factor);

    if (this.dead) {
      input.consume();
      return;
    }

    const body = this.player.body as Body;
    const onGround = body.blocked.down;

    if (onGround) this.lastGroundedAt = this.time.now;
    if (snap.jumpPressed) this.jumpQueuedAt = this.time.now;

    const canCoyote = this.time.now - this.lastGroundedAt <= PHYSICS.coyoteMs;
    const buffered = this.time.now - this.jumpQueuedAt <= PHYSICS.jumpBufferMs;
    if (buffered && canCoyote && !this.dashing) {
      body.setVelocityY(PHYSICS.jumpVelocity);
      this.jumpFiredAt = this.time.now;
      this.jumpQueuedAt = -Infinity;
      this.lastGroundedAt = -Infinity;
      audio.sfx("jump");
    }
    // variable jump height: releasing early clips ascent — but never during
    // knockback (would cancel the damage pop) or within the tap-jump grace.
    if (
      shouldClipAscent(this.time.now, this.jumpFiredAt, snap.jumpHeld, body.velocity.y, this.knockbackUntil)
    )
      body.setVelocityY(-120);

    // Player-driven horizontal movement / dash / flip are suppressed while a
    // knockback impulse is in effect, so the -80/-160 damage pop and -200
    // hazard bounce survive instead of being overwritten the next frame.
    const inKnockback = movementLocked(this.time.now, this.knockbackUntil);
    const dir = (snap.right ? 1 : 0) - (snap.left ? 1 : 0);
    if (this.dashing) {
      if (this.time.now - this.dashStartedAt > PHYSICS.dashMs) this.dashing = false;
    } else if (!inKnockback) {
      body.setVelocityX(dir * PHYSICS.moveSpeed * this.speedScale); // cache-boost sets speedScale 1.25
      if (dir !== 0) this.player.setFlipX(dir < 0);
      const dashReady = this.time.now - this.dashStartedAt > PHYSICS.dashCooldownMs;
      if (snap.dashPressed && dashReady && this.abilities.dash && dir !== 0) {
        this.dashing = true;
        this.dashStartedAt = this.time.now;
        body.setVelocityX(dir * PHYSICS.dashSpeed);
        body.setVelocityY(0);
        audio.sfx("dash");
      }
    }

    if (this.attacking && this.time.now > this.attackUntil) this.attacking = false;

    this.updateProximity();
    this.updateCheckpoints();

    this.playAnimFor(body, onGround); // idle/run/jump/fall by velocity, unless attacking/hurt
    if (snap.attackPressed && !this.attacking) this.doAttack(); // 220ms hitbox 14x18 in front, sfx
    if (snap.interactPressed) this.tryInteract(); // door / fragment / analyze exploit

    // Drive enemy AI (patrol, phishling state machine, particles). Frozen while
    // paused because we return above before reaching here.
    for (const obj of this.enemyGroup.getChildren()) (obj as Enemy).tick(dtMs);

    // Task 18 world mechanics: fake-platform collapse/flicker, boat ferrying,
    // and pooled enemy-projectile expiry. Frozen with the rest while paused.
    this.updateFakes();
    this.updateBoats();
    this.updateProjectiles();

    // Task 19 factory hazard set: conveyor push (after enemy ticks so it layers
    // on their velocity), timed gates, and laser on/off cycles.
    this.applyConveyors();
    this.updateGates();
    this.updateLasers();

    if (snap.pausePressed) {
      gameStore.set({ paused: true });
      this.pausedText?.setPosition(cam.midPoint.x, cam.midPoint.y).setVisible(true);
      this.physics.pause(); // freeze enemies/pickups velocities + positions
    }
    if (this.player.y > this.mapHeightPx + 40) this.respawn(1); // pit: 1 dmg, checkpoint
    input.consume();
  }

  // --- animation ------------------------------------------------------------

  private playAnimFor(body: Body, onGround: boolean) {
    if (this.dead || this.attacking) return;
    if (this.time.now < this.hurtAnimUntil) return;
    let anim: string;
    if (!onGround) anim = body.velocity.y < 0 ? "jump" : "fall";
    else anim = Math.abs(body.velocity.x) > 5 ? "run" : "idle";
    const key = animKey("player", anim);
    if (this.player.anims.currentAnim?.key !== key) this.player.play(key, true);
  }

  private doAttack() {
    this.attacking = true;
    this.attackUntil = this.time.now + ATTACK_MS;
    this.attackSwingId++; // one swing = one hit per enemy (multi-hp guard)
    this.player.play(animKey("player", "attack"), true);
    audio.sfx("stomp");

    // In-level charge parry: a well-timed swing negates + stuns a charging Brute
    // (each brute grades the press against its own predicted contact time).
    for (const obj of this.enemyGroup.getChildren()) {
      if (obj instanceof BruteForceBrute) obj.tryChargeParry(this.time.now);
    }
    // Reposition the persistent hitbox in front of the player and enable its
    // body for the ATTACK_MS window; overlapping enemies die by "attack". No
    // new zone/Collider is created per swing (see setupAttackHitbox).
    const dir = this.player.flipX ? -1 : 1;
    this.attackHitbox.setPosition(this.player.x + dir * 12, this.player.y);
    const body = this.attackHitbox.body as Body;
    body.enable = true;
    this.time.delayedCall(ATTACK_MS, () => {
      body.enable = false;
    });
  }

  // --- interaction / progression --------------------------------------------

  private updateProximity() {
    this.nearDoor = false;
    this.nearFragment = false;
    const px = this.player.x;
    const py = this.player.y;

    const d = this.lvl.bossDoor;
    if (Math.abs(px - (d.tx * TILE + TILE / 2)) < 14 && Math.abs(py - (d.ty * TILE + TILE / 2)) < 22)
      this.nearDoor = true;

    if (this.lvl.fragment && !this.fragmentCollected) {
      const f = this.lvl.fragment;
      if (
        Math.abs(px - (f.tx * TILE + TILE / 2)) < 14 &&
        Math.abs(py - (f.ty * TILE + TILE / 2)) < 22
      )
        this.nearFragment = true;
    }
  }

  private updateCheckpoints() {
    const px = this.player.x;
    const py = this.player.y;
    for (const m of this.checkpointMarkers) {
      const key = `${m.pt.tx},${m.pt.ty}`;
      if (this.latchedCheckpoints.has(key)) continue;
      if (
        Math.abs(px - (m.pt.tx * TILE + TILE / 2)) < 12 &&
        Math.abs(py - (m.pt.ty * TILE + TILE / 2)) < 24
      ) {
        this.latchedCheckpoints.add(key);
        this.lastCheckpoint = { ...m.pt };
        m.obj.setFillStyle(0xc4b5fd); // raised / lit
        m.obj.setScale(1, 1.5);
        audio.sfx("collect");
      }
    }
  }

  private tryInteract() {
    // Analyze exploit: expose any disguised phishling in reach (needs the ability).
    if (this.abilities.analyze) {
      for (const obj of this.enemyGroup.getChildren()) {
        if (!(obj instanceof Phishling)) continue;
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y);
        if (d <= ANALYZE_RANGE_PX) obj.tryExpose();
      }
    }

    if (this.nearFragment && !this.fragmentCollected) {
      this.fragmentCollected = true;
      this.fragments += 1;
      this.player.play(animKey("player", "interact"), true);
      audio.sfx("collect");
      this.fragmentSprite?.destroy();
      this.pushHud();
      bus.emit("level:fragment", { levelId: this.def.id });
      persistSave(collectMemoryFragment(loadSave(), this.def.id));
      openDialogue(`frag-${this.def.id}`);
      return;
    }
    if (this.nearDoor) this.enterBoss();
  }

  private enterBoss() {
    gameStore.set({ levelBuffs: [...this.buffs] });
    bus.emit("level:enter-boss", { levelId: this.def.id, bossId: this.def.bossId });
    // Hand off to the combat controller: it pauses this Level scene, launches
    // the CombatBackdrop, and mounts the React combat UI. startCombat throws
    // for an un-registered boss (Task 14 populates BOSSES), so guard the door.
    registerCombatGame(this.game);
    try {
      startCombat(this.def.bossId, { levelId: this.def.id, returnTo: "level" });
    } catch (err) {
      console.warn("[adventure] boss has no combat definition yet", err);
    }
  }

  // --- damage / respawn -----------------------------------------------------

  private onHazard() {
    if (this.time.now < this.iframesUntil || this.dead) return;
    this.takeDamage(1);
    if (!this.dead) {
      (this.player.body as Body).setVelocityY(-200); // bounce up
      this.knockbackUntil = this.time.now + KNOCKBACK_MS; // protect the bounce
    }
  }

  private takeDamage(n: number) {
    // Zero-damage contact (e.g. a stunned phishling) must not knock back,
    // blink, or play hurt feedback — it is not a hit.
    if (n <= 0) return;
    if (this.time.now < this.iframesUntil || this.dead) return;
    this.health = Math.max(0, this.health - n);
    this.pushHud();
    bus.emit("player:damaged", { health: this.health });
    audio.sfx("damage");

    if (this.health <= 0) {
      this.die();
      return;
    }

    // hurt anim + knockback away from facing
    this.hurtAnimUntil = this.time.now + HURT_ANIM_MS;
    this.player.play(animKey("player", "hurt"), true);
    const body = this.player.body as Body;
    body.setVelocityX(this.player.flipX ? 80 : -80);
    body.setVelocityY(-160);
    this.knockbackUntil = this.time.now + KNOCKBACK_MS; // protect the pop

    this.iframesUntil = this.time.now + IFRAMES_MS;
    this.blink(IFRAMES_MS);
  }

  private die() {
    if (this.dead) return;
    this.dead = true;
    this.attacking = false;
    (this.player.body as Body).setVelocity(0, 0);
    this.player.setAlpha(1);
    this.player.play(animKey("player", "death"), true);
    this.time.delayedCall(DEATH_MS, () => this.respawn(0));
  }

  private respawn(pitDamage: number) {
    if (pitDamage <= 0) {
      // death → restore full health (buffs kept)
      this.health = this.maxHealth;
    } else {
      this.health = Math.max(0, this.health - pitDamage);
    }
    this.dead = false;
    this.attacking = false;

    const cp = this.lastCheckpoint;
    this.player.setPosition(cp.tx * TILE + TILE / 2, cp.ty * TILE + TILE / 2);
    const body = this.player.body as Body;
    body.setVelocity(0, 0);
    this.player.setAlpha(1);
    this.player.play(animKey("player", "idle"), true);

    this.iframesUntil = this.time.now + RESPAWN_IFRAMES_MS;
    this.blink(RESPAWN_IFRAMES_MS);
    this.pushHud();
    bus.emit("player:damaged", { health: this.health });

    if (this.health <= 0) this.die(); // pit finished us off
  }

  private blink(ms: number) {
    this.tweens.killTweensOf(this.player);
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: Math.max(0, Math.floor(ms / 160)),
      onComplete: () => this.player.setAlpha(1),
    });
    this.time.delayedCall(ms, () => this.player.setAlpha(1));
  }

  private pushHud() {
    gameStore.set({
      hud: {
        health: this.health,
        maxHealth: this.maxHealth,
        buffs: [...this.buffs],
        fragments: this.fragments,
        levelId: this.def.id,
      },
    });
  }
}
