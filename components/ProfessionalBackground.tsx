"use client";

// Cool, abstract motion for the professional page. A slowly rotating conic
// sheen plus a couple of drifting signal fields over a crisp paper canvas,
// finished with a faint grid and grain. CSS-driven so it stays smooth on
// mid-range hardware and mobile, with no JS animation loop. Reduced-motion users
// get the static canvas (the spin and drift simply stop).
export default function ProfessionalBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base canvas. */}
      <div className="absolute inset-0" style={{ background: "var(--pro-bg)" }} />

      {/* Rotating conic sheen, centered and oversized so the edges never show. */}
      <div
        className="pro-sheen"
        style={{
          top: "50%",
          left: "50%",
          width: "150vmax",
          height: "150vmax",
          marginTop: "-75vmax",
          marginLeft: "-75vmax",
          opacity: 0.5,
          background:
            "conic-gradient(from 0deg, rgba(11,11,12,0) 0deg, rgba(37,99,235,0.08) 60deg, rgba(11,11,12,0) 130deg, rgba(11,11,12,0.05) 220deg, rgba(11,11,12,0) 300deg, rgba(37,99,235,0.09) 360deg)",
        }}
      />

      {/* Drifting grayscale orbs for depth and gravity. */}
      <div
        className="pro-orb pro-orb-a"
        style={{
          top: "-12%",
          left: "-8%",
          width: "48vw",
          height: "48vw",
          background:
            "radial-gradient(closest-side, rgba(37,99,235,0.12), transparent 70%)",
        }}
      />
      <div
        className="pro-orb pro-orb-b"
        style={{
          bottom: "-16%",
          right: "-10%",
          width: "54vw",
          height: "54vw",
          background:
            "radial-gradient(closest-side, rgba(11,11,12,0.08), transparent 70%)",
        }}
      />

      {/* Dot field across the page, plus a brighter pool that drifts around. */}
      <div className="pro-dots" />
      <div className="pro-dots-spot" />

      {/* Faint hairline grid, fading toward the bottom. */}
      <div
        className="absolute inset-0 opacity-[0.6]"
        style={{
          backgroundImage:
            "linear-gradient(var(--pro-line) 1px, transparent 1px), linear-gradient(90deg, var(--pro-line) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(130% 100% at 50% 0%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(130% 100% at 50% 0%, black 30%, transparent 85%)",
        }}
      />

      {/* Grain so the large white field never looks flat. */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Soft vignette to seat the content. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(11,11,12,0.06) 100%)",
        }}
      />
    </div>
  );
}
