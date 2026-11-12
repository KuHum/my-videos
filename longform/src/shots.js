// THE KING WHO INVITED THE MISSIONARIES — all nine chapters (16:9, Paper Atlas + archival photo inserts).
import { ctx, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle, ell, line } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { IMG } from './core/photos.js';
import * as K from './core/kit.js';
const { P, cut, P_rr, P_poly, P_circ } = K;

const WOOD = '#6B4E32';

function desk(y = 640) {
  cut(P_rr(-300, y, W + 600, 260, 0), WOOD, { shadow: 0, edge: 0 });
  for (let i = 0; i < 9; i++) line([[-300, y + 22 + i * 26], [W + 300, y + 22 + i * 26]], 'rgba(40,26,14,0.18)', 3);
}

function lakePage(seed = 3) {
  K.parchment(seed);
  ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = P.sea; ctx.fillRect(80, 90, 1760, 760); ctx.restore();
  ctx.strokeStyle = 'rgba(62,44,30,0.16)'; ctx.lineWidth = 2;
  for (let x = 80; x <= 1840; x += 140) { ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, 850); ctx.stroke(); }
  for (let y = 90; y <= 850; y += 120) { ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(1840, y); ctx.stroke(); }
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.strokeRect(80, 90, 1760, 760);
}

function lake(cx, cy, rx, ry, seed = 1, fill = P.seaDark) {
  const pts = [];
  for (let i = 0; i < 90; i++) {
    const a = i / 90 * TAU;
    const k = 1 + 0.11 * Math.sin(3 * a + seed) + 0.06 * Math.sin(7 * a + seed * 2);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  cut(P_poly(pts), fill, { shadow: 0.8, edge: 6 });
}

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
function gear(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(() => { ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = i % 2 ? 86 : 108; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }, P.sepia, { shadow: 0.6, edge: 5 }); circle(0, 0, 34, P.parch); ctx.restore(); }
function bottle(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(P_rr(-42, -20, 84, 130, 12), P.royal, { shadow: 0.6, edge: 5 }); cut(P_rr(-18, -90, 36, 76, 8), P.royal, { shadow: 0.5, edge: 4 }); cut(P_rr(-26, -108, 52, 26, 6), P.sepia, { shadow: 0.4, edge: 4 }); ctx.restore(); }
function crescent(x, y, r, col = P.royal) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.arc(r * 0.45, -r * 0.05, r * 0.86, 0, TAU, true);
  ctx.fillStyle = col; ctx.fill('evenodd');
  ctx.strokeStyle = P.edge; ctx.lineWidth = 6; ctx.stroke();
  ctx.restore();
}
function crossShape(x, y, s, col = P.wine) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); cut(P_rr(-16, -90, 32, 180, 4), col, { shadow: 0.5, edge: 4 }); cut(P_rr(-62, -34, 124, 32, 4), col, { shadow: 0.5, edge: 4 }); ctx.restore(); }

function newspaper(x, y, s = 1, rot = -0.02) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  cut(P_rr(-330, -220, 660, 440, 3), '#EFE4C8', { shadow: 1, edge: 5 });
  ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.font = '700 46px Caladea'; ctx.fillText('THE DAILY TELEGRAPH', 0, -150);
  line([[-290, -128], [290, -128]], P.ink, 4);
  ctx.font = '700 24px Caladea'; ctx.fillText('LONDON, MONDAY, NOVEMBER 15, 1875', 0, -96);
  line([[-290, -76], [290, -76]], P.ink, 2);
  for (let c = 0; c < 3; c++) for (let i = 0; i < 12; i++) line([[-290 + c * 200, -50 + i * 20], [-110 + c * 200, -50 + i * 20]], 'rgba(62,44,30,0.35)', 3);
  ctx.restore();
}

function press(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  cut(P_rr(-190, -20, 380, 120, 6), P.sepia, { shadow: 0.8, edge: 5 });
  cut(P_rr(-170, -300, 40, 300, 5), P.ink, { shadow: 0.6, edge: 4 });
  cut(P_rr(130, -300, 40, 300, 5), P.ink, { shadow: 0.6, edge: 4 });
  cut(P_rr(-150, -330, 300, 50, 6), P.ink, { shadow: 0.6, edge: 4 });
  cut(P_rr(-16, -560, 32, 240, 6), P.sepia, { shadow: 0.5, edge: 4 });
  cut(P_poly([[-16, -560], [110, -520], [110, -490], [-16, -520]]), P.sepia, { shadow: 0.5, edge: 4 });
  cut(P_rr(-140, -150, 280, 26, 4), '#EFE4C8', { shadow: 0.5, edge: 4 });
  ctx.restore();
}

