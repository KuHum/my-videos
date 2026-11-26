# Rendering on GitHub Actions (small machines)

The kit can render on a GitHub Actions runner (4 cores) and download the finished
files, so the heavy 1080p encode never runs on your computer. Local work stays cheap:
`prep`, `check`, reading stills, and writing scenes.

Use this route on a 2-core laptop. The 75-second example film took **3 min 30 s** wall
time on the runner (2 min 12 s of that was drawing and encoding; the rest was setup,
dependency install, build and verification). The same film takes roughly 25–30 minutes
to render locally on 2 cores.

## One-time setup

1. Put the kit in a GitHub repository and push it once.
2. Make sure the GitHub CLI is logged in:

   ```bash
   gh auth status          # expect: Logged in to github.com account <you>
   ```

3. Install the workflow at the repository root (GitHub only reads
   `.github/workflows/` at the root, not inside the kit folder):

   ```bash
   python3 tools/kit.py cloud install
   git add .github/workflows/render-kit.yml
   git commit -m "Add cloud render workflow"
   git push
   ```

4. Open the repository's **Actions** tab once and confirm workflows are enabled.

`cloud render --push` also installs the workflow automatically if it is missing.

## Rendering

From the kit folder:

```bash
python3 tools/kit.py cloud render projects/my-article --push
```

What happens:

1. `--push` commits the kit folder and the workflow, then pushes the current branch.
2. The workflow runs on `ubuntu-latest`: installs ffmpeg, Python dependencies and
   Chromium, renders every chapter with 4 parallel workers, builds the player page,
   checks the file with `ffprobe` and `ebur128`, and uploads everything as an artifact.
3. The command waits, downloads the artifact, copies the MP4, the 720p copy, the
   thumbnail and the player page into `projects/my-article/out/`, then runs `verify`.

Useful options:

| Option | Effect |
|---|---|
| `--no-wait` | Queue the run, print its URL and return immediately. |
| `--chapters 1,2` | Render only those chapters (the MP4 is not final; use for checks). |
| `--workers 4` | Parallel chapters on the runner (default 4). |
| `--crf 18` | H.264 quality (default 18 on the runner; local default is 20). |
| `--dry-run` | Print the `gh` command without submitting. |

## Previews without local Playwright

If Playwright or Chromium is not installed on your computer, the runner can produce
the contact sheets:

```bash
python3 tools/kit.py cloud preview projects/my-article --push --chapter ch01
```

Sheets land in `projects/my-article/work/preview/`.

## Revisions

- Change the scenes, run `cloud render ... --push` again. The runner starts clean, so
  it renders the whole film again; a 60-second film is only a few minutes.
- There is no local re-render: `render`, `preview` and `thumb` refuse to run outside
  GitHub Actions. Use `cloud preview` for a quick look at one chapter, and `--force`
  is a runner-side option for redoing every chapter.
- A partial render is a cheap check: `cloud render ... --push --chapters 1` produces a
  chapter-only MP4 and skips verification, which is useful before a full run.

## Reading a failed run

The command prints the run URL and exits non-zero. To read the log (ANSI escapes make
`gh run view --log` print nothing):

```bash
gh api /repos/<owner>/<repo>/actions/runs/<run-id>/jobs --jq '.jobs[0].id'
gh api /repos/<owner>/<repo>/actions/jobs/<job-id>/logs --allow-escape-sequences | sed 's/\x1b\[[0-9;]*m//g'
gh api /repos/<owner>/<repo>/check-runs/<job-id>/annotations
```

The workflow uploads artifacts with `if: always()`, so a failed run still leaves any
partial output to download; the full logs stay on the run page.

## Privacy and cost

- **A public repository publishes everything you push**: the article text, the
  voiceover recording and the scene files. Use a private repository for unpublished
  narration.
- Public repositories use free Actions minutes. Private repositories use the
  account's monthly quota; each run is a few minutes.
- Artifacts are kept for 14 days. Download what you need; the runner keeps nothing.

## Limits

- Runner timeout: 90 minutes. A 15-minute film is well inside that.
- The workflow only runs on demand (`workflow_dispatch`), never on every push.
- `concurrency` cancels an older run for the same project when a newer one is queued.
- The workflow pins current action majors (`checkout@v7`, `setup-python@v7`,
  `setup-node@v7`, `upload-artifact@v7`); older majors emit Node 20 deprecation
  warnings on every run.

## No local fallback (by design)

This fork has no local render path. `render`, `preview` and `thumb` exit with an error
unless `GITHUB_ACTIONS=true`, which only the runner sets. If GitHub is unavailable the
work waits; it does not fall back to the laptop.

Why: a 2-core laptop draws about 1 frame per second at 1080p (25–30 minutes for a 75 s
film, longer for a real one), the machine stops being usable while it runs, and the
result depends on the local Chromium build. The runner is faster, cleaner and free on
public repositories.

CI-side interruption handling still applies: a re-submitted run starts clean, and a
cancelled run uploads whatever artifacts it has.
