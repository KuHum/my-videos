# Uganda — A History in Six Beats

A 60-second, 1920×1080, 30 fps 3D film about the history of Uganda. Low-poly
models are loaded live from the [polyfork.dev](https://polyfork.dev) CDN as ES
modules, three.js r180 comes from unpkg, and the frame is drawn from timeline
time so the film renders identically on every machine.

## The film

| # | Time | Beat | What is on screen |
|---|------|------|-------------------|
| 01 | 0–9 s | The Land | Lake, papyrus reeds, thorn trees, elephant and giraffe, a canoe riding the swell |
| 02 | 9–19 s | Kingdoms | Thatched houses, a granary, a royal drum, cattle, a palisade, a drum tower |
| 03 | 19–29 s | The Outsiders | A caravan tent, an ox cart, a beached canoe, a clapboard mission church |
| 04 | 29–39 s | The Protectorate | A steam locomotive on laid track, telegraph poles, a lineside hut |
| 05 | 39–50 s | Independence | The flag over a stone plinth (drawn into a canvas texture), the old village behind |
| 06 | 50–60 s | Today | Office towers, market stalls, a boda boda, a bus, then the end card |

The camera cuts between six dioramas that sit on one timeline road; only the
diorama in front of the lens is drawn, which is what keeps a software-GL render
affordable. A rail at the bottom of the frame tracks the era you are looking at.

Copy is deliberately short and factual: no invented quotes or statistics, only
dates and events (c. 1300 kingdoms, 1844 caravans, 1862 Speke at the source,
1877 missionaries, 1894 protectorate, 1901 railway, 9 October 1962 independence,
1986 a new government in Kampala). Every title and line is a declared
composition variable, so the Studio can edit the words without touching code.

## Layout

```
index.html                 root composition, import map, score
compositions/film.html     the 60 s scene: canvas, copy, timeline, 3D script
assets/gsap.min.js         bundled GSAP used by the text timeline
tools/score.mjs            deterministic 60 s score -> assets/score.wav
```

`assets/score.wav` is generated, not committed (`node tools/score.mjs`). The CI
workflow builds it before rendering so the preview and the delivery share one
score.

## How the 3D is wired

- `index.html` declares an import map for `three` and `three/addons/`, so the
  polyfork modules (which `import ... from "three"`) resolve without a build step.
- `compositions/film.html` dynamically imports each model from
  `https://polyfork.dev/cdn/{id}.mjs` and calls `createAsset()`.
- Loading is registered as `window.__hf.buildReady.film`, so the renderer waits
  for the world to exist before it captures frame 0.
- `renderAt(t)` is a pure function of timeline time: camera, water swell, flag
  wave, dust drift, birds, cut fades and the era rail all come from `t`. The
  `hf-seek` listener is the only clock.
- A failed model fetch is logged and skipped; the film still renders.

## Local run

```bash
npm install
node tools/score.mjs assets/score.wav
npx hyperframes check                    # lint + browser check
npx hyperframes snapshot . --at 3.5,14,24,34,44,53   # look at six stills
npx hyperframes render . -o renders/uganda-history.mp4 --quality looks
```

Rendering needs network access: the models and three.js are fetched from the
CDN, not from this repo.

## Cloud render

`.github/workflows/render-uganda-history.yml` runs on every push that touches
`uganda-history/**`:

1. lints (warnings pass, structural errors stop the job),
2. builds the score,
3. renders 60 s at 1080p/30 with 4 workers,
4. verifies duration and stream with ffprobe,
5. uploads `uganda-history/renders/uganda-history.mp4` as an artifact and
   force-pushes it to the `final-video` branch — the same branch `render.yml`
   publishes the long-form film to.

## Credits

Models: [polyfork.dev](https://polyfork.dev) — free low-poly library, commercial
use without attribution, hotlinked from their CDN (their terms; the `.mjs`
sources are not redistributed here). Engine: [three.js](https://threejs.org)
(MIT, r180 via unpkg). Timeline: GSAP, bundled locally as the engine requires.
Rendering: [HyperFrames](https://hyperframes.heygen.com).
