"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Starfield from "./Starfield";
import SpinningGlobe from "./SpinningGlobe";
import VideoModal from "./VideoModal";
import MyWorldGlobe, { type GlobeApi } from "./MyWorldGlobe";
import { locationBySlug } from "@/lib/world";
import { RETURN_TO_KEY } from "@/lib/projects";

const EASE = [0.22, 1, 0.36, 1] as const;

const DIO_IDLE_SRC = "/assets/sprites/shadowdiooo.png";
const DIO_ACTIVE_SRC = "/assets/sprites/diocrap.png";
const DIO_AUDIO_SRC = "/assets/videos/worldmp3.mp3";
const DIO_VIDEO_SRC = "/assets/videos/worldmp4.mp4";
const GAROU_VIDEO_SRC = "/assets/videos/garouuu.mp4";

export default function MyWorldPage() {
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const globeApi = useRef<GlobeApi | null>(null);

  // ----- dio sequence state --------------------------------------------
  // "idle"  -> shadowdiooo, world spinning.
  // "audio" -> diocrap, worldmp3 playing; ends into the video.
  // The video itself plays in the modal (dioVideoOpen). The globe stops the
  // moment dio is engaged and resumes only when the whole thing finishes.
  const [dioPhase, setDioPhase] = useState<"idle" | "audio">("idle");
  const [dioVideoOpen, setDioVideoOpen] = useState(false);
  const [garouVideoOpen, setGarouVideoOpen] = useState(false);
  const dioAudioRef = useRef<HTMLAudioElement | null>(null);
  const dioActive = dioPhase === "audio" || dioVideoOpen;

  // Bumped each time the locked globe is poked, to replay the glitch flash.
  const [glitchKey, setGlitchKey] = useState(0);
  const triggerGlitch = () => setGlitchKey((k) => k + 1);

  const goBack = () => {
    // Locked while the dio sequence is running.
    if (dioActive) return;
    // Skip the intro video when landing back on the home feed.
    try {
      sessionStorage.setItem(RETURN_TO_KEY, "home");
    } catch {
      // ignore privacy-mode failures
    }
    router.push("/");
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // When the mp3 ends, roll straight into the video.
  useEffect(() => {
    const audio = dioAudioRef.current;
    if (!audio) return;
    const onEnded = () => {
      setDioPhase("idle"); // image stays diocrap because dioVideoOpen flips on
      setDioVideoOpen(true);
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  const handleDioClick = () => {
    // Already in the video — nothing to do (the modal covers dio anyway).
    if (dioVideoOpen) return;

    // Clicking while the song is playing skips it: stop the audio and cut
    // straight to the video.
    if (dioPhase === "audio") {
      dioAudioRef.current?.pause();
      setDioPhase("idle");
      setDioVideoOpen(true);
      return;
    }

    // Idle: freeze the world (no spin, no drag) and run the full sequence —
    // diocrap + the song, which then rolls into the video.
    globeApi.current?.setFrozen(true);
    setDioPhase("audio");
    const audio = dioAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // If audio is blocked, don't strand the user — jump to the video.
        setDioPhase("idle");
        setDioVideoOpen(true);
      });
    } else {
      setDioVideoOpen(true);
    }
  };

  // Video finished (ended or closed): reset dio and let the world spin again.
  // A fresh click then replays the whole song -> video sequence.
  const handleDioVideoClose = () => {
    setDioVideoOpen(false);
    setDioPhase("idle");
    setGlitchKey(0);
    globeApi.current?.setFrozen(false);
  };

  const activeLocation = slug ? locationBySlug(slug) : undefined;
  const panelOpen = Boolean(activeLocation);

  const handleSelectLocation = (s: string) => setSlug(s);
  // Close panel / deselect: globe returns to center.
  const handleClose = () => setSlug(null);

  // Globe drifts aside to make room for the panel: sideways on desktop, up on
  // mobile. IMPORTANT: translate only, never scale. globe.gl maps clicks using
  // the canvas's layout width, which a CSS scale would desync (ResizeObserver
  // doesn't fire on transforms), making clicks miss the shapes. Pure translate
  // keeps hit-testing exact, so you can click straight from one place to
  // another while the panel is open.
  const globeAnim = panelOpen
    ? isMobile
      ? { x: "0%", y: "-18%" }
      : { x: "-24%", y: "0%" }
    : { x: "0%", y: "0%" };

  return (
    <main className="relative h-svh w-full overflow-hidden bg-black text-white max-sm:min-h-svh">
      <Starfield />

      {/* Back button — a disc-sized spinning globe, top-left. */}
      <motion.button
        type="button"
        onClick={goBack}
        disabled={dioActive}
        aria-label="Back to home"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: dioActive ? 0.35 : 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        whileHover={dioActive ? undefined : { scale: 1.06 }}
        whileTap={dioActive ? undefined : { scale: 0.94 }}
        className={`absolute left-5 top-5 z-50 flex flex-col items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:left-6 sm:top-6 ${
          dioActive ? "pointer-events-none cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <SpinningGlobe spin={7} className="h-14 w-14 sm:h-16 sm:w-16" />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/70"
          style={{ textShadow: "0 0 10px rgba(150,180,255,0.5)" }}
        >
          ← back
        </span>
      </motion.button>

      {/* Title + step hint, top center. */}
      <div className="pointer-events-none absolute left-1/2 top-5 z-30 flex w-full max-w-[88%] -translate-x-1/2 flex-col items-center text-center sm:top-7">
        <h2
          className="text-sm font-medium uppercase tracking-[0.42em] text-white/90"
          style={{ textShadow: "0 0 18px rgba(255,255,255,0.25)" }}
        >
          My World
        </h2>
        <p className="mt-1.5 text-[10px] uppercase tracking-[0.28em] text-white/35">
          The places I have been so far
        </p>
        <AnimatePresence>
          {!panelOpen && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/55"
            >
              Tap a glowing place
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Pulsing ring of light around the globe while dio has it locked. */}
      <AnimatePresence>
        {dioActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center"
          >
            <div
              className="mw-globe-glow rounded-full"
              style={{
                width: "min(78vh, 78vw)",
                height: "min(78vh, 78vw)",
                background:
                  "radial-gradient(circle, transparent 40%, rgba(168,85,247,0.0) 46%, rgba(180,90,255,0.55) 58%, rgba(120,70,220,0.18) 72%, transparent 82%)",
                filter: "blur(26px)",
                mixBlendMode: "screen",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The globe. Stays interactive even when shifted aside. */}
      <motion.div
        className="absolute inset-0 z-10"
        animate={globeAnim}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <MyWorldGlobe
          activeSlug={slug}
          onSelectLocation={handleSelectLocation}
          onDeselect={handleClose}
          apiRef={globeApi}
        />
      </motion.div>

      {/* Interaction shield — while dio is active this captures every poke at
          the globe (clicks on places, drags) so nothing selects, and fires a
          glitch flash instead. Sits above the globe but below the dio sprite
          (z-30) so dio can still be clicked to skip the song. */}
      {dioActive && (
        <div
          aria-hidden
          onPointerDown={triggerGlitch}
          className="absolute inset-0 z-[24] cursor-not-allowed"
        />
      )}

      {/* Glitch flash — remounts on each poke (keyed) to replay the animation. */}
      {glitchKey > 0 && dioActive && (
        <div
          key={glitchKey}
          aria-hidden
          className="mw-glitch pointer-events-none absolute inset-0 z-[27] overflow-hidden"
        >
          <div
            className="mw-glitch-bar absolute inset-0"
            style={{ background: "rgba(255,40,90,0.4)" }}
          />
          <div
            className="mw-glitch-bar absolute inset-0"
            style={{ background: "rgba(40,210,255,0.4)", animationDirection: "reverse" }}
          />
          <div className="mw-glitch-scan absolute inset-0" />
        </div>
      )}

      {/* Zoom controls. Wheel/pinch zoom is off so the page scrolls freely;
          these drive the camera instead. Hidden while the panel is open or
          while dio has the globe locked. */}
      <AnimatePresence>
        {!panelOpen && !dioActive && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="absolute bottom-6 left-6 z-30 flex flex-col gap-2 sm:bottom-8"
          >
            {[
              { label: "+", fn: () => globeApi.current?.zoomIn(), aria: "Zoom in" },
              { label: "−", fn: () => globeApi.current?.zoomOut(), aria: "Zoom out" },
            ].map((b) => (
              <button
                key={b.aria}
                type="button"
                onClick={b.fn}
                aria-label={b.aria}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/40 text-lg leading-none text-white/80 backdrop-blur transition-colors hover:border-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                {b.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Garou — bottom-left, clickable → plays his video. */}
      <motion.button
        type="button"
        onClick={() => !dioActive && setGarouVideoOpen(true)}
        disabled={dioActive}
        aria-label="Play garou"
        initial={{ opacity: 0, x: -24 }}
        // Clearing out: when a place is selected, garou slides off the left
        // edge so the globe + panel have room; he slides back when it closes.
        animate={{ opacity: 1, x: panelOpen ? "-130%" : 0 }}
        transition={{ delay: panelOpen ? 0 : 0.4, duration: 0.7, ease: EASE }}
        whileHover={dioActive ? undefined : { scale: 1.03 }}
        whileTap={dioActive ? undefined : { scale: 0.97 }}
        className={`absolute bottom-0 left-0 z-20 origin-bottom-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
          dioActive ? "pointer-events-none" : "cursor-pointer"
        }`}
        style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.6))" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/sprites/garouworld-removebg-preview.png"
          alt=""
          draggable={false}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
          className="block h-72 w-auto select-none object-contain sm:h-96 md:h-[28rem]"
        />
      </motion.button>

      {/* Dio — bottom-right, clickable. First click: freeze the world, swap to
          diocrap, play worldmp3, then the video; the world resumes after.
          Once heard, later clicks skip straight to the video. */}
      <motion.button
        type="button"
        onClick={handleDioClick}
        aria-label="Play dio"
        initial={{ opacity: 0, x: 24 }}
        // Same as garou: clear off the right edge while a place is open so the
        // side panel has room, then slide back in when it closes.
        animate={{ opacity: 1, x: panelOpen ? "130%" : 0 }}
        transition={{ delay: panelOpen ? 0 : 0.4, duration: 0.7, ease: EASE }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="absolute bottom-0 right-0 z-30 origin-bottom-right cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.6))" }}
      >
        {/* Pulsing cue halo, only while idle. */}
        {!dioActive && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.94, 1.06, 0.94] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background:
                "radial-gradient(closest-side, rgba(180,120,255,0.5) 0%, rgba(120,80,200,0.25) 45%, transparent 72%)",
              filter: "blur(20px)",
            }}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dioActive ? DIO_ACTIVE_SRC : DIO_IDLE_SRC}
          alt=""
          draggable={false}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
          className="relative block h-52 w-auto select-none object-contain sm:h-72 md:h-80"
        />
      </motion.button>

      {/* Hidden mp3 for the first-run dio sequence. */}
      <audio ref={dioAudioRef} src={DIO_AUDIO_SRC} preload="auto" aria-hidden />

      {/* Side note panel. Right sheet on desktop, bottom sheet on mobile. */}
      <AnimatePresence>
        {activeLocation && (
          <motion.aside
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: "0%" } : { x: "0%" }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="absolute z-40 flex flex-col border-white/15 bg-black/80 backdrop-blur-md max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[68%] max-sm:rounded-t-2xl max-sm:border-t sm:right-0 sm:top-0 sm:h-full sm:w-full sm:max-w-md sm:border-l"
            aria-label={`Notes on ${activeLocation.label}`}
          >
            {/* Close / deselect. Returns the globe to center. */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close panel"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            {/* Keyed by slug so switching to another place crossfades the
                copy in place rather than re-sliding the whole panel. */}
            <motion.div
              key={activeLocation.slug}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="flex-1 overflow-y-auto px-7 py-16 sm:px-9"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/45">
                Been here
              </p>
              <h3 className="mt-3 text-2xl font-medium tracking-tight text-white">
                {activeLocation.label}
              </h3>
              <div className="mt-5 space-y-4">
                {activeLocation.content.map((para, i) => (
                  <p
                    key={i}
                    className="text-[14.5px] text-white/80"
                    style={{ lineHeight: 1.7 }}
                  >
                    {para}
                  </p>
                ))}
              </div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Dio's video — plays after the song (or straight away on later
          clicks). Closing/ending resumes the world spin. */}
      <AnimatePresence>
        {dioVideoOpen && (
          <VideoModal
            src={DIO_VIDEO_SRC}
            onClose={handleDioVideoClose}
            volume={0.8}
            // worldmp4 is only 480x480 — force a big square so it fills the
            // screen instead of sitting tiny at native resolution.
            videoClass="h-[min(82vh,92vw)] w-[min(82vh,92vw)]"
          />
        )}
      </AnimatePresence>

      {/* Garou's video. Small square source, so size it up like dio's. */}
      <AnimatePresence>
        {garouVideoOpen && (
          <VideoModal
            src={GAROU_VIDEO_SRC}
            onClose={() => setGarouVideoOpen(false)}
            volume={0.8}
            videoClass="h-[min(82vh,92vw)] w-[min(82vh,92vw)]"
          />
        )}
      </AnimatePresence>
    </main>
  );
}
