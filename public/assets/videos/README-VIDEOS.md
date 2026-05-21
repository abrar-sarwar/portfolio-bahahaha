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
