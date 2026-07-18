type Handler<T> = (payload: T) => void;

// Constraint is Record<keyof E, unknown> (not Record<string, unknown>) so a
// plain interface keeps literal keys — `keyof E` must stay a union of the
// declared event names, giving compile errors on typo'd events.
export class EventBus<E extends Record<keyof E, unknown>> {
  private handlers = new Map<keyof E, Set<Handler<never>>>();

  on<K extends keyof E>(event: K, fn: Handler<E[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(fn as Handler<never>);
    return () => this.off(event, fn);
  }

  off<K extends keyof E>(event: K, fn: Handler<E[K]>): void {
    this.handlers.get(event)?.delete(fn as Handler<never>);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        (fn as Handler<E[K]>)(payload);
      } catch (err) {
        console.error(`[adventure] handler for ${String(event)} threw`, err);
      }
    }
  }
}

/** Global event map. Later tasks extend this interface with their events.
 *  Deliberately NOT `extends Record<string, unknown>` — that would widen
 *  `keyof AdventureEvents` to `string` and kill typo protection. */
export interface AdventureEvents {
  "scene:changed": { scene: import("../ids").SceneKey };
}

export const bus = new EventBus<AdventureEvents>();
