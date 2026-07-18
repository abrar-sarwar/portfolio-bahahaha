# Abrar's Adventure: The Lost Key — Design

**Date:** 2026-07-17
**Status:** Approved design; awaiting implementation plan
**Source:** User-provided build prompt (full game spec) + brainstorming Q&A

## Goal

A polished, ~20–30 minute pixel-art browser game hidden inside the portfolio:
overworld → four platforming levels with turn-based bosses → final castle →
three-phase Devil King → key pickup → chest → Gallery unlock code. Plus two
integration pieces: a mysterious entry button at the end of the main scroll
feed, and a minimal `/gallery` route with a locked book that accepts the code.

All art and audio are original and **generated from code** (pixel grids in
TypeScript, WebAudio chiptune synth). No copyrighted characters, names, or
assets; cybersecurity "commands" are fictional arcade prompts only.

## Decisions from brainstorming

| Question | Decision |
|---|---|
| Engine | Phaser 3 (new dependency), dynamically imported on `/adventure` only; React DOM overlay for combat/typing/dialogue UI |
| Missing `/gallery` | Build a stub route in this project: locked pixel-book, code input, localStorage unlock, placeholder "Lost Chapter" content |
| Assets | 100% code-generated pixel art + synthesized chiptune audio; sprites load through a registry so PNGs can replace them later |
| Entry button | "Mysterious secret door": small pixel-key button with glitch shimmer at the bottom of the Fun panel (end of the feed) |
| Unlock code | Dev code `INK-7F2A` served by an async `codeService` interface, swappable for a real API later |
| Tests | Add `vitest` (devDependency) for pure game logic; scenes verified by playing |
| Git | Local commits only — **do not push** (user is testing) |

## Stack & integration

- Next.js 16 App Router (existing), React 19, TypeScript strict, Tailwind for
  overlay UI styling.
- New dep: `phaser@^3.90`. New devDep: `vitest`. Nothing else.
- `app/adventure/page.tsx` — client page that `next/dynamic`-imports
  `features/adventure/AdventureApp` with `ssr: false`. Main feed bundle is
  unaffected; Phaser (~400KB gz) downloads only when the game opens.
- `app/gallery/page.tsx` — small server-shell + client locked-book component.
- Entry button component rendered at the bottom of the Fun panel inside
  `ScrollFeed` (above the existing "Back to top" CTA).
- Path alias `@/*` → repo root, so game code imports as `@/features/adventure/…`.

## File tree (new files)

```
app/
  adventure/page.tsx            # dynamic-import shell, per-route metadata
  gallery/page.tsx              # locked book stub
features/adventure/
  AdventureApp.tsx              # mounts Phaser game + React overlay, owns lifecycle
  config.ts                     # canvas size, physics constants, tuning numbers
  bridge/
    EventBus.ts                 # tiny typed emitter (hand-rolled, ~30 lines)
    GameStore.ts                # observable store via useSyncExternalStore
  scenes/
    BootScene.ts                # generates all textures + audio, <100ms budget
    TitleScene.ts
    OverworldScene.ts
    PlatformLevelScene.ts       # one parameterized scene runs all 4 levels
    CastleScene.ts              # castle gauntlet (extends PlatformLevelScene)
    CombatBackdropScene.ts      # boss-arena rendering behind the React combat UI
    VictoryScene.ts             # defeat cinematic, key drop, walk-to-key
    ChestScene.ts               # treasure room, walk-to-chest, code reveal
  levels/
    types.ts                    # LevelDefinition, ASCII legend
    level-1-1.ts … level-1-4.ts # ASCII tilemaps + spawns + theme + fragments
    castle.ts
  enemies/
    Enemy.ts                    # base: patrol, contact damage, stomp death, drops
    Bugling.ts Phishling.ts MalwareBat.ts BruteForceBrute.ts
    FirewallKnight.ts RootkitSlime.ts
  combat/
    engine.ts                   # pure reducer state machine for turn combat
    typing.ts                   # prompt grading (Perfect/Good/Incomplete/Incorrect)
    timedEvents.ts              # parry windows, marker bars, choice flashes
    buffs.ts                    # the 8 Data Fragment buffs
    types.ts
  bosses/
    types.ts                    # BossDefinition (data-driven)
    glitchToad.ts captainSpoof.ts warden.ts blankPage.ts devilKing.ts
  dialogue/
    scripts.ts                  # all scripted lines incl. Devil King defeat
    Dialogue.tsx                # typewriter dialogue box (skippable)
  art/
    palette.ts                  # global 32-color palette + per-world ramps
    sprites/                    # pixel-grid definitions per entity/tileset
    textures.ts                 # grid → canvas → Phaser texture registry
  audio/
    synth.ts                    # WebAudio voices + ADSR + step sequencer
    tracks.ts                   # note-pattern data for all themes
    sfx.ts
  state/
    save.ts                     # versioned localStorage save + migration
    settings.ts                 # audio + accessibility settings
  services/
    codeService.ts              # getUnlockCode(): Promise<string> (dev: INK-7F2A)
  ui/
    Overlay.tsx                 # HUD, pause, audio toggle, fullscreen
    CombatMenu.tsx TypingBox.tsx TimedPrompt.tsx BuffTray.tsx
    VirtualControls.tsx         # mobile touch buttons
components/
  AdventureDoor.tsx             # secret-door entry button (used in ScrollFeed)
```

