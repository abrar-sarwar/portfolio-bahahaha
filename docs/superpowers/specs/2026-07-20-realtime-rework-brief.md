# Abrar's Adventure — Real-Time Combat Rework Brief

**Date:** 2026-07-20
**Status:** Approved direction — supersedes the turn-based combat direction of
`2026-07-17-abrars-adventure-design.md` wherever the two conflict.
**Source:** User-provided rework prompt, reproduced verbatim below (including
its original typos). The companion plan amendment is
`docs/superpowers/plans/2026-07-20-realtime-rework-amendment.md`.

---

# Abrar’s Adventure: Real-Time Combat Rework

Rework **Abrar’s Adventure: The Lost Key** inside the existing Next.js 16 portfolio located at:

```text
/Users/oninactive/dev/portfolio-bahahaha
```

The game currently exists on the local-only branch:

```text
feature/abrars-adventure
```

## Critical repository rules

1. Never run `git push`.
2. Keep all commits local.
3. Do not modify `main`.
4. Read these files before making changes:

```text
docs/superpowers/specs/2026-07-17-abrars-adventure-design.md
docs/superpowers/plans/2026-07-17-abrars-adventure.md
.superpowers/sdd/progress.md
```

5. Create an explicit plan amendment documenting that the user has replaced the turn-based combat direction with real-time platform combat.
6. Do not immediately delete the existing turn-based engine. Remove it from active gameplay, but preserve it until the new system is verified.
7. The following files remain locked unless the plan amendment explicitly authorizes changing them:

```text
features/adventure/combat/engine.ts
features/adventure/combat/types.ts
features/adventure/combat/typing.ts
features/adventure/combat/timedEvents.ts
features/adventure/combat/buffs.ts
features/adventure/combat/assist.ts
features/adventure/combat/rng.ts
features/adventure/combat/controllerLogic.ts
```

Prefer building a new real-time system in a separate directory rather than rewriting the locked system.

Suggested location:

```text
features/adventure/realtime/
```

---

# New creative direction

The previous turn-based boss battles are no longer the intended experience.

Replace every turn-based encounter with a real-time boss fight where the player:

* moves around an enclosed platforming arena
* jumps over and avoids attacks
* attacks bosses directly
* stomps enemies
* dashes
* parries selected attacks
* studies visible boss patterns
* discovers each boss’s unique weakness
* retries from immediately before the boss

There must be no traditional turn-based combat menu.

There must be no dialogue boxes or character conversationsnot write boss dialogue, cutscene dialogue, narration, or explanatory conversations. The user will provide dialogue later if dialogue is eventually wanted.

Visual storytelling, animations, symbols, environmental clues, boss names, level names, HUD labels, and the final gallery code are allowed.

---

# Target experience

The game should take approximately **25 minutes** to complete and must remain under 30 minutes for a normal first playthrough.

Target timing:

```text
World 1-1: 4 minutes
World 1-2: 4 minutes
World 1-3: 4 minutes
World 1-4: 6 minutes
Castle: 7 minutes
Overworld and transitions: 1–2 minutes
```

Progression remains:

```text
World 1-1
World 1-2
World 1-3
World 1-4
Castle
```

Each world must unlock only after the previous world is completed.

Previously completed worlds can be replayed.

---

# Core player controls

The player controls the existing pixel-art Abrar character.

Desktop controls:

```text
A / Left Arrow       Move left
D / Right Arrow      Move right
Space / W / Up       Jump
J / X                Attack
K / C                Parry
Shift                Dash
E                    Interact
Escape               Pause
```

The controls must feel responsive.

Preserve or improve:

* coyote time
* jump buffering
* variable jump height
* dash
* invulnerability frames
* knockback
* checkpoints
* controller teardown
* Phaser scene-instance hygiene

Every arena must reset all arrays, timers, projectiles, hitboxes, references, and accumulated state at the beginning of `create()`.

---

# Bottom action interface

Remove the large central turn-based interface.

All gameplay controls and ability information should appear in a clean bar along the bottom of the screen.

Desktop layout example:

```text
[ J ATTACK ] [ SPACE JUMP ] [ SHIFT DASH ] [ K PARRY ] [ E INTERACT ]
```

During special mechanics, the relevant action can temporarily change:

