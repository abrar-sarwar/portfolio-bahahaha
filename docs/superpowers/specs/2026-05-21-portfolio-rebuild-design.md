# Portfolio Rebuild — Foundation Design

**Date:** 2026-05-21
**Status:** Approved scope; awaiting implementation

## Goal

Replace the existing React/Vite "galaxy mode" portfolio with a Next.js 14 page-based site that uses 3D cube-rotation transitions between five views: intro video → home → projects → organizations → fun. This is the **foundation only** — placeholders go where future copy, sprites, and project details will live.

## Stack

- Next.js 14+ (App Router), React 18, TypeScript
- Tailwind CSS for styling
- Framer Motion for cube-face rotation transitions
- No additional design libraries

## File tree

```
portfolio-bahahaha/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # state machine: intro|home|projects|organizations|fun
│   └── globals.css
├── components/
│   ├── IntroVideo.tsx
│   ├── HomePage.tsx
│   ├── ProjectsPage.tsx
│   ├── OrganizationsPage.tsx
│   ├── FunPage.tsx
│   ├── SectionTransition.tsx
│   ├── BackButton.tsx
│   ├── SkipButton.tsx
│   └── SpriteSlot.tsx
├── lib/
│   └── sections.ts
├── public/assets/
│   ├── videos/                     # renamed from /video/; opening.mov + .mp4 + .webm
│   ├── sprites/                    # existing pngs preserved
│   └── icons/                      # .gitkeep + README
├── _archive/
│   └── old-portfolio-content.js    # rescued from src/data/content.js
├── docs/superpowers/specs/         # this file
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── postcss.config.mjs
└── .gitignore
```

## Architecture

### Routing — single-page state machine

All five views render from `app/page.tsx`. A `view` state of type `'intro' | 'home' | 'projects' | 'organizations' | 'fun'` selects which page-component renders inside the transition wrapper. **Why:** the cube rotation is a continuous Framer Motion animation between two faces; Next.js route changes would unmount the leaving page mid-rotation. Routes also add zero value for a 5-view portfolio with no need for shareable per-section URLs.

### Cube rotation

`<SectionTransition>` wraps `<AnimatePresence mode="popLayout">`. Each active page-component is rendered as a `motion.div` keyed by view id, with:

- `style={{ transformPerspective: 1200 }}`
- `initial={{ rotateY: 90 * directionSign, opacity: 0 }}`
- `animate={{ rotateY: 0, opacity: 1 }}`
- `exit={{ rotateY: -90 * directionSign, opacity: 0 }}`
- `transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}`

`directionSign` is `+1` for forward (home → subpage) and `-1` for back (subpage → home). A `pendingNav` ref records "next view + direction" so Back can correctly invert the original rotation.

### Intro video flow

`IntroVideo.tsx`:

1. On mount: render fullscreen `<video>` with three `<source>` tags (mp4, webm, mov fallback for Safari).
2. Attempt `videoRef.current.play()`. The element starts unmuted (no `muted` attribute).
3. If the promise rejects (autoplay policy), show centered "▶ Click to Play with Sound" overlay. On click, call `play()` again from the gesture.
4. Top-right `<SkipButton>` always visible. Clicking it OR `onEnded` calls `onComplete()`.
5. Parent (`app/page.tsx`) tracks `sessionStorage.getItem('intro-seen')`. On first session render, view is `'intro'`; on `onComplete`, sets the flag and transitions to `'home'`. A refresh in the same tab skips intro; a new tab replays it.

### Page-specific designs

| View | Background | Notable layout |
|---|---|---|
| Home | `#290000` full bleed | name/bio/socials TODO blocks at top, three large clickable tiles below: Projects / Organizations / Fun |
| Projects | `#022C39` full bleed | Grid of ≥3 placeholder cards (`Project 01/02/03`). Card = title, description placeholder, `<SpriteSlot>`, dead "View" button |
| Organizations | Split: top `#26013D` (ProgSU), bottom `#020059` (Cybersecurity Club) | Each half has ≥2 placeholder org entries (logo slot, role, dates, description). Horizontal divide on desktop; vertical stack on mobile |
| Fun | `#000000` | `<SpriteSlot src="/assets/sprites/abrarshoot.png" />` centered; TODO comment block for future interactive content |

Every sub-page has `<BackButton>` top-left with visible "← Back" text.

### Shared components

