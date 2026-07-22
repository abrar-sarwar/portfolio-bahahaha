// features/adventure/realtime/BossController.ts
//
// Binds the PURE BossStateMachine to the Phaser arena (amendment §4): steps the
// machine, translates MachineCommands into sprite anims / telegraph tints /
// sfx / effects, and hosts the per-boss BossMechanics module through the
// MechanicsApi. The scene keeps physics ownership (player, melee zone, stomp,
// death) and hands the controller two small callbacks for the attack window;
// everything else boss-side lives here.
//
// The game-wide parryable signal: a GOLD tint + halo pulse during a parryable
// attack's telegraph (unparryable = red). Every boss shares this exact cue
// (amendment §3); glow projectiles reuse the same gold in ProjectileManager.
import Phaser from "phaser";
import { initBossState, stepBoss } from "./BossStateMachine";
import { RT_ANIM, RT_MECHANIC, makeRng } from "./config";
import type {
  BossMachineState,
  MachineCommand,
  MachineEvent,
  RtAttackSpec,
  RtBossDef,
} from "./types";
import type { ProjectileManager } from "./ProjectileManager";
import type { ArenaHazardSystem } from "./ArenaHazardSystem";
import { animKey } from "../art/textures";
import { gameStore } from "../bridge/GameStore";
import { input } from "../input/InputState";
import { audio } from "../audio/synth";
import type { SfxId } from "../ids";

/** The surface a boss's mechanics module programs against (amendment §4 +
 *  the six boss-demands memos). Concrete needs only — extended additively. */
export interface MechanicsApi {
  def: RtBossDef;
  player: Phaser.Physics.Arcade.Sprite;
  boss: Phaser.Physics.Arcade.Sprite;
  /** Read-only machine snapshot (fsm, hp, phaseIndex, vulnerableMs, …). */
  machine(): Readonly<BossMachineState>;
  /** Queue a machine event for the next live step (force-phase, force-stagger,
   *  set-invulnerable, set-tempo, mechanic hits, …). */
  emit(e: MachineEvent): void;
  /** Scripted finish — routes RT_MECHANIC.forceDefeat through the machine. */
  forceDefeat(): void;
  projectiles: ProjectileManager;
  hazards: ArenaHazardSystem;
  /** Drive the ActionBar context slot (`[ E REVEAL TRUTH ]`); null restores
   *  the default interact slot. `progress` renders a 0..1 hold fill. */
  setContextAction(a: { key: string; label: string; progress?: number } | null): void;
  /** Bottom objective line (`STOMPS: 3 / 15`); null hides it. */
  setObjective(text: string | null): void;
  /** Seal/clasp/truth pips beside the bar; null hides them. */
  setSeals(v: { lit: number; of: number } | null): void;
  /** How long E has been continuously held, in ms (0 when up). */
  interactHeldMs(): number;
  /** True on the single frame E was TAPPED (edge, not level) — mash mechanics
   *  (the Broken King's downed-window truth tear). Captured by the scene
   *  before the base update consumes the input snapshot. */
  interactPressed(): boolean;
  /** Reshape the current/next attack's melee window (arena-wide sweeps,
   *  directional slams). Resets to the boss's default on attack-end. */
  shapeAttack(shape: { w: number; h: number; ox?: number; oy?: number }): void;
  /** Fire `cb` when a player swing connects with `target` (once per swing).
   *  No machine event is emitted — weak-point semantics are the mechanics'. */
  onSwingHit(target: Phaser.GameObjects.GameObject, cb: () => void): void;
  sfx(id: SfxId): void;
}

/** Per-boss mechanics module (truth seals, heart cycles, mask clasps, stomp
 *  counter, arrow platforms, weapon seals). Wired by the BossController. */
export interface BossMechanics {
  onCommand?(cmd: MachineCommand): void;
  update?(dt: number): void;
  /** Drained into the machine each live step. */
  events(): MachineEvent[];
  destroy(): void;
}

/** Factory signature every bossDefinitions module may export. The scene is the
 *  BossArenaScene (typed loosely here to keep this module scene-agnostic). */
export type MechanicsFactory = (scene: Phaser.Scene, api: MechanicsApi) => BossMechanics;

