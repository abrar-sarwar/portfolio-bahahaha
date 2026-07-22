export interface InputSnapshot {
  left: boolean; right: boolean;
  jumpHeld: boolean; jumpPressed: boolean;
  runHeld: boolean;
  dashPressed: boolean; attackPressed: boolean; parryPressed: boolean;
  grapplePressed: boolean; slashRushPressed: boolean;
  swordWavePressed: boolean; ultimatePressed: boolean;
  interactPressed: boolean; interactHeld: boolean; pausePressed: boolean;
}

export function emptyInputSnapshot(): InputSnapshot {
  return {
    left: false, right: false, jumpHeld: false, jumpPressed: false,
    runHeld: false, dashPressed: false, attackPressed: false, parryPressed: false,
    grapplePressed: false, slashRushPressed: false,
    swordWavePressed: false, ultimatePressed: false,
    interactPressed: false, interactHeld: false, pausePressed: false,
  };
}

export function reduceInputKey(
  snapshot: InputSnapshot,
  code: string,
  isDown: boolean,
  repeat: boolean,
): InputSnapshot {
  if (repeat) return snapshot;
  const next = { ...snapshot };
  switch (code) {
    case "ArrowLeft": case "KeyA": next.left = isDown; break;
    case "ArrowRight": case "KeyD": next.right = isDown; break;
    case "Space": case "ArrowUp": case "KeyW":
      next.jumpHeld = isDown;
      if (isDown) next.jumpPressed = true;
      break;
    case "ShiftLeft": case "ShiftRight": next.runHeld = isDown; break;
    case "KeyJ": case "KeyX": if (isDown) next.attackPressed = true; break;
    case "KeyK": case "KeyC": if (isDown) next.parryPressed = true; break;
    case "KeyR": if (isDown) next.grapplePressed = true; break;
    case "KeyF": if (isDown) next.slashRushPressed = true; break;
    case "KeyZ": if (isDown) next.swordWavePressed = true; break;
    case "KeyQ": if (isDown) next.ultimatePressed = true; break;
    case "KeyE":
      next.interactHeld = isDown;
      if (isDown) next.interactPressed = true;
      break;
    case "KeyP": case "Escape": if (isDown) next.pausePressed = true; break;
  }
  return next;
}

class Input {
  private s: InputSnapshot = emptyInputSnapshot();

  attachKeyboard() {
    const down = (e: KeyboardEvent) => this.onKey(e.code, true, e.repeat);
    const up = (e: KeyboardEvent) => this.onKey(e.code, false, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }

  private onKey(code: string, isDown: boolean, repeat: boolean) {
    this.s = reduceInputKey(this.s, code, isDown, repeat);
  }

  /** Virtual buttons (Task 27) call these. */
  setHeld(k: "left" | "right" | "jumpHeld" | "runHeld" | "interactHeld", v: boolean) { this.s[k] = v; }
  press(k: "jumpPressed" | "dashPressed" | "attackPressed" | "parryPressed" | "grapplePressed" | "slashRushPressed" | "swordWavePressed" | "ultimatePressed" | "interactPressed" | "pausePressed") { this.s[k] = true; }

  read(): InputSnapshot { return { ...this.s }; }
  consume() {
    this.s.jumpPressed = false; this.s.dashPressed = false;
    this.s.attackPressed = false; this.s.parryPressed = false;
    this.s.grapplePressed = false; this.s.slashRushPressed = false;
    this.s.swordWavePressed = false; this.s.ultimatePressed = false;
    this.s.interactPressed = false; this.s.pausePressed = false;
  }
}

export const input = new Input();
