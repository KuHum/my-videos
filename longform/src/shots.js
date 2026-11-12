// THE KING WHO INVITED THE MISSIONARIES — chapters 1–3 (16:9, Paper Atlas + archival photo inserts).
import { ctx, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle, ell, line } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { IMG } from './core/photos.js';
import * as K from './core/kit.js';
const { P, cut, P_rr, P_poly, P_circ } = K;

// ── set pieces ──
const WOOD = '#6B4E32', WOOD2 = '#5A4029';

/** the desk surface the letter sits on */
function desk(y = 640) {
  cut(P_rr(-300, y, W + 600, 260, 0), WOOD, { shadow: 0, edge: 0 });
  for (let i = 0; i < 9; i++) line([[-300, y + 22 + i * 26], [W + 300, y + 22 + i * 26]], 'rgba(40,26,14,0.18)', 3);
}

/** stylized map page: the lake, the land and a compass */
function lakePage(seed = 3) {
  K.parchment(seed);
  ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = P.sea; ctx.fillRect(80, 90, 1760, 760); ctx.restore();
  ctx.strokeStyle = 'rgba(62,44,30,0.16)'; ctx.lineWidth = 2;
  for (let x = 80; x <= 1840; x += 140) { ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, 850); ctx.stroke(); }
  for (let y = 90; y <= 850; y += 120) { ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(1840, y); ctx.stroke(); }
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.strokeRect(80, 90, 1760, 760);
}

/** a paper lake built from a wobbling polygon */
function lake(cx, cy, rx, ry, seed = 1, fill = P.seaDark) {
  const pts = [];
  for (let i = 0; i < 90; i++) {
    const a = i / 90 * TAU;
    const k = 1 + 0.11 * Math.sin(3 * a + seed) + 0.06 * Math.sin(7 * a + seed * 2);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  cut(P_poly(pts), fill, { shadow: 0.8, edge: 6 });
  return pts;
}

/** small paper icon: a coin, a helmet, a shield, a book, a tusk, a banana, a cow */
function coin(x, y, r, txt = '$') {
  ctx.save(); ctx.translate(x, y);
  cut(P_circ(0, 0, r), P.gold, { shadow: 0.6, edge: 5 });
  ctx.font = `700 ${r * 1.2}px Caladea`; ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(txt, 0, 4);
  ctx.restore();
}
function iconHelmet(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  cut(() => { ctx.beginPath(); ctx.arc(0, 0, 70, Math.PI, TAU); ctx.lineTo(86, 0); ctx.lineTo(-86, 0); ctx.closePath(); }, P.sepia, { shadow: 0.6, edge: 5 });
  cut(P_rr(-96, -6, 192, 26, 12), P.sepia, { shadow: 0.5, edge: 4 });
  ctx.restore();
}
function iconShield(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  cut(P_poly([[-70, -80], [70, -80], [70, 20], [0, 92], [-70, 20]]), P.stoneDark, { shadow: 0.6, edge: 5 });
  line([[0, -60], [0, 60]], P.edge, 8);
  ctx.restore();
}
function iconBook(x, y, s, open = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (open) {
    cut(P_poly([[-120, -60], [0, -40], [120, -60], [120, 70], [0, 90], [-120, 70]]), '#EFE4C8', { shadow: 0.7, edge: 5 });
    line([[0, -40], [0, 90]], P.sepia, 5);
    for (let i = 0; i < 4; i++) line([[-92, -22 + i * 22], [-14, -8 + i * 22]], 'rgba(62,44,30,0.35)', 4);
    for (let i = 0; i < 4; i++) line([[14, -8 + i * 22], [92, -22 + i * 22]], 'rgba(62,44,30,0.35)', 4);
  } else cut(P_rr(-80, -100, 160, 200, 6), P.wine, { shadow: 0.7, edge: 5 });
  ctx.restore();
}
function iconTusk(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(() => { ctx.beginPath(); ctx.moveTo(-30, 90); ctx.quadraticCurveTo(-70, -20, 10, -96); ctx.quadraticCurveTo(-10, -20, 26, 90); ctx.closePath(); }, '#EFE4C8', { shadow: 0.6, edge: 5 }); ctx.restore(); }
function iconBanana(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); for (let i = 0; i < 3; i++) cut(() => { ctx.beginPath(); ctx.moveTo(-70 + i * 26, -60); ctx.quadraticCurveTo(-110 + i * 26, 30, -40 + i * 26, 80); ctx.quadraticCurveTo(-50 + i * 26, 10, -40 + i * 26, -60); ctx.closePath(); }, P.forest, { shadow: 0.5, edge: 4 }); ctx.restore(); }
function iconCow(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(P_rr(-90, -30, 170, 80, 26), '#EFE4C8', { shadow: 0.6, edge: 5 }); cut(P_circ(84, -44, 34), '#EFE4C8', { shadow: 0.5, edge: 4 }); cut(P_poly([[70, -70], [74, -96], [92, -72]]), P.ink, { shadow: 0.3, edge: 3 }); cut(P_poly([[104, -70], [110, -96], [118, -70]]), P.ink, { shadow: 0.3, edge: 3 }); for (const lx of [-62, -22, 42, 70]) cut(P_rr(lx, 44, 16, 60, 6), '#EFE4C8', { shadow: 0.4, edge: 3 }); ctx.restore(); }

