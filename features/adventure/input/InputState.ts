export interface InputSnapshot {
  left: boolean; right: boolean;
  jumpHeld: boolean; jumpPressed: boolean;
  dashPressed: boolean; attackPressed: boolean; parryPressed: boolean;
  interactPressed: boolean; interactHeld: boolean; pausePressed: boolean;
}

class Input {
  private s: InputSnapshot = {
    left: false, right: false, jumpHeld: false, jumpPressed: false,
    dashPressed: false, attackPressed: false, parryPressed: false,
    interactPressed: false, interactHeld: false, pausePressed: false,
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
      case "KeyK": case "KeyC": if (isDown) this.s.parryPressed = true; break;
      case "KeyE":
        this.s.interactHeld = isDown; // held state drives mechanic E-holds (Task 33)
        if (isDown) this.s.interactPressed = true;
        break;
      case "KeyP": case "Escape": if (isDown) this.s.pausePressed = true; break;
    }
  }

  /** Virtual buttons (Task 27) call these. */
  setHeld(k: "left" | "right" | "jumpHeld" | "interactHeld", v: boolean) { this.s[k] = v; }
  press(k: "jumpPressed" | "dashPressed" | "attackPressed" | "parryPressed" | "interactPressed" | "pausePressed") { this.s[k] = true; }

  read(): InputSnapshot { return { ...this.s }; }
  consume() {
    this.s.jumpPressed = false; this.s.dashPressed = false;
    this.s.attackPressed = false; this.s.parryPressed = false;
    this.s.interactPressed = false; this.s.pausePressed = false;
  }
}

export const input = new Input();
