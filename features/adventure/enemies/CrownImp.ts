import Phaser from "phaser";
import { animKey } from "../art/textures";
import { CROWN_IMP_SPRITES } from "../art/sprites/enemies1";
import { Enemy } from "./Enemy";

type Body = Phaser.Physics.Arcade.Body;

// First stomp puts the imp in a daze this long — plant the second stomp (or a
// swing) before it shakes the stars off and resumes its patrol.
const STUN_MS = 2500;
const STUN_TINT = 0xc4b5fd; // pale violet "dazed" wash

/**
 * Crown Imp: a squat (16x20, a head shorter than the player) demon soldier of
 * the false crown patrolling World 1-1. Turns at walls and ledges, and takes
 * TWO stomps to put down (hp 2): the FIRST stomp stuns it — it stops dead,
 * wobbles with little stars over its horns, and is safe to touch — the second
 * kills and grants the POWER stack. Melee swings also need two hits (and the
 * first does NOT stun — the daze is the stomp's reward).
 */
export class CrownImp extends Enemy {
  private stunnedUntil = -Infinity;
  private stars: Phaser.GameObjects.Rectangle[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "crown-imp", CROWN_IMP_SPRITES.key);
    this.hp = 2;
    this.touchDamage = 1;
    this.stompable = true;
    this.patrolSpeed = 34;
    this.turnAtLedges = true;
    // The base body box assumes 16x16 art; this demon fills a 16x20 box.
    const body = this.body as Body;
    body.setSize(12, 16);
    body.setOffset(2, 4);
    this.play(animKey(this.animBase, "walk"));
  }

  private get stunned(): boolean {
    return this.scene.time.now < this.stunnedUntil;
  }

  /** First surviving stomp → the daze; the base handles hp/bounce/death. */
  override hitByStomp(): void {
    const before = this.hp;
    super.hitByStomp();
    if (!this.dying && this.hp < before) this.beginStun();
  }

  /** A dazed imp is SAFE to touch (mirrors the downed King's rule) — landing
   *  slightly off-center on the follow-up stomp must not clip the player. */
  override hurtPlayer(): void {
    if (this.stunned) return;
    super.hurtPlayer();
  }

  private beginStun(): void {
    this.stunnedUntil = this.scene.time.now + STUN_MS;
    (this.body as Body).setVelocityX(0);
    if (this.stars.length === 0) {
      for (let i = 0; i < 2; i++) {
        this.stars.push(
          this.scene.add.rectangle(this.x, this.y - 14, 3, 3, 0xffd75e).setAngle(45).setDepth(10),
        );
      }
    }
  }

  private endStun(): void {
    this.stunnedUntil = -Infinity;
    this.setAngle(0);
    this.restoreTint();
    for (const s of this.stars) s.destroy();
    this.stars = [];
  }

  override tick(_dtMs: number): void {
    if (this.dying) return;
    const now = this.scene.time.now;
    if (this.stunned) {
      const body = this.body as Body;
      body.setVelocityX(0);
      // Dazed presentation: pale wash (re-asserted every frame — the base
      // stomp hit-flash's delayed restoreTint would otherwise clear it),
      // drunken wobble, and two little stars orbiting the horns.
      this.setTint(STUN_TINT);
      this.setAngle(Math.sin(now / 90) * 7);
      this.stars.forEach((s, i) => {
        const a = now / 260 + i * Math.PI;
        s.setPosition(this.x + Math.cos(a) * 7, this.y - 13 + Math.sin(a) * 2);
        s.setAngle(now / 4);
      });
      return;
    }
    if (this.stars.length > 0) this.endStun(); // the daze just wore off
    this.patrol();
  }

  /** Death mid-daze must not leave orbiting stars or a tilted corpse. */
  protected override onDeath(): void {
    this.endStun();
  }
}
