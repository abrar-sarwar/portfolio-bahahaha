export type ProjectSlug =
  | "arkham"
  | "netwraith"
  | "tripwire"
  | "leek"
  | "counterstack";

export type ProjectVideo = {
  /** H.264 mp4 — plays in every browser. */
  src: string;
  /** The original export, offered as a second <source> for browsers that can use it. */
  original?: string;
  /** First frame shown before playback. */
  poster?: string;
};

export type Project = {
  slug: ProjectSlug;
  title: string;
  tag: string;
  // Short write-up shown in the detail panel. Optional — most projects are
  // waiting on their copy; when it's missing nothing renders in its place.
  description?: string;
  // Playable demo clip, embedded above the write-up.
  video?: ProjectVideo;
  spriteSrc: string;
  backgroundSrc: string;
  linkLabel: "demo link" | "github link";
  // External destination for the clickable title and the Link button.
  repoUrl?: string;
};

// Order here drives the on-screen order (top → bottom in the project list).
// Newest first.
export const PROJECTS: Project[] = [
  {
    slug: "arkham",
    title: "Arkham",
    tag: "Cyber Threat Intelligence Briefings",
    description:
      "my open source cyber threat intelligence agent. every morning it checks 23 authoritative sources, cuts hundreds of records down to the few correlated events that matter, and posts a skimmable brief to a private discord channel. a language model does the analyst work but never gets to be a source: every claim cites the evidence it came from.",
    spriteSrc: "/assets/sprites/arkhamcity.webp",
    backgroundSrc: "/assets/sprites/arkhamcity.webp",
    linkLabel: "github link",
    repoUrl: "https://github.com/abrar-sarwar/arkham",
  },
  {
    slug: "netwraith",
    title: "NetWraith",
    tag: "Chain Correlation IDS System",
    description:
      "a c++17 intrusion detection engine built on libpcap, paired with a dark mode next.js dashboard. it parses traffic from the link layer up through transport by hand, then matches it against a rule file and three stateful heuristics: sql injection and directory traversal, null, fin and xmas scans, syn floods, icmp sweeps. it ships with a replayable capture, so it needs no root and proves itself in seconds.",
    spriteSrc: "/assets/sprites/netwraitharea.jpg",
    backgroundSrc: "/assets/sprites/netwraitharea.jpg",
    linkLabel: "github link",
    repoUrl: "https://github.com/abrar-sarwar/netwraith",
  },
  {
    slug: "tripwire",
    title: "TripWire",
    tag: "Serverless AWS Detection and Auto Response",
    description:
      "serverless detection and response for the aws control plane: cloudtrail into eventbridge into lambda. five high risk event categories get caught in seconds, and every alert answers who, what, where, when and the att&ck technique. two of them, public s3 buckets and security groups opened to the internet, revert themselves in under sixty seconds, all of it inside the free tier.",
    spriteSrc: "/assets/sprites/tripwire.jpg",
    backgroundSrc: "/assets/sprites/tripwire.jpg",
    linkLabel: "github link",
    repoUrl: "https://github.com/abrar-sarwar/tripwire",
  },
  {
    slug: "leek",
    title: "Leek",
    tag: "CyberLeek GTA VI Case File",
    // No `original` here: the .mov stays untracked, so a second <source>
    // pointing at it would only 404 in production.
    video: {
      src: "/assets/videos/leek.mp4",
      poster: "/assets/videos/leek-poster.jpg",
    },
    description:
      "cyberleek is a living case file on the campaign leaking grand theft auto vi footage, kept the way an intelligence team would: every claim graded, every fact sourced, every unknown written down instead of guessed at. the record proves interactive control of a 2025 or later dev build, four take-two dmca petitions, and a token whose holders vote on the next clip. how the build was obtained is still unknown, and saying so is the finding.",
    spriteSrc: "/assets/sprites/glint.jpg",
    backgroundSrc: "/assets/sprites/glint.jpg",
    linkLabel: "github link",
    repoUrl: "https://github.com/abrar-sarwar/leek",
  },
  {
    slug: "counterstack",
    title: "CounterStack",
    tag: "Hacklanta Hackathon Winner",
    description:
      "a nist security controls card game, built in 12 hours at hacklanta, where it won. every card is a real control and the suits split the framework, spades detect and diamonds harden, so a four card hand reads as a security posture instead of a spreadsheet. the ai boss learns which controls you lean on and starts attacking around them, so the deck that won the last round is the one it's ready for next.",
    video: {
      src: "/assets/videos/counterstack.mp4",
      original: "/assets/videos/counterstack.mov",
      poster: "/assets/videos/counterstack-poster.jpg",
    },
    spriteSrc: "/assets/sprites/counterstack.jpg",
    backgroundSrc: "/assets/sprites/counterstack.jpg",
    linkLabel: "demo link",
    repoUrl: "https://counterstack.dev",
  },
];

