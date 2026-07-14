"use client";

import { useEffect } from "react";

// Click-to-play videos live behind a modal, so the browser doesn't start
// downloading them until the modal mounts — that download is the "delay"
// between clicking and playback. Fix: fetch each page's videos into memory
// as soon as the page mounts, and hand the modal a blob object URL so
// playback needs no network at all.
//
// Object URLs are kept for the life of the session (never revoked) — a page's
// videos stay instant across repeated opens, and the map only ever holds the
// handful of clips a visitor's pages actually reference.
const objectUrls = new Map<string, string>();
const inflight = new Set<string>();

export function preloadVideo(src: string): void {
  if (objectUrls.has(src) || inflight.has(src)) return;
  inflight.add(src);
  fetch(src)
    .then((res) => {
      if (!res.ok) throw new Error(`${res.status} for ${src}`);
      return res.blob();
    })
    .then((blob) => {
      objectUrls.set(src, URL.createObjectURL(blob));
    })
    .catch(() => {
      // Fetch failed (offline, 404, …) — resolveVideoSrc falls back to the
      // network URL, which is exactly the pre-preload behavior.
    })
    .finally(() => {
      inflight.delete(src);
    });
}

// Blob URL if the download finished, otherwise the original src so the
// <video> streams it like before.
export function resolveVideoSrc(src: string): string {
  return objectUrls.get(src) ?? src;
}

// Kick off preloads when a page mounts. Keyed on the joined list so inline
// array literals don't re-trigger the effect every render.
export function useVideoPreload(srcs: readonly string[]): void {
  const key = srcs.join("\n");
  useEffect(() => {
    for (const src of key.split("\n")) {
      if (src) preloadVideo(src);
    }
  }, [key]);
}