```text
[ E REVEAL TRUTH ]
[ E STRIKE HEART ]
[ K REFLECT SHOT ]
[ SPACE STOMP: 12 / 15 ]
```

The bottom interface should:

* remain visually small
* never cover the player
* show ability cooldowns
* show the correct keyboard input
* transform into virtual controls on mobile
* use icons where possible
* avoid large paragraphs or instructions

Boss health appears at the top of the screen.

Player health remains clearly visible.

---

# Real-time combat framework

Create a reusable real-time boss framework.

Suggested architecture:

```text
features/adventure/realtime/
  BossArenaScene.ts
  BossController.ts
  BossStateMachine.ts
  PlayerCombatController.ts
  AttackHitbox.ts
  DamageSystem.ts
  ParrySystem.ts
  ProjectileSystem.ts
  ArenaHazardSystem.ts
  BossHealthBar.tsx
  ActionBar.tsx
  bossDefinitions/
```

The framework must support:

* boss idle states
* attack selection
* telegraphs
* recovery windows
* phase transitions
* player attack hitboxes
* stomp damage
* projectile attacks
* melee attacks
* parryable attacks
* unparryable attacks
* boss invulnerability
* weak points
* scripted finishing conditions
* checkpoints
* restart without replaying the entire level
* deterministic test hooks
* proper cleanup when scenes stop or restart

Bosses should clearly telegraph attacks through animation, sound, lighting, positioning, or particles.

Avoid invisible or unpredictable damage.

---

# Standard player combat

The player has the following offensive and defensive actions.

## Basic attack

Abrar performs a short-range attack.

The attack should:

* be fast
* have a small cooldown
* stop repeated input from creating unlimited overlapping hitboxes
* cause slight boss hit-stop
* create clear impact particles

## Stomp

Landing on an enemy or designated boss weak point deals damage.

The player bounces upward after a successful stomp.

## Dash

The dash is useful for:

* crossing hazards
* escaping attacks
* closing distance
* moving through selected projectiles after later upgrades

## Parry

Selected boss attacks can be parried.

A successful parry should:

* play a sharp sound
* briefly freeze the action
* create a bright impact effect
* negate damage
* stagger the boss or reflect a projectile

A failed parry should leave the player vulnerable for a short period.

Parryable attacks need a consistent visual signal.

## Health

Use an approachable health system.

Recommended starting health:

```text
6 hearts
```

Normal boss attacks should generally remove one heart.

Very heavy attacks can remove two hearts but must have large telegraphs.

There is no lives system.

---

# World 1-1: City of the Broken Crown

## Level progression

The level begins in a modern city.

The player travels through:

1. city streets
2. rooftops
3. construction platforms
4. an old district
5. a visual transition into an East Asian-inspired mountain settlement
6. temple stairs
7. a large ancient temple door

The transition should feel gradual rather than instantly teleporting from one environment to another.

Possible transition:

* modern buildings become older
* neon signs become lanterns
* roads become stone paths
* city sounds fade into wind and temple bells
* skyscrapers disappear behind mountains
* the color palette changes from blue-gray to gold, red, and jade

Use original architecture and original pixel art. Do not copy a real temple or copyrighted game environment.

The level ends when the player enters a large temple door.

---

# World 1-1 Boss: The Broken King

The boss is called:

```text
THE BROKEN KING
```

## Appearance

The Broken King is:

* an old king
* extremely tall
* long gray or white hair
* long beard
* wearing a damaged crown
* carrying an enormous sword
* missing his right arm
* using cloth, armor, or a royal cape to cover the missing arm
* fighting entirely with his left arm
* visually exhausted but still extremely powerful

The design may carry the emotional weight of a tragic old king, but it must be an original character. Do not copy Asgore’s design, clothing, face, weapon, attacks, music, or animations.

## Arena

The arena is inside the temple.

Include:

* broken pillars
* hanging banners
* cracked stone
* a large throne
* falling dust
* moonlight or sunlight entering from above
* a ceremonial bell or truth symbol

## Attacks

The Broken King should use:

### Giant overhead strike

He slowly raises the sword and slams it into the floor.

The strike creates a ground shockwave.

The player must jump over the shockwave.

### Horizontal sweep

He drags the sword across most of the arena.

The player can:

