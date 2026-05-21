"use client";

import BackButton from "./BackButton";
import SpriteSlot from "./SpriteSlot";

type Props = {
  onBack: () => void;
};

type Project = {
  id: string;
  title: string;
  tag: string;
  description: string;
  spriteSrc: string;
  linkTodo: string;
};

const PROJECTS: Project[] = [
  {
    id: "counterstack",
    title: "CounterStack",
    tag: "Hacklanta Hackathon Winner",
    description:
      "Built a full stack app in 12 hours that consolidates three SIEM sources into a PostgreSQL backbone, maps NIST CSF assessment data to an AI generated security posture score using Gemini, and visualizes risk as a 4 card poker hand covering resilience, recovery, and technical controls.",
    spriteSrc: "/assets/sprites/counterstack.png",
    linkTodo: "demo link",
  },
  {
    id: "tripwire",
    title: "TripWire",
    tag: "Serverless AWS Detection and Auto Response",
    description:
      "A serverless AWS pipeline using CloudTrail, EventBridge, and Lambda that detects 5 high risk control plane events across IAM, S3, and EC2 in seconds, mapped to MITRE ATT&CK. Python boto3 remediation Lambdas auto revert public S3 buckets, open security group rules, and unrestricted IAM policies in under 10 seconds.",
    spriteSrc: "/assets/sprites/tripwire.png",
    linkTodo: "github link",
  },
  {
    id: "glint",
    title: "GLINT",
    tag: "ShinyHunters OSINT Research",
    description:
      "OSINT research project on the ShinyHunters threat cluster across 3 major campaigns (UNC5537, UNC6395, 2026 Canvas extortion). Every claim cited to Mandiant, vendor disclosures, or major news reporting.",
    spriteSrc: "/assets/sprites/glint.png",
    linkTodo: "github link",
  },
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
              className="flex flex-col rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30"
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
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {p.description}
              </p>

              <button
                type="button"
                onClick={() => {
                  // TODO: {p.linkTodo}
                }}
                className="mt-5 inline-flex items-center gap-2 self-start rounded-md border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wider text-white/70 hover:border-white/60 hover:text-white"
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
