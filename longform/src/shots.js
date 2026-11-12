// GOVERNMENT SHUTDOWN: EXPLAINED — opening chapter (16:9 landscape, Paper Atlas look). Everything is cut paper.
import { ctx, W, H, TAU, clamp, lerp, seg, eo, eio, eob, rnd, rr, circle, ell, line } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';
const { P, cut, P_rr, P_poly, P_circ } = K;

// ── set pieces (cut paper) ──
/** the US Capitol: steps, wings, columned front, a real dome and a gold lantern */
function capitol(x, y, s, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  cut(P_rr(-520, -34, 1040, 34, 5), P.stoneDark, { shadow: 0.6, edge: 5 });
  cut(P_rr(-470, -210, 940, 180, 4), P.stone, { shadow: 0.9, edge: 6 });
  // wings
  cut(P_rr(-470, -318, 290, 112, 4), P.stone, { shadow: 0.75, edge: 5 });
  cut(P_rr(180, -318, 290, 112, 4), P.stone, { shadow: 0.75, edge: 5 });
  for (let i = 0; i < 5; i++) for (const wx of [-400 + i * 58, 262 + i * 58]) { rr(wx - 12, -296, 24, 34, 3); ctx.fillStyle = i % 2 ? 'rgba(200,149,47,0.8)' : P.ink; ctx.fill(); }
  // central portico
  cut(P_rr(-200, -330, 400, 130, 4), P.stone, { shadow: 0.8, edge: 5 });
  cut(P_poly([[-215, -330], [0, -445], [215, -330]]), P.stone, { shadow: 0.8, edge: 5 });
  // columns along the front
  for (let i = 0; i < 11; i++) { const cx = -420 + i * 84; if (cx > -215 && cx < 215) continue; cut(P_rr(cx - 10, -212, 20, 176, 8), P.edge, { shadow: 0.3, edge: 3 }); }
  for (let i = 0; i < 5; i++) cut(P_rr(-170 + i * 85 - 9, -325, 18, 122, 8), P.edge, { shadow: 0.3, edge: 3 });
  // drum + dome
  cut(P_rr(-140, -520, 280, 90, 4), P.stoneDark, { shadow: 0.8, edge: 5 });
  cut(() => { ctx.beginPath(); ctx.ellipse(0, -520, 142, 132, 0, Math.PI, TAU); ctx.closePath(); }, P.stone, { shadow: 0.85, edge: 5 });
  cut(P_rr(-34, -700, 68, 74, 4), P.stoneDark, { shadow: 0.5, edge: 4 });
  cut(P_circ(0, -708, 26), P.gold, { shadow: 0.6, edge: 4 });
  for (let i = 0; i < 8; i++) { const a = Math.PI + (i + 0.5) / 8 * Math.PI; line([[Math.cos(a) * 100, -520 + Math.sin(a) * 96], [Math.cos(a) * 138, -520 + Math.sin(a) * 128]], 'rgba(62,44,30,0.28)', 3); }
  ctx.restore();
}

/** a federal building; lit 0..1 = windows on */
function block(x, y, w, h, lit, seed = 0) {
  cut(P_rr(x - w / 2, y - h, w, h, 3), lit > 0.45 ? P.stone : '#A2947A', { shadow: 0.65, edge: 5 });
  cut(P_poly([[x - w / 2 - 16, y - h], [x, y - h - 44], [x + w / 2 + 16, y - h]]), lit > 0.45 ? P.stoneDark : '#8E816B', { shadow: 0.6, edge: 5 });
  const cols = Math.max(3, Math.round(w / 46)), rows = Math.max(2, Math.round(h / 52));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const wx = x - w / 2 + 22 + c * ((w - 44) / (cols - 1)), wy = y - h + 30 + r * ((h - 52) / (rows - 1));
    rr(wx - 10, wy - 13, 20, 26, 3);
    ctx.fillStyle = lit > 0.45 ? `rgba(200,149,47,${0.45 + 0.55 * lit})` : (rnd(c * 7 + r * 3 + seed) > 0.75 ? 'rgba(62,44,30,0.5)' : P.ink);
    ctx.fill();
  }
}

