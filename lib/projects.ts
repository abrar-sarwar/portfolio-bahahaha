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
      "my open source cyber threat intelligence briefing system. it pulls the feeds, advisories and vendor reports that move every day and cuts them down to the handful of things worth acting on. keeping up with the threat landscape becomes a five minute habit instead of an afternoon in twelve tabs.",
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
      "a c++ network intrusion detection engine that reads live traffic off libpcap. instead of firing one flat alert per rule, it keeps a running score for every source address as the stages of an attack line up. a scan that becomes a brute force that becomes an exfil attempt shows up as one rising threat with a story attached, not fifty disconnected lines in a log.",
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
      "serverless detection and automatic response on aws, wiring cloudtrail to eventbridge to lambda. it catches five high risk control plane events across iam, s3 and ec2 in seconds and maps each one to mitre att&ck. public buckets, open security groups and unrestricted iam policies get reverted in under a minute, with no human in the loop.",
    spriteSrc: "/assets/sprites/tripwire.jpg",
    backgroundSrc: "/assets/sprites/tripwire.jpg",
    linkLabel: "github link",
    repoUrl: "https://github.com/abrar-sarwar/tripwire",
  },
  {
    slug: "leek",
    title: "Leek",
    tag: "GTA 6 Leak Research",
    // No `original` here: the .mov stays untracked, so a second <source>
    // pointing at it would only 404 in production.
    video: {
      src: "/assets/videos/leek.mp4",
      poster: "/assets/videos/leek-poster.jpg",
    },
    description:
      "cyberleek is my research on the gta 6 leak, the one where rockstar's own development footage was online before the game was. i traced how it actually happened, social engineering rather than some exotic exploit, and what that costs a studio sitting on unreleased work. the lesson is the uncomfortable one: the perimeter held, and a conversation walked straight through it.",
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
