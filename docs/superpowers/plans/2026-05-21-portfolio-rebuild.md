# Portfolio Rebuild Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing React/Vite "galaxy mode" portfolio with a Next.js 14 + TypeScript + Tailwind + Framer Motion foundation containing five views (intro → home → projects → organizations → fun) wired together with cube-rotation transitions and clearly marked placeholders.

**Architecture:** Single-page state machine in `app/page.tsx` selects which view component to render inside `<SectionTransition>`, a Framer Motion wrapper that animates a `rotateY` cube-face exit/enter. Intro video uses an audio-on autoplay attempt with a Click-to-Play fallback when the browser rejects the play promise.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS v3, Framer Motion v11.

**Reference spec:** `docs/superpowers/specs/2026-05-21-portfolio-rebuild-design.md`

---

## Notes on tests

This foundation has no automated test framework. The spec explicitly scopes automated tests out. Verification for each task is **manual via `npm run dev`** — the steps below list what to look for in the browser. Where pure logic (not UI) would benefit from a quick assertion, the task says so.

## Notes on commits

Commit after every task. Use conventional commit prefixes (`feat:`, `chore:`, `refactor:`). Do NOT use `git add -A` or `git add .` — explicit paths only, per repo guidance.

---

## Task 1: Snapshot current branch and archive old data

**Files:**
- Create: `_archive/old-portfolio-content.js` (moved from `src/data/content.js`)
- Create: `_archive/old-portfolio-planets.js` (moved from `src/data/planets.js`)

- [ ] **Step 1: Verify git state is clean enough to commit a snapshot**

Run: `git status`
Expected: shows current uncommitted state. We're on branch `ohcrap`. Do not panic about deleted files in the index — they reflect prior session work.

- [ ] **Step 2: Stage and commit current state as a snapshot**

```bash
git add -u  # stage deletions and modifications already in index
git status  # confirm what's staged
```

Then commit:

```bash
git commit -m "$(cat <<'EOF'
chore: snapshot ohcrap branch before Next.js rebuild

Preserves old galaxy-mode portfolio state in git history before
wiping src/ and migrating to Next.js 14.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds. If pre-commit hooks fail, fix and create a NEW commit (do not amend).

- [ ] **Step 3: Move old data files to _archive/**

```bash
mkdir -p _archive
git mv src/data/content.js _archive/old-portfolio-content.js
git mv src/data/planets.js _archive/old-portfolio-planets.js
```

- [ ] **Step 4: Commit the archive move**

```bash
git add _archive/old-portfolio-content.js _archive/old-portfolio-planets.js
git commit -m "$(cat <<'EOF'
chore: archive old portfolio content for future placeholder fill-in

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Delete old Vite/React codebase

**Files:**
- Delete: `src/` (entire directory)
- Delete: `index.html`
- Delete: `vite.config.js`
- Delete: `dist/`
- Delete: `package.json` and `package-lock.json` (to be regenerated)
- Delete: `node_modules/` (to be regenerated)

- [ ] **Step 1: Delete the directories and files**

```bash
rm -rf src dist node_modules
rm -f index.html vite.config.js package.json package-lock.json
```

- [ ] **Step 2: Verify what remains**

Run: `ls -la`
Expected: `.git/`, `.claude/`, `.DS_Store`, `_archive/`, `docs/`, `public/` remain.

- [ ] **Step 3: Commit the wipe**

```bash
git add -u
git commit -m "$(cat <<'EOF'
chore: remove old Vite/React source for Next.js rewrite

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Rename video folder and create asset placeholders

**Files:**
- Rename: `public/assets/video/` → `public/assets/videos/`
- Create: `public/assets/icons/.gitkeep`
- Create: `public/assets/icons/README.md`
- Create: `public/assets/videos/README-VIDEOS.md`

- [ ] **Step 1: Rename the video folder**

```bash
git mv public/assets/video public/assets/videos
```

- [ ] **Step 2: Create icons folder with .gitkeep**

```bash
mkdir -p public/assets/icons
touch public/assets/icons/.gitkeep
```

- [ ] **Step 3: Write icons README**

Create `public/assets/icons/README.md`:

```markdown
# Icons

