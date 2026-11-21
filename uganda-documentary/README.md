# Uganda — A History in Six Beats (2 min, narrated)

A two-minute documentary cut in code. Six chapters of low-poly 3D on one timeline
road, narrated by a Kenyan English voice, scored with a generated pad and
punctuated with licensed sound cues.

**Runtime 1:59.9 · 1920×1080 · 30 fps · H.264 + AAC stereo.**

## How it is put together

```
script.json                 what is said, chapter by chapter (the only copy to edit)
data/narration.m4a          the read, committed so CI needs no TTS account
data/lines.json             when every line is spoken (from edge-tts word boundaries)
data/chapters.json          when every chapter starts and ends (derived from the lines)
cues.json                   sound effects and which line they land on
src/film.template.html      the three.js scene, with placeholders
tools/voice.py              script.json -> narration + timings (edge-tts)
tools/score.mjs             the 2-minute score, deterministic, no binary in git
tools/build.mjs             timings + template -> index.html + compositions/film.html
tools/probe.mjs             local console probe: assembles the page and prints errors
compositions/film.html      GENERATED — edit the template or the script, not this
index.html                  GENERATED — same
```

The cut is derived, not hand-timed. Change a line in `script.json`, re-run
`tools/voice.py` and `tools/build.mjs`, and every chapter start, camera move,
title card and subtitle window moves with it.

## Six chapters

| # | Time | Chapter | On screen |
|---|------|---------|-----------|
| 01 | 0:02–0:19 | The Land | Lake Victoria, papyrus, elephant and giraffe, the Nile leaving at Jinja |
| 02 | 0:19–0:39 | Kingdoms | Round thatched huts, a royal drum, cattle, a palisade |
| 03 | 0:39–0:57 | The Outsiders | Caravan tent, ox cart, beached canoe, mission church |
| 04 | 0:57–1:16 | The Protectorate | Steam locomotive on laid track, telegraph poles |
| 05 | 1:16–1:36 | Independence | The official flag over a stone plinth |
| 06 | 1:36–1:56 | Today | Kampala skyline, market, boda boda, bus, then the end card |

## The voice

`edge-tts` with **en-KE-ChilembaNeural** (Kenyan English male), rate +4%. Word
timings come from the synthesiser's own boundary events, so a cut lands on the
word it belongs to. The narration is generated once and committed; CI never
contacts Microsoft.

```bash
# regenerate (needs edge-tts; pip install edge-tts)
python3 tools/voice.py
node tools/score.mjs assets/score.wav
node tools/build.mjs
```

## The flag

`assets/flag.svg` is the official Flag of Uganda artwork; `assets/flag.png` is a
1536×1024 raster of it (rendered at 3× in Chrome, cropped to the flag). The flag
in the scene is a 22×10 plane whose vertices wave as a function of time, textured
with that raster — six bands, black-yellow-red, crested crane on the white disc.

## Sound

- **Narration** at full level.
- **Score** (`tools/score.mjs`) at 0.30 — four chords that follow the chapters, a
  pulse that arrives with the kingdoms, a low tense turn under the hard years, a
  riser into the last chapter.
- **Ten cues** at 0.20–0.42, from the Mixkit set (licence and provenance in
  `assets/sfx/CREDITS.md`): wind on the lake, a gong for the kingdoms, a
  typewriter for the ivory trade, a whoosh for the Nile, a train for the railway,
  a crowd for independence, a suspense hit for the coup, thunder and rain for the
  hard years, footsteps for Kampala.

## Render

```bash
npm install
node tools/score.mjs assets/score.wav
node tools/build.mjs
npx hyperframes check
npx hyperframes snapshot . --at 4,25,45,62,82,105 --no-end --timeout 170000
npx hyperframes render . -o renders/uganda-documentary.mp4 --quality looks
```

CI (`.github/workflows/render-uganda-documentary.yml`) does exactly that on every
push touching this folder, verifies duration/streams with ffprobe, and uploads the
MP4. A full render is ~3,600 frames; measure it in `renders/render-time.txt`.

## Debugging

`snapshot` reports "buildReady rejected" with no reason by design. When that
happens, run:

```bash
node tools/probe.mjs --wait 60
```

It inlines the composition into the root the way the compiler does, loads the real
runtime, and prints every console message and page error. Two bugs in this film
were found this way in seconds: a placeholder left unreplaced in a script
(`String.replace` only replaces the first occurrence) and clip markup inserted
inside an HTML comment.
