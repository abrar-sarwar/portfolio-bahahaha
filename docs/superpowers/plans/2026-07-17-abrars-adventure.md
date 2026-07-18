# Abrar's Adventure: The Lost Key — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the hidden ~25-minute pixel-art adventure game at `/adventure`, a locked-book `/gallery` stub, and a secret-door entry button at the end of the main feed, per `docs/superpowers/specs/2026-07-17-abrars-adventure-design.md`.

**Architecture:** Phaser 3 (dynamically imported, SSR off) renders platforming/overworld scenes; a React DOM overlay renders HUD, dialogue, combat menus, and typing input. The two communicate only via a typed `EventBus` and an observable `GameStore`. All combat/typing/parry/save logic is pure TypeScript with vitest tests. All art is code-generated from pixel grids; all audio from a WebAudio chiptune synth.

**Tech Stack:** Next.js 16 App Router (existing), React 19, TypeScript strict, Tailwind, Phaser `^3.90`, vitest.

## Global Constraints

- **NEVER `git push`. Local commits only** — the user is testing. Commit after every task with the exact message given.
- Phaser must never enter the main-feed bundle: it is imported only inside `features/adventure/`, which is only reached via `next/dynamic(..., { ssr: false })` from `app/adventure/page.tsx`.
- Do not modify: `components/IntroVideo.tsx`, `components/VideoModal.tsx`, any video preloading behavior, `_archive/`, existing routes' behavior. `components/ScrollFeed.tsx` gets exactly one addition (Task 26).
- All art/audio is original and generated from code. No downloaded assets, no copyrighted names/designs (no Mario/Goomba/Bowser lookalikes).
- Cybersecurity "commands" are fictional arcade prompts; keep the framing playful, never real attack instructions.
- Dev unlock code is `INK-7F2A`, served ONLY through `codeService` (async) so an API can replace it later. Never hardcode it in UI components.
- Path alias `@/*` → repo root. New game code lives under `features/adventure/`; shared site components under `components/`.
- `tailwind.config.ts` `content` must include `"./features/**/*.{ts,tsx}"` (added as a Task 3 fix — without it Tailwind purges every class used by the game's overlay UI in production). This is the ONLY allowed edit to that file.
- Canvas: 960×540 internal, `pixelArt: true`, `roundPixels: true`, `Scale.FIT`, camera zoom 2 in platforming (480×270 visible). Tiles are 16×16. Player sprite 16×24, small enemies 16×16, Brute/Knight 24×24, bosses 48×64, Devil King 80×96.
- Type-check gate for every task: `npx tsc --noEmit` → no errors. Test gate: `npx vitest run` → all pass.
- The 20-point completion checklist from the spec is the final acceptance bar (Task 30).

## Content authoring rules (applies wherever a step says "author to schema")

Pixel grids, music patterns, level maps, and dialogue beyond the complete examples embedded in this plan are creative content authored at implementation time. They MUST follow the locked schemas: only palette characters from `art/palette.ts`, exact sprite dimensions and frame counts from the tables in Tasks 4/8/14/18/19/20/22, level legends from Task 6, track schema from Task 5. Deviating from a schema is a task failure; drawing different (original) pixels within it is expected. This rule exists so the plan stays reviewable — it is not license to skip content: every listed asset must exist and be visually distinct/readable at 2× zoom.

## Canonical identifiers (used by every task — do not rename)

```ts
// features/adventure/ids.ts (created in Task 2)
export type LevelId = "1-1" | "1-2" | "1-3" | "1-4" | "castle";
export type BossId = "glitch-toad" | "captain-spoof" | "warden" | "blank-page" | "devil-king";
export type BuffId =
  | "attack-byte" | "firewall-layer" | "focus-chip" | "parry-module"
  | "recovery-packet" | "root-access" | "exploit-insight" | "cache-boost";
export type AbilityId = "dash" | "analyze" | "improvedParry";
export type KeyFragment = "bronze" | "silver" | "gold";
export type TrackId =
  | "title" | "overworld" | "level-1" | "level-2" | "level-3" | "level-4"
  | "boss" | "castle" | "devil-1" | "devil-2" | "devil-3" | "victory" | "chest";
export type SfxId =
  | "jump" | "stomp" | "parry" | "type" | "damage" | "collect" | "chest"
  | "select" | "dash" | "error" | "crit";
export type SceneKey = "Boot" | "Title" | "Overworld" | "Level" | "CombatBackdrop" | "Victory" | "Chest";
```

---

# Phase 0 — Tooling & Shell

### Task 1: Dependencies, vitest wiring, smoke test

**Files:**
- Modify: `package.json` (deps + scripts)
- Create: `vitest.config.ts`
- Create: `features/adventure/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` (vitest run), `npm run test:watch`; `phaser` installed for all later tasks.

- [ ] **Step 1: Install dependencies**

Run: `npm install phaser@^3.90 && npm install -D vitest@^3`
Expected: both appear in `package.json`; lockfile updated; no peer errors.

- [ ] **Step 2: Add scripts + vitest config**

In `package.json` `"scripts"`, add (keep existing entries):

```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["features/**/*.test.ts", "components/**/*.test.ts", "lib/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 3: Write smoke test**

`features/adventure/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest wiring", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Verify**

Run: `npm test`
Expected: 1 passed.
Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts features/adventure/smoke.test.ts
git commit -m "chore(adventure): add phaser + vitest tooling"
```

---

### Task 2: Shared ids, EventBus, GameStore

**Files:**
- Create: `features/adventure/ids.ts` (exact content from "Canonical identifiers" above)
- Create: `features/adventure/bridge/EventBus.ts`
- Create: `features/adventure/bridge/EventBus.test.ts`
- Create: `features/adventure/bridge/GameStore.ts`
- Create: `features/adventure/bridge/GameStore.test.ts`
- Delete: `features/adventure/smoke.test.ts` (superseded)

**Interfaces:**
- Consumes: `ids.ts` types.
- Produces (used by every later task):
  - `bus: EventBus<AdventureEvents>` with `on(event, fn): () => void`, `emit(event, payload)`.
  - `gameStore.get(): GameUIState`, `gameStore.set(patch: Partial<GameUIState>)`, `gameStore.update(fn)`, `gameStore.subscribe(fn): () => void`, React hook `useGameStore<T>(selector): T`.
  - `AdventureEvents` map — later tasks ADD entries to this interface; they never rename existing ones.

- [ ] **Step 1: Write failing tests**

`features/adventure/bridge/EventBus.test.ts`:

```ts
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
```

`features/adventure/bridge/GameStore.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run features/adventure/bridge`
Expected: FAIL — cannot resolve `./EventBus`, `./GameStore`.

- [ ] **Step 3: Implement**

`features/adventure/bridge/EventBus.ts`:

```ts
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
```

`features/adventure/bridge/GameStore.ts`:

```ts
import { useSyncExternalStore } from "react";

export function createStore<S extends object>(initial: S) {
  let state = initial;
  const subs = new Set<() => void>();
  const notify = () => subs.forEach((fn) => fn());
  return {
    get: () => state,
    set: (patch: Partial<S>) => {
      state = { ...state, ...patch };
      notify();
    },
    update: (fn: (s: S) => S) => {
      state = fn(state);
      notify();
    },
    subscribe: (fn: () => void) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

import type { SceneKey } from "../ids";

/** UI-facing snapshot. Later tasks add fields; they never remove them. */
export interface GameUIState {
  scene: SceneKey;
  paused: boolean;
}

export const gameStore = createStore<GameUIState>({
  scene: "Boot",
  paused: false,
});

/** Memoize a selector by store-state reference so getSnapshot returns a
 *  stable value between store changes (useSyncExternalStore contract —
 *  object-returning selectors would otherwise loop React). */
export function memoizeBy<S, T>(compute: (s: S) => T): (s: S) => T {
  let last: { s: S; v: T } | null = null;
  return (s) => {
    if (!last || last.s !== s) last = { s, v: compute(s) };
    return last.v;
  };
}

export function useGameStore<T>(selector: (s: GameUIState) => T): T {
  // Selector is captured on first render; inline selectors must be pure.
  const memo = useMemo(() => memoizeBy(selector), []);
  return useSyncExternalStore(
    gameStore.subscribe,
    () => memo(gameStore.get()),
    () => memo(gameStore.get()),
  );
}
```

(`useMemo`, `useSyncExternalStore` imported from "react".) `GameStore.test.ts`
additionally covers `memoizeBy`: same state reference → same value reference;
new state reference → recomputed value (7 bridge tests total).

Also create `features/adventure/ids.ts` with the exact content from **Canonical identifiers**, and delete `features/adventure/smoke.test.ts`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run features/adventure/bridge && npx tsc --noEmit`
Expected: 7 passed; no type errors.

- [ ] **Step 5: Commit**

```bash
git add -A features/adventure
git commit -m "feat(adventure): typed EventBus and observable GameStore bridge"
```

---

### Task 3: `/adventure` route shell + Phaser boot

**Files:**
- Create: `app/adventure/layout.tsx`, `app/adventure/page.tsx`
- Create: `features/adventure/AdventureApp.tsx`
- Create: `features/adventure/game.ts`
- Create: `features/adventure/config.ts`
- Create: `features/adventure/scenes/BootScene.ts`
- Create: `features/adventure/ui/Overlay.tsx`

**Interfaces:**
- Consumes: `bus`, `gameStore`, `ids`.
- Produces:
  - `config.ts` constants used everywhere: `GAME_WIDTH=960`, `GAME_HEIGHT=540`, `TILE=16`, `ZOOM=2`, `PHYSICS`, `PLAYER_BASE` (exact values below).
  - `buildConfig(parent: HTMLElement, scenes: Phaser.Types.Scenes.SceneType[]): Phaser.Types.Core.GameConfig`.
  - `AdventureApp` default export mounting Phaser + `<Overlay/>`.
  - `Overlay` renders children panels based on `gameStore.scene` (later tasks add panels inside it).

- [ ] **Step 1: Config constants**

`features/adventure/config.ts`:

```ts
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const TILE = 16;
export const ZOOM = 2;

export const PHYSICS = {
  gravity: 1400,
  moveSpeed: 150,
  jumpVelocity: -360,
  coyoteMs: 100,
  jumpBufferMs: 120,
  dashSpeed: 320,
  dashMs: 160,
  dashCooldownMs: 450,
} as const;

export const PLAYER_BASE = {
  maxHealth: 6,
  attack: 2,
  defense: 1,
  focus: 1,
  parryWindowMs: 220,
  perfectParryMs: 90,
  typingPower: 1,
} as const;

export const SAVE_KEY = "adventure-save-v1";
export const GALLERY_KEY = "gallery-unlocked-v1";
```

- [ ] **Step 2: Boot scene (placeholder texture proves the pipeline)**

`features/adventure/scenes/BootScene.ts`:

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { gameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    // Placeholder 16x24 magenta/black checker proves canvas-texture generation
    // works end to end; Task 4 replaces this with the real sprite registry.
    const c = this.textures.createCanvas("boot-check", 16, 24);
    if (c) {
      const ctx = c.getContext();
      for (let y = 0; y < 24; y++)
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = (x + y) % 2 ? "#c4b5fd" : "#101014";
          ctx.fillRect(x, y, 1, 1);
        }
      c.refresh();
    }
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "boot-check")
      .setScale(4);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, "BOOT OK", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#c4b5fd",
      })
      .setOrigin(0.5);
    gameStore.set({ scene: "Boot" });
    bus.emit("scene:changed", { scene: "Boot" });
  }
}
```

- [ ] **Step 3: Game factory + React mount**

`features/adventure/game.ts`:

```ts
import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from "./config";
import { BootScene } from "./scenes/BootScene";

export function sceneList(): Phaser.Types.Scenes.SceneType[] {
  // Later tasks append scenes here (Title, Overworld, Level, ...).
  return [BootScene];
}

export function buildConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#050507",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: PHYSICS.gravity }, debug: false },
    },
    scene: sceneList(),
  };
}
```

`features/adventure/AdventureApp.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import Overlay from "./ui/Overlay";

export default function AdventureApp() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { buildConfig } = await import("./game");
      const { default: Phaser } = await import("phaser");
      if (cancelled || gameRef.current || !hostRef.current) return;
      gameRef.current = new Phaser.Game(buildConfig(hostRef.current));
    })();
    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-black">
      <div ref={hostRef} className="absolute inset-0" />
      <Overlay />
    </div>
  );
}
```

`features/adventure/ui/Overlay.tsx`:

```tsx
"use client";

import { useGameStore } from "../bridge/GameStore";

export default function Overlay() {
  const scene = useGameStore((s) => s.scene);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none font-mono">
      {/* Later tasks mount HUD / dialogue / combat panels here. */}
      <div className="absolute left-2 top-2 text-[10px] uppercase tracking-[0.3em] text-white/30">
        {scene}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Route files**

`app/adventure/layout.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abrar's Adventure",
  description: "The Lost Key — a hidden pixel adventure",
};

export default function AdventureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

`app/adventure/page.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";

const AdventureApp = dynamic(() => import("@/features/adventure/AdventureApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-svh w-screen items-center justify-center bg-black font-mono text-xs uppercase tracking-[0.3em] text-white/50">
      loading adventure…
    </div>
  ),
});

