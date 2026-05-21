"use client";

import { useEffect, useRef } from "react";
import SkipButton from "./SkipButton";

type Props = {
  onComplete: () => void;
};

// Rendered via dangerouslySetInnerHTML so the `muted` attribute lands in the
// DOM at parse time, before the browser's first autoplay check. React's JSX
// `muted` prop sets the property, not always the attribute, and Safari needs
// the attribute to be present from the start or it shows a center play overlay.
const VIDEO_HTML = `
<video
  autoplay
  muted
  playsinline
  preload="auto"
  disablepictureinpicture
  class="h-full w-full object-cover"
>
  <source src="/assets/videos/opening.mp4" type="video/mp4" />
  <source src="/assets/videos/opening.webm" type="video/webm" />
  <source src="/assets/videos/opening.mov" type="video/quicktime" />
  <track kind="captions" srclang="en" label="English captions" />
</video>
`;

export default function IntroVideo({ onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const v = c.querySelector<HTMLVideoElement>("video");
    if (!v) return;

    v.muted = true;
    v.play().catch(() => {});

    const handleEnded = () => onComplete();
    v.addEventListener("ended", handleEnded);

    const unmute = () => {
      v.muted = false;
      v.volume = 1;
    };
    document.addEventListener("pointerdown", unmute, { once: true });
    document.addEventListener("keydown", unmute, { once: true });

    return () => {
      v.removeEventListener("ended", handleEnded);
      document.removeEventListener("pointerdown", unmute);
      document.removeEventListener("keydown", unmute);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <div
        ref={containerRef}
        className="h-full w-full"
        dangerouslySetInnerHTML={{ __html: VIDEO_HTML }}
      />
      <SkipButton onClick={onComplete} />
    </div>
  );
}