- **`<SectionTransition>{children}</SectionTransition>`** — props: `viewKey: string`, `direction: 'forward' | 'back'`. Renders one face at a time with the rotation animation above.
- **`<BackButton onClick />`** — fixed top-left, `aria-label="Back to home"`, keyboard-focusable.
- **`<SkipButton onClick />`** — fixed top-right, `aria-label="Skip intro"`, keyboard-focusable.
- **`<SpriteSlot src alt fallbackLabel className? />`** — renders `<img>` if `src` exists at build time, otherwise a dashed-border `<div>` containing `fallbackLabel`. To avoid build-time file checks, the component **always** renders the `<img>` with `onError` switching to the fallback div. Works for both present and missing assets.
- **`<IntroVideo onComplete />`** — see flow above.

### Asset handling

- Rename `public/assets/video/` → `public/assets/videos/`. This is destructive only in path; contents preserved.
- Create `public/assets/icons/` with `.gitkeep` + 1-line README.
- Preserve existing sprites: `abrargambit.png`, `abrarluffy.png`, `abrarmainscreen.png`, `abrarshoot.png`.
- Move `src/data/content.js` → `_archive/old-portfolio-content.js` for future copy-paste reference. Move `src/data/planets.js` too. `_archive/` sits outside Next's source tree (`app/`, `components/`, `lib/`) so it's never bundled, but it stays tracked in git for reference.

### Video conversion

If `ffmpeg` is installed at implementation time:

```bash
ffmpeg -i public/assets/videos/opening.mov \
  -c:v libx264 -preset slow -crf 20 \
  -c:a aac -b:a 160k \
  -movflags +faststart -pix_fmt yuv420p \
  public/assets/videos/opening.mp4

ffmpeg -i public/assets/videos/opening.mov \
  -c:v libvpx-vp9 -crf 32 -b:v 0 \
  -c:a libopus -b:a 128k \
  public/assets/videos/opening.webm
```

Skip re-conversion if output file mtime is newer than the source. The implementation always writes `public/assets/videos/README-VIDEOS.md` documenting the conversion commands (useful when adding new videos later, or recovering after a missed conversion). If `ffmpeg` is missing OR `opening.mov` is missing, conversion is skipped and the implementation continues — `IntroVideo` still renders. With `.mov` present but no converted formats, Safari plays the `.mov` natively while other browsers surface the Click-to-Play overlay (their `play()` rejects on the unsupported source). With no `.mov` at all, the video element renders empty and the Skip button on the black background keeps the flow testable.

### Cleanup of old codebase

Delete after archiving needed data:
- `src/` (whole directory)
- `index.html` (Vite entry)
- `vite.config.js`
- `dist/` (build output)
- old `package.json` and `package-lock.json` (replaced by Next.js versions)

Keep:
- `.git/`, `.claude/`, `public/assets/` (after rename)

## Placeholders — TODO markers

These are the named TODO blocks reviewers should look for. Each component documents its TODOs at the top of the file.

| Marker | Location | Purpose |
|---|---|---|
| `{/* TODO: name */}` | HomePage | Final name display |
| `{/* TODO: bio */}` | HomePage | Bio prose |
| `{/* TODO: socials */}` | HomePage | Social links |
| `{/* TODO: project-N details */}` | ProjectsPage | Per-card title + body |
| `{/* TODO: project-N sprite */}` | ProjectsPage | Per-card image src |
| `{/* TODO: project-N link */}` | ProjectsPage | "View" action |
| `{/* TODO: progsu entry-N */}` | OrganizationsPage | ProgSU entries |
| `{/* TODO: cyber entry-N */}` | OrganizationsPage | Cyber Club entries |
| `{/* TODO: fun interactive content */}` | FunPage | Future game/interaction |

## Accessibility

- Skip and Back buttons are real `<button>` elements with `aria-label`.
- All interactive tiles are `<button>` (not `<div onClick>`).
- `<video>` has a `<track kind="captions">` placeholder.
- Reduced-motion: `prefers-reduced-motion: reduce` shortens the rotation to a fade.

## Out of scope (explicit non-goals)

- No real biographical or project copy. TODO markers only.
- No backend, no CMS, no DB.
- No deployment configuration beyond what Next.js needs by default.
- No analytics, no SEO beyond basic `<title>`.
- No animations beyond the cube rotation and the intro video.
- No mobile gesture handling beyond responsive layout (no swipe-to-rotate).

## Testing approach

Manual verification at the end of implementation:

1. `npm run dev` boots without errors.
2. First load → intro plays (or Click-to-Play overlay appears).
3. Skip button advances to home.
4. Refresh in same tab → no intro replay.
5. Each tile transitions with cube rotation; Back returns with reversed rotation.
6. Organizations split colors visible on desktop; stacked on mobile.
7. Fun page shows `abrarshoot.png` centered (or labeled placeholder if file missing).
8. Keyboard: Tab reaches Skip and Back buttons; Enter activates them.

Automated tests are out of scope for foundation.
