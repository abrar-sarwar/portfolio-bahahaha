"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

// Entry point to the /professional page. A short human label over the raw
// professional.png character image. No box or frame: the image itself is the
// clickable control (the whole label + image is one link). Hover lifts and
// glows the character. Entrance animation is gated on reduced-motion.
// Positioning is handled by the parent.
export default function ProfessionalEntry() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href="/professional"
        aria-label="Open my professional page"
        className="group pointer-events-auto flex flex-col items-center gap-1.5 focus:outline-none"
      >
        <span
          className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.18em] text-white/80 transition-colors group-hover:text-white sm:text-[12px]"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}
        >
          Professional page
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* White outline via 4-direction drop-shadows, plus a soft cast shadow. */}
        <img
          src="/assets/sprites/professional.png"
          alt="Professional page"
          draggable={false}
          className="block h-32 w-auto select-none object-contain transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.05] group-focus-visible:-translate-y-1 sm:h-40"
          style={{
            filter:
              "drop-shadow(1.6px 0 0 #fff) drop-shadow(-1.6px 0 0 #fff) drop-shadow(0 1.6px 0 #fff) drop-shadow(0 -1.6px 0 #fff) drop-shadow(0 8px 18px rgba(0,0,0,0.55))",
          }}
        />
      </Link>
    </motion.div>
  );
}
