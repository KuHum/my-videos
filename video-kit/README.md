# Ink Explainer Kit

Turn a written article plus your own voice recording into a hand-inked "stick figure on paper" explainer video (1920×1080, 30 fps, MP4 with music and sound effects). Built for theological blog articles read aloud, 1 to 15 minutes long.

**The expensive part is already done** (drawing engine, 13 scene templates, music, sound effects, timing, video export). What is left per video is cheap: a small AI model writes a scene file (data, not drawing code), the checker catches mistakes, and the render runs on GitHub Actions — always. There is no local render path in this fork.

## What you need
* **Python 3.9+, Node 18+, ffmpeg**, plus **numpy and scipy** for `prep`: `python3 -m pip install -r requirements.txt`. Run `python3 tools/kit.py doctor` to check. Playwright/Chromium is **not** needed on this machine: every frame is drawn by the runner.
* **A GitHub repository and the GitHub CLI (`gh`) logged in** — required, not optional. Rendering, contact sheets and thumbnails all happen on GitHub Actions. See [docs/CLOUD_RENDER.md](docs/CLOUD_RENDER.md).
* Your article as text and your voice recording (`.mp3`, `.wav`, `.m4a`).
* Any AI model that can read files and run commands (Claude Haiku, Gemini Flash, GPT mini, etc.) for the scene-writing step.

## Quick start
```bash
python3 tools/kit.py doctor                      # check requirements
python3 tools/kit.py new projects/my-article --title "My Article Title"
#   put article.md and voiceover.mp3 into projects/my-article/
python3 tools/kit.py prep projects/my-article    # timing map + outline.md + empty scene files
#   >>> give PROMPT_FOR_CHEAPER_AI.md to your AI; it writes projects/my-article/scenes/*.js
python3 tools/kit.py check projects/my-article   # fast checks (errors and warnings), local
python3 tools/kit.py cloud preview projects/my-article --push --chapter ch01   # contact sheets, on CI
python3 tools/kit.py cloud render projects/my-article --push     # master render, on GitHub Actions only
```
Output lands in `projects/my-article/out/`: the MP4, the small MP4, the thumbnail PNG and the player page. `build` makes the playable HTML page; `verify` re-probes the finished MP4 (codecs, duration, loudness).

The heavy step is `cloud render`. It pushes the project, renders on a 4-core GitHub runner, downloads the result and verifies it — so a 2-core laptop stays responsive. `render`, `preview` and `thumb` refuse to run outside GitHub Actions: local frame drawing is gone, not just discouraged.

## Folder layout
```
engine/      drawing engine, icons, templates, scene runtime, music/sfx, player (do not edit)
tools/       kit.py (command line), align.py (timing), check.js, render_chunk.py
ci/          render-kit.yml — the GitHub Actions workflow installed into the repo root
docs/        TEMPLATES.md (what the AI can use), STYLE.md (what to draw),
             CLOUD_RENDER.md (GitHub Actions route), TROUBLESHOOTING.md
fonts/       Caveat (SIL Open Font License)
examples/    pastor/  a finished 75 s example: article, voiceover, scenes, project.json
projects/    your videos go here, one folder each
requirements.txt            Python dependencies
PROMPT_FOR_CHEAPER_AI.md   paste this to the AI that writes scenes
```

## How an article becomes a video
1. **article.md** is the exact text you read. `# Headings` are not spoken unless `"speak_headings": true`. `[[notes]]` and `// comments` are ignored.
2. **prep** finds the pauses in your recording and aligns every sentence and word to the text, producing `work/timing.json`. If you can export an `.srt` captions file (YouTube, Descript, etc.) and put it in the project folder, timing is exact.
3. **Scenes** (`scenes/chNN.js`) say which template covers which sentences and which word triggers each drawing. Chapters are about 60 s each so the AI works in small pieces.
4. **render** (on GitHub Actions only) draws frames in headless Chromium, encodes each chapter, mixes voice, music and effects (loudness normalised to −14 LUFS), and joins everything. If it stops, re-submit: finished chapters are skipped. The runner uses 4 workers.

## Time and size
* The **77 s example** took about 7 minutes end to end on the runner (setup, drawing, encoding, build, verify, upload). Nothing was drawn on the laptop.
* Local work is text-only and takes seconds: `prep` (~13 s), `check` (<1 s), `build` (HTML), `verify` (ffprobe + loudness).
* File size: the 1080p MP4 (crf 18 on the runner) is large because of the paper grain, about 30 MB per minute; the `--small` 720p copy is about 2 MB per minute and is fine for sharing.

## Rendering (GitHub Actions is the only route)
The master render is the only expensive step, and it never runs on your computer:

```bash
python3 tools/kit.py cloud render projects/my-article --push
```

One-time setup and all options are in [docs/CLOUD_RENDER.md](docs/CLOUD_RENDER.md). In short: log in with `gh auth login`, run `python3 tools/kit.py cloud install`, commit and push the workflow. After that, `cloud render` pushes, waits, downloads the MP4/thumbnail/player page into `out/`, and verifies the file. `cloud preview` does the same for contact sheets. Neither command draws a frame locally; if Actions is unreachable, the work waits rather than falling back to the laptop.

A **public** repository publishes the article, the voiceover and the scenes. Keep narration you do not want public in a private repository.

## Writing scenes with several agents
The chapters are separate files, so several scene writers can work at once:

```bash
python3 tools/kit.py plan projects/my-article --writers 4
```

This writes `work/agents/writer-1.md` … `writer-4.md` and `integrator.md`. Give each writer one brief; give the integrator brief to the model that runs `check`, `cloud preview` and `cloud render`. The locked contract in every brief keeps every writer inside their own chapter files.

## Project settings (`project.json`)
`title`, `lead` (the recurring character look: `pastor`, `man`, `official`, `scribe`, `elder`, `teacher`, `woman`, `child`), `speak_headings`, `chapter_seconds`, `music`, `sfx`, `thumbnail` (time in seconds for the thumbnail frame).

## Icons
Built-in hand-drawn icons live in `engine/icons.js`. When an article needs a noun the
set lacks, import one instead of bending a wrong icon:

```bash
python3 tools/fetch_icon.py search "plough"              # candidates + licenses
python3 tools/fetch_icon.py add plough --query plough    # download, convert, vendor
```

The importer accepts CC0/MIT/ISC/Apache-2.0/CC-BY collections only, strokes the
outline so it matches the pen style, records provenance in `engine/icons/MANIFEST.json`
and `engine/icons/LICENSES.md`, and never runs during a render. Budget: a few icons per
video, not a hunt. If nothing fits, change the template - a scene does not need an icon.

## Limits to know about
* Style is fixed. New icons are easy (one `case` in `engine/icons.js`); new templates need an engineer.
* The kit draws symbols and generic figures, never likenesses of real people, and by default never God, Jesus, the Spirit or angels as figures (see `docs/STYLE.md`).
* Music is generated, not a recording; it is gentle on purpose.

Caveat font: SIL Open Font License 1.1. Everything else is yours to use.
