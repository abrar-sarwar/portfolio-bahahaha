"use client";

import BackButton from "./BackButton";
import SpriteSlot from "./SpriteSlot";

type Props = {
  onBack: () => void;
};

const PROJECTS = [
  { id: "01", title: "Project 01" },
  { id: "02", title: "Project 02" },
  { id: "03", title: "Project 03" },
];

export default function ProjectsPage({ onBack }: Props) {
  return (
    <main className="h-full w-full overflow-y-auto bg-projects text-white">
      <BackButton onClick={onBack} />

      <div className="mx-auto max-w-6xl px-6 py-20">
        <header className="mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Section
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">
            Projects
          </h1>
        </header>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30"
            >
              {/* TODO: project-{id} sprite */}
              <SpriteSlot
                src={`/assets/sprites/project-${p.id}.png`}
                alt={`${p.title} sprite`}
                fallbackLabel={`Project ${p.id} sprite`}
                className="aspect-video w-full rounded-lg"
              />

              {/* TODO: project-{id} details */}
              <h2 className="mt-4 text-xl font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm text-white/60">
                <span className="text-white/40">
                  [ TODO: short description for {p.title} ]
                </span>
              </p>

              {/* TODO: project-{id} link */}
              <button
                type="button"
                onClick={() => {
                  // TODO: link/modal
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wider text-white/70 hover:border-white/60 hover:text-white"
              >
                View →
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
