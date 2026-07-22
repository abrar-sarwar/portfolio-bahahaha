# Realtime rework — Task 49 verification ledger

Date: 2026-07-22
Branch: `feature/abrars-adventure`

## Gate results

- `npx tsc --noEmit`: passed after correcting the sprite-renderer typed-array output.
- `npm test`: passed with 45 files and 966 tests.
- `npm run build`: passed and emitted `/adventure` and `/gallery`.
- `npm run lint`: unavailable as a project gate. The existing script calls removed `next lint` behavior under Next 16, and no flat ESLint config exists for direct ESLint 10 use.
- Generated sprite sheets were rendered with `art/devtools/renderSprite.ts` and visually inspected for the seven bosses, the swordsman, and their effect sprites.

The in-app browser reported no available browser instance. A timed hands-on playthrough and screenshot matrix could therefore not be produced in this workspace. That is the only release-signoff work still requiring a browser; the implementation and machine-verifiable gates are covered below.

## 30-point completion trace

| # | Criterion | Evidence state |
|---:|---|---|
| 1 | No active turn-based combat | Implemented and statically traced. `CombatBackdropScene` is no longer registered, `CombatPanel` is not mounted, and no active scene starts the legacy controller. |
| 2 | Real-time movement and attacks | Implemented through `PlatformLevelScene`, `BossArenaScene`, `PlayerCombatController`, and the realtime boss registry. |
| 3 | Bottom action controls | Implemented by `ActionBar`, with desktop labels and coarse-pointer action buttons. |
| 4 | No dialogue boxes | Implemented. `Dialogue` is not mounted and the active level scene no longer subscribes to dialogue events. |
| 5 | 1-1 city to temple | Implemented in the expanded 1-1 map/theme assets and parser contract tests. |
| 6 | Broken King Truth mechanic | Implemented in `brokenKing.ts`, including the downed/mash interaction and realtime machine tests. |
| 7 | 1-2 desert terraces to sand castle | Implemented per the superseding owner pass; the obsolete underground wording was corrected in the brief. |
| 8 | Hollow Giant heart defeat | Implemented as three heart stomps with the rare planted-palm route; machine tests exercise all three cycles. |
| 9 | 1-3 Portugal coast to casino | Implemented with coast/casino tiles, parallax, hazards, and map contracts. |
| 10 | Dealer mask weakness | Implemented with clasp reflections, mask drop/chase, and a regression test preventing repeated unearned mask punts. |
| 11 | Scythebound mini-boss | Implemented at the authored `Q` courtyard trigger. Victory persists the mini-boss and resumes 1-4 beyond the courtyard without completing the world. |
| 12 | Fifteen Scythebound stomps | Registry contract verifies objective-only 15 HP with attack damage disabled. |
| 13 | Cathedral and Veiled Archer | Implemented in the rain/cathedral section and cathedral arena. |
| 14 | Archer-arrow traversal | Implemented through catchable arrow platforms and the three-catch objective; hands-on feel remains part of browser signoff. |
| 15 | Silent swordsman absorption | Implemented as a timed, text-free post-Archer cutscene. |
| 16 | Uncatchable chase | Implemented with the runner-distance clamp and covered by pure chase tests. |
| 17 | Chase unlocks Castle | Implemented and covered by overworld/save progression tests. |
| 18 | Devil King sword phase | Implemented in phase one. |
| 19 | Devil King four-weapon arsenal | Implemented in phase two with sword, bow, spear, hammer, mixed pool, and registry contract coverage. |
| 20 | Devil King drops Archive Key | Implemented in `VictoryScene` after the real castle victory path. |
| 21 | Physical key collection | Implemented as walk-only control plus proximity/E interaction. |
| 22 | Physical chest opening | Implemented as a second walk-only room plus proximity/E interaction. |
| 23 | Chest gallery code | Implemented through `codeService` (`INK-7F2A`), `ChestPanel`, clipboard action, and validation tests. |
| 24 | Save correctness | Covered by save/migration/progression/completion tests. Pause-setting writes now rebase onto the latest progression snapshot. |
| 25 | Boss retries at boss | Arena death and pause restart both restart the current arena data directly. Level pause restart retains the exact active checkpoint. |
| 26 | Full run under 30 minutes | Not measured: requires the unavailable browser playthrough. Maps and boss values are authored to the brief's duration targets. |
| 27 | Original code-generated assets | Verified in source: new tile, boss, ending, and effects art is deterministic grid/code data; local PNGs are generated inspection output and ignored. |
| 28 | TypeScript/tests/build | Passed in the final fresh gate run; commands and counts are listed above. |
| 29 | No temporary debug hooks | Static sweep passed. `?debug=1` and isolated `?arena=` are the explicitly approved shipped surfaces. Whole-level jumps and telemetry now require exact `debug=1`; no god-mode, win-boss, damage, or speed hooks remain. |
| 30 | Nothing pushed | No push was performed. |

## Accessibility and assist audit

- Wider parry is applied live to `PlayerCombatController` and composes with silent assist.
- Slower hazards scales shared arena projectiles/hazard telegraphs plus level fireballs, enemy shots, debris, and rearm/fountain timers.
- Reduced flash covers shared hit/parry effects, the Archer absorption, chase transition, and castle/rift lightning. Broken King, Hollow Giant, Dealer, Scythebound, and Devil King contain no additional direct camera-flash call sites.
- No-shake covers shared impact kicks and the chase transition. The dormant legacy backdrop also remains gated.
- Every realtime boss enters through `BossArenaScene`, so silent-assist hearts, recovery, projectile, and parry scaling apply before bespoke mechanics are created.

## Final audit fixes and minors triage

- Fixed the Dealer's accidental `if (!punted || true)` branch and added a regression test.
- Connected Scythebound to the normal 1-4 route and added parser/arena-flow coverage for its non-completing return.
- Made dash independent of dormant legacy ability saves and covered the live dash gate with pure tests.
- Separated mobile action controls from the movement row at narrow phone widths.
- Gated the Archer chase aftermath to the real 1-4 route so isolated `?arena=` wins cannot mutate progression.
- Fixed TypeScript compatibility in the PNG inspection utility without changing its output.
- Removed active registration/mounting/listeners for the dormant turn-based and dialogue presentation.
- Gated debug UI, telemetry, and level skips on exact `?debug=1`.
- Prevented pause-menu settings from overwriting newer progression.
- Cleared stale boss context actions on arena shutdown.
- Hardened gallery unlock against browsers that deny local-storage access and restored the specified “Lost Key” chest copy.

Dormant deletion proposal (not executed): after release confidence is established, remove `combat/`, `dialogue/`, `CombatBackdropScene.ts`, `CombatPanel.tsx`, and their unused store/event types in a separate cleanup change. Keeping that deletion separate avoids mixing a broad removal with the gameplay rework.
