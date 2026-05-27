"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  src: string;
  onClose: () => void;
  volume?: number;
  credit?: string;
};

// dangerouslySetInnerHTML so the `muted` attribute lives in the DOM at parse
// time, preventing Safari's native play overlay. We then unmute and set the
// volume from a useEffect that runs inside the user's click gesture window.
function videoHtml(src: string): string {
  return `
    <video
      autoplay
      muted
      playsinline
      preload="auto"
      disablepictureinpicture
      class="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
    >
      <source src="${src}" type="video/mp4" />
    </video>
  `;
}

export default function VideoModal({
  src,
  onClose,
  volume = 0.5,
  credit,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // `started` flips on the video's `playing` event so the credit line only
  // appears once playback actually begins — matches the "once it's played"
  // intent of the credits.
  const [started, setStarted] = useState(false);

  // Memoize the innerHTML object so the dangerouslySetInnerHTML prop is
  // referentially stable across credit-state re-renders. Defensive — keeps
  // React's reconciler from ever re-running the innerHTML assignment, which
  // would tear down the <video> element and lose the un-muted state we set
  // imperatively below.
  const innerHtml = useMemo(() => ({ __html: videoHtml(src) }), [src]);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const v = c.querySelector<HTMLVideoElement>("video");
    if (!v) return;

    v.volume = volume;
    // Safari (especially mobile) sometimes skips initializing the <source>
    // when a video element arrives via innerHTML — networkState gets stuck
    // and videoWidth stays 0 even after the file is fully cached. An
    // explicit load() kicks the source-selection algorithm and is a no-op
    // when loading is already in progress.
    v.load();
    // Try unmuted first; we should have the click gesture context that opened
    // the modal. If the browser still refuses, fall back to silent playback.
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onEnded = () => onClose();
    const onPlaying = () => setStarted(true);
    document.addEventListener("keydown", onKey);
    v.addEventListener("ended", onEnded);
    v.addEventListener("playing", onPlaying);
    return () => {
      document.removeEventListener("keydown", onKey);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("playing", onPlaying);
    };
  }, [onClose, volume]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.08 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
    >
      {/* Video container — a normal flex item that shrinks to the video's
          intrinsic size. Originally used `display: contents` to flatten the
          wrapper, but mobile Safari refuses to actually fetch the video
          source when the immediate parent is `display: contents`. */}
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center"
        dangerouslySetInnerHTML={innerHtml}
      />

      {/* Credit — absolutely positioned at the bottom of the backdrop so it
          never touches the video container or the layout flow above. */}
      {credit && (
        <div className="pointer-events-none absolute bottom-[6vh] left-1/2 -translate-x-1/2">
          <AnimatePresence>
            {started && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.32em] text-white/65"
                style={{ textShadow: "0 0 10px rgba(0,0,0,0.6)" }}
              >
                video made by {credit}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
