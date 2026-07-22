import Phaser from "phaser";
import { audio } from "../audio/synth";
import { RT_PLAYER } from "./config";
import { canAbilityHit, nextAbilityHitId } from "./abilityCollisionLogic";
import {
  abilityHudSnapshot,
  initialAbilityState,
  isAbilityInvulnerable,
  isDemonActive,
  playerDamageFor,
  stepAbilityState,
  tryUseAbility,
  type AbilityHudSnapshot,
  type AbilityRuntimeState,
  type PlayerAbility,
} from "./playerAbilityLogic";

type Body = Phaser.Physics.Arcade.Body;
type Target = Phaser.GameObjects.GameObject | Phaser.Physics.Arcade.Group;

export interface PlayerAbilityTargetHandlers {
  onRush(target: Phaser.GameObjects.GameObject): void;
  onWave(target: Phaser.GameObjects.GameObject): void;
}

interface LiveWave {
  object: Phaser.GameObjects.Ellipse;
  hitId: number;
  expiresAt: number;
}

export class PlayerAbilityController {
  private state: AbilityRuntimeState;
  private readonly rushZone: Phaser.GameObjects.Zone;
  private readonly waveGroup: Phaser.Physics.Arcade.Group;
  private waves: LiveWave[] = [];
  private hitId = 0;
  private rushHitId = 0;
  private rushWasActive = false;
  private tether: Phaser.GameObjects.Line | null = null;
  private aura: Phaser.GameObjects.Arc | null = null;
  private demonWasActive = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Sprite,
    ultimateSpent = false,
  ) {
    this.state = initialAbilityState(ultimateSpent);
    this.rushZone = scene.add.zone(0, 0, 46, 26);
    scene.physics.add.existing(this.rushZone);
    const rushBody = this.rushZone.body as Body;
    rushBody.setAllowGravity(false);
    rushBody.enable = false;
    this.waveGroup = scene.physics.add.group({ allowGravity: false, immovable: true });
  }

  activate(ability: PlayerAbility, now: number, facing: 1 | -1): boolean {
    const result = tryUseAbility(this.state, ability, now);
    if (!result.activated) return false;
    this.state = result.state;
    const body = this.player.body as Body;

    if (ability === "grapple") {
      body.setVelocity(facing * RT_PLAYER.grappleVelocityX, RT_PLAYER.grappleVelocityY);
      this.tether?.destroy();
      const anchorX = this.player.x + facing * 82;
      const anchorY = this.player.y - 68;
      this.tether = this.scene.add
        .line(0, 0, this.player.x, this.player.y - 5, anchorX, anchorY, 0xc4b5fd, 0.8)
        .setOrigin(0, 0)
        .setDepth(12);
      this.scene.time.delayedCall(280, () => {
        this.tether?.destroy();
        this.tether = null;
      });
      audio.sfx("dash");
    } else if (ability === "slashRush") {
      this.hitId = nextAbilityHitId(this.hitId);
      this.rushHitId = this.hitId;
      this.rushWasActive = true;
      body.setVelocity(facing * RT_PLAYER.slashRushSpeed, 0);
      (this.rushZone.body as Body).enable = true;
      audio.sfx("slash");
    } else if (ability === "swordWave") {
      this.spawnWave(now, facing);
      audio.sfx("slash");
    } else {
      this.startDemonVisuals();
      audio.sfx("weapon-swap");
    }
    return true;
  }

  bindTarget(target: Target, handlers: PlayerAbilityTargetHandlers): void {
    const rushHits = new WeakMap<Phaser.GameObjects.GameObject, number>();
    const waveHits = new WeakMap<Phaser.GameObjects.GameObject, number>();

    this.scene.physics.add.overlap(this.rushZone, target, (_zone, targetObject) => {
      const object = targetObject as Phaser.GameObjects.GameObject;
      if (!canAbilityHit(rushHits.get(object), this.rushHitId)) return;
      rushHits.set(object, this.rushHitId);
      handlers.onRush(object);
    });

    this.scene.physics.add.overlap(this.waveGroup, target, (waveObject, targetObject) => {
      const wave = this.waves.find((candidate) => candidate.object === waveObject);
      if (!wave) return;
      const object = targetObject as Phaser.GameObjects.GameObject;
      if (!canAbilityHit(waveHits.get(object), wave.hitId)) return;
      waveHits.set(object, wave.hitId);
      handlers.onWave(object);
      wave.object.destroy();
    });
  }

  update(now: number, grounded: boolean): void {
    this.state = stepAbilityState(this.state, { now, grounded });
    const facing: 1 | -1 = this.player.flipX ? -1 : 1;
    const rushing = now < this.state.slashRushEndsAt;
    if (rushing) {
      this.rushZone.setPosition(this.player.x + facing * 20, this.player.y);
      (this.rushZone.body as Body).enable = true;
      (this.player.body as Body).setVelocityX(facing * RT_PLAYER.slashRushSpeed);
      if (Math.floor(now / 55) !== Math.floor((now - 16) / 55)) {
        const trail = this.scene.add
          .rectangle(this.player.x - facing * 9, this.player.y, 24, 12, 0xf4f0ff, 0.3)
          .setDepth(8);
        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          scaleX: 1.8,
          duration: 150,
          onComplete: () => trail.destroy(),
        });
      }
    } else if (this.rushWasActive) {
      this.rushWasActive = false;
      (this.rushZone.body as Body).enable = false;
    }

    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      if (!wave.object.active || now >= wave.expiresAt) {
        wave.object.destroy();
        this.waves.splice(i, 1);
      }
    }

    const demon = isDemonActive(this.state, now);
    if (demon) {
      this.aura?.setPosition(this.player.x, this.player.y);
      this.player.setTint(0x6b1020);
    } else if (this.demonWasActive) {
      this.stopDemonVisuals();
    }
  }

  private spawnWave(now: number, facing: 1 | -1): void {
    this.hitId = nextAbilityHitId(this.hitId);
    const wave = this.scene.add
      .ellipse(this.player.x + facing * 22, this.player.y, 26, 40, 0xf4f0ff, 0.18)
      .setStrokeStyle(3, 0xc4b5fd, 0.95)
      .setDepth(14)
      .setAngle(facing > 0 ? -24 : 24);
    this.scene.physics.add.existing(wave);
    const body = wave.body as Body;
    body.setAllowGravity(false);
    body.setVelocityX(facing * RT_PLAYER.swordWaveSpeed);
    this.waveGroup.add(wave);
    this.waves.push({
      object: wave,
      hitId: this.hitId,
      expiresAt: now + RT_PLAYER.swordWaveTtlMs,
    });
  }

  private startDemonVisuals(): void {
    this.demonWasActive = true;
    this.aura?.destroy();
    this.aura = this.scene.add
      .circle(this.player.x, this.player.y, 18, 0x7f1d1d, 0.18)
      .setStrokeStyle(2, 0xef4444, 0.7)
      .setDepth(7);
    this.scene.tweens.add({
      targets: this.aura,
      scale: 1.3,
      alpha: 0.35,
      duration: 360,
      yoyo: true,
      repeat: -1,
    });
  }

  private stopDemonVisuals(): void {
    this.demonWasActive = false;
    this.player.clearTint();
    this.aura?.destroy();
    this.aura = null;
  }

  isInvulnerable(now: number): boolean {
    return isAbilityInvulnerable(this.state, now);
  }

  isDemonActive(now: number): boolean {
    return isDemonActive(this.state, now);
  }

  damageFor(baseDamage: number, now: number): number {
    return playerDamageFor(baseDamage, this.state, now);
  }

  snapshot(now: number): AbilityHudSnapshot {
    return abilityHudSnapshot(this.state, now);
  }

  get ultimateSpent(): boolean {
    return this.state.ultimateSpent;
  }

  destroy(): void {
    this.tether?.destroy();
    this.aura?.destroy();
    this.rushZone.destroy();
    for (const wave of this.waves) wave.object.destroy();
    this.waves = [];
    this.waveGroup.destroy(true);
    if (this.demonWasActive) this.player.clearTint();
  }
}