export interface BossControllerDeps {
  scene: Phaser.Scene;
  def: RtBossDef;
  boss: Phaser.Physics.Arcade.Sprite;
  player: Phaser.Physics.Arcade.Sprite;
  projectiles: ProjectileManager;
  hazards: ArenaHazardSystem;
  mechanicsFactory?: MechanicsFactory;
  /** The active window of `spec` opened — scene arms its melee overlap zone. */
  onAttackActive(spec: RtAttackSpec): void;
  /** The active window closed (attack-end / stagger / defeat). */
  onAttackEnd(): void;
  /** Reshape the melee window (MechanicsApi.shapeAttack passthrough). */
  shapeAttack(shape: { w: number; h: number; ox?: number; oy?: number }): void;
  /** Weak-point swing binding (MechanicsApi.onSwingHit passthrough). */
  bindSwing(target: Phaser.GameObjects.GameObject, cb: () => void): void;
  /** The machine reached `defeated` (absorbing) — scene runs the victory flow. */
  onDefeated(): void;
  rngSeed?: number;
  /** Silent-assist recovery lengthening (assistRT §6). Default 1. */
  recoveryScale?: number;
}

export class BossController {
  state: BossMachineState;
  readonly mechanics?: BossMechanics;
  private readonly api: MechanicsApi;
  private rng: () => number;
  private queued: MachineEvent[] = [];
  private interactHeldSince: number | null = null;
  private interactTapped = false;
  private lastSnapshotKey = "";

  constructor(private deps: BossControllerDeps) {
    this.state = initBossState(deps.def);
    this.rng = makeRng(deps.rngSeed ?? 0x51ed);

    this.api = {
      def: deps.def,
      player: deps.player,
      boss: deps.boss,
      machine: () => this.state,
      emit: (e) => this.queued.push(e),
      forceDefeat: () => this.queued.push({ kind: "mechanic", id: RT_MECHANIC.forceDefeat }),
      projectiles: deps.projectiles,
      hazards: deps.hazards,
      setContextAction: (a) => {
        const cur = gameStore.get().rtActions;
        gameStore.set({ rtActions: { ...cur, context: a ? { key: a.key, label: a.label, progress: a.progress } : null } });
      },
      setObjective: (text) => gameStore.set({ rtObjective: text }),
      setSeals: (v) => gameStore.set({ rtSeals: v }),
      interactHeldMs: () =>
        this.interactHeldSince === null ? 0 : this.deps.scene.time.now - this.interactHeldSince,
      interactPressed: () => this.interactTapped,
      shapeAttack: (shape) => deps.shapeAttack(shape),
      onSwingHit: (target, cb) => deps.bindSwing(target, cb),
      sfx: (id) => audio.sfx(id),
    };
    this.mechanics = deps.mechanicsFactory?.(deps.scene, this.api);
    this.onEncounterBeat("encounter-start");
    this.publish(true);
  }

