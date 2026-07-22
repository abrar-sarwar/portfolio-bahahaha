import Phaser from "phaser";
import { TILE, ZOOM, PHYSICS } from "../config";
import { POWER_STACK_MAX, RT_PLAYER } from "../realtime/config";
import type { LevelId, BuffId, SceneKey } from "../ids";
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
import {
  ARCHIVE_TILES, ARCHIVE_PARALLAX, ARCHIVE_TILE_KEYS, ARCHIVE_PARALLAX_KEYS,
  ARCHIVE_PAGE_ANIM, ARCHIVE_INK_ANIM,
} from "../art/sprites/tiles-archive";
import {
  CASTLE_TILES, CASTLE_PARALLAX, CASTLE_TILE_KEYS, CASTLE_PARALLAX_KEYS,
  CASTLE_LAVA_ANIM, CASTLE_BANNER_ANIM,
} from "../art/sprites/tiles-castle";
import {
  CITY_TILES, CITY_PARALLAX, CITY_TILE_KEYS, CITY_PARALLAX_KEYS,
  CITY_NEON_ANIM, TEMPLE_LANTERN_ANIM, CITY_HAZARD_ANIM,
} from "../art/sprites/tiles-city";
import {
  DESERT_TILES, DESERT_PARALLAX, DESERT_TILE_KEYS, DESERT_PARALLAX_KEYS,
  CAVE_CRYSTAL_ANIM,
} from "../art/sprites/tiles-desert";
import {
  COAST_TILES, CASINO_TILES, COAST_PARALLAX, CASINO_PARALLAX,
  COAST_TILE_KEYS, CASINO_TILE_KEYS, COAST_PARALLAX_KEYS, CASINO_PARALLAX_KEYS,
  COAST_WATER_ANIM, CASINO_NEON_ANIM, CASINO_SLOT_ANIM,
} from "../art/sprites/tiles-coast";
import {
  RAIN_TILES, RAIN_PARALLAX, RAIN_TILE_KEYS, RAIN_PARALLAX_KEYS,
  RAIN_LAMP_ANIM, RAIN_GLASS_ANIM,
} from "../art/sprites/tiles-rain";
import {
  RIFT_TILES, RIFT_PARALLAX, RIFT_TILE_KEYS, RIFT_PARALLAX_KEYS, RIFT_LAVA_ANIM,
} from "../art/sprites/tiles-rift";
import { ENEMY_SPRITES } from "../art/sprites/enemies1";
import { ENEMIES2_SPRITES } from "../art/sprites/enemies2";
import { ENEMIES3_SPRITES } from "../art/sprites/enemies3";
import { PICKUP_SPRITES, pickupKeyFor } from "../art/sprites/pickups";
import { audio } from "../audio/synth";
import { bus } from "../bridge/EventBus";
import { gameStore } from "../bridge/GameStore";
import { collectMemoryFragment, loadSave, persistSave, type AdventureSave } from "../state/save";
import { isDebugEnabled } from "../state/debugQuery";
import { getRtBoss, LEVEL_RT_BOSS } from "../realtime/bossDefinitions";
import type { RtBossId } from "../realtime/types";
import { input } from "../input/InputState";
import { mergeRowRuns, runToRect, topExposed } from "./levelGeometry";
import { shouldClipAscent, movementLocked, shouldStartDash } from "./controllerGates";
import { Enemy, type EnemyHostScene } from "../enemies/Enemy";
import { Bugling } from "../enemies/Bugling";
import { MalwareBat } from "../enemies/MalwareBat";
import { Phishling } from "../enemies/Phishling";
import { BruteForceBrute } from "../enemies/BruteForceBrute";
import { FirewallKnight } from "../enemies/FirewallKnight";
import { RootkitSlime } from "../enemies/RootkitSlime";
import { CrownImp } from "../enemies/CrownImp";
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
// Desert mechanics (Task 36): the tunnel lift rides 6 rows at this speed; the
// ceiling rocks fall fast enough to demand a reaction but not a prediction.
const LIFT_SPEED = 55; // px/s
const DEBRIS_FALL_SPEED = 300; // px/s

type Body = Phaser.Physics.Arcade.Body;

/** Per-theme tile/parallax wiring. Keeps buildTiles/buildParallax generic so a
 *  new world only adds a tileset module + a branch here (Task 18: harbor). */
