"use client";

// Pixel-styled resource bars for combat: chunky segmented fills with a
// scanline sheen. Boss HP glows red (corruption), player HP + ultimate glow
// violet (the site's magic accent).

interface BarProps {
  label: string;
  value: number;
  max: number;
  tone: "boss" | "player" | "ultimate";
  /** Optional right-aligned readout override (defaults to value/max). */
  readout?: string;
}

const TONES = {
  boss: {
    fill: "linear-gradient(180deg,#ff6a6a 0%,#ef4444 45%,#a02030 100%)",
    track: "#2a0d12",
    border: "border-red-400/40",
    glow: "shadow-[0_0_14px_rgba(239,68,68,0.45)]",
    text: "text-red-200",
  },
  player: {
    fill: "linear-gradient(180deg,#7ee0d0 0%,#3fbdb0 50%,#20726e 100%)",
    track: "#0c1f1d",
    border: "border-teal-300/40",
    glow: "shadow-[0_0_12px_rgba(63,189,176,0.35)]",
    text: "text-teal-100",
  },
  ultimate: {
    fill: "linear-gradient(180deg,#e3d8ff 0%,#c4b5fd 45%,#8b6cf0 100%)",
    track: "#181233",
    border: "border-violet-300/40",
    glow: "shadow-[0_0_16px_rgba(167,139,250,0.5)]",
    text: "text-violet-100",
  },
} as const;

export default function Bar({ label, value, max, tone, readout }: BarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const t = TONES[tone];
  const full = tone === "ultimate" && pct >= 100;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between">
        <span className={`text-[8px] uppercase tracking-[0.25em] ${t.text}`}>{label}</span>
        <span className={`text-[8px] tabular-nums ${t.text}`}>
          {readout ?? `${Math.max(0, Math.ceil(value))}/${max}`}
        </span>
      </div>
      <div
        className={`relative h-3 w-full overflow-hidden rounded-[2px] border ${t.border} ${
          full ? t.glow : ""
        }`}
        style={{ backgroundColor: t.track, imageRendering: "pixelated" }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%`, backgroundImage: t.fill }}
        />
        {/* scanline sheen */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg,rgba(255,255,255,0.10) 0 2px,transparent 2px 4px)",
          }}
        />
        {full && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[7px] font-bold uppercase tracking-[0.3em] text-white">
            READY
          </div>
        )}
      </div>
    </div>
  );
}
