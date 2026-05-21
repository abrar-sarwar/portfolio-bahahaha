"use client";

import { useEffect, useRef } from "react";
import SkipButton from "./SkipButton";

type Props = {
  onComplete: () => void;
};

export default function IntroVideo({ onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Start muted so browsers actually let it autoplay (no play button overlay).
    v.muted = true;
    v.play().catch(() => {});

    // The moment the user interacts anywhere, unmute. Any click, tap, or key.
    const unmute = () => {
      v.muted = false;
      v.volume = 1;
      document.removeEventListener("pointerdown", unmute);
      document.removeEventListener("keydown", unmute);
    };
    document.addEventListener("pointerdown", unmute, { once: true });
    document.addEventListener("keydown", unmute, { once: true });

    return () => {
      document.removeEventListener("pointerdown", unmute);
      document.removeEventListener("keydown", unmute);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={onComplete}
        className="h-full w-full object-cover"
      >
        <source src="/assets/videos/opening.mp4" type="video/mp4" />
        <source src="/assets/videos/opening.webm" type="video/webm" />
        <source src="/assets/videos/opening.mov" type="video/quicktime" />
        <track kind="captions" srcLang="en" label="English captions" />
      </video>

      <SkipButton onClick={onComplete} />
    </div>
  );
}
