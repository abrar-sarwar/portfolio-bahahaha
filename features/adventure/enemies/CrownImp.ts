import Phaser from "phaser";
import { animKey } from "../art/textures";
import { CROWN_IMP_SPRITES } from "../art/sprites/enemies1";
import { Enemy } from "./Enemy";

type Body = Phaser.Physics.Arcade.Body;

/**
 * Crown Imp: a player-sized (16x24) demon soldier of the false crown patrolling
 * World 1-1. Turns at walls and ledges like a bugling, but takes TWO stomps to
 * put down (hp 2) — the first bounce flashes it, the second kills and grants
 * the POWER stack. Melee swings also need two hits.
 */
export class CrownImp extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "crown-imp", CROWN_IMP_SPRITES.key);
    this.hp = 2;
    this.touchDamage = 1;
    this.stompable = true;
    this.patrolSpeed = 34;
    this.turnAtLedges = true;
    // The base body box assumes 16x16 art; this demon fills the player's box.
    const body = this.body as Body;
    body.setSize(12, 20);
    body.setOffset(2, 4);
    this.play(animKey(this.animBase, "walk"));
  }
}
