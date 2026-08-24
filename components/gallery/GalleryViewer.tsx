"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import FlippablePhoto from "./FlippablePhoto";
import { GALLERY_PHOTOS } from "@/lib/gallery";

type Props = {
  /** Id of the photo to show. */
  photoId: string;
  onClose: () => void;
  onChange: (id: string) => void;
  reduceMotion: boolean;
};

/**
 * Focused photo viewer.
 *
 * Follows the conventions already set by VideoModal: a fixed black backdrop
 * with a blur, framer-motion fade in/out, Escape to close, and click-outside to
 * dismiss. On top of that it adds photo-to-photo stepping, a flip control, a
 * focus trap, and a scroll lock on the feed's scroll container (the feed
 * scrolls a div, not the document, so locking <body> alone would do nothing).
 */
export default function GalleryViewer({
  photoId,
  onClose,
  onChange,
  reduceMotion,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Element that had focus before opening, so we can hand it back on close.
  const restoreRef = useRef<HTMLElement | null>(null);

  const index = GALLERY_PHOTOS.findIndex((p) => p.id === photoId);
  const photo = index >= 0 ? GALLERY_PHOTOS[index] : undefined;

  const step = useCallback(
    (delta: number) => {
      if (index < 0) return;
      const next =
        (index + delta + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length;
      setFlipped(false);
      onChange(GALLERY_PHOTOS[next].id);
    },
    [index, onChange],
  );

  // Reset the card whenever a different photo is shown.
  useEffect(() => {
    setFlipped(false);
  }, [photoId]);

  // Lock scrolling on the feed's scroller (and the document, for the standalone
  // case) while the viewer is open, then restore exactly what was there before.
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>("[data-scroll-root]");
    const previous = scroller?.style.overflow ?? "";
    if (scroller) scroller.style.overflow = "hidden";
    const previousBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      if (scroller) scroller.style.overflow = previous;
      document.body.style.overflow = previousBody;
    };
  }, []);

  // Focus management: remember what was focused, move focus into the dialog,
  // trap Tab inside it, and restore on unmount.
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => restoreRef.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
        return;
      }
      if (e.key !== "Tab") return;

      const root = dialogRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  if (!photo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 px-4 py-16 backdrop-blur-md sm:px-10"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={photo.alt}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full flex-col items-center gap-5"
      >
        <FlippablePhoto
          photo={photo}
          flipped={flipped}
          onToggle={() => setFlipped((v) => !v)}
          reduceMotion={reduceMotion}
        />

        {/* Controls. Flip is the primary action; stepping and close sit beside
            it. All are real buttons so the focus trap and keyboard work. */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous photo"
            className="journal-control"
          >
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setFlipped((v) => !v)}
            aria-pressed={flipped}
            className="journal-control journal-control--primary"
          >
            <svg
              aria-hidden
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2" />
              <path d="M18 3.2v3.1h-3.1M6 20.8v-3.1h3.1" />
            </svg>
            {flipped ? "Flip back" : "Flip photo"}
          </button>

          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next photo"
            className="journal-control"
          >
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">
          {index + 1} / {GALLERY_PHOTOS.length}
        </p>
      </div>

      {/* Close — fixed to the corner so it is always reachable, including on a
          phone where the card fills most of the screen. */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close photo viewer"
        className="journal-close"
      >
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </motion.div>
  );
}