function doorPaper(open = 0) {
  cut(P_rr(760, 180, 400, 640, 4), P.stoneDark, { shadow: 0.7, edge: 5 });
  ctx.save(); ctx.translate(780, 200);
  const wdt = 360 * (1 - 0.55 * open);
  cut(P_poly([[0, 0], [wdt, 30 * open], [wdt, 600 - 30 * open], [0, 600]]), P.wine, { shadow: 0.8, edge: 5 });
  circle(wdt - 40, 300, 12, P.gold);
  ctx.restore();
}

function globe(x, y, r, p = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
  cut(P_circ(0, 0, r), P.sea, { shadow: 0.9, edge: 6 });
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
  const k = r / 300;
  cut(P_poly([[-300 * k, -140 * k], [-120 * k, -200 * k], [-40 * k, -90 * k], [-140 * k, 40 * k], [-260 * k, 10 * k]]), P.land, { shadow: 0.4, edge: 4 });
  cut(P_poly([[20 * k, -190 * k], [200 * k, -150 * k], [240 * k, -20 * k], [120 * k, 70 * k], [30 * k, -30 * k]]), P.land, { shadow: 0.4, edge: 4 });
  cut(P_poly([[-60 * k, 120 * k], [90 * k, 100 * k], [140 * k, 240 * k], [0 * k, 300 * k], [-110 * k, 240 * k]]), P.land, { shadow: 0.4, edge: 4 });
  ctx.restore();
  ctx.restore();
}

function mapX(x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); line([[-46, -46], [46, 46]], P.crimson, 16); line([[46, -46], [-46, 46]], P.crimson, 16); ctx.restore(); }