* jump
* dash away
* perform a precise parry

### Sword charge

He lowers his body and charges across the arena.

If he hits a wall, he briefly staggers.

### Falling blade waves

He swings upward and creates descending sword-energy arcs.

The player must move between safe spaces.

### Royal rage

At lower health, his crown glows and his attacks become faster.

## Main weakness: Truth

The best way to defeat the Broken King is not by repeatedly damaging him.

Normal attacks should damage him extremely slowly.

The player must reveal the truth to him.

There should be no dialogue box.

Create a visual **Truth mechanic**.

Recommended implementation:

1. The player discovers three glowing Truth Seals throughout the city and temple.
2. Each seal appears beside the bottom action bar.
3. During the fight, the Broken King becomes vulnerable after a missed heavy attack or successful parry.
4. The bottom action temporarily changes to:

```text
[ E REVEAL TRUTH ]
```

5. Holding `E` near the Broken King activates one Truth Seal.
6. Each Truth Seal visually removes one part of his false power:

```text
First Truth: cracks the crown
Second Truth: removes the red rage effect
Third Truth: causes him to drop the sword
```

After the third truth, the Broken King kneels and the fight ends.

Do not add spoken or written truth statements yet.

Use visual symbols and animation only.

The boss can technically be damaged through attacks, but using Truth must be dramatically faster and clearly be the intended solution.

---

# World 1-2: The Buried Heart

## Level progression

The level begins in a desert.

The player travels through:

1. desert dunes
2. ruined stone structures
3. sandstorms
4. a broken excavation site
5. a deep sinkhole
6. underground caves
7. ancient tunnels
8. a massive underground chamber

Use environmental movement such as:

* sliding sand
* falling rocks
* wind
* sinking platforms
* crumbling floors
* underground lifts
* narrow cave jumps

The final chamber contains a giant creature embedded into the underground structure.

---

# World 1-2 Boss: The Hollow Giant

The boss is called:

```text
THE HOLLOW GIANT
```

## Appearance

The Hollow Giant has:

* no legs
* an enormous upper body
* huge arms
* a giant mouth
* no normal lower body
* a massive exposed heart in the center of its chest
* chains, stone, or roots connecting it to the cave
* a body that looks part-creature and part-underground monument

## Arena

The player fights on platforms around the giant.

The giant remains mostly in the background but reaches into the playable area.

## Attacks

### Hand slam

The giant slams one hand onto the arena.

The hand remains on the ground briefly and can be used as a temporary platform.

### Double slam

Both hands strike the ground.

The player must move into a visible safe zone.

### Mouth shockwave

The giant opens its mouth and releases a horizontal force wave.

The player must hide behind stone, jump between levels, or dash through the safe gap.

### Inhale

The giant pulls the player toward its mouth.

The player must run away and use anchored platforms.

### Falling cave debris

Rocks fall from marked ceiling locations.

### Heart pulse

The heart emits expanding circular energy waves.

The player must jump between them.

## Main weakness: The heart

Attacking the giant’s hands or body should do almost no damage.

The player must expose and attack the heart.

Recommended combat loop:

1. Bait the giant into slamming both hands.
2. Jump onto one hand.
3. Climb or bounce upward across its arms.
4. Reach the heart.
5. Attack or stomp the heart several times.
6. The giant knocks the player away.
7. Repeat for three damage cycles.

The heart should visibly crack and pulse faster after each successful cycle.

In the final cycle, the player performs a large stomp directly into the heart.

The giant collapses backward into the underground darkness.

---

# World 1-3: From the Coast to the Casino

## Level progression

The level begins in a Portugal-inspired coastal region.

Use original pixel-art environments inspired by:

* colorful hillside buildings
* tiled streets
* ocean views
* narrow alleys
* balconies
* stone stairways
* coastal cliffs
* trams or rail platforms

Do not directly copy a specific real location.

As the level progresses:

* signs become brighter
* natural sunlight becomes artificial neon
* peaceful streets become entertainment districts
* architecture becomes more excessive
* the player eventually reaches a Vegas-inspired casino city

The final portion should include:

* neon lights
* giant signs
* slot-machine imagery
* casino floors
* moving elevators
* roulette-inspired platforms
* security lasers
* a private room behind the casino

The player enters the private room to fight the boss.

