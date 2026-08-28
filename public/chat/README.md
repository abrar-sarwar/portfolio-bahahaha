# Chat media

Files referenced from `lib/chat/chatResponses.ts` live here. Paths in the
config are absolute from `/public`, so `/chat/people/kevin.webp` is
`public/chat/people/kevin.webp`.

Suggested layout:

```
public/chat/
  abrar.mp4              # your own clip (swap the path in the "abrar" entry)
  people/
    kevin.webp
    luigi.mp4
    ...
  projects/
    arkham.webp          # referenced by the Arkham card today (placeholder)
  sfx/
    ...mp3               # optional `sound` fields
```

Guidelines

- Images / gifs: `.webp` or `.gif`, ≤ ~400 KB. On the stage every image and
  clip renders at the same height (`--chat-media-h` in globals.css, ~44svh up
  to 24rem), small sources are scaled up, so a 128px gif is fine.
- Videos: H.264 `.mp4`, `-movflags +faststart`, ≤ ~3 MB. They don't embed;
  the clip pops up in the site's `VideoModal` (with sound, closes itself when
  it ends) the moment the reply lands, and the stage keeps a "play again"
  pill. A `.mov` that is already H.264 just needs a remux:
  `ffmpeg -i x.mov -c copy -movflags +faststart x.mp4`. If it's quiet, boost
  the audio only: `-c:v copy -c:a aac -af "volume=6dB"`.
- `responses: []` makes the media the whole reply, no text. That's how the
  people with a gif or a photo work.
- A missing file never breaks a reply, the media just doesn't render.
- Entries can also point at the site's existing sprites (`/assets/sprites/…`)
  and videos (`/assets/videos/…`).
