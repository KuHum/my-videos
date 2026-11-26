# Resume instructions (survive interruptions)

Built with the Ink Explainer Kit, inside the `my-videos` repository.
Everything is idempotent: after a power cut, network drop or a new session, run the
steps below in order.

State: scenes written and checked (13 scenes, no errors/warnings), preview reviewed,
master rendered by GitHub Actions. Outputs land in `out/`.

## 1. Is the render done?
```bash
cd /home/humphrey/Downloads/Projects/my-videos
gh run list --workflow=render-kit.yml --limit 3
ls -l video-kit/projects/copyright-not-holy/out/
```
If `out/copyright-not-holy.mp4` exists and `verify` passes (step 3), the work is done.

## 2. Re-submit the render on GitHub (safe to repeat)
```bash
cd /home/humphrey/Downloads/Projects/my-videos/video-kit
python3 tools/kit.py cloud render projects/copyright-not-holy --push
```
This commits and pushes the kit folder, triggers `Render video kit` (mode=render,
kit_dir=video-kit), waits, downloads the MP4 / 720p copy / thumbnail / player page
into `projects/copyright-not-holy/out/`, then verifies the file.
- `--no-wait` queues it and returns immediately.
- A failed run: `gh run view --log-failed --repo KuHum/my-videos`.

There is **no local fallback**: `render`, `preview` and `thumb` refuse to run outside
GitHub Actions in this kit. If Actions is unreachable, wait or fix the network; do not
render on the laptop. Stills: `python3 tools/kit.py cloud preview projects/copyright-not-holy --push --chapter ch01`.

## 3. Verify and build
```bash
python3 tools/kit.py build projects/copyright-not-holy
python3 tools/kit.py verify projects/copyright-not-holy
```

## 4. Captions (already generated; regenerate only if timing changes)
```bash
python3 projects/copyright-not-holy/make_srt.py
```
Writes `out/copyright-not-holy.srt` from `work/timing.json` (word-level times).

## Notes
- Do not edit `engine/` or `tools/`.
- If Playwright/Chromium is missing after a reinstall: `python3 -m playwright install chromium`.
- `article.md` and `voiceover.wav` are fixed inputs; do not re-run `prep` unless the
  audio changes, or every cue timing moves.
- `work/timing.json` and `work/vo.mp3` must stay committed: CI needs the timing map,
  and `build` embeds vo.mp3 in the player page.