export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const at = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // ── 1 · the letter ──
  add({ id: 'S01', at: at(0), cam: [960, 500], zoom: 0.05, hold: [2.4, 99], draw(lt, d, t) {
    K.parchment(1); desk(640);
    K.photoCard(IMG.letter, 860, 430, 780, { crop: { x: 0.02, y: 0.0, w: 0.9, h: 1.0 }, rot: -0.02, mat: 26 });
    const sc = eob(seg(lt, 0.15, 0.6));
    if (sc > 0) { ctx.save(); ctx.globalAlpha = clamp(sc * 1.4); K.seal(1360, 700, 0.9 * sc, 'M'); ctx.restore(); }
    K.ribbon('1875', 1520, 250, eob(seg(lt, 0.5, 0.85)), 74);
  } });
  cue(0.1, 'whoosh'); cue(0.5, 'pop', { gain: 0.6 });

  add({ id: 'S02', at: at(2), cam: [960, 480], zoom: 0.05, hold: [3.0, 99], draw(lt, d, t) {
    K.parchment(2);
    const items = [[560, iconHelmet], [960, (x, y, s) => coin(x, y + 10, 78 * s)], [1360, iconShield]];
    items.forEach(([x, fn], i) => {
      const p = eob(seg(lt, 0.1 + i * 0.18, 0.45 + i * 0.18));
      if (p <= 0) return;
      cut(P_rr(x - 160, 250, 320, 300, 8), '#F1E7CF', { shadow: 0.85, edge: 0 });
      ctx.save(); ctx.translate(x, 400); ctx.scale(p, p); ctx.translate(-x, -400);
      fn(x, 400, 0.9 * p); ctx.restore();
      const xp = seg(lt, 1.55 + i * 0.12, 1.85 + i * 0.12);
      if (xp > 0) { ctx.save(); ctx.globalAlpha = xp; line([[x - 110, 295], [x + 110, 505]], P.crimson, 18); line([[x + 110, 295], [x - 110, 505]], P.crimson, 18); ctx.restore(); }
    });
    const bk = eob(seg(lt, 2.35, 2.75));
    if (bk > 0) { ctx.save(); ctx.globalAlpha = clamp(bk * 1.5); ctx.translate(960, 660); ctx.scale(bk, bk); iconBook(0, 0, 1.35, true); ctx.restore(); K.slip('TEACHERS', 960, 830, bk, -0.02, 44); }
  } });
  cue(0.1, 'whoosh'); for (let i = 0; i < 3; i++) cue(0.2 + i * 0.18, 'pop', { gain: 0.45 }); cue(2.4, 'pop', { gain: 0.7 });

  add({ id: 'S03', at: at(5), cam: [960, 480], zoom: 0.06, hold: [1.4, 99], draw(lt, d, t) {
    K.parchment(3);
    const p = eob(seg(lt, 0.05, 0.5));
    if (p > 0) { ctx.save(); ctx.translate(960, 400); ctx.scale(0.8 + 0.2 * p, 0.8 + 0.2 * p); ctx.translate(-960, -400); K.photoCard(IMG.muteesaPortrait, 960, 400, 330, { rot: 0.01, mat: 30 }); ctx.restore(); }
    K.ribbon('KABAKA MUTEESA I', 960, 790, eob(seg(lt, 0.7, 1.05)), 62);
  } });
  cue(0.1, 'whoosh'); cue(0.75, 'pop', { gain: 0.7 });

  // ── 2 · the kingdom ──
  add({ id: 'S04', at: at(6), cam: [960, 470], zoom: 0.05, hold: [2.6, 99], draw(lt, d, t) {
    lakePage(4);
    const g = eob(seg(lt, 0.15, 1.0));
    if (g > 0) { ctx.save(); ctx.translate(960, 470); ctx.scale(0.3 + 0.7 * g, 0.3 + 0.7 * g); ctx.translate(-960, -470); lake(960, 470, 430, 250, 1.7); ctx.restore(); }
    K.compass(1700, 760, 0.5);
    if (lt > 0.9) K.label('NALUBAAALE', 960, 470, 54);
    const v = eob(seg(lt, 5.2, 5.6)); if (v > 0) K.slip('LAKE VICTORIA', 960, 660, v, -0.015, 46);
  } });
  cue(0.2, 'whoosh'); cue(0.9, 'pop', { gain: 0.5 }); cue(5.3, 'pop', { gain: 0.6 });

  add({ id: 'S05', at: at(9), cam: [960, 470], zoom: 0.04, hold: [2.0, 99], draw(lt, d, t) {
    K.parchment(5);
    K.photoCard(IMG.muteesaCourt, 960, 470, 1040, { rot: -0.008, mat: 26 });
    K.slip('THE COURT AT RUBAKA', 960, 110, eob(seg(lt, 0.4, 0.75)), -0.01, 38);
  } });
  cue(0.1, 'whoosh'); cue(0.45, 'pop', { gain: 0.5 });

  add({ id: 'S06', at: at(12), cam: [960, 470], zoom: 0.05, hold: [2.0, 99], draw(lt, d, t) {
    lakePage(6); lake(820, 560, 380, 220, 2.3);
    const p = eo(seg(lt, 0.2, 1.8));
    if (p > 0) {
      ctx.save(); ctx.strokeStyle = P.crimson; ctx.lineWidth = 14; ctx.setLineDash([26, 16]);
      ctx.beginPath(); ctx.ellipse(820, 560, 380 + 520 * p, 230 + 300 * p, -0.08, 0, TAU); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 0.1; ctx.fillStyle = P.crimson; ctx.fill(); ctx.restore();
    }
    K.label('BUGANDA', 900, 640, 56);
    const b = eob(seg(lt, 1.3, 1.65)); if (b > 0) K.slip('BUNYORO', 1620, 260, b, 0.03, 46);
  } });
  cue(0.2, 'whoosh'); cue(1.35, 'pop', { gain: 0.6 });

  add({ id: 'S07', at: at(13), cam: [960, 480], zoom: 0.05, hold: [2.6, 99], draw(lt, d, t) {
    K.parchment(7);
    const icons = [[400, iconBanana], [760, iconCow], [1120, iconTusk], [1500, (x, y) => { ctx.save(); ctx.translate(x, y); cut(P_rr(-70, -90, 140, 180, 8), '#C9A86A', { shadow: 0.7, edge: 5 }); for (let i = 0; i < 3; i++) line([[-56, -50 + i * 44], [56, -50 + i * 44]], 'rgba(62,44,30,0.3)', 6); ctx.restore(); }]];
    icons.forEach(([x, fn], i) => { const p = eob(seg(lt, 0.1 + i * 0.32, 0.45 + i * 0.32)); if (p > 0) { ctx.save(); ctx.translate(x, 470); ctx.scale(1.55 * p, 1.55 * p); ctx.translate(-x, -470); fn(x, 470); ctx.restore(); } });
  } });
  cue(0.1, 'whoosh'); for (let i = 0; i < 4; i++) cue(0.15 + i * 0.32, 'pop', { gain: 0.4 });

  add({ id: 'S08', at: at(14), cam: [960, 470], zoom: 0.05, hold: [2.8, 99], draw(lt, d, t) {
    lakePage(8); lake(620, 520, 300, 190, 3.1);
    const route = [[780, 520], [1050, 470], [1300, 420], [1560, 380], [1780, 350]];
    const p = eo(seg(lt, 0.25, 2.1)); if (p > 0) K.dashedRoute(route, p);
    K.label('BUGANDA', 620, 760, 46);
    const z = eob(seg(lt, 1.7, 2.0)); if (z > 0) K.slip('ZANZIBAR', 1700, 240, z, 0.03, 44);
    if (p > 0.6) { ctx.save(); ctx.globalAlpha = clamp((p - 0.6) * 2.5); iconTusk(1180, 620, 0.5); iconTusk(1420, 560, 0.5); ctx.restore(); }
  } });
  cue(0.2, 'whoosh'); cue(0.35, 'slide', { dur: 1.8, gain: 0.6 }); cue(1.75, 'pop', { gain: 0.6 });

  add({ id: 'S09', at: at(16), cam: [960, 480], zoom: 0.05, hold: [2.8, 99], draw(lt, d, t) {
    K.parchment(9);
    const p = eob(seg(lt, 0.15, 0.6));
    if (p > 0) { ctx.save(); ctx.globalAlpha = p; crescent(960, 320, 120 * p + 0.01); ctx.restore(); }
    K.figure({ x: 620, y: 800, h: 330, role: 'merchant', dir: 1 });
    K.figure({ x: 820, y: 810, h: 330, role: 'scholar', dir: -1 });
    K.figure({ x: 1320, y: 805, h: 330, role: 'guard', dir: 1 });
    const b = eob(seg(lt, 1.5, 1.9)); if (b > 0) K.slip('THE QURAN', 1060, 700, b, -0.02, 44);
    if (lt > 2.2) K.label('ARABIC AT THE PALACE', 960, 860, 30);
  } });
  cue(0.15, 'whoosh'); cue(0.2, 'pop', { gain: 0.6 }); cue(1.55, 'pop', { gain: 0.5 });

  // ── 3 · the threat ──
  add({ id: 'S10', at: at(19), cam: [960, 470], zoom: 0.05, hold: [2.4, 99], draw(lt, d, t) {
    lakePage(10); lake(980, 560, 360, 220, 5.3);
    K.label('BUGANDA', 980, 760, 46);
    const e = eo(seg(lt, 0.15, 1.1));
    if (e > 0) { ctx.save(); ctx.strokeStyle = P.crimson; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(980, 90); ctx.lineTo(980, 90 + 200 * e); ctx.stroke(); ctx.restore(); }
    const w = eo(seg(lt, 0.55, 1.5)); if (w > 0) { ctx.save(); ctx.strokeStyle = P.crimson; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(140, 520); ctx.lineTo(140 + 420 * w, 540); ctx.stroke(); ctx.restore(); }
    if (e > 0.5) K.slip('EGYPT', 980, 130, clamp((e - 0.5) * 3), 0.02, 42);
    if (w > 0.5) K.slip('BUNYORO', 260, 380, clamp((w - 0.5) * 3), -0.03, 42);
  } });
  cue(0.15, 'whoosh'); cue(0.2, 'slide', { dur: 1.4, gain: 0.6 }); cue(0.6, 'slide', { dur: 1.2, gain: 0.5 });

  add({ id: 'S11', at: at(22), cam: [960, 480], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(11);
    K.photoCard(IMG.pictureHistory, 960, 430, 760, { crop: { x: 0.67, y: 0.02, w: 0.33, h: 0.28 }, rot: 0.01, mat: 26 });
    K.ribbon('1862', 1450, 720, eob(seg(lt, 0.9, 1.2)), 70);
    const b = eob(seg(lt, 1.2, 1.5)); if (b > 0) K.slip('SPEKE & GRANT', 700, 720, b, -0.02, 40);
  } });
  cue(0.1, 'whoosh'); cue(0.95, 'pop', { gain: 0.6 });

  add({ id: 'S12', at: at(25), cam: [960, 480], zoom: 0.06, hold: [2.2, 99], draw(lt, d, t) {
    K.parchment(12);
    globe(960, 450, 300, eob(seg(lt, 0.1, 0.7)));
    const s = eob(seg(lt, 1.1, 1.4)); if (s > 0) K.slip('THE WORLD WAS GETTING BIGGER', 960, 810, s, -0.01, 38);
  } });
  cue(0.1, 'whoosh'); cue(1.15, 'pop', { gain: 0.6 });

  add({ id: 'S13', at: at(26), cam: [960, 470], zoom: 0.05, hold: [2.4, 99], draw(lt, d, t) {
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

  add({ id: 'S14', at: at(27), cam: [960, 470], zoom: 0.05, hold: [3.0, 99], draw(lt, d, t) {
    K.parchment(14);
    K.photoCard(IMG.pictureHistory, 960, 430, 900, { crop: { x: 0.02, y: 0.02, w: 0.55, h: 0.30 }, rot: -0.01, mat: 26 });
    K.ribbon('APRIL 1875', 960, 780, eob(seg(lt, 0.8, 1.15)), 66);
  } });
  cue(0.1, 'whoosh'); cue(0.85, 'pop', { gain: 0.6 });

  // ── 4 · Stanley ──
  add({ id: 'S15', at: at(28), cam: [960, 460], zoom: 0.05, hold: [1.6, 99], draw(lt, d, t) {
    K.parchment(15);
    const p = eob(seg(lt, 0.05, 0.5));
    if (p > 0) { ctx.save(); ctx.translate(960, 420); ctx.scale(0.85 + 0.15 * p, 0.85 + 0.15 * p); ctx.translate(-960, -420); K.photoCard(IMG.stanleyPortrait, 960, 420, 420, { rot: -0.01, mat: 26 }); ctx.restore(); }
    K.ribbon('HENRY MORTON STANLEY', 960, 800, eob(seg(lt, 0.8, 1.15)), 52);
  } });
  cue(0.1, 'whoosh'); cue(0.85, 'pop', { gain: 0.6 });

  add({ id: 'S16', at: at(32), cam: [960, 470], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(16);
    iconBook(720, 430, 1.5, true);
    const s = eob(seg(lt, 0.6, 0.95)); if (s > 0) K.slip('HE COULD READ', 1250, 430, s, -0.02, 44);
  } });
  cue(0.1, 'whoosh'); cue(0.65, 'pop', { gain: 0.5 });

  add({ id: 'S17', at: at(34), cam: [960, 470], zoom: 0.05, hold: [2.0, 99], draw(lt, d, t) {
    K.parchment(17);
    K.ribbon('VICTORIA', 700, 300, eob(seg(lt, 0.1, 0.45)), 62);
    gear(1200, 420, eob(seg(lt, 0.5, 0.85)));
    K.slip('MACHINES', 1200, 660, eob(seg(lt, 0.85, 1.15)), 0.02, 42);
  } });
  cue(0.1, 'whoosh'); cue(0.15, 'pop', { gain: 0.5 }); cue(0.55, 'pop', { gain: 0.5 });

  add({ id: 'S18', at: at(36), cam: [960, 480], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(18);
    K.photoCard(IMG.letter, 900, 430, 700, { crop: { x: 0.02, y: 0.0, w: 0.9, h: 1.0 }, rot: 0.015, mat: 24 });
    const s = eob(seg(lt, 0.7, 1.05)); if (s > 0) K.slip('TO QUEEN VICTORIA', 900, 810, s, -0.01, 40);
  } });
  cue(0.1, 'whoosh'); cue(0.75, 'pop', { gain: 0.6 });

  add({ id: 'S19', at: at(38), cam: [960, 470], zoom: 0.05, hold: [2.6, 99], draw(lt, d, t) {
    K.parchment(19);
    iconBook(640, 430, 1.2, true);
    gear(1000, 430, 0.85);
    bottle(1300, 470, 0.85);
    ['TEACHERS', 'ENGINEERS', 'DOCTORS'].forEach((s, i) => { const p = eob(seg(lt, 0.5 + i * 0.3, 0.8 + i * 0.3)); if (p > 0) K.slip(s, 640 + i * 330, 690, p, -0.02, 34); });
  } });
  cue(0.1, 'whoosh'); for (let i = 0; i < 3; i++) cue(0.55 + i * 0.3, 'pop', { gain: 0.45 });

  add({ id: 'S20', at: at(40), cam: [960, 480], zoom: 0.04, hold: [2.2, 99], draw(lt, d, t) {
    K.parchment(20);
    newspaper(960, 430, 1.25 * eob(seg(lt, 0.1, 0.5)), -0.02);
    const s = eob(seg(lt, 1.4, 1.75)); if (s > 0) K.ribbon('15 NOVEMBER 1875', 960, 800, s, 46);
  } });
  cue(0.1, 'whoosh'); cue(1.45, 'pop', { gain: 0.6 });

  // ── 5 · the appeal ──
  add({ id: 'S21', at: at(43), cam: [960, 470], zoom: 0.05, hold: [2.2, 99], draw(lt, d, t) {
    K.parchment(21);
    lakePage(21);
    const n = 26, p = eo(seg(lt, 0.2, 2.0));
    for (let i = 0; i < n; i++) { const a = i / n * TAU * 3.1, r = 60 + (i / n) * 260; const x = 960 + Math.cos(a) * r, y = 500 + Math.sin(a) * r * 0.55; if (i / n < p) circle(x, y, 8, P.crimson); }
    const s = eob(seg(lt, 2.1, 2.4)); if (s > 0) K.slip('TWO MILLION PEOPLE', 960, 820, s, -0.01, 40);
  } });
  cue(0.2, 'whoosh'); cue(2.15, 'pop', { gain: 0.5 });

  add({ id: 'S22', at: at(47), cam: [960, 470], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(22);
    coin(880, 470, 80, '£');
    const s = eob(seg(lt, 0.5, 0.85)); if (s > 0) K.ribbon('£5,000', 1180, 470, s, 64);
    K.slip('ANONYMOUS DONOR', 960, 720, eob(seg(lt, 0.9, 1.2)), -0.02, 36);
  } });
  cue(0.1, 'whoosh'); cue(0.55, 'pop', { gain: 0.6 });

  add({ id: 'S23', at: at(49), cam: [960, 500], zoom: 0.05, hold: [2.0, 99], draw(lt, d, t) {
    K.parchment(23);
    cut(P_rr(-300, 700, W + 600, 500, 0), P.sea, { shadow: 0, edge: 0 });
    K.ship(960, 760, 1.1, Math.sin(lt * 1.4) * 0.03);
    K.slip('APRIL 1876', 960, 250, eob(seg(lt, 0.7, 1.05)), -0.01, 44);
  } });
  cue(0.1, 'whoosh'); cue(0.75, 'pop', { gain: 0.6 });

  add({ id: 'S24', at: at(51), cam: [960, 460], zoom: 0.05, hold: [2.4, 99], draw(lt, d, t) {
    K.parchment(24);
    K.photoCard(IMG.mackayPortrait, 760, 430, 340, { rot: -0.01, mat: 26 });
    const s = eob(seg(lt, 0.6, 0.95)); if (s > 0) K.slip('ALEXANDER MACKAY', 1300, 330, s, 0.02, 40);
    const q = eob(seg(lt, 1.3, 1.65)); if (q > 0) K.slip('SEND SOMEONE ELSE', 1300, 560, q, 0.02, 40);
  } });
  cue(0.1, 'whoosh'); cue(0.65, 'pop', { gain: 0.5 }); cue(1.35, 'pop', { gain: 0.6 });

  // ── 6 · the road ──
  add({ id: 'S25', at: at(55), cam: [960, 470], zoom: 0.05, hold: [2.4, 99], draw(lt, d, t) {
    lakePage(25);
    K.label('THE COAST', 250, 160, 34); K.label('BUGANDA', 960, 520, 34);
    const route = [[300, 220], [560, 330], [760, 430], [960, 520]];
    const p = eo(seg(lt, 0.2, 1.8)); if (p > 0) K.dashedRoute(route, p);
    for (const [x, y] of [[420, 260], [660, 380]]) mapX(x, y, 0.5);
  } });
  cue(0.2, 'whoosh'); cue(0.3, 'slide', { dur: 1.8, gain: 0.6 });

  add({ id: 'S26', at: at(61), cam: [960, 470], zoom: 0.04, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(26);
    cut(P_rr(-300, 720, W + 600, 500, 0), '#CDB98E', { shadow: 0, edge: 0 });
    K.figure({ x: 760, y: 820, h: 430, role: 'merchant', dir: 1 });
    K.figure({ x: 1120, y: 820, h: 430, role: 'scholar', dir: -1 });
    K.ribbon('30 JUNE 1877', 960, 200, eob(seg(lt, 0.6, 0.95)), 54);
    const s = eob(seg(lt, 1.0, 1.3)); if (s > 0) K.slip('RUBAKA', 960, 880, s, 0.02, 36);
  } });
  cue(0.1, 'whoosh'); cue(0.65, 'pop', { gain: 0.6 });

  add({ id: 'S27', at: at(66), cam: [960, 470], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    lakePage(27); lake(1050, 480, 340, 210, 6.1);
    mapX(760, 640, eob(seg(lt, 0.3, 0.7)));
    K.slip('UKEREWE', 760, 760, eob(seg(lt, 0.5, 0.85)), 0.02, 40);
  } });
  cue(0.1, 'whoosh'); cue(0.35, 'thud', { gain: 0.5 }); cue(0.55, 'pop', { gain: 0.5 });

  add({ id: 'S28', at: at(68), cam: [960, 480], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(28);
    K.photoCard(IMG.mackayBook, 960, 470, 820, { crop: { x: 0.48, y: 0.10, w: 0.50, h: 0.80 }, rot: -0.01, mat: 26 });
    K.slip('MACKAY', 960, 830, eob(seg(lt, 0.6, 0.95)), -0.02, 40);
  } });
  cue(0.1, 'whoosh'); cue(0.65, 'pop', { gain: 0.6 });

  // ── 7 · what they did ──
  add({ id: 'S29', at: at(70), cam: [960, 470], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(29);
    K.slip('THE PART THAT GETS LEFT OUT', 960, 400, eob(seg(lt, 0.1, 0.5)), -0.02, 46);
  } });
  cue(0.1, 'whoosh');

  add({ id: 'S30', at: at(72), cam: [960, 480], zoom: 0.05, hold: [2.6, 99], draw(lt, d, t) {
    K.parchment(30);
    crescent(620, 430, 90 * eob(seg(lt, 0.1, 0.4)));
    crossShape(960, 470, eob(seg(lt, 0.4, 0.7)));
    crossShape(1300, 470, eob(seg(lt, 0.7, 1.0)), P.royal);
    if (lt > 1.1) K.label('THREE FAITHS IN ONE COURT', 960, 780, 34);
  } });
  cue(0.1, 'whoosh'); for (let i = 0; i < 3; i++) cue(0.15 + i * 0.3, 'pop', { gain: 0.45 });

  add({ id: 'S31', at: at(77), cam: [960, 470], zoom: 0.05, hold: [2.2, 99], draw(lt, d, t) {
    K.parchment(31);
    cut(P_rr(-300, 760, W + 600, 400, 0), '#CDB98E', { shadow: 0, edge: 0 });
    const p = eob(seg(lt, 0.1, 0.5));
    if (p > 0) { ctx.save(); ctx.translate(960, 470); ctx.scale(p, p); press(960, 620, 1.0); ctx.restore(); }
    const s = eob(seg(lt, 1.1, 1.45)); if (s > 0) K.slip('THE PRINTING PRESS', 960, 840, s, -0.01, 38);
  } });
  cue(0.1, 'whoosh'); cue(1.15, 'pop', { gain: 0.6 });

  add({ id: 'S32', at: at(79), cam: [960, 480], zoom: 0.05, hold: [2.0, 99], draw(lt, d, t) {
    K.parchment(32);
    K.photoCard(IMG.mackayBook, 960, 470, 900, { crop: { x: 0.02, y: 0.03, w: 0.46, h: 0.9 }, rot: 0.01, mat: 26 });
  } });
  cue(0.1, 'whoosh');

  add({ id: 'S33', at: at(81), cam: [960, 470], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(33);
    gear(620, 430, eob(seg(lt, 0.1, 0.45)) * 0.9);
    iconBook(960, 430, eob(seg(lt, 0.45, 0.8)) * 1.1, true);
    iconHelmet(1300, 420, eob(seg(lt, 0.8, 1.1)) * 0.9);
    if (lt > 1.0) K.slip('MENDED · BUILT · TAUGHT', 960, 720, 1, -0.01, 38);
  } });
  cue(0.1, 'whoosh'); for (let i = 0; i < 3; i++) cue(0.15 + i * 0.33, 'pop', { gain: 0.4 });

  add({ id: 'S34', at: at(83), cam: [960, 470], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(34);
    K.slip('LUGANDA', 960, 300, eob(seg(lt, 0.1, 0.45)), -0.02, 56);
    for (let i = 0; i < 5; i++) line([[600, 470 + i * 50], [1320, 470 + i * 50]], 'rgba(62,44,30,0.35)', 6);
    const s = eob(seg(lt, 0.7, 1.05)); if (s > 0) K.slip('PUT INTO WRITING', 960, 760, s, 0.01, 38);
  } });
  cue(0.1, 'whoosh'); cue(0.75, 'pop', { gain: 0.5 });

  // ── 8 · the door ──
  add({ id: 'S35', at: at(85), cam: [960, 470], zoom: 0.05, hold: [2.0, 99], draw(lt, d, t) {
    K.parchment(35);
    doorPaper(eo(seg(lt, 0.2, 1.6)));
    K.slip('AN INVITATION', 960, 120, eob(seg(lt, 0.9, 1.2)), -0.01, 42);
  } });
  cue(0.1, 'whoosh'); cue(0.25, 'slide', { dur: 1.2, gain: 0.6 }); cue(0.95, 'pop', { gain: 0.5 });

  add({ id: 'S36', at: at(87), cam: [960, 470], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(36);
    K.figure({ x: 760, y: 800, h: 400, role: 'scholar', dir: 1 });
    K.figure({ x: 1160, y: 800, h: 400, role: 'guard', dir: -1 });
    crossShape(960, 330, eob(seg(lt, 0.6, 0.9)), P.royal);
    const s = eob(seg(lt, 1.0, 1.3)); if (s > 0) K.slip('THE WHITE FATHERS', 960, 880, s, 0.01, 38);
  } });
  cue(0.1, 'whoosh'); cue(0.65, 'pop', { gain: 0.5 }); cue(1.05, 'pop', { gain: 0.5 });

  add({ id: 'S37', at: at(89), cam: [960, 470], zoom: 0.05, hold: [2.0, 99], draw(lt, d, t) {
    K.parchment(37);
    crescent(620, 430, 86, P.royal);
    crossShape(960, 470, 1, P.wine);
    crossShape(1300, 470, 1, P.royal);
    K.label('ISLAM · PROTESTANT · CATHOLIC', 960, 760, 32);
  } });
  cue(0.1, 'whoosh');

  add({ id: 'S38', at: at(93), cam: [960, 470], zoom: 0.04, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(38);
    K.photoCard(IMG.muteesaCourt, 960, 470, 1000, { rot: 0.008, mat: 26 });
    const s = eob(seg(lt, 0.6, 0.95)); if (s > 0) K.slip('"YOU ARE A MAN."', 960, 830, s, -0.01, 36);
  } });
  cue(0.1, 'whoosh'); cue(0.65, 'pop', { gain: 0.6 });

  add({ id: 'S39', at: at(94), cam: [960, 470], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(39);
    K.photoCard(IMG.monument, 960, 450, 420, { crop: { x: 0.05, y: 0.05, w: 0.9, h: 0.75 }, rot: -0.01, mat: 26 });
    K.ribbon('1884', 960, 800, eob(seg(lt, 0.5, 0.85)), 64);
  } });
  cue(0.1, 'whoosh'); cue(0.55, 'pop', { gain: 0.6 });

  add({ id: 'S40', at: at(96), cam: [960, 470], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(40);
    cut(P_rr(-300, 780, W + 600, 400, 0), '#CDB98E', { shadow: 0, edge: 0 });
    K.figure({ x: 760, y: 820, h: 460, role: 'king', dir: 1 });
    K.figure({ x: 1180, y: 820, h: 430, role: 'scholar', dir: -1 });
    const s = eob(seg(lt, 0.7, 1.05)); if (s > 0) K.slip('MWANGA', 1180, 260, s, 0.02, 46);
  } });
  cue(0.1, 'whoosh'); cue(0.75, 'pop', { gain: 0.5 });

  add({ id: 'S41', at: at(97), cam: [960, 470], zoom: 0.05, hold: [2.2, 99], draw(lt, d, t) {
    lakePage(41); lake(900, 500, 340, 210, 7.3);
    const p = eo(seg(lt, 0.2, 2.0));
    ctx.save(); ctx.globalAlpha = 0.45 * p; ctx.fillStyle = P.crimson;
    ctx.fillRect(80, 90, 1760 * p, 760); ctx.restore();
    if (lt > 1.2) K.label('A PROTECTORATE', 960, 760, 40);
  } });
  cue(0.2, 'whoosh'); cue(1.25, 'pop', { gain: 0.5 });

  add({ id: 'S42', at: at(100), cam: [960, 470], zoom: 0.05, hold: [1.8, 99], draw(lt, d, t) {
    K.parchment(42);
    doorPaper(1 - eo(seg(lt, 0.2, 1.6)));
    K.slip('WHAT CAME WITH THEM', 960, 120, eob(seg(lt, 0.9, 1.2)), -0.01, 38);
  } });
  cue(0.1, 'whoosh'); cue(0.25, 'slide', { dur: 1.2, gain: 0.5 }); cue(0.95, 'pop', { gain: 0.5 });

  // ── 9 · close ──
  add({ id: 'S43', at: at(101), cam: [960, 480], zoom: 0.05, hold: [2.0, 99], draw(lt, d, t) {
    K.parchment(43);
    K.photoCard(IMG.letter, 900, 430, 700, { crop: { x: 0.02, y: 0.0, w: 0.9, h: 1.0 }, rot: -0.015, mat: 24 });
    const s = eob(seg(lt, 0.6, 0.95)); if (s > 0) { ctx.save(); ctx.globalAlpha = clamp(s * 1.4); K.seal(1360, 680, 0.85, 'M'); ctx.restore(); }
  } });
  cue(0.1, 'whoosh'); cue(0.65, 'pop', { gain: 0.6 });

  add({ id: 'S44', at: at(102), cam: [960, 460], zoom: 0.06, hold: [1.4, 99], draw(lt, d, t) {
    K.parchment(44);
    K.photoCard(IMG.muteesaPortrait, 960, 400, 340, { rot: 0.01, mat: 30 });
    K.ribbon('MUTEESA I', 960, 790, eob(seg(lt, 0.6, 0.95)), 56);
  } });
  cue(0.1, 'whoosh'); cue(0.65, 'pop', { gain: 0.6 });

  add({ id: 'S45', at: at(104), cam: [960, 470], zoom: 0.05, hold: [2.6, 99], draw(lt, d, t) {
    K.parchment(45);
    globe(960, 420, 260, eob(seg(lt, 0.1, 0.7)));
    const s = eob(seg(lt, 0.9, 1.25)); if (s > 0) K.slip('STILL BEING ASKED', 960, 780, s, -0.01, 44);
  } });
  cue(0.1, 'whoosh'); cue(0.95, 'pop', { gain: 0.6 });

  return { shots: S, cues: CUES };
}
