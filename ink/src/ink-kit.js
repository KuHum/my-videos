/* STICKMAN (INK) style kit — warm paper, tapered ink strokes, draw-on reveals,
   skeleton figures in silhouette. Canvas 2D, deterministic.
   Type: Montserrat 800 is bundled locally (Caveat is not installed on this
   offline machine); hand-lettering is approximated with tight tracking and an
   ink underline, and never falls back at render time. */
(function () {
  const K = (window.K = {});
  K.W = 1920;
  K.H = 1080;
  K.C = {
    paper: "#F4EFE4",
    paperEdge: "#E6DCCA",
    ink: "#1E1E1E",
    graphite: "#6B6B6B",
    red: "#C8452E",
    blue: "#2F5D8A",
    wash: "#F2C94C",
    white: "#FBF7EE",
  };

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  K.clamp01 = clamp01;
  K.lerp = (a, b, t) => a + (b - a) * t;
  K.ease = (t) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  K.easeOut = (t) => { t = clamp01(t); return 1 - Math.pow(1 - t, 3); };
  K.easeIn = (t) => { t = clamp01(t); return t * t * t; };
  K.soft = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
  K.seq = (t, a, b) => clamp01((t - a) / (b - a || 0.001));
  K.rng = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
  K.mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

  /* run fn in screen space (counter the camera) */
  K.screen = function (ctx, fn) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    fn();
    ctx.restore();
  };

  /* ---------- paper ---------- */
  const grainTile = (() => {
    let t = null;
    return () => {
      if (t) return t;
      t = K.mk(256, 256);
      const g = t.getContext("2d");
      const img = g.createImageData(256, 256);
      const r = K.rng(31);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 150 + r() * 90;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 10 + r() * 22;
      }
      g.putImageData(img, 0, 0);
      return t;
    };
  })();

  K.paper = function (ctx) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = K.C.paper;
    ctx.fillRect(0, 0, K.W, K.H);
    ctx.restore();
  };
  K.grain = function (ctx, alpha, ox, oy) {
    const p = ctx.createPattern(grainTile(), "repeat");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha == null ? 0.55 : alpha;
    ctx.globalCompositeOperation = "multiply";
    ctx.translate(ox || 0, oy || 0);
    ctx.fillStyle = p;
    ctx.fillRect(-(ox || 0), -(oy || 0), K.W, K.H);
    ctx.restore();
  };

  /* ---------- camera ---------- */
  K.cam = function (ctx, c) {
    c = c || {};
    const z = c.z == null ? 1 : c.z;
    ctx.translate(K.W / 2, K.H / 2);
    ctx.scale(z, z);
    ctx.translate(-K.W / 2 - (c.x || 0), -K.H / 2 - (c.y || 0));
  };

  /* ---------- stroke model ---------- */
  // pts: [[x,y], [x,y], ...] or [[x,y,w], ...]. Width tapers at both ends.
  function length(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  }
  K.length = length;

  K.stroke = function (ctx, pts, o) {
    o = o || {};
    if (!pts || pts.length < 2) return;
    const rev = o.rev == null ? 1 : clamp01(o.rev);
    if (rev <= 0.001) return;
    const total = length(pts);
    if (total < 0.5) return;
    const w0 = o.w || 4;
    const col = o.color || K.C.ink;
    let remain = total * rev;
    ctx.save();
    ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha);
    ctx.strokeStyle = col;
    ctx.lineCap = o.cap || "round";
    ctx.lineJoin = "round";
    for (let i = 1; i < pts.length && remain > 0.01; i++) {
      const a = pts[i - 1], b = pts[i];
      const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (seg < 0.01) continue;
      const use = Math.min(seg, remain);
      const u0 = 1 - remain / seg; // 0..1 start within this segment (clamped below)
      const t0 = Math.max(0, Math.min(1, 1 - remain / seg));
      const t1 = Math.min(1, t0 + use / seg);
      const x1 = a[0] + (b[0] - a[0]) * t0, y1 = a[1] + (b[1] - a[1]) * t0;
      const x2 = a[0] + (b[0] - a[0]) * t1, y2 = a[1] + (b[1] - a[1]) * t1;
      // width from per-point values when present, else taper by position along the whole stroke
      const pa = a[2] == null ? w0 : a[2], pb = b[2] == null ? w0 : b[2];
      const base = (pa + pb) / 2;
      const along = (t0 + t1) / 2;
      const taper = Math.min(1, (along / 0.12) * 1.0) * Math.min(1, ((1 - along) / 0.1) * 1.0);
      const w = base * (0.55 + 0.45 * taper);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = Math.max(0.6, w);
      ctx.stroke();
      remain -= use;
      void u0;
    }
    ctx.restore();
  };

  K.line = function (ctx, x1, y1, x2, y2, o) {
    o = o || {};
    // a light hand-wobble on the midpoint keeps long straights alive
    const s = o.seed == null ? 0 : o.seed;
    const nx = -(y2 - y1), ny = x2 - x1;
    const n = Math.hypot(nx, ny) || 1;
    const amp = o.wobble == null ? 1.1 : o.wobble;
    const bow = ((K.rng(s + 7)() - 0.5) * 2) * amp;
    const mx = (x1 + x2) / 2 + (nx / n) * bow, my = (y1 + y2) / 2 + (ny / n) * bow;
    K.stroke(ctx, [[x1, y1], [mx, my], [x2, y2]], o);
  };

  K.curve = function (ctx, pts, o) {
    o = o || {};
    if (pts.length < 2) return;
    const sm = [];
    sm.push(pts[0]);
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1], b = pts[i], c = pts[i + 1];
      sm.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
      sm.push([b[0], b[1]]);
      sm.push([(b[0] + c[0]) / 2, (b[1] + c[1]) / 2]);
    }
    sm.push(pts[pts.length - 1]);
    const out = [sm[0]];
    for (let i = 1; i < sm.length; i++) {
      const a = out[out.length - 1], b = sm[i];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.5) out.push(b);
    }
    K.stroke(ctx, out, o);
  };

  K.inkCircle = function (ctx, x, y, r, o) {
    o = o || {};
    const seed = o.seed == null ? 3 : o.seed;
    const wob = o.wobble == null ? 0.9 : o.wobble;
    const rnd = K.rng(seed * 97 + 13);
    const start = -0.7 + rnd() * 0.5;
    const turns = 1.06 + rnd() * 0.07; // slightly overshoot so the ends cross
    const pts = [];
    const N = 34;
    for (let i = 0; i <= N; i++) {
      const a = start + turns * Math.PI * 2 * (i / N);
      const rr = r * (1 + (rnd() - 0.5) * 0.02 * wob);
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * (1 + (o.flat || 0))]);
    }
    K.stroke(ctx, pts, Object.assign({}, o, { rev: o.rev }));
  };

  K.inkEllipse = function (ctx, x, y, rx, ry, o) {
    o = o || {};
    const seed = o.seed == null ? 5 : o.seed;
    const rnd = K.rng(seed * 131 + 7);
    const start = -2.2 + rnd() * 0.4;
    const pts = [];
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const a = start + (Math.PI * 2 * 1.05) * (i / N);
      pts.push([x + Math.cos(a) * rx * (1 + (rnd() - 0.5) * 0.012), y + Math.sin(a) * ry * (1 + (rnd() - 0.5) * 0.012)]);
    }
    K.stroke(ctx, pts, o);
  };

  K.box = function (ctx, x, y, w, h, o) {
    o = o || {};
    const seed = o.seed == null ? 9 : o.seed;
    const pts = [[x, y], [x + w, y + (K.rng(seed)() - 0.5) * 4], [x + w + (K.rng(seed + 1)() - 0.5) * 3, y + h], [x + (K.rng(seed + 2)() - 0.5) * 4, y + h], [x, y]];
    K.stroke(ctx, pts, o);
  };

  K.arrow = function (ctx, x1, y1, x2, y2, o) {
    o = o || {};
    const rev = o.rev == null ? 1 : clamp01(o.rev);
    if (rev <= 0.001) return;
    const bend = o.bend == null ? 46 : o.bend;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - bend;
    const shaft = [];
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = (1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * mx + u * u * x2;
      const y = (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * my + u * u * y2;
      shaft.push([x, y]);
    }
    K.stroke(ctx, shaft, Object.assign({}, o, { rev }));
    if (rev > 0.82) {
      const hr = clamp01((rev - 0.82) / 0.18);
      const ang = Math.atan2(y2 - my, x2 - mx);
      const s = o.head || 17;
      for (const d of [-0.45, 0.45]) {
        const hx = x2 - Math.cos(ang + d) * s, hy = y2 - Math.sin(ang + d) * s;
        K.stroke(ctx, [[x2, y2], [hx, hy]], Object.assign({}, o, { rev: hr, w: o.w || 3.4 }));
      }
    }
  };

  K.highlight = function (ctx, x, y, w, h, o) {
    o = o || {};
    const rev = o.rev == null ? 1 : clamp01(o.rev);
    if (rev <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = (o.alpha == null ? 0.75 : o.alpha);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = o.color || K.C.wash;
    const top = y + (o.slant == null ? -2 : o.slant);
    ctx.beginPath();
    ctx.moveTo(x, top + h * 0.15);
    ctx.quadraticCurveTo(x + w * 0.5, top - h * 0.1, x + w * rev, top + h * 0.28);
    ctx.lineTo(x + w * rev, top + h * 0.86);
    ctx.quadraticCurveTo(x + w * 0.5, top + h * 1.02, x, top + h * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /* ---------- type ---------- */
  K.FONT = "Montserrat, system-ui, sans-serif";
  K.font = function (ctx, size, weight) {
    ctx.font = (weight || 800) + " " + size + "px " + K.FONT;
  };
  K.text = function (ctx, str, x, y, o) {
    o = o || {};
    ctx.save();
    K.font(ctx, o.size || 34, o.weight || 700);
    ctx.letterSpacing = (o.tracking == null ? 0 : o.tracking) + "px";
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = o.base || "alphabetic";
    ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
    ctx.fillStyle = o.color || K.C.ink;
    ctx.fillText(str, x, y);
    ctx.restore();
  };
  K.textWidth = function (ctx, str, size, weight, tracking) {
    ctx.save();
    K.font(ctx, size, weight || 700);
    ctx.letterSpacing = (tracking || 0) + "px";
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  };

  /* hand-lettered headline in screen space at (100,128) with an ink underline.
     lines: string or array of strings (max 2). size >= 64 (contract). */
  K.headline = function (ctx, lines, t, at, o) {
    o = o || {};
    const p = K.easeOut(K.seq(t, at, at + (o.d || 0.5)));
    if (p <= 0) return;
    const arr = Array.isArray(lines) ? lines : [lines];
    const size = o.size || 66;
    const x = o.x == null ? 100 : o.x;
    const y = o.y == null ? 128 : o.y;
    K.screen(ctx, () => {
      ctx.save();
      ctx.globalAlpha = p;
      arr.forEach((ln, i) => {
        const yy = y + i * size * 1.16;
        K.text(ctx, ln, x, yy + (1 - p) * 10, {
          size: size, weight: 800, color: o.color || K.C.ink, tracking: (o.tracking == null ? -0.5 : o.tracking), align: "left",
        });
        const w = K.textWidth(ctx, ln, size, 800, (o.tracking == null ? -0.5 : o.tracking));
        if (o.underline !== false) {
          const up = K.easeOut(K.seq(t, at + 0.18 + i * 0.1, at + 0.72 + i * 0.1));
          if (up > 0) K.stroke(ctx, [[x - 4, yy + 16], [x + (w + 14) * up, yy + 15 + 2]], { w: 5, color: o.accent || K.C.ink, rev: up, alpha: 0.9, seed: 4 });
        }
      });
      ctx.restore();
    });
  };

  /* circled keyword label (from the script), landing on its word */
  K.keyword = function (ctx, txt, x, y, t, at, o) {
    o = o || {};
    const p = K.easeOut(K.seq(t, at, at + 0.4));
    if (p <= 0) return;
    const size = o.size || 34;
    const w = K.textWidth(ctx, txt, size, 700, 0.6);
    ctx.save();
    ctx.globalAlpha = p;
    if (o.wash !== false) K.highlight(ctx, x - 8, y - size * 0.92, w + 16, size * 1.15, { alpha: 0.55 * p, rev: p, color: o.washColor || K.C.wash });
    K.text(ctx, txt, x, y, { size, weight: 800, color: o.color || K.C.ink, tracking: 0.6 });
    if (o.circle !== false) K.inkEllipse(ctx, x + w / 2, y - size * 0.34, w / 2 + 20, size * 0.86, { w: 3, color: o.ring || K.C.red, rev: K.easeOut(K.seq(t, at + 0.12, at + 0.62)), seed: (o.seed || 6) });
    ctx.restore();
    return { w, h: size };
  };

  /* light hatching for secondary matter */
  K.hatch = function (ctx, x, y, w, h, o) {
    o = o || {};
    const rev = o.rev == null ? 1 : clamp01(o.rev);
    if (rev <= 0.001) return;
    const step = o.step || 18;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.globalAlpha = (o.alpha == null ? 0.32 : o.alpha);
    const n = Math.ceil((w + h) / step);
    for (let i = 0; i < n; i++) {
      const off = i * step * rev;
      K.stroke(ctx, [[x + off, y + h], [x + off + h * 0.85, y]], { w: o.w || 1.5, color: o.color || K.C.graphite, rev: 1, alpha: 0.6 });
    }
    ctx.restore();
  };

  /* ---------- skeleton figure (ink, silhouette-readable) ---------- */
  const DEF = {
    lean: 0, headTilt: 0, headX: 0, headY: 0, bob: 0,
    armL: [-0.26, -0.14], armR: [0.26, 0.14],
    legL: [-0.07, 0.03], legR: [0.07, -0.03],
    brow: 0, mouth: 0, blink: 0,
  };
  function pose(p) { return Object.assign({}, DEF, p || {}); }
  K.pose = pose;

  function seg(x, y, a1, l1, a2, l2) {
    const jx = x + Math.sin(a1) * l1, jy = y + Math.cos(a1) * l1;
    const ex = jx + Math.sin(a1 + a2) * l2, ey = jy + Math.cos(a1 + a2) * l2;
    return { j: [jx, jy], e: [ex, ey] };
  }

  /* f: { x, y, s, pose, flip, alpha, rev, color, acc(s) }
     s = 1 -> ~300 px tall, feet on f.y. Poses read in silhouette. */
  K.figure = function (ctx, f) {
    const s = f.s == null ? 1 : f.s;
    const P = pose(f.pose);
    const rev = f.rev == null ? 1 : clamp01(f.rev);
    const ink = f.color || K.C.ink;
    const wLimb = (f.w || 6.4) * Math.max(0.55, s);
    const wBody = (f.w || 6.4) * 1.18 * Math.max(0.55, s);
    const H = 300 * s; // standing height above the feet
    const hipY = -150 * s + P.bob * s;
    const shoulderY = hipY - 78 * s;
    const lean = P.lean;

    // joint positions in local space: shoulders sit outside the torso so the
    // arms read as arms, not as a second pair of legs
    const neck = [Math.sin(lean) * 10 * s, shoulderY];
    const hip = [Math.sin(lean) * 2 * s, hipY];
    const shL = [neck[0] - 10 * s, shoulderY + 6 * s];
    const shR = [neck[0] + 10 * s, shoulderY + 6 * s];
    const armL = seg(shL[0], shL[1], P.armL[0], 56 * s, P.armL[1], 52 * s);
    const armR = seg(shR[0], shR[1], P.armR[0], 56 * s, P.armR[1], 52 * s);
    const legL = seg(hip[0] - 6 * s, hipY, P.legL[0], 76 * s, P.legL[1], 74 * s);
    const legR = seg(hip[0] + 6 * s, hipY, P.legR[0], 76 * s, P.legR[1], 74 * s);
    const headC = [neck[0] + (P.headX || 0) * s + Math.sin(lean) * 26 * s, neck[1] - 46 * s + (P.headY || 0) * s];
    const headR = 32 * s;

    const win = (a, b) => clamp01((rev - a) / (b - a || 0.001));

    ctx.save();
    ctx.globalAlpha = f.alpha == null ? 1 : f.alpha;
    ctx.translate(f.x, f.y);
    ctx.scale(f.flip ? -1 : 1, 1);

    // far arm, legs, torso, near arm, head — drawn on in reading order
    K.stroke(ctx, [shL, armL.j, armL.e], { w: wLimb * 0.86, color: ink, rev: win(0.05, 0.45), alpha: 0.85 });
    K.stroke(ctx, [[hip[0] - 6 * s, hipY], legL.j, legL.e], { w: wLimb, color: ink, rev: win(0.0, 0.38) });
    K.stroke(ctx, [[hip[0] + 6 * s, hipY], legR.j, legR.e], { w: wLimb, color: ink, rev: win(0.08, 0.46) });
    K.stroke(ctx, [[neck[0], neck[1] + 6 * s], [hip[0] + 2 * s, (neck[1] + hipY) / 2], hip], { w: wBody, color: ink, rev: win(0.22, 0.6) });
    K.stroke(ctx, [shL, shR], { w: wBody * 0.8, color: ink, rev: win(0.28, 0.55) });
    K.stroke(ctx, [shR, armR.j, armR.e], { w: wLimb * 0.86, color: ink, rev: win(0.4, 0.8) });
    K.stroke(ctx, [[neck[0], neck[1] + 8 * s], [headC[0] - headR * 0.1, headC[1] + headR * 0.8]], { w: wBody * 0.8, color: ink, rev: win(0.5, 0.72) });

    const hrev = win(0.62, 1.0);
    if (hrev > 0.001) {
      K.inkCircle(ctx, headC[0], headC[1], headR, { w: wBody * 0.85, color: ink, rev: hrev, seed: 11 });
      if (hrev > 0.75 && f.face !== false) {
        const bl = 1 - 0.9 * K.clamp01(P.blink);
        ctx.save();
        ctx.globalAlpha *= (hrev - 0.75) / 0.25;
        ctx.fillStyle = ink;
        ctx.beginPath(); ctx.arc(headC[0] - headR * 0.33, headC[1] - headR * 0.1, Math.max(0.8, headR * 0.1) * bl, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(headC[0] + headR * 0.33, headC[1] - headR * 0.1, Math.max(0.8, headR * 0.1) * bl, 0, 6.283); ctx.fill();
        // brows: positive brow = raised
        if (P.brow) {
          K.stroke(ctx, [[headC[0] - headR * 0.48, headC[1] - headR * 0.34], [headC[0] - headR * 0.18, headC[1] - headR * (0.34 + 0.16 * P.brow)]], { w: 2.4 * Math.max(0.6, s), color: ink, rev: 1 });
          K.stroke(ctx, [[headC[0] + headR * 0.18, headC[1] - headR * (0.34 + 0.16 * P.brow)], [headC[0] + headR * 0.48, headC[1] - headR * 0.34]], { w: 2.4 * Math.max(0.6, s), color: ink, rev: 1 });
        }
        // mouth: + is a smile, - is a flat/down line
        const my = headC[1] + headR * 0.42;
        const mw = headR * 0.4;
        const mm = P.mouth || 0;
        K.stroke(ctx, [[headC[0] - mw, my - mm * headR * 0.12], [headC[0], my + (mm > 0 ? headR * 0.14 : -0.02 * headR) * (mm || 1) * 0.6], [headC[0] + mw, my - mm * headR * 0.12]], { w: 2.6 * Math.max(0.6, s), color: ink, rev: 1 });
        ctx.restore();
      }
    }
    ctx.restore();

    return {
      head: { x: f.x + (f.flip ? -1 : 1) * headC[0], y: f.y + headC[1], r: headR },
      hip: { x: f.x + (f.flip ? -1 : 1) * hip[0], y: f.y + hipY },
      hands: [
        { x: f.x + (f.flip ? -1 : 1) * armL.e[0], y: f.y + armL.e[1] },
        { x: f.x + (f.flip ? -1 : 1) * armR.e[0], y: f.y + armR.e[1] },
      ],
      feet: [
        { x: f.x + (f.flip ? -1 : 1) * legL.e[0], y: f.y + legL.e[1] },
        { x: f.x + (f.flip ? -1 : 1) * legR.e[0], y: f.y + legR.e[1] },
      ],
      shoulderY: f.y + shoulderY,
      h: H,
    };
  };

  K.mixPose = function (a, b, t) {
    const u = K.ease(t);
    a = pose(a); b = pose(b);
    return {
      lean: K.lerp(a.lean, b.lean, u), headTilt: K.lerp(a.headTilt, b.headTilt, u),
      headX: K.lerp(a.headX, b.headX, u), headY: K.lerp(a.headY, b.headY, u), bob: K.lerp(a.bob, b.bob, u),
      armL: [K.lerp(a.armL[0], b.armL[0], u), K.lerp(a.armL[1], b.armL[1], u)],
      armR: [K.lerp(a.armR[0], b.armR[0], u), K.lerp(a.armR[1], b.armR[1], u)],
      legL: [K.lerp(a.legL[0], b.legL[0], u), K.lerp(a.legL[1], b.legL[1], u)],
      legR: [K.lerp(a.legR[0], b.legR[0], u), K.lerp(a.legR[1], b.legR[1], u)],
      brow: K.lerp(a.brow, b.brow, u), mouth: K.lerp(a.mouth, b.mouth, u), blink: K.lerp(a.blink, b.blink, u),
    };
  };

  /* named poses writers can spread on top of the defaults */
  K.POSE = {
    stand: {},
    point: { armR: [1.15, 0.1], headX: 3 },
    pointLeft: { armL: [-1.1, -0.1], headX: -3 },
    carry: { armL: [-0.55, -1.25], armR: [0.55, 1.25] },
    think: { armR: [0.35, 1.9], headX: -2, brow: 0.4 },
    slump: { lean: 0.12, headY: 6, brow: -0.5, mouth: -1, armL: [-0.1, -0.05], armR: [0.1, 0.05] },
    open: { armL: [-0.9, -0.5], armR: [0.9, 0.5] },
    reach: { armR: [0.9, 0.15], lean: -0.04 },
    walk: { legL: [-0.28, 0.2], legR: [0.24, -0.16], armL: [0.24, 0.14], armR: [-0.22, -0.12] },
    prayer: { armL: [-0.35, -1.8], armR: [0.35, 1.8], headY: 2 },
    sit: { bob: -34, legL: [-1.15, 1.3], legR: [-1.05, 1.35], lean: 0.05 },
  };


  /* a grid of tiny marks (1000-figure beats) drawn in one path, revealed by rev */
  K.ticks = function (ctx, x0, y0, cols, rows, pitch, len, o) {
    o = o || {};
    const rev = o.rev == null ? 1 : clamp01(o.rev);
    if (rev <= 0.001) return;
    const total = cols * rows, upto = Math.min(total, Math.ceil(total * rev));
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.strokeStyle = o.color || K.C.ink;
    ctx.lineWidth = o.w || 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < upto; i++) {
      const cx = x0 + (i % cols) * pitch, cy = y0 + Math.floor(i / cols) * pitch;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + len, cy - len);
    }
    ctx.stroke();
    ctx.restore();
  };

  /* ---------- prop helpers ---------- */
  K.washUnderline = function (ctx, x, y, w, t, at, o) {
    o = o || {};
    const p = K.easeOut(K.seq(t, at, at + 0.45));
    if (p <= 0) return;
    K.highlight(ctx, x, y - 10, w, 18, { alpha: 0.7, rev: p });
  };
})();
