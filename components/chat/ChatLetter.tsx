"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { ChatLetter as ChatLetterModel } from "@/lib/chat";

type Props = {
  letter: ChatLetterModel;
  reduceMotion: boolean;
  /** Called once, when the sequence has run its course. */
  onDone: () => void;
};

/**
 * The letter. Everything else goes dark, the portrait changes, the track
 * plays, and the lines arrive one at a time and stay. There is no close
 * button, Escape does nothing, and the feed underneath will not scroll.
 *
 * The schedule runs on timers rather than on the audio element's events. If
 * the track never loads — offline, blocked, a bad path — the lines still land
 * and the sequence still ends, so nobody is ever stuck behind a silent screen.
 *
 * It renders into <body> through a portal. The feed panels are GSAP-transformed
 * while scrolling, and a transformed ancestor turns `position: fixed` into
 * something anchored to the panel instead of the viewport.
 */
export default function ChatLetter({ letter, reduceMotion, onDone }: Props) {
  const [shown, setShown] = useState(0);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // --- the track -----------------------------------------------------------
  useEffect(() => {
    // Typing the trigger counts as a user gesture, so this is allowed to make
    // sound. If the browser refuses anyway, the sequence plays on in silence.
    const audio = new Audio(letter.audio);
    audio.volume = 0.85;
    void audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [letter.audio]);

  // --- the schedule --------------------------------------------------------
  useEffect(() => {
    const timers = letter.lines.map((line, i) =>
      window.setTimeout(() => setShown((n) => Math.max(n, i + 1)), Math.max(0, line.at * 1000)),
    );
    const finish = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onDoneRef.current();
    }, Math.max(1000, letter.duration * 1000));
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(finish);
    };
  }, [letter]);

  // --- no leaving ----------------------------------------------------------
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-scroll-root]");
    const prevRoot = root?.style.overflow ?? "";
    const prevBody = document.body.style.overflow;
    if (root) root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    // Swallow the keys that would scroll away or dismiss. Everything else
    // (tab, devtools, the browser's own chrome) is left alone on purpose.
    const BLOCKED = new Set([
      "Escape",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      " ",
      "Spacebar",
    ]);
    const onKey = (e: KeyboardEvent) => {
      if (!BLOCKED.has(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);

    return () => {
      if (root) root.style.overflow = prevRoot;
      document.body.style.overflow = prevBody;
      window.removeEventListener("keydown", onKey, true);
    };
  }, []);

  const block = (e: React.SyntheticEvent) => e.preventDefault();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="a letter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 1.1, ease: "easeOut" }}
      onWheel={block}
      onTouchMove={block}
      className="chat-letter fixed inset-0 z-[90] select-none overflow-hidden"
    >
      {/* The dim. Near-black, with the room's light left low in the corner
          the portrait stands in. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/92"
        style={{
          background:
            "radial-gradient(65% 60% at 0% 100%, rgba(30, 16, 54, 0.92), rgba(0,0,0,0.965) 62%), rgba(0,0,0,0.955)",
        }}
      />

      {/* Ren, standing where the portrait stands. */}
      <motion.img
        src={letter.portrait}
        alt=""
        aria-hidden
        draggable={false}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="chat-letter-portrait absolute bottom-0 left-0 h-[min(52svh,460px)] w-auto max-w-none object-contain max-sm:h-[min(30svh,240px)]"
      />

      {/* The lines. */}
      <div className="absolute inset-0 flex items-center justify-center px-6 sm:pl-[min(44vw,600px)] sm:pr-12 lg:pr-16">
        <div
          className="chat-letter-scroll flex w-full max-w-xl flex-col gap-3 overflow-y-auto py-6 sm:gap-3.5"
          style={{ maxHeight: "78svh" }}
          aria-live="polite"
        >
          {letter.lines.slice(0, shown).map((line, i) => (
            <LetterLine key={i} text={line.text} reduceMotion={reduceMotion} />
          ))}
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}

/** Pops in, then types itself out, then stays. */
function LetterLine({ text, reduceMotion }: { text: string; reduceMotion: boolean }) {
  const [n, setN] = useState(reduceMotion ? text.length : 0);

  useEffect(() => {
    if (reduceMotion || n >= text.length) return;
    const id = window.setTimeout(() => setN((c) => c + 1), 34);
    return () => window.clearTimeout(id);
  }, [n, text, reduceMotion]);

  return (
    <motion.p
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.965 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0.2 }
          : { type: "spring", stiffness: 300, damping: 22, mass: 0.7 }
      }
      className="chat-letter-line"
    >
      {text.slice(0, n)}
      {n < text.length && <span className="chat-cursor" aria-hidden />}
    </motion.p>
  );
}