/** a paper desk with an open envelope */
function desk(y = 800) {
  cut(P_rr(240, y, 1440, 46, 6), P.sepia, { shadow: 0.8, edge: 5 });
  cut(P_rr(300, y + 46, 40, 190, 4), P.ink, { shadow: 0.6, edge: 4 });
  cut(P_rr(1580, y + 46, 40, 190, 4), P.ink, { shadow: 0.6, edge: 4 });
}

export function buildShots() {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut_ = (i) => (i === 0 ? 0 : L(i) - 0.08);

  // 1 · October 1: the money runs out
  { const st = cut_(0), mny = Wd('money', 0) - st;
    add({ id: 'S01', at: st, cam: [960, 560], zoom: 0.05, hold: [3.15, 99], note: 'Capitol, OCTOBER 1 ribbon, a coin tips and falls', draw(lt, d, t) {
      K.parchment(1);
      cut(P_rr(-300, 830, W + 600, 600, 0), '#CDB98E', { shadow: 0, edge: 0 });
      capitol(1200, 830, 0.92, t);
      K.ribbon('OCTOBER 1', 520, 300, eob(seg(lt, 0.08, 0.45)), 84);
      K.slip('FISCAL YEAR BEGINS', 520, 445, eob(seg(lt, 0.3, 0.55)), 0.02, 40);
      // a gold coin tips over and drops out of frame as "money" lands
      const fall = seg(lt, Math.max(0, mny), Math.max(0, mny) + 0.7);
      const cx = 440, cy = 640 + eo(fall) * 330, rot = eo(fall) * 1.35;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
      cut(P_circ(0, 0, 72), P.gold, { shadow: 0.7, edge: 5 });
      ctx.font = '700 86px Caladea'; ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 8);
      ctx.restore();
    } });
    cue(st + 0.1, 'whoosh'); cue(st + 0.2, 'pop', { gain: 0.6 }); cue(st + Math.max(0, mny), 'plop', { gain: 0.7 }); }

  // 2 · not all of it: some departments go dark
  { const st = cut_(1);
    add({ id: 'S02', at: st, cam: [960, 470], zoom: 0.06, hold: [1.8, 99], note: 'federal buildings, windows go dark one row at a time', draw(lt, d, t) {
      K.parchment(2);
      const rows = [300, 480, 660], cols = 7, keep = new Set([3, 11, 17]);
      let k = 0;
      rows.forEach((y, ri) => {
        for (let c = 0; c < cols; c++) {
          const x = 300 + c * 220, id = ri * cols + c;
          const off = keep.has(id) ? 1 : clamp((lt - 0.15 - k * 0.06) * 3.4);
          block(x, y, 178, 132 + ((id * 37) % 3) * 26, 1 - off, id * 13);
          if (off > 0.55) { ctx.save(); ctx.globalAlpha = clamp((off - 0.55) * 3); ctx.translate(x, y - 70); ctx.rotate(-0.12); ctx.font = '700 38px Caladea'; ctx.fillStyle = P.crimson; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CLOSED', 0, 0); ctx.restore(); }
          k++;
        }
      });
      K.slip('NOT ALL OF IT', 960, 810, eob(seg(lt, 0.55, 0.8)), -0.02, 38);
    } });
    cue(st + 0.05, 'whoosh'); for (let i = 0; i < 9; i++) cue(st + 0.25 + i * 0.22, 'tock', { gain: 0.28 }); cue(st + 0.55, 'pop', { gain: 0.5 }); }

  // 3 · hundreds of thousands sent home
  { const st = cut_(2);
    add({ id: 'S03', at: st, cam: [960, 500], zoom: 0.05, note: 'rows of paper federal workers walk out and fade', draw(lt, d, t) {
      K.parchment(3);
      cut(P_rr(-300, 766, W + 600, 600, 0), '#CDB98E', { shadow: 0, edge: 0 });
      const rows = [[330, 250, 1], [560, 220, -1], [760, 200, 1]];
      rows.forEach(([y, h, dir], ri) => {
        for (let c = 0; c < 9; c++) {
          const x0 = 250 + c * 190 + (ri % 2) * 40;
          const go = clamp((lt - 0.2 - ri * 0.18 - c * 0.035) * 1.7);
          const x = x0 + dir * go * 300, a = 1 - go;
          if (a <= 0.02) continue;
          ctx.save(); ctx.globalAlpha = a;
          K.figure({ x, y, h, role: 'worker', dir: dir < 0 ? -1 : 1, walk: go * 26 + c });
          ctx.restore();
        }
      });
      K.slip('FURLOUGHED', 960, 180, eob(seg(lt, 0.45, 0.7)), -0.02, 42);
    } });
    cue(st + 0.05, 'whoosh'); cue(st + 0.2, 'slide', { dur: 2.2, gain: 0.6 }); cue(st + 0.45, 'pop', { gain: 0.5 }); }

  // 4 · still working, for no pay
  { const st = cut_(3), d4 = cut_(4) - st;
    add({ id: 'S04', at: st, cam: [960, 520], zoom: 0.06, hold: [2.0, 99], note: 'a worker at a desk, an empty pay envelope, NO PAY seal', draw(lt, d, t) {
      K.parchment(4);
      cut(P_rr(-300, 760, W + 600, 640, 0), '#CDB98E', { shadow: 0, edge: 0 });
      K.figure({ x: 700, y: 900, h: 460, role: 'scholar', dir: 1, arm: 22 });
      desk(760);
      // envelope
      ctx.save(); ctx.translate(1120, 690); ctx.rotate(-0.04);
      cut(P_poly([[-150, -90], [150, -90], [150, 60], [-150, 60]]), P.edge, { shadow: 0.8, edge: 5 });
      cut(P_poly([[-150, -90], [0, 10], [150, -90]]), '#EFE4C8', { shadow: 0.4, edge: 4 });
      ctx.font = '700 58px Caladea'; ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$0', 0, 30);
      ctx.restore();
      // crimson NO PAY seal stamps down on the envelope
      const stamp = eob(seg(lt, d * 0.55, d * 0.55 + 0.35));
      if (stamp > 0) { ctx.save(); ctx.globalAlpha = clamp(stamp * 1.6); K.seal(1120, 690, 1.15 * (0.6 + 0.4 * stamp), '✕'); ctx.restore(); }
      if (lt < d * 0.55) K.slip('STILL WORKING', 960, 190, eob(seg(lt, 0.1, 0.35)), -0.02, 40);
    } });
    cue(st + 0.05, 'whoosh'); cue(st + 0.1, 'pop', { gain: 0.5 }); cue(st + d4 * 0.55, 'thud', { gain: 0.55 }); }

  // 5 · every day it lasted, the bill grew
  { const st = cut_(4);
    add({ id: 'S05', at: st, cam: [960, 520], zoom: 0.07, note: 'a stack of paper bills grows taller; crimson arrow up', draw(lt, d, t) {
      K.parchment(5);
      cut(P_rr(-300, 780, W + 600, 620, 0), '#CDB98E', { shadow: 0, edge: 0 });
      const n = 3 + Math.floor(clamp(lt / d) * 13);
      for (let i = 0; i < n; i++) {
        const y = 770 - i * 44, xo = (rnd(i) - 0.5) * 26, rot = (rnd(i + 9) - 0.5) * 0.05;
        ctx.save(); ctx.translate(900 + xo, y); ctx.rotate(rot);
        cut(P_rr(-170, -40, 340, 44, 4), i % 2 ? '#EFE4C8' : P.edge, { shadow: 0.5, edge: 4 });
        ctx.font = '700 30px Caladea'; ctx.fillStyle = P.ink; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('$', 150, 0);
        ctx.restore();
      }
      // crimson arrow climbing to the right
      const up = eo(clamp((lt - 0.4) / Math.max(0.6, d - 0.4)));
      if (up > 0) {
        const x = 1420, y0 = 760, y1 = 760 - 480 * up;
        ctx.save(); ctx.strokeStyle = P.crimson; ctx.lineWidth = 18; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
        cut(P_poly([[x - 46, y1 + 50], [x + 46, y1 + 50], [x, y1 - 40]]), P.crimson, { shadow: 0.6, edge: 4 });
        ctx.restore();
      }
      K.slip('THE BILL', 960, 180, eob(seg(lt, 0.1, 0.35)), -0.02, 42);
    } });
    cue(st + 0.05, 'whoosh'); cue(st + 0.1, 'pop', { gain: 0.5 }); for (let i = 0; i < 6; i++) cue(st + 0.4 + i * 0.3, 'plop', { gain: 0.25 }); }

  return { shots: S, cues: CUES };
}
