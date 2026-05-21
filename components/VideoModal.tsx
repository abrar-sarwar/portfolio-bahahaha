"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

type Props = {
  src: string;
  onClose: () => void;
  volume?: number;
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

export default function VideoModal({ src, onClose, volume = 0.5 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const v = c.querySelector<HTMLVideoElement>("video");
    if (!v) return;

    v.volume = volume;
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
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, volume]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="contents"
        dangerouslySetInnerHTML={{ __html: videoHtml(src) }}
      />
    </motion.div>
  );
}
