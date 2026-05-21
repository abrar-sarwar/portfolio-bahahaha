"use client";

import { useRouter } from "next/navigation";
import BackButton from "./BackButton";
import SpriteSlot from "./SpriteSlot";
import { PROJECTS, RETURN_TO_KEY } from "@/lib/projects";

type Props = {
  onBack: () => void;
};

export default function ProjectsPage({ onBack }: Props) {
  const router = useRouter();

  const openProject = (slug: string) => {
    try {
      sessionStorage.setItem(RETURN_TO_KEY, "projects");
    } catch {
      // ignore privacy-mode failures
    }
    router.push(`/projects/${slug}`);
  };

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
            <li key={p.slug}>
              <button
                type="button"
                onClick={() => openProject(p.slug)}
                className="group flex w-full flex-col rounded-xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-violet-400/50 hover:bg-violet-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <SpriteSlot
                  src={p.spriteSrc}
                  alt={`${p.title} sprite`}
                  fallbackLabel={`${p.title} sprite`}
                  className="aspect-video w-full rounded-lg"
                />
                <h2 className="mt-4 text-xl font-semibold">{p.title}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/50">
                  {p.tag}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 self-start text-xs uppercase tracking-wider text-white/60 transition group-hover:translate-x-1 group-hover:text-violet-200">
                  Open →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