export default function AdventurePage() {
  return <AdventureApp />;
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds; `/adventure` listed as a route; first-load JS of `/` unchanged from before this task (compare `npm run build` output table).
Run: `npm run dev`, open `http://localhost:3000/adventure`
Expected: black page → letterboxed canvas with scaled checker sprite and "BOOT OK"; overlay shows "Boot" top-left. Reloading twice causes no WebGL context errors (StrictMode guard works).

- [ ] **Step 6: Commit**

```bash
git add app/adventure features/adventure
git commit -m "feat(adventure): /adventure route with Phaser boot + React overlay bridge"
```

---

# Phase 1 — Art & Audio Foundations

### Task 4: Palette, texture generator, player sprite set

**Files:**
- Create: `features/adventure/art/palette.ts`
- Create: `features/adventure/art/grid.ts` (pure, testable)
- Create: `features/adventure/art/grid.test.ts`
- Create: `features/adventure/art/textures.ts` (Phaser-facing)
- Create: `features/adventure/art/sprites/player.ts`
- Modify: `features/adventure/scenes/BootScene.ts` (register real textures, show player idle)

**Interfaces:**
- Consumes: config, BootScene.
- Produces:
  - `PALETTE: Record<string, string>` — single source of palette chars.
  - `parseGrid(rows: string[]): { w: number; h: number; px: (string | null)[][] }` — validates rectangular grid, unknown chars throw.
  - `SpriteDef = { key: string; w: number; h: number; frames: string[][]; anims?: { key: string; frames: number[]; frameRate: number; repeat: number }[] }`
  - `registerSprites(scene: Phaser.Scene, defs: SpriteDef[]): void` — creates textures `key#i` per frame + global anims `key:animKey`.
  - `PLAYER_SPRITES: SpriteDef` with anims: `idle`(2f/3fps), `run`(4f/10fps), `jump`(1f), `fall`(1f), `attack`(3f/12fps norepeat), `hurt`(1f), `parry`(2f/10fps), `interact`(2f/6fps), `victory`(2f/4fps), `death`(4f/6fps norepeat).

- [ ] **Step 1: Failing tests for grid parsing**

`features/adventure/art/grid.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseGrid } from "./grid";

describe("parseGrid", () => {
  it("parses a rectangular grid into palette refs", () => {
    const g = parseGrid(["KK.", ".KK"]);
    expect(g.w).toBe(3);
    expect(g.h).toBe(2);
    expect(g.px[0][0]).toBe("K");
    expect(g.px[0][2]).toBeNull(); // "." = transparent
  });

  it("throws on ragged rows", () => {
    expect(() => parseGrid(["KK", "K"])).toThrow(/ragged/i);
  });

  it("throws on characters missing from the palette", () => {
    expect(() => parseGrid(["KZ"])).toThrow(/palette/i);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run features/adventure/art`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement palette + grid**

`features/adventure/art/palette.ts` (complete; later sprite files use ONLY these chars):

```ts
/** Global 32-color palette. Char → hex. "." is transparent (not listed). */
export const PALETTE: Record<string, string> = {
  // neutrals
  O: "#0a0a0d", K: "#16161c", k: "#23232c", D: "#33333f", d: "#4a4a58",
  W: "#e8e8ee", C: "#d7d9e0", c: "#9a9dab",
  // skin / hair
  S: "#c98f5f", s: "#a8714a", H: "#1b1410", h: "#33261a",
  // site violet / magic
  V: "#c4b5fd", v: "#8b6cf0", U: "#5b3fb8",
  // cyber blue
  B: "#6ec1ff", b: "#2f7fd4", N: "#1a3a5c",
  // corruption red
  R: "#ef4444", r: "#a02030", X: "#5c0f18",
  // world greens (Bug Fields)
  G: "#59c95f", g: "#2f8f45", F: "#1c5a30",
  // harbor teal
  T: "#3fbdb0", t: "#20726e",
  // factory orange / molten
  M: "#ff9f45", m: "#d4622a", L: "#8f3415",
  // archive sepia
  P: "#cbb289", p: "#8f7a55",
  // gold / key
  Y: "#ffd75e", y: "#c9a227",
};
```

`features/adventure/art/grid.ts`:

```ts
import { PALETTE } from "./palette";

export interface ParsedGrid {
  w: number;
  h: number;
  px: (string | null)[][]; // palette char or null (transparent)
}

export function parseGrid(rows: string[]): ParsedGrid {
  if (rows.length === 0) throw new Error("empty grid");
  const w = rows[0].length;
  const px: (string | null)[][] = rows.map((row, y) => {
    if (row.length !== w) throw new Error(`ragged grid at row ${y}`);
    return [...row].map((ch, x) => {
      if (ch === ".") return null;
      if (!PALETTE[ch]) throw new Error(`char "${ch}" at ${x},${y} not in palette`);
      return ch;
    });
  });
  return { w, h: rows.length, px };
}

/** Convenience for sprite files: template string → trimmed rows. */
export function frame(str: string): string[] {
  return str
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export function mirrorFrame(rows: string[]): string[] {
  return rows.map((r) => [...r].reverse().join(""));
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npx vitest run features/adventure/art`
Expected: 3 passed.

- [ ] **Step 5: Phaser texture registry**

`features/adventure/art/textures.ts`:

```ts
import type Phaser from "phaser";
import { PALETTE } from "./palette";
import { parseGrid } from "./grid";

export interface SpriteAnim {
  key: string;
  frames: number[];
  frameRate: number;
  repeat: number; // -1 loop, 0 once
}

export interface SpriteDef {
  key: string;
  w: number;
  h: number;
  frames: string[][]; // each entry is rows[] for one frame
  anims?: SpriteAnim[];
}

export function frameKey(key: string, i: number): string {
  return `${key}#${i}`;
}

export function animKey(key: string, anim: string): string {
  return `${key}:${anim}`;
}

export function registerSprites(scene: Phaser.Scene, defs: SpriteDef[]): void {
  for (const def of defs) {
    def.frames.forEach((rows, i) => {
      const tex = frameKey(def.key, i);
      if (scene.textures.exists(tex)) return;
      const g = parseGrid(rows);
      if (g.w !== def.w || g.h !== def.h)
        throw new Error(`${tex}: expected ${def.w}x${def.h}, got ${g.w}x${g.h}`);
      const canvas = scene.textures.createCanvas(tex, g.w, g.h);
      if (!canvas) continue;
      const ctx = canvas.getContext();
      g.px.forEach((row, y) =>
        row.forEach((ch, x) => {
          if (!ch) return;
          ctx.fillStyle = PALETTE[ch];
          ctx.fillRect(x, y, 1, 1);
        }),
      );
      canvas.refresh();
    });
    for (const anim of def.anims ?? []) {
      const key = animKey(def.key, anim.key);
      if (scene.anims.exists(key)) continue;
      scene.anims.create({
        key,
        frames: anim.frames.map((i) => ({ key: frameKey(def.key, i) })),
        frameRate: anim.frameRate,
        repeat: anim.repeat,
      });
    }
  }
}
```

- [ ] **Step 6: Player sprite (complete example frames below; remaining frames authored to schema)**

`features/adventure/art/sprites/player.ts` — pixel-Abrar, 16×24: dark wavy hair `H/h`, sunglasses `O` band with `d` glints, skin `S/s`, silver chain `C`, black tee/cargos `K/k` with `O` outline, black-white sneakers `K/W`. `idle` frame 0 (complete, use verbatim):

```ts
import { frame, mirrorFrame } from "../grid";
import type { SpriteDef } from "../textures";

const IDLE_0 = frame(`
  ....HHHHHHHH....
  ...HHHHHHHHHh...
  ..HHhHHHHHHHHh..
  ..HHSSSSSSSSH...
  ..hSSSSSSSSSS...
  ..OOOOOOOOOOd...
  ..OddOOOOddOd...
  ..hSSSSSSSSSs...
  ...SSSSssSSs....
  ....sSSSSSs.....
  ...KKCCCCKKK....
  ..KKKKCCKKKKK...
  .KKKKKKKKKKKKk..
  .SKKKKKKKKKKKS..
  .SKKKKKKKKKKKS..
  ..kKKKKKKKKKk...
  ...KKKKKKKKk....
  ...KKk..kKKk....
  ...KKk..kKKk....
  ...KKk..kKKk....
  ..kKKk..kKKkk...
  ..WWWk..kWWWk...
  .KWWW....KWWWk..
  ................
`);
```

Frame rules (schema): `idle` f1 = f0 with torso rows 10–16 shifted down 1px (head steady, breathing). `run` f0–f3 = legs alternate stride (draw f0/f1 fully, f2 = mirrorFrame leg rows of f0, f3 = mirror of f1), arms swing 1px. `jump` = legs tucked, arms up; `fall` = legs split, hair up 1px; `attack` 3f = arm extends with `V` energy slash arc growing; `hurt` = 1f leaning back, mouth open, `R` flash pixels on torso; `parry` 2f = forearms crossed with `B` shield glint; `interact` 2f = arm reaching forward; `victory` 2f = both arms up, `Y` sparkle pixels; `death` 4f = sink + dissolve into `V/v` pixels (rows drop out bottom-up).

Export:

```ts
export const PLAYER_SPRITES: SpriteDef = {
  key: "player",
  w: 16,
  h: 24,
  frames: [IDLE_0, IDLE_1, RUN_0, RUN_1, RUN_2, RUN_3, JUMP_0, FALL_0,
           ATK_0, ATK_1, ATK_2, HURT_0, PARRY_0, PARRY_1, INT_0, INT_1,
           VIC_0, VIC_1, DEATH_0, DEATH_1, DEATH_2, DEATH_3],
  anims: [
    { key: "idle", frames: [0, 1], frameRate: 3, repeat: -1 },
    { key: "run", frames: [2, 3, 4, 5], frameRate: 10, repeat: -1 },
    { key: "jump", frames: [6], frameRate: 1, repeat: -1 },
    { key: "fall", frames: [7], frameRate: 1, repeat: -1 },
    { key: "attack", frames: [8, 9, 10], frameRate: 12, repeat: 0 },
    { key: "hurt", frames: [11], frameRate: 1, repeat: 0 },
    { key: "parry", frames: [12, 13], frameRate: 10, repeat: 0 },
    { key: "interact", frames: [14, 15], frameRate: 6, repeat: 0 },
    { key: "victory", frames: [16, 17], frameRate: 4, repeat: -1 },
    { key: "death", frames: [18, 19, 20, 21], frameRate: 6, repeat: 0 },
  ],
};
```

- [ ] **Step 7: BootScene uses the registry**

Replace BootScene's checker block: import `registerSprites` + `PLAYER_SPRITES`, call `registerSprites(this, [PLAYER_SPRITES])`, then `this.add.sprite(GAME_WIDTH/2, GAME_HEIGHT/2, frameKey("player", 0)).setScale(4).play(animKey("player","idle"))`. Keep "BOOT OK" text.

- [ ] **Step 8: Verify**

Run: `npx vitest run features/adventure && npx tsc --noEmit`
Expected: all pass, no type errors.
Dev server `/adventure`: pixel-Abrar idles (breathing) at 4×, recognizable silhouette: hair, shades, chain, black fit, white-soled kicks.

- [ ] **Step 9: Commit**

```bash
git add features/adventure
git commit -m "feat(adventure): palette, pixel-grid texture pipeline, player sprite set"
```

---

### Task 5: Chiptune synth, tracks, SFX

**Files:**
- Create: `features/adventure/audio/notes.ts` + `notes.test.ts` (pure)
- Create: `features/adventure/audio/synth.ts`
- Create: `features/adventure/audio/tracks.ts`
- Create: `features/adventure/audio/sfx.ts`
- Modify: `features/adventure/ui/Overlay.tsx` (mute/volume control, persists via Task 15 later — for now module-local)

**Interfaces:**
- Consumes: `ids.ts` (`TrackId`, `SfxId`).
- Produces:
  - `noteToFreq(note: string): number` — `"C4"→261.63`, `"A4"→440`, sharps `"F#3"`; throws on garbage.
  - `stepDurationMs(bpm: number): number` — 16th-note steps: `15000/bpm`.
  - `type Step = string | "—" | null` (note = attack, `"—"` = sustain, `null` = rest).
  - `interface Track { bpm: number; loop: boolean; sq1: Step[]; sq2: Step[]; tri: Step[]; noise: (0|1|2|null)[] }` (noise: 1=hat, 2=snare/boom).
  - `TRACKS: Record<TrackId, Track>`.
  - `audio` singleton: `audio.unlock()`, `audio.playTrack(id: TrackId)`, `audio.stopTrack()`, `audio.sfx(id: SfxId)`, `audio.setVolume(v: number)`, `audio.setMuted(m: boolean)`, `audio.getState(): { volume: number; muted: boolean }`.

- [ ] **Step 1: Failing tests**

`features/adventure/audio/notes.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { noteToFreq, stepDurationMs } from "./notes";

describe("notes", () => {
  it("A4 is 440", () => {
    expect(noteToFreq("A4")).toBeCloseTo(440, 1);
  });
  it("C4 is middle C", () => {
    expect(noteToFreq("C4")).toBeCloseTo(261.63, 1);
  });
  it("supports sharps and octaves", () => {
    expect(noteToFreq("F#3")).toBeCloseTo(185.0, 1);
    expect(noteToFreq("C5")).toBeCloseTo(2 * noteToFreq("C4"), 1);
  });
  it("throws on invalid notes", () => {
    expect(() => noteToFreq("H2")).toThrow();
    expect(() => noteToFreq("C")).toThrow();
  });
  it("16th-note step duration from bpm", () => {
    expect(stepDurationMs(120)).toBeCloseTo(125, 5);
  });
});
```

- [ ] **Step 2: Verify failure**

Run: `npx vitest run features/adventure/audio` → FAIL (module not found).

- [ ] **Step 3: Implement notes.ts**

```ts
const SEMITONE: Record<string, number> = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