  /**
   * THE dialogue seam (amendment §4 / brief "leave clean technical seams so
   * dialogue can be added later without rebuilding the encounters"): a no-op
   * hook invoked at encounter beats — "encounter-start", "phase-<n>",
   * "defeated". A future dialogue system can subscribe here; gameplay code
   * must never put text through it today.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEncounterBeat(_tag: string): void {
    /* intentionally empty */
  }

  /** Step the boss one frame. `frozen` (hit-stop / parry freeze) skips the
   *  machine but keeps queued events for the first live step after.
   *  `interactPressed` is the frame's E-tap edge, captured by the scene BEFORE
   *  the base update consumed the input snapshot (mash mechanics read it via
   *  MechanicsApi.interactPressed). */
  update(dtMs: number, frozen: boolean, sceneEvents: MachineEvent[], interactPressed = false): void {
    this.interactTapped = interactPressed;
    // Track the E-hold for mechanics (REVEAL TRUTH-style holds).
    if (input.read().interactHeld) {
      if (this.interactHeldSince === null) this.interactHeldSince = this.deps.scene.time.now;
    } else {
      this.interactHeldSince = null;
    }

    this.queued.push(...sceneEvents);
    this.mechanics?.update?.(dtMs);

    if (!frozen) {
      const events = [...this.queued, ...(this.mechanics?.events() ?? [])];
      this.queued = [];
      const { state, commands } = stepBoss(this.deps.def, this.state, {
        dt: dtMs,
        playerX: this.deps.player.x,
        playerY: this.deps.player.y,
        bossX: this.deps.boss.x,
        bossY: this.deps.boss.y,
        events,
        rng: this.rng,
        recoveryScale: this.deps.recoveryScale ?? 1,
      });
      this.state = state;
      for (const c of commands) {
        this.applyCommand(c);
        // The mechanics module sees every command AFTER the shared
        // presentation — this is how attack-active spawns projectiles/
        // hazards and phase/defeat beats reach boss-specific logic.
        this.mechanics?.onCommand?.(c);
      }
    }
    this.publish(false);
  }

  /** Attack spec of the machine's current attack, if any. */
  currentAttack(): RtAttackSpec | undefined {
    return this.state.currentAttackId
      ? this.deps.def.attacks.find((a) => a.id === this.state.currentAttackId)
      : undefined;
  }

  // ── machine command → presentation ────────────────────────────────────────

  private applyCommand(c: MachineCommand): void {
    const boss = this.deps.boss;
    switch (c.kind) {
      case "anim":
        this.playBossAnim(c.anim);
        break;
      case "attack-start": {
        const spec = this.deps.def.attacks.find((a) => a.id === c.attackId);
        // The game-wide telegraph tell: gold = parryable, red = not.
        boss.setTint(spec?.parryable ? 0xffe08a : 0xff6a6a);
        audio.sfx("telegraph");
        break;
      }
      case "attack-active": {
        const spec = this.deps.def.attacks.find((a) => a.id === c.attackId);
        if (spec) this.deps.onAttackActive(spec);
        break;
      }
      case "attack-end":
        this.deps.onAttackEnd();
        boss.clearTint();
        break;
      case "stagger":
        this.deps.onAttackEnd(); // an interrupted swing must not keep hitting
        boss.clearTint();
        break;
      case "vulnerable":
        // Weak-point exposure: mint glow + the expose cue for the window.
        boss.setTint(0x9affb0);
        audio.sfx("expose");
        this.deps.scene.time.delayedCall(Math.min(c.ms, 900), () => {
          if (this.state.fsm !== "defeated") boss.clearTint();
        });
        break;
      case "phase":
        this.deps.onAttackEnd();
        boss.clearTint();
        this.onEncounterBeat(`phase-${c.phaseIndex}`);
        break;
      case "defeated":
        this.deps.onAttackEnd();
        boss.clearTint();
        this.onEncounterBeat("defeated");
        this.deps.onDefeated();
        break;
    }
  }

  /** Map the machine's anim vocabulary onto whatever rows this boss's sprite
   *  actually has, with graceful fallbacks (dummy: idle/hurt/defeat only).
   *  A def-level animFor mapping (Broken King's per-attack prep/slam rows)
   *  takes precedence when it resolves. */
  private playBossAnim(name: string): void {
    const mapped = this.deps.def.animFor?.(name, {
      attackId: this.state.currentAttackId,
      phaseIndex: this.state.phaseIndex,
    });
    if (mapped) {
      const key = animKey(this.deps.def.id, mapped);
      if (this.deps.scene.anims.exists(key)) {
        this.deps.boss.play(key, true);
        return;
      }
    }
    const fallbacks: Record<string, string[]> = {
      [RT_ANIM.spawn]: ["spawn", "idle"],
      [RT_ANIM.idle]: ["idle"],
      [RT_ANIM.telegraph]: ["telegraph", "prep", "idle"],
      [RT_ANIM.attack]: ["attack", "idle"],
      [RT_ANIM.recovery]: ["recovery", "idle"],
      [RT_ANIM.stagger]: ["stagger", "hurt", "idle"],
      [RT_ANIM.transition]: ["transition", "idle"],
      [RT_ANIM.damage]: ["damage", "hurt", "idle"],
      [RT_ANIM.defeat]: ["defeat", "hurt", "idle"],
    };
    for (const candidate of fallbacks[name] ?? ["idle"]) {
      const key = animKey(this.deps.def.id, candidate);
      if (this.deps.scene.anims.exists(key)) {
        this.deps.boss.play(key, true);
        return;
      }
    }
  }

  /** Publish the BossHealthBar snapshot, skipping no-change frames. */
  private publish(force: boolean): void {
    const snap = {
      name: this.deps.def.name,
      hp: this.state.hp,
      maxHp: this.deps.def.maxHp,
      phase: this.state.phaseIndex,
      phases: this.deps.def.phases.length,
    };
    const key = `${snap.hp}|${snap.phase}`;
    if (!force && key === this.lastSnapshotKey) return;
    this.lastSnapshotKey = key;
    gameStore.set({ rtBoss: snap });
  }

  destroy(): void {
    this.mechanics?.destroy();
  }
}
