"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VideoModal from "./VideoModal";

type Weapon =
  | "gun"
  | "fist"
  | "realfist"
  | "heart"
  | "sword"
  | "shuriken"
  | "football"
  | "soccer";
type ZoneId = "body" | "face" | "heart";

const PHOTO_SRC = "/assets/sprites/abrarshoot.png";

// Cursors live at /public/fun/cursors/{weapon}.png. If a file is missing the
// CSS falls back to `crosshair`. Recommend 32x32 PNGs with transparent bg.
const CURSOR_FOR: Record<Weapon, string> = {
  gun: "/fun/cursors/gun.png",
  fist: "/fun/cursors/fist.png",
  realfist: "/fun/cursors/fist.png",
  heart: "/fun/cursors/heart.png",
  sword: "/fun/cursors/sword.png",
  shuriken: "/fun/cursors/shuriken.png",
  football: "/fun/cursors/football.png",
  soccer: "/fun/cursors/soccer.png",
};

// Every clip is H.264 in an .mp4. The four newest arrived as .mov (served as
// video/quicktime, which Chrome and Firefox refuse to play) and, in the
// shuriken's case, as HEVC — which desktop Chrome cannot decode either. They
// were remuxed and re-encoded rather than shipped Safari-only.
const VIDEO_FOR: Record<Weapon, string> = {
  gun: "/assets/videos/abrarshoot.mp4",
  fist: "/assets/videos/abrarpunch.mp4",
  realfist: "/assets/videos/ultrapunchvideo.mp4",
  heart: "/assets/videos/abrarheart.mp4",
  sword: "/assets/videos/abrarsword.mp4",
  shuriken: "/assets/videos/shirukenvideo.mp4",
  football: "/assets/videos/footballvideo.mp4",
  soccer: "/assets/videos/soccervideo.mp4",
};

// Credit shown beneath the video once playback starts. Sword has no credit
// listed yet — leave undefined and VideoModal will simply omit the line.
const CREDIT_FOR: Partial<Record<Weapon, string>> = {
  gun: "unknown",
  fist: "reylox",
  heart: "pengui",
};

// Hit zones in percentages of the photo container.
// TODO: adjust to match photo — current values target abrarmainscreen.png.
const ZONES: Record<ZoneId, { left: string; top: string; width: string; height: string }> = {
  // Full silhouette — generous so gun/sword fire anywhere on the figure.
  body: { left: "10%", top: "5%", width: "80%", height: "90%" }, // TODO: adjust to match photo
  // Face only — head & jawline.
  face: { left: "34%", top: "8%", width: "32%", height: "22%" }, // TODO: adjust to match photo
  // Heart — small target on the upper-left of his chest (viewer's right).
  heart: { left: "44%", top: "24%", width: "18%", height: "12%" }, // TODO: adjust to match photo
};

// Set to true to temporarily show the zones as colored overlays while tuning.
const DEBUG_ZONES = false;

const ICON_FOR: Record<Weapon, string> = {
  gun: "/assets/sprites/shoot.png",
  fist: "/assets/sprites/punch.png",
  realfist: "/assets/sprites/realfist.png",
  heart: "/assets/sprites/heart.png",
  sword: "/assets/sprites/sword.png",
  // The shuriken artwork happens to be filed under spiderman.png.
  shuriken: "/assets/sprites/spiderman.png",
  football: "/assets/sprites/football.png",
  soccer: "/assets/sprites/soccer.png",
};

// Headline shown above the photo. Italic sans gives the lines a spoken,
// conversational feel that fits "Try hitting my face" / "Have at me".
const HEADLINE_FOR: Record<Weapon | "none", string> = {
  none: "Pick an item to do against me",
  gun: "Take your shot",
  fist: "Try hitting my face",
  realfist: "Hit me for real",
  heart: "Try aiming here",
  sword: "Have at me",
  shuriken: "Let it fly",
  football: "Throw it at me",
  soccer: "Kick it my way",
};

// Weapons that need a specific target. Anything absent connects anywhere on
// the silhouette. This drives both the hit test and the red aiming aura, so
// the aura can never point somewhere a hit does not actually register.
const ZONE_FOR: Partial<Record<Weapon, ZoneId>> = {
  fist: "face",
  realfist: "face",
  heart: "heart",
};

function WeaponIcon({
  src,
  alt,
  extraClass = "",
  compact = false,
}: {
  src: string;
  alt: string;
  extraClass?: string;
  /** The group under the photo runs smaller so the panel still fits a screen. */
  compact?: boolean;
}) {
  const dims = compact
    ? "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16"
    : "h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24";
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`${dims} select-none object-contain ${extraClass}`}
    />
  );
}

type WeaponButton = { id: Weapon; label: string; icon: ReactElement };

