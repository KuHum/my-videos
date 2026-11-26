# Troubleshooting

## Setup
| Problem | Fix |
|---|---|
| `doctor` says ffmpeg missing | install ffmpeg (`apt install ffmpeg`, `brew install ffmpeg`) |
| Playwright / Chromium missing | `python3 -m pip install -r requirements.txt && python3 -m playwright install chromium` |
| Node missing | install Node 18+ (needed only for `check`) |
| `gh` missing (cloud only) | install the GitHub CLI, then `gh auth login` |

## Timing (`prep`)
| Symptom | Fix |
|---|---|
| Sentence times look wrong, or `prep` warns about confidence | The article text differs from what was spoken. Edit `article.md` to match the recording exactly, or add an `.srt` file to the project and run `prep` again. |
| Two sentences merged or one split | Abbreviations like "Dr." or "vs." are handled; for others, rewrite the full stop in `article.md` or add a `//` note. Run `prep` again. |
| Recording has long background music | Use a clean voice track. The aligner relies on pauses. |
| Re-running `prep` | It rewrites `work/timing.json` and `outline.md` but never overwrites scene files that already have content. Sentence ids change if the article changes, so update the scenes. |

## Checker messages (`check`)
| Message | Meaning / fix |
|---|---|
| `sentence sN not covered` | Some sentence belongs to no scene. Scenes must run in order with no gaps: next scene's `from` is the sentence after the previous `to`. |
| `word "xyz" not found in sN` | A cue names a word that is not in that sentence. Use a word that is spoken, or `'sN'` for the start. |
| `cue after the scene ends` / `cue before the scene starts` | Use a sentence inside the scene's `from`..`to`. |
| `text too long` | Shorten to 1 to 4 words (headlines up to 7). |
| `static for N s` | Nothing changes for too long. Add `at` cues, an `extras` item, or a `lead.pose` sequence. |
| `cut inside a sentence` / `soft cut` | Scene boundaries should fall on a ✂ gap in the outline. Merge or move the boundary. |
| `unknown template / icon` | Names are listed in `docs/TEMPLATES.md`. |
| Syntax error in a scene file | Check commas and quotes; the message gives the file and line. |

## Looks wrong (`cloud preview`)
| Symptom | Fix |
|---|---|
| Text overlaps the lead character | Move the lead (`lead:{slot:'R'}`), or hide it (`lead:false`), or move your `extras`. |
| Text runs off the edge | Shorten it or lower `size`. |
| Scene looks empty | Add an icon `extras`, or switch to `focus` or `list`. |
| Wrong picture | Pick another icon name from the list. |

## Render
| Symptom | Fix |
|---|---|
| Render interrupted | Re-submit `cloud render ... --push`; the runner starts clean, artifacts from a cancelled run are still uploaded. |
| Changed one chapter's scenes | Re-submit; the runner redraws the whole film (a few minutes). |
| Out of disk space | Delete `work/seg/` frames and old `out/` files. |
| Too slow / refuses to run | Expected: local rendering is disabled. Use `cloud render` (see below). |
| Audio too quiet or loud | Output is normalised to −14 LUFS; check the voice recording is not clipped or very noisy. |
| File over an upload limit | Use the `--small` copy, or re-encode: `ffmpeg -i in.mp4 -vf scale=1280:-2 -crf 28 out.mp4`. |
| `verify` says duration differs | The voiceover and `work/timing.json` disagree. Re-run `prep`. |

## Cloud render (GitHub Actions)
| Symptom | Fix |
|---|---|
| `ERROR: No GitHub origin remote found` | Add one: `git remote add origin https://github.com/<owner>/<repo>.git`, then push. |
| `No workflow run appeared` | Confirm `.github/workflows/render-kit.yml` is committed on the branch you are pushing. Run `python3 tools/kit.py cloud install`, commit and push. |
| `workflow not found` from `gh` | Same as above; GitHub indexes a new workflow a few seconds after the push. |
| Actions tab says workflows are disabled | Enable Actions in the repository settings. For forks, approve workflows on the Actions tab. |
| Run fails at "Install Python dependencies and Chromium" | Usually a transient apt/network failure. Re-run from the Actions tab or run the command again. |
| Run fails at `check` | The scenes do not pass the checker; run `check` locally first. The artifact still uploads `check.json`. |
| Run is cancelled | A newer run for the same project was queued; `concurrency` cancels the older one by design. |
| No artifact / empty download | The run failed before any output. The workflow uploads whatever output exists even after a failure; the full logs stay on the run page. |
| `gh run view --log` prints nothing | ANSI escapes. Use `gh api .../jobs/<id>/logs --allow-escape-sequences` and strip them (`sed 's/\x1b\[[0-9;]*m//g'`). |
| Artifact gone | Artifacts are kept 14 days. Re-run the workflow. |
| It published my voiceover | The repository is public. Make it private, or keep narration out of it. |