/** crimson arrow with a paper head */
function arrow(x0, y0, x1, y1, p = 1, wdt = 16) {
  if (p <= 0) return; const x = lerp(x0, x1, p), y = lerp(y0, y1, p);
  ctx.save(); ctx.strokeStyle = P.crimson; ctx.lineWidth = wdt; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.translate(x, y); ctx.rotate(a);
  cut(P_poly([[26, 0], [-10, 34], [-10, -34]]), P.crimson, { shadow: 0.5, edge: 4 });
  ctx.restore();
}

export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const at = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // 1 · the letter — 0:00 · lines 0–1
  add({ id: 'S01', at: at(0), cam: [960, 500], zoom: 0.05, hold: [2.4, 99], note: 'a letter on a desk, 1875 ribbon, wax seal', draw(lt, d, t) {
    K.parchment(1); desk(640);
    const sc = eob(seg(lt, 0.15, 0.6));
    K.photoCard(IMG.letter, 860, 430, 780, { crop: { x: 0.02, y: 0.0, w: 0.9, h: 1.0 }, rot: -0.02, mat: 26 });
    if (sc > 0) { ctx.save(); ctx.globalAlpha = clamp(sc * 1.4); K.seal(1360, 700, 0.9 * sc, 'M'); ctx.restore(); }
    K.ribbon('1875', 1520, 250, eob(seg(lt, 0.5, 0.85)), 74);
  } });
  cue(0.1, 'whoosh'); cue(0.5, 'pop', { gain: 0.6 });

  // 2 · he asked for teachers — line 2
  add({ id: 'S02', at: at(2), cam: [960, 480], zoom: 0.05, hold: [3.0, 99], note: 'three refused offers, then the book', draw(lt, d, t) {
    K.parchment(2);
    const items = [[560, iconHelmet], [960, (x, y, s) => coin(x, y + 10, 78 * s)], [1360, iconShield]];
    items.forEach(([x, fn], i) => {
      const p = eob(seg(lt, 0.1 + i * 0.18, 0.45 + i * 0.18));
      if (p <= 0) return;
      cut(P_rr(x - 160, 250, 320, 300, 8), '#F1E7CF', { shadow: 0.85, edge: 0 });
      ctx.save(); ctx.translate(x, 400); ctx.scale(p, p); ctx.translate(-x, -400);
      fn(x, 400, 0.9 * p);
      ctx.restore();
      const xp = seg(lt, 1.55 + i * 0.12, 1.85 + i * 0.12);
      if (xp > 0) { ctx.save(); ctx.globalAlpha = xp; line([[x - 110, 295], [x + 110, 505]], P.crimson, 18); line([[x + 110, 295], [x - 110, 505]], P.crimson, 18); ctx.restore(); }
    });
    const bk = eob(seg(lt, 2.35, 2.75));
    if (bk > 0) { ctx.save(); ctx.globalAlpha = clamp(bk * 1.5); ctx.translate(960, 660); ctx.scale(bk, bk); iconBook(0, 0, 1.35, true); ctx.restore(); K.slip('TEACHERS', 960, 790, bk, -0.02, 44); }
  } });
  cue(0.1, 'whoosh'); for (let i = 0; i < 3; i++) cue(0.2 + i * 0.18, 'pop', { gain: 0.45 }); cue(1.6, 'tock', { gain: 0.3 }); cue(2.4, 'pop', { gain: 0.7 });

  // 3 · the name — line 5
  add({ id: 'S03', at: at(5), cam: [960, 480], zoom: 0.06, hold: [1.4, 99], note: 'Muteesa portrait card, gold name slip', draw(lt, d, t) {
    K.parchment(3);
    const p = eob(seg(lt, 0.05, 0.5));
    if (p > 0) { ctx.save(); ctx.translate(960, 400); ctx.scale(0.8 + 0.2 * p, 0.8 + 0.2 * p); ctx.translate(-960, -400); K.photoCard(IMG.muteesaPortrait, 960, 400, 330, { rot: 0.01, mat: 30 }); ctx.restore(); }
    K.ribbon('KABAKA MUTEESA I', 960, 790, eob(seg(lt, 0.7, 1.05)), 62);
  } });
  cue(0.1, 'whoosh'); cue(0.75, 'pop', { gain: 0.7 });

  // 4 · the lake — lines 6–8
  add({ id: 'S04', at: at(6), cam: [960, 470], zoom: 0.05, hold: [2.6, 99], note: 'map: lake grows, Nalubaale then Lake Victoria', draw(lt, d, t) {
    lakePage(4);
    const g = eob(seg(lt, 0.15, 1.0));
    if (g > 0) { ctx.save(); ctx.translate(960, 470); ctx.scale(0.3 + 0.7 * g, 0.3 + 0.7 * g); ctx.translate(-960, -470); lake(960, 470, 430, 250, 1.7); ctx.restore(); }
    K.compass(1700, 760, 0.5); K.compass(1700, 760, 0.5);
    if (lt > 0.9) K.label('NALUBAAALE', 960, 470, 54);
    const v = eob(seg(lt, 5.2, 5.6));
    if (v > 0) K.slip('LAKE VICTORIA', 960, 660, v, -0.015, 46);
  } });
  cue(0.2, 'whoosh'); cue(0.9, 'pop', { gain: 0.5 }); cue(5.3, 'pop', { gain: 0.6 });

  // 5 · the court — lines 9–11
  add({ id: 'S05', at: at(9), cam: [960, 470], zoom: 0.04, hold: [2.0, 99], note: 'photo: Muteesa seated with chiefs and attendants', draw(lt, d, t) {
    K.parchment(5);
    K.photoCard(IMG.muteesaCourt, 960, 470, 1040, { rot: -0.008, mat: 26 });
    K.slip('THE COURT AT RUBAKA', 960, 110, eob(seg(lt, 0.4, 0.75)), -0.01, 38);
  } });
  cue(0.1, 'whoosh'); cue(0.45, 'pop', { gain: 0.5 });

  // 6 · authority to Bunyoro — line 12
  add({ id: 'S06', at: at(12), cam: [960, 470], zoom: 0.05, hold: [2.0, 99], note: 'map: crimson reach spreads toward Bunyoro', draw(lt, d, t) {
    lakePage(6); lake(820, 560, 380, 220, 2.3);
    const p = eo(seg(lt, 0.2, 1.8));
    if (p > 0) {
      ctx.save(); ctx.strokeStyle = P.crimson; ctx.lineWidth = 14; ctx.setLineDash([26, 16]);
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.ellipse(820, 560, 380 + 520 * p, 230 + 300 * p, -0.08, 0, TAU); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 0.10; ctx.fillStyle = P.crimson;
      ctx.beginPath(); ctx.ellipse(820, 560, 380 + 520 * p, 230 + 300 * p, -0.08, 0, TAU); ctx.fill();
      ctx.restore();
    }
    K.label('BUGANDA', 900, 640, 56);
    const b = eob(seg(lt, 1.3, 1.65)); if (b > 0) K.slip('BUNYORO', 1620, 260, b, 0.03, 46);
  } });
  cue(0.2, 'whoosh'); cue(1.35, 'pop', { gain: 0.6 });

  // 7 · wealth — line 13
  add({ id: 'S07', at: at(13), cam: [960, 480], zoom: 0.05, hold: [2.6, 99], note: 'bananas, barkcloth, cattle, ivory pop in', draw(lt, d, t) {
    K.parchment(7);
    const icons = [[400, iconBanana], [760, iconCow], [1120, iconTusk], [1500, (x, y, s) => { ctx.save(); ctx.translate(x, y); cut(P_rr(-70, -90, 140, 180, 8), '#C9A86A', { shadow: 0.7, edge: 5 }); for (let i = 0; i < 3; i++) line([[-56, -50 + i * 44], [56, -50 + i * 44]], 'rgba(62,44,30,0.3)', 6); ctx.restore(); }]];
    icons.forEach(([x, fn], i) => { const p = eob(seg(lt, 0.1 + i * 0.32, 0.45 + i * 0.32)); if (p > 0) { ctx.save(); ctx.translate(x, 470); ctx.scale(1.55 * p, 1.55 * p); ctx.translate(-x, -470); fn(x, 470, 1); ctx.restore(); } });
  } });
  cue(0.1, 'whoosh'); for (let i = 0; i < 4; i++) cue(0.15 + i * 0.32, 'pop', { gain: 0.4 });

  // 8 · the trade road east — lines 14–15
  add({ id: 'S08', at: at(14), cam: [960, 470], zoom: 0.05, hold: [2.8, 99], note: 'crimson route from the lake to the Swahili coast', draw(lt, d, t) {
    lakePage(8); lake(620, 520, 300, 190, 3.1);
    const route = [[780, 520], [1050, 470], [1300, 420], [1560, 380], [1780, 350]];
    const p = eo(seg(lt, 0.25, 2.1));
    if (p > 0) K.dashedRoute(route, p);
    K.label('BUGANDA', 620, 760, 46);
    const z = eob(seg(lt, 1.7, 2.0)); if (z > 0) K.slip('ZANZIBAR', 1700, 240, z, 0.03, 44);
    if (p > 0.6) { const q = clamp((p - 0.6) * 2.5); ctx.save(); ctx.globalAlpha = q; iconTusk(1180, 620, 0.5); iconTusk(1420, 560, 0.5); ctx.restore(); }
  } });
  cue(0.2, 'whoosh'); cue(0.35, 'slide', { dur: 1.8, gain: 0.6 }); cue(1.75, 'pop', { gain: 0.6 });

  // 9 · the traders' religion — lines 16–18
  add({ id: 'S09', at: at(16), cam: [960, 480], zoom: 0.05, hold: [2.8, 99], note: 'crescent, robed figures, the Quran at court', draw(lt, d, t) {
    K.parchment(9);
    const p = eob(seg(lt, 0.15, 0.6));
    if (p > 0) { ctx.save(); ctx.globalAlpha = p; ctx.translate(960, 330); ctx.scale(1.4 * p, 1.4 * p); cut(() => { ctx.beginPath(); ctx.arc(0, 0, 120, 0, TAU); ctx.arc(46, -10, 100, 0, TAU, true); ctx.closePath(); }, P.royal, { shadow: 0.7, edge: 6 }); ctx.restore(); }
    K.figure({ x: 620, y: 800, h: 330, role: 'merchant', dir: 1 });
    K.figure({ x: 820, y: 810, h: 330, role: 'scholar', dir: -1 });
    K.figure({ x: 1320, y: 805, h: 330, role: 'guard', dir: 1 });
    const b = eob(seg(lt, 1.5, 1.9)); if (b > 0) K.slip('THE QURAN', 1060, 700, b, -0.02, 44);
    if (lt > 2.2) K.label('ARABIC AT THE PALACE', 960, 860, 30);
  } });
  cue(0.15, 'whoosh'); cue(0.2, 'pop', { gain: 0.6 }); cue(1.55, 'pop', { gain: 0.5 });

  // 10 · the threat closes in — lines 19–21
  add({ id: 'S10', at: at(19), cam: [960, 470], zoom: 0.05, hold: [2.4, 99], note: 'two crimson arrows: Egypt from the north, Bunyoro from the west', draw(lt, d, t) {
    lakePage(10); lake(980, 560, 360, 220, 5.3);
    K.label('BUGANDA', 980, 760, 46);
    const e = eo(seg(lt, 0.15, 1.1)); if (e > 0) arrow(980, 60, 980, 300, e);
    const w = eo(seg(lt, 0.55, 1.5)); if (w > 0) arrow(120, 520, 560, 540, w);
    if (e > 0.5) K.slip('EGYPT', 980, 130, clamp((e - 0.5) * 3), 0.02, 42);
    if (w > 0.5) K.slip('BUNYORO', 260, 380, clamp((w - 0.5) * 3), -0.03, 42);
  } });
  cue(0.15, 'whoosh'); cue(0.2, 'slide', { dur: 1.4, gain: 0.6 }); cue(0.6, 'slide', { dur: 1.2, gain: 0.5 });

  // 11 · 1862: Speke and Grant — lines 22–24
  add({ id: 'S11', at: at(22), cam: [960, 480], zoom: 0.05, hold: [1.8, 99], note: 'picture-history crop: Muteesa receives Speke and Grant', draw(lt, d, t) {
    K.parchment(11);
    K.photoCard(IMG.pictureHistory, 960, 430, 760, { crop: { x: 0.67, y: 0.02, w: 0.33, h: 0.28 }, rot: 0.01, mat: 26 });
    K.ribbon('1862', 1450, 720, eob(seg(lt, 0.9, 1.2)), 70);
    const b = eob(seg(lt, 1.2, 1.5)); if (b > 0) K.slip('SPEKE & GRANT', 700, 720, b, -0.02, 40);
  } });
  cue(0.1, 'whoosh'); cue(0.95, 'pop', { gain: 0.6 });

  // 12 · the world getting bigger — line 25
  add({ id: 'S12', at: at(25), cam: [960, 480], zoom: 0.06, hold: [2.2, 99], note: 'paper globe with trade routes closing in', draw(lt, d, t) {
    K.parchment(12);
    const p = eob(seg(lt, 0.1, 0.7));
    if (p > 0) {
      ctx.save(); ctx.translate(960, 460); ctx.scale(p, p);
      cut(P_circ(0, 0, 300), P.sea, { shadow: 0.9, edge: 6 });
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 300, 0, TAU); ctx.clip();
      cut(P_poly([[-300, -140], [-120, -200], [-40, -90], [-140, 40], [-260, 10]]), P.land, { shadow: 0.4, edge: 4 });
      cut(P_poly([[20, -190], [200, -150], [240, -20], [120, 70], [30, -30]]), P.land, { shadow: 0.4, edge: 4 });
      cut(P_poly([[-60, 120], [90, 100], [140, 240], [0, 300], [-110, 240]]), P.land, { shadow: 0.4, edge: 4 });
      ctx.restore();
      ctx.strokeStyle = P.crimson; ctx.lineWidth = 8; ctx.setLineDash([20, 14]);
      ctx.beginPath(); ctx.arc(0, 0, 240, -1.2, 1.9); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    const s = eob(seg(lt, 1.1, 1.4)); if (s > 0) K.slip('THE WORLD WAS GETTING BIGGER', 960, 810, s, -0.01, 38);
  } });
  cue(0.1, 'whoosh'); cue(1.15, 'pop', { gain: 0.6 });

  // 13 · the calculation — line 26
  add({ id: 'S13', at: at(26), cam: [960, 470], zoom: 0.05, hold: [2.4, 99], note: 'a balance: an ally against an army', draw(lt, d, t) {
    K.parchment(13);
    cut(P_rr(940, 300, 40, 420, 8), P.sepia, { shadow: 0.8, edge: 5 });
    cut(P_rr(760, 700, 400, 40, 8), P.sepia, { shadow: 0.7, edge: 5 });
    const tilt = 0.16 * eio(seg(lt, 0.6, 2.0));
    ctx.save(); ctx.translate(960, 300); ctx.rotate(tilt);
    cut(P_rr(-380, -18, 760, 36, 10), P.ink, { shadow: 0.6, edge: 5 });
    for (const sx of [-340, 340]) { line([[sx, 18], [sx, 120]], P.sepia, 8); cut(P_poly([[sx - 130, 120], [sx + 130, 120], [sx + 90, 200], [sx - 90, 200]]), P.stoneDark, { shadow: 0.6, edge: 5 }); }
    ctx.restore();
    iconBook(620, 420, 0.55, true);
    K.figure({ x: 1300, y: 500, h: 150, role: 'guard', dir: -1 });
    const l = eob(seg(lt, 0.35, 0.7)), r = eob(seg(lt, 1.0, 1.3));
    if (l > 0) K.slip('AN ALLY', 620, 250, l, -0.02, 40);
    if (r > 0) K.slip('AN ARMY', 1300, 250, r, 0.02, 40);
  } });
  cue(0.1, 'whoosh'); cue(0.7, 'tock', { gain: 0.5 }); cue(1.05, 'pop', { gain: 0.5 });

  // 14 · April 1875 — line 27
  add({ id: 'S14', at: at(27), cam: [960, 470], zoom: 0.05, hold: [3.0, 99], note: 'a boat arrives on the lake; APRIL 1875', draw(lt, d, t) {
    K.parchment(14);
    K.photoCard(IMG.pictureHistory, 960, 430, 900, { crop: { x: 0.02, y: 0.02, w: 0.55, h: 0.30 }, rot: -0.01, mat: 26 });
    K.ribbon('APRIL 1875', 960, 780, eob(seg(lt, 0.8, 1.15)), 66);
    ctx.save(); ctx.globalAlpha = 0.6; K.compass(1700, 760, 0.42); ctx.restore();
  } });
  cue(0.1, 'whoosh'); cue(0.85, 'pop', { gain: 0.6 });

  return { shots: S, cues: CUES };
}
