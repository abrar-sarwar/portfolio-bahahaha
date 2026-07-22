import { describe, it, expect, vi } from "vitest";
import { createStore, memoizeBy, gameStore } from "./GameStore";
import { RT_PLAYER } from "../realtime/config";

describe("GameStore", () => {
  it("set patches shallowly and notifies subscribers", () => {
    const store = createStore({ a: 1, b: "x" });
    const fn = vi.fn();
    store.subscribe(fn);
    store.set({ a: 2 });
    expect(store.get()).toEqual({ a: 2, b: "x" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("update replaces state via function", () => {
    const store = createStore({ n: 1 });
    store.update((s) => ({ n: s.n + 1 }));
    expect(store.get().n).toBe(2);
  });

  it("unsubscribe stops notifications; get is stable between sets", () => {
    const store = createStore({ n: 1 });
    const fn = vi.fn();
    const off = store.subscribe(fn);
    off();
    store.set({ n: 3 });
    expect(fn).not.toHaveBeenCalled();
    const snap = store.get();
    expect(store.get()).toBe(snap); // referential stability for useSyncExternalStore
  });

  it("memoizeBy returns cached value for same state ref, recomputes on new ref", () => {
    const sel = memoizeBy((s: { n: number }) => ({ doubled: s.n * 2 }));
    const stateA = { n: 2 };
    const first = sel(stateA);
    expect(sel(stateA)).toBe(first);           // same ref in, same ref out
    const second = sel({ n: 2 });
    expect(second).not.toBe(first);            // new ref in, recomputed
    expect(second).toEqual({ doubled: 4 });
  });
});

describe("gameStore realtime defaults (Task 32, additive)", () => {
  it("seeds safe defaults for the realtime UI fields", () => {
    const s = gameStore.get();
    expect(s.hearts).toEqual({ current: RT_PLAYER.maxHearts, max: RT_PLAYER.maxHearts });
    expect(s.rtBoss).toBeNull();
    expect(s.rtObjective).toBeNull();
    expect(s.rtSeals).toBeNull();
    expect(s.rtActions).toEqual({
      attack: { cooldownFrac: 0 },
      dash: { cooldownFrac: 0 },
      parry: { cooldownFrac: 0 },
      context: null,
    });
    expect(s.rtAbilities).toEqual({
      grapple: { charges: 2, maxCharges: 2 },
      slashRush: { cooldownFrac: 0 },
      swordWave: { cooldownFrac: 0 },
      ultimate: { status: "ready", remainingFrac: 1 },
    });
  });

  it("defaults to a full 6 hearts", () => {
    expect(gameStore.get().hearts.max).toBe(6);
  });
});