## Architecture

### React ↔ Phaser bridge

Phaser owns simulation and rendering: platforming, overworld, sprites,
particles, camera, physics. The React overlay (absolutely positioned above the
canvas) owns anything textual or input-heavy: HUD, dialogue, combat menu,
typing input (a real `<input>` so mobile keyboards appear), timed-prompt
visuals, pause/settings, victory/chest buttons, virtual controls.

The two sides communicate **only** through:

- `EventBus` — typed events (`combat:action`, `combat:enemyTelegraph`,
  `qte:start`/`qte:result`, `dialogue:advance`, `level:complete`, …).
- `GameStore` — small observable snapshot (health, buffs, meters, scene id,
  save data) read by React via `useSyncExternalStore`.

No direct imports across the boundary. React 19 StrictMode double-mount is
handled in `AdventureApp` (create game once via ref, destroy on true unmount).

### Canvas

960×540 internal resolution, `pixelArt: true`, `roundPixels`, Phaser
`Scale.FIT` letterboxed, fullscreen button, loop pauses when tab hidden.
Arcade physics only.

### Combat engine (pure TS)

A reducer state machine, fully unit-testable, consuming data-driven boss
definitions:

```
PlayerTurn → ResolvePlayerAction → EnemyTelegraph → DefenseEvent → ResolveEnemy
   ↑                                                                    |
   └────────────────────── phase checks / victory / defeat ─────────────┘
```

```ts
interface BossDefinition {
  id: string; name: string; maxHealth: number;
  phases: BossPhase[];            // thresholds, move pools, tempo modifiers
  weaknesses: string[];
  typingPrompts: string[];
  rewards: Reward[];
  mechanicHook?: MechanicHook;    // one signature mechanic per boss
}
```

Menu actions implemented once for all bosses: **Attack, Command (typing),
Defend, Parry Stance, Analyze, Items**. Signature hooks: Glitch Toad =
tutorial hints; Captain Spoof = pick-the-legit-option rounds (VERIFY SOURCE);
Warden = parries fill a Breach Meter enabling exploit attacks; Blank Page =
sequence puzzle (ANALYZE → DEFEND → REMEMBER → CREATE, clued by dialogue and
Memory Fragments); Devil King = three phases (below).

### Typing & timed events

- `typing.ts` grades accuracy + speed → Perfect (crit) / Good / Incomplete
  (reduced) / Incorrect (minimal, never a wasted turn). Focus Chips widen
  timers; Typing Power scales damage. Phase 2 adds corrupted prompts the
  player must fix (`encrpyt memory` → `encrypt memory`).
- `timedEvents.ts` powers every real-time beat with one abstraction: parry
  windows (telegraph contract: raise → flash → sound cue → window), moving
  marker bars, click-the-right-icon flashes, type-`BLOCK` events, 1–4s each.
  On touch devices, Space-style confirms (parry, marker stop) accept a tap on
  the prompt area instead.
- Parry grades: Perfect (no damage + strong counter + Ultimate Meter), Normal
  (reduced damage + small counter), Miss (full damage). Parry Modules widen
  the window.

### Enemies & buffs

