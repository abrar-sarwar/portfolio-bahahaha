"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "../bridge/GameStore";
import { bus } from "../bridge/EventBus";

export default function ChestPanel() {
  const reveal = useGameStore((state) => state.chest);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!reveal) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reveal.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-[2px]">
      <section className="w-full max-w-xl border border-amber-200/30 bg-[#0a0a0d]/95 px-6 py-8 text-center shadow-[0_0_60px_rgba(255,215,94,0.14)] sm:px-10">
        <div className="mb-3 text-[10px] uppercase tracking-[0.42em] text-violet-200/60">
          The Lost Key
        </div>
        <h1 className="text-lg font-bold uppercase tracking-[0.18em] text-amber-100 sm:text-2xl">
          The Lost Key Has Been Recovered
        </h1>
        <div className="mx-auto my-6 h-px w-40 bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" />
        <div className="text-[11px] uppercase tracking-[0.36em] text-white/50">Archive Code</div>
        <div className="my-3 font-mono text-4xl font-black tracking-[0.16em] text-[#ffd75e] drop-shadow-[0_0_14px_rgba(255,215,94,0.6)] sm:text-6xl">
          {reveal.code}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => void copy()} className="border border-amber-200/30 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-amber-100 transition hover:bg-amber-100/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">
            {copied ? "Copied ✓" : "Copy Code"}
          </button>
          <button type="button" onClick={() => bus.emit("nav:external", { href: "/gallery" })} className="border border-violet-200/30 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-100 transition hover:bg-violet-100/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-200">
            Return to the Archive
          </button>
          <button type="button" onClick={() => bus.emit("ending:return-overworld", {})} className="border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/55 transition hover:bg-white/5 hover:text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:col-span-2">
            Return to Overworld
          </button>
        </div>
      </section>
    </div>
  );
}