Drop SVG/PNG icons here. Reference from components as `/assets/icons/<name>.svg`.

Nothing here yet — `.gitkeep` keeps the folder tracked.
```

- [ ] **Step 4: Write videos README**

Create `public/assets/videos/README-VIDEOS.md`:

````markdown
# Videos

Drop source `.mov` or `.mp4` files here. Each video should be exported in three formats so every browser can play it:

| Format | Purpose |
|---|---|
| `.mp4` (H.264 + AAC) | Universal — Chrome, Firefox, Safari, Edge |
| `.webm` (VP9 + Opus) | Smaller file size for Firefox/Chrome fallback |
| `.mov` | Original — Safari can play this directly; kept for archival |

## Conversion commands

Install ffmpeg once: `brew install ffmpeg` (macOS) or `sudo apt install ffmpeg` (Linux/WSL).

### MP4 (high quality)

```bash
ffmpeg -i input.mov \
  -c:v libx264 -preset slow -crf 20 \
  -c:a aac -b:a 160k \
  -movflags +faststart \
  -pix_fmt yuv420p \
  output.mp4
```

- `-movflags +faststart` puts the moov atom at the start so playback can begin before download completes.
- `-pix_fmt yuv420p` is required for Safari/iOS compatibility.
- Bump `-crf` to `23` if file size is too large.

### WebM (fallback)

```bash
ffmpeg -i input.mov \
  -c:v libvpx-vp9 -crf 32 -b:v 0 \
  -c:a libopus -b:a 128k \
  output.webm
```

### Skip re-conversion if output is newer

```bash
[ output.mp4 -nt input.mov ] || ffmpeg -i input.mov ... output.mp4
```
````

- [ ] **Step 5: Commit asset scaffolding**

```bash
git add public/assets/videos/README-VIDEOS.md public/assets/icons/.gitkeep public/assets/icons/README.md
git commit -m "$(cat <<'EOF'
chore: rename videos folder, add icons scaffold, document video conversion

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Initialize Next.js project files

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `.gitignore`
- Create: `next-env.d.ts` (generated by tsc on first build, but we precreate to avoid surprise)

- [ ] **Step 1: Write package.json**

Create `package.json`:

```json
{
  "name": "portfolio-bahahaha",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.18",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "framer-motion": "11.11.17"
  },
  "devDependencies": {
    "@types/node": "20.11.0",
    "@types/react": "18.3.12",
    "@types/react-dom": "18.3.1",
    "autoprefixer": "10.4.20",
    "eslint": "8.57.1",
    "eslint-config-next": "14.2.18",
    "postcss": "8.4.49",
    "tailwindcss": "3.4.15",
    "typescript": "5.6.3"
  }
}
```

- [ ] **Step 2: Write tsconfig.json**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "_archive"]
}
```

- [ ] **Step 3: Write next.config.mjs**

Create `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: Write postcss.config.mjs**

Create `postcss.config.mjs`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Write tailwind.config.ts**

Create `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        home: "#290000",
        projects: "#022C39",
        progsu: "#26013D",
        cyber: "#020059",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 6: Write .gitignore**

Create `.gitignore`:

```
# Next.js
.next/
out/
next-env.d.ts

# Dependencies
node_modules/

# macOS
.DS_Store

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*

# Environment
.env*.local
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: completes without errors. `node_modules/` and `package-lock.json` appear.

- [ ] **Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output (success). If `next-env.d.ts` is missing, run `npx next` once to generate it (Ctrl+C immediately after it boots).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts .gitignore
git commit -m "$(cat <<'EOF'
chore: scaffold Next.js 14 + TypeScript + Tailwind + Framer Motion

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: App shell — layout + global styles

