import { describe, it, expect } from "vitest";
import { parseLevel } from "./parse";
import type { LevelDefinition } from "./types";

const mini = (map: string): LevelDefinition => ({
  id: "1-1", name: "t", theme: "fields", bossId: "glitch-toad",
  music: "level-1", map, introDialogueId: null, fragmentDialogueId: null,
});

describe("parseLevel", () => {
  it("classifies tiles and finds markers", () => {
    const lvl = parseLevel(mini(["P..b..M..D", "##==^..###"].join("\n")));
    expect(lvl.widthTiles).toBe(10);
    expect(lvl.heightTiles).toBe(2);
    expect(lvl.playerStart).toEqual({ tx: 0, ty: 0 });
    expect(lvl.bossDoor).toEqual({ tx: 9, ty: 0 });
    expect(lvl.fragment).toEqual({ tx: 6, ty: 0 });
    expect(lvl.solids[1][0]).toBe(true);
    expect(lvl.oneWays[1][2]).toBe(true);
    expect(lvl.hazards[1][4]).toBe(true);
    expect(lvl.spawns).toEqual([{ kind: "bugling", at: { tx: 3, ty: 0 } }]);
  });

  it("throws when P or D is missing", () => {
    expect(() => parseLevel(mini("...\n###"))).toThrow(/player start/i);
    expect(() => parseLevel(mini("P..\n###"))).toThrow(/boss door/i);
  });

  it("throws on ragged maps", () => {
    expect(() => parseLevel(mini("P.D\n##"))).toThrow(/ragged/i);
  });
});

import { LEVELS } from "./index";

describe("authored levels", () => {
  it("every registered level parses", () => {
    for (const def of Object.values(LEVELS)) expect(() => parseLevel(def!)).not.toThrow();
  });
});
