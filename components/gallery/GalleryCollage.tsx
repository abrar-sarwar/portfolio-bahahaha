"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GALLERY_PHOTOS,
  INTRO_PHOTO,
  INTRO_SPIN_MS,
  columnSpan,
  type GalleryPhoto,
} from "@/lib/gallery";

type Props = {
  /** Rendered above the collage, inside the same screen. */
  header: React.ReactNode;
  onOpen: (id: string) => void;
  reduceMotion: boolean;
};

/** Where each photo flies in from, in pixels. */
const ENTRY: Record<GalleryPhoto["layout"]["from"], { x: number; y: number }> = {
  left: { x: -150, y: 30 },
  right: { x: 150, y: 30 },
  top: { x: 0, y: -140 },
  bottom: { x: 0, y: 140 },
};

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const tileVariants = {
  hidden: (photo: GalleryPhoto) => ({
    opacity: 0,
    scale: 0.6,
    x: ENTRY[photo.layout.from].x,
    y: ENTRY[photo.layout.from].y,
    rotate:
      photo.layout.from === "left" ? -12 : photo.layout.from === "right" ? 12 : -7,
  }),
  visible: (photo: GalleryPhoto) => ({
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    rotate: photo.layout.rotate,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/**
 * The Gallery, as one screen.
 *
 * Arriving at the section starts a short sequence on a timer, not on scroll:
 * `ohhellnaw` drops into the middle, turns over, holds for five seconds, then
 * leaves — and the collage of the remaining fourteen photographs flies in and
 * settles. Everything lives on that single screen; there is nothing further
 * down to scroll for.
 *
 * This is deliberately Framer Motion rather than GSAP. The animation is
 * time-based and triggered once when the section comes into view, which is
 * exactly what Framer's variants and AnimatePresence already do — a scrubbed
 * GSAP timeline would be the wrong tool for something that isn't tied to the
 * scroll position at all. Framer Motion is already a dependency of this project.
 */
export default function GalleryCollage({
  header,
  onOpen,
  reduceMotion,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"waiting" | "intro" | "collage">(
    // Reduced motion skips the whole performance and shows the finished screen.
    reduceMotion ? "collage" : "waiting",
  );

  // Start the sequence the first time the section is actually on screen. The
  // feed scrolls a div rather than the document, so the observer has to watch
  // that element — with the default root nothing would ever intersect.
  useEffect(() => {
    if (reduceMotion) return;
    const el = rootRef.current;
    if (!el) return;
    const root = document.querySelector<HTMLElement>("[data-scroll-root]");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase("intro");
          io.disconnect();
        }
      },
      { root, threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion]);

  // The photo leaves as soon as it has finished turning over — no dead hold in
  // the middle where it just sits there. The timer and the rotation read the
  // same constant so they can never drift apart.
  useEffect(() => {
    if (phase !== "intro") return;
    const timer = setTimeout(() => setPhase("collage"), INTRO_SPIN_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div
      ref={rootRef}
      className="relative flex h-full w-full flex-col overflow-hidden px-4 pb-5 pt-12 sm:px-8 sm:pb-10 sm:pt-16"
    >
      {header}

      <motion.div
        className="journal-collage relative grid min-h-0 w-full flex-1 gap-2 sm:gap-3"
        variants={gridVariants}
        initial="hidden"
        animate={phase === "collage" ? "visible" : "hidden"}
      >
        {GALLERY_PHOTOS.map((photo) => (
          <motion.button
            key={photo.id}
            type="button"
            custom={photo}
            variants={tileVariants}
            // Picking a print up off the wall: it straightens, lifts and grows.
            // This has to be framer's `whileHover` rather than a CSS :hover —
            // the variants above own `transform` on this element, so a CSS
            // transform would simply be overwritten. The glow and the dimming
            // of every other photo are CSS, on the <img> underneath.
            whileHover={
              reduceMotion
                ? undefined
                : {
                    scale: 1.07,
                    y: -10,
                    rotate: 0,
                    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                  }
            }
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            onClick={() => onOpen(photo.id)}
            aria-label={`Open photo: ${photo.alt}`}
            className="journal-tile group relative flex min-h-0 min-w-0 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{ gridColumn: `span ${columnSpan(photo)}` }}
          >
            {/* The cell is a uniform box, but the photograph keeps its own shape
                inside it — portraits stay portrait, nothing is cropped. An
                explicit aspect-ratio with both dimensions auto is what makes the
                element box shrink to the photo under the max-width AND
                max-height constraints; without it the box stays cell-sized and
                the frame paints a rectangle larger than the picture. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading="lazy"
              decoding="async"
              className="journal-tile-img"
              style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
            />
          </motion.button>
        ))}
      </motion.div>

      {/* The intro. Sits above the collage, out of the layout entirely, so it
          can be large and centred without disturbing the grid underneath. */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div
            key="intro"
            className="journal-intro pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.55, rotateY: 0 }}
            animate={{ opacity: 1, scale: 1, rotateY: 720 }}
            // The exit carries its own timing. Without it the exit inherits the
            // 1.5s rotateY duration below and the photo lingers for another
            // second and a half after the spin has already finished.
            exit={{
              opacity: 0,
              scale: 0.3,
              rotateY: 860,
              transition: { duration: 0.35, ease: "easeIn" },
            }}
            transition={{
              opacity: { duration: 0.24, ease: "easeOut" },
              scale: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
              // Two full turns, timed to finish exactly when the exit fires.
              rotateY: { duration: INTRO_SPIN_MS / 1000, ease: [0.3, 0, 0.2, 1] },
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={INTRO_PHOTO.src}
              alt=""
              aria-hidden
              width={INTRO_PHOTO.width}
              height={INTRO_PHOTO.height}
              // Eager: it is the first thing the section shows, and a lazy load
              // would leave the screen blank for part of its five seconds.
              loading="eager"
              decoding="async"
              className="journal-intro-img"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
