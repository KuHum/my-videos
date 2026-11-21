# 3D film prompt — template

Paste **§1** into a fresh chat, fill the braces, keep **§2–§4** attached. It assumes
the `my-videos` pipeline: HyperFrames composition, three.js + polyfork.dev models
from CDN, deterministic render, GitHub Actions, 60 s / 1920×1080 / 30 fps / sound.

---

## §1 The brief

```
Make a 60 s 3D film about {SUBJECT}.

THESIS      {one sentence the film argues — not a topic, a claim}
AUDIENCE    {who it is for, and what they should do with it}
STRUCTURE   {N} beats: {beat 1} 0–{t}s / {beat 2} … / {beat N} …–60s
FACTS       These dates and claims are approved: {list}. Do not invent quotes,
            statistics or dates. If a claim is contested, soften it or cut it.
LOOK        {palette / light / era}. Low-poly, flat-shaded, {time of day}.
TYPE        {geometric sans / serif}, {title feel}. Max {n} words per beat.
METAPHOR    {the visual device that ties the beats together, e.g. one road in time}
SOUND       {mood}, generated in code, deterministic, no licensed audio.
DELIVERY    1920×1080 · 30 fps · H.264 + AAC, rendered in GitHub Actions.
PUBLISH     artifact only | artifact + commit to the final-video branch
MUST NOT    {the wrongs: wrong continent, anachronism, a specific asset to avoid}
```

## §2 Workflow — in this order, no skipping

1. **Cast it in words first.** Respond with the thesis, the beat table (start,
   duration, copy line, date stamp) and the metaphor — before any code. Wait for
   approval unless I said "no stops".
2. **Source assets from the catalogue, not from imagination.** Query
   `https://polyfork.dev/api/assets?q=…&free=1&per_page=8&fields=compact`
   (send a browser `User-Agent`; bare urllib gets 403). Read
   `size_m`, `triangles`, `palette`, `class`. Shortlist by hero render, then
   check each shortlisted asset's own page for cultural and chronological fit.
3. **Build what the catalogue cannot supply.** Huts, rails, flags, plinths and
   terrain are cheaper and more correct drawn in code than borrowed from the
   wrong culture.
4. **Author the composition** (see §3 for the mechanics).
5. **Verify with stills, not video.**
   `npx hyperframes snapshot . --at 3.5,14,24,34,44,53 --no-end --timeout 170000 -o shotsN`
   Read `contact-sheet.jpg`, list what is wrong, fix, repeat. Do not start a
   render while a still is wrong.
6. **Score it** with `node tools/score.mjs assets/score.wav`, then mount it as
   `<audio id="…" src="assets/score.wav" data-start="0" data-duration="60">`.
7. **Push and let CI render.** Confirm lint, score, render, verify and publish
   all passed; read the failing step's log before changing anything.
8. **Pull the artifact and check six frames** from the real MP4 before reporting.

## §3 Non-negotiable rules

1. **Build-ready handshake.** Register work as
   `window.__hf.buildReady.<key> = promise`; on completion set
   `window.__hfTimelinesBuilding = false` **and** dispatch
   `new Event("hf-timelines-built")`. Missing the event is why `check` and
   `snapshot` hang at *"Runtime did not become render-ready"*.
2. **Scripts inside `<template>` are classic scripts.** No static `import`
   statements. Use `await import("three")` and `await import("…mjs")`, and put
   the import map for `three` + `three/addons/` in the root `index.html`.
3. **Determinism is not optional.** `renderAt(t)` is a pure function of time:
   seeded PRNG (mulberry32), no `Math.random()`, no `Date.now()`, no deltas.
   A still at t must equal the frame at t in the MP4.
4. **Stills before renders.** A full render is 9 minutes of CI; a still is
   seconds. Never debug look-and-feel through video.
5. **Score before lint.** The linter resolves `<audio src>` against the project,
   so building the score after lint fails with `audio_src_not_found`.
6. **Hotlink, never vendor.** Models load from
   `https://polyfork.dev/cdn/{id}.mjs`. Their licence forbids redistributing the
   `.mjs`; a public repo is redistribution. No model files in git, ever.
7. **Cull what the lens cannot see.** Draw only the diorama within ~60 m of the
   camera. If you widen a shot, re-check that the next era has not appeared — a
   1901 locomotive behind a 1300s village is the failure this rule prevents.
8. **Right object, right culture.** A catalogue asset that is technically sound
   can still be the wrong continent. Reject it and build the correct one.
9. **Text follows the engine's rules.** Bundled font families only; `.clip`
   elements carry `data-start`/`data-duration`; never tween `letterSpacing`,
   `display`, `visibility` or `autoAlpha` on a clip — animate transforms,
   `opacity` and `filter` on children.
10. **Fail soft.** If three.js or a model fails to load, log it and still render
    the film with copy over a flat background. CI must never produce black.
11. **Verify the deliverable.** Assert 58 s < duration < 62 s, 1920×1080, 30/1,
    an audio stream present, and a non-zero file size before publishing.
12. **Report measured numbers.** Frames, render seconds, s/frame, file size.
    Do not estimate what the run just told you.

## §4 Acceptance checklist

- [ ] Thesis, beats and copy approved before code
- [ ] Every asset checked for cultural and chronological fit
- [ ] Six stills read and fixed; no straight-line horizons, no era bleed
- [ ] Copy inside the title-safe box; contrast legible over the busiest frame
- [ ] Stills at t and the same frame in the MP4 match
- [ ] Score present, non-clipping, with hits near cuts
- [ ] CI green; duration, resolution, fps and audio verified by ffprobe
- [ ] Delivered file named, linked, and its render time reported

---

## Known-good numbers (2026-11, 4-vCPU runner)

| Thing | Value |
|---|---|
| 60 s @ 1080p/30 3D render | 414–555 s → **0.23–0.31 s/frame** |
| Same on a 2-core Celeron | ~5 s/frame (16× slower) — never trust a local video render |
| Page init with 26 CDN modules | ~60 s (longer than `snapshot`'s default 45 s timeout) |
| Era cull radius | 62 m with 95 m station spacing |
| Working composition size | ~1,000 lines; >800 warns `composition_file_too_large` |
