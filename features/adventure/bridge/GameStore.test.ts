import { describe, it, expect, vi } from "vitest";
import { createStore } from "./GameStore";

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
});
