import { describe, expect, it } from "vitest";
import { validateDef } from "../BossStateMachine";
import { getRtBoss, getRtMechanics } from "./index";

describe("late-world realtime boss registry", () => {
  it("registers the objective-only Scythebound encounter", () => {
    const def = getRtBoss("scythebound");
    expect(def).toBeDefined();
    expect(() => validateDef(def!)).not.toThrow();
    expect(def).toMatchObject({
      maxHp: 15,
      hideHealthBar: true,
      damageScale: { attack: 0, stomp: 0 },
      arenaKey: "courtyard",
    });
    expect(getRtMechanics("scythebound")).toBeTypeOf("function");
  });

  it("registers the three-catch Veiled Archer encounter and all required attacks", () => {
    const def = getRtBoss("veiled-archer");
    expect(def).toBeDefined();
    expect(() => validateDef(def!)).not.toThrow();
    expect(def).toMatchObject({ maxHp: 3, invulnerableBaseline: true, arenaKey: "cathedral" });
    expect(def!.attacks.map((attack) => attack.id)).toEqual(expect.arrayContaining([
      "direct-arrow",
      "arrow-rain",
      "triple-spread",
      "piercing-arrow",
      "arrow-trap",
      "backstep-shot",
      "cathedral-volley",
    ]));
    expect(getRtMechanics("veiled-archer")).toBeTypeOf("function");
  });

  it("registers the 100-HP Devil King duel and complete stolen arsenal", () => {
    const def = getRtBoss("devil-king");
    expect(def).toBeDefined();
    expect(() => validateDef(def!)).not.toThrow();
    expect(def).toMatchObject({ maxHp: 100, arenaKey: "rift-throne" });
    expect(def!.phases[1].enterBelowHpFrac).toBeCloseTo(0.51);
    expect(def!.attacks.map((attack) => attack.id)).toEqual(expect.arrayContaining([
      "quick-slash", "delayed-slash", "dash-cut", "air-slash", "sword-wave", "counter-stance", "three-hit",
      "bow-direct", "bow-rain", "bow-spread", "bow-explosive",
      "spear-thrust", "spear-launch", "spear-spin", "spear-line",
      "hammer-slam", "hammer-shockwave", "hammer-break", "hammer-double",
    ]));
    expect(getRtMechanics("devil-king")).toBeTypeOf("function");
  });
});
