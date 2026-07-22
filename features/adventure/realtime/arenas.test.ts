import { describe, it, expect } from "vitest";
import { parseLevel } from "../levels/parse";
import { CATHEDRAL_ARENA, TRAINING_ARENA, getArena } from "./arenas";
import { TRAINING_DUMMY } from "./bossDefinitions/trainingDummy";
import { validateDef } from "./BossStateMachine";

describe("training arena map", () => {
  it("parses to a rectangular enclosed room with one player start + door", () => {
    const lvl = parseLevel(TRAINING_ARENA);
    expect(lvl.widthTiles).toBe(40);
    expect(lvl.heightTiles).toBe(18);
    expect(lvl.playerStart).toEqual({ tx: 6, ty: 15 });
    expect(lvl.bossDoor).toEqual({ tx: 28, ty: 15 });
  });

  it("contains no checkpoint / fragment / enemy content (those systems no-op)", () => {
    const lvl = parseLevel(TRAINING_ARENA);
    expect(lvl.checkpoints).toEqual([]);
    expect(lvl.fragment).toBeNull();
    expect(lvl.spawns).toEqual([]);
    expect(lvl.hazards.flat().some(Boolean)).toBe(false);
  });

  it("parks the boss door at the boss spawn tile (hidden under the boss)", () => {
    expect(TRAINING_ARENA.map.split("\n").length).toBe(18);
    expect(TRAINING_DUMMY.spawn).toEqual({ tx: 28, ty: 15 });
  });

  it("getArena resolves the training key", () => {
    expect(getArena("training")).toBe(TRAINING_ARENA);
    expect(getArena("nope")).toBeUndefined();
  });
});

describe("rebuilt archer arena", () => {
  it("is a compact open nave without tall interior solid columns", () => {
    const level = parseLevel(CATHEDRAL_ARENA);
    expect(level.widthTiles).toBe(34);
    expect(level.heightTiles).toBe(18);
    for (let y = 1; y < 14; y++) {
      expect(level.solids[y].slice(1, -1).some(Boolean)).toBe(false);
    }
  });
});

describe("training dummy def", () => {
  it("passes the boss-def validation invariants", () => {
    expect(() => validateDef(TRAINING_DUMMY)).not.toThrow();
  });

  it("exercises every framework primitive (Task 33 training pool)", () => {
    const ids = TRAINING_DUMMY.attacks.map((a) => a.id).sort();
    expect(ids).toEqual(["debris", "glow-orb", "heavy-poke", "poke", "shockwave"]);
    // Parry training needs a parryable melee poke AND a parryable glow orb;
    // dodge training needs at least one unparryable melee attack.
    const parryable = new Set(TRAINING_DUMMY.attacks.filter((a) => a.parryable).map((a) => a.id));
    expect(parryable).toEqual(new Set(["poke", "glow-orb"]));
    // The ranged orb must never be selected at melee range (it trains parry
    // FROM DISTANCE), and the pokes must reach natural standing distance.
    const orb = TRAINING_DUMMY.attacks.find((a) => a.id === "glow-orb");
    expect(orb?.minRangePx).toBeGreaterThan(90);
    const poke = TRAINING_DUMMY.attacks.find((a) => a.id === "poke");
    expect(poke?.maxRangePx).toBe(150);
  });
});