// Stacked drop-shadows trace the alpha edge so the dark fist icon pops on
// the dark button background.
const FIST_OUTLINE =
  "[filter:drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_0_2px_#fff)]";

const LEFT_WEAPONS: WeaponButton[] = [
  { id: "gun", label: "Gun", icon: <WeaponIcon src={ICON_FOR.gun} alt="Gun" /> },
  {
    id: "fist",
    label: "Fist",
    icon: <WeaponIcon src={ICON_FOR.fist} alt="Fist" extraClass={FIST_OUTLINE} />,
  },
  {
    id: "realfist",
    label: "Real Fist",
    icon: <WeaponIcon src={ICON_FOR.realfist} alt="Real fist" />,
  },
];

const RIGHT_WEAPONS: WeaponButton[] = [
  { id: "heart", label: "John", icon: <WeaponIcon src={ICON_FOR.heart} alt="John" /> },
  { id: "sword", label: "Sword", icon: <WeaponIcon src={ICON_FOR.sword} alt="Sword" /> },
  {
    id: "shuriken",
    label: "Shuriken",
    icon: <WeaponIcon src={ICON_FOR.shuriken} alt="Shuriken" />,
  },
];

// Under the photo rather than beside it — these two are kicked and thrown at
// the whole figure, so they read better below him than in either column.
const BOTTOM_WEAPONS: WeaponButton[] = [
  {
    id: "football",
    label: "Football",
    icon: <WeaponIcon src={ICON_FOR.football} alt="Football" compact />,
  },
  {
    id: "soccer",
    label: "Soccer",
    icon: <WeaponIcon src={ICON_FOR.soccer} alt="Soccer" compact />,
  },
];

function cursorStyle(w: Weapon | null): React.CSSProperties {
  if (!w) return {};
  return { cursor: `url('${CURSOR_FOR[w]}') 16 16, crosshair` };
}