Six enemy behaviors on a shared base (patrol/ledge-turn, contact damage,
stomp or attack kills, drop table): Bugling, Phishling (disguised, lunges,
exposed by Analyze), Malware Bat (dive + packets), Brute-Force Brute (charge,
wall-stun, parryable), Firewall Knight (shielded front, barrier), Rootkit
Slime (burrow, corrupt ground, splits). Drops per the build prompt.

Eight Data Fragment buffs with pickup toasts, consumed/applied in combat:
Attack Byte, Firewall Layer, Focus Chip, Parry Module, Recovery Packet,
Root Access, Exploit Insight, Cache Boost. Bosses stay beatable with zero
buffs; buffs make them comfortable.

One hidden **Memory Fragment** per normal level (four total; the castle has
none — it's a gauntlet); collecting shows an optional
personal note (NetWraith, TripWire, GLINT, CounterStack, manga/archive lore).
The Blank Page fight references how many were found. Never required.

### Levels

Authored as ASCII grids parsed into tilemaps + spawn lists
(`#` ground, `=` one-way platform, `^` hazard, letters for spawns/checkpoints/
fragments/boss door). Per-world 16×16 code-generated tilesets + 2–3 parallax
layers. Flow per level: intro → platforming → checkpoint → second challenge →
boss door → turn-based boss → reward → overworld.

| Level | Theme | Enemies | Boss → reward |
|---|---|---|---|
| 1-1 Bug Fields | digital grassland, broken terminals | Buglings, Phishlings | Glitch Toad → **Dash** + Bronze Key Fragment |
| 1-2 Phishing Harbor | dark docks, fake platforms, code water | + Malware Bats | Captain Spoof → **Analyze** + Silver Key Fragment |
| 1-3 Firewall Factory | industrial, lasers, conveyors, timed gates | Knights, Brutes, Slimes | The Warden → **Improved Parry** + Gold Key Fragment |
| 1-4 Corrupted Archive | broken shelves, rotating rooms, shadow enemies | Bats, Slimes, strong Buglings | The Blank Page → **Castle Key** (fragments combine) |
| Castle | red sky, rising corruption, collapsing bridges, staircase | strong variants | Devil King (3 phases) |

Player movement: responsive with coyote time (~100ms), jump buffering
(~120ms), forgiving checkpoints (mid-level + boss entrance). Controls per the
build prompt (arrows/WASD, Space jump, Shift dash, E interact, P/Esc pause;
Space is also parry in combat). Mobile: `VirtualControls` touch buttons.

### Devil King (three phases) & endgame

1. **Gatekeeper** — standard engine + summons Buglings, heavy armor.
2. **Infernal Breach** (≤60%) — arena partially destroyed, faster telegraphs,
   shorter windows, corrupted-word prompts, defense QTEs on enemy turns,
   summoned adds drop emergency buffs.
3. **Final Command** (≤20%) — invulnerable charge-up; scripted sequence:
   ANALYZE → PARRY → type `sudo restore the lost chapter` → ROOT ACCESS →
   timed final parry → big **EXECUTE FINAL STRIKE** button. Failing loses
   some health and retries the sequence, never the whole fight. If the player
   reaches phase 3 without a Root Access token, the sequence grants one
   (scripted beats must always be completable).

Defeat cinematic uses the scripted dialogue (Appendix A). The King dissolves
into red pixels, drops the key; the player **regains control**, walks to the
key, presses E (`ARCHIVE KEY ACQUIRED`), a door opens; quiet treasure room;
walk to chest, press E; chest opens: code display + `COPY CODE`,
`RETURN TO THE ARCHIVE` (→ `/gallery`), `RETURN TO OVERWORLD`. Completion +
code-received flags saved.

### Overworld

Animated map: five nodes connected by paths, castle visible-but-locked from
the start, flags on completed levels, locked gates, walking map-character,
subtle environment shifts as worlds complete. Unlock chain
1-1 → 1-2 → 1-3 → 1-4 → Castle. Completed levels replayable. After victory
the castle icon changes and a direct "Archive" path (→ `/gallery`) appears.

### Save system

`localStorage["adventure-save-v1"]`, versioned schema with migration stub:

```ts
interface AdventureSave {
  version: 1;
  unlocked: LevelId[]; completed: LevelId[];
  abilities: { dash: boolean; analyze: boolean; improvedParry: boolean };
  keyFragments: ("bronze"|"silver"|"gold")[]; castleKey: boolean;
  memoryFragments: LevelId[];
  bossesDefeated: BossId[];
  gameCompleted: boolean; codeReceived: boolean;
  assistLevel: number;              // adaptive assist, never announced
  settings: { volume: number; muted: boolean;
              accessibility: { widerParry: boolean; slowerTyping: boolean;
                               reduceFlash: boolean; noShake: boolean } };
}
```

Adaptive assist: after repeated deaths on the same boss, quietly widen parry
windows, slow typing timers, grant a small heal, surface a weakness hint.
Boss loss restarts at the boss entrance with that level's buffs restored.
Structured so a backend (e.g. Supabase) can replace persistence later; no
protected gallery content ships in game files.

### Audio

`synth.ts`: square/triangle/noise voices, ADSR, step sequencer over note
data. Tracks: title, overworld, per-world level themes, boss theme, castle
theme, Devil King phase variants (escalating tempo/key), victory jingle,
chest reverie. SFX: jump, stomp, parry clink, typing ticks, damage, collect,
chest. Muted until first interaction; HUD audio toggle; volume persisted.

### Entry button (`AdventureDoor`)

Bottom of the Fun panel: a small code-drawn pixel key that flickers with an
occasional 1-frame glitch (CSS steps + framer-motion), caption
`a hidden adventure awaits` in the site's violet glow style, occasional
scanline shimmer. Links to `/adventure`. Sits above the existing Back-to-top
CTA; unobtrusive on mobile.

### `/gallery` stub

Dark page matching site style: a closed pixel book with a keyhole, a code
input (`XXX-XXXX` format), validation via `codeService`, shake + red glitch
on wrong code, unlock animation + persisted unlock on success. Unlocked state
shows a placeholder "Lost Chapter" panel (user supplies real content later).
If the adventure isn't completed yet, a subtle hint links to `/adventure`.

## Accessibility & difficulty

Single default difficulty; settings for larger parry windows, reduced typing
difficulty, slower prompts, no screen shake, reduced flashing, volume.
Checkpoints, boss-entrance retries, no lives, skippable dialogue, typing
prompt restart with small penalty. Buttons are real `<button>`s; overlay is
keyboard navigable; canvas has an aria-label.

## Testing & verification

- **Vitest** (new devDep, `npm test`): combat engine (turn flow, damage math,
  buffs, phase transitions, final-sequence retry), typing grader, timed-event
  window math, save load/migrate/corrupt-input robustness, code service,
  level parser (ASCII → tile data), unlock-chain logic.
- **Played verification** (dev server): full loop — every level, every boss,
  final sequence, key walk, chest, code copy, gallery unlock, entry button,
  mobile layout smoke test, replay + save persistence across reloads.
- `?debug=1` dev menu: level select, boss skip, grant buffs/abilities — used
  for testing and demos; hidden otherwise.

## Scope control (explicit non-goals)

No backend, no real gallery content, no open world, no multiplayer, no
inventory/crafting/skill trees, no procedural generation, no grinding, ≤5
levels, cutscenes short and skippable. Existing pages, videos, and `_archive`
untouched. Video loading code is not modified (prior incident).

## Completion criteria

The build prompt's 20-point checklist, plus: entry button present at the end
of the feed; `/gallery` stub accepts the code; local commits only, no push.

## Appendix A — key scripted text (verbatim from build prompt)

Devil King defeat monologue:

> So... you actually made it.
> I thought the bugs would stop you. I thought the false paths would fool
> you. I thought the Blank Page would make you turn back. But you kept
> moving. My final message... The code is...
> *(begins disappearing)*
> No. You do not get it from me. Take the key. Open the chest yourself.

Key pickup: `ARCHIVE KEY ACQUIRED`

Chest reveal:

> THE LOST CHAPTER HAS BEEN RECOVERED
> YOUR ARCHIVE CODE:
> INK-7F2A

Final typing prompt: `sudo restore the lost chapter`

Example commands (fictional, arcade-style): scan, patch, block, debug, nmap,
deny, allow, encrypt, sudo, scan target, deploy patch, enable firewall,
verify identity, encrypt memory, restore system, remove malware; Blank Page
words: build, learn, create, persist, begin.