**Files:**
- Create: `app/layout.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Write globals.css**

Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  margin: 0;
  padding: 0;
  background: #000;
  color: #fff;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Write app/layout.tsx**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abrar Sarwar",
  description: "Portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden bg-black text-white">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "$(cat <<'EOF'
feat: add root layout and global styles

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Section types + small shared components

**Files:**
- Create: `lib/sections.ts`
- Create: `components/BackButton.tsx`
- Create: `components/SkipButton.tsx`
- Create: `components/SpriteSlot.tsx`

- [ ] **Step 1: Write lib/sections.ts**

Create `lib/sections.ts`:

```ts
export type View = "intro" | "home" | "projects" | "organizations" | "fun";

export type SubView = Exclude<View, "intro" | "home">;

export type Direction = "forward" | "back";
```

- [ ] **Step 2: Write components/BackButton.tsx**

Create `components/BackButton.tsx`:

```tsx
"use client";

type Props = {
  onClick: () => void;
};

export default function BackButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to home"
      className="fixed top-6 left-6 z-50 px-4 py-2 rounded-md border border-white/40 bg-black/40 text-white text-sm tracking-wide backdrop-blur hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      ← Back
    </button>
  );
}
```

- [ ] **Step 3: Write components/SkipButton.tsx**

Create `components/SkipButton.tsx`:

```tsx
"use client";

type Props = {
  onClick: () => void;
};

export default function SkipButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Skip intro"
      className="fixed top-6 right-6 z-50 px-4 py-2 rounded-md border border-white/60 bg-black/60 text-white text-sm tracking-wide backdrop-blur hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      Skip →
    </button>
  );
}
```

- [ ] **Step 4: Write components/SpriteSlot.tsx**

Create `components/SpriteSlot.tsx`:

```tsx
"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  fallbackLabel: string;
  className?: string;
};

export default function SpriteSlot({
  src,
  alt,
  fallbackLabel,
  className = "",
}: Props) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        role="img"
        aria-label={fallbackLabel}
        className={`flex items-center justify-center border-2 border-dashed border-white/40 text-white/60 text-xs tracking-wide uppercase ${className}`}
      >
        {fallbackLabel}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className={className}
    />
  );
}
```

We use a plain `<img>` instead of `next/image` because the foundation needs to gracefully tolerate missing assets via `onError`. `next/image` would throw and fail the build for a missing src.

- [ ] **Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/sections.ts components/BackButton.tsx components/SkipButton.tsx components/SpriteSlot.tsx
git commit -m "$(cat <<'EOF'
feat: add BackButton, SkipButton, SpriteSlot, and section types

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: SectionTransition (cube rotation)

**Files:**
- Create: `components/SectionTransition.tsx`

- [ ] **Step 1: Write components/SectionTransition.tsx**

Create `components/SectionTransition.tsx`:

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Direction } from "@/lib/sections";

type Props = {
  viewKey: string;
  direction: Direction;
  children: React.ReactNode;
};

const EASE = [0.65, 0, 0.35, 1] as const;

export default function SectionTransition({
  viewKey,
  direction,
  children,
}: Props) {
  const sign = direction === "forward" ? 1 : -1;

  return (
    <div
      className="relative h-screen w-screen"
      style={{ perspective: 1400 }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={viewKey}
          initial={{ rotateY: 90 * sign, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90 * sign, opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            backfaceVisibility: "hidden",
          }}
          className="absolute inset-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/SectionTransition.tsx
git commit -m "$(cat <<'EOF'
feat: add SectionTransition cube-rotation wrapper

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: IntroVideo component

**Files:**
- Create: `components/IntroVideo.tsx`

- [ ] **Step 1: Write components/IntroVideo.tsx**

Create `components/IntroVideo.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import SkipButton from "./SkipButton";

type Props = {
  onComplete: () => void;
};

