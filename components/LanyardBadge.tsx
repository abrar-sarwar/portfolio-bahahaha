"use client";

import { motion } from "framer-motion";

type Props = {
  // Company lockup printed at the top of the card (the light-background
  // version: the card is white).
  logo?: string;
  name: string;
  // The role line, e.g. "Incoming SWE @ Microsoft".
  role: string;
  // Start date as it should read, e.g. "May 17th, 2027".
  starts: string;
  // Delay before the badge drops in, so it follows the panel's own entrance.
  delay?: number;
};

/**
 * An ID badge on a lanyard, the kind handed over on day one: a white plastic
 * card on a dark woven strap with a clear clip. It drops in and swings a
 * little before it hangs still. There is no badge photo yet, so the photo box
 * holds a question mark.
 */
export default function LanyardBadge({
  logo,
  name,
  role,
  starts,
  delay = 0.45,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -48, rotate: -6 }}
      animate={{ opacity: 1, y: 0, rotate: [-6, 3, -1.5, 0.6, 0] }}
      transition={{
        opacity: { duration: 0.3, delay },
        y: { type: "spring", stiffness: 150, damping: 16, delay },
        rotate: {
          duration: 1.8,
          delay,
          ease: "easeOut",
          times: [0, 0.3, 0.56, 0.8, 1],
        },
      }}
      style={{ transformOrigin: "50% 0%" }}
      className="mx-auto flex w-[min(100%,248px)] flex-col items-center"
    >
      {/* Strap: two flat woven bands meeting at a clear plastic clip, the
          company name printed down each one. */}
      <svg
        viewBox="0 0 248 96"
        className="relative z-10 block h-[96px] w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="mw-strap" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#141c2e" />
            <stop offset="0.5" stopColor="#1f2a44" />
            <stop offset="1" stopColor="#141c2e" />
          </linearGradient>
          <pattern id="mw-weave" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="transparent" />
            <rect width="1.5" height="1.5" fill="rgba(255,255,255,0.045)" />
          </pattern>
        </defs>
        {/* Left band: from the top edge down to the clip. */}
        <g>
          <path d="M40 0 L116 80 L132 80 L56 0 Z" fill="url(#mw-strap)" />
          <path d="M40 0 L116 80 L132 80 L56 0 Z" fill="url(#mw-weave)" />
          <text
            fontSize="6.5"
            fontWeight="600"
            fill="rgba(255,255,255,0.55)"
            letterSpacing="0.3"
            transform="translate(50 6) rotate(46.5)"
          >
            Microsoft   Microsoft   Microsoft
          </text>
        </g>
        {/* Right band. */}
        <g>
          <path d="M208 0 L132 80 L116 80 L192 0 Z" fill="url(#mw-strap)" />
          <path d="M208 0 L132 80 L116 80 L192 0 Z" fill="url(#mw-weave)" />
          <text
            fontSize="6.5"
            fontWeight="600"
            fill="rgba(255,255,255,0.55)"
            letterSpacing="0.3"
            transform="translate(195 2) rotate(133.5)"
          >
            Microsoft   Microsoft   Microsoft
          </text>
        </g>
        {/* Clear plastic strap clip with a metal rivet. */}
        <rect
          x="112"
          y="72"
          width="24"
          height="24"
          rx="3"
          fill="rgba(255,255,255,0.22)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1"
        />
        <circle cx="124" cy="79" r="2.6" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
      </svg>

      {/* The card: CR80 proportions, a slot punched at the top for the clip. */}
      <div
        className="relative -mt-3 w-full overflow-hidden rounded-[10px] text-left"
        style={{
          background:
            "linear-gradient(170deg, #ffffff 0%, #f7f7f8 60%, #f1f1f3 100%)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 36px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.35)",
          color: "#1a1a1a",
        }}
      >
        <span
          aria-hidden
          className="absolute left-1/2 top-[9px] h-[5px] w-[34px] -translate-x-1/2 rounded-full"
          style={{
            background: "#0b0c12",
            boxShadow: "inset 0 1px 1px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.8)",
          }}
        />

        <div className="px-5 pb-5 pt-7">
          {logo && (
            <motion.img
              src={logo}
              alt=""
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: delay + 0.8 }}
              className="block h-[30px] w-auto select-none"
            />
          )}

          {/* Photo box. The photo has not been taken yet. */}
          <div
            className="mt-4 flex aspect-[4/5] w-full items-center justify-center rounded-[6px]"
            style={{
              background: "#e4e5e8",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
            }}
            role="img"
            aria-label="No photo yet"
          >
            <span
              className="text-[44px] font-medium leading-none"
              style={{ color: "#9a9ca3" }}
            >
              ?
            </span>
          </div>

          <p
            className="mt-4 text-[18px] font-semibold leading-tight"
            style={{ color: "#111111", letterSpacing: "-0.01em" }}
          >
            {name}
          </p>
          <p className="mt-1 text-[13px] leading-snug" style={{ color: "#4b4f57" }}>
            {role}
          </p>
          <p className="mt-3 text-[11px]" style={{ color: "#7a7e86" }}>
            Starts {starts}
          </p>
        </div>

        {/* Colour band along the bottom edge, like a badge type stripe. */}
        <span aria-hidden className="block h-[7px] w-full" style={{ background: "#0078d4" }} />
      </div>
    </motion.div>
  );
}
