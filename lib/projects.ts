export type ProjectSlug = "counterstack" | "tripwire" | "glint";

export type Project = {
  slug: ProjectSlug;
  title: string;
  tag: string;
  description: string;
  spriteSrc: string;
  backgroundSrc: string;
  linkLabel: "demo link" | "github link";
};

// Order here drives the on-screen order (top → bottom in the project list).
export const PROJECTS: Project[] = [
  {
    slug: "tripwire",
    title: "TripWire",
    tag: "Serverless AWS Detection and Auto Response",
    description:
      "A serverless AWS pipeline using CloudTrail, EventBridge, and Lambda that detects 5 high risk control plane events across IAM, S3, and EC2 in seconds, mapped to MITRE ATT&CK. Python boto3 remediation Lambdas auto revert public S3 buckets, open security group rules, and unrestricted IAM policies in under 10 seconds.",
    spriteSrc: "/assets/sprites/tripwire.jpg",
    backgroundSrc: "/assets/sprites/tripwire.jpg",
    linkLabel: "github link",
  },
  {
    slug: "glint",
    title: "GLINT",
    tag: "ShinyHunters OSINT Research",
    description:
      "OSINT research project on the ShinyHunters threat cluster across 3 major campaigns (UNC5537, UNC6395, 2026 Canvas extortion). Every claim cited to Mandiant, vendor disclosures, or major news reporting.",
    spriteSrc: "/assets/sprites/glint.jpg",
    backgroundSrc: "/assets/sprites/glint.jpg",
    linkLabel: "github link",
  },
  {
    slug: "counterstack",
    title: "CounterStack",
    tag: "Hacklanta Hackathon Winner",
    description:
      "Built a full stack app in 12 hours that consolidates three SIEM sources into a PostgreSQL backbone, maps NIST CSF assessment data to an AI generated security posture score using Gemini, and visualizes risk as a 4 card poker hand covering resilience, recovery, and technical controls.",
    spriteSrc: "/assets/sprites/counterstack.jpg",
    backgroundSrc: "/assets/sprites/counterstack.jpg",
    linkLabel: "demo link",
  },
];

export const PROJECTS_MAIN_BACKGROUND = "/assets/sprites/projectsmainpage.jpg";

// Character + click-triggered video per project. Add new slugs here as more
// projects ship — each one can have its own portrait + video pairing.
// `credit` is shown under the video in VideoModal once playback starts.
export const PROJECT_CHARACTERS: Record<
  ProjectSlug | "main",
  { img: string; video: string; alt: string; credit?: string }
> = {
  main: {
    img: "/assets/sprites/abrarluffy.png",
    video: "/assets/videos/abrarluffy5.mp4",
    alt: "Abrar as Luffy",
    credit: "itxjoel",
  },
  tripwire: {
    img: "/assets/sprites/sukuna.png",
    video: "/assets/videos/abrartripwire.mp4",
    alt: "Abrar as Sukuna",
    credit: "unknown",
  },
  glint: {
    img: "/assets/sprites/glintpic.png",
    video: "/assets/videos/abrarglint.mp4",
    alt: "Abrar (GLINT)",
    credit: "ysx",
  },
  counterstack: {
    img: "/assets/sprites/abrargambit.png",
    video: "/assets/videos/magicianvideo.mp4",
    alt: "Abrar as Gambit",
    credit: "localcomicsstore",
  },
};

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export const RETURN_TO_KEY = "returnTo";