function WeaponColumn({
  weapons,
  equipped,
  onToggle,
  /** Side columns stack on desktop; the group under the photo stays a row. */
  orientation = "column",
}: {
  weapons: WeaponButton[];
  equipped: Weapon | null;
  onToggle: (w: Weapon) => void;
  orientation?: "column" | "row";
}) {
  const compact = orientation === "row";
  const buttonSize = compact
    ? "h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
    : "h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32";
  return (
    <div
      className={
        orientation === "row"
          ? "flex flex-row items-start justify-center gap-3 sm:gap-4 md:gap-5"
          : "flex flex-row items-center justify-center gap-3 sm:flex-col sm:gap-4 md:gap-5"
      }
    >
      {weapons.map((w) => {
        const isEquipped = equipped === w.id;
        return (
          <div key={w.id} className="flex flex-col items-center gap-2">
            <motion.button
              type="button"
              onClick={() => onToggle(w.id)}
              aria-pressed={isEquipped}
              aria-label={`Equip ${w.label}${isEquipped ? " (currently equipped)" : ""}`}
              whileHover={{
                scale: 1.08,
                boxShadow: "0 0 26px rgba(167, 139, 250, 0.5)",
              }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 480, damping: 22 }}
              className={`flex items-center justify-center rounded-xl border transition-colors duration-150 ${buttonSize}`}
              style={{
                borderColor: isEquipped
                  ? "rgba(168, 139, 250, 0.85)"
                  : "rgba(255,255,255,0.14)",
                backgroundColor: isEquipped
                  ? "rgba(168, 139, 250, 0.16)"
                  : "rgba(255,255,255,0.03)",
                borderWidth: 0.5,
                boxShadow: isEquipped
                  ? "0 0 22px rgba(167, 139, 250, 0.4)"
                  : undefined,
              }}
            >
              {w.icon}
            </motion.button>
            <span
              className="text-xs font-medium uppercase tracking-[0.32em] transition-colors duration-200 sm:text-base"
              style={{
                color: isEquipped ? "#c4b5fd" : "rgba(255,255,255,0.92)",
                textShadow: isEquipped
                  ? "0 0 14px rgba(167, 139, 250, 0.6)"
                  : "0 0 8px rgba(0,0,0,0.6)",
              }}
            >
              {w.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function FunPage() {
  const [equipped, setEquipped] = useState<Weapon | null>(null);
  const [playing, setPlaying] = useState<Weapon | null>(null);

  const handleZoneClick = useCallback(
    (zone: ZoneId) => {
      if (!equipped) return;
      // Gun and sword fire from any zone (body, face, heart all part of the
      // silhouette). Fist only fires on face. Heart only on chest.
      // Anything without an entry in ZONE_FOR connects anywhere on the
      // silhouette; the rest only fire on their own zone.
      const required = ZONE_FOR[equipped];
      if (!required || required === zone) {
        setPlaying(equipped);
      }
      // Otherwise: invalid hit zone, do nothing.
    },
    [equipped],
  );

  const equipOrToggle = (w: Weapon) => {
    setEquipped((cur) => (cur === w ? null : w));
  };

  // Esc unequips when no video is playing (VideoModal owns Esc while open).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !playing) setEquipped(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [playing]);

  return (
    <main
      className="relative h-full w-full overflow-hidden bg-black text-white max-sm:h-auto max-sm:min-h-svh max-sm:overflow-visible"
      style={cursorStyle(equipped)}
    >
      {/* Ambient purple glow to match the rest of the site. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, rgba(124, 58, 237, 0.22), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-6 sm:gap-5 sm:pb-16 sm:pt-8 max-sm:min-h-svh max-sm:py-16">
        {/* Headline above the photo — swaps with the equipped weapon. */}
        <div className="flex h-10 items-center justify-center sm:h-12">
          <AnimatePresence mode="wait" initial={false}>
            <motion.h2
              key={equipped ?? "none"}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="text-lg italic font-light tracking-tight sm:text-xl"
              style={{ color: "rgba(255,255,255,0.88)" }}
            >
              {HEADLINE_FOR[equipped ?? "none"]}
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* Touch hint — the desktop version cues this with a custom cursor,
            which phones don't have, so spell it out instead. */}
        <p className="text-center text-[11px] uppercase tracking-[0.24em] text-white/40 sm:hidden">
          Tap an item, then tap me
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-10">
          <WeaponColumn
            weapons={LEFT_WEAPONS}
            equipped={equipped}
            onToggle={equipOrToggle}
          />

          {/* The photo and the two items that belong under it. */}
          <div className="flex flex-col items-center gap-4 sm:gap-5">
          <div className="relative w-[min(60vw,_200px)] sm:w-[min(40vw,_240px,_27svh)] md:w-[min(40vw,_300px,_27svh)]">
          {/* Subtle frame + glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-3 rounded-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(167,139,250,0.18), transparent 70%)",
              filter: "blur(18px)",
            }}
          />
          <div
            className="relative overflow-hidden rounded-xl border"
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              borderWidth: 0.5,
              boxShadow: "0 0 40px rgba(124, 58, 237, 0.18)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTO_SRC}
              alt="Abrar"
              draggable={false}
              className="block w-full select-none"
              style={cursorStyle(equipped)}
            />

            {/* Red aiming aura — only for weapons that require a specific
                target. Position uses the matching hit-zone bounds; tune those
                in ZONES above. */}
            <AnimatePresence>
              {equipped && ZONE_FOR[equipped] && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute"
                  style={{
                    ...ZONES[ZONE_FOR[equipped]!], // TODO: tune to photo
                    zIndex: 5,
                    background:
                      "radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(239, 68, 68, 0.22) 38%, transparent 75%)",
                    filter: "blur(6px)",
                  }}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
                  transition={{
                    opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                />
              )}
            </AnimatePresence>

            {/* Hit zones — invisible by default. Toggle DEBUG_ZONES to tune. */}
            {(Object.keys(ZONES) as ZoneId[]).map((id) => (
              <button
                key={id}
                type="button"
                aria-label={`${id} hit zone`}
                onClick={() => handleZoneClick(id)}
                className="absolute focus:outline-none"
                style={{
                  ...ZONES[id],
                  ...cursorStyle(equipped),
                  zIndex: id === "body" ? 10 : id === "face" ? 20 : 30,
                  background: DEBUG_ZONES
                    ? id === "body"
                      ? "rgba(0,255,0,0.18)"
                      : id === "face"
                        ? "rgba(255,0,0,0.22)"
                        : "rgba(255,200,0,0.28)"
                    : "transparent",
                  border: DEBUG_ZONES ? "1px dashed white" : undefined,
                  // No cursor: pointer — equipped weapon cursor takes over.
                  padding: 0,
                  pointerEvents: playing ? "none" : "auto",
                }}
              />
            ))}
          </div>
          </div>

          <WeaponColumn
            weapons={BOTTOM_WEAPONS}
            equipped={equipped}
            onToggle={equipOrToggle}
            orientation="row"
          />
          </div>

          <WeaponColumn
            weapons={RIGHT_WEAPONS}
            equipped={equipped}
            onToggle={equipOrToggle}
          />
        </div>

        {/* Tiny escape hint, only when something's equipped. */}
        <AnimatePresence>
          {equipped && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] uppercase tracking-[0.32em] text-white/35"
            >
              Esc to unequip
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Preload videos so playback is instant. */}
      <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
        {Object.values(VIDEO_FOR).map((src) => (
          <video key={src} src={src} preload="none" muted playsInline />
        ))}
      </div>

      <AnimatePresence>
        {playing && (
          <VideoModal
            key={playing}
            src={VIDEO_FOR[playing]}
            onClose={() => setPlaying(null)}
            volume={0.6}
            credit={CREDIT_FOR[playing]}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
