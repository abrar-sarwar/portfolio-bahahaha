"use client";

/**
 * Hand-drawn marks for the Gallery.
 *
 * These are deliberately derived from the portfolio's existing decorative
 * language rather than a scrapbook template: thin violet ink on black, the
 * same hue family as the violet glow already used on the feed's scroll cue and
 * nav hovers. Every mark is inline SVG (no extra image assets), decorative, and
 * hidden from assistive tech.
 *
 * Restraint is the point — a handful of marks across a very long section.
 */

/** Rough underline that sits beneath the section heading. */
export function DoodleUnderline({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 14"
      fill="none"
      className={`journal-ink journal-ink--draw ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M3 9.4 C38 4.2, 74 3.4, 108 6.2 C142 9, 178 8.4, 216 4.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14 12.2 C52 8.6, 96 8.2, 150 10.4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

/** Curved arrow that hands the reader from one part of the section to the next. */
export function DoodleArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 60 96"
      fill="none"
      className={`journal-ink journal-ink--draw ${className}`}
    >
      <path
        d="M30 5 C13 26, 47 44, 30 68"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22 58 L30 70 L39 59"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Imperfect circle, for ringing a single photo. Never more than one or two. */
export function DoodleCircle({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 90"
      fill="none"
      className={`journal-ink ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M62 4 C94 4, 116 22, 116 45 C116 70, 92 86, 60 86 C27 86, 4 69, 4 45 C4 21, 27 4, 61 4 C84 4, 104 15, 110 32"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small four-point sparkle. */
export function DoodleStar({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={`journal-ink ${className}`}
    >
      <path
        d="M12 2.5 C12.7 8.4, 15.6 11.3, 21.5 12 C15.6 12.7, 12.7 15.6, 12 21.5 C11.3 15.6, 8.4 12.7, 2.5 12 C8.4 11.3, 11.3 8.4, 12 2.5 Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Loose connecting line, used once to tie two grid photos together. */
export function DoodleThread({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 260 60"
      fill="none"
      className={`journal-ink ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M4 42 C58 12, 108 52, 152 26 C186 6, 222 20, 256 12"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
    </svg>
  );
}
