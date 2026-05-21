"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Project } from "@/lib/projects";
import SpriteSlot from "./SpriteSlot";

type Props = {
  project: Project;
};

export default function ProjectDetail({ project }: Props) {
  const router = useRouter();

  const backToIndex = () => {
    router.push("/");
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
      className="h-screen w-screen overflow-y-auto bg-projects text-white"
    >
      <button
        type="button"
        onClick={backToIndex}
        aria-label="Back to projects"
        className="fixed top-6 left-6 z-50 px-4 py-2 rounded-md border border-white/40 bg-black/40 text-white text-sm tracking-wide backdrop-blur hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        ← Back
      </button>

      <article className="mx-auto max-w-3xl px-6 py-20">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Project
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">
            {project.title}
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-white/55">
            {project.tag}
          </p>
        </header>

        <section className="mb-12">
          <p
            className="text-sm text-white/80"
            style={{ lineHeight: 1.7 }}
          >
            {project.description}
          </p>
          {/* TODO: extended writeup */}
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xs uppercase tracking-[0.3em] text-white/40">
            Screenshots
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* TODO: screenshots */}
            <SpriteSlot
              src={project.spriteSrc}
              alt={`${project.title} screenshot`}
              fallbackLabel={`${project.title} screenshot 1`}
              className="aspect-video w-full rounded-lg"
            />
            <SpriteSlot
              src={`/assets/sprites/${project.slug}-2.png`}
              alt={`${project.title} screenshot 2`}
              fallbackLabel={`${project.title} screenshot 2`}
              className="aspect-video w-full rounded-lg"
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xs uppercase tracking-[0.3em] text-white/40">
            Link
          </h2>
          <button
            type="button"
            onClick={() => {
              // TODO: {project.linkLabel}
            }}
            className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-xs uppercase tracking-wider text-white/70 hover:border-white/60 hover:text-white"
          >
            {project.linkLabel === "demo link" ? "Live Demo →" : "GitHub →"}
          </button>
        </section>
      </article>
    </motion.main>
  );
}