export function noteToFreq(note: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(note);
  if (!m) throw new Error(`bad note: ${note}`);
  const idx = SEMITONE[m[1]];
  const octave = Number(m[2]);
  const midi = 12 * (octave + 1) + idx;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function stepDurationMs(bpm: number): number {
  return 15000 / bpm; // 16th notes
}

export type Step = string | "—" | null;
```

- [ ] **Step 4: Tests pass**

Run: `npx vitest run features/adventure/audio` → 5 passed.

- [ ] **Step 5: Synth + track data**

`features/adventure/audio/synth.ts` — WebAudio, no deps. Master `GainNode` → destination. Voices: two square `OscillatorNode`s, one triangle, one noise (`AudioBufferSourceNode` over 0.2s white-noise buffer). Scheduler: `setInterval` lookahead 25ms scheduling 100ms ahead on `AudioContext.currentTime` (standard chiptune scheduler); each step attack applies ADSR envelope via `gain.setValueAtTime/linearRampToValueAtTime` (a 5ms, d 40ms, s 0.6, r 30ms); `"—"` sustains, `null` releases. `audio.unlock()` creates/resumes the context (call on first user gesture). SFX = short envelopes: `jump` square up-chirp 300→600Hz/80ms, `stomp` noise burst 60ms, `parry` triangle 1200Hz ping 50ms + square 1800Hz 30ms, `type` 2000Hz square 15ms, `damage` 110Hz square 120ms down-bend, `collect` two-note arp C6/E6 60ms, `chest` rising arp C4-E4-G4-C5 400ms, `select` 800Hz 25ms, `dash` noise sweep 90ms, `error` 150Hz saw-ish square 150ms, `crit` C6-G6 double ping. Muted state: master gain 0 (state kept). Export singleton `audio`.

`features/adventure/audio/tracks.ts` — `TRACKS: Record<TrackId, Track>`. Complete example (use verbatim), `title`, 64 steps, A-minor, 96 bpm, moody-heroic:

```ts
import type { Step } from "./notes";

export interface Track {
  bpm: number;
  loop: boolean;
  sq1: Step[];
  sq2: Step[];
  tri: Step[];
  noise: (0 | 1 | 2 | null)[];
}

const _ = null;
const S = "—";

export const TITLE: Track = {
  bpm: 96,
  loop: true,
  sq1: [
    "A4", S, S, S, "C5", S, "B4", S, "A4", S, S, S, "E4", S, S, S,
    "F4", S, S, S, "A4", S, "G4", S, "E4", S, S, S, S, S, _, _,
    "A4", S, S, S, "C5", S, "B4", S, "D5", S, S, S, "C5", S, "B4", S,
    "A4", S, S, S, "G4", S, "E4", S, "A4", S, S, S, S, S, _, _,
  ],
  sq2: [
    "E3", S, _, "E3", S, _, "E3", S, "E3", S, _, "E3", S, _, "E3", S,
    "D3", S, _, "D3", S, _, "D3", S, "C3", S, _, "C3", S, _, "C3", S,
    "E3", S, _, "E3", S, _, "E3", S, "F3", S, _, "F3", S, _, "F3", S,
    "E3", S, _, "E3", S, _, "D3", S, "A2", S, S, S, S, S, _, _,
  ],
  tri: [
    "A2", S, S, S, S, S, S, S, "A2", S, S, S, S, S, S, S,
    "D2", S, S, S, S, S, S, S, "C2", S, S, S, S, S, S, S,
    "A2", S, S, S, S, S, S, S, "F2", S, S, S, S, S, S, S,
    "E2", S, S, S, S, S, S, S, "A2", S, S, S, S, S, S, S,
  ],
  noise: [
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 1, _, 1, 1,
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 1, _, 1, 1,
    2, _, 1, _, 1, _, 1, _, 2, _, 1, _, 1, _, 1, 1,
    2, _, 1, _, 1, _, 1, _, 2, _, 1, 1, 2, _, 2, 2,
  ],
};
```

Author remaining tracks to schema (64–128 steps each): `overworld` C-major strolling 104bpm; `level-1` bright G-major 112; `level-2` D-minor sway 100 (harbor); `level-3` E-minor driving 126 (factory); `level-4` A-minor sparse 84 (archive, long rests); `boss` D-minor 140; `castle` C#-minor 92 ominous low tri; `devil-1` B-minor 132; `devil-2` same motif 152 + denser noise; `devil-3` same motif 160 up a 4th; `victory` C-major fanfare 120, loop:false; `chest` slow F-major arps 72, loop:false.

- [ ] **Step 6: Wire audio toggle into Overlay**

Add to `Overlay.tsx` a pointer-events-auto button (top-right, 🔊/🔇 as text glyphs `SND ON/OFF` in the site's tracked-uppercase style) calling `audio.unlock()` then `audio.setMuted(!muted)`; local `useState` mirror of `audio.getState()`. First click anywhere on the overlay root also calls `audio.unlock()` (autoplay policy).

- [ ] **Step 7: Verify**

Run: `npx vitest run && npx tsc --noEmit` → all pass.
Dev `/adventure`: press SND ON — title track plays (BootScene: add `audio.playTrack("title")` after first `pointerdown` via `this.input.once("pointerdown", ...)`). No console errors; mute stops sound immediately.

- [ ] **Step 8: Commit**

```bash
git add features/adventure
git commit -m "feat(adventure): webaudio chiptune synth, 13 tracks, sfx kit"
```

---

# Phase 2 — Platforming Core

### Task 6: Level format, parser, and level 1-1 map

**Files:**
- Create: `features/adventure/levels/types.ts`
- Create: `features/adventure/levels/parse.ts` + `parse.test.ts`
- Create: `features/adventure/levels/level-1-1.ts`
- Create: `features/adventure/levels/index.ts`

**Interfaces:**
- Consumes: `ids.ts`.
- Produces:
  - Legend (locked): `#` solid · `=` one-way platform · `^` hazard spike/corruption · `P` player start · `C` checkpoint · `M` memory fragment · `D` boss door · `b` Bugling · `p` Phishling · `m` MalwareBat · `B` BruteForceBrute · `k` FirewallKnight · `s` RootkitSlime · `.` empty.
  - `interface LevelDefinition { id: LevelId; name: string; theme: "fields"|"harbor"|"factory"|"archive"|"castle"; bossId: BossId; music: TrackId; map: string; introDialogueId: string | null; fragmentDialogueId: string | null }`
  - `interface ParsedLevel { widthTiles: number; heightTiles: number; solids: boolean[][]; oneWays: boolean[][]; hazards: boolean[][]; playerStart: Pt; checkpoints: Pt[]; fragment: Pt | null; bossDoor: Pt; spawns: { kind: EnemyKind; at: Pt }[] }` with `Pt = { tx: number; ty: number }` (tile coords) and `type EnemyKind = "bugling"|"phishling"|"malware-bat"|"brute"|"firewall-knight"|"rootkit-slime"`.
  - `parseLevel(def: LevelDefinition): ParsedLevel` (throws on ragged map, missing P or D).
  - `LEVELS: Record<LevelId, LevelDefinition>` from `levels/index.ts` (grows as levels land; `parseLevel` is total over it).

- [ ] **Step 1: Failing tests**

`features/adventure/levels/parse.test.ts`:

```ts
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
```

- [ ] **Step 2: Verify failure** — `npx vitest run features/adventure/levels` → FAIL (module not found).

- [ ] **Step 3: Implement** `types.ts` (interfaces above verbatim) and `parse.ts`:

```ts
import type { LevelDefinition, ParsedLevel, Pt, EnemyKind } from "./types";

const ENEMY_CHARS: Record<string, EnemyKind> = {
  b: "bugling", p: "phishling", m: "malware-bat",
  B: "brute", k: "firewall-knight", s: "rootkit-slime",
};

export function parseLevel(def: LevelDefinition): ParsedLevel {
  const rows = def.map.split("\n").filter((r) => r.length > 0);
  const w = rows[0].length;
  const grid = <T,>(v: T) => rows.map(() => Array<T>(w).fill(v));
  const solids = grid(false), oneWays = grid(false), hazards = grid(false);
  let playerStart: Pt | null = null, bossDoor: Pt | null = null, fragment: Pt | null = null;
  const checkpoints: Pt[] = [];
  const spawns: { kind: EnemyKind; at: Pt }[] = [];

  rows.forEach((row, ty) => {
    if (row.length !== w) throw new Error(`ragged map at row ${ty}`);
    [...row].forEach((ch, tx) => {
      const at = { tx, ty };
      if (ch === "#") solids[ty][tx] = true;
      else if (ch === "=") oneWays[ty][tx] = true;
      else if (ch === "^") hazards[ty][tx] = true;
      else if (ch === "P") playerStart = at;
      else if (ch === "D") bossDoor = at;
      else if (ch === "M") fragment = at;
      else if (ch === "C") checkpoints.push(at);
      else if (ENEMY_CHARS[ch]) spawns.push({ kind: ENEMY_CHARS[ch], at });
      else if (ch !== ".") throw new Error(`unknown map char "${ch}" at ${tx},${ty}`);
    });
  });
  if (!playerStart) throw new Error("missing player start (P)");
  if (!bossDoor) throw new Error("missing boss door (D)");
  return {
    widthTiles: w, heightTiles: rows.length,
    solids, oneWays, hazards,
    playerStart, checkpoints, fragment, bossDoor, spawns,
  };
}
```

- [ ] **Step 4: Tests pass** — `npx vitest run features/adventure/levels` → 3 passed.

- [ ] **Step 5: Author `level-1-1.ts` (complete map, use verbatim; 16 rows × 160 cols)**

Bug Fields: gentle intro — flat run, two-gap lesson, one-way platform stairs to the fragment, checkpoint mid, phishling ambush near a fake "reward" perch, descent to the boss door. Map (join rows with `\n`; every row exactly 160 chars — pad with `.`):

```text
................................................................................................................................................................
................................................................................................................................................................
...................................................M...........................................................................................................
..................................................===..........................................................................................................
..............................==........==....................................==...............................................................................
.........................b........................................p.......................b....................................................................
....P................==......................C..........==............................................==...........p...................C......b.........D....
..................................b..................................................b.........................................................................
####################....########....############....####################....########....############################....########....############################
####################....########....############....####################....########....############################....########....############################
....................^^^^........^^^^............^^^^....................^^^^........^^^^................................^^^^....................................
################################################################################################################################################################
################################################################################################################################################################
................................................................................................................................................................
................................................................................................................................................................
................................................................................................................................................................
```

`levels/index.ts`:

```ts
import type { LevelId } from "../ids";
import type { LevelDefinition } from "./types";
import { LEVEL_1_1 } from "./level-1-1";

export const LEVELS: Partial<Record<LevelId, LevelDefinition>> = {
  "1-1": LEVEL_1_1,
};
```

(`Partial` until all levels land; Task 21 tightens it to `Record` once castle exists.)

- [ ] **Step 6: Add a data test** — append to `parse.test.ts`:

```ts
import { LEVELS } from "./index";

describe("authored levels", () => {
  it("every registered level parses", () => {
    for (const def of Object.values(LEVELS)) expect(() => parseLevel(def!)).not.toThrow();
  });
});
```

Run: `npx vitest run features/adventure/levels && npx tsc --noEmit` → all pass.

- [ ] **Step 7: Commit**

```bash
git add features/adventure/levels
git commit -m "feat(adventure): ASCII level format, parser, level 1-1 map"
```

---

### Task 7: PlatformLevelScene — tiles, player controller, camera, HUD

**Files:**
- Create: `features/adventure/scenes/PlatformLevelScene.ts`
- Create: `features/adventure/art/sprites/tiles-fields.ts` (world-1 tileset + parallax)
- Create: `features/adventure/input/InputState.ts`
- Modify: `features/adventure/game.ts` (append scene), `features/adventure/bridge/GameStore.ts` (HUD fields), `features/adventure/bridge/EventBus.ts` (events), `features/adventure/scenes/BootScene.ts` (start Level directly for now), `features/adventure/ui/Overlay.tsx` (HUD panel)

**Interfaces:**
- Consumes: parseLevel, LEVELS, sprites, audio, config.
- Produces:
  - `InputState` singleton: `{ left, right, jump, jumpPressed, dash, attack, interact, pause }` booleans updated by keyboard AND (later) VirtualControls; `jumpPressed`/edge-triggered flags auto-clear each frame via `consume()`.
  - `PlatformLevelScene` started with data `{ levelId: LevelId; spawnAt?: "start" | "checkpoint" | "door" }`.
  - Store gains `hud: { health: number; maxHealth: number; buffs: BuffId[]; fragments: number; levelId: LevelId | null }`, `levelBuffs: BuffId[]`.
  - Events: `"level:complete" { levelId }`, `"level:enter-boss" { levelId; bossId }`, `"player:damaged" { health }`, `"buff:collected" { buff: BuffId }`, `"nav:external" { href: string }`.
  - Tileset keys: `tile-fields-ground`, `tile-fields-oneway`, `tile-fields-hazard`, parallax `bg-fields-0/1/2` (authored to schema: 16×16 tiles; grass lip `G/g` over dirt `h/F`; hazard = `R/r` glitch spikes; parallax = 480×270 gradient sky `N→K`, `V` star specks, pixel clouds `C/c`, broken terminal silhouettes `k/D`).

- [ ] **Step 1: InputState**

`features/adventure/input/InputState.ts`:

```ts
export interface InputSnapshot {
  left: boolean; right: boolean;
  jumpHeld: boolean; jumpPressed: boolean;
  dashPressed: boolean; attackPressed: boolean; interactPressed: boolean;
  pausePressed: boolean;
}

class Input {
  private s: InputSnapshot = {
    left: false, right: false, jumpHeld: false, jumpPressed: false,
    dashPressed: false, attackPressed: false, interactPressed: false, pausePressed: false,
  };

  attachKeyboard() {
    const down = (e: KeyboardEvent) => this.onKey(e.code, true, e.repeat);
    const up = (e: KeyboardEvent) => this.onKey(e.code, false, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }

  private onKey(code: string, isDown: boolean, repeat: boolean) {
    if (repeat) return;
    switch (code) {
      case "ArrowLeft": case "KeyA": this.s.left = isDown; break;
      case "ArrowRight": case "KeyD": this.s.right = isDown; break;
      case "Space": case "ArrowUp": case "KeyW":
        this.s.jumpHeld = isDown;
        if (isDown) this.s.jumpPressed = true;
        break;
      case "ShiftLeft": case "ShiftRight": if (isDown) this.s.dashPressed = true; break;
      case "KeyJ": case "KeyX": if (isDown) this.s.attackPressed = true; break;
      case "KeyE": if (isDown) this.s.interactPressed = true; break;
      case "KeyP": case "Escape": if (isDown) this.s.pausePressed = true; break;
    }
  }

  /** Virtual buttons (Task 27) call these. */
  setHeld(k: "left" | "right" | "jumpHeld", v: boolean) { this.s[k] = v; }
  press(k: "jumpPressed" | "dashPressed" | "attackPressed" | "interactPressed" | "pausePressed") { this.s[k] = true; }

  read(): InputSnapshot { return { ...this.s }; }
  consume() {
    this.s.jumpPressed = false; this.s.dashPressed = false;
    this.s.attackPressed = false; this.s.interactPressed = false; this.s.pausePressed = false;
  }
}

export const input = new Input();
```

- [ ] **Step 2: Scene skeleton + tile bodies**

`PlatformLevelScene.create()` (structure; key logic verbatim below):

1. `registerSprites(this, [PLAYER_SPRITES, ...tilesetFor(theme)])`.
2. Parse level; draw tiles as `this.add.image(tx*TILE+8, ty*TILE+8, key)`.
3. Solid collision: merge horizontal runs of solid tiles per row into static rectangles (fewer bodies):

```ts
const statics = this.physics.add.staticGroup();
for (let ty = 0; ty < lvl.heightTiles; ty++) {
  let run = -1;
  for (let tx = 0; tx <= lvl.widthTiles; tx++) {
    const solid = tx < lvl.widthTiles && lvl.solids[ty][tx];
    if (solid && run < 0) run = tx;
    if (!solid && run >= 0) {
      const wpx = (tx - run) * TILE;
      const rect = this.add.rectangle(run * TILE + wpx / 2, ty * TILE + TILE / 2, wpx, TILE);
      statics.add(rect);
      run = -1;
    }
  }
}
```

4. One-ways: same merging into a second static group `oneWays`; for each body set `body.checkCollision.down = body.checkCollision.left = body.checkCollision.right = false` (up only ⇒ jump-through from below).
5. Hazard tiles: overlap zone group `hazards`.
6. Player sprite at `playerStart` (or `door`/`checkpoint` per scene data), body size 10×22 offset (3,2), `setCollideWorldBounds(false)`.
7. Camera: `startFollow(player, true, 0.12, 0.12)`, `setZoom(ZOOM)`, bounds = map size.
8. `audio.playTrack(def.music)`; store `hud` init; `bus.emit("scene:changed", { scene: "Level" })`.

- [ ] **Step 3: Player controller update (verbatim core)**

```ts
update(_t: number, dtMs: number) {
  if (gameStore.get().paused) { input.consume(); return; }
  const snap = input.read();
  const body = this.player.body as Phaser.Physics.Arcade.Body;
  const onGround = body.blocked.down;

  if (onGround) this.lastGroundedAt = this.time.now;
  if (snap.jumpPressed) this.jumpQueuedAt = this.time.now;

  const canCoyote = this.time.now - this.lastGroundedAt <= PHYSICS.coyoteMs;
  const buffered = this.time.now - this.jumpQueuedAt <= PHYSICS.jumpBufferMs;
  if (buffered && canCoyote && !this.dashing) {
    body.setVelocityY(PHYSICS.jumpVelocity);
    this.jumpQueuedAt = -Infinity; this.lastGroundedAt = -Infinity;
    audio.sfx("jump");
  }
  // variable jump height: releasing early clips ascent
  if (!snap.jumpHeld && body.velocity.y < -120) body.setVelocityY(-120);

  const dir = (snap.right ? 1 : 0) - (snap.left ? 1 : 0);
  if (this.dashing) {
    if (this.time.now - this.dashStartedAt > PHYSICS.dashMs) this.dashing = false;
  } else {
    body.setVelocityX(dir * PHYSICS.moveSpeed * this.speedScale); // cache-boost sets speedScale 1.25
    if (dir !== 0) this.player.setFlipX(dir < 0);
    const dashReady = this.time.now - this.dashStartedAt > PHYSICS.dashCooldownMs;
    if (snap.dashPressed && dashReady && this.abilities.dash && dir !== 0) {
      this.dashing = true; this.dashStartedAt = this.time.now;
      body.setVelocityX(dir * PHYSICS.dashSpeed); body.setVelocityY(0);
      audio.sfx("dash");
    }
  }

  this.playAnimFor(body, onGround); // idle/run/jump/fall by velocity, unless attacking/hurt
  if (snap.attackPressed && !this.attacking) this.doAttack(); // 220ms hitbox 14x18 in front, sfx
  if (snap.interactPressed) this.tryInteract();               // door / fragment (overlap flags)
  if (snap.pausePressed) gameStore.set({ paused: true });
  if (this.player.y > this.mapHeightPx + 40) this.respawn(1); // pit: 1 dmg, checkpoint
  input.consume();
}
```

- [ ] **Step 4: Damage/respawn/checkpoint/fragment/door**

- `takeDamage(n)`: iframes 900ms (blink via alpha tween), `hurt` anim, knockback (−80 x-facing, −160 y), `audio.sfx("damage")`, store hud health; at 0 → `death` anim then `respawn(0)` restoring full health at last checkpoint (buffs kept).
- Checkpoint overlap: latch `lastCheckpoint`, small `V` flag sprite swaps to raised frame, `collect` sfx.
- Fragment overlap + E: mark collected (once per save), `bus.emit("buff:collected"...)`? — no: fragments use `"level:fragment" { levelId }` event (add to `AdventureEvents`), open its dialogue id via Task 17.
- Hazard overlap: `takeDamage(1)` + bounce up.
- Door overlap + E: `bus.emit("level:enter-boss", { levelId, bossId })`; snapshot `gameStore.set({ levelBuffs: hud.buffs })` (Task 13 consumes this and starts combat).

- [ ] **Step 5: HUD panel in Overlay**

Add `ui/Hud.tsx` rendered by `Overlay` when `scene === "Level"`: hearts row (`maxHealth/2` heart glyphs, half-heart support, ♥ as 8×8 pixel div grid styled with Tailwind, `R` red fill), buff chips (buff id → 2-letter tag in violet border), fragment icon when found. `pointer-events-none` throughout.

- [ ] **Step 6: Temporary boot handoff** — BootScene, after texture registration: `this.scene.start("Level", { levelId: "1-1" })` (Title/Overworld replace this in Task 16).

- [ ] **Step 7: Verify** — `npx tsc --noEmit && npm test` pass. Dev `/adventure`: run/jump/fall through level 1-1 with camera follow at 2× zoom; coyote+buffer feel forgiving (step off a ledge and jump — it works within ~100ms); one-ways jump-through; hazards hurt + blink; pits respawn at checkpoint; music plays; HUD hearts drop and recover on respawn. Dash does nothing yet (ability false) — expected.

- [ ] **Step 8: Commit**

```bash
git add features/adventure
git commit -m "feat(adventure): platforming scene — tiles, controller, camera, HUD"
```

---

### Task 8: Enemy base + Bugling + Phishling + drops

**Files:**
- Create: `features/adventure/enemies/drops.ts` + `drops.test.ts` (pure)
- Create: `features/adventure/enemies/Enemy.ts`, `Bugling.ts`, `Phishling.ts`
- Create: `features/adventure/art/sprites/enemies1.ts` (bugling 16×16 walk 2f + squash 1f; phishling 16×16 disguise 2f shimmer + reveal 2f + lunge 1f — authored to schema: bugling = round `R/r`-corrupted beetle-mushroom, `G` legs; phishling = floating `Y` gift box "FREE" that reveals `X/R` toothy core)
- Create: `features/adventure/art/sprites/pickups.ts` (heart 8×8, buff chip 12×12 per BuffId with 2-px letter glyph, fragment 12×12 `V` shard, flag 16×24)
- Modify: `PlatformLevelScene.ts` (spawn from `lvl.spawns`, stomp/attack resolution, pickup physics)

**Interfaces:**
- Consumes: scene physics groups, `rollDrop`.
- Produces:
  - `rollDrop(kind: EnemyKind, rand: number): BuffId | "heart" | null` — deterministic given rand ∈ [0,1).
  - `abstract class Enemy extends Phaser.Physics.Arcade.Sprite` with `kind`, `hp`, `touchDamage`, `stompable`, `die(source: "stomp" | "attack")` (plays squash/flash, emits drop pickup, `stomp` bounces player −240), `hurtPlayer()`.
  - Later enemy tasks (18/19) subclass the same base.

- [ ] **Step 1: Failing drop tests**

`features/adventure/enemies/drops.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { rollDrop } from "./drops";

describe("rollDrop", () => {
  it("bugling: heart at low roll, attack-byte mid, null high", () => {
    expect(rollDrop("bugling", 0.1)).toBe("heart");
    expect(rollDrop("bugling", 0.55)).toBe("attack-byte");
    expect(rollDrop("bugling", 0.9)).toBeNull();
  });
  it("phishling favors focus-chip then firewall-layer", () => {
    expect(rollDrop("phishling", 0.3)).toBe("focus-chip");
    expect(rollDrop("phishling", 0.7)).toBe("firewall-layer");
    expect(rollDrop("phishling", 0.95)).toBeNull();
  });
  it("all kinds return only legal drops across the range", () => {
    const kinds = ["bugling","phishling","malware-bat","brute","firewall-knight","rootkit-slime"] as const;
    for (const k of kinds)
      for (let r = 0; r < 1; r += 0.05)
        expect([null,"heart","attack-byte","firewall-layer","focus-chip","parry-module",
                "recovery-packet","root-access","exploit-insight","cache-boost"]).toContain(rollDrop(k, r));
  });
});
```

- [ ] **Step 2: Verify failure** — `npx vitest run features/adventure/enemies` → FAIL.

- [ ] **Step 3: Implement `drops.ts`** (thresholds are cumulative; table locked):

```ts
import type { BuffId } from "../ids";
import type { EnemyKind } from "../levels/types";

type Drop = BuffId | "heart" | null;
const TABLE: Record<EnemyKind, [number, Drop][]> = {
  bugling: [[0.5, "heart"], [0.7, "attack-byte"]],
  phishling: [[0.6, "focus-chip"], [0.9, "firewall-layer"]],
  "malware-bat": [[0.5, "focus-chip"], [0.7, "cache-boost"]],
  brute: [[0.4, "firewall-layer"], [0.8, "heart"]],
  "firewall-knight": [[0.5, "parry-module"], [0.7, "recovery-packet"]],
  "rootkit-slime": [[0.4, "root-access"], [0.6, "exploit-insight"]],
};

export function rollDrop(kind: EnemyKind, rand: number): Drop {
  for (const [threshold, drop] of TABLE[kind]) if (rand < threshold) return drop;
  return null;
}
```

- [ ] **Step 4: Tests pass** — `npx vitest run features/adventure/enemies` → 3 passed.

- [ ] **Step 5: Enemy base + two enemies**

`Enemy.ts`: constructor `(scene, x, y, kind, texKey)`; gravity on; `patrolSpeed` walk with edge/wall turnaround:

```ts
protected patrol() {
  const body = this.body as Phaser.Physics.Arcade.Body;
  if (body.blocked.left) this.dir = 1;
  if (body.blocked.right) this.dir = -1;
  // ledge check: probe 1 tile ahead+below; turn if empty (bugling only walks toward ledges per spec — Phishling floats)
  if (this.turnAtLedges && body.blocked.down && !this.scene.isSolidAt(this.x + this.dir * 10, this.y + 14)) this.dir *= -1;
  body.setVelocityX(this.dir * this.patrolSpeed);
  this.setFlipX(this.dir < 0);
}
```

`isSolidAt(px, py)` helper added to PlatformLevelScene (tile lookup into `lvl.solids`).

`Bugling.ts`: patrolSpeed 30, hp 1, stompable, touchDamage 1, red glitch fleck particles every 800ms (2×2 `R` rects, 300ms fade).
`Phishling.ts`: no gravity, hovers (sine y ±6). Disguise state shows gift-box anim + floating `FREE UPGRADE` 6px text; within 40px → `reveal` anim then lunge (velocity toward player 160) with 700ms cooldown hover between lunges; stompable only when revealed; if player has `analyze` ability and presses E within 60px while disguised → instantly exposed + stunned 1.5s (easy kill). hp 1.

Scene wiring: spawn group from `lvl.spawns`; collider(enemies, statics); overlap(player, enemy) → if player falling onto top (`player.body.velocity.y > 0 && player.y < enemy.y - 6`) and `enemy.stompable` → `enemy.die("stomp")` else `player.takeDamage(enemy.touchDamage)`. Player attack hitbox overlap → `enemy.die("attack")`. `die()` rolls `rollDrop(kind, Math.random())`, spawns pickup sprite with pop tween; pickup overlap → heart heals 1 (cap max), buff pushes to `hud.buffs` + toast event `"buff:collected"` (Overlay shows 1.5s toast naming the buff), `collect` sfx, cache-boost immediately sets `speedScale = 1.25` for the level.

- [ ] **Step 6: Verify** — `npx tsc --noEmit && npm test` pass. Dev: buglings patrol and turn at ledges/walls; stomping squashes with bounce + occasional drops; phishling reveals and lunges near its fake reward; pickups toast and appear in HUD.

- [ ] **Step 7: Commit**

```bash
git add features/adventure
git commit -m "feat(adventure): enemy base, bugling, phishling, drop system"
```

---

# Phase 3 — Combat

### Task 9: Typing grader

**Files:**
- Create: `features/adventure/combat/typing.ts` + `typing.test.ts`

**Interfaces:**
- Produces: `type TypingGrade = "perfect" | "good" | "incomplete" | "incorrect"`; `gradeTyping(prompt: string, typed: string, elapsedMs: number, timeLimitMs: number): TypingGrade`; `TYPING_DAMAGE_MULT: Record<TypingGrade, number>` = perfect 2 / good 1.2 / incomplete 0.6 / incorrect 0.25; `typingTimeLimitMs(base: number, focusChips: number, assistScale: number): number` = `base * (1 + 0.25 * min(focusChips, 2)) * assistScale`.

- [ ] **Step 1: Failing tests**

```ts
import { describe, it, expect } from "vitest";
import { gradeTyping, typingTimeLimitMs, TYPING_DAMAGE_MULT } from "./typing";

describe("gradeTyping", () => {
  it("exact + fast = perfect", () => {
    expect(gradeTyping("scan target", "scan target", 1500, 4000)).toBe("perfect");
  });
  it("exact + slow = good", () => {
    expect(gradeTyping("scan target", "scan target", 3900, 4000)).toBe("good");
  });
  it("half-or-more correct prefix = incomplete", () => {
    expect(gradeTyping("scan target", "scan t", 4000, 4000)).toBe("incomplete");
  });
  it("wrong text = incorrect, never zero damage", () => {
    expect(gradeTyping("scan target", "scam targe", 2000, 4000)).toBe("incorrect");
    expect(TYPING_DAMAGE_MULT.incorrect).toBeGreaterThan(0);
  });
  it("trims and ignores case", () => {
    expect(gradeTyping("scan", " SCAN ", 100, 4000)).toBe("perfect");
  });
  it("focus chips and assist widen the timer, capped at 2 chips", () => {
    expect(typingTimeLimitMs(4000, 1, 1)).toBe(5000);
    expect(typingTimeLimitMs(4000, 5, 1)).toBe(6000);
    expect(typingTimeLimitMs(4000, 0, 1.5)).toBe(6000);
  });
});
```

- [ ] **Step 2: Verify failure** — `npx vitest run features/adventure/combat` → FAIL.

- [ ] **Step 3: Implement**

```ts
export type TypingGrade = "perfect" | "good" | "incomplete" | "incorrect";

export const TYPING_DAMAGE_MULT: Record<TypingGrade, number> = {
  perfect: 2, good: 1.2, incomplete: 0.6, incorrect: 0.25,
};

export function gradeTyping(prompt: string, typed: string, elapsedMs: number, timeLimitMs: number): TypingGrade {
  const want = prompt.trim().toLowerCase();
  const got = typed.trim().toLowerCase();
  if (got === want) return elapsedMs <= timeLimitMs * 0.5 ? "perfect" : "good";
  if (want.startsWith(got) && got.length >= Math.ceil(want.length / 2)) return "incomplete";
  return "incorrect";
}

export function typingTimeLimitMs(base: number, focusChips: number, assistScale: number): number {
  return base * (1 + 0.25 * Math.min(focusChips, 2)) * assistScale;
}
```

- [ ] **Step 4: Pass + commit**

Run: `npx vitest run features/adventure/combat` → passed.

```bash
git add features/adventure/combat
git commit -m "feat(adventure): typing challenge grader"
```

---

### Task 10: Timed events (parry / marker / choice) math

**Files:**
- Create: `features/adventure/combat/timedEvents.ts` + `timedEvents.test.ts`

**Interfaces:**
- Produces:
  - `type ParryGrade = "perfect" | "normal" | "miss"`
  - `type QteSpec = { kind: "parry"; windowMs: number } | { kind: "marker"; travelMs: number; targetStart: number; targetEnd: number } | { kind: "choice"; promptText: string; options: string[]; correctIndex: number; timeLimitMs: number } | { kind: "type-word"; word: string; timeLimitMs: number }`
  - `resolveParry(pressAt: number | null, impactAt: number, windowMs: number, perfectMs: number): ParryGrade` — press must land within `windowMs` BEFORE impact; within `perfectMs` of impact = perfect.
  - `markerPosition(elapsedMs: number, travelMs: number): number` — 0→1 ping-pong.
  - `resolveMarker(pressElapsedMs: number | null, spec): boolean`.
  - `scaleQte(spec: QteSpec, scale: number): QteSpec` — multiplies windows/limits (assist & parry modules & phase tempo).

- [ ] **Step 1: Failing tests**

```ts
import { describe, it, expect } from "vitest";
import { resolveParry, markerPosition, resolveMarker, scaleQte } from "./timedEvents";

describe("timed events", () => {
  it("parry inside window = normal, near impact = perfect, outside = miss", () => {
    expect(resolveParry(1000 - 150, 1000, 220, 90)).toBe("normal");
    expect(resolveParry(1000 - 50, 1000, 220, 90)).toBe("perfect");
    expect(resolveParry(1000 - 400, 1000, 220, 90)).toBe("miss");
    expect(resolveParry(1010, 1000, 220, 90)).toBe("miss"); // late = whiff
    expect(resolveParry(null, 1000, 220, 90)).toBe("miss");
  });
  it("marker ping-pongs 0..1 and resolves inside target", () => {
    expect(markerPosition(0, 1000)).toBe(0);
    expect(markerPosition(500, 1000)).toBe(0.5);
    expect(markerPosition(1500, 1000)).toBe(0.5); // bounced back
    const spec = { kind: "marker", travelMs: 1000, targetStart: 0.4, targetEnd: 0.6 } as const;
    expect(resolveMarker(500, spec)).toBe(true);
    expect(resolveMarker(100, spec)).toBe(false);
    expect(resolveMarker(null, spec)).toBe(false);
  });
  it("scaleQte widens windows", () => {
    expect(scaleQte({ kind: "parry", windowMs: 200 }, 1.5)).toEqual({ kind: "parry", windowMs: 300 });
    const c = scaleQte({ kind: "choice", promptText: "?", options: ["a"], correctIndex: 0, timeLimitMs: 2000 }, 1.25);
    expect(c.kind === "choice" && c.timeLimitMs).toBe(2500);
  });
});
```

- [ ] **Step 2: Verify failure**, then **Step 3: Implement**

```ts
export type ParryGrade = "perfect" | "normal" | "miss";

export type QteSpec =
  | { kind: "parry"; windowMs: number }
  | { kind: "marker"; travelMs: number; targetStart: number; targetEnd: number }
  | { kind: "choice"; promptText: string; options: string[]; correctIndex: number; timeLimitMs: number }
  | { kind: "type-word"; word: string; timeLimitMs: number };

export function resolveParry(pressAt: number | null, impactAt: number, windowMs: number, perfectMs: number): ParryGrade {
  if (pressAt === null) return "miss";
  const lead = impactAt - pressAt;
  if (lead < 0 || lead > windowMs) return "miss";
  return lead <= perfectMs ? "perfect" : "normal";
}

export function markerPosition(elapsedMs: number, travelMs: number): number {
  const t = elapsedMs / travelMs;
  const cycle = t % 2;
  return cycle <= 1 ? cycle : 2 - cycle;
}

export function resolveMarker(
  pressElapsedMs: number | null,
  spec: Extract<QteSpec, { kind: "marker" }>,
): boolean {
  if (pressElapsedMs === null) return false;
  const pos = markerPosition(pressElapsedMs, spec.travelMs);
  return pos >= spec.targetStart && pos <= spec.targetEnd;
}

export function scaleQte(spec: QteSpec, scale: number): QteSpec {
  switch (spec.kind) {
    case "parry": return { ...spec, windowMs: spec.windowMs * scale };
    case "marker": return { ...spec, travelMs: spec.travelMs * scale };
    case "choice": return { ...spec, timeLimitMs: spec.timeLimitMs * scale };
    case "type-word": return { ...spec, timeLimitMs: spec.timeLimitMs * scale };
  }
}
```

- [ ] **Step 4: Pass + commit**

```bash
git add features/adventure/combat
git commit -m "feat(adventure): timed defense event math (parry/marker/choice)"
```

---

### Task 11: Combat types, buffs, assist

**Files:**
- Create: `features/adventure/combat/types.ts`
- Create: `features/adventure/combat/buffs.ts` + `buffs.test.ts`
- Create: `features/adventure/combat/assist.ts` + `assist.test.ts`

**Interfaces:**
- Produces (locked for Tasks 12–24):

```ts
// combat/types.ts — verbatim
import type { BossId, BuffId } from "../ids";
import type { QteSpec, ParryGrade } from "./timedEvents";
import type { TypingGrade } from "./typing";

export interface BossMove {
  id: string; name: string; damage: number;
  parryable: boolean;
  qte?: QteSpec;          // when set, defense is this QTE instead of a parry
  telegraph: string;
  summons?: number;
}

export interface BossPhase {
  exitBelow: number;      // phase ends when health fraction <= exitBelow (last phase 0)
  movePool: string[];
  tempoScale: number;     // 1 = normal; 0.75 = 25% tighter windows
  enterLines?: string[];
}

export type BossMechanicId = "tutorial" | "spoof-pick" | "breach-meter" | "sequence-puzzle" | "devil-king";
export interface Reward { kind: "ability" | "key-fragment" | "castle-key"; id: string }

export interface BossDefinition {
  id: BossId; name: string; maxHealth: number; armored?: boolean;
  phases: BossPhase[]; weaknesses: string[];
  typingPrompts: string[]; corruptedPrompts?: { shown: string; correct: string }[];
  moves: BossMove[]; mechanic: BossMechanicId; rewards: Reward[];
  intro: string[]; defeatLines: string[];
}

export interface ActiveEffects {
  attackBonus: number; firewallLayers: number; focusChips: number;
  parryModules: number; exploitInsight: boolean; defending: boolean;
  stance: boolean; analyzed: boolean; rootAccessCharges: number;
}

export interface PlayerCombat {
  health: number; maxHealth: number; attack: number;
  parryWindowMs: number; perfectParryMs: number; typingPower: number;
  improvedParry: boolean;
}

export type CombatTag = "player-turn" | "typing" | "telegraph" | "scripted" | "victory" | "defeat";

export interface MechanicState {
  breachMeter: number; breached: boolean;
  bossTurns: number; exposed: boolean;
  seqIndex: number; finalStep: number; summons: number;
}

export interface CombatState {
  def: BossDefinition; tag: CombatTag; turn: number;
  bossHealth: number; phaseIndex: number;
  player: PlayerCombat; items: BuffId[]; fx: ActiveEffects;
  ultimate: number; pendingMoveId: string | null;
  prompt: { text: string; display: string; timeLimitMs: number } | null;
  log: string[]; weaknessesRevealed: number;
  rng: number; assistScale: number;
  outcome: "ongoing" | "victory" | "defeat";
}

export type PlayerActionKind = "attack" | "command" | "defend" | "parry-stance" | "analyze";
export type CombatEvent =
  | { type: "action"; kind: PlayerActionKind }
  | { type: "item"; buff: BuffId }
  | { type: "mechanic"; choice: string }
  | { type: "typing-result"; grade: TypingGrade }
  | { type: "defense-result"; parry?: ParryGrade; qteSuccess?: boolean };
```

  - `buffs.ts`: `applyItem(fx: ActiveEffects, player: PlayerCombat, buff: BuffId): { fx: ActiveEffects; player: PlayerCombat; log: string }` (pure; recovery-packet +3 hp capped; attack-byte fx.attackBonus+1; firewall-layer +1 cap 2; focus-chip +1 cap 2; parry-module +1 cap 3; root-access +1 charge; exploit-insight analyzed=true+exploitInsight=true; cache-boost = no combat effect, log "already active"), and `COMBAT_USABLE: BuffId[]` (everything except cache-boost).
  - `assist.ts`: `assistLevelFor(deaths: number): 0|1|2|3` (0–1→0, 2–3→1, 4–5→2, 6+→3); `assistTimeScale(level): 1|1.25|1.5|1.75`; `assistStartHeal(level): 0|0|2|2`; `assistShowsHint(level): boolean` (level 3).

- [ ] **Step 1: Failing tests** — `buffs.test.ts`: recovery-packet heals 3 capped at max; attack-byte stacks; firewall caps at 2; focus caps at 2; parry caps at 3; root-access adds charge; exploit sets analyzed. `assist.test.ts`: thresholds `(0→0, 2→1, 4→2, 6→3, 9→3)`, scales `(0→1, 3→1.75)`, heal `(1→0, 2→2)`, hint only at 3. Write the obvious assertions in the same style as Tasks 9–10.

- [ ] **Step 2: Verify failure → Step 3: implement (pure functions matching the signatures) → Step 4: pass**

Run: `npx vitest run features/adventure/combat && npx tsc --noEmit` → all pass.

- [ ] **Step 5: Commit**

```bash
git add features/adventure/combat
git commit -m "feat(adventure): combat types, item buffs, quiet assist curve"
```

---

### Task 12: Combat engine reducer

**Files:**
- Create: `features/adventure/combat/rng.ts`
- Create: `features/adventure/combat/engine.ts` + `engine.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 9–11.
- Produces:
  - `createCombat(def: BossDefinition, carry: { levelBuffs: BuffId[]; deathsOnBoss: number; abilities: { improvedParry: boolean }; maxHealth: number; attack: number; parryWindowMs: number; perfectParryMs: number; typingPower: number }): CombatState` — levelBuffs split per spec ("enter the boss using buffs collected"): passives (`attack-byte`, `firewall-layer`, `focus-chip`, `parry-module`, `exploit-insight`) AUTO-APPLY via `applyItem` at creation; consumables (`recovery-packet`, `root-access`) land in `items`; `cache-boost` is ignored (level-only). Also applies assist heal.
  - `reduce(state: CombatState, event: CombatEvent): CombatState` — pure; illegal events in a tag are no-ops returning same state.
  - Helpers used by UI/controller: `currentPhase(state): BossPhase`, `pendingMove(state): BossMove | null`, `defenseSpecFor(state): QteSpec` (move.qte scaled by tempo/assist/modules, or parry window from player stats + stance + modules + improvedParry ×1.25), `playerAttackDamage(state): number`, `isUltimateReady(state): boolean` (≥100).

Damage rules (locked):
- ATTACK: `dmg = player.attack + fx.attackBonus`; ×2 consume `exposed`; ×3 + ignore armor + reset meter when ultimate ≥ 100; armored & !breached & !ultimate → dmg = 1. Root-access mechanic choice `use-root-access`: `dmg = (attack + bonus) * 2` ignoring armor, consumes charge.
- COMMAND: dmg = `round((attack + bonus) * TYPING_DAMAGE_MULT[grade] * typingPower)`, min 1; armored halves (min 1) unless breached.
- Boss hit: `dmg = move.damage` → parry perfect 0 / normal `ceil(*0.25)` / miss full → if `fx.defending` (consume) halve (`ceil`) → minus `firewallLayers` (floor 0). Counters: perfect = `attack + bonus` (+ultimate 34), normal = `ceil((attack+bonus)/2)` (+15). QTE success: 0 damage, reflect 1, +25 ultimate. QTE fail/no-defense: full path above.
- `breach-meter`: parry ≥ normal → `breachMeter+1`; at 3 → `breached=true`, log "ARMOR BREACHED".
- `spoof-pick`: every 3rd boss turn (`bossTurns % 3 === 2`) boss uses its `choice` move; success sets `exposed=true`.
- `sequence-puzzle`: expected order `["analyze","defend","remember","create"]` — analyze/defend arrive as `action` events, remember/create as `mechanic`; correct → `seqIndex+1` + 12 damage + log clue; wrong step → `seqIndex=0` + log. Boss takes only 1 from ATTACK (armored).
- `devil-king`: phases `[{exitBelow:0.6},{exitBelow:0.2},{exitBelow:0}]`; entering index 2 clamps health at `ceil(0.2*max)`, sets tag `"scripted"`, `finalStep=0`; scripted steps `["analyze","parry","command","root-access","strike"]`; wrong/failed step → `player.health-2` (defeat if ≤0), `finalStep=0`; `strike` (mechanic `final-strike`, only offered at step 4) → outcome victory. Phase-3 root-access step auto-grants a charge if `rootAccessCharges === 0`. Summons: moves with `summons` add to `mechanic.summons` (each active summon +1 boss damage, cap +2); mechanic choice `strike-adds` (offered when summons>0) kills one, 60% chance to add `recovery-packet` to items (rng).
- Victory at bossHealth ≤ 0 (non-devil) → tag "victory". Player ≤ 0 anywhere → "defeat".

- [ ] **Step 1: Write the failing engine tests** — `engine.test.ts` (write exactly; extend freely):

```ts
import { describe, it, expect } from "vitest";
import { createCombat, reduce } from "./engine";
import type { BossDefinition, CombatState, CombatEvent } from "./types";

const TEST_BOSS: BossDefinition = {
  id: "glitch-toad", name: "Test Toad", maxHealth: 20,
  phases: [
    { exitBelow: 0.5, movePool: ["slam"], tempoScale: 1 },
    { exitBelow: 0, movePool: ["slam"], tempoScale: 0.75, enterLines: ["!"] },
  ],
  weaknesses: ["w1"], typingPrompts: ["scan"],
  moves: [{ id: "slam", name: "Slam", damage: 2, parryable: true, telegraph: "raises" }],
  mechanic: "tutorial", rewards: [], intro: [], defeatLines: [],
};

const carry = {
  levelBuffs: [], deathsOnBoss: 0,
  abilities: { improvedParry: false },
  maxHealth: 6, attack: 2, parryWindowMs: 220, perfectParryMs: 90, typingPower: 1,
};

const run = (s: CombatState, ...evs: CombatEvent[]) => evs.reduce(reduce, s);

describe("combat engine", () => {
  it("attack damages boss then boss telegraphs", () => {
    let s = createCombat(TEST_BOSS, carry);
    s = reduce(s, { type: "action", kind: "attack" });
    expect(s.bossHealth).toBe(18);
    expect(s.tag).toBe("telegraph");
    expect(s.pendingMoveId).toBe("slam");
  });

  it("perfect parry: no damage, counter, ultimate gain", () => {
    let s = createCombat(TEST_BOSS, carry);
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
    expect(s.player.health).toBe(6);
    expect(s.bossHealth).toBe(16); // 18 - counter 2
    expect(s.ultimate).toBe(34);
    expect(s.tag).toBe("player-turn");
  });

  it("miss takes full damage; defend halves; firewall subtracts", () => {
    let s = createCombat(TEST_BOSS, { ...carry, levelBuffs: ["firewall-layer"] });
    s = run(s, { type: "action", kind: "defend" }, { type: "defense-result", parry: "miss" });
    // 2 dmg -> defend ceil(1) -> firewall 1 -> 0
    expect(s.player.health).toBe(6);
  });

  it("typing grades scale command damage", () => {
    let s = createCombat(TEST_BOSS, carry);
    s = reduce(s, { type: "action", kind: "command" });
    expect(s.tag).toBe("typing");
    s = reduce(s, { type: "typing-result", grade: "perfect" });
    expect(s.bossHealth).toBe(16); // round(2 * 2)
  });

  it("phase transition fires at threshold", () => {
    let s = createCombat(TEST_BOSS, carry);
    // attack (2) + normal-parry counter (1) = 3 boss damage per round
    for (let i = 0; i < 4; i++)
      s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "normal" });
    expect(s.bossHealth).toBe(8);   // 20 - 12, ≤ 50%
    expect(s.phaseIndex).toBe(1);
    expect(s.outcome).toBe("ongoing");
  });

  it("recovery packet heals capped; illegal events are no-ops", () => {
    let s = createCombat(TEST_BOSS, { ...carry, levelBuffs: ["recovery-packet"] });
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "miss" }); // hp 4
    const before = s;
    s = reduce(s, { type: "defense-result", parry: "perfect" }); // wrong tag
    expect(s).toBe(before);
    s = reduce(s, { type: "item", buff: "recovery-packet" });
    expect(s.player.health).toBe(6);
  });

  it("armored boss: normal attack deals flat 1", () => {
    const armored: BossDefinition = { ...TEST_BOSS, armored: true, mechanic: "breach-meter" };
    let s = createCombat(armored, carry);
    s = reduce(s, { type: "action", kind: "attack" });
    expect(s.bossHealth).toBe(19);
  });

  it("three perfect parries charge ultimate; next attack triples and resets it", () => {
    let s = createCombat(TEST_BOSS, carry);
    for (let i = 0; i < 3; i++)
      s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "perfect" });
    expect(s.ultimate).toBeGreaterThanOrEqual(100); // 34 * 3
    const hp = s.bossHealth;
    s = reduce(s, { type: "action", kind: "attack" });
    expect(hp - s.bossHealth).toBe(6); // (attack 2) * 3
    expect(s.ultimate).toBe(0);
  });

  it("same seed = same fight", () => {
    const a = run(createCombat(TEST_BOSS, carry), { type: "action", kind: "command" });
    const b = run(createCombat(TEST_BOSS, carry), { type: "action", kind: "command" });
    expect(a.prompt).toEqual(b.prompt);
  });

  it("defeat when player health reaches 0", () => {
    let s = createCombat(TEST_BOSS, { ...carry, maxHealth: 2 });
    s = run(s, { type: "action", kind: "attack" }, { type: "defense-result", parry: "miss" });
    expect(s.outcome).toBe("defeat");
    expect(s.tag).toBe("defeat");
  });
});
```

- [ ] **Step 2: Verify failure** — `npx vitest run features/adventure/combat/engine.test.ts` → FAIL.

- [ ] **Step 3: Implement `rng.ts` + `engine.ts`**

`rng.ts`:

```ts
/** mulberry32 step: returns [value in [0,1), nextSeed] */
export function nextRand(seed: number): [number, number] {
  const t = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, t];
}
```

`engine.ts` — implement `createCombat` + `reduce` as one pure module following the locked damage rules. Shape (fill in the rule bodies exactly as specified in the Interfaces block):

```ts
import { nextRand } from "./rng";
import { TYPING_DAMAGE_MULT, typingTimeLimitMs } from "./typing";
import { applyItem, COMBAT_USABLE } from "./buffs";
import { assistLevelFor, assistTimeScale, assistStartHeal } from "./assist";
import { scaleQte } from "./timedEvents";
import type { /* all combat types */ } from "./types";

