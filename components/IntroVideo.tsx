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
    v.play().catch(() => {
      // Browser may silently mute or refuse. Skip button is the escape hatch.
    });
  }, []);

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
    </div>
  );
}
