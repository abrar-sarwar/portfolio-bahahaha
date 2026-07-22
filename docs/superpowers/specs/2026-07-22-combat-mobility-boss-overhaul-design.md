# Combat, Mobility, and Boss Overhaul Design

## Goal

Turn Abrar into a fast, sword-first action-platforming character with readable defensive timing, four distinct abilities, a once-per-level demon ultimate, and boss encounters that move aggressively without dealing unexplained damage.

## Chosen Direction

Use one shared player-ability runtime across platform levels, the castle chase, and boss arenas. This avoids maintaining separate versions of attack damage, cooldowns, invulnerability, and effects. Boss-specific rules remain inside each boss mechanics module, while shared telegraph and contact safety stay in the arena framework.

Two alternatives were rejected:

- Adding each ability independently to every scene would duplicate timing and collision rules and make balance drift inevitable.
- Replacing the current combat framework wholesale would expand the work beyond the requested changes and risk the completed progression systems.

## Player Controls and Combat

Keyboard controls are:

| Key | Action |
| --- | --- |
| A/D or arrows | Move |
| Shift, held | Run |
| Space/W/Up | Jump and air jump |
| J/X | Heavy sword attack |
| K/C | Parry |
| R | Rift swing |
| F | Invulnerable slash rush |
| Z | Stunning sword wave |
| Q | Demon form |
| E | Interact |

Shift no longer fires a discrete dash. Walking remains 150 px/s and running is 240 px/s. Run works anywhere normal horizontal movement works and stops immediately when Shift is released.

The normal sword becomes a clearly visible oversized blade attached to the player sprite. Its swing has a larger reach and hitbox, deals 5 boss damage before POWER bonuses, and deals 3 damage to ordinary enemies. The animation and hit effect must match the active collision window.

Parry uses a 280 ms base stance with a 380 ms whiff commitment. A successful parry consumes the incoming hit, creates a stronger gold ring and brief freeze, and staggers parryable boss attacks. Unparryable attacks retain a red warning. Body overlap by itself never counts as a boss attack; only an armed attack zone, projectile, hazard, or rejected stomp can damage the player.

## Abilities

The shared ability controller owns timing, charges, cooldowns, invulnerability, damage multipliers, and the UI snapshot. It exposes pure timing/state helpers for headless tests and thin Phaser callbacks for movement, collision, and effects.

### R — Rift Swing

R launches Abrar toward a temporary anchor above and ahead of his facing direction. It applies 310 px/s horizontal and -230 px/s vertical velocity, draws a short violet tether, and permits two uses before touching the ground. Landing refills both charges. It does not grant invulnerability or damage enemies.

### F — Slash Rush

F drives Abrar forward at 430 px/s for 240 ms. During the rush, ordinary damage is ignored. A wide blade trail damages each target at most once: 7 boss damage or 4 ordinary-enemy damage. The cooldown is 2.4 seconds and starts on activation. World solids stop the rush.

### Z — Sword Wave

Z fires a visible crescent in the facing direction at 380 px/s for up to 1.35 seconds. It deals 4 boss damage or 3 ordinary-enemy damage and stuns for 900 ms. Boss stun is represented by a forced stagger; normal enemies stop moving, lose touch damage, show stun stars, and recover afterward unless defeated. The cooldown is 3.6 seconds.

### Q — Demon Form

Q can activate once per level run. It lasts 30 seconds, grants complete damage immunity, multiplies horizontal movement speed by 1.6, and multiplies player sword/ability damage by 2. Demon form uses a black-crimson player treatment with horns, a pulsing aura, and a restrained trail. The form ends automatically, clears all temporary visuals and modifiers, and remains spent until the level run resets.

The ultimate state is carried through the World 1-4 mini-boss handoff and from a level into its boss arena so scene transitions cannot grant a second use. A death/restart begins a new run and restores Q.

## HUD and Touch Controls

The desktop action bar replaces DASH with RUN and adds compact R, F, Z, and Q slots. R displays charges; F and Z display cooldown fills; Q displays READY, a draining active fill, or SPENT.

A demon-seal meter sits directly below the hearts. It is a narrow crimson segmented bar with a horned end-cap, not a generic progress rectangle. It glows when Q is ready, drains across the 30-second form, and becomes a dark broken seal after use.

Touch controls replace the dash button with a hold-to-run button. R/F/Z/Q receive compact action buttons above the existing attack/parry row. All buttons retain readable labels and at least 44 px touch targets without covering the player.

