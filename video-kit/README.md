# Ink Explainer Kit

Turn a written article plus your own voice recording into a hand-inked "stick figure on paper" explainer video (1920×1080, 30 fps, MP4 with music and sound effects). Built for theological blog articles read aloud, 1 to 15 minutes long.

**The expensive part is already done** (drawing engine, 13 scene templates, music, sound effects, timing, video export). What is left per video is cheap: a small AI model writes a scene file (data, not drawing code), the checker catches mistakes, and the render runs on GitHub Actions (or on your computer if you prefer).

## What you need
* **Python 3.9+, Node 18+, ffmpeg.** For local previews and renders also **Playwright with Chromium**: `python3 -m pip install -r requirements.txt` then `python3 -m playwright install chromium`. Run `python3 tools/kit.py doctor` to check.
* **For rendering on GitHub Actions** (recommended on a 2-core computer): the kit in a GitHub repository and the GitHub CLI (`gh`) logged in. See [docs/CLOUD_RENDER.md](docs/CLOUD_RENDER.md).
* Your article as text and your voice recording (`.mp3`, `.wav`, `.m4a`).
* Any AI model that can read files and run commands (Claude Haiku, Gemini Flash, GPT mini, etc.) for the scene-writing step.

## Quick start
```bash
python3 tools/kit.py doctor                      # check requirements
python3 tools/kit.py new projects/my-article --title "My Article Title"
#   put article.md and voiceover.mp3 into projects/my-article/
python3 tools/kit.py prep projects/my-article    # timing map + outline.md + empty scene files
#   >>> give PROMPT_FOR_CHEAPER_AI.md to your AI; it writes projects/my-article/scenes/*.js
python3 tools/kit.py check projects/my-article   # fast checks (errors and warnings)
python3 tools/kit.py preview projects/my-article --chapter ch01   # contact sheets of frames
python3 tools/kit.py cloud render projects/my-article --push      # master render on GitHub Actions
```
Output lands in `projects/my-article/out/`: the MP4, the small MP4, the thumbnail PNG and the player page. `build` makes the playable HTML page; `verify` re-probes the finished MP4 (codecs, duration, loudness).

The heavy step is `cloud render`. It pushes the project, renders on a 4-core GitHub runner, downloads the result and verifies it — so a 2-core laptop stays responsive. Use `render` only as the offline fallback.

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
4. **render** draws frames in headless Chromium, encodes each chapter, mixes voice, music and effects (loudness normalised to −14 LUFS), and joins everything. If it stops, run it again: finished chapters are skipped. On GitHub Actions the same render runs with 4 workers.

## Time and size
* On a **2-core laptop**, local rendering is slow: roughly 1 frame per second at 1080p, about 25–30 minutes for the 75 s example. Use `cloud render` instead (a few minutes on the 4-core runner, including setup).
* Local `prep`, `check` and `verify` take seconds. Local `preview` is quick but needs Playwright.
* File size: the full-quality 1080p MP4 (crf 20 locally, crf 18 on the runner) is large because of the paper grain: about 30 MB per minute. The `--small` 720p copy is about 2 MB per minute and is fine for previews and sharing.

## Rendering on a small machine
The master render is the only expensive step, and it does not have to run on your computer:

```bash
python3 tools/kit.py cloud render projects/my-article --push
```

One-time setup and all options are in [docs/CLOUD_RENDER.md](docs/CLOUD_RENDER.md). In short: log in with `gh auth login`, run `python3 tools/kit.py cloud install`, commit and push the workflow. After that, `cloud render` pushes, waits, downloads the MP4/thumbnail/player page into `out/`, and verifies the file. `cloud preview` does the same for contact sheets when Playwright is not installed locally.

A **public** repository publishes the article, the voiceover and the scenes. The command warns and asks before submitting; use a private repository for unpublished narration.

## Writing scenes with several agents
The chapters are separate files, so several scene writers can work at once:

```bash
python3 tools/kit.py plan projects/my-article --writers 4
```

This writes `work/agents/writer-1.md` … `writer-4.md` and `integrator.md`. Give each writer one brief; give the integrator brief to the model that runs `check`, `preview` and the render. The locked contract in every brief keeps every writer inside their own chapter files.

## Project settings (`project.json`)
`title`, `lead` (the recurring character look: `pastor`, `man`, `official`, `scribe`, `elder`, `teacher`, `woman`, `child`), `speak_headings`, `chapter_seconds`, `music`, `sfx`, `thumbnail` (time in seconds for the thumbnail frame).

## Limits to know about
* Style is fixed. New icons are easy (one `case` in `engine/icons.js`); new templates need an engineer.
* The kit draws symbols and generic figures, never likenesses of real people, and by default never God, Jesus, the Spirit or angels as figures (see `docs/STYLE.md`).
* Music is generated, not a recording; it is gentle on purpose.

Caveat font: SIL Open Font License 1.1. Everything else is yours to use.
