"use client";

import { useId } from "react";
import { useReducedMotion } from "framer-motion";
import { WORLD_HEIGHT, WORLD_PATH, WORLD_WIDTH } from "@/lib/worldPath";

type Props = {
  // Sizing/positioning utilities for the globe (e.g. "h-16 w-16").
  className?: string;
  // Seconds for one full rotation. Lower = faster spin.
  spin?: number;
  // Land + rim tint.
  glow?: string;
};

// The window is exactly one map-height across, which is what makes the visible
// slice a hemisphere. Deriving it keeps that true if the data ever changes.
const R = WORLD_HEIGHT / 2;
const LEFT = 50 - R; // 3 — the circle's left edge, in viewBox units
const TOP = 50 - R; // 3 — and its top edge

// Africa and Europe sit under the centre when the globe is held still.
const STILL_OFFSET = -57;

/**
 * The little globe icon: real coastlines and country borders scrolling behind
 * a round window, rather than a wireframe of latitude and longitude.
 *
 * The map is WORLD_WIDTH across and the window is WORLD_HEIGHT (one diameter),
 * so exactly half the world — a hemisphere — is in view at any moment, and one
 * loop of the scroll is one full rotation. Two copies sit end to end and the
 * pair slides by exactly one map width, so the seam never shows.
 *
 * It is a cylinder, not a sphere: the limb shading and the highlight are what
 * sell the curve. At 56–80px nothing larger is worth the cost, and this needs
 * no 3D library, no texture, and no per-frame work.
 */
export default function SpinningGlobe({
  className = "",
  spin = 8,
  glow = "rgba(186, 206, 255, 0.85)",
}: Props) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const oceanId = `globe-ocean-${uid}`;
  const limbId = `globe-limb-${uid}`;
  const clipId = `globe-clip-${uid}`;
  const glossId = `globe-gloss-${uid}`;

  return (
    <span
      className={`relative inline-block ${className}`}
      aria-hidden
      style={{ filter: "drop-shadow(0 0 9px rgba(150,180,255,0.45))" }}
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full">
        <defs>
          <radialGradient id={oceanId} cx="36%" cy="30%" r="78%">
            <stop offset="0%" stopColor="#16203c" />
            <stop offset="60%" stopColor="#0b1024" />
            <stop offset="100%" stopColor="#05070f" />
          </radialGradient>
          {/* Limb darkening — the edge of a sphere falls away from the light. */}
          <radialGradient id={limbId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="62%" stopColor="#000" stopOpacity="0" />
            <stop offset="88%" stopColor="#000" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.72" />
          </radialGradient>
          {/* The highlight has to fade out. A flat fill reads as a smudge
              sitting on top of the map rather than light on a surface. */}
          <radialGradient id={glossId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r={R} />
          </clipPath>
        </defs>

        {/* Ocean */}
        <circle cx="50" cy="50" r={R} fill={`url(#${oceanId})`} />

        {/* Land, scrolling behind the round window. */}
        <g clipPath={`url(#${clipId})`}>
          <g transform={`translate(0 ${TOP})`}>
            <g transform={`translate(${reduce ? STILL_OFFSET : 0} 0)`}>
              {!reduce && (
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="0 0"
                  to={`${-WORLD_WIDTH} 0`}
                  dur={`${spin}s`}
                  repeatCount="indefinite"
                />
              )}
              {/* Two copies end to end: as the first slides fully out of the
                  window the second is exactly where it began, so the loop is
                  seamless. */}
              {[LEFT, LEFT + WORLD_WIDTH].map((x) => (
                <path
                  key={x}
                  d={WORLD_PATH}
                  transform={`translate(${x} 0)`}
                  fill={glow}
                  fillOpacity="0.62"
                  stroke={glow}
                  strokeWidth="0.22"
                  strokeOpacity="0.85"
                  strokeLinejoin="round"
                />
              ))}
            </g>
          </g>
          {/* Shading sits inside the clip so it darkens land and ocean alike. */}
          <circle cx="50" cy="50" r={R} fill={`url(#${limbId})`} />
        </g>

        {/* Rim / limb */}
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1"
        />
        {/* Specular highlight, top-left */}
        <ellipse cx="35" cy="31" rx="22" ry="17" fill={`url(#${glossId})`} />
      </svg>
    </span>
  );
}
