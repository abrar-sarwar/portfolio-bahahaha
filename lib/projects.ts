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
      "my open source cyber threat intelligence briefing system. it pulls from the feeds, advisories and vendor reports that move every day, cuts the noise, and turns what is left into a short briefing i would actually read before starting work. the point is to make keeping up with the threat landscape a five minute habit instead of an afternoon spent in twelve tabs.",
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
      "a c++ network intrusion detection engine with per source kill chain correlation. it reads live traffic off libpcap and, instead of firing one flat alert per rule, keeps a running score for every source address as the stages of an attack line up. a scan that turns into a brute force that turns into an exfil attempt surfaces as one rising threat with a story attached, not fifty disconnected lines in a log. a next.js dashboard sits on top so you can watch a source climb in real time.",
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
      "serverless detection and automatic response on aws. cloudtrail feeds eventbridge, eventbridge feeds lambda, and five high risk control plane events across iam, s3 and ec2 get caught in seconds and mapped to mitre att&ck. python remediation handlers then reverse the damage on their own: public buckets closed, open security group rules pulled, unrestricted iam policies rolled back. under a minute, no human in the loop, and every action it takes is logged so the response is auditable after the fact.",
    spriteSrc: "/assets/sprites/tripwire.jpg",
    backgroundSrc: "/assets/sprites/tripwire.jpg",
    linkLabel: "github link",
    repoUrl: "https://github.com/abrar-sarwar/tripwire",
  },
  {
    slug: "leek",
    title: "Leek",
    tag: "ShinyHunters OSINT Research",
    // No `original` here: the .mov stays untracked, so a second <source>
    // pointing at it would only 404 in production.
    video: {
      src: "/assets/videos/leek.mp4",
      poster: "/assets/videos/leek-poster.jpg",
    },
    description:
      "osint research on shinyhunters, the extortion collective behind a long run of breaches. i pulled the scattered reporting across three major campaigns, unc5537, unc6395 and the 2026 canvas extortion, into a single cluster dossier: how they get in, how they monetize, and which overlaps actually hold up. every claim is cited to mandiant, vendor disclosures or major reporting, and it ends with detections a defender can put to use rather than another timeline. it used to be called glint.",
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
      "a nist security controls card game, built in 12 hours at hacklanta, where it won. the framework becomes a deck: spades detect, diamonds harden, and the remaining suits carry the response and recovery side, so a four card hand reads as a security posture instead of a spreadsheet. every card is a real control, which means you learn the catalog by playing it rather than by reading it. the twist is the ai boss. it watches which controls you lean on, learns the shape of your defense, and starts attacking around it, so the deck that carried the last round is the one it is ready for next. security training you actually play.",
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
