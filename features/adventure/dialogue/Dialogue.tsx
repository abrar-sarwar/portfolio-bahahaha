"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../bridge/GameStore";
import { advanceDialogue, closeDialogue } from "./dialogueController";
import { charsVisible, TYPEWRITER_CPS } from "./typewriter";
import { audio } from "../audio/synth";

// Bottom-anchored typewriter dialogue overlay. Renders entirely from
// gameStore.dialogue (see GameStore.ts / dialogueController.ts) — a single
// generic panel reused for level intros, memory-fragment notes, and boss
// intro/defeat lines (Overlay.tsx mounts it for the Level scene; CombatPanel
// mounts it in place of the action menu / victory panel while combat is
// active — see each for why it isn't just always-mounted at the app root).
//
// Input: click/tap anywhere on the panel, or E/Space/Enter, either completes
// the current line instantly (if it's still typing) or advances to the next
// line (if it already finished) — a second press within the same line after
// completion advances. SKIP ends the whole script immediately from any
// point.
export default function Dialogue() {
  const dialogue = useGameStore((s) => s.dialogue);
  // Keys the typewriter restart on: a new script, or advancing to a new line
  // within the same script. `line` alone isn't enough — two different
  // scripts can both be sitting on line 0 back-to-back (e.g. defeat lines
  // opening right after an intro closes) and must still restart the reveal.
  const lineKey = dialogue ? `${dialogue.id}:${dialogue.line}` : null;
  const [visible, setVisible] = useState(0);
  const lineCompleteRef = useRef(false);

  // Typewriter loop: reveals characters via rAF (real elapsed time, so it's
  // frame-rate independent and immune to a throttled background tab) rather
  // than a fixed-tick interval. Restarts from 0 chars whenever lineKey
  // changes.
  useEffect(() => {
    if (!dialogue) return;
    const line = dialogue.lines[dialogue.line] ?? "";
    lineCompleteRef.current = false;
    setVisible(0);
    const startedAt = performance.now();
    let raf = 0;
    const loop = () => {
      const n = charsVisible(performance.now() - startedAt, TYPEWRITER_CPS, line);
      setVisible(n);
      if (n >= line.length) {
        lineCompleteRef.current = true;
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineKey]);

  const advance = () => {
    if (!dialogue) return;
    const line = dialogue.lines[dialogue.line] ?? "";
    if (!lineCompleteRef.current) {
      // First press mid-type: reveal the rest of the line instantly instead
      // of advancing.
      lineCompleteRef.current = true;
      setVisible(line.length);
      return;
    }
    audio.sfx("select");
    advanceDialogue();
  };

  const skip = () => {
    audio.sfx("select");
    closeDialogue();
  };

  // Click/tap/E/Space/Enter = complete-or-advance, mirroring TimedPrompt's
  // pattern of a dedicated window listener rather than reusing the
  // platformer's `input` singleton (which this panel must NOT drive).
  useEffect(() => {
    if (!dialogue) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue?.id, dialogue?.line]);

  if (!dialogue) return null;
  const line = dialogue.lines[dialogue.line] ?? "";
  const shown = line.slice(0, visible);
  const lineComplete = visible >= line.length;
  const isLast = dialogue.line + 1 >= dialogue.lines.length;

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 flex justify-center p-3 font-mono sm:p-4"
      onPointerDown={(e) => {
        e.preventDefault();
        advance();
      }}
    >
      <div className="relative w-full max-w-lg rounded-sm border border-violet-300/50 bg-black/80 px-4 py-3 shadow-[0_0_28px_rgba(167,139,250,0.4)]">
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            skip();
          }}
          className="pointer-events-auto absolute right-2 top-2 min-h-[32px] rounded-sm border border-violet-300/40 bg-black/60 px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-violet-200 transition-colors hover:border-violet-200/80 hover:bg-violet-500/20"
        >
          Skip
        </button>
        <div className="min-h-[3.5em] pr-14 text-[13px] leading-relaxed text-violet-50">
          {shown}
          {!lineComplete && <span className="text-violet-300">▌</span>}
        </div>
        <div className="mt-1 text-right text-[9px] uppercase tracking-[0.2em] text-violet-300/60">
          {!lineComplete ? "…" : isLast ? "▼ close" : "▼ continue"}
        </div>
      </div>
    </div>
  );
}
