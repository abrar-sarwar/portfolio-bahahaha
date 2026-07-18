import { describe, it, expect, vi } from "vitest";
import { createStore, memoizeBy } from "./GameStore";

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