---

# World 1-3 Boss: The One-Eyed Dealer

The boss is called:

```text
THE ONE-EYED DEALER
```

## Appearance

The boss:

* has no visible face
* wears purple clothing
* wears a full mask
* has one glowing LED eye
* has a devil-like symbol or expression displayed on the mask
* uses a handgun
* moves with unnatural speed
* appears elegant and controlled rather than bulky

The design must be original.

## Arena

The fight occurs in a private casino chamber.

Include:

* neon purple lighting
* card tables
* glass platforms
* rotating signs
* bullet-reflecting metal surfaces
* breakable mask-lock symbols around the arena

## Attacks

### Direct shot

The boss aims at the player before firing.

A laser line briefly displays the bullet path.

### Ricochet shot

The bullet bounces from walls.

The full ricochet path should be previewed briefly.

### Triple shot

Three bullets travel at different heights.

### Teleport shot

The boss disappears into purple particles and reappears somewhere else before firing.

### Bullet rain

Shots fall from above in marked locations.

### Close-range pistol strike

If the player gets too close, the Dealer strikes with the gun.

## Main weakness: The mask

The player should not be able to directly damage the Dealer while the mask is secure.

The mask has three hidden clasps.

The player must force the mask to fall.

Recommended mechanic:

1. Certain bullets glow before being fired.
2. Glowing bullets are parryable.
3. A successful parry reflects the bullet.
4. The reflected bullet hits one of the mask clasps.
5. Each reflected shot breaks one clasp.
6. After three successful reflects, the mask falls onto the ground.

When the mask falls:

* the screen briefly becomes silent
* the Dealer freezes
* there is still no visible face
* the boss becomes vulnerable
* the player must quickly attack before the Dealer retrieves the mask

After each damage phase, the Dealer attempts to recover the mask.

The final phase should require the player to kick or knock the mask away before landing the finishing attack.

---

# World 1-4: The Rain Kingdom

This level should be longer than the first three worlds.

## First section: England-inspired city

The player travels through a dark England-inspired environment.

Include:

* rain
* old streets
* brick buildings
* narrow rooftops
* clock towers
* iron fences
* dim streetlights
* stone bridges
* fog
* abandoned courtyards

The player eventually enters a sealed courtyard.

The courtyard locks behind them.

---

# World 1-4 Mini-Boss: The Scythebound

The mini-boss is called:

```text
THE SCYTHEBOUND
```

## Appearance

The Scythebound:

* is shirtless
* has long hair
* carries a large scythe
* moves quickly
* jumps around the arena
* swings and rotates the scythe around himself
* feels dangerous but readable

## Fight format

This is a full real-time platform encounter.

The arena remains locked until the boss is defeated.

The player cannot defeat him using normal attacks.

The player must stomp on him **15 times**.

Display a small bottom objective:

```text
STOMPS: 0 / 15
```

## Attacks

### Scythe sweep

He swings the scythe horizontally.

The player must jump over it.

### Overhead scythe strike

He jumps and drives the scythe downward.

The player should move away and then use the recovery window to stomp him.

### Spinning scythe

He spins while moving across the arena.

The player must use raised platforms or wall jumps.

### High leap

He leaps over the player and attempts to strike from behind.

### Scythe throw

He throws the scythe in a curved path before it returns.

## Stomp mechanic

The fight should be difficult enough to feel satisfying but easy enough for a portfolio visitor.

Each successful stomp should:

* make Abrar bounce upward
* briefly stun the boss
* increase the stomp counter
* produce a strong impact effect
* give the player enough control to avoid being immediately hit

Difficulty progression:

```text
Stomps 1–5: slower patterns
Stomps 6–10: faster jumps and sweeps
Stomps 11–14: spinning and thrown-scythe attacks
Stomp 15: cinematic finishing impact
```

The boss must not become unfair.

The player should quickly learn that the safe opportunity to stomp occurs after an overhead strike or failed leap.

After the fifteenth stomp, the Scythebound crashes through part of the courtyard and reveals the path forward.

---

# World 1-4 Second section: The Cathedral

After the mini-boss, the player continues through:

* graveyards
* ruined halls
* cathedral rooftops
* stained-glass chambers
* bell towers
* long interior corridors