export default function IntroVideo({ onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [needsClickToPlay, setNeedsClickToPlay] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.volume = 1;
    const attempt = v.play();
    if (attempt && typeof attempt.then === "function") {
      attempt.catch(() => {
        setNeedsClickToPlay(true);
      });
    }
  }, []);

  const handleClickToPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.volume = 1;
    v.play().then(
      () => setNeedsClickToPlay(false),
      () => setNeedsClickToPlay(true)
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <video
        ref={videoRef}
        playsInline
        onEnded={onComplete}
        className="h-full w-full object-cover"
      >
        <source src="/assets/videos/opening.mp4" type="video/mp4" />
        <source src="/assets/videos/opening.webm" type="video/webm" />
        <source src="/assets/videos/opening.mov" type="video/quicktime" />
        <track kind="captions" srcLang="en" label="English captions" />
      </video>

      <SkipButton onClick={onComplete} />

      {needsClickToPlay && (
        <button
          type="button"
          onClick={handleClickToPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-2xl tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Click to play intro with sound"
        >
          <span className="px-6 py-3 rounded-full border border-white/70">
            ▶ Click to Play with Sound
          </span>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/IntroVideo.tsx
git commit -m "$(cat <<'EOF'
feat: add IntroVideo with autoplay-with-sound and Click-to-Play fallback

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: HomePage component

**Files:**
- Create: `components/HomePage.tsx`

- [ ] **Step 1: Write components/HomePage.tsx**

Create `components/HomePage.tsx`:

```tsx
"use client";

import type { SubView } from "@/lib/sections";

type Props = {
  onNavigate: (view: SubView) => void;
};

const TILES: { id: SubView; label: string; accent: string }[] = [
  { id: "projects", label: "Projects", accent: "from-cyan-400/40 to-cyan-900/0" },
  { id: "organizations", label: "Organizations", accent: "from-fuchsia-400/40 to-fuchsia-900/0" },
  { id: "fun", label: "Fun", accent: "from-amber-300/40 to-amber-900/0" },
];

export default function HomePage({ onNavigate }: Props) {
  return (
    <main className="h-full w-full overflow-y-auto bg-home text-white">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <header className="mb-16 space-y-4">
          {/* TODO: name */}
          <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight">
            <span className="text-white/40">[ TODO: name ]</span>
          </h1>

          {/* TODO: bio */}
          <p className="max-w-2xl text-base sm:text-lg text-white/70">
            <span className="text-white/40">[ TODO: bio — short intro, role, location ]</span>
          </p>

          {/* TODO: socials */}
          <ul className="flex flex-wrap gap-4 text-sm text-white/60">
            <li className="text-white/40">[ TODO: socials — email / github / linkedin ]</li>
          </ul>
        </header>

        <section
          aria-label="Sections"
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {TILES.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => onNavigate(tile.id)}
              className={`group relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${tile.accent} p-6 text-left transition hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
            >
              <span className="absolute top-4 left-4 text-xs uppercase tracking-widest text-white/50">
                Section
              </span>
              <span className="absolute bottom-6 left-6 text-3xl font-semibold tracking-tight">
                {tile.label}
              </span>
              <span className="absolute bottom-6 right-6 text-white/40 transition group-hover:translate-x-1 group-hover:text-white">
                →
              </span>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/HomePage.tsx
git commit -m "$(cat <<'EOF'
feat: add HomePage with bio TODOs and three section tiles

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: ProjectsPage component

**Files:**
- Create: `components/ProjectsPage.tsx`

- [ ] **Step 1: Write components/ProjectsPage.tsx**

Create `components/ProjectsPage.tsx`:

```tsx
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
              {/* TODO: project-{p.id} sprite */}
              <SpriteSlot
                src={`/assets/sprites/project-${p.id}.png`}
                alt={`${p.title} sprite`}
                fallbackLabel={`Project ${p.id} sprite`}
                className="aspect-video w-full rounded-lg"
              />

              {/* TODO: project-{p.id} details */}
              <h2 className="mt-4 text-xl font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm text-white/60">
                <span className="text-white/40">
                  [ TODO: short description for {p.title} ]
                </span>
              </p>

              {/* TODO: project-{p.id} link */}
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
```

- [ ] **Step 2: Commit**

```bash
git add components/ProjectsPage.tsx
git commit -m "$(cat <<'EOF'
feat: add ProjectsPage with 3 placeholder project cards

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: OrganizationsPage component

**Files:**
- Create: `components/OrganizationsPage.tsx`

- [ ] **Step 1: Write components/OrganizationsPage.tsx**

Create `components/OrganizationsPage.tsx`:

```tsx
"use client";

import BackButton from "./BackButton";
import SpriteSlot from "./SpriteSlot";

type Props = {
  onBack: () => void;
};

type OrgEntry = {
  id: string;
  role: string;
  dates: string;
  logoSrc: string;
};

const PROGSU_ENTRIES: OrgEntry[] = [
  {
    id: "progsu-1",
    role: "[ TODO: progsu entry-1 role ]",
    dates: "[ TODO: dates ]",
    logoSrc: "/assets/sprites/progsu-1-logo.png",
  },
  {
    id: "progsu-2",
    role: "[ TODO: progsu entry-2 role ]",
    dates: "[ TODO: dates ]",
    logoSrc: "/assets/sprites/progsu-2-logo.png",
  },
];

const CYBER_ENTRIES: OrgEntry[] = [
  {
    id: "cyber-1",
    role: "[ TODO: cyber entry-1 role ]",
    dates: "[ TODO: dates ]",
    logoSrc: "/assets/sprites/cyber-1-logo.png",
  },
  {
    id: "cyber-2",
    role: "[ TODO: cyber entry-2 role ]",
    dates: "[ TODO: dates ]",
    logoSrc: "/assets/sprites/cyber-2-logo.png",
  },
];

function OrgEntryCard({ entry }: { entry: OrgEntry }) {
  return (
    <article className="flex gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
      <SpriteSlot
        src={entry.logoSrc}
        alt={`${entry.role} logo`}
        fallbackLabel="Logo"
        className="h-16 w-16 shrink-0 rounded-lg"
      />
      <div className="flex flex-col">
        <h3 className="text-base font-semibold text-white">{entry.role}</h3>
        <p className="text-xs text-white/50">{entry.dates}</p>
        <p className="mt-2 text-sm text-white/60">
          <span className="text-white/40">
            [ TODO: description for {entry.id} ]
          </span>
        </p>
      </div>
    </article>
  );
}

export default function OrganizationsPage({ onBack }: Props) {
  return (
    <main className="flex h-full w-full flex-col overflow-y-auto text-white">
      <BackButton onClick={onBack} />

      <section className="flex-1 bg-progsu px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Organization
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">ProgSU</h2>
          </header>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* TODO: progsu entry-1, entry-2 */}
            {PROGSU_ENTRIES.map((e) => (
              <OrgEntryCard key={e.id} entry={e} />
            ))}
          </div>
        </div>
      </section>

      <section className="flex-1 bg-cyber px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Organization
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold">
              Cybersecurity Club
            </h2>
          </header>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* TODO: cyber entry-1, entry-2 */}
            {CYBER_ENTRIES.map((e) => (
              <OrgEntryCard key={e.id} entry={e} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/OrganizationsPage.tsx
git commit -m "$(cat <<'EOF'
feat: add OrganizationsPage with ProgSU/Cyber split sections

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: FunPage component

**Files:**
- Create: `components/FunPage.tsx`

- [ ] **Step 1: Write components/FunPage.tsx**

Create `components/FunPage.tsx`:

```tsx
"use client";

import BackButton from "./BackButton";
import SpriteSlot from "./SpriteSlot";

type Props = {
  onBack: () => void;
};

export default function FunPage({ onBack }: Props) {
  return (
    <main className="relative h-full w-full bg-black text-white">
      <BackButton onClick={onBack} />

      <div className="flex h-full w-full items-center justify-center">
        <SpriteSlot
          src="/assets/sprites/abrarshoot.png"
          alt="Fun sprite"
          fallbackLabel="abrarshoot.png"
          className="max-h-[70vh] max-w-[70vw] object-contain"
        />
      </div>

      {/* TODO: fun interactive content */}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/FunPage.tsx
git commit -m "$(cat <<'EOF'
feat: add FunPage with centered sprite slot

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: app/page.tsx — state machine orchestrator

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Write app/page.tsx**

Create `app/page.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SectionTransition from "@/components/SectionTransition";
import IntroVideo from "@/components/IntroVideo";
import HomePage from "@/components/HomePage";
import ProjectsPage from "@/components/ProjectsPage";
import OrganizationsPage from "@/components/OrganizationsPage";
import FunPage from "@/components/FunPage";
import type { Direction, SubView, View } from "@/lib/sections";

const INTRO_STORAGE_KEY = "intro-seen";

export default function Page() {
  const [view, setView] = useState<View>("intro");
  const [direction, setDirection] = useState<Direction>("forward");
  const hasMounted = useRef(false);

  // sessionStorage gate — only on the client, after first paint.
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    try {
      if (sessionStorage.getItem(INTRO_STORAGE_KEY) === "1") {
        setView("home");
      }
    } catch {
      // sessionStorage may throw in privacy modes; ignore.
    }
  }, []);

  const completeIntro = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setDirection("forward");
    setView("home");
  }, []);

  const goToSubView = useCallback((sub: SubView) => {
    setDirection("forward");
    setView(sub);
  }, []);

  const goHome = useCallback(() => {
    setDirection("back");
    setView("home");
  }, []);

  const renderView = () => {
    switch (view) {
      case "intro":
        return <IntroVideo onComplete={completeIntro} />;
      case "home":
        return <HomePage onNavigate={goToSubView} />;
      case "projects":
        return <ProjectsPage onBack={goHome} />;
      case "organizations":
        return <OrganizationsPage onBack={goHome} />;
      case "fun":
        return <FunPage onBack={goHome} />;
    }
  };

  // The intro is rendered outside the cube transition because the first paint
  // shouldn't animate. Once intro completes, every transition flows through
  // SectionTransition.
  if (view === "intro") {
    return renderView();
  }

  return (
    <SectionTransition viewKey={view} direction={direction}>
      {renderView()}
    </SectionTransition>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Boot dev server**

Run: `npm run dev`
Expected: server starts on http://localhost:3000.

Open the browser and check:

1. First visit (or fresh tab): black screen with the video element. If browser blocks audio autoplay, the **▶ Click to Play with Sound** overlay appears. Click — video plays with sound.
2. Skip button (top-right) advances to home (#290000) with no rotation (first appearance).
3. Click Projects tile → cube rotation to #022C39. Back button (top-left) reverses rotation to home.
4. Click Organizations → cube rotation to split #26013D / #020059. Back reverses.
5. Click Fun → cube rotation to black with sprite (or placeholder). Back reverses.
6. Refresh the tab → intro is skipped, home appears immediately.
7. Open in a new tab/session → intro plays again.

Kill the server (`Ctrl+C`) once verified.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "$(cat <<'EOF'
feat: wire up state-machine orchestrator with cube transitions

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Convert intro video (ffmpeg)

**Files:**
- Create: `public/assets/videos/opening.mp4`
- Create: `public/assets/videos/opening.webm`

This task is **conditional**. If `ffmpeg` is not installed, skip — the foundation works without the converted formats (Safari plays the `.mov`, other browsers show Click-to-Play and a missing-source error in the dev console, which is documented expected behavior).

- [ ] **Step 1: Check ffmpeg**

Run: `which ffmpeg && ffmpeg -version | head -1`
Expected: a path and a version banner. If not, skip to Task 15.

- [ ] **Step 2: Check input exists**

Run: `ls -lh public/assets/videos/opening.mov`
Expected: file present. If missing, skip the conversion (the README already documents the commands).

- [ ] **Step 3: Convert to mp4 if needed**

Run:

```bash
if [ ! public/assets/videos/opening.mp4 -nt public/assets/videos/opening.mov ]; then
  ffmpeg -y -i public/assets/videos/opening.mov \
    -c:v libx264 -preset slow -crf 20 \
    -c:a aac -b:a 160k \
    -movflags +faststart -pix_fmt yuv420p \
    public/assets/videos/opening.mp4
fi
```

Expected: file `opening.mp4` exists.

- [ ] **Step 4: Convert to webm if needed**

Run:

```bash
if [ ! public/assets/videos/opening.webm -nt public/assets/videos/opening.mov ]; then
  ffmpeg -y -i public/assets/videos/opening.mov \
    -c:v libvpx-vp9 -crf 32 -b:v 0 \
    -c:a libopus -b:a 128k \
    public/assets/videos/opening.webm
fi
```

Expected: file `opening.webm` exists.

- [ ] **Step 5: Sanity-check file sizes**

Run: `ls -lh public/assets/videos/opening.*`
Expected: `.mp4` typically 30–60% of `.mov` size, `.webm` smaller still.

- [ ] **Step 6: Commit**

```bash
git add public/assets/videos/opening.mp4 public/assets/videos/opening.webm
git commit -m "$(cat <<'EOF'
feat: convert intro video to mp4 + webm for cross-browser support

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: README.md at project root

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

Create `README.md`:

````markdown
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
  - `TODO: project-NN sprite` — per-card image path
  - `TODO: project-NN details` — title + description
  - `TODO: project-NN link` — "View" button action (link or modal)
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
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: add README for asset paths, TODO markers, and architecture notes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Final verification pass

- [ ] **Step 1: Clean install check**

Run:

```bash
rm -rf node_modules .next
npm install
npm run build
```

Expected: `next build` completes with no errors. Type errors here block completion.

- [ ] **Step 2: Boot dev server and walk the full flow**

Run: `npm run dev`

Walk through every flow described in Task 13 Step 3 once more. Confirm:

- Intro plays with sound (or shows Click-to-Play overlay)
- Skip works
- Three tiles rotate forward into their subpage
- Back rotates back to home (reversed direction)
- Refresh skips intro
- Fresh browser session replays intro
- Mobile layout (use browser devtools responsive mode at 375px): home tiles stack, organizations stacks the two color zones, no horizontal scroll

- [ ] **Step 3: Final commit if anything was tweaked**

If verification surfaced fixes:

```bash
git add <files>
git commit -m "$(cat <<'EOF'
fix: <what>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Otherwise, nothing to do.

---

## Self-review notes

- **Spec coverage:**
  - Intro video with audio-on autoplay + Click-to-Play → Task 8.
  - Cube rotation → Task 7.
  - Home #290000 + bio TODOs + 3 tiles → Task 9.
  - Projects #022C39 + ≥3 cards → Task 10.
  - Organizations split #26013D / #020059 + ≥2 entries each → Task 11.
  - Fun black + abrarshoot.png + TODO area → Task 12.
  - Back button on every sub-page → Tasks 10–12 each call `<BackButton>`.
  - SpriteSlot with fallback → Task 6.
  - Video conversion → Task 14 (conditional on ffmpeg).
  - README with asset paths, TODO list, ffmpeg commands → Tasks 3 + 15.
  - Mobile responsive → Verified in Task 16.
  - Accessibility (aria-label, keyboard, captions track) → Tasks 6 (buttons), 8 (track), 13 (button semantics).
  - `prefers-reduced-motion` → Task 5 (globals.css).

- **Placeholder scan:** No "TBD" or "implement later" markers in plan steps. All TODO markers in the code are deliberate placeholders for the user's later content.

- **Type consistency:** `View`, `SubView`, `Direction` defined in Task 6 and used consistently in Tasks 7, 9, 13. `SpriteSlot` props (`src`, `alt`, `fallbackLabel`, `className`) match across all usages.
