# Long-form landscape video pipeline

A 16:9, 24 fps faceless explainer built in code: canvas drawing in headless Chrome, ffmpeg encoding,
edge-tts narration, procedural sound. No paid services, no AI images.

`longform/` is the project (Paper Atlas cut-paper look, retuned for landscape).

## Why rendering is offloaded

On the target laptop (Celeron N3060, 2 cores) a frame costs roughly **1–1.4 s**
(capture + JPEG + x264), so 10 minutes at 24 fps = 14,400 frames ≈ 4–6 hours.

GitHub Actions runs 4-vCPU runners, and each matrix job renders one slice in parallel.

## Hold-aware rendering (the important rule)

`--long` reuses the previous JPEG when a frame is pixel-identical to the last one. That only happens
if the shot actually **holds still**. The engine freezes content time and camera inside a shot's
`hold: [start, end]` window (shot-local seconds), so consecutive frames match.

```js
add({ id: 'S07', at: st, hold: [1.2, 99], draw(lt, d, t) { ... } });
```

Measured on the 17 s proof slice:

| | captured frames | time |
|---|---|---|
| no holds declared | 420 / 421 (100%) | 9 m 37 s |
| holds declared (S02 window) | 53 / 96 (55%) | 1 m 42 s |

**Consequence for writing:** a long-form script must be authored *hold-first* — a short move/reveal,
then several seconds of a still diagram while the narration explains. A script that animates every
frame gains nothing from the mode.

## Local commands

```bash
cd longform

# 1. narration + word timings (edge-tts, free, needs network)
bash ~/.config/opencode/skills/faceless-shorts/scripts/py \
     ~/.config/opencode/skills/faceless-shorts/scripts/voice.py .

# 2. sound cues + mix
node tools/capture.mjs cues
bash ~/.config/opencode/skills/faceless-shorts/scripts/py tools/mix.py .

# 3. correctness: draws every 0.25 s of the timeline, no encode
node tools/capture.mjs check

# 4. look at it
node tools/capture.mjs sheet review/all.jpg 0.5 7
node tools/capture.mjs frames review/f "2.0,12.0"

# 5. render (long-form mode)
node tools/capture.mjs video renders/out.mp4 --long
```

## Cloud render

Push the repo to GitHub, then **Actions → Render long-form video → Run workflow**.

- `check` job fails fast if any shot throws.
- 8 matrix jobs each run `--segment=i/8 --long --noaudio`.
- `finish` concatenates the video with `-c copy`, muxes the full `data/mix.wav`, verifies duration
  against `data/lines.json`, and uploads `final-video`.

Free-tier notes:

- **Public repo:** GitHub-hosted runners are free and unlimited.
- **Private repo:** 2,000 runner-minutes/month free. One 10-minute film at 8 parallel jobs costs
  roughly 60–200 runner-minutes depending on hold ratio, so stay well inside the quota.
- Artifacts expire (`retention-days`), so download the final video when the run finishes.

## Adding chapters

1. Extend `script.json` `lines` (one line = one cut). Keep sentences flowing; `caps` is optional.
2. Re-run steps 1–2, then `check`, then look at the contact sheet.
3. Add shots in `src/shots.js`, each with `at: cut_(lineIndex)` and a `hold` window.
4. Re-render a slice locally (`--segment`) or push and let CI render.
