# Portfolio (Next.js rebuild)

Foundation for the page-based portfolio. Intro video → home → projects / organizations / fun, connected by Framer Motion cube-rotation transitions.

## Quickstart

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Where to drop assets

| Asset | Path | Notes |
|---|---|---|
| Intro video | `public/assets/videos/opening.{mp4,webm,mov}` | All three formats recommended for cross-browser. See `public/assets/videos/README-VIDEOS.md` for the ffmpeg conversion commands. |
| Project sprites | `public/assets/sprites/project-01.png`, `project-02.png`, `project-03.png` | Each `<SpriteSlot>` falls back to a labeled dashed box if missing — no crash. |
| Org logos | `public/assets/sprites/progsu-1-logo.png`, `progsu-2-logo.png`, `cyber-1-logo.png`, `cyber-2-logo.png` | Same fallback behavior. |
| Fun page sprite | `public/assets/sprites/abrarshoot.png` | Already present from the old portfolio. |
| Icons | `public/assets/icons/` | Empty — drop SVG/PNG icons here when needed. |

## TODO markers

The foundation deliberately leaves content placeholders. Search for `TODO` across the repo to find them — every marker is intentional. Grouped by file:

- `components/HomePage.tsx`
  - `TODO: name` — top-level display name
  - `TODO: bio` — short intro / role / location
  - `TODO: socials` — email, github, linkedin, etc.
- `components/ProjectsPage.tsx`
  - `TODO: project-{id} sprite` — per-card image path
  - `TODO: project-{id} details` — title + description
  - `TODO: project-{id} link` — "View" button action (link or modal)
- `components/OrganizationsPage.tsx`
  - `TODO: progsu entry-1, entry-2` — ProgSU roles
  - `TODO: cyber entry-1, entry-2` — Cybersecurity Club roles
- `components/FunPage.tsx`
  - `TODO: fun interactive content` — future game/interactive area

Old rich content from the previous portfolio (CounterStack, TripWire, GLINT descriptions, club role details) is preserved at `_archive/old-portfolio-content.js` for copy-paste.

## How to add more projects

In `components/ProjectsPage.tsx`, extend the `PROJECTS` array:

```ts
const PROJECTS = [
  { id: "01", title: "Project 01" },
  { id: "02", title: "Project 02" },
  { id: "03", title: "Project 03" },
  { id: "04", title: "Project 04" }, // ← add here
];
```

Drop a matching sprite at `public/assets/sprites/project-04.png` and the card renders with the image; without it, the dashed placeholder still keeps the layout intact.

## How to add more org entries

In `components/OrganizationsPage.tsx`, extend `PROGSU_ENTRIES` or `CYBER_ENTRIES`:

```ts
const PROGSU_ENTRIES: OrgEntry[] = [
  // existing entries...
  {
    id: "progsu-3",
    role: "New role title",
    dates: "Month YYYY – Present",
    logoSrc: "/assets/sprites/progsu-3-logo.png",
  },
];
```

## Adding new video assets

1. Drop the `.mov` (or `.mp4`) into `public/assets/videos/`.
2. Convert to all three formats with the commands in `public/assets/videos/README-VIDEOS.md`.
3. Reference in JSX with three `<source>` tags so every browser picks the format it supports.

## Architecture

All five views live in `app/page.tsx` as states (`intro | home | projects | organizations | fun`). Cube rotation is a single `<SectionTransition>` wrapper using Framer Motion's `<AnimatePresence>` with `rotateY` exit/enter. Forward (home → subpage) and back (subpage → home) flip the rotation direction so the cube feels coherent.

`sessionStorage["intro-seen"]` skips the intro on refresh; a new tab replays it.

## Notes

- The intro plays with audio on by default. Most browsers block this until the user interacts with the page; if `play()` rejects, a **"▶ Click to Play with Sound"** overlay appears. There is no silent fallback by design.
- `<SpriteSlot>` always tries the image first and falls back to a labeled dashed box on `onError`, so missing assets never break layout.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 3
- Framer Motion 12
