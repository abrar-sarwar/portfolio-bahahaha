"use client";

import { useId } from "react";
import { useReducedMotion } from "framer-motion";

type Props = {
  // Sizing/positioning utilities for the globe (e.g. "h-16 w-16").
  className?: string;
  // Seconds for one full rotation. Lower = faster spin.
  spin?: number;
  // Line + atmosphere tint.
  glow?: string;
};

// A small, self-contained globe icon drawn as an SVG sphere — no 3D library,
// no asset. Latitude rings are static curved ellipses; meridian (longitude)
// lines all pass through the poles, so on a spinning globe they only change
// WIDTH as they rotate toward/away from the edge. Sweeping each meridian's
// width 0 -> full -> 0 on staggered phases reads as a real rotation.
export default function SpinningGlobe({
  className = "",
  spin = 8,
  glow = "rgba(186, 206, 255, 0.85)",
}: Props) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const sphereId = `globe-sphere-${uid}`;
  const clipId = `globe-clip-${uid}`;

  const R = 47;
  // Latitude rings, offset from the equator. ry is small so they read as
  // rings seen at a slight tilt rather than flat lines.
  const lats = [-30, -16, 0, 16, 30].map((dy) => {
    const rx = Math.sqrt(R * R - dy * dy);
    return { dy, rx, ry: rx * 0.2 };
  });

  // Meridian widths sampled across a half-turn (|sin|), used both for the
  // animation values and for the static reduced-motion fallback.
  const widths = [0, 24, 41.6, 47, 41.6, 24, 0];
  const meridianCount = 6;
  const halfTurn = spin / 2; // a meridian completes its 0->full->0 in a half-turn

  return (
    <span
      className={`relative inline-block ${className}`}
      aria-hidden
      style={{ filter: "drop-shadow(0 0 9px rgba(150,180,255,0.45))" }}
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full">
        <defs>
          <radialGradient id={sphereId} cx="36%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#2a3450" />
            <stop offset="55%" stopColor="#0d1224" />
            <stop offset="100%" stopColor="#05070f" />
          </radialGradient>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r={R} />
          </clipPath>
        </defs>

        {/* Sphere body */}
        <circle cx="50" cy="50" r={R} fill={`url(#${sphereId})`} />

        <g
          clipPath={`url(#${clipId})`}
          fill="none"
          stroke={glow}
          strokeWidth="1"
        >
          {/* Latitude rings */}
          {lats.map((l, i) => (
            <ellipse
              key={`lat-${i}`}
              cx="50"
              cy={50 + l.dy}
              rx={l.rx}
              ry={l.ry}
              opacity={0.4}
            />
          ))}

          {/* Meridian lines — width sweeps to fake rotation */}
          {Array.from({ length: meridianCount }).map((_, i) => {
            // Phase the start of each meridian evenly across the half-turn.
            const begin = -(halfTurn * i) / meridianCount;
            const startRx = reduce
              ? // Static spread of widths so a still globe still looks round.
                widths[(i + 1) % widths.length]
              : 0;
            return (
              <ellipse
                key={`mer-${i}`}
                cx="50"
                cy="50"
                rx={startRx}
                ry={R}
                opacity={0.55}
              >
                {!reduce && (
                  <animate
                    attributeName="rx"
                    values={widths.join(";")}
                    keyTimes="0;0.1667;0.3333;0.5;0.6667;0.8333;1"
                    dur={`${halfTurn}s`}
                    begin={`${begin}s`}
                    repeatCount="indefinite"
                    calcMode="linear"
                  />
                )}
              </ellipse>
            );
          })}
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
        <ellipse
          cx="36"
          cy="32"
          rx="18"
          ry="14"
          fill="rgba(255,255,255,0.16)"
        />
      </svg>
    </span>
  );
}