## Boss Redesigns

### The One-Eyed Dealer

Bullets slow from 240 to 190 px/s. Before a glowing parryable shot, the gun, aim line, and a concentric gold reticle pulse for the last 320 ms of the telegraph; ordinary shots remain magenta/red. The Dealer strafes during idle and recovery, periodically changes his preferred side, and keeps distance rather than waiting in place. Teleports remain part of his attack pool.

### The Scythebound

Remove objective-only immunity, the hidden health bar, and the fifteen-stomp counter. The Scythebound has 55 HP and takes normal sword, ability, and stomp damage. Sword hits are the main route; stomps remain a higher-risk bonus.

He patrols assertively during idle and recovery, closes distance when far away, and circles away when crowded. Sweep, leap, spin, throw, and overhead attacks remain, with phases at 65% and 30% HP. Recovery windows are punishable and every movement attack remains bounded by the arena walls. The standard boss health bar is always visible.

### The Veiled Archer

Replace the 46-tile pillar chamber with a 34-tile open nave: flat main floor, two low side ledges, and no tall solid columns. Remove the arrow-stair requirement and permanent armor. She has 35 HP and takes normal attacks.

After taking a hit, she backsteps or vanishes to the farthest safe perch with a short reappearance tell. She continues to use direct, spread, rain, piercing, trap, and volley attacks while moving freely. Glowing arrows remain parryable and reward a brief stagger rather than creating required platforms.

### Castle Chase

Completing World 1-4 unlocks the castle directly. The transformed swordsman escapes from the Archer aftermath, but the playable chase begins after the player enters the castle. The chase is a castle-interior corridor using castle art, moving gates, collapsing bridges, low hazards, and short platform changes.

The runner periodically turns and sends a clearly telegraphed low sword wave toward the player. The player can jump over it or parry it. Later waves appear in pairs with safe spacing. Hits cost one heart and briefly slow the player; the runner never wins through invisible proximity. Finishing the chase resumes the castle level beyond the entry corridor, before the Devil King path.

### The Devil King

Disable passive body-contact damage. Every damaging close-range action must own an enabled attack zone, and projectile/hazard attacks must suppress that zone.

All parryable attacks receive at least 620 ms of effective warning and the shared gold pulse. A directional blade-line preview shows the future reach before quick slash, delayed slash, dash cut, spear thrust, and three-hit. Long-range attacks keep their existing path previews or hazard markers. The King deliberately repositions during idle/recovery to maintain a 90–170 px duel distance, preventing the fight from collapsing into constant body overlap.

Parryable sword and spear attacks can be parried from their visible attack reach; the player does not need to touch the King. Active hitboxes match the displayed blade line and stop dealing damage when the active window ends.

## Progression and Routing

Archer victory marks World 1-4 complete and unlocks the castle instead of immediately starting the chase. Entering a fresh castle run starts the castle chase. Chase completion resumes the castle map at a checkpoint after the entrance sequence. Re-entering the castle after the chase has been cleared in the current run resumes the normal castle level.

The ability runtime carries POWER stacks and ultimate-used state through mid-boss and boss route data. Existing saves remain compatible because the chase-run flag is session-scoped and no durable save schema change is required.

## Error and Lifecycle Handling

- Every ability refuses activation when dead, paused, already active where mutually exclusive, out of charges, cooling down, or spent.
- Scene shutdown destroys tethers, trails, waves, auras, timers, colliders, and store state.
- Damage immunity is queried at the shared player damage boundary, so F and Q protect against melee zones, projectiles, hazards, and contact consistently.
- Target-hit sets are scoped per swing, rush, or wave, preventing multi-frame overlap from multiplying damage.
- Boss movement clamps to arena bounds and cancels movement tweens on stagger, phase transition, defeat, and shutdown.

## Testing and Verification

Pure tests cover input edge/held behavior, run speed selection, R charge refill, F/Z cooldowns, Q once-per-run timing, damage/invulnerability calculations, stun duration, boss-contact safety, boss tuning, chase wave cadence, and route transitions.

Integration-level tests cover boss definitions and arenas. Existing full Vitest, TypeScript, lint, and production-build checks must pass. Browser playtesting verifies keyboard and touch controls, ability visuals, arena geometry, telegraph readability, chase routing, shutdown cleanup, and the complete Archer-to-castle-to-Devil progression.
