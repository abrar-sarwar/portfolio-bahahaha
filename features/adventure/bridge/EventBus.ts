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
  "level:complete": { levelId: import("../ids").LevelId };
  "level:enter-boss": { levelId: import("../ids").LevelId; bossId: import("../ids").BossId };
  "player:damaged": { health: number };
  "buff:collected": { buff: import("../ids").BuffId };
  "level:fragment": { levelId: import("../ids").LevelId };
  "nav:external": { href: string };
  "ending:return-overworld": Record<string, never>;
  "ui:pause-action": { action: "resume" | "restart" | "quit" };
  "settings:changed": { accessibility: import("../state/save").AdventureSave["settings"]["accessibility"] };
  // Overworld → React → scene confirm-dialog result (Task 16). A scene raises a
  // confirm request via gameStore.confirm; the React ConfirmDialog answers by
  // emitting this, which the raising scene listens for (once) to act on.
  "ui:confirm": { confirmed: boolean };
  // Combat side-effect events (Task 13). The controller reduces the pure engine
  // and publishes the snapshot to the store; these carry the transient signals
  // the store can't hold: a telegraphed move to run a defense mini-game against,
  // fire-and-forget hit/parry/phase fx, and the terminal combat outcome.
  "combat:telegraph": {
    moveId: string;
    spec: import("../combat/timedEvents").QteSpec;
    impactInMs: number;
  };
  "combat:fx": { kind: import("../combat/controllerLogic").CombatFxKind };
  "combat:over": { outcome: "victory" | "defeat"; bossId: import("../ids").BossId };
  // Dormant legacy Dialogue/CombatPanel lifecycle seam. No active scene or
  // mounted component subscribes to these events in the realtime rework.
  "dialogue:open": { id: string };
  "dialogue:closed": { id: string };
}

export const bus = new EventBus<AdventureEvents>();
