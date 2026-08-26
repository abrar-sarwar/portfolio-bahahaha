"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import GalleryCollage from "./GalleryCollage";
import GalleryViewer from "./GalleryViewer";
import { DoodleUnderline } from "./GalleryDoodles";
import { GALLERY_PHOTOS } from "@/lib/gallery";

/**
 * Gallery — the photo collage that sits between Organizations and Fun.
 *
 * One screen, the same height as every other panel in the feed. Reaching it
 * plays a short timed intro and then reveals the collage; there is nothing
 * below to scroll for.
 */
export default function GallerySection() {
  const [openId, setOpenId] = useState<string | null>(null);
  // framer-motion is already a dependency, so its reduced-motion hook is the
  // one source of truth here rather than a hand-rolled matchMedia listener.
  const reduceMotion = useReducedMotion() ?? false;

  const open = useCallback((id: string) => setOpenId(id), []);
  const close = useCallback(() => setOpenId(null), []);

  const header = (
    <header className="relative mb-4 shrink-0 sm:mb-5">
      <div className="relative inline-block">
        <h2
          id="gallery-heading"
          className="text-[22px] font-medium tracking-tight text-white sm:text-[26px]"
        >
          Gallery
        </h2>
        <DoodleUnderline className="journal-heading-underline" />
      </div>
      {/* Tighter tracking on phones so this stays on one line and does not eat
          a row of the collage. */}
      <p className="mt-3 text-[9px] uppercase tracking-[0.16em] text-white/40 sm:mt-4 sm:text-[10px] sm:tracking-[0.3em]">
        {GALLERY_PHOTOS.length} photographs · open one, then flip it over
      </p>
    </header>
  );

  return (
    <section
      aria-labelledby="gallery-heading"
      className="journal-root relative h-full w-full bg-black text-white"
    >
      <GalleryCollage
        header={header}
        onOpen={open}
        reduceMotion={reduceMotion}
      />

      <AnimatePresence>
        {openId && (
          <GalleryViewer
            photoId={openId}
            onClose={close}
            onChange={setOpenId}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
