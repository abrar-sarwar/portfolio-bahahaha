"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import BackToTop from "@/components/BackToTop";
import VideoModal from "@/components/VideoModal";
import { TOTAL_ENTRIES } from "@/lib/chat";
import { useChat } from "./ChatContext";
import ChatConsole from "./ChatConsole";
import ChatPortrait, { type ChatPose } from "./ChatPortrait";
import ChatStage from "./ChatStage";

/**
 * The last panel of the feed, and the only place the chat lives. Three pieces,
 * one conversation:
 *   - the portrait, bottom-left, thinking while nothing's been asked, looking
 *     at you once an answer lands;
 *   - the stage, in the middle, the latest question and its reply, big,
 *     outside any box;
 *   - the console, at the bottom, the one box, where you type.
 */
export default function ChatSection({ onBackToTop }: { onBackToTop: () => void }) {
  const {
    messages,
    typing,
    discovered,
    video,
    closeVideo,
    sectionInView,
    setSectionInView,
    focusRequest,
    reduceMotion,
  } = useChat();
  const ref = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Tell the provider when this panel is on screen so effects and the
  // placeholder rotation only run while someone can see them.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const root = el.closest<HTMLElement>("[data-scroll-root]");
    const io = new IntersectionObserver(
      ([entry]) => setSectionInView(entry.isIntersecting),
      { root, threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      setSectionInView(false);
    };
  }, [setSectionInView]);

  useEffect(() => {
    if (sectionInView && focusRequest > 0) inputRef.current?.focus({ preventScroll: true });
  }, [focusRequest, sectionInView]);

  const asked = messages.some((m) => m.role === "user");
  const pose: ChatPose = asked && !typing ? "answer" : "idle";

  return (
    <section
      ref={ref}
      aria-labelledby="chat-heading"
      className="relative h-full w-full overflow-hidden bg-black text-white max-sm:h-auto max-sm:min-h-svh max-sm:overflow-visible"
    >
      {/* Ambient glow rising out of the corner the portrait stands in. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 0% 100%, rgba(124, 58, 237, 0.2), transparent 70%)",
        }}
      />

      <div className="relative flex h-full w-full flex-col max-sm:min-h-svh">
        <header className="relative z-10 flex shrink-0 items-start justify-between gap-6 px-6 pt-12 sm:px-12 sm:pt-14 lg:px-16">
          <div className="max-w-md">
            <p className="text-[10px] font-medium uppercase tracking-[0.34em]" style={{ color: "#c4b5fd" }}>
              talk to my portfolio
            </p>
            <h2
              id="chat-heading"
              className="mt-2 text-[30px] font-medium leading-[1.02] tracking-tight sm:text-[40px] lg:text-[48px]"
            >
              ask abrar something.
            </h2>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-4">
            <span
              className="font-mono text-[10px] tabular-nums text-white/35"
              title="easter eggs found"
              aria-label={`${discovered} of ${TOTAL_ENTRIES} easter eggs found`}
            >
              {discovered}
              <span className="text-white/20"> / </span>
              {TOTAL_ENTRIES}
            </span>
            <BackToTop onClick={onBackToTop} />
          </div>
        </header>

        {/* Stage, centered in the space to the right of the portrait. */}
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-6 py-6 max-sm:min-h-[38svh] sm:pl-[min(46vw,640px)] sm:pr-12 lg:pr-16">
          <ChatStage active={sectionInView} />
        </div>

        {/* Portrait, pinned bottom-left on desktop, in the flow on phones. */}
        <ChatPortrait pose={pose} reduceMotion={reduceMotion} />

        {/* Console, the box. */}
        <div className="relative z-10 shrink-0 px-6 pb-6 sm:pb-8 sm:pl-[min(46vw,640px)] sm:pr-12 lg:pr-16">
          <ChatConsole active={sectionInView} inputRef={inputRef} />
        </div>
      </div>

      {/* Clips play in the same popup the rest of the site uses. It closes
          itself when the clip ends, or on click / Esc. */}
      <AnimatePresence>
        {video && <VideoModal key={video.id} src={video.src} onClose={closeVideo} volume={0.8} />}
      </AnimatePresence>
    </section>
  );
}