The cathedral should feel beautiful, abandoned, and dangerous.

The player reaches the central cathedral chamber.

---

# World 1-4 Boss: The Veiled Archer

The boss is called:

```text
THE VEILED ARCHER
```

## Appearance

The Veiled Archer:

* is a woman wearing a hood
* keeps most of her face hidden
* uses a longbow
* moves rapidly between ledges
* attacks from a distance
* appears almost weightless
* uses pale, silver, or spectral arrows

## Arena

The cathedral arena contains:

* multiple platform heights
* stained-glass windows
* pillars
* chandeliers
* elevated ledges
* sections where arrows can become embedded and used as platforms

## Attacks

### Direct arrow

She targets the player with a visible line before releasing the arrow.

### Arrow rain

Multiple target circles appear on the floor.

Arrows fall from above after a short delay.

### Triple spread

She fires three arrows at different angles.

### Piercing arrow

A large arrow travels through platforms and pillars.

### Arrow trap

Arrows remain embedded in the ground and become temporary hazards.

### Backstep shot

When the player gets close, she jumps backward and fires.

### Cathedral volley

At lower health, she fires arrows throughout the arena while moving between ledges.

## Main weakness: Close distance

The Veiled Archer should be difficult to hit while she controls the arena from a distance.

The player must use her own arrows to reach her.

Recommended mechanic:

1. Selected arrows become embedded in walls or pillars.
2. Embedded arrows become temporary platforms.
3. The player jumps across the arrows.
4. The player reaches her elevated position.
5. She becomes vulnerable to a short melee combination.
6. She escapes to another ledge.
7. Repeat for three phases.

Parrying a glowing arrow should also briefly stun her.

The intended solution is to:

* avoid the arrow rain
* use embedded arrows as platforms
* close the distance
* attack before she escapes

After the final hit, she begins dissolving into light or particles.

---

# The absorption cutscene

After the Veiled Archer is defeated, remove player control temporarily.

There must be no dialogue.

Sequence:

1. The Veiled Archer begins dissolving.
2. The arena becomes quiet.
3. A mysterious swordsman walks in from the right side of the screen.
4. He approaches slowly.
5. He draws a sword.
6. He slashes through the dissolving Archer.
7. Her remaining energy is absorbed into him.
8. His body, sword, or eyes briefly transform.
9. He immediately turns and runs.

Return control to the player.

The player must chase him through a short cathedral escape sequence.

The chase should last approximately 30–45 seconds.

The player cannot catch him.

At the end:

1. The swordsman reaches an exterior ledge.
2. He jumps into the air.
3. A dark rift forms.
4. The environment distorts.
5. The swordsman tears through the world or disappears into the rift.
6. The level ends.
7. The overworld changes.
8. A new castle appears.
9. The Castle level unlocks.

No text explanation is required beyond:

```text
CASTLE UNLOCKED
```

---

# Final level: The Rift Castle

The castle should be a new location created by the mysterious swordsman.

The player travels through:

* a broken outer bridge
* castle walls
* weapon halls
* collapsing rooms
* vertical towers
* dark throne chambers
* areas distorted by the absorbed bosses
* a final approach to the throne room

The castle should reuse mechanics from earlier worlds in evolved forms:

* sword shockwaves from the Broken King
* giant hand hazards from the Hollow Giant
* reflected projectiles from the One-Eyed Dealer
* scythe sweeps from the Scythebound
* arrow rain from the Veiled Archer

Do not turn the castle into an excessively long gauntlet.

The castle section before the final boss should take approximately three minutes.

Place a checkpoint directly outside the final throne room.

---

# Final Boss: The Devil King

The mysterious swordsman is revealed visually to be the Devil King.

Do not use dialogue for the reveal.

The boss title appears:

```text
THE DEVIL KING
```

The Devil King should be an original design.

He should:

* retain the sword used during the Archer cutscene
* wear dark royal clothing or armor
* possess energy taken from previous bosses
* move quickly
* feel human-sized but extremely powerful
* transform during the second phase

The fight has two major phases.

---

# Devil King Phase One: The Sword

During the first phase, the Devil King uses only his sword.

The combat should feel like a direct duel.

## Attacks

### Quick slash

A fast close-range strike.

### Delayed slash

