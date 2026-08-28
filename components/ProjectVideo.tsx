"use client";

import type { ProjectVideo as ProjectVideoModel } from "@/lib/projects";

type Props = {
  video: ProjectVideoModel;
  title: string;
  className?: string;
};

/**
 * A project's demo clip, embedded with native controls. The mp4 goes first
 * so every browser has something it can play; the original export is offered
 * second for the ones that can use it. Nothing autoplays — the visitor hits
 * play.
 */
export default function ProjectVideo({ video, title, className = "" }: Props) {
  return (
    <div className={`overflow-hidden rounded-lg border border-white/10 bg-black ${className}`}>
      <video
        controls
        playsInline
        preload="metadata"
        poster={video.poster}
        aria-label={`${title} demo video`}
        disablePictureInPicture
        className="block aspect-video w-full bg-black"
      >
        <source src={video.src} type="video/mp4" />
        {video.original && <source src={video.original} type="video/quicktime" />}
      </video>
    </div>
  );
}
