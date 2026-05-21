"use client";

import { useEffect, useRef, useState } from "react";
import SkipButton from "./SkipButton";

type Props = {
  onComplete: () => void;
};

export default function IntroVideo({ onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [needsClickToPlay, setNeedsClickToPlay] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.volume = 1;
    const attempt = v.play();
    if (attempt && typeof attempt.then === "function") {
      attempt.catch(() => {
        setNeedsClickToPlay(true);
      });
    }
  }, []);

  const handleClickToPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.volume = 1;
    v.play().then(
      () => setNeedsClickToPlay(false),
      () => setNeedsClickToPlay(true),
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <video
        ref={videoRef}
        playsInline
        onEnded={onComplete}
        className="h-full w-full object-cover"
      >
        <source src="/assets/videos/opening.mp4" type="video/mp4" />
        <source src="/assets/videos/opening.webm" type="video/webm" />
        <source src="/assets/videos/opening.mov" type="video/quicktime" />
        <track kind="captions" srcLang="en" label="English captions" />
      </video>

      <SkipButton onClick={onComplete} />

      {needsClickToPlay && (
        <button
          type="button"
          onClick={handleClickToPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-2xl tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Click to play intro with sound"
        >
          <span className="px-6 py-3 rounded-full border border-white/70">
            ▶ Click to Play with Sound
          </span>
        </button>
      )}
    </div>
  );
}