He raises the sword, pauses, and changes the timing to punish early dodges.

### Dash cut

He crosses the arena in a single fast slash.

### Air slash

He jumps and releases a diagonal energy blade.

### Sword wave

He creates a ground-level projectile.

### Counter stance

He briefly enters a stance that punishes careless attacks.

### Three-hit sequence

Two fast attacks followed by a delayed heavy strike.

## Intended strategy

The player must:

* avoid attacking during counter stance
* parry selected sword flashes
* attack during recovery
* dash behind the Devil King
* learn delayed timing

At approximately 50% total boss health, transition into phase two.

---

# Devil King Phase Two: The Arsenal

The Devil King absorbs all remaining energy and gains multiple weapons.

He uses:

* bow
* sword
* spear
* giant hammer

Each weapon should create a different combat style.

## Sword form

Fast melee attacks and parry-focused patterns.

## Bow form

Long-range arrow patterns inspired by the Veiled Archer.

Attacks include:

* direct arrow
* arrow rain
* spread shot
* delayed explosive arrow

## Spear form

Long-reaching thrust attacks.

Attacks include:

* forward thrust
* upward launch
* spinning spear
* spear planted into the ground to create energy lines

## Hammer form

Slow but extremely heavy attacks.

Attacks include:

* overhead slam
* ground shockwave
* arena-breaking strike
* falling debris
* delayed double slam

The Devil King should switch weapons visibly.

The player must recognize the active weapon and change tactics.

Suggested pattern:

```text
Sword → Bow → Spear → Hammer
```

After completing the sequence, he can switch weapons more rapidly.

## Final vulnerability

The Devil King’s weapon energy should come from the bosses he absorbed or defeated.

Each correctly handled weapon phase breaks one energy seal.

Examples:

```text
Parry the sword attack
Reflect or avoid the bow attack
Jump over the spear sweep
Stomp after the hammer becomes stuck
```

Breaking all four seals removes his protection.

The player then receives a final damage opportunity.

The final hit should be performed through normal player control, not a menu.

The Devil King collapses and dissolves.

---

# Key and ending

After the Devil King is defeated:

1. His weapons disappear.
2. The room becomes silent.
3. The Devil King dissolves.
4. A key falls onto the floor.
5. Player control returns.
6. The player must physically walk to the key.
7. The player presses `E`.
8. Display:

```text
ARCHIVE KEY ACQUIRED
```

A door opens behind the throne.

The player walks into the treasure room.

The treasure room contains the chest that connects to `/gallery`.

The player must physically walk to the chest and press `E`.

The chest reveals the development unlock code:

```text
INK-7F2A
```

Keep the code service asynchronous and structured so a server-generated code can replace the development code later.

Display:

```text
THE LOST KEY HAS BEEN RECOVERED

ARCHIVE CODE

INK-7F2A
```

Buttons:

```text
COPY CODE
RETURN TO THE ARCHIVE
RETURN TO OVERWORLD
```

`RETURN TO THE ARCHIVE` navigates to:

```text
/gallery
```

---

# No dialogue requirement

Do not add dialogue to:

* bosses
* level intros
* cutscenes
* the mysterious swordsman
* the Devil King
* NPCs
* environmental interactions

Do not reuse the existing dialogue scripts during the redesigned gameplay.

The only text currently allowed is:

* world names
* boss names
* controls
* HUD information
* objective counters
* short system messages
* key acquisition message
* archive code
* buttons

Leave clean technical seams so dialogue can be added later without rebuilding the encounters.

---

# Art requirements

All new art must remain:

* original
* code-generated
* pixel-art
* consistent with the existing palette and rendering system

Do not use copyrighted assets or recreate characters from:

* Undertale
* Mario
* Nintendo games
* existing casino games
* other commercial titles

The Broken King may be emotionally inspired by the idea of a tragic, powerful old king, but he must be visually and mechanically original.

Render every new boss sprite to PNG and visually inspect it before committing.

Bosses need readable animation states.

Minimum animation requirements:

```text
Idle
Move
Attack preparation
Attack
Recovery
Damage
Phase transition
Defeat
```

---

# Audio requirements

Replace turn-based battle tracks where necessary with real-time arena music.

Each boss should have a distinct theme.

The Devil King phase transition should change or transform the music.

