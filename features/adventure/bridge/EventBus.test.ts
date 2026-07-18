import { describe, it, expect, vi } from "vitest";
import { EventBus } from "./EventBus";

type TestEvents = { ping: { n: number }; empty: undefined };

describe("EventBus", () => {
  it("delivers payloads to subscribers", () => {
    const bus = new EventBus<TestEvents>();
    const fn = vi.fn();
    bus.on("ping", fn);
    bus.emit("ping", { n: 7 });
    expect(fn).toHaveBeenCalledWith({ n: 7 });
  });

  it("unsubscribes via returned disposer and via off", () => {
    const bus = new EventBus<TestEvents>();
    const a = vi.fn();
    const b = vi.fn();
    const off = bus.on("ping", a);
    bus.on("ping", b);
    off();
    bus.off("ping", b);
    bus.emit("ping", { n: 1 });
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it("does not break when a handler throws", () => {
    const bus = new EventBus<TestEvents>();
    const good = vi.fn();
    bus.on("ping", () => { throw new Error("boom"); });
    bus.on("ping", good);
    expect(() => bus.emit("ping", { n: 1 })).not.toThrow();
    expect(good).toHaveBeenCalled();
  });
});
