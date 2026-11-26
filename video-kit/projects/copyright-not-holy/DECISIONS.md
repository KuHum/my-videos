# Decision log — "Copyright Is Not Holy" (ink-kit cut)

Recorded while building the video autonomously. Every choice below was made without
asking; the article text and the voice recording were treated as fixed inputs.

## Input
- **Article:** the argument pasted in chat, verbatim, paragraph breaks preserved.
  Only the chat framing "Here's the case:" was removed — it is not narration.
- **Voice:** `voiceover.wav` (24 kHz mono, 76.8 s), copied unchanged from the attachment.
- **No SRT supplied**, so timing came from `prep`'s pause estimate (18 sentences,
  48 pauses): cues land within ~0.2–0.4 s of the real words. An SRT would make them exact.
- **Captions** are generated anyway, word-timed, from `work/timing.json` by
  `make_srt.py` → `out/copyright-not-holy.srt` (36 cues). Not burned into the video.

## Title card
- Text: "Copyright Is Not Holy" (the article's closing words, also the project title).
- Sub: "a case against holy copyright" — a paraphrase of the article's own thesis, no
  new claim. It exists only to give the card a second line; safe to delete.

## Scene plan (13 scenes, scenes/ch01.js)
1. **s1 title** — the thesis on a clean card.
2. **s2 talk (think bubble)** — "invented" appears, "discovered" appears and is crossed:
   statute vs moral order, the article's first distinction.
3. **s3–s5 compare** — theft (coins, X on "theft") | copying (scroll, "the ox is still
   there"). One picture for the ox/song example; "his ox" sits above the lead.
4. **s6 focus (crown)** — crown = monopoly, "a privilege" highlighted, "✗ natural right"
   top right. No compare here, to avoid two card scenes in a row.
5. **s7 list** — the four marks of policy: terms, exceptions, compulsory licenses,
   expiration dates (highlighted). Headline: Policy, not morality.
6. **s8 scale** — wise | foolish balanced level: "positive law can be either".
7. **s9–s10 talk** — bubble "piracy" / "stealing", both crossed on "doesn't make it so";
   the headline "That's marketing" carries the third word.
8. **s11 compare** — rules change | differ by country; red note "not intrinsic".
9. **s12–s13 list** — the four real duties ticked, then "commanded" (highlighted) on
   s13, so the pivot sentence still has a beat of its own.
10. **s14 focus (scroll)** — "a legal bargain", "moral clothing" highlighted.
11. **s15 compare** — may grant limited monopolies (crown) | cannot manufacture sin
    ("No." stamp on "manufacture").
12. **s16 focus (crown, crossed)** — stop baptizing monopolies as righteousness;
    label "as righteousness".
13. **s17–s18 verdict** — "Prudent, not holy", red X on "not".

No template is used three times in a row. Every sentence is covered exactly once.

## Fixes made after looking at the preview sheets
- **Scene 3:** right card moved from "sing" to "learn" — it was appearing ~2 s before
  the cut and barely readable; the X moved with "ox" so the events are spaced.
- **Scene 4:** "natural right" was first placed under a big X, which made it illegible.
  Now a small X sits to its left, like a bullet: "✗ natural right".
- **Scene 7:** the bubble first had three items (piracy / stealing / marketing); the
  labels collided at 48 px. Dropped "marketing" — the headline already says it.
- **Scene 12:** the cross was drawn before the crown finished drawing; moved the cue to
  "statutory" so the crown lands first, then the X.
- **Scene 13:** verdict text raised to y=240 so the celebrating lead's raised hands do
  not cross the highlighter.

## Render route — GitHub Actions, inside `my-videos`
- The master renders on GitHub Actions with the existing `Render video kit` workflow
  (`.github/workflows/render-kit.yml`, `kit_dir=video-kit`), via
  `python3 tools/kit.py cloud render projects/copyright-not-holy --push`.
  Reason: the user asked for the GitHub route; the laptop is a 2-core machine where a
  76 s film takes ~30 min locally versus a few minutes on a 4-core runner.
- **Repo:** the project lives in the existing `KuHum/my-videos` repository under
  `video-kit/projects/` (public repo → Actions minutes are free). Chosen over a new
  repo because the kit and its workflow already live there.
- **Mistake, logged:** before the pointer to `my-videos`, a separate private repo
  `KuHum/video-kit` was created and pushed. It is a duplicate of the kit folder. It was
  left in place, private and unlisted, as a fallback mirror instead of being deleted —
  deleting a repository is irreversible and nothing needed it gone. The canonical home
  is `KuHum/my-videos`.
- **Earlier local attempt:** a local `render --small` was started and then killed when
  the GitHub route was requested. No frames from it are reused (CI starts clean).
- **Privacy:** the article and the voice recording are already public in this repo
  (`copyright/` project), so committing them under `video-kit/projects/` adds no new
  exposure. If that ever changes, move the project to a private repo.
- **Local crf 20 / CI crf 18:** CI uses its own default (18), slightly higher quality
  and bigger file, which is the kit's normal master setting.

## Deliverables
- `out/copyright-not-holy.mp4` — 1080p master from CI, −14 LUFS.
- `out/copyright-not-holy-small.mp4` — 720p copy.
- `out/copyright-not-holy-thumbnail.png` — frame at 75.9 s ("It is not holy.") with the
  project title overlaid.
- `out/copyright-not-holy-player.html` — playable page with the voiceover embedded.
- `out/copyright-not-holy.srt` — word-timed captions.

## Left alone on purpose
- No burned-in captions, no music changes (`music`/`sfx` stay on).
- No edits in `engine/` or `tools/`.
- Article wording was not "improved"; the narration is the user's own text and the
  audio is already recorded.
- The pre-existing `copyright/` project (a different, custom-engine cinematic cut of
  the same script) was not touched.

## Second pass — icons, GitHub-only, and where the kit lives

### Which copy of the kit built this
The scenes were **written in `/home/humphrey/Downloads/Projects/video-kit`** (the folder
the session started in). The film was **rendered from the copy in
`/home/humphrey/Downloads/Projects/my-videos/video-kit`**, because that copy is inside a
git repository that already had the `Render video kit` workflow, a `gh`-authenticated
origin (`KuHum/my-videos`) and free public-repo Actions minutes. The workspace copy was
not a git repository, so it could not render without inventing a second remote.
The two copies are now kept in step: the project, the icon importer and the engine edits
exist in both, with `my-videos` canonical.

### GitHub is now the only renderer
- `tools/kit.py` gained `require_ci()`: `render`, `preview` and `thumb` exit with an
  error unless `GITHUB_ACTIONS=true`, which only the runner sets. `check`, `build` and
  `verify` stay local (text, HTML, ffprobe — no frames).
- README, PROMPT_FOR_CHEAPER_AI.md, docs/CLOUD_RENDER.md and docs/TROUBLESHOOTING.md
  rewritten around that: no local fallback, stills go through `cloud preview`.
- Reason: a 2-core laptop draws ~1 frame/s at 1080p; the runner is faster, cleaner and
  free here.

### On-demand icons
- `tools/fetch_icon.py`: searches the Iconify API, gates by license (CC0/MIT/ISC/
  Apache-2.0/CC-BY only), downloads, parses the SVG (paths, shapes, transforms) into
  polylines, fits them to the engine's ±100 box and appends a `case` to
  `engine/icons.js`. Provenance in `engine/icons/MANIFEST.json` and `LICENSES.md`.
- Five imported for this film: `ox` (lucide-lab:bull-head, ISC), `song`, `contract`,
  `coat`, `gavel` (Tabler, MIT). All stroke sources; no licence requires on-screen credit.
- They replace the wrong-glyph workarounds: `coins`→`ox`, `scroll`→`song` for copying,
  `scroll`→`contract` + `coat` for "a legal bargain dressed in moral clothing",
  `book`→`gavel` on the positive-law scale.
- Policy to stop this becoming a time sink: fetching is opt-in, at most 3 new icons per
  video, and if two searches find nothing honest the scene changes template instead.
  Nothing is ever downloaded during a render.

### Known cosmetic issue
The ox and music glyphs first sat inside the compare cards and collided with the
sub-labels. They now sit below the card frames, with the red X on the ox.
