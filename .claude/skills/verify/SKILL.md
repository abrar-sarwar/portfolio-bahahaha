---
name: verify
description: Build, run, and drive this portfolio app to verify changes end-to-end.
---

# Verifying portfolio-bahahaha

## Build & launch

```bash
npx next build
npx next start -p 3999   # run in background
```

## Drive it (headless Chromium)

No Playwright in the repo — install `playwright-core` in the scratchpad and
launch the cached browser at
`~/Library/Caches/ms-playwright/chromium-<rev>/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`.

Gotchas that cost time:

- The site opens with an intro video. Skip it by seeding
  `sessionStorage.setItem("returnTo", "home")` (key from `lib/projects.ts
  RETURN_TO_KEY`) in `page.addInitScript` before `goto`.
- Home is a scroll feed (`ScrollFeed`): home / projects / organizations / fun
  panels. `/myworld` and `/professional` are separate routes.
- Click-to-play video triggers are `aria-label`ed buttons (e.g. "Play Gojo
  video") but desktop + mobile variants duplicate labels — use `.first()`.
- Click-to-play videos are prefetched into blob URLs via `lib/videoPreload.ts`;
  wait for the fetch in `performance.getEntriesByType("resource")` before
  clicking if the test depends on the preloaded path. Media events like
  `playing` don't bubble — listen on `document` with `capture: true`.
