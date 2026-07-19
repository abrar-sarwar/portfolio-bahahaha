"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gradeTyping } from "../combat/typing";
import { dispatchCombat } from "../combat/controller";
import { audio } from "../audio/synth";

interface TypingBoxProps {
  /** The command to type (verbatim target). */
  text: string;
  /** What to show the player (may differ from `text` for corrupted prompts). */
  display: string;
  timeLimitMs: number;
}

// Real text input for COMMAND / scripted-restore steps. Autofocuses (summons
// the mobile keyboard), Enter submits, and a CSS-transition timer bar shrinks
// 100%→0 over timeLimitMs. The grade is computed from the real elapsed time.
export default function TypingBox({ text, display, timeLimitMs }: TypingBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAt = useMemo(() => performance.now(), []);
  const [typed, setTyped] = useState("");
  const submitted = useRef(false);
  // A key that resets the timer bar animation when the prompt changes.
  const promptKey = `${display}:${timeLimitMs}`;

  useEffect(() => {
    submitted.current = false;
    setTyped("");
    inputRef.current?.focus();
  }, [promptKey]);

  const submit = () => {
    if (submitted.current) return;
    submitted.current = true;
    const elapsed = performance.now() - startedAt;
    const grade = gradeTyping(text, typed, elapsed, timeLimitMs);
    audio.sfx(grade === "incorrect" ? "error" : "type");
    dispatchCombat({ type: "typing-result", grade });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[9px] uppercase tracking-[0.25em] text-violet-200/80">Type the command</div>
      <div className="rounded-sm border border-violet-300/40 bg-black/60 px-2 py-1 font-mono text-[13px] text-violet-100 shadow-[0_0_20px_rgba(167,139,250,0.3)]">
        {display}
      </div>
      <input
        ref={inputRef}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Type the command"
        className="min-h-[44px] w-full rounded-sm border border-violet-300/40 bg-black/70 px-2 font-mono text-[14px] text-white caret-violet-300 outline-none focus:border-violet-200/80 focus:shadow-[0_0_16px_rgba(167,139,250,0.4)]"
      />
      {/* shrinking timer bar — pure CSS transition, no rAF */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          key={promptKey}
          className="h-full bg-violet-300"
          style={{ width: "0%", transition: `width ${timeLimitMs}ms linear`, animation: "none" }}
          ref={(el) => {
            if (!el) return;
            // Start at full width, then let the transition drive it to 0.
            el.style.width = "100%";
            requestAnimationFrame(() => {
              el.style.width = "0%";
            });
          }}
        />
      </div>
    </div>
  );
}