const SEQ_ORDER = ["analyze", "defend", "remember", "create"] as const;
const FINAL_ORDER = ["analyze", "parry", "command", "root-access", "strike"] as const;

export function createCombat(def, carry): CombatState { /* per Interfaces */ }

export function reduce(state: CombatState, event: CombatEvent): CombatState {
  switch (state.tag) {
    case "player-turn": return event.type === "action" || event.type === "item" || event.type === "mechanic"
      ? playerTurn(state, event) : state;
    case "typing": return event.type === "typing-result" ? resolveCommand(state, event.grade) : state;
    case "telegraph": return event.type === "defense-result" ? resolveDefense(state, event) : state;
    case "scripted": return scripted(state, event);
    default: return state;
  }
}
// playerTurn / resolveCommand / resolveDefense / bossTelegraph / phaseCheck / scripted
// are private pure functions ~30 lines each implementing the locked rules.
// bossTelegraph picks the move: [r, rng2] = nextRand(state.rng); pool = currentPhase.movePool;
// spoof-pick override on every 3rd boss turn; stronger moves are gated purely by phase movePools.
```

Implementation notes (binding):
- Never mutate; always return new objects (`{ ...state, ... }`).
- `createCombat` seeds `rng: 1337`, pushes `carry.levelBuffs` into `items` (cache-boost filtered out), applies `assistStartHeal`, sets `assistScale = assistTimeScale(assistLevelFor(deaths))`, `exploit-insight` in levelBuffs → `fx.analyzed = true` immediately + consume.
- `command` action picks the prompt with `nextRand` from `typingPrompts` (devil-king phase≥1 uses `corruptedPrompts`: `display` = corrupted `shown`, `text` = `correct`), `timeLimitMs = typingTimeLimitMs(4000, fx.focusChips, assistScale)` (final scripted command uses 8000 base).
- After every boss-health change run `phaseCheck` (advance `phaseIndex` while fraction ≤ exitBelow of current phase; devil-king entering last phase → scripted clamp).
- All state changes append human-readable `log` lines (UI renders the last 6).

- [ ] **Step 4: Run tests until green** — `npx vitest run features/adventure/combat` → all pass. Also `npx tsc --noEmit`.

- [ ] **Step 5: Commit**

```bash
git add features/adventure/combat
git commit -m "feat(adventure): pure turn-based combat engine with phases and mechanics"
```

---

### Task 13: Combat controller, React combat UI, backdrop scene

**Files:**
- Create: `features/adventure/combat/controller.ts`
- Create: `features/adventure/ui/CombatPanel.tsx`, `ui/TypingBox.tsx`, `ui/TimedPrompt.tsx`, `ui/BuffTray.tsx`, `ui/Bars.tsx`
- Create: `features/adventure/scenes/CombatBackdropScene.ts`
- Modify: `bridge/GameStore.ts` (add `combat: CombatState | null`, `deaths: Partial<Record<BossId, number>>`), `bridge/EventBus.ts` (combat events), `game.ts` (append scene), `PlatformLevelScene.ts` (door → start combat), `ui/Overlay.tsx` (mount CombatPanel when combat active)

**Interfaces:**
- Consumes: engine, timedEvents, typing, audio, sprites.
- Produces:
  - `startCombat(bossId: BossId, opts: { levelId: LevelId; returnTo: "level" | "castle" })` — builds carry from save + levelBuffs, stores CombatState, launches `CombatBackdrop`, pauses Level scene.
  - `dispatchCombat(event: CombatEvent)` — reduces, publishes to store, emits side-effect events: `"combat:telegraph" { moveId, spec: QteSpec, impactInMs }`, `"combat:fx" { kind: "player-hit" | "boss-hit" | "parry" | "crit" | "breach" | "phase" | "summon" }`, `"combat:over" { outcome, bossId }`.
  - Telegraph timing contract: controller emits `combat:telegraph` with `impactInMs = 1400 * tempoScale * assistScale`; UI must deliver `defense-result` by then; controller runs a timeout that force-dispatches a miss/fail if the UI never answers.
  - `CombatPanel` renders from `store.combat`: boss/player `Bars` (pixel-styled HP + Ultimate meter), action grid, `TypingBox` (input + shrinking timer bar; autofocus; Enter submits; on mobile the input focus summons the keyboard), `TimedPrompt` (parry flash ring on `combat:telegraph` — Space keydown or pointerdown anywhere on the prompt area = press; marker bar with moving pip; choice buttons), `BuffTray` (items grid using `COMBAT_USABLE` filter), log lines, mechanic buttons (REMEMBER/CREATE, STRIKE ADDS, USE ROOT ACCESS, EXECUTE FINAL STRIKE) when the engine's tag/mechanic allows.
  - `CombatBackdropScene`: arena background per boss theme, boss sprite (idle anim; `combat:fx` triggers hurt flash/lunge/phase shake), player combat sprite (attack/parry/hurt anims), particle bursts on crit/parry.

- [ ] **Step 1: Controller** — implement with explicit handling: on `combat:over` victory → grant rewards (Task 14 wires), stop backdrop, resume/complete level; defeat → increment `deaths[bossId]` in save (Task 15 persists), show retry panel (button "RETRY" → `startCombat` again with same opts — assist recomputed; player back at boss door with `levelBuffs` restored from store snapshot).
- [ ] **Step 2: UI components** — Tailwind, monospace, violet-glow borders (`border-violet-300/40`, `shadow-[0_0_20px_rgba(167,139,250,0.3)]`), red corruption accents for boss elements. Buttons ≥44px tall on touch. Typing timer = width-animated div (no rAF in React; CSS transition from 100%→0 over `timeLimitMs`, linear).
- [ ] **Step 3: Backdrop scene** — boss placeholder rect sprites are FORBIDDEN: use `art/sprites/bosses.ts` entries as they land; until a boss's sprite exists its task cannot ship (Glitch Toad sprite arrives with Task 14).
- [ ] **Step 4: Door wiring** — `PlatformLevelScene.tryInteract()` at door: `this.scene.pause()`, `startCombat(bossId, { levelId, returnTo: "level" })`.
- [ ] **Step 5: Verify** — `npx tsc --noEmit && npm test` pass (engine tests unaffected). Manual: cannot fully verify until Task 14 provides a real boss — acceptable; commit compiles-and-tests-green.

```bash
git add features/adventure
git commit -m "feat(adventure): combat controller, React combat UI, backdrop scene"
```

---

### Task 14: Glitch Toad — first full boss loop

**Files:**
- Create: `features/adventure/bosses/glitchToad.ts`
- Create: `features/adventure/art/sprites/bosses.ts` (Glitch Toad 48×64: bloated toad-beetle, `G/g` mushroom-cap back, `R/r` glitch patches, `X` maw; anims idle 2f, attack 2f, hurt 1f, defeat 3f dissolve)
- Create: `features/adventure/bosses/index.ts` (`BOSSES: Partial<Record<BossId, BossDefinition>>`)
- Modify: `combat/controller.ts` (reward granting), `bridge/GameStore.ts` (abilities in hud)

**Interfaces:**
- Consumes: BossDefinition, controller.
- Produces: `BOSSES` registry; reward flow: `"combat:over"` victory → apply `rewards` (`ability:dash` → save.abilities.dash = true; `key-fragment:bronze` → save.keyFragments push) via Task 15's save module (until Task 15 lands, stash on `gameStore` — replaced next task), then `"level:complete"`.

- [ ] **Step 1: Definition (verbatim)**

```ts
import type { BossDefinition } from "../combat/types";

