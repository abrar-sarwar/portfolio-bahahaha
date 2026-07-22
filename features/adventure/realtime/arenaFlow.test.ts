import { describe, expect, it } from "vitest";
import { defaultSave } from "../state/save";
import { resolveArenaVictory, shouldRunArcherAftermath } from "./arenaFlow";

describe("resolveArenaVictory", () => {
  it("returns a cleared mid-boss to the same level without completing it", () => {
    const save = defaultSave();
    const result = resolveArenaVictory(
      { midLevel: { levelId: "1-4", resumeAt: { tx: 139, ty: 14 } }, power: 3, ultimateSpent: true },
      "scythebound",
      save,
    );

    expect(result.persist).toBe(true);
    expect(result.save.bossesDefeated).toContain("scythebound");
    expect(result.save.completed).not.toContain("1-4");
    expect(result.completedLevel).toBeUndefined();
    expect(result.destination).toEqual({
      scene: "Level",
      data: { levelId: "1-4", spawnAt: "checkpoint", checkpoint: { tx: 139, ty: 14 }, power: 3, ultimateSpent: true },
    });
  });

  it("completes a level only for its final boss", () => {
    const result = resolveArenaVictory({ fromLevel: "1-3" }, "one-eyed-dealer", defaultSave());
    expect(result.save.completed).toContain("1-3");
    expect(result.completedLevel).toBe("1-3");
    expect(result.destination).toEqual({ scene: "Overworld", data: { justCompleted: "1-3" } });
  });

  it("keeps isolated debug-arena victories non-persisting", () => {
    const save = defaultSave();
    const result = resolveArenaVictory({ returnScene: "Title" }, "training-dummy", save);
    expect(result.persist).toBe(false);
    expect(result.save).toBe(save);
    expect(result.destination).toEqual({ scene: "Title" });
  });
});

describe("shouldRunArcherAftermath", () => {
  it("only launches the chase from the real World 1-4 final-boss route", () => {
    expect(shouldRunArcherAftermath({ fromLevel: "1-4" }, "veiled-archer")).toBe(true);
    expect(shouldRunArcherAftermath({ returnScene: "Title" }, "veiled-archer")).toBe(false);
    expect(shouldRunArcherAftermath({ fromLevel: "1-4" }, "scythebound")).toBe(false);
  });
});