export const PROJECTS_MAIN_BACKGROUND = "/assets/sprites/projectsmainpage.jpg";

export type ProjectCharacter = {
  img: string;
  video: string;
  alt: string;
  credit?: string;
  creditLabel?: string;
  // Optional per-character size multiplier for the portrait (default 1).
  scale?: number;
  // Optional horizontal nudge in px for the desktop portrait (negative = left).
  offsetX?: number;
  // When true, the portrait gets a white outline + Gear 5 idle animation.
  gear5?: boolean;
};

// Character + click-triggered video per project. A project without an entry
// here shows the "main" character instead. `credit` is
// shown under the video in VideoModal once playback starts. `creditLabel`
// overrides the lead-in verb (default "video made by") — e.g. leek's video
// is an edit, so it reads "edit by ...".
export const PROJECT_CHARACTERS: Record<"main", ProjectCharacter> &
  Partial<Record<ProjectSlug, ProjectCharacter>> = {
  main: {
    img: "/assets/sprites/abrarluffy.png",
    video: "/assets/videos/abrarluffy5.mp4",
    alt: "Abrar as Luffy",
    credit: "itxjoel",
    gear5: true,
  },
  arkham: {
    img: "/assets/sprites/batman.png",
    video: "/assets/videos/arkham.mp4",
    alt: "Batman (Arkham)",
    credit: "starboy14k",
  },
  netwraith: {
    img: "/assets/sprites/dantenetwraith.png",
    video: "/assets/videos/netwraithvideo.mp4",
    alt: "Abrar as Dante (NetWraith)",
    scale: 1.15,
    offsetX: -120,
    credit: "dev",
    creditLabel: "edited by",
  },
  tripwire: {
    img: "/assets/sprites/sukuna.png",
    video: "/assets/videos/abrartripwire.mp4",
    alt: "Abrar as Sukuna",
    credit: "unknown",
  },
  leek: {
    img: "/assets/sprites/glintpic.png",
    video: "/assets/videos/abrarglint.mp4",
    alt: "Abrar (Leek)",
    credit: "_sarah.aep",
    creditLabel: "edit by",
  },
  counterstack: {
    img: "/assets/sprites/abrargambit.png",
    video: "/assets/videos/magicianvideo.mp4",
    alt: "Abrar as Gambit",
    credit: "localcomicsstore",
  },
};

/** Every configured character, for preloading. */
export const PROJECT_CHARACTER_LIST: ProjectCharacter[] = Object.values(
  PROJECT_CHARACTERS,
).filter((c): c is ProjectCharacter => Boolean(c));

// Per-project accent so the projects view isn't one flat purple. `text` is a
// readable label/title color on the dark background; `glow` is an "r,g,b" triplet
// fed into rgba() for borders, halos, and shadows. "main" is the default
// (unselected) violet.
export type ProjectAccent = { text: string; glow: string };

export const PROJECT_ACCENTS: Record<ProjectSlug | "main", ProjectAccent> = {
  main: { text: "#c4b5fd", glow: "167,139,250" }, // violet (default)
  arkham: { text: "#a3e635", glow: "77,124,15" }, // acid green
  netwraith: { text: "#ef4444", glow: "153,27,27" }, // dark red
  tripwire: { text: "#ffffff", glow: "229,231,235" }, // white
  leek: { text: "#60a5fa", glow: "30,58,138" }, // dark blue
  counterstack: { text: "#f87171", glow: "220,38,38" }, // red
};

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export const RETURN_TO_KEY = "returnTo";
