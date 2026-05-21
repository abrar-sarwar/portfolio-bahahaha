"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  fallbackLabel: string;
  className?: string;
};

export default function SpriteSlot({
  src,
  alt,
  fallbackLabel,
  className = "",
}: Props) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        role="img"
        aria-label={fallbackLabel}
        className={`flex items-center justify-center border-2 border-dashed border-white/40 text-white/60 text-xs tracking-wide uppercase ${className}`}
      >
        {fallbackLabel}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className={className}
    />
  );
}