interface ThemeTiles {
  register: SpriteDef[];
  parallax: { key: string; depth: number; factor: number }[];
  ground: string;
  groundFill: string;
  oneWay: string;
  /** Column-driven biome selection (dual-biome city theme, Task 34): when set,
   *  overrides the flat ground/groundFill/oneWay keys per cell so a single map
   *  can dissolve from one biome into another left→right. */
  groundAt?(tx: number, ty: number, exposed: boolean): string;
  oneWayAt?(tx: number): string;
  /** Vertical-lift platform tile (desert `I` cells, Task 36). */
  liftKey?: string;
  /** Collapsing-floor tile for `~` cells (default: the castle iron plank). */
  bridgeKey?: string;
  /** When set, one-way cells render as animated sprites playing this anim
   *  (archive floating pages) rather than a static image. */
  oneWayAnim?: string;
  hazard: string;
  /** When set, hazard cells render as animated sprites playing this anim
   *  (harbor code-water / factory molten / archive ink) rather than a static
   *  image. */
  hazardAnim?: string;
  fakeKey: string;
  fakeAnim?: string;
  boatKey: string;
  /** Archive rotator-arm platform tile + its flutter anim (Task 20). Undefined
   *  in other themes, where the parser yields no rotators so they're unused. */
  rotatorKey?: string;
  rotatorAnim?: string;
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
  if (theme === "archive") {
    // The Corrupted Archive (Task 20). One tile — the fluttering floating PAGE
    // — is the one-way, the fake, AND the rotator-arm platform, so one-ways
    // render as animated sprites (oneWayAnim) like the harbor water hazard does.
    return {
      register: [...ARCHIVE_PARALLAX, ...ARCHIVE_TILES],
      parallax: [
        { key: ARCHIVE_PARALLAX_KEYS.bg0, depth: -30, factor: 0.2 },
        { key: ARCHIVE_PARALLAX_KEYS.bg1, depth: -20, factor: 0.4 },
        { key: ARCHIVE_PARALLAX_KEYS.bg2, depth: -10, factor: 0.6 },
      ],
      ground: ARCHIVE_TILE_KEYS.ground,
      groundFill: ARCHIVE_TILE_KEYS.groundFill,
      oneWay: ARCHIVE_TILE_KEYS.page,
      oneWayAnim: ARCHIVE_PAGE_ANIM,
      hazard: ARCHIVE_TILE_KEYS.ink,
      hazardAnim: ARCHIVE_INK_ANIM,
      fakeKey: ARCHIVE_TILE_KEYS.page,
      fakeAnim: ARCHIVE_PAGE_ANIM,
      boatKey: ARCHIVE_TILE_KEYS.ground, // no boats in archive levels
      rotatorKey: ARCHIVE_TILE_KEYS.page,
      rotatorAnim: ARCHIVE_PAGE_ANIM,
    };
  }
  if (theme === "city" || theme === "temple") {
    // World 1-1 (Task 34): ONE dual-biome kit. "city" runs the column-driven
    // dissolve (city 0–116 → transition 116–176 → temple 176+, per the map's
    // section walkthrough); "temple" (the Broken King arena) is biome B only.
    const biome = (tx: number): "city" | "trans" | "temple" =>
      theme === "temple" ? "temple" : tx < 116 ? "city" : tx < 176 ? "trans" : "temple";
    return {
      register: [...CITY_PARALLAX, ...CITY_TILES],
      parallax: [
        { key: CITY_PARALLAX_KEYS.bg0, depth: -30, factor: 0.2 },
        { key: CITY_PARALLAX_KEYS.bg1, depth: -20, factor: 0.4 },
        { key: CITY_PARALLAX_KEYS.bg2, depth: -10, factor: 0.6 },
      ],
      ground: CITY_TILE_KEYS.templeGround,
      groundFill: CITY_TILE_KEYS.templeGroundFill,
      groundAt: (tx, ty, exposed) => {
        const b = biome(tx);
        if (b === "city") {
          // Street-level tops read as asphalt; rooftops as concrete; raised
          // stacks (buildings) fill with curtain wall, below-street with soil.
          if (exposed) return ty >= 12 ? CITY_TILE_KEYS.cityRoad : CITY_TILE_KEYS.cityGround;
          return ty <= 11 ? CITY_TILE_KEYS.cityGlass : CITY_TILE_KEYS.cityGroundFill;
        }
        if (b === "trans") {
          if (exposed) return CITY_TILE_KEYS.transGround;
          return ty <= 11 ? CITY_TILE_KEYS.transWall : CITY_TILE_KEYS.cityGroundFill;
        }
        if (exposed) return CITY_TILE_KEYS.templeGround;
        return ty <= 11 ? CITY_TILE_KEYS.templeStair : CITY_TILE_KEYS.templeGroundFill;
      },
      oneWay: CITY_TILE_KEYS.templeOneWay,
      oneWayAt: (tx) => (biome(tx) === "city" ? CITY_TILE_KEYS.cityGirder : CITY_TILE_KEYS.templeOneWay),
      hazard: CITY_TILE_KEYS.hazard,
      hazardAnim: CITY_HAZARD_ANIM,
      fakeKey: CITY_TILE_KEYS.cityGirder, // no fakes/boats in city levels
      boatKey: CITY_TILE_KEYS.cityGirder,
    };
  }
  if (theme === "rain") {
    // World 1-4 (Task 40): England-rain streets into the cathedral. Column-
    // driven: streets/rooftops (0–~140) → graveyard + cathedral (140+). The
    // clock-tower band (52–66) reads as dressed clock masonry.
    const cathedralAt = (tx: number) => tx >= 140;
    return {
      register: [...RAIN_PARALLAX, ...RAIN_TILES],
      parallax: [
        { key: RAIN_PARALLAX_KEYS.bg0, depth: -30, factor: 0.2 },
        { key: RAIN_PARALLAX_KEYS.bg1, depth: -20, factor: 0.4 },
        { key: RAIN_PARALLAX_KEYS.bg2, depth: -10, factor: 0.6 },
      ],
      ground: RAIN_TILE_KEYS.cobble,
      groundFill: RAIN_TILE_KEYS.cobbleFill,
      groundAt: (tx, ty, exposed) => {
        if (cathedralAt(tx)) {
          if (exposed) return RAIN_TILE_KEYS.stone;
          return ty <= 13 ? RAIN_TILE_KEYS.pillar : RAIN_TILE_KEYS.cobbleFill;
        }
        if (tx >= 52 && tx <= 66) {
          return exposed ? RAIN_TILE_KEYS.slate : RAIN_TILE_KEYS.clockBlock;
        }
        if (exposed) return ty <= 10 ? RAIN_TILE_KEYS.slate : RAIN_TILE_KEYS.cobble;
        return ty <= 13 ? RAIN_TILE_KEYS.brick : RAIN_TILE_KEYS.cobbleFill;
      },
      oneWay: RAIN_TILE_KEYS.oneWay,
      hazard: RAIN_TILE_KEYS.spikes,
      fakeKey: RAIN_TILE_KEYS.oneWay, // no fakes/boats in rain levels
      boatKey: RAIN_TILE_KEYS.oneWay,
      bridgeKey: RAIN_TILE_KEYS.bridge,
    };
  }
  if (theme === "coast" || theme === "casino") {
    // World 1-3 (Task 38): Portugal-inspired coast dissolving into the casino
    // strip. Column-driven: coast (0–~116) → strip transition (~116–136) →
    // casino (136+). "casino" (the Dealer's private room) is casino-only.
    const casinoAt = (tx: number) => theme === "casino" || tx >= 136;
    const transAt = (tx: number) => theme !== "casino" && tx >= 116 && tx < 136;
    return {
      register: [...COAST_PARALLAX, ...CASINO_PARALLAX, ...COAST_TILES, ...CASINO_TILES],
      parallax:
        theme === "casino"
          ? [
              { key: CASINO_PARALLAX_KEYS.bg0, depth: -30, factor: 0.2 },
              { key: CASINO_PARALLAX_KEYS.bg1, depth: -20, factor: 0.4 },
              { key: CASINO_PARALLAX_KEYS.bg2, depth: -10, factor: 0.6 },
            ]
          : [
              { key: COAST_PARALLAX_KEYS.bg0, depth: -30, factor: 0.2 },
              { key: COAST_PARALLAX_KEYS.bg1, depth: -20, factor: 0.4 },
              { key: COAST_PARALLAX_KEYS.bg2, depth: -10, factor: 0.6 },
            ],
      ground: COAST_TILE_KEYS.ground,
      groundFill: COAST_TILE_KEYS.groundFill,
      groundAt: (tx, ty, exposed) => {
        if (casinoAt(tx)) {
          if (exposed) return CASINO_TILE_KEYS.floor;
          return ty <= 11 ? CASINO_TILE_KEYS.trim : CASINO_TILE_KEYS.floorFill;
        }
        if (transAt(tx)) {
          // The strip: stone underfoot, gaudy trim rising in the stacks.
          if (exposed) return COAST_TILE_KEYS.ground;
          return ty <= 11 ? CASINO_TILE_KEYS.trim : COAST_TILE_KEYS.groundFill;
        }
        if (exposed) return COAST_TILE_KEYS.ground;
        // Terrace stacks read as stucco buildings; below-grade as cobble body.
        return ty <= 12 ? COAST_TILE_KEYS.wall : COAST_TILE_KEYS.groundFill;
      },
      oneWay: COAST_TILE_KEYS.tram,
      oneWayAt: (tx) => (casinoAt(tx) ? CASINO_TILE_KEYS.glass : COAST_TILE_KEYS.tram),
      hazard: COAST_TILE_KEYS.water,
      hazardAnim: COAST_WATER_ANIM,
      fakeKey: COAST_TILE_KEYS.tram, // no fakes in coast levels
      boatKey: CASINO_TILE_KEYS.glass, // gilded moving lifts in the casino
      rotatorKey: CASINO_TILE_KEYS.roulette, // roulette platforms (`@`)
      gateKey: CASINO_TILE_KEYS.trim,
      laserEmitterKey: CASINO_TILE_KEYS.laser,
      laserBeamKey: CASINO_TILE_KEYS.laser,
    };
  }
  if (theme === "desert") {
    // World 1-2 (owner rework): ONE sand story — dune terraces the whole run,
    // switching to sandstone only for the sand castle (tx >= 172) and the
    // Giant's vault roof. The old opaque cave-darkness parallax layer is gone
    // (it blanketed the dusk sky); the arena darkens itself with its veil.
    return {
      register: [...DESERT_PARALLAX, ...DESERT_TILES, ...CITY_TILES.filter((t) => t.key === "tile-city-hazard")],
      parallax: [
        { key: DESERT_PARALLAX_KEYS.bg0, depth: -30, factor: 0.2 },
        { key: DESERT_PARALLAX_KEYS.bg1, depth: -20, factor: 0.35 },
      ],
      ground: DESERT_TILE_KEYS.sand,
      groundFill: DESERT_TILE_KEYS.sandFill,
      groundAt: (tx, ty, exposed) => {
        if (ty <= 1) return DESERT_TILE_KEYS.sandstoneFill; // the Giant's vault roof
        if (tx >= 172) {
          return exposed ? DESERT_TILE_KEYS.sandstone : DESERT_TILE_KEYS.sandstoneFill;
        }
        return exposed ? DESERT_TILE_KEYS.sand : DESERT_TILE_KEYS.sandFill;
      },
      oneWay: DESERT_TILE_KEYS.timber,
      hazard: CITY_TILE_KEYS.hazard,
      hazardAnim: CITY_HAZARD_ANIM,
      fakeKey: DESERT_TILE_KEYS.timber, // no fakes/boats in desert levels
      boatKey: DESERT_TILE_KEYS.timber,
      liftKey: DESERT_TILE_KEYS.lift,
      bridgeKey: DESERT_TILE_KEYS.crumble,
    };
  }
  if (theme === "castle" || theme === "rift") {
    // The Devil King's Castle (Task 21). Black basalt ground, an iron-grate
    // one-way, and an animated red-lava hazard. Fireball fountains, collapsing
    // bridges, rising corruption, and decor are castle-only and driven from
    // CASTLE_TILE_KEYS directly in the castle build methods (gated on theme).
    return {
      register: theme === "rift" ? [...RIFT_PARALLAX, ...RIFT_TILES] : [...CASTLE_PARALLAX, ...CASTLE_TILES],
      parallax: [
        { key: theme === "rift" ? RIFT_PARALLAX_KEYS.bg0 : CASTLE_PARALLAX_KEYS.bg0, depth: -30, factor: 0.2 },
        { key: theme === "rift" ? RIFT_PARALLAX_KEYS.bg1 : CASTLE_PARALLAX_KEYS.bg1, depth: -20, factor: 0.4 },
        { key: theme === "rift" ? RIFT_PARALLAX_KEYS.bg2 : CASTLE_PARALLAX_KEYS.bg2, depth: -10, factor: 0.6 },
      ],
      ground: theme === "rift" ? RIFT_TILE_KEYS.ground : CASTLE_TILE_KEYS.ground,
      groundFill: theme === "rift" ? RIFT_TILE_KEYS.groundFill : CASTLE_TILE_KEYS.groundFill,
      oneWay: theme === "rift" ? RIFT_TILE_KEYS.oneWay : CASTLE_TILE_KEYS.oneWay,
      hazard: theme === "rift" ? RIFT_TILE_KEYS.lava : CASTLE_TILE_KEYS.lava,
      hazardAnim: theme === "rift" ? RIFT_LAVA_ANIM : CASTLE_LAVA_ANIM,
      fakeKey: CASTLE_TILE_KEYS.oneWay,
      boatKey: CASTLE_TILE_KEYS.oneWay,
      bridgeKey: CASTLE_TILE_KEYS.bridge,
      // In the rift, the old grate is re-purposed as a rotating scythe arm and
      // the beam device. Player swings disable the glow-beam for four seconds.
      rotatorKey: theme === "rift" ? CASTLE_TILE_KEYS.oneWay : undefined,
      gateKey: theme === "rift" ? CASTLE_TILE_KEYS.ground : undefined,
      laserEmitterKey: theme === "rift" ? CASTLE_TILE_KEYS.fireball : undefined,
      laserBeamKey: theme === "rift" ? CASTLE_TILE_KEYS.oneWay : undefined,
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

/** A single orbiting one-way platform on a rotator arm (Task 20 archive). */
interface RotatorArm {
  sprite: Phaser.Physics.Arcade.Sprite; // static one-way body
  prevX: number;
  prevY: number;
}

/** A rotator cluster (legend `@`): a fixed pivot with 3 arm platforms at tile
 *  distances 1/2/3 that orbit it in 90° steps every 2s. */
interface Rotator {
  cx: number; // pivot centre in world px
  cy: number;
  arms: RotatorArm[];
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

// Rotator tuning (Task 20 archive): a 90° step every 2s. Each arm RESTS at its
// current orientation for the first ~1.55s (ride-able), then tweens to the next
// orientation over ROTATOR_TWEEN_MS. Clockwise in screen space (right → down →
// left → up). A rider standing on an arm is CARRIED (glued) through the whole
// step by per-frame delta-position transfer on BOTH axes — the graceful choice
// documented in the brief: you never get flung off mid-swing, only dropped when
// you step off. (One-way sides/bottom don't push, so the manual carry is what
// keeps a rider on through horizontal and downward legs of the orbit.)
const ROTATOR_STEP_MS = 2000;
const ROTATOR_TWEEN_MS = 450;
const ROTATOR_ORIENT: readonly [number, number][] = [
  [1, 0], // right
  [0, 1], // down
  [-1, 0], // left
  [0, -1], // up
];

// Castle hazard tuning (Task 21). Fountains spit an arcing fireball every 2.2s
// (staggered per fountain so a row doesn't fire in unison); a fireball is
// gravity-affected, deals 1, and despawns on a solid / off the bottom / after
// its flight. Collapsing bridges shake 400ms after the first touch then fall
// (body off, sprite drops + fades) and respawn 3s later. Corruption rises
// 12px/s. Strong castle spawns get a blood-dark tint + 10 patrol speed.
const FOUNTAIN_PERIOD_MS = 2200;
const FIREBALL_VY = -390; // launch velocity (up); gravity pulls it back to arc
const FIREBALL_VX = 44; // horizontal arc (alternates sign per fountain)
const FIREBALL_TTL_MS = 4000;
const BRIDGE_SHAKE_MS = 400;
const BRIDGE_RESPAWN_MS = 3000;
const CORRUPTION_RISE_PXPS = 12;
const CASTLE_SHADOW_TINT = 0x6a1212; // blood-dark red multiply
const CASTLE_SPEED_BONUS = 10;

/** A collapsing bridge cell (legend `~`): a one-way tile that shakes then drops
 *  after the first touch and respawns (Task 21 castle). */
interface Bridge {
  sprite: Phaser.GameObjects.Sprite;
  rect: Phaser.GameObjects.Rectangle;
  cx: number;
  cy: number;
  /** null = intact/armed; a timestamp = shaking, will fall at this time. */
  fallAt: number | null;
  /** null = up; a timestamp = fallen, will respawn at this time. */
  respawnAt: number | null;
  gone: boolean;
}

/** A fireball fountain (legend `!`): a lava spout that launches pooled fireballs
 *  on its own 2.2s cycle (Task 21 castle). */
interface Fountain {
  x: number;
  y: number;
  nextAt: number;
  dir: 1 | -1; // arc direction for its fireballs
}

export interface LevelSceneData {
  levelId: LevelId;
  spawnAt?: "start" | "checkpoint" | "door";
  /** Exact active checkpoint carried through a pause-menu scene restart. */
  checkpoint?: Pt;
  /** POWER stacks carried across an in-level mini-boss handoff. */
  power?: number;
}

const IFRAMES_MS = 900;
const RESPAWN_IFRAMES_MS = 600;
const HURT_ANIM_MS = 300;
const ATTACK_MS = 220;
const DEATH_MS = 750;

export class PlatformLevelScene extends Phaser.Scene implements EnemyHostScene {
  protected def!: LevelDefinition;
  protected lvl!: ParsedLevel;
  protected player!: Phaser.Physics.Arcade.Sprite;

  public mapWidthPx = 0; // public: EnemyHostScene exposes it for spawn clamping
  private mapHeightPx = 0;

  // controller timing state
  private lastGroundedAt = -Infinity;
  private jumpQueuedAt = -Infinity;
  private jumpFiredAt = -Infinity;
  /** Air jumps spent since last grounded (double jump: max 1). */
  private airJumpsUsed = 0;
  private knockbackUntil = -Infinity;
  private dashing = false;
  protected dashStartedAt = -Infinity;
  protected attacking = false;
  protected attackUntil = -Infinity;
  /** Timestamp of the player's last stomp (Fix 4: same-frame double-contact
   *  guard — see applyRestompWindow / onEnemyContact). */
  private lastStompAt = -Infinity;
  protected iframesUntil = -Infinity;
  private hurtAnimUntil = -Infinity;
  protected dead = false;
  private speedScale = 1;

  // health / progression — 6 hearts everywhere (Task 32; RT_PLAYER.maxHearts).
  // Protected: BossArenaScene applies the silent-assist bonus heart (Task 33).
  protected health: number = RT_PLAYER.maxHearts;
  protected maxHealth: number = RT_PLAYER.maxHearts;
  /** POWER stacks (capped): +1 per stomp-KILLED enemy this run; carried
   *  through the boss door as bonus swing damage (ArenaSceneData.power).
   *  Protected: BossArenaScene seeds it from arenaData for its HUD chip. */
  protected powerStacks = 0;
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
  private rotatorGroup!: Phaser.Physics.Arcade.StaticGroup;
  private bridgeGroup!: Phaser.Physics.Arcade.StaticGroup;
  private fireballGroup!: Phaser.Physics.Arcade.Group;
  private fakes: FakePlatform[] = [];
  private boats: Boat[] = [];
  private gates: Gate[] = [];
  private lasers: Laser[] = [];
  private rotators: Rotator[] = [];
  private bridges: Bridge[] = [];
  private lifts: { sprite: Phaser.Physics.Arcade.Image; topY: number; bottomY: number; prevY: number }[] = [];
  private debrisTraps: {
    x: number;
    y: number;
    glint: Phaser.GameObjects.Rectangle;
    rock: Phaser.GameObjects.Rectangle | null;
    rearmAt: number;
  }[] = [];
  private fountains: Fountain[] = [];
  // Rising-corruption shaft state (Task 21 castle). `tideTop` is the world-y of
  // the tide surface; it rises while the player is in the segment span and
  // resets to the floor when they leave / respawn. tideRect is the drawn tide.
  private tideTop = Infinity;
  private tideRect?: Phaser.GameObjects.Rectangle;
  private lightningFlash?: Phaser.GameObjects.Rectangle;
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
  /** Collected Truth Seal cells this run (Task 34; session-scoped). */
  private collectedSeals = new Set<string>();
  /** `?debug=1` read-only telemetry for playtest harnesses (shipped, gated —
   *  part of the Task 48 debug surface; ruled on by Task 49 criterion #29). */
  protected debugTelemetry = false;
  /** Arenas suppress the generic boss-door marker (their D is inert). */
  protected drawDoorMarker = true;
  private checkpointMarkers: { pt: Pt; obj: Phaser.GameObjects.Rectangle }[] = [];
  private bg: { sprite: Phaser.GameObjects.TileSprite; factor: number }[] = [];
  private toast?: Phaser.GameObjects.Text;
  private detachInput?: () => void;
  private accessibility!: AdventureSave["settings"]["accessibility"];
  private midBossCleared = true;
  private midBossLaunching = false;

  constructor(key: SceneKey = "Level") {
    // Parameterised so BossArenaScene (Task 32) can reuse this scene wholesale
    // under the "Arena" key; defaults to "Level" so existing callers are
    // unchanged.
    super(key);
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
    this.rotators = [];
    this.bridges = [];
    this.lifts = [];
    this.debrisTraps = [];
    this.fountains = [];
    this.conveyorDir = new Map();
    this.bg = [];
    this.checkpointMarkers = [];
    this.tideTop = Infinity;
    this.tideRect = undefined;
    this.lightningFlash = undefined;
    // Phaser reuses the scene INSTANCE across restarts, so per-run player
    // flags must reset here too (T18 hygiene). The base death path clears
    // `dead` in respawn(), but a death that ends in scene.restart() — the
    // BossArenaScene retry — re-enters create() with `dead` still true,
    // freezing the player AND the arena's machine step behind its gate.
    this.dead = false;
    this.attacking = false;
    this.attackUntil = -Infinity;
    this.airJumpsUsed = 0;
    this.collectedSeals = new Set();
    this.midBossLaunching = false;
    this.debugTelemetry =
      typeof window !== "undefined" && isDebugEnabled(new URLSearchParams(window.location.search));

    const def = this.resolveLevelDef(data);
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
    this.accessibility = save.settings.accessibility;
    this.fragmentCollected = save.memoryFragments.includes(def.id);
    this.midBossCleared = !def.midBossId || save.bossesDefeated.includes(def.midBossId);

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
    this.spawnPlayer(data.spawnAt ?? "start", data.checkpoint); // before buildTiles: colliders need the player
    this.buildTiles();
    this.buildFakes(); // fake platforms (Task 18): one-way look-alikes that collapse
    this.buildBoats(); // boats (Task 18): ferrying moving platforms
    this.spawnEnemies(); // after buildTiles: enemies collide with the tile groups
    this.setupAttackHitbox(); // after spawnEnemies: overlap needs enemyGroup
    this.setupProjectiles(); // pooled enemy-projectile group (malware-bat packets)
    this.buildFactoryHazards(); // gates + lasers (after attackHitbox: emitter overlap)
    this.buildDesertMechanics(); // `I` lifts + `*` ceiling-debris marks (Task 36)
    this.buildRotators(); // rotating page clusters (Task 20 archive)
    this.buildCastleHazards(); // fountains + fireballs + bridges + corruption (Task 21)
    this.buildCastleDecor(); // chains / banners / statues + lightning (Task 21)
    this.setupCamera();

    // HUD / progression reset for this level. Full heal on start (6 hearts).
    this.health = RT_PLAYER.maxHearts;
    this.maxHealth = RT_PLAYER.maxHearts;
    this.powerStacks = Math.max(0, Math.min(POWER_STACK_MAX, data.power ?? 0));
    this.buffs = [];
    this.fragments = this.fragmentCollected ? 1 : 0; // reflect a prior-session collection in the HUD count
    this.latchedCheckpoints.clear();
    this.speedScale = this.buffs.includes("cache-boost") ? 1.25 : 1;

    gameStore.set({
      scene: this.scene.key as SceneKey,
      paused: false,
      levelBuffs: [],
      hearts: { current: this.health, max: this.maxHealth },
      hud: {
        health: this.health,
        maxHealth: this.maxHealth,
        buffs: this.buffs,
        fragments: this.fragments,
        power: this.powerStacks,
        levelId: def.id,
      },
    });
    bus.emit("scene:changed", { scene: this.scene.key as SceneKey });

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

    const offPauseAction = bus.on("ui:pause-action", ({ action }) => {
      if (action === "resume") this.resumeGame();
      else if (action === "restart") this.restartFromCheckpoint();
      else this.quitToMap();
    });
    const offSettings = bus.on("settings:changed", ({ accessibility }) => {
      this.accessibility = accessibility;
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.detachInput?.();
      offPauseAction();
      offSettings();
      // Seal pips are level-scoped; the Arena manages its own rtSeals field.
      if (this.lvl.seals.length > 0) gameStore.set({ rtSeals: null });
    });

    // Subclass seam (BossArenaScene): everything above has built the world +
    // player + HUD; the arena spawns its boss and combat layer here.
    this.onCreated(data);
  }

  /** Which LevelDefinition this run renders. Base: the LEVELS registry keyed by
   *  `data.levelId`. BossArenaScene overrides to return an arena def. */
  protected resolveLevelDef(data: LevelSceneData): LevelDefinition {
    return LEVELS[data.levelId];
  }

  /** Post-create hook (runs at the end of create(), after teardown wiring is in
   *  place). Base: no-op. BossArenaScene spawns the boss + combat layer here. */
  protected onCreated(_data: LevelSceneData): void {}

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
    this.buildRainOverlay();
  }

  /** Rain + fog scene overlays for the "rain" theme (Task 40): slanted rain
   *  streaks tweening down the world plus a slow horizontal fog band. Static-
   *  cadence (no strobe — reduceFlash-safe); no-op for every other theme. */
  private buildRainOverlay() {
    if (this.def.theme !== "rain") return;
    const w = this.mapWidthPx;
    const h = this.mapHeightPx;
    for (let i = 0; i < 60; i++) {
      // Deterministic scatter (T18 hygiene: rebuilt every create()).
      const seed = (i * 73856093) >>> 0;
      const x0 = seed % w;
      const drop = this.add
        .rectangle(x0, ((seed >> 5) % h) - h, 1, 8, 0x9db4d0, 0.35)
        .setDepth(25)
        .setAngle(8);
      this.tweens.add({
        targets: drop,
        y: `+=${h + 40}`,
        x: `+=${Math.round(h / 8)}`,
        duration: 900 + (seed % 500),
        repeat: -1,
        onRepeat: () => {
          drop.y = -12;
          drop.x = (seed * 31) % w;
        },
      });
    }
    const fog = this.add
      .rectangle(0, h - 96, w * 2, 60, 0x9aa6b8, 0.08)
      .setOrigin(0, 0)
      .setDepth(24);
    this.tweens.add({
      targets: fog,
      x: -w,
      duration: 24000,
      repeat: -1,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
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
          const exposed = topExposed(solids, tx, ty);
          const key = this.theme.groundAt
            ? this.theme.groundAt(tx, ty, exposed)
            : exposed
              ? this.theme.ground
              : this.theme.groundFill;
          this.add.image(cx, cy, key).setDepth(0);
        } else if (oneWays[ty][tx]) {
          if (this.theme.oneWayAnim) {
            // Animated one-way (archive floating page): a Sprite playing its
            // flutter anim. Its multi-frame texture has no bare-key alias, so
            // address frame 0 explicitly rather than add.image(bareKey).
            const page = this.add.sprite(cx, cy, frameKey(this.theme.oneWay, 0)).setDepth(0);
            page.play(animKey(this.theme.oneWay, this.theme.oneWayAnim));
          } else {
            const key = this.theme.oneWayAt ? this.theme.oneWayAt(tx) : this.theme.oneWay;
            this.add.image(cx, cy, key).setDepth(0);
          }
        } else if (hazards[ty][tx]) {
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

    // Boss door marker (suppressed in arenas, where the required D is inert
    // and sits mid-air at the boss spawn).
    if (this.drawDoorMarker) {
      const d = this.lvl.bossDoor;
      this.add.rectangle(d.tx * TILE + TILE / 2, d.ty * TILE + TILE / 2, 12, 20, 0x5b3fb8).setDepth(2);
    }

    // Checkpoint flags (raise on latch).
    for (const cp of this.lvl.checkpoints) {
      const obj = this.add
        .rectangle(cp.tx * TILE + TILE / 2, cp.ty * TILE + TILE - 6, 4, 12, 0x8b6cf0)
        .setDepth(2);
      this.checkpointMarkers.push({ pt: cp, obj });
    }

    // Truth Seals (Task 34): pulsing jade gems, auto-collect on overlap. Each
    // lights an rtSeals pip beside the ActionBar; the Broken King arena tops
    // the count to 3 regardless (amendment Task 35 belt-and-suspenders).
    for (const s of this.lvl.seals) {
      const key = `${s.tx},${s.ty}`;
      const cx = s.tx * TILE + TILE / 2;
      const cy = s.ty * TILE + TILE / 2;
      const gem = this.add.rectangle(cx, cy, 9, 9, 0x4f9e86).setAngle(45).setDepth(2);
      const halo = this.add.rectangle(cx, cy, 14, 14, 0x4f9e86, 0.22).setAngle(45).setDepth(2);
      this.tweens.add({
        targets: [gem, halo],
        scale: 1.2,
        yoyo: true,
        repeat: -1,
        duration: 520,
        ease: "Sine.easeInOut",
      });
      const zone = this.add.zone(cx, cy, 14, 16);
      this.physics.add.existing(zone);
      (zone.body as Body).setAllowGravity(false);
      this.physics.add.overlap(this.player, zone, () => {
        if (this.collectedSeals.has(key)) return;
        this.collectedSeals.add(key);
        audio.sfx("seal");
        gem.destroy();
        halo.destroy();
        zone.destroy();
        gameStore.set({ rtSeals: { lit: this.collectedSeals.size, of: this.lvl.seals.length } });
      });
    }
    if (this.lvl.seals.length > 0) {
      gameStore.set({ rtSeals: { lit: 0, of: this.lvl.seals.length } });
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

  // --- rotators (Task 20 archive) -------------------------------------------

  /** Build rotator clusters: a fixed pivot hub with 3 one-way page platforms at
   *  tile distances 1/2/3, starting laid out to the RIGHT of the pivot. They
   *  orbit in updateRotators(). No-op unless the theme wires a rotator tile
   *  (archive only) — other themes parse zero `@` markers. */
  private buildRotators() {
    this.rotatorGroup = this.physics.add.staticGroup();
    if (!this.theme.rotatorKey) return;
    for (const r of this.lvl.rotators) {
      const cx = r.tx * TILE + TILE / 2;
      const cy = r.ty * TILE + TILE / 2;
      // Pivot hub decoration (a small sepia disc the arms swing around).
      this.add.circle(cx, cy, 3, 0x8f7a55).setDepth(1).setAlpha(0.9);
      const arms: RotatorArm[] = [];
      for (let d = 1; d <= 3; d++) {
        const ax = cx + d * TILE; // orientation 0 = right
        const ay = cy;
        const sprite = this.rotatorGroup.create(ax, ay, frameKey(this.theme.rotatorKey, 0)) as Phaser.Physics.Arcade.Sprite;
        sprite.setDepth(2);
        if (this.theme.rotatorAnim) sprite.play(animKey(this.theme.rotatorKey, this.theme.rotatorAnim));
        const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
        body.checkCollision.down = false; // one-way: ride the crown, pass from below/sides
        body.checkCollision.left = false;
        body.checkCollision.right = false;
        arms.push({ sprite, prevX: ax, prevY: ay });
      }
      this.rotators.push({ cx, cy, arms });
    }
    this.physics.add.collider(this.player, this.rotatorGroup);
  }

  private updateRotators() {
    if (this.rotators.length === 0) return;
    const t = this.time.now;
    const stepIndex = Math.floor(t / ROTATOR_STEP_MS);
    const cur = stepIndex % 4;
    const next = (stepIndex + 1) % 4;
    const phase = t % ROTATOR_STEP_MS;
    const tweenStart = ROTATOR_STEP_MS - ROTATOR_TWEEN_MS;
    let f = 0;
    if (phase > tweenStart) {
      const p = (phase - tweenStart) / ROTATOR_TWEEN_MS;
      f = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
    }
    const [cx0, cy0] = ROTATOR_ORIENT[cur];
    const [nx0, ny0] = ROTATOR_ORIENT[next];
    for (const rot of this.rotators) {
      for (let i = 0; i < rot.arms.length; i++) {
        const d = (i + 1) * TILE;
        const curX = rot.cx + cx0 * d;
        const curY = rot.cy + cy0 * d;
        const nxtX = rot.cx + nx0 * d;
        const nxtY = rot.cy + ny0 * d;
        const px = curX + (nxtX - curX) * f;
        const py = curY + (nxtY - curY) * f;
        const arm = rot.arms[i];
        const dx = px - arm.prevX;
        const dy = py - arm.prevY;
        arm.sprite.setPosition(px, py);
        (arm.sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        // Carry a rider through the swing (both axes) — the graceful choice.
        if ((dx !== 0 || dy !== 0) && this.isRidingRotator(arm.sprite)) {
          this.player.x += dx;
          this.player.y += dy;
        }
        arm.prevX = px;
        arm.prevY = py;
      }
    }
  }

  private isRidingRotator(sprite: Phaser.Physics.Arcade.Sprite): boolean {
    const pb = this.player.body as Body;
    const top = sprite.y - TILE / 2;
    const left = sprite.x - TILE / 2;
    const right = sprite.x + TILE / 2;
    const onTop = pb.blocked.down && Math.abs(pb.bottom - top) < 8;
    const xOverlap = pb.right > left + 2 && pb.left < right - 2;
    return onTop && xOverlap;
  }

  // --- castle hazards (Task 21) ---------------------------------------------

  /** Build the castle's fireball fountains (pooled arcing fireballs), collapsing
   *  iron bridges, and the rising-corruption tide. No-op in other themes: the
   *  parser yields no `!`/`~` cells and no level authors a corruption segment,
   *  so the groups stay empty and the update loops early-return. */
  private buildCastleHazards() {
    // Pooled arcing fireballs (gravity-affected): one group + one solid-collider
    // (despawn on hit) + one player-overlap (1 dmg + despawn) for the level's
    // lifetime; members recycle via getFirstDead.
    this.fireballGroup = this.physics.add.group();
    this.physics.add.collider(this.fireballGroup, this.solidGroup, (fb) =>
      this.despawnFireball(fb as Phaser.Physics.Arcade.Sprite),
    );
    this.physics.add.overlap(this.player, this.fireballGroup, (_pl, fb) => {
      this.despawnFireball(fb as Phaser.Physics.Arcade.Sprite);
      this.takeDamage(1);
    });

    // Fireball fountains: one record per `!` cell, staggered so a row of spouts
    // doesn't erupt in unison; arc direction alternates.
    const n = Math.max(1, this.lvl.fountains.length);
    this.lvl.fountains.forEach((f, i) => {
      const x = f.tx * TILE + TILE / 2;
      const y = f.ty * TILE + TILE / 2;
      this.add.rectangle(x, y + TILE / 2, 6, 4, 0xff9f45).setDepth(1).setAlpha(0.85); // spout base
      this.fountains.push({
        x,
        y,
        nextAt:
          this.time.now +
          ((i * FOUNTAIN_PERIOD_MS) / n) * (this.accessibility.slowerHazards ? 1.25 : 1),
        dir: i % 2 === 0 ? 1 : -1,
      });
    });

    // Collapsing bridges: a one-way body + sprite per `~` cell.
    this.bridgeGroup = this.physics.add.staticGroup();
    for (const b of this.lvl.bridges) {
      const cx = b.tx * TILE + TILE / 2;
      const cy = b.ty * TILE + TILE / 2;
      const sprite = this.add
        .sprite(cx, cy, frameKey(this.theme.bridgeKey ?? CASTLE_TILE_KEYS.bridge, 0))
        .setDepth(2);
      const rect = this.add.rectangle(cx, cy, TILE, TILE).setVisible(false);
      this.bridgeGroup.add(rect);
      const body = rect.body as Phaser.Physics.Arcade.StaticBody;
      body.checkCollision.down = false; // one-way: ride the deck, pass from below
      body.checkCollision.left = false;
      body.checkCollision.right = false;
      this.bridges.push({ sprite, rect, cx, cy, fallAt: null, respawnAt: null, gone: false });
    }
    this.physics.add.collider(this.player, this.bridgeGroup);

    // Rising-corruption shaft: the drawn tide surface, starting at the floor.
    const seg = this.def.corruption;
    if (seg) {
      const x0 = seg.fromTx * TILE;
      const x1 = (seg.toTx + 1) * TILE;
      this.tideTop = seg.floorTy * TILE;
      this.tideRect = this.add
        .rectangle(x0, this.tideTop, x1 - x0, this.mapHeightPx - this.tideTop, 0x8a1020, 0.55)
        .setOrigin(0, 0)
        .setDepth(6);
    }
  }

  /** Render the castle's decorative sprites (chains / banners / statues) and the
   *  storm lightning-flash overlay. Purely cosmetic — no collision. */
  private buildCastleDecor() {
    for (const d of this.def.decor ?? []) {
      // City/temple decor (Task 34) shares this generic decor path.
      if (d.kind === "temple-door") {
        // The great temple door: two 16×48 halves straddling (tx, tx+1).
        this.add
          .sprite(d.tx * TILE + 8, d.ty * TILE + 24, frameKey(CITY_TILE_KEYS.templeDoorL, 0))
          .setDepth(1);
        this.add
          .sprite((d.tx + 1) * TILE + 8, d.ty * TILE + 24, frameKey(CITY_TILE_KEYS.templeDoorR, 0))
          .setDepth(1);
        continue;
      }
      if (d.kind === "neon" || d.kind === "lantern") {
        const key = d.kind === "neon" ? CITY_TILE_KEYS.cityNeon : CITY_TILE_KEYS.templeLantern;
        const anim = d.kind === "neon" ? CITY_NEON_ANIM : TEMPLE_LANTERN_ANIM;
        const sprite = this.add
          .sprite(d.tx * TILE + 8, d.ty * TILE + 8, frameKey(key, 0))
          .setDepth(1);
        sprite.play(animKey(key, anim));
        continue;
      }
      if (d.kind === "anchor" || d.kind === "sinkhole") {
        const key = d.kind === "anchor" ? DESERT_TILE_KEYS.anchor : DESERT_TILE_KEYS.sinkhole;
        this.add.sprite(d.tx * TILE + 8, d.ty * TILE + 8, frameKey(key, 0)).setDepth(1);
        continue;
      }
      if (d.kind === "crystal") {
        const sprite = this.add
          .sprite(d.tx * TILE + 8, d.ty * TILE + 8, frameKey(DESERT_TILE_KEYS.crystal, 0))
          .setDepth(1);
        sprite.play(animKey(DESERT_TILE_KEYS.crystal, CAVE_CRYSTAL_ANIM));
        continue;
      }
      if (d.kind === "roof" || d.kind === "azulejo" || d.kind === "balcony") {
        const key =
          d.kind === "roof"
            ? COAST_TILE_KEYS.roof
            : d.kind === "azulejo"
              ? COAST_TILE_KEYS.azulejo
              : COAST_TILE_KEYS.balcony;
        this.add.sprite(d.tx * TILE + 8, d.ty * TILE + 8, frameKey(key, 0)).setDepth(1);
        continue;
      }
      if (d.kind === "casino-neon" || d.kind === "casino-slot") {
        const key = d.kind === "casino-neon" ? CASINO_TILE_KEYS.neon : CASINO_TILE_KEYS.slot;
        const anim = d.kind === "casino-neon" ? CASINO_NEON_ANIM : CASINO_SLOT_ANIM;
        // The slot is 16×24 — anchor its top-left to the tile cell.
        const h = d.kind === "casino-slot" ? 24 : 16;
        const sprite = this.add
          .sprite(d.tx * TILE + 8, d.ty * TILE + h / 2, frameKey(key, 0))
          .setDepth(1);
        sprite.play(animKey(key, anim));
        continue;
      }
      if (d.kind.startsWith("rain-")) {
        const rainKeyByKind: Record<string, string> = {
          "rain-lamp": RAIN_TILE_KEYS.lamp,
          "rain-fence": RAIN_TILE_KEYS.fence,
          "rain-clockface": RAIN_TILE_KEYS.clockFace,
          "rain-glass": RAIN_TILE_KEYS.glass,
          "rain-chandelier": RAIN_TILE_KEYS.chandelier,
          "rain-bell": RAIN_TILE_KEYS.bell,
          "rain-headstone": RAIN_TILE_KEYS.headstone,
        };
        const key = rainKeyByKind[d.kind];
        const sprite = this.add.sprite(d.tx * TILE + 8, d.ty * TILE + 8, frameKey(key, 0)).setDepth(1);
        if (d.kind === "rain-lamp") sprite.play(animKey(key, RAIN_LAMP_ANIM));
        if (d.kind === "rain-glass") sprite.play(animKey(key, RAIN_GLASS_ANIM));
        continue;
      }
      const key =
        d.kind === "chain"
          ? CASTLE_TILE_KEYS.chain
          : d.kind === "banner"
            ? CASTLE_TILE_KEYS.banner
            : CASTLE_TILE_KEYS.statue;
      const w = d.kind === "chain" ? 8 : 16;
      const h = d.kind === "banner" ? 24 : d.kind === "statue" ? 32 : 16;
      // Anchor the sprite's top-left to the tile cell's top-left.
      const sprite = this.add
        .sprite(d.tx * TILE + w / 2, d.ty * TILE + h / 2, frameKey(key, 0))
        .setDepth(d.kind === "statue" ? 3 : 1);
      if (d.kind === "banner") sprite.play(animKey(CASTLE_TILE_KEYS.banner, CASTLE_BANNER_ANIM));
    }

    if (this.def.theme !== "castle" && this.def.theme !== "rift") return;
    // Lightning flicker: a world-covering red-white sheet (scrollFactor 1, so
    // zoom-safe like the parallax) that flashes on a storm cadence.
    this.lightningFlash = this.add
      .rectangle(0, 0, this.mapWidthPx, this.mapHeightPx, 0xff6a6a, 0)
      .setOrigin(0, 0)
      .setDepth(-8);
    const strike = () => {
      if (!this.lightningFlash) return;
      if (!this.accessibility.reduceFlash) {
        this.tweens.add({ targets: this.lightningFlash, alpha: { from: 0.3, to: 0 }, duration: 240, ease: "Quad.in" });
      }
      this.time.delayedCall(2200 + Math.floor(Math.random() * 3800), strike);
    };
    this.time.delayedCall(1400, strike);
  }

  private spawnFireball(f: Fountain) {
    let fb = this.fireballGroup.getFirstDead(false) as Phaser.Physics.Arcade.Sprite | null;
    if (!fb) {
      fb = this.fireballGroup.create(f.x, f.y, CASTLE_TILE_KEYS.fireball) as Phaser.Physics.Arcade.Sprite;
      fb.setDepth(7);
    }
    fb.setActive(true).setVisible(true);
    const body = fb.body as Body;
    body.enable = true;
    body.reset(f.x, f.y);
    body.setAllowGravity(true); // gravity-affected arc
    const speed = this.accessibility.slowerHazards ? 0.8 : 1;
    body.setVelocity(f.dir * FIREBALL_VX * speed, FIREBALL_VY * speed);
    fb.setData("bornAt", this.time.now);
  }

  private despawnFireball(fb: Phaser.Physics.Arcade.Sprite) {
    if (!fb.active) return;
    fb.setActive(false).setVisible(false);
    const body = fb.body as Body;
    body.stop();
    body.enable = false;
  }

  private updateFountains() {
    if (this.fountains.length === 0) return;
    const now = this.time.now;
    for (const f of this.fountains) {
      if (now >= f.nextAt) {
        f.nextAt = now + FOUNTAIN_PERIOD_MS * (this.accessibility.slowerHazards ? 1.25 : 1);
        this.spawnFireball(f);
      }
    }
    // Expire fireballs that fell off the bottom or outlived their flight.
    for (const obj of this.fireballGroup.getChildren()) {
      const fb = obj as Phaser.Physics.Arcade.Sprite;
      if (!fb.active) continue;
      if (fb.y > this.mapHeightPx + 40 || now - (fb.getData("bornAt") as number) > FIREBALL_TTL_MS)
        this.despawnFireball(fb);
    }
  }

  private updateBridges() {
    if (this.bridges.length === 0) return;
    const now = this.time.now;
    const pb = this.player.body as Body;
    for (const br of this.bridges) {
      if (br.gone) {
        if (br.respawnAt !== null && now >= br.respawnAt) this.respawnBridge(br);
        continue;
      }
      if (br.fallAt === null) {
        // Arm on the FIRST touch: player's feet on this bridge's top face.
        const standing =
          pb.blocked.down &&
          Math.abs(pb.bottom - (br.cy - TILE / 2)) < 6 &&
          Math.abs(this.player.x - br.cx) < TILE / 2 + 2;
        if (standing) {
          br.fallAt = now + BRIDGE_SHAKE_MS;
          audio.sfx("error");
        }
      } else {
        // Shaking: jitter + advance the crack frames, then fall.
        br.sprite.x = br.cx + Math.sin(now / 18) * 1.2;
        const prog = 1 - (br.fallAt - now) / BRIDGE_SHAKE_MS; // 0..1
        br.sprite.setTexture(
          frameKey(this.theme.bridgeKey ?? CASTLE_TILE_KEYS.bridge, prog > 0.6 ? 2 : 1),
        );
        if (now >= br.fallAt) this.collapseBridge(br);
      }
    }
  }

  private collapseBridge(br: Bridge) {
    br.gone = true;
    br.fallAt = null;
    br.respawnAt = this.time.now + BRIDGE_RESPAWN_MS;
    (br.rect.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    br.sprite.x = br.cx;
    this.tweens.add({
      targets: br.sprite,
      y: br.cy + TILE * 3,
      alpha: 0,
      duration: 400,
      onComplete: () => br.sprite.setVisible(false),
    });
    audio.sfx("damage");
  }

  private respawnBridge(br: Bridge) {
    br.gone = false;
    br.respawnAt = null;
    br.fallAt = null;
    (br.rect.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    this.tweens.killTweensOf(br.sprite);
    br.sprite.setTexture(frameKey(this.theme.bridgeKey ?? CASTLE_TILE_KEYS.bridge, 0));
    br.sprite.setPosition(br.cx, br.cy).setAlpha(1).setVisible(true);
  }

  // --- desert world mechanics (Task 36): vertical lifts + ceiling debris -----

  /** Build the `I` lift movers and `*` ceiling-debris marks. No-op for maps
   *  that parse none of them. */
  private buildDesertMechanics() {
    for (const l of this.lvl.lifts) {
      const cx = l.tx * TILE + TILE / 2;
      const cy = l.ty * TILE + TILE / 2;
      const key = this.theme.liftKey ?? this.theme.oneWay;
      const sprite = this.physics.add.image(cx, cy, frameKey(key, 0)).setDepth(2);
      const body = sprite.body as Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.checkCollision.down = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;
      this.physics.add.collider(this.player, sprite);
      const topY = cy - 6 * TILE; // rides six rows up
      body.setVelocityY(-LIFT_SPEED);
      this.lifts.push({ sprite, topY, bottomY: cy, prevY: cy });
    }
    for (const m of this.lvl.debrisMarks) {
      const cx = m.tx * TILE + TILE / 2;
      const cy = m.ty * TILE + TILE / 2;
      const glint = this.add.rectangle(cx, cy, 6, 6, 0xbff2ff, 0.9).setAngle(45).setDepth(2);
      this.tweens.add({ targets: glint, alpha: 0.35, yoyo: true, repeat: -1, duration: 420 });
      this.debrisTraps.push({ x: cx, y: cy, glint, rock: null, rearmAt: 0 });
    }
  }

  private updateDesertMechanics(dtMs: number) {
    const now = this.time.now;
    const pb = this.player.body as Body;
    for (const lift of this.lifts) {
      const body = lift.sprite.body as Body;
      if (lift.sprite.y <= lift.topY) body.setVelocityY(LIFT_SPEED);
      else if (lift.sprite.y >= lift.bottomY) body.setVelocityY(-LIFT_SPEED);
      // Vertical carry: riders keep contact through the ascent.
      const dy = lift.sprite.y - lift.prevY;
      const onTop =
        pb.blocked.down &&
        Math.abs(pb.bottom - body.top) < 8 &&
        pb.right > body.left + 2 &&
        pb.left < body.right - 2;
      if (dy !== 0 && onTop) this.player.y += dy;
      lift.prevY = lift.sprite.y;
    }
    for (const trap of this.debrisTraps) {
      if (trap.rock) {
        trap.rock.y += (DEBRIS_FALL_SPEED * (this.accessibility.slowerHazards ? 0.8 : 1) * dtMs) / 1000;
        const rb = trap.rock.getBounds();
        if (
          pb.left < rb.right &&
          pb.right > rb.left &&
          pb.top < rb.bottom &&
          pb.bottom > rb.top
        ) {
          this.takeDamage(1);
          trap.rock.destroy();
          trap.rock = null;
          continue;
        }
        if (trap.rock.y > this.mapHeightPx + 24) {
          trap.rock.destroy();
          trap.rock = null;
        }
        continue;
      }
      if (now < trap.rearmAt) continue;
      // Trigger when the player passes underneath the mark.
      if (Math.abs(this.player.x - trap.x) < 34 && this.player.y > trap.y) {
        trap.rearmAt = now + 4200 * (this.accessibility.slowerHazards ? 1.25 : 1);
        trap.rock = this.add.rectangle(trap.x, trap.y + 6, 12, 12, 0x4a3524).setDepth(3);
      }
    }
  }

  /** Rising-corruption shaft (castle): while the player is within the segment's
   *  column span the tide surface climbs 12px/s (capped at ceilTy); leaving the
   *  span (or respawning) resets it to the floor. Feet below the surface inside
   *  the span = 1 dmg + an upward knock out of the tide. */
  private updateCorruption(dtMs: number) {
    const seg = this.def.corruption;
    if (!seg || !this.tideRect) return;
    const x0 = seg.fromTx * TILE;
    const x1 = (seg.toTx + 1) * TILE;
    const floorY = seg.floorTy * TILE;
    const ceilY = seg.ceilTy * TILE;
    const inside = !this.dead && this.player.x >= x0 && this.player.x <= x1;
    if (inside) this.tideTop = Math.max(ceilY, this.tideTop - CORRUPTION_RISE_PXPS * (dtMs / 1000));
    else this.tideTop = floorY;

    this.tideRect
      .setPosition(x0, this.tideTop)
      .setSize(x1 - x0, this.mapHeightPx - this.tideTop)
      .setFillStyle(0x8a1020, 0.5 + 0.1 * Math.sin(this.time.now / 120));

    const pb = this.player.body as Body;
    if (inside && pb.bottom > this.tideTop && this.time.now >= this.iframesUntil) {
      this.takeDamage(1);
      if (!this.dead) {
        pb.setVelocityY(-260); // knock upward out of the rising tide
        this.knockbackUntil = this.time.now + KNOCKBACK_MS;
      }
    }
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
    const speed = this.accessibility.slowerHazards ? 0.8 : 1;
    body.setVelocity(vx * speed, vy * speed);
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
      else if (s.kind === "crown-imp") enemy = new CrownImp(this, x, y);
      if (enemy) {
        // Shadow / strong-variant rule (Task 20 archive, Task 21 castle): a
        // darker, tankier palette-swap that survives hit flashes, +1 hp. The
        // archive uses the default 0x333333 shadow; the castle's strong gauntlet
        // uses a blood-dark tint AND a +10 patrol-speed bonus (makeShadow stays
        // additive — see Enemy.makeShadow).
        if (this.def.theme === "archive") enemy.makeShadow();
        else if (this.def.theme === "castle" || this.def.theme === "rift") enemy.makeShadow(CASTLE_SHADOW_TINT, CASTLE_SPEED_BONUS);
        this.enemyGroup.add(enemy);
      }
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
      // A stomp KILL (die() flips `dying` synchronously) grants a POWER stack
      // — the level's fuel for the boss fight beyond the truth mechanic.
      if (enemy.dying) this.gainPower(enemy.x, enemy.y);
    } else enemy.hurtPlayer();
  };

  /** +1 POWER (capped): stomp-kill reward. Pops a little floating tag and
   *  lights the HUD chip; the stacks ride through enterBoss() into the arena
   *  as bonus swing damage. */
  private gainPower(x: number, y: number) {
    if (this.powerStacks >= POWER_STACK_MAX) return;
    this.powerStacks++;
    audio.sfx("crit");
    this.pushHud();
    const tag = this.add
      .text(x, y - 10, "+POWER", {
        fontFamily: "monospace",
        fontSize: "8px",
        fontStyle: "bold",
        color: "#ffd75e",
        stroke: "#16161c",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({
      targets: tag,
      y: y - 28,
      alpha: 0,
      duration: 750,
      ease: "Sine.easeOut",
      onComplete: () => tag.destroy(),
    });
  }

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

  private spawnPlayer(spawnAt: "start" | "checkpoint" | "door", exactCheckpoint?: Pt) {
    let at: Pt = this.lvl.playerStart;
    if (spawnAt === "door") at = this.lvl.bossDoor;
    else if (exactCheckpoint) at = exactCheckpoint;
    else if (spawnAt === "checkpoint" && this.lvl.checkpoints.length > 0)
      at = this.lvl.checkpoints[0];
    this.lastCheckpoint = { ...at };

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

    if (gameStore.get().paused) {
      // Consume input while paused; P/Esc toggles back out (no soft-lock).
      if (snap.pausePressed) {
        this.resumeGame();
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

    if (onGround) {
      this.lastGroundedAt = this.time.now;
      this.airJumpsUsed = 0;
    }
    if (snap.jumpPressed) this.jumpQueuedAt = this.time.now;

    const canCoyote = this.time.now - this.lastGroundedAt <= PHYSICS.coyoteMs;
    const buffered = this.time.now - this.jumpQueuedAt <= PHYSICS.jumpBufferMs;
    if (buffered && canCoyote && !this.dashing) {
      body.setVelocityY(PHYSICS.jumpVelocity);
      this.jumpFiredAt = this.time.now;
      this.jumpQueuedAt = -Infinity;
      this.lastGroundedAt = -Infinity;
      audio.sfx("jump");
    } else if (
      snap.jumpPressed &&
      !onGround &&
      !canCoyote &&
      !this.dashing &&
      this.airJumpsUsed < 1
    ) {
      // Double jump: one air jump per airtime — the hop-over-his-attack tool.
      // Fresh presses only (not the buffer), and the queued press is consumed
      // so landing a moment later can't fire a second buffered jump.
      this.airJumpsUsed += 1;
      body.setVelocityY(PHYSICS.doubleJumpVelocity);
      this.jumpFiredAt = this.time.now;
      this.jumpQueuedAt = -Infinity;
      audio.sfx("jump");
      const puff = this.add.circle(this.player.x, body.bottom, 5, 0xffffff, 0.45).setDepth(9);
      this.tweens.add({
        targets: puff,
        scale: 1.9,
        alpha: 0,
        duration: 240,
        onComplete: () => puff.destroy(),
      });
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
      if (shouldStartDash(snap.dashPressed, dashReady, dir)) {
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
    if (this.updateMidBossEntry()) {
      input.consume();
      return;
    }

    this.playAnimFor(body, onGround); // idle/run/jump/fall by velocity, unless attacking/hurt
    if (snap.attackPressed && !this.attacking) this.doAttack(); // 220ms hitbox 14x18 in front, sfx
    if (snap.interactPressed) this.tryInteract(); // door / fragment

    // `?debug=1` read-only playtest telemetry (gated, shipped — see the field
    // doc). Subclasses may augment the object after super.update().
    if (this.debugTelemetry) {
      (window as unknown as Record<string, unknown>).__adv = {
        px: this.player.x,
        py: this.player.y,
        hp: this.health,
        level: this.def.id,
      };
    }

    // Drive enemy AI (patrol, phishling state machine, particles). Frozen while
    // paused because we return above before reaching here.
    for (const obj of this.enemyGroup.getChildren()) (obj as Enemy).tick(dtMs);

    // Task 18 world mechanics: fake-platform collapse/flicker, boat ferrying,
    // and pooled enemy-projectile expiry. Frozen with the rest while paused.
    this.updateFakes();
    this.updateBoats();
    this.updateDesertMechanics(dtMs);
    this.updateProjectiles();

    // Task 19 factory hazard set: conveyor push (after enemy ticks so it layers
    // on their velocity), timed gates, and laser on/off cycles.
    this.applyConveyors();
    this.updateGates();
    this.updateLasers();
    this.updateRotators(); // Task 20 archive: orbiting page platforms + rider carry

    // Task 21 castle hazards: fireball fountains, collapsing bridges, and the
    // rising-corruption tide. Frozen with the rest while paused (return above).
    this.updateFountains();
    this.updateBridges();
    this.updateCorruption(dtMs);

    if (snap.pausePressed) {
      this.pauseGame();
    }
    if (this.player.y > this.mapHeightPx + 40) this.respawn(1); // pit: 1 dmg, checkpoint
    input.consume();
  }

  /** Pause the whole Phaser scene, not only its update body: scene time,
   * tweens, delayed calls, Arcade bodies, and boss mechanic timers all freeze. */
  private pauseGame(): void {
    if (gameStore.get().paused) return;
    gameStore.set({ paused: true });
    this.physics.pause();
    this.scene.pause();
  }

  private resumeGame(): void {
    if (!gameStore.get().paused) return;
    gameStore.set({ paused: false });
    this.scene.resume();
    this.physics.resume();
    input.consume();
  }

  /** Pause-menu restart. A level rebuilds from the exact active checkpoint;
   * arenas override this to rebuild the sealed room from its entry state. */
  protected restartFromCheckpoint(): void {
    const checkpoint = { ...this.lastCheckpoint };
    gameStore.set({ paused: false });
    this.scene.resume();
    this.physics.resume();
    this.scene.restart({ levelId: this.def.id, spawnAt: "checkpoint", checkpoint } satisfies LevelSceneData);
  }

  protected quitToMap(): void {
    gameStore.set({ paused: false });
    this.scene.resume();
    this.physics.resume();
    this.scene.start("Overworld");
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

  protected doAttack() {
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
    if (this.nearFragment && !this.fragmentCollected) {
      this.fragmentCollected = true;
      this.fragments += 1;
      this.player.play(animKey("player", "interact"), true);
      audio.sfx("collect");
      this.fragmentSprite?.destroy();
      this.pushHud();
      bus.emit("level:fragment", { levelId: this.def.id });
      persistSave(collectMemoryFragment(loadSave(), this.def.id));
      return;
    }
    if (this.nearDoor) this.enterBoss();
  }

  protected enterBoss() {
    // Real-time rework (Task 33): the boss door hands off to the BossArenaScene
    // directly — no dialogue, no turn-based controller (that path is dormant
    // and unreachable; files preserved). Each level's RT boss def arrives with
    // its world task (35–45); until it registers, the door shows COMING SOON.
    // The old castle-key seal is gone with the dormant fragment system — the
    // castle gates on overworld unlock (1-4 completion) alone.
    const rtBossId = LEVEL_RT_BOSS[this.def.id];
    if (!rtBossId || !getRtBoss(rtBossId)) {
      audio.sfx("select");
      this.showToast("COMING SOON");
      return;
    }
    this.scene.start("Arena", {
      bossId: rtBossId,
      fromLevel: this.def.id,
      power: this.powerStacks, // stomp-earned swing bonus rides into the fight
    });
  }

  /** World 1-4's sealed courtyard is an automatic mid-level handoff. Its
   * victory resumes at the first checkpoint beyond `Q`; it never completes
   * the world (the Veiled Archer + chase own that transition). */
  private updateMidBossEntry(): boolean {
    const marker = this.lvl.midBossDoor;
    const bossId = this.def.midBossId as RtBossId | undefined;
    if (!marker || !bossId || this.midBossCleared) return false;
    if (this.midBossLaunching) return true;

    const triggerX = marker.tx * TILE + TILE / 2;
    if (this.player.x < triggerX) return false;
    if (!getRtBoss(bossId)) {
      this.midBossCleared = true;
      this.showToast("COMING SOON");
      return false;
    }

    this.midBossLaunching = true;
    const resumeAt = this.lvl.checkpoints.find((point) => point.tx > marker.tx) ?? {
      tx: marker.tx + 3,
      ty: marker.ty,
    };
    (this.player.body as Body).setVelocity(0, 0);
    this.physics.pause();
    this.showToast("COURTYARD SEALED");
    this.time.delayedCall(420, () => {
      this.cameras.main.fadeOut(240, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("Arena", {
          bossId,
          midLevel: { levelId: this.def.id, resumeAt },
          power: this.powerStacks,
        });
      });
    });
    return true;
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

  protected takeDamage(n: number) {
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
    this.time.delayedCall(DEATH_MS, () => this.afterDeath());
  }

  /** What happens once the death animation finishes. Base: respawn at the last
   *  checkpoint with full health. BossArenaScene overrides to fade + restart the
   *  arena from full hearts ("retry from immediately before the boss"). */
  protected afterDeath(): void {
    this.respawn(0);
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
    const body = this.player.body as Body;
    // Teleport via body.reset — setPosition alone leaves the body's `prev` at
    // the DEATH spot, and the huge one-frame delta could tunnel the player
    // through the checkpoint's floor ("respawning beneath the ground").
    // Spawn 4px high of the cell centre so the body's feet land ON the floor
    // face instead of starting embedded in it.
    body.reset(cp.tx * TILE + TILE / 2, cp.ty * TILE + TILE / 2 - 4);
    body.setVelocity(0, 0);
    this.player.setAlpha(1);
    this.player.play(animKey("player", "idle"), true);

    // Reset the rising-corruption tide (Task 21): a respawn drops the player at a
    // checkpoint outside the shaft, so the tide returns to the floor.
    if (this.def.corruption) this.tideTop = this.def.corruption.floorTy * TILE;

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

  protected pushHud() {
    gameStore.set({
      hearts: { current: this.health, max: this.maxHealth },
      hud: {
        health: this.health,
        maxHealth: this.maxHealth,
        buffs: [...this.buffs],
        fragments: this.fragments,
        power: this.powerStacks,
        levelId: this.def.id,
      },
    });
  }

  /** A brief centred banner (the castle "seal held" / "COMING SOON" beats),
   *  positioned at the camera's world midpoint so it reads under zoom. */
  private showToast(msg: string) {
    this.toast?.destroy();
    const cam = this.cameras.main;
    const t = this.add
      .text(cam.midPoint.x, cam.midPoint.y - 28, msg, {
        fontFamily: "monospace",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#ffd75e",
        backgroundColor: "#000000cc",
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(100);
    this.toast = t;
    this.tweens.add({
      targets: t,
      alpha: { from: 1, to: 0 },
      delay: 1000,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }
}
