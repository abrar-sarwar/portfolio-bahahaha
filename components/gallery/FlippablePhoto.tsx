"use client";

import type { CSSProperties } from "react";
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
 * WHICH FACE YOU SEE IS DECIDED BY OPACITY, NOTHING ELSE.
 *
 * This used to be the textbook flip — one `preserve-3d` parent turning two
 * `backface-visibility: hidden` faces — and it did nothing at all in Safari.
 * Both of those properties are compositing hints a browser is free to get
 * wrong, and when they go wrong the card just sits there.
 *
 * So the rotation is now decoration and the opacity swap is the mechanism: the
 * two faces trade `opacity` at the halfway point, driven straight off React
 * state as inline styles. Nothing here depends on a preserved 3D context, on
 * backface culling, or even on the stylesheet loading — the worst a browser can
 * do to this is turn a flip into a hard cut, and the note is still readable.
 *
 * The card shrink-wraps the image so the back is exactly the size of the print,
 * which is what makes it read as one physical object.
 */
export default function FlippablePhoto({
  photo,
  flipped,
  onToggle,
  reduceMotion,
}: Props) {
  const detailed = hasDetails(photo);

  // Reduced motion drops the rotation entirely and leaves the cross-fade.
  const face: CSSProperties = {
    position: "absolute",
    inset: 0,
    transition: reduceMotion
      ? "opacity 160ms ease"
      : "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 0s linear 310ms",
  };
  const turn = (deg: string) => (reduceMotion ? undefined : `rotateY(${deg})`);

  const frontStyle: CSSProperties = {
    ...face,
    transform: turn(flipped ? "180deg" : "0deg"),
    opacity: flipped ? 0 : 1,
    pointerEvents: flipped ? "none" : "auto",
  };

  const backStyle: CSSProperties = {
    ...face,
    transform: turn(flipped ? "0deg" : "-180deg"),
    opacity: flipped ? 1 : 0,
    pointerEvents: flipped ? "auto" : "none",
  };

  return (
    <div
      className="journal-card"
      // --ar drives both the width formula and the aspect box in CSS, so the
      // card is exactly as large as the viewport allows without ever cropping.
      style={{ ["--ar" as string]: photo.width / photo.height }}
    >
      <div className="journal-card-inner" onClick={onToggle} role="presentation">
        {/* ---------------- front: the print ---------------- */}
        <div
          className="journal-card-face journal-card-front"
          style={frontStyle}
          aria-hidden={flipped}
        >
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
          style={backStyle}
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
