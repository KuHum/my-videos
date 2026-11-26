# Instructions for the AI that fills in the scenes

Paste this file (or point your AI tool at it) together with the project folder. You are **not** making a video from scratch. The engine, the style, the sound, the timing and the video export already exist. Your whole job is to write the scene files, run three commands, and fix what the checker says.

## What you will be given
* A project folder `projects/<name>/` containing `article.md` (the text that was read), the voiceover recording, and `project.json`.
* The kit in `engine/`, `tools/`, `docs/`.

## Read first (in this order, about 10 minutes)
1. `docs/TEMPLATES.md`: every template, its parameters, and the cue syntax.
2. `docs/STYLE.md`: content rules and which template to use for which kind of passage.
3. `examples/pastor/scenes/ch01.js`: a finished example. Copy its patterns.

## Steps
1. **Prepare timing** (once per article):
   `python3 tools/kit.py prep projects/<name>`
   This writes `projects/<name>/work/outline.md` (every sentence with an id such as `s12`, its start and end time, and a scissors mark ✂ where a scene may be cut) and empty files `scenes/ch01.js`, `ch02.js`, ...
2. **Write the scenes, one chapter at a time.** Open `work/outline.md` and the matching `scenes/chNN.js`. Group the sentences of that chapter into scenes and write `SCENES.push({...}, ...)`.
   * Every sentence belongs to exactly one scene, in order. The next scene starts at the sentence after the last one.
   * Cut only where the outline shows ✂.
   * Pick the template that fits (see the table in `docs/STYLE.md`). One idea per scene.
   * Time every visual to a word with a cue: `'s12:household'`, `'s12:household@-0.2'`.
   * Text on screen: 1 to 4 words, taken from the article. Numbers exactly as written in the article.
3. **Check** (fast, no browser): `python3 tools/kit.py check projects/<name>`
   Fix every `ERROR`. Read every `WARN` and fix it unless you have a reason. The messages name the scene, the sentence and the word.
4. **Look** (only if you can view images): `python3 tools/kit.py cloud preview projects/<name> --push --chapter ch01`
   Open the sheets it prints. Each scene shows three frames. Look for: text overlapping a figure, text off the edge, an empty-looking scene, the wrong icon. Fix and re-run preview for that chapter only. Do not preview the whole video again and again.
5. **Repeat steps 2 to 4 for each chapter.**
6. **Render**: `python3 tools/kit.py cloud render projects/<name> --push`. Rendering happens on GitHub Actions only; `render`, `preview` and `thumb` refuse to run on this machine. The MP4, the 720p copy, the thumbnail and the player page are downloaded into `projects/<name>/out/`; `python3 tools/kit.py build projects/<name>` makes the playable HTML page locally, and `python3 tools/kit.py verify projects/<name>` checks the finished file. Stills are `python3 tools/kit.py cloud preview projects/<name> --push --chapter chNN`.

## Parallel mode (optional, for long projects)
One chapter per file means several writers can work at once without merging code:

1. Run `python3 tools/kit.py plan projects/<name> --writers 4`. It writes a brief per writer and an `integrator.md` into `projects/<name>/work/agents/`.
2. Give each writer only its `writer-N.md`. A writer edits only the chapter files listed there and nothing else.
3. The briefs carry a locked contract: the `SCENES.push(...)` wrapper, sentence coverage, cuts at the scissors marks, cue syntax, text limits, and no rendering.
4. One integrator (a separate AI turn or the same model afterwards) gets `integrator.md`: it runs `check`, `preview`, `cloud render` and `verify`, and normalises text length and static holds by editing scenes only.
5. Do not let writers run the whole-project checker while other chapters are empty; it will report every missing sentence. The integrator runs it after all files are in.

Serial writing (one model, chapter by chapter) is still the right choice for short articles or a single changed chapter.

## Rules you must not break
* Do not edit anything in `engine/` or `tools/`. If a template cannot do what you need, use `extras`, a different template, or leave a note in your final message.
* Do not add facts, names, numbers or quotes that are not in `article.md`.
* Never draw a real person's likeness: use a generic figure (`who:`) and a name label. Never draw God, Jesus, the Spirit or angels as figures; use symbols.
* No call to action, subscribe prompt, logo or branding unless the project asks.
* Scripture: reference plus one to three key phrases (`scripture` template). Never a full verse on screen.
* Keep scenes varied. Do not use the same template three times in a row.

## When something fails
`docs/TROUBLESHOOTING.md` lists the common messages and fixes. If `prep` says the timing looks uncertain, tell the user: an SRT file (auto captions) in the project folder makes every cue exact.

## Finish with a short note to the user
Say: which template choices you made for the opening and the close; anything the article said that you could not draw (and why); any warning you left; where the files are.
