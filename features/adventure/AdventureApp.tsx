"use client";

import { useEffect, useRef, useState } from "react";
import Overlay from "./ui/Overlay";

export default function AdventureApp() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setFullscreenSupported(document.fullscreenEnabled);
    const sync = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { buildConfig } = await import("./game");
      const { default: Phaser } = await import("phaser");
      if (cancelled || gameRef.current || !hostRef.current) return;
      gameRef.current = new Phaser.Game(buildConfig(hostRef.current));
    })();
    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-black">
      <div ref={hostRef} className="absolute inset-0" />
      <Overlay />
      {fullscreenSupported && (
        <button
          type="button"
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen();
          }}
          className="absolute right-24 top-2 z-[60] font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 transition hover:text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
        >
          {fullscreen ? "EXIT FULL" : "FULL"}
        </button>
      )}
    </div>
  );
}
