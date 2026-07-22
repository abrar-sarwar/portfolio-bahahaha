export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const TILE = 16;
export const ZOOM = 2;

export const PHYSICS = {
  gravity: 1400,
  moveSpeed: 150,
  runSpeed: 240,
  jumpVelocity: -360,
  doubleJumpVelocity: -330, // one air jump per airtime (dodge tool vs boss sweeps)
  coyoteMs: 100,
  jumpBufferMs: 120,
  dashSpeed: 320,
  dashMs: 160,
  dashCooldownMs: 450,
} as const;

export const PLAYER_BASE = {
  maxHealth: 10, // balance amendments: 6→8→10; independent sim with verbatim boss defs showed 8 HP still unwinnable for average play vs 3-damage bosses
  attack: 2,
  defense: 1,
  focus: 1,
  parryWindowMs: 220,
  perfectParryMs: 90,
  typingPower: 1,
} as const;

export const SAVE_KEY = "adventure-save-v1";
export const GALLERY_KEY = "gallery-unlocked-v1";
