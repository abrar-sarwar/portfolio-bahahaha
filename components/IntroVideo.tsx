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
    v.muted = false;
    v.play().catch(() => {
      // Browser refused autoplay with sound. Retry muted so it at least plays.
      v.muted = true;
      v.play().catch(() => {
        // If even muted play is refused, the Skip button is the escape hatch.
      });
    });
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <video
        ref={videoRef}
        autoPlay
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