export const GLITCH_TOAD: BossDefinition = {
  id: "glitch-toad",
  name: "The Glitch Toad",
  maxHealth: 30,
  phases: [
    { exitBelow: 0.5, movePool: ["hop", "lick"], tempoScale: 1 },
    { exitBelow: 0, movePool: ["hop", "lick", "swarm"], tempoScale: 0.9,
      enterLines: ["The Toad croaks in corrupted hex!"] },
  ],
  weaknesses: ["Clean code disgusts it — typed COMMANDs hit hard.", "Its hop is slow. Parry when it flashes."],
  typingPrompts: ["scan", "patch", "block", "debug"],
  moves: [
    { id: "hop", name: "Glitch Hop", damage: 2, parryable: true, telegraph: "The Toad crouches, flashing red…" },
    { id: "lick", name: "Data Lick", damage: 1, parryable: true, telegraph: "A corrupted tongue coils back…" },
    { id: "swarm", name: "Bug Swarm", damage: 1, parryable: false, summons: 1,
      qte: { kind: "choice", promptText: "A swarm incoming — what do you do?", options: ["SWAT BUGS", "PET BUGS", "EAT BUGS"], correctIndex: 0, timeLimitMs: 2500 },
      telegraph: "Buglings pour from its back…" },
  ],
  mechanic: "tutorial",
  rewards: [{ kind: "ability", id: "dash" }, { kind: "key-fragment", id: "bronze" }],
  intro: [
    "GLITCH TOAD: ribbit.exe has encountered a problem.",
    "GLITCH TOAD: You. Small developer. This field is MY heap now.",
    "Type commands. Parry the flash. You've got this.",
  ],
  defeatLines: [
    "GLITCH TOAD: segmentation fault (core dumped)…",
    "The Bronze Key Fragment materializes!",
    "New ability: DASH (Shift). The Toad's speed is yours.",
  ],
};
```

- [ ] **Step 2: Tutorial mechanic** — in `CombatPanel`, when `def.mechanic === "tutorial"` and `turn === 0`, show contextual hint chips above the menu ("COMMAND starts a typing attack", "PARRY STANCE widens your parry window"); first telegraph gets an enlarged "PRESS SPACE ON THE FLASH" callout. No engine changes.
- [ ] **Step 3: Reward flow** — controller victory handler applies rewards, plays `victory` track, shows victory panel (rewards listed, "RETURN TO THE FIELDS" button) → `"level:complete"` → Level scene resumes briefly at door → (Task 16 sends to Overworld; for now, log line).
- [ ] **Step 4: Verify (first full manual loop)** — dev `/adventure`: walk 1-1 → door E → Toad intro dialogue → attack/command/parry/defend/analyze/items all function; QTE choice works; phase 2 tightens at half health; victory grants dash (Shift now dashes when replaying the level!) — and defeat path: die on purpose → RETRY puts you at the door with buffs.
- [ ] **Step 5: Commit**

```bash
git add features/adventure
git commit -m "feat(adventure): Glitch Toad boss — first complete level loop"
```

---

# Phase 4 — Structure

### Task 15: Save system + settings

**Files:**
- Create: `features/adventure/state/save.ts` + `save.test.ts`
- Create: `features/adventure/state/settings.ts` (thin: settings live inside the save)
- Modify: `combat/controller.ts`, `PlatformLevelScene.ts`, `scenes/BootScene.ts` (replace all interim stashes with real save calls)

**Interfaces:**
- Produces (locked):

```ts
export interface AdventureSave {
  version: 1;
  unlocked: LevelId[]; completed: LevelId[];
  abilities: { dash: boolean; analyze: boolean; improvedParry: boolean };
  keyFragments: KeyFragment[]; castleKey: boolean;
  memoryFragments: LevelId[];
  bossesDefeated: BossId[];
  deaths: Partial<Record<BossId, number>>;
  gameCompleted: boolean; codeReceived: boolean;
  settings: {
    volume: number; muted: boolean;
    accessibility: { widerParry: boolean; slowerTyping: boolean; reduceFlash: boolean; noShake: boolean };
  };
}
export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void }
export function defaultSave(): AdventureSave;               // unlocked ["1-1"], everything else empty/false
export function loadSave(storage?: StorageLike): AdventureSave;   // safe-parse; bad/missing → defaults; unknown version → defaults
export function persistSave(save: AdventureSave, storage?: StorageLike): void;
export const UNLOCK_NEXT: Partial<Record<LevelId, LevelId>>; // 1-1→1-2→1-3→1-4→castle
export function completeLevel(save: AdventureSave, id: LevelId): AdventureSave;  // pure: dedupe-complete + unlock next
export function grantReward(save: AdventureSave, r: Reward): AdventureSave;      // ability/fragment/castle-key; 3 fragments -> castleKey auto
```

- [ ] **Step 1: Failing tests** — cover: defaults; roundtrip persist/load with a Map-backed fake storage; corrupt JSON → defaults; `completeLevel("1-1")` unlocks `1-2` and is idempotent; `completeLevel("1-4")` unlocks castle; `grantReward` sets abilities, accumulates fragments without dupes, third fragment sets `castleKey`; version mismatch → defaults. (Write assertions in the established style.)
- [ ] **Step 2: FAIL run → Step 3: implement → Step 4: green** — `npx vitest run features/adventure/state`.
- [ ] **Step 5: Replace interim stashes** — controller reads/writes deaths + bossesDefeated + rewards through save; scene reads abilities; fragment pickup calls `persistSave` with `memoryFragments` updated; audio settings sync `audio.setVolume/state` on boot.
- [ ] **Step 6: Commit**

```bash
git add features/adventure
git commit -m "feat(adventure): versioned localStorage save with unlock chain"
```

---

### Task 16: Title + Overworld scenes

**Files:**
- Create: `features/adventure/scenes/TitleScene.ts`, `features/adventure/scenes/OverworldScene.ts`
- Create: `features/adventure/art/sprites/overworld.ts` (map tiles: path dots, node discs 12×12 per world color, flag, gate, castle silhouette 64×48, map-player 12×16 chibi-Abrar walk 2f)
- Modify: `game.ts` (scene order: Boot → Title), `BootScene.ts` (→ Title), `Overlay.tsx` (title/overworld panels), `EventBus.ts` (`"overworld:select" { levelId }`)

**Interfaces:**
- Consumes: save, audio, sprites.
- Produces: Title (logo "ABRAR'S ADVENTURE / THE LOST KEY" in big pixel caps rendered from grid font sprites or styled text, "PRESS ANY KEY / TAP", `title` track; continues to Overworld). Overworld: five nodes on a winding path over a dark parallax map, per spec: locked nodes dim + gate icon, completed nodes flagged, castle always visible far right (dim until unlocked); map-player walks along path polyline between adjacent unlocked nodes (arrow keys/tap node), E/Enter on a node → `Level` start; after `gameCompleted`, castle node swaps to open-gate art and an extra "ARCHIVE" node appears → `bus.emit("nav:external", { href: "/gallery" })`; Overlay effect does `window.location.assign(href)`.

- [ ] **Step 1: Title scene** (music, input-once → Overworld; show "SAVE FOUND — CONTINUE" vs "NEW GAME" if `completed.length > 0`, NEW GAME wipes via `persistSave(defaultSave())` after an overlay confirm dialog).
- [ ] **Step 2: Overworld scene** — node data locked:

```ts
const NODES: { id: LevelId | "archive"; x: number; y: number }[] = [
  { id: "1-1", x: 120, y: 380 }, { id: "1-2", x: 260, y: 300 },
  { id: "1-3", x: 420, y: 350 }, { id: "1-4", x: 580, y: 260 },
  { id: "castle", x: 760, y: 180 }, { id: "archive", x: 880, y: 120 },
];
```

Walking: tween along the segment at 90 px/s with walk anim; selection state in scene; `level:complete` event → return here (`this.scene.start("Overworld")` from controller victory panel), completed flag pops with `collect` sfx.
- [ ] **Step 3: Level flow rewire** — victory panel button label becomes "RETURN TO THE MAP"; defeat retry unchanged. BootScene → Title always; Overworld reads save for locks.
- [ ] **Step 4: Verify** — full loop: Title → Overworld (only 1-1 lit) → beat 1-1 → back at Overworld with flag + 1-2 unlocked + dash persisting across reload (localStorage). Replay 1-1 works.
- [ ] **Step 5: Commit**

```bash
git add features/adventure
git commit -m "feat(adventure): title screen and overworld with unlock progression"
```

---

### Task 17: Dialogue system + scripts

**Files:**
- Create: `features/adventure/dialogue/scripts.ts`, `features/adventure/dialogue/Dialogue.tsx`
- Modify: `Overlay.tsx`, `EventBus.ts` (`"dialogue:open" { id }`, `"dialogue:closed" { id }`), `PlatformLevelScene.ts` (level intro on first entry + fragment notes), `combat/controller.ts` (boss intro/defeat via dialogue), `bridge/GameStore.ts` (`dialogue: { id: string; lines: string[] } | null`)

**Interfaces:**
- Produces: `SCRIPTS: Record<string, string[]>` — ids: `intro-1-1`…`intro-castle`, `frag-1-1`…`frag-1-4`, `boss-intro-*`, `boss-defeat-*` (5 each), `devil-defeat` (Appendix A text verbatim), `chest-reveal`, `blank-page-clues`. Memory fragment notes (complete, use these):
  - `frag-1-1`: "First bug I ever fixed took me six hours. It was a semicolon. NetWraith watches millions of packets now — same person, better tools."
  - `frag-1-2`: "Phishing works because it looks legit. So does self-doubt. Verify the source on both."
  - `frag-1-3`: "TripWire fires in under 60 seconds. Discipline is just automation for humans."
  - `frag-1-4`: "There's a manga chapter I never drew. This game exists because blank pages lose if you start anyway."
- `Dialogue.tsx`: bottom-anchored panel, typewriter 30 chars/s (tap/E/Space = complete line, next = advance, SKIP button top-right), emits `dialogue:closed`; scenes pause while open (`gameStore.paused`).

- [ ] Implement, verify (1-1 intro plays once per save; fragment E shows its note; Toad intro/defeat run through the same panel), then commit:

```bash
git add features/adventure
git commit -m "feat(adventure): dialogue system with typewriter + script data"
```

---

# Phase 5 — Worlds 1-2, 1-3, 1-4

### Task 18: Malware Bat + Phishing Harbor (1-2) + Captain Spoof

**Files:**
- Create: `features/adventure/enemies/MalwareBat.ts`, `features/adventure/levels/level-1-2.ts`, `features/adventure/bosses/captainSpoof.ts`
- Create: `features/adventure/art/sprites/enemies2.ts` (bat 16×16 flap 2f + dive 1f: `U/v` wing membrane, `R` eye), `art/sprites/tiles-harbor.ts` (dock planks `p/h`, code-water animated 2f `B/b/N`, fake-platform `Y` shimmer variant, boat 32×16), boss sprite in `bosses.ts` (Captain Spoof 48×64: tricorne hat `K`, `Y` hook, coat `t/T`, smug grin)
- Modify: `levels/index.ts`, `bosses/index.ts`, `PlatformLevelScene.ts` (fake platforms + moving boats), `enemies/Enemy.ts` if needed

**Interfaces:**
- Consumes: Enemy base, level parser (legend chars `~` NOT added — fake platforms/boats are authored via new legend chars below).
- Produces: legend additions (locked, parser update + tests): `F` fake platform (16×8, flickers when player within 24px, vanishes 300ms after being stood on, respawns after 2s) · `o` boat spawn (32×16 platform tweening ±64px horizontally, 1.5s each way) — extend `ParsedLevel` with `fakes: Pt[]; boats: Pt[]` and `parse.test.ts` accordingly.

- [ ] **Step 1: Parser first (TDD)** — add `F`/`o` legend tests, watch fail, implement, green.
- [ ] **Step 2: MalwareBat** — no gravity; sine patrol (vertical ±24 or diagonal); every 2.5s fires a corrupted packet (4×4 `R` projectile, speed 90, pooled group, despawn on wall/2s); if player within 90px horizontally → dive at 200 px/s toward player's position-at-decision, then 1s recovery hover ("vulnerable after missing" — stompable + attackable always, but during recovery `touchDamage = 0`).
- [ ] **Step 3: Level 1-2 map** — author to schema, 16 rows × ~170 cols: dock planks over water (water rows = hazard `^` at sea level), two boat crossings, a fake-platform "shortcut" marked by a `Y` sign lure with the safe route below visible via `B` glow clues, bats over the second crossing, checkpoint mid, `M` fragment on a mast top reachable via boat-jump, door at lighthouse. Every gap crossable without dash (dash is QoL here, required nowhere before 1-3).
- [ ] **Step 4: Captain Spoof definition (verbatim)**

```ts
export const CAPTAIN_SPOOF: BossDefinition = {
  id: "captain-spoof", name: "Captain Spoof", maxHealth: 40,
  phases: [
    { exitBelow: 0.5, movePool: ["cutlass", "fake-login"], tempoScale: 1 },
    { exitBelow: 0, movePool: ["cutlass", "fake-login", "clone-volley"], tempoScale: 0.85,
      enterLines: ["CAPTAIN SPOOF: Ye've verified yer last source, matey!"] },
  ],
  weaknesses: ["His clones can't spell. VERIFY the real one.", "After a dodged fake-login he staggers — COMMAND hits crit-hard."],
  typingPrompts: ["verify source", "check headers", "report phish", "block sender"],
  moves: [
    { id: "cutlass", name: "Hook Cutlass", damage: 2, parryable: true, telegraph: "The Captain's hook glints…" },
    { id: "fake-login", name: "Fake Login Page", damage: 2, parryable: false,
      qte: { kind: "choice", promptText: "A login portal appears!", options: ["VERIFY SOURCE", "CLICK LINK", "SEND PASSWORD"], correctIndex: 0, timeLimitMs: 2200 },
      telegraph: "A shimmering portal unfurls…" },
    { id: "clone-volley", name: "Clone Volley", damage: 2, parryable: false,
      qte: { kind: "marker", travelMs: 1200, targetStart: 0.42, targetEnd: 0.58 },
      telegraph: "Three Captains draw three pistols…" },
  ],
  mechanic: "spoof-pick",
  rewards: [{ kind: "ability", id: "analyze" }, { kind: "key-fragment", id: "silver" }],
  intro: [
    "CAPTAIN SPOOF: Welcome aboard the S.S. Free-Gift-Card!",
    "CAPTAIN SPOOF: Just sign here, here, and… everywhere.",
  ],
  defeatLines: [
    "CAPTAIN SPOOF: Unsubscribe… me…",
    "The Silver Key Fragment washes ashore!",
    "New ability: ANALYZE (E near disguised foes, and in battle).",
  ],
};
```

Choice QTE success with `mechanic: "spoof-pick"` sets `exposed` (engine already handles ×2 next hit).
- [ ] **Step 5: Verify** — parser tests green; play 1-2 end-to-end: boats, fakes, bats, Spoof's three-button flash (wrong buttons hurt), victory grants analyze → phishlings now expose with E. Commit:

```bash
git add features/adventure
git commit -m "feat(adventure): phishing harbor — malware bats, fake platforms, Captain Spoof"
```

---

### Task 19: Brute + Knight + Slime + Firewall Factory (1-3) + The Warden

**Files:**
- Create: `enemies/BruteForceBrute.ts`, `enemies/FirewallKnight.ts`, `enemies/RootkitSlime.ts`, `levels/level-1-3.ts`, `bosses/warden.ts`
- Create: `art/sprites/enemies3.ts` (Brute 24×24 charge 2f + stun 1f `M/m` chassis; Knight 24×24 shield walk 2f + barrier 1f `D/d/B` tower shield; Slime 16×16 blob 2f + burrow 2f + split 8×8 `R/r` mini) `art/sprites/tiles-factory.ts` (plates `d/D`, conveyor 2f animated arrows, gate 16×32 2f, laser emitter + beam tile `R` 2f, molten `M/m` animated)
- Modify: `levels/parse.ts`+test (legend: `<`/`>` conveyors, `G` timed gate, `L` laser emitter, molten uses existing `^`), `levels/index.ts`, `bosses/index.ts`, `PlatformLevelScene.ts` (conveyor velocity add ±60; gates cycle 1.6s open/1.6s closed with solid body toggle; lasers cycle 1.2s on/0.8s off, beam overlap = 1 dmg, attack on emitter disables 4s), engine untouched

**Interfaces:**
- Consumes: everything existing.
- Produces: three enemy classes; behaviors locked: **Brute** hp 3, walks fast (70) toward player when on same platform, on wall hit → `stun` 2s (stompable/attackable ×2 damage taken, else armored front: frontal attack deals 0 unless stunned); his charge is parryable in-level: attack button timed within 150ms of contact negates damage + stuns (reuse `resolveParry` with impact = predicted contact). **Knight** hp 3, slow patrol, frontal attacks blocked (attack from behind or stomp), every 4s raises 16×32 firewall barrier for 1.5s (blocks player attacks/projectiles, not movement). **Slime** hp 2, burrows 1.5s (untargetable, leaves `^` corrupt tile behind for 3s), resurfaces near player; on death splits into two minis (hp 1, speed 60, no drops).

- [ ] **Step 1: Parser legend TDD** (`<`, `>`, `G`, `L` → `ParsedLevel.conveyors/gates/lasers` arrays), fail → implement → green.
- [ ] **Step 2: Enemies** per locked behaviors.
- [ ] **Step 3: Level 1-3 map** — author to schema, 16 rows × ~180 cols: conveyor gauntlet over molten rows, two timed-gate locks, a crusher corridor (crushers = vertical tween rectangles, 2 dmg, authored in scene from gate positions marked `G` stacked), laser hall where dash (from 1-1 reward) shines, Knights guarding one-way ascents, checkpoint before a Brute double-charge arena, fragment behind a disable-able laser, door at the fortress gate.
- [ ] **Step 4: The Warden (verbatim)**

```ts
export const WARDEN: BossDefinition = {
  id: "warden", name: "The Warden", maxHealth: 55, armored: true,
  phases: [
    { exitBelow: 0.5, movePool: ["crush", "beam"], tempoScale: 1 },
    { exitBelow: 0, movePool: ["crush", "beam", "lockdown"], tempoScale: 0.8,
      enterLines: ["THE WARDEN: PERIMETER BREACH. ESCALATING."] },
  ],
  weaknesses: ["Armor absorbs blades. PARRY his strikes to fill the BREACH meter.",
               "Three clean parries and the wall comes down.",
               "Once breached, COMMAND and ULTIMATE hit full force."],
  typingPrompts: ["nmap", "deny", "allow", "encrypt", "sudo"],
  moves: [
    { id: "crush", name: "Gate Crush", damage: 3, parryable: true, telegraph: "The Warden's gauntlet rises…" },
    { id: "beam", name: "Deny Beam", damage: 2, parryable: false,
      qte: { kind: "marker", travelMs: 1100, targetStart: 0.45, targetEnd: 0.6 },
      telegraph: "A red scanline sweeps toward you…" },
    { id: "lockdown", name: "Full Lockdown", damage: 3, parryable: true, telegraph: "Every port slams shut…" },
  ],
  mechanic: "breach-meter",
  rewards: [{ kind: "ability", id: "improvedParry" }, { kind: "key-fragment", id: "gold" }],
  intro: ["THE WARDEN: STATE YOUR CREDENTIALS.", "THE WARDEN: …DENIED."],
  defeatLines: [
    "THE WARDEN: rule… deleted…",
    "The Gold Key Fragment clangs to the floor!",
    "Parry upgraded: wider window, brighter flash. You've earned it.",
  ],
};
```

UI: `CombatPanel` shows BREACH ▓▓░ pips when `mechanic === "breach-meter"`.
- [ ] **Step 5: Verify** — factory hazards all function; Brute wall-stun loop; Knight backstabs; Slime splits; Warden unbeatable-feeling until parries breach him, then melts; improvedParry visibly widens future windows. Commit:

```bash
git add features/adventure
git commit -m "feat(adventure): firewall factory — heavy enemies, hazard set, The Warden"
```

---

### Task 20: Corrupted Archive (1-4) + The Blank Page

**Files:**
- Create: `levels/level-1-4.ts`, `bosses/blankPage.ts`, `art/sprites/tiles-archive.ts` (shelf `p/P/h`, floating page 2f `W/c`, sepia parallax with unfinished manga-panel silhouettes, shadow-variant palette map), boss sprite (Blank Page 48×64: white humanoid `W/C` with ink-drip `O` edges, face appears only in defeat frames)
- Modify: `levels/index.ts`, `bosses/index.ts`, `PlatformLevelScene.ts` (shadow enemies: spawn chars reused with `theme === "archive"` → palette-swap tint 0x333333 + hp+1; disappearing platforms reuse `F`; rotating clusters: platform sets marked `R`? no — new legend `@` = rotator pivot: the 3 tiles right of pivot orbit 90° steps every 2s), `levels/parse.ts`+test (`@` legend)

**Interfaces:**
- Consumes: all existing systems; fragment count from save.
- Produces: `BLANK_PAGE` definition (verbatim):

```ts
export const BLANK_PAGE: BossDefinition = {
  id: "blank-page", name: "The Blank Page", maxHealth: 50, armored: true,
  phases: [{ exitBelow: 0, movePool: ["doubt", "erase", "silence"], tempoScale: 1 }],
  weaknesses: ["Swords don't work on emptiness. Understand it instead.",
               "It fears the order of making: see clearly, hold steady, recall, begin.",
               "ANALYZE → DEFEND → REMEMBER → CREATE."],
  typingPrompts: ["build", "learn", "create", "persist", "begin"],
  moves: [
    { id: "doubt", name: "Whisper of Doubt", damage: 2, parryable: true, telegraph: "The page ripples: 'why bother?'…" },
    { id: "erase", name: "Erase", damage: 2, parryable: false,
      qte: { kind: "type-word", word: "begin", timeLimitMs: 2600 }, telegraph: "White nothing reaches for your outline…" },
    { id: "silence", name: "Silence", damage: 1, parryable: true, telegraph: "Sound drains from the room…" },
  ],
  mechanic: "sequence-puzzle",
  rewards: [{ kind: "castle-key", id: "castle" }],
  intro: [
    "THE BLANK PAGE: I am every chapter you never started.",
    "THE BLANK PAGE: Strike me. See how little it matters.",
  ],
  defeatLines: [
    "THE BLANK PAGE: …oh. You began.",
    "The three fragments fuse — CASTLE KEY FORGED.",
    "The Devil King's gate is open. Finish this.",
  ],
};
```

Mechanic UI: menu adds REMEMBER and CREATE buttons (always visible this fight); each correct sequence step deals 12 + advances a 4-slot glyph tracker; wrong choice resets it with the line "The page swallows your effort. Start from seeing." If `save.memoryFragments.length >= 2`, ANALYZE also prints weakness #3 (the full order) immediately.
- [ ] **Steps:** parser `@` TDD → rotators/shadow spawns → level map (16×~150: rotating stacks, `F` page platforms, shadow buglings/bats/slimes, symbol mural background hinting the verb order, fragment high on a shelf, quiet pre-door corridor) → boss def + UI extras → verify full fight (sequence resets on wrong verb; attacks chip 1; victory forges castle key from 3 fragments via `grantReward`) → commit:

```bash
git add features/adventure
git commit -m "feat(adventure): corrupted archive and The Blank Page sequence boss"
```

---

# Phase 6 — Endgame

### Task 21: The Castle level

**Files:**
- Create: `levels/castle.ts`, `art/sprites/tiles-castle.ts` (black stone `O/K/k`, chain 8×16, banner 2f glitching `R/X`, demonic statue 16×32, lava `R/M` 2f, fireball 8×8, red-sky parallax with distant Devil King silhouette + storm flicker)
- Modify: `levels/index.ts` (tighten `LEVELS` to full `Record<LevelId, LevelDefinition>`), `PlatformLevelScene.ts` (castle hazards), `levels/parse.ts`+test (legend `!` fireball fountain, `~` collapsing bridge tile)

**Interfaces:**
- Produces: collapsing bridge (`~`): tile shakes 400ms after first touch then falls (body disabled, sprite tween down), respawns 3s; fireball fountain (`!`): lava spout launches an arcing fireball every 2.2s (gravity-affected, 1 dmg, pooled); rising corruption segment: between two marker columns the scene runs a red tide rising 12px/s while player is inside; touching it = 1 dmg + knock upward; stronger enemy variants = shadow rule from 1-4 (+1 hp, +10 speed) applied when `theme === "castle"`.

- [ ] **Steps:** parser TDD (`!`, `~`) → hazards → castle map (16×~200: gate → chain climb (one-ways) → fireball bridge over lava → collapsing-bridge sprint → rising-corruption shaft → strong Knight+Brute gauntlet → FINAL CHECKPOINT → long staircase (ascending solids) → throne door `D`) → `castle` music wired → verify (castle ~3–4 min, recoverable mistakes, checkpoint before door) → commit:

```bash
git add features/adventure
git commit -m "feat(adventure): the Devil King's castle gauntlet"
```

---

### Task 22: Devil King phases 1–2

**Files:**
- Create: `bosses/devilKing.ts`; Devil King sprite in `art/sprites/bosses.ts` (80×96: horned crown burning `R/M/Y`, black-crimson armor `O/K/X/r`, code-cape `X` with `R` glyph flecks, stolen `Y` key on chain at neck, greatsword; anims idle 2f, slash 2f, cast 2f, hurt 1f, kneel 2f, dissolve 4f)
- Modify: `bosses/index.ts`, `CombatBackdropScene.ts` (throne arena; phase 2 arena-crack overlay + `devil-2` track swap on `combat:fx` phase event)

**Interfaces:**
- Produces (verbatim):

```ts
export const DEVIL_KING: BossDefinition = {
  id: "devil-king", name: "The Devil King", maxHealth: 90,
  phases: [
    { exitBelow: 0.6, movePool: ["sword", "fire", "wave", "summon"], tempoScale: 1 },
    { exitBelow: 0.2, movePool: ["sword", "fire", "wave", "summon", "flurry"], tempoScale: 0.7,
      enterLines: ["The throne room SHATTERS. The Devil King descends into the breach.",
                   "DEVIL KING: You patch. I corrupt. Let us see which is faster."] },
    { exitBelow: 0, movePool: [], tempoScale: 0.6,
      enterLines: ["DEVIL KING: ENOUGH. I will delete the whole chapter — and you with it."] },
  ],
  weaknesses: ["His flurry always follows a missed fire volley.",
               "Corrupted commands must be TYPED CORRECTLY — fix the typo.",
               "When he charges the final attack, remember everything you've learned."],
  typingPrompts: ["scan target", "deploy patch", "enable firewall", "verify identity",
                  "encrypt memory", "restore system", "remove malware"],
  corruptedPrompts: [
    { shown: "encrpyt memory", correct: "encrypt memory" },
    { shown: "restoer system", correct: "restore system" },
    { shown: "remvoe malware", correct: "remove malware" },
    { shown: "vrify identity", correct: "verify identity" },
  ],
  moves: [
    { id: "sword", name: "Ruin Cleave", damage: 3, parryable: true, telegraph: "The greatsword drinks the light…" },
    { id: "fire", name: "Hellfire Volley", damage: 2, parryable: false,
      qte: { kind: "marker", travelMs: 1000, targetStart: 0.45, targetEnd: 0.6 }, telegraph: "Three cinders orbit his crown…" },
    { id: "wave", name: "Corruption Wave", damage: 2, parryable: false,
      qte: { kind: "type-word", word: "BLOCK", timeLimitMs: 2200 }, telegraph: "A wall of red static builds…" },
    { id: "summon", name: "Court of Bugs", damage: 1, parryable: false, summons: 2,
      qte: { kind: "choice", promptText: "Buglings swarm the arena!", options: ["HOLD THE LINE", "CHASE THEM", "IGNORE THEM"], correctIndex: 0, timeLimitMs: 2400 },
      telegraph: "He snaps his gauntleted fingers…" },
    { id: "flurry", name: "Kingslayer Flurry", damage: 3, parryable: true, telegraph: "He vanishes — reappears mid-swing!" },
  ],
  mechanic: "devil-king",
  rewards: [],
  intro: [
    "DEVIL KING: The archivist himself. I wondered when you'd crawl up my stairs.",
    "DEVIL KING: Your chapter was DELIGHTFUL to steal.",
    "DEVIL KING: Come, then. Show me your security posture.",
  ],
  defeatLines: [], // Task 23 drives the scripted defeat via dialogue "devil-defeat"
};
```

- [ ] **Steps:** definition + sprite → phase-2 presentation (arena crack, track `devil-2`, tighter windows come free via tempoScale; corruptedPrompts auto-engage phase ≥ 1 per engine) → engine tests extended: corrupted prompt selection in phase 2, summons cap +2 boss damage, `strike-adds` grants recovery-packet at favorable rng, clamp into scripted at ≤20% → verify manually with `?debug=1` boss jump (Task 29 not yet built — use overworld progression or temporarily set save) → commit:

```bash
git add features/adventure
git commit -m "feat(adventure): Devil King phases one and two"
```

---

### Task 23: Final Command sequence + VictoryScene (key walk)

**Files:**
- Create: `features/adventure/scenes/VictoryScene.ts`
- Modify: `combat/engine.ts`+tests (scripted step machine already landed in Task 12 — extend tests to full-run the sequence), `ui/CombatPanel.tsx` (scripted UI), `combat/controller.ts` (devil victory → VictoryScene), `game.ts`, `dialogue/scripts.ts` (`devil-defeat` verbatim lines below)

**Interfaces:**
- Produces:
  - Scripted UI: instruction banner per `finalStep` — 0 "ANALYZE HIS PATTERN" (only ANALYZE enabled) → 1 "PARRY THE DECREE" (auto-telegraph, tightened parry) → 2 big typing box `sudo restore the lost chapter` (8s base) → 3 "USE ROOT ACCESS" button → 4 the oversized red **EXECUTE FINAL STRIKE** button (fills a third of the panel, pulses). Failure feedback: screen dim + "The King laughs. Again." + health −2, back to step 0.
  - `devil-defeat` script (verbatim, from spec Appendix A): "So... you actually made it." / "I thought the bugs would stop you. I thought the false paths would fool you. I thought the Blank Page would make you turn back." / "But you kept moving." / "My final message..." / "The code is..." / "No." / "You do not get it from me." / "Take the key." / "Open the chest yourself."
  - `VictoryScene`: throne room; kneeling King (kneel anim) → dialogue → dissolve into red pixel particles → `Y` key drops with bounce + glow; player regains control (walk only + E); E on key → banner `ARCHIVE KEY ACQUIRED` + `collect` sfx → back-wall door tiles slide open → walking through the right edge starts `Chest` scene. Save: `bossesDefeated += devil-king`.

- [ ] **Steps:** engine sequence tests (perfect run → victory; failed parry at step 1 → health−2 + reset; incorrect final typing → reset; root-access auto-grant) → scripted UI → VictoryScene cinematic → verify: full castle→devil→key walk without input deadlocks (control returns exactly after dialogue) → commit:

```bash
git add features/adventure
git commit -m "feat(adventure): final command sequence and the key-walk victory scene"
```

---

### Task 24: ChestScene + codeService + code reveal

**Files:**
- Create: `features/adventure/services/codeService.ts` + `codeService.test.ts`
- Create: `features/adventure/scenes/ChestScene.ts`
- Create: `features/adventure/ui/ChestPanel.tsx`
- Modify: `game.ts`, `Overlay.tsx`, `dialogue/scripts.ts` (`chest-reveal`)

**Interfaces:**
- Produces (verbatim):

```ts
// services/codeService.ts
export interface CodeService {
  getUnlockCode(): Promise<string>;
  validate(code: string): Promise<boolean>;
}