Required sound cues:

* player attack
* stomp
* parry
* boss telegraph
* boss damage
* player damage
* weak-point exposure
* mask breaking
* truth seal activation
* heart strike
* weapon transformation
* key drop
* chest opening

Use only original or properly licensed audio.

---

# Accessibility and difficulty

The game should feel challenging but remain completable by someone who does not regularly play platform games.

Include:

* boss checkpoint retries
* no lives system
* wider parry-window option
* slower hazard option
* reduced flashing
* screen-shake toggle
* visible attack telegraphs
* mobile controls
* fullscreen support

After repeated boss failures, subtle assistance may activate:

* one extra heart
* slightly longer recovery windows
* slower projectiles
* larger parry window

Do not display a message saying the game became easier.

---

# Implementation sequence

## Phase 1: Plan amendment

Document the complete real-time combat redesign.

Identify which previous tasks and acceptance criteria are now obsolete.

Do not begin implementation until the amended plan clearly replaces turn-based bosses.

## Phase 2: Real-time framework

Build and test:

* player attacks
* boss hitboxes
* boss health
* damage
* parry
* stomp
* projectiles
* arena hazards
* restart behavior
* bottom action bar

Create a small internal test arena before rebuilding all worlds.

## Phase 3: World 1-1

Rebuild the city-to-temple level.

Implement the Broken King and Truth mechanic.

Browser-play the entire world.

## Phase 4: World 1-2

Rebuild the desert-to-underground level.

Implement the Hollow Giant and heart mechanic.

## Phase 5: World 1-3

Rebuild the Portugal-inspired coast and casino.

Implement the One-Eyed Dealer and mask mechanic.

## Phase 6: World 1-4

Build the England-inspired section.

Implement the Scythebound stomp fight.

Build the cathedral.

Implement the Veiled Archer.

Implement the absorption cutscene and unwinnable chase.

## Phase 7: Castle

Build the castle gauntlet.

Implement the two-phase Devil King.

Implement weapon transformations.

## Phase 8: Ending

Wire:

* key drop
* physical key pickup
* treasure room
* chest
* code service
* gallery navigation
* completion save state

## Phase 9: Final verification

Run:

```text
npx tsc --noEmit
npm test
npm run build
```

The existing repository-wide lint failure is pre-existing and is not the primary release gate unless the new code adds lint-specific regressions.

Use browser playtests and screenshots for:

* every world
* every boss
* every phase
* the chase
* the final key pickup
* the chest
* mobile layout
* pause and restart behavior

Remove all temporary teleport, damage, invincibility, and debug hooks before committing.

---

# Completion criteria

The redesign is complete only when:

1. The game contains no active turn-based combat.
2. Combat occurs through real-time movement and attacks.
3. Action controls appear at the bottom.
4. There are no dialogue boxes.
5. World 1-1 moves from a city into a temple environment.
6. The Broken King is defeated through the Truth mechanic.
7. World 1-2 moves from a desert underground.
8. The Hollow Giant is defeated by attacking its heart.
9. World 1-3 moves from a Portugal-inspired coast into a casino.
10. The One-Eyed Dealer is defeated by forcing off the mask.
11. World 1-4 contains the Scythebound mini-boss.
12. The Scythebound requires 15 stomps.
13. World 1-4 contains the cathedral and Veiled Archer.
14. The player reaches the Archer by using or navigating around her arrows.
15. The mysterious swordsman absorbs the Archer without dialogue.
16. The player chases the swordsman but cannot catch him.
17. The chase unlocks the Castle.
18. The Devil King uses a sword during phase one.
19. The Devil King uses a bow, sword, spear, and giant hammer during phase two.
20. The Devil King drops the Archive Key.
21. The player physically walks to and collects the key.
22. The player physically walks to and opens the chest.
23. The chest displays the gallery code.
24. Progress saves correctly.
25. Boss retries start directly before each boss.
26. The complete game remains under 30 minutes.
27. Every new asset is original and code-generated.
28. TypeScript, tests, and production build pass.
29. No temporary debug hooks remain.
30. Nothing is pushed to the remote repository.

The redesigned game should feel like a compact, mysterious action-platformer hidden inside the portfolio, with every boss requiring the player to understand a specific weakness instead of simply reducing a health bar.
