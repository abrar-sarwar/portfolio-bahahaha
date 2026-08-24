"use client";

import type { GalleryPhoto as Photo } from "@/lib/gallery";
import { hasDetails } from "@/lib/gallery";

type Props = {
  photo: Photo;
  flipped: boolean;
  onToggle: () => void;
  /** Reduced motion swaps the 3D rotation for a plain cross-fade. */
  reduceMotion: boolean;
};

/**
 * The photograph as a physical card. The front is the print; the back is the
 * note written on it.
 *
 * Only the card rotates — never the page. The wrapper owns the perspective, the
 * inner element owns `transform-style: preserve-3d`, and each face hides its
 * own backface. The card shrink-wraps the image so the back is exactly the size
 * of the print, which is what makes the flip read as physical.
 *
 * When the visitor prefers reduced motion the rotation is dropped entirely and
 * the faces cross-fade instead; the same content stays reachable.
 */
export default function FlippablePhoto({
  photo,
  flipped,
  onToggle,
  reduceMotion,
}: Props) {
  const detailed = hasDetails(photo);

  return (
    <div
      className={`journal-card ${reduceMotion ? "journal-card--fade" : ""}`}
      // --ar drives both the width formula and the aspect box in CSS, so the
      // card is exactly as large as the viewport allows without ever cropping.
      style={{ ["--ar" as string]: photo.width / photo.height }}
    >
      <div
        className={`journal-card-inner ${flipped ? "is-flipped" : ""}`}
        onClick={onToggle}
        role="presentation"
      >
        {/* ---------------- front: the print ---------------- */}
        <div className="journal-card-face journal-card-front" aria-hidden={flipped}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            decoding="async"
            className="h-full w-full rounded-[3px] object-contain"
            draggable={false}
          />
        </div>

        {/* ---------------- back: the note ---------------- */}
        <div
          className="journal-card-face journal-card-back"
          aria-hidden={!flipped}
        >
          <div className="journal-card-back-inner">
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-violet-200/70">
              {detailed ? "On the back" : "Nothing written yet"}
            </p>

            {detailed ? (
              <div className="mt-5 w-full">
                {photo.title && (
                  <h3 className="text-[20px] font-medium tracking-tight text-white sm:text-[24px]">
                    {photo.title}
                  </h3>
                )}

                {photo.description && (
                  <p
                    className="mt-3 text-[14px] sm:text-[15px]"
                    style={{ color: "rgba(255,255,255,0.86)", lineHeight: 1.7 }}
                  >
                    {photo.description}
                  </p>
                )}

              </div>
            ) : (
              <p
                className="mt-4 max-w-sm text-[13px]"
                style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}
              >
                This one has no note on it yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