/** Dev implementation. Swap for an API-backed one later without touching callers. */
export const codeService: CodeService = {
  async getUnlockCode() {
    return "INK-7F2A";
  },
  async validate(code: string) {
    return code.trim().toUpperCase() === (await this.getUnlockCode());
  },
};
```

Tests: returns `INK-7F2A`; validate accepts `" ink-7f2a "`, rejects `"INK-0000"`.
  - `ChestScene`: quiet treasure room (single chest 24×24 closed/open 2f, beam-of-light gradient sprite, slow `V` dust particles, five world-symbol glyphs on the walls, `chest` track); player walks in from left, E at chest → open anim + sfx → `ChestPanel` over dimmed canvas: "THE LOST CHAPTER HAS BEEN RECOVERED / YOUR ARCHIVE CODE:" + code from `codeService.getUnlockCode()` in giant pixel type; buttons `COPY CODE` (navigator.clipboard.writeText → label flips to "COPIED ✓" 2s), `RETURN TO THE ARCHIVE` (`nav:external` → `/gallery`), `RETURN TO OVERWORLD`. Persist `gameCompleted: true, codeReceived: true`; overworld now shows the archive node (Task 16 already renders it off the flag).

- [ ] **Steps:** codeService TDD → scene + panel → verify (clipboard works over localhost; flags persist; overworld archive path appears) → commit:

```bash
git add features/adventure
git commit -m "feat(adventure): treasure room, unlock code service, code reveal"
```

---

# Phase 7 — Integration & Polish

### Task 25: `/gallery` locked-book stub

**Files:**
- Create: `app/gallery/page.tsx` (server: metadata `title: "The Archive"`, renders client book)
- Create: `components/GalleryBook.tsx`

**Interfaces:**
- Consumes: `codeService`, `GALLERY_KEY` from `features/adventure/config`, `loadSave` (for the completion hint).
- Produces: client component; states: **locked** — CSS pixel book (layered divs: `O` cover, `Y` clasp keyhole, faint `V` glow), code `<input>` (uppercase transform, maxLength 8, placeholder `XXX-XXXX`), UNLOCK button → `codeService.validate`; wrong → shake keyframe + red glitch flicker + "ACCESS DENIED"; right → book-open animation (cover rotateY), persist `localStorage[GALLERY_KEY]="true"`. **unlocked** (or key present on mount) — "THE LOST CHAPTER" placeholder panel: styled empty state reading "// the lost chapter will be restored here soon" + back-to-home link. Below the book when locked: if `loadSave().gameCompleted` → "You've already recovered the code. Check the chest."; else a faint violet link "🗝 there is another way in → /adventure" (text glyph, next/link).

- [ ] **Steps:** build → `npm run build` green (route appears, main bundle untouched) → manual: wrong code shakes, `INK-7F2A` unlocks + persists across reload → commit:

```bash
git add app/gallery components/GalleryBook.tsx
git commit -m "feat(gallery): locked-book stub accepting the adventure code"
```

---

### Task 26: Secret-door entry button in the Fun panel

**Files:**
- Create: `components/AdventureDoor.tsx`
- Modify: `components/ScrollFeed.tsx` (single addition), `app/globals.css` (glitch keyframes)

**Interfaces:**
- Produces: `AdventureDoor` — framer-motion button wrapping `next/link` to `/adventure`: a 24×24 CSS-pixel key (box-shadow pixel art in `#ffd75e` with `#c4b5fd` aura) that idles subtly, every ~4s does a 120ms glitch (2-frame x-jitter + hue shift via `adventure-glitch` keyframes in globals.css), caption `a hidden adventure awaits` in the site's `text-[10px] uppercase tracking-[0.32em] text-white/40` style that brightens on hover; `whileHover={{ scale: 1.06 }}`, focus ring like existing CTAs; `aria-label="Enter the hidden adventure"`.
- ScrollFeed placement (exact): inside the Fun panel's `scroll-feed-inner` wrapper, immediately BEFORE the existing back-to-top CTA `<div className="pointer-events-none absolute bottom-6 …">`, insert:

