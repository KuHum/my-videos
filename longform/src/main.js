// Boot: fonts → script + timing → captions → shots. Then draw(t) renders film time t (pure function of t).
// window.OP is the API tools/capture.mjs drives: ready, bootError, duration(), draw(t), frame(t, q), cues(), shots().
import { W, H, setCtx, ctx, clamp, eo, eio } from './core/lib.js';
import { T, loadTiming } from './core/timing.js';
import { buildCaptions, drawCaption, captionList } from './core/captions.js';
import { buildShots } from './shots.js';
import { loadPhotos } from './core/photos.js';

const cv = document.getElementById('cv');
// optional reduced-resolution rendering (faster on CPU-only machines); the film is still composed at 1920x1080
const SCALE = Math.max(0.35, Math.min(1, +(new URLSearchParams(location.search).get('scale') || 1)));
if (SCALE !== 1) { cv.width = Math.round(W * SCALE); cv.height = Math.round(H * SCALE); }
setCtx(cv.getContext('2d'));
const OP = (window.OP = { ready: false });

function draw(t) {
  t = clamp(t, 0, T.dur - 1e-4);
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0); ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const S = OP._shots; let i = S.length - 1; while (i > 0 && S[i].at > t) i--;
  const sh = S[i], end = i < S.length - 1 ? S[i + 1].at : T.dur, d = end - sh.at, lt = t - sh.at;
  // camera: punch-in on the cut + a slow push across the shot ("camera always moving").
  // Long-form holds: sh.hold = [a, b] (shot-local seconds). Inside it the picture is frozen — content
  // time and camera both stop — so consecutive frames are pixel-identical and --long can reuse one JPEG.
  // Captions are drawn after this, so a caption change still forces a new frame.
  const ct = sh.hold && lt >= sh.hold[0] && lt < sh.hold[1] ? sh.hold[0] : lt;
  const punch = 1 + 0.06 * (1 - eo(clamp(ct / 0.25)));
  const drift = 1 + (sh.zoom ?? 0.06) * eio(clamp(ct / d));
  const [cx, cy] = sh.cam || [W / 2, H / 2];
  ctx.save(); ctx.translate(cx, cy); ctx.scale(punch * drift, punch * drift); ctx.translate(-cx, -cy);
  sh.draw(ct, d, ct);
  ctx.restore();
  ctx.globalAlpha = 1; ctx.letterSpacing = '0px';

  // fade from / to black on the first and last 0.25 s
  const fade = Math.min(clamp(t / 0.25), clamp((T.dur - t) / 0.35));
  if (fade < 1) { ctx.fillStyle = '#000'; ctx.globalAlpha = 1 - fade; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  drawCaption(t);
}

(async () => {
  try {
    await document.fonts.load('900 100px Inter'); await document.fonts.load('700 100px Caladea');
    const script = await (await fetch('script.json', { cache: 'no-store' })).json();
    await loadPhotos();
    await loadTiming();
    buildCaptions(script);
    const { shots, cues } = buildShots();
    shots.sort((a, b) => a.at - b.at);
    OP._shots = shots; OP.script = script;
    OP.duration = () => T.dur;
    OP.draw = draw;
    OP.frame = (t, q = 0.92) => { draw(t); return cv.toDataURL('image/jpeg', q); };
    // Long-form: a cheap fingerprint of the drawn frame (96x54 thumbnail). Two equal fingerprints mean the
    // picture is genuinely unchanged, so the encoder can hold the last frame instead of re-capturing it.
    const fcv = document.createElement('canvas'); fcv.width = 96; fcv.height = 54;
    const fctx = fcv.getContext('2d', { willReadFrequently: true });
    const hashFrame = () => {
      fctx.drawImage(cv, 0, 0, 96, 54);
      const d = fctx.getImageData(0, 0, 96, 54).data;
      let h = 2166136261;
      for (let i = 0; i < d.length; i += 4) { h ^= d[i] * 3 + d[i + 1] * 5 + d[i + 2] * 7; h = Math.imul(h, 16777619); }
      return (h >>> 0).toString(36);
    };
    let lastFp = null;
    OP.fingerprint = (t) => { draw(t); return hashFrame(); };
    // long-form: draw ONCE per frame; return null when the picture is identical to the previous frame
    OP.captureFrame = (t, q = 0.93) => {
      draw(t);
      const fp = hashFrame();
      if (fp === lastFp) return null;
      lastFp = fp;
      return cv.toDataURL('image/jpeg', q);
    };
    OP.resetHold = () => { lastFp = null; };
    OP.shots = () => shots.map((s, i) => ({ id: s.id, at: +s.at.toFixed(3), end: +(i < shots.length - 1 ? shots[i + 1].at : T.dur).toFixed(3), note: s.note || '' }));
    OP.captions = () => captionList().map((c) => ({ s: +c.s.toFixed(3), e: +c.e.toFixed(3), text: c.words.map((w) => (w.hi ? '*' : '') + w.txt).join(' ') }));
    OP.cues = () => cues.slice().sort((a, b) => a.t - b.t);
    OP.ready = true;
    // preview mode (not capture): play in real time, ?t=12.3 to hold a frame
    const q = new URLSearchParams(location.search);
    if (!q.has('capture')) {
      if (q.has('t')) draw(+q.get('t'));
      else {
        const audio = new Audio('data/mix.wav'); let t0 = null;
        const btn = document.getElementById('play'); btn.hidden = false;
        btn.onclick = () => { btn.hidden = true; t0 = performance.now(); audio.currentTime = 0; audio.play().catch(() => {}); };
        const loop = (now) => { const t = t0 == null ? 0 : (now - t0) / 1000; draw(t0 == null ? 0 : t); if (t0 != null && t > T.dur) { t0 = null; btn.hidden = false; } requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
    }
  } catch (e) { OP.bootError = String(e && e.stack || e); console.error(e); }
})();
