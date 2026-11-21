# Into the Unknown.

A 52-second DeepSeek concept film — 1920×1080 at 60 fps with stereo audio — built
as an editable HyperFrames composition. **A concept film, not affiliated with
DeepSeek.** Footage: Pexels. Music: *Epic Hybrid* by Kulakovka from Pixabay.

## Layout

- `motion.md` — the production guide (timeline, shot list, asset sources).
- `index.html` — root composition: 52 s, scene hosts, the score, editable
  variables (questions, typed lines, audience names, credits, colors).
- `compositions/` — one scene per beat: `open` (whale mark), `questions`,
  `typing`, `sonar` (nine shots in the circular window), `pills` (the
  morphing "Open to" window), `wall` (the footage wall and dive), `ipo`
  (Shanghai, the IPO letters), `endcard`, plus the `depth` overlay.
- `assets/` — committed, processed media:
  - `media/` 16:9 trims (1920×1080 @ 30 fps, silent),
  - `media/sonar/` the nine 1080×1080 squares,
  - `media/sonar-blur/` blurred copies for the background plate,
  - `stills/` the 32 wall stills (640×360),
  - `audio/score.flac` the first 52 s of the score with a 1.70 s fade at
    50.30 s, normalized in two passes to −14 LUFS / −1.5 dBTP,
  - `fonts/` Montserrat, DM Sans, DM Mono (Google Fonts revision
    `06bfe0d62a98375cb09c942fa18e68bd32cff057`),
  - `brand/` the DeepSeek whale mark and wordmark SVGs.
- `tools/prepare.py` — rebuilds `assets/` from the original downloads.
- `deepseek-assets/` (gitignored) — the original downloads, re-fetchable
  any time with `python3 fetch-assets.py` (parsed out of `motion.md`).

## Render

```bash
npx hyperframes render . -o renders/into-the-unknown.mp4 --fps 60 --quality looks
```

The film is rendered by GitHub Actions (`.github/workflows/
render-into-the-unknown.yml`): lint, 60 fps render, then the audio is
mastered to stereo AAC 48 kHz at 256 kb/s and the MP4 is uploaded as an
artifact.