```tsx
{/* Secret door to the hidden adventure — sits just above the back-to-top CTA. */}
<div className="pointer-events-none absolute bottom-24 left-1/2 z-40 -translate-x-1/2 sm:bottom-28">
  <AdventureDoor />
</div>
```

(`AdventureDoor`'s root uses `pointer-events-auto`.) Import added at top with the other component imports. No other ScrollFeed lines change.

- [ ] **Steps:** build component + insertion → verify desktop & mobile widths (no overlap with back-to-top; Fun panel content unaffected) → `npm run build` (main-route bundle: only the small component delta, still no phaser) → commit:

```bash
git add components/AdventureDoor.tsx components/ScrollFeed.tsx app/globals.css
git commit -m "feat(home): secret pixel-key door to the adventure at the end of the feed"
```

---

### Task 27: Mobile virtual controls + fullscreen

**Files:**
- Create: `features/adventure/ui/VirtualControls.tsx`
- Modify: `ui/Overlay.tsx` (render on coarse pointers during Level/Overworld), `AdventureApp.tsx` (fullscreen button top-right: `document.documentElement.requestFullscreen()` toggle, hidden if unsupported)

**Interfaces:**
- Consumes: `input` singleton (`setHeld`/`press`).
- Produces: left cluster ◀ ▶ (pointerdown/up → `setHeld("left"/"right")`), right cluster A=jump (down → `setHeld("jumpHeld", true)` + `press("jumpPressed")`, up → held false), B=attack, DASH, E=interact; 56px translucent circles (`bg-white/5 border-white/15 active:bg-violet-400/20`), bottom corners, `touch-action: none`, multi-touch safe (pointerId tracked per button). Combat/typing/dialogue need no virtual buttons (real DOM inputs/buttons; parry = tap on TimedPrompt, already in Task 13). Overworld: tap a node walks/selects it (Task 16 pointer handling) — virtual pad optional but harmless there.

- [ ] **Steps:** implement → verify in devtools device mode + a real phone on LAN if available (movement, jump buffering feel, no scroll/zoom gestures leak: `touch-action-none` + `overscroll-none` on game root) → commit:

```bash
git add features/adventure
git commit -m "feat(adventure): mobile virtual controls and fullscreen toggle"
```

---

### Task 28: Pause menu, settings, accessibility application

**Files:**
- Create: `features/adventure/ui/PauseMenu.tsx`
- Modify: `Overlay.tsx`, `PlatformLevelScene.ts` (honor `paused`), `combat/controller.ts` (pause timers by absorbing: while paused, telegraph timeout suspends — store remaining ms), `save.ts` consumers, `timedEvents` call sites (apply `widerParry` ×1.3 and `slowerTyping` ×1.3 scales), `CombatBackdropScene.ts`/`PlatformLevelScene.ts` (`noShake` skips `camera.shake`, `reduceFlash` swaps flash frames for a steady outline highlight)

**Interfaces:**
- Produces: PauseMenu (opens on P/Esc/pause button any scene): RESUME / RESTART FROM CHECKPOINT (level only) / SETTINGS / QUIT TO MAP. Settings: volume slider (0–100 → `audio.setVolume`), mute toggle, four accessibility checkboxes persisted to `save.settings.accessibility` and applied live. All timers (typing bar, telegraph, QTE) freeze while paused.

- [ ] **Steps:** implement (timer suspension: controller tracks `pausedAt`, extends deadlines by pause duration) → verify each toggle observably changes behavior (wider parry measurable in the flash duration; reduceFlash swaps effect; shake gone; typing slower) → commit:

```bash
git add features/adventure
git commit -m "feat(adventure): pause menu, settings, accessibility options"
```

---

### Task 29: Debug menu (`?debug=1`)

**Files:**
- Create: `features/adventure/ui/DebugMenu.tsx`
- Modify: `Overlay.tsx` (render when `new URLSearchParams(location.search).has("debug")`)

**Interfaces:**
- Produces: collapsible panel (top-left `DBG` tab): buttons — jump to any level/castle (start `Level` scene via bus event `"debug:start-level" { levelId }` handled in a small scene-manager helper inside `game.ts`), "grant all abilities", "grant 3 fragments + castle key", "give 5 buffs", "win current boss" (dispatches damage until victory), "wipe save". Only mounted when the query param exists; never in the overworld UI otherwise.

- [ ] **Steps:** implement + verify each button → commit:

```bash
git add features/adventure
git commit -m "feat(adventure): dev debug menu behind ?debug=1"
```

---

### Task 30: Final verification & balance pass

**Files:**
- Modify: whatever the checklist surfaces (balance numbers live in `config.ts` / boss defs / track data).

- [ ] **Step 1: Gates** — `npx tsc --noEmit` · `npm test` (all suites) · `npm run lint` · `npm run build` — all green; build output table: `/` first-load JS unchanged vs `main`@c9a5a37 baseline; `/adventure` and `/gallery` present.
- [ ] **Step 2: The 20-point spec checklist** — play through and tick every item: overworld movement ✓ ordered unlocks ✓ four platforming levels ✓ four unique bosses ✓ meaningful enemy drops ✓ typing attacks ✓ timed enemy attacks ✓ parry ✓ save persistence (reload mid-game) ✓ castle playable ✓ three Devil King phases ✓ final command + parry ✓ key drop ✓ physical key pickup ✓ walk to chest + open ✓ code revealed ✓ code copyable ✓ `/gallery` navigation ✓ full run < 30 min (time it; tune boss HP / level length if over — reduce `maxHealth` before shortening levels) ✓ all assets original ✓.
- [ ] **Step 3: Integration checks** — entry door visible/clickable at feed end on desktop + mobile widths; gallery accepts `INK-7F2A` and persists; completion hint appears post-game; back-to-top CTA unaffected; existing pages unchanged (`/`, `/myworld`, `/professional`, `/projects/netwraith`).
- [ ] **Step 4: Accessibility & audio sweep** — every setting functions; audio silent until first interaction; mute persists.
- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "polish(adventure): final verification and balance pass"
```

---

## Plan self-review notes

- Spec coverage: all spec sections map to tasks (engine→12, art→4, audio→5, enemies→8/18/19, buffs→8/11, bosses→14/18/19/20/22/23, overworld→16, save→15, endgame→23/24, gallery→25, door→26, mobile→27, accessibility→28, debug→29, criteria→30).
- Interfaces were cross-checked: `ids.ts` names, `CombatState`/`CombatEvent` shapes, `QteSpec`, `rollDrop`, `parseLevel` extensions (`F o < > G L @ ! ~` land with tests in their owning tasks).
- Legend char collision: `G` is used as timed gate (Task 19) and as a sprite palette char — palettes and level maps are separate namespaces, no conflict. `F`/`B`/`M` likewise differ per namespace (map legend vs palette).
- No task depends on a later task's outputs.

