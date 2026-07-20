import { describe, it, expect } from "vitest";
import {
  NODE_ORDER,
  OVERWORLD_ACTIVATE_KEY_EVENTS,
  nodeStateFor,
  walkPath,
  type OverNodeId,
  type ProgressShape,
} from "./overworldLogic";

// A fresh-save progress shape: only 1-1 unlocked, nothing completed.
const FRESH: ProgressShape = { completed: [], unlocked: ["1-1"], gameCompleted: false };

describe("NODE_ORDER", () => {
  it("is the locked linear chain fields → harbor → factory → archive-level → castle → archive-gallery", () => {
    expect(NODE_ORDER).toEqual(["1-1", "1-2", "1-3", "1-4", "castle", "archive"]);
  });
});

describe("OVERWORLD_ACTIVATE_KEY_EVENTS", () => {
  it("keeps Space as a select/confirm input after the title screen starts the map", () => {
    expect(OVERWORLD_ACTIVATE_KEY_EVENTS).toContain("keydown-SPACE");
  });
});

describe("nodeStateFor", () => {
  it("a fresh save: 1-1 unlocked, everything after it locked, archive hidden", () => {
    expect(nodeStateFor(FRESH, "1-1")).toBe("unlocked");
    expect(nodeStateFor(FRESH, "1-2")).toBe("locked");
    expect(nodeStateFor(FRESH, "1-3")).toBe("locked");
    expect(nodeStateFor(FRESH, "1-4")).toBe("locked");
    expect(nodeStateFor(FRESH, "castle")).toBe("locked");
    expect(nodeStateFor(FRESH, "archive")).toBe("hidden");
  });

  it("a completed level reads 'completed', its unlocked successor reads 'unlocked'", () => {
    const afterOneOne: ProgressShape = { completed: ["1-1"], unlocked: ["1-1", "1-2"], gameCompleted: false };
    expect(nodeStateFor(afterOneOne, "1-1")).toBe("completed");
    expect(nodeStateFor(afterOneOne, "1-2")).toBe("unlocked");
    expect(nodeStateFor(afterOneOne, "1-3")).toBe("locked");
  });

  it("the castle node unlocks like any other node (via UNLOCK_NEXT after 1-4) — castleKey gates the DOOR, not the node", () => {
    // No castleKey field consulted here at all: the castle NODE is unlocked
    // purely by 1-4 completion pushing "castle" into `unlocked`. Task 21 gates
    // the castle DOOR on castleKey; the overworld node ignores it.
    const afterFour: ProgressShape = {
      completed: ["1-1", "1-2", "1-3", "1-4"],
      unlocked: ["1-1", "1-2", "1-3", "1-4", "castle"],
      gameCompleted: false,
    };
    expect(nodeStateFor(afterFour, "castle")).toBe("unlocked");
  });

  it("the archive node stays hidden until gameCompleted, then reads 'unlocked'", () => {
    const won: ProgressShape = {
      completed: ["1-1", "1-2", "1-3", "1-4", "castle"],
      unlocked: ["1-1", "1-2", "1-3", "1-4", "castle"],
      gameCompleted: true,
    };
    expect(nodeStateFor(won, "archive")).toBe("unlocked");
  });

  it("treats a missing gameCompleted flag (bare store shape) as archive-hidden", () => {
    const storeShape: ProgressShape = { completed: ["1-1"], unlocked: ["1-1", "1-2"] };
    expect(nodeStateFor(storeShape, "archive")).toBe("hidden");
  });
});

describe("walkPath", () => {
  const chain: OverNodeId[] = ["1-1", "1-2", "1-3"];

  it("walks forward through the unlocked chain, endpoints inclusive", () => {
    expect(walkPath("1-1", "1-3", chain)).toEqual(["1-1", "1-2", "1-3"]);
  });

  it("walks backward too", () => {
    expect(walkPath("1-3", "1-1", chain)).toEqual(["1-3", "1-2", "1-1"]);
  });

  it("a single-node walk (from === to) returns just that node when unlocked", () => {
    expect(walkPath("1-2", "1-2", chain)).toEqual(["1-2"]);
  });

  it("returns null when an intermediate node on the segment is locked", () => {
    // 1-2 not in the unlocked set → cannot pass through it.
    expect(walkPath("1-1", "1-3", ["1-1", "1-3"])).toBeNull();
  });

  it("returns null when the destination itself is locked", () => {
    expect(walkPath("1-1", "1-2", ["1-1"])).toBeNull();
  });

  it("returns null when the origin itself is locked", () => {
    expect(walkPath("1-2", "1-1", ["1-1"])).toBeNull();
  });

  it("can reach the archive once it is part of the walkable set", () => {
    const full: OverNodeId[] = ["1-1", "1-2", "1-3", "1-4", "castle", "archive"];
    expect(walkPath("castle", "archive", full)).toEqual(["castle", "archive"]);
  });

  it("returns null for an id outside the node chain", () => {
    expect(walkPath("1-1", "nope" as OverNodeId, chain)).toBeNull();
  });
});
