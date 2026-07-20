"use client";

import { useEffect, useRef } from "react";

interface CountdownBarProps {
  /** Total shrink duration in ms — the CSS transition length. */
  durationMs: number;
}

// Shrinking countdown bar (100% → 0%) for timed prompts (TypingBox,
// TimedPrompt's ChoiceButtons). Driven by a CSS width transition that starts
// in a mount-time effect rather than a ref callback: a ref callback re-fires
// on every re-render (each keystroke, each store update), and re-triggering
// "start at 100%, transition to 0%" from scratch resets the bar to full every
// time — the countdown visually never progresses. An effect only re-runs
// when its deps change, so it fires exactly once per mount.
//
// The effect uses a double requestAnimationFrame: writing width:100% and
// then immediately writing width:0% with a transition in the SAME task can
// let the browser coalesce both style writes into a single layout/paint, so
// the 100%→0% transition never visibly starts from 100%. The first rAF runs
// before the next paint (too early — the 100% write may not have committed
// yet); the second rAF runs after a full frame has committed the initial
// width, so the transition to 0% is guaranteed to animate from a painted
// 100%.
//
// Callers must `key` this component per-prompt (e.g. `key={promptKey}`) so a
// new prompt with the same durationMs still remounts (and restarts) the bar.
export default function CountdownBar({ durationMs }: CountdownBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.width = "100%";
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        el.style.transition = `width ${durationMs}ms linear`;
        el.style.width = "0%";
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [durationMs]);

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
      <div ref={barRef} className="h-full bg-violet-300" style={{ width: "0%" }} />
    </div>
  );
}
