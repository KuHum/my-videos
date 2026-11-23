/* THE AI GARAGE — Cinematic Stickman style kit (Canvas 2D) */
(function () {
  const K = (window.K = {});
  K.W = 1920;
  K.H = 1080;
  K.C = {
    bgTop: "#0F1B2D", bgBot: "#16263B", shadow: "#0A1220", slate: "#2A3A50",
    amber: "#F2B25C", coral: "#E8603C", violet: "#8B6CF0", teal: "#2FB7A8",
    mustard: "#E8B04B", ink: "#0B111B", cyan: "#4FD8F0", white: "#EAF2F8",
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
  K.rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  K.circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); };
  K.line = (ctx, x1, y1, x2, y2, w, color, cap) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = cap || "round"; ctx.stroke();
  };

  /* ---------- cached light sprites ---------- */
  const bloomCache = new Map();
  K.bloomSprite = function (color, size) {
    const key = color + "|" + size;
    let c = bloomCache.get(key);
    if (c) return c;
    c = K.mk(size, size);
    const g = c.getContext("2d");
    const r = size / 2;
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, color);
    grd.addColorStop(0.35, color);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = 1;
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    bloomCache.set(key, c);
    return c;
  };
  K.glow = function (ctx, x, y, radius, color, alpha) {
    const size = 256;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.drawImage(K.bloomSprite(color, size), x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  };

  const vig = (() => {
    let c = null;
    return () => {
      if (c) return c;
      c = K.mk(1920, 1080);
      const g = c.getContext("2d");
      const grd = g.createRadialGradient(960, 520, 320, 960, 520, 1250);
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(0.62, "rgba(0,0,0,0.18)");
      grd.addColorStop(1, "rgba(0,0,0,0.62)");
      g.fillStyle = grd;
      g.fillRect(0, 0, 1920, 1080);
      return c;
    };
  })();
  K.vignette = function (ctx, alpha) {
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.drawImage(vig(), 0, 0, 1920, 1080); ctx.restore();
  };

  /* ---------- set primitives ---------- */
  K.room = function (ctx, o) {
    o = o || {};
    const top = o.top || K.C.bgTop, bot = o.bot || K.C.bgBot;
    const g = ctx.createLinearGradient(0, 0, 0, 1080);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(-40, -40, 2000, 1160);
    if (o.floorY) {
      ctx.fillStyle = o.floor || "#0C1624";
      ctx.fillRect(-40, o.floorY, 2000, 1160 - o.floorY);
      // floor sheen
      const fg = ctx.createLinearGradient(0, o.floorY, 0, 1080);
      fg.addColorStop(0, "rgba(79,216,240,0.06)");
      fg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fg; ctx.fillRect(-40, o.floorY, 2000, 1080 - o.floorY);
      ctx.fillStyle = "rgba(10,18,32,0.9)";
      ctx.fillRect(-40, o.floorY - 3, 2000, 3);
    }
  };
  K.wallPanel = function (ctx, x, y, w, h, color, alpha) {
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color; ctx.fillRect(x, y, w, h); ctx.restore();
  };
  K.dust = function (ctx, t, seed, n, area) {
    const r = K.rng(seed);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i++) {
      const bx = r() * 1920, by = r() * 1080, spd = 6 + r() * 16, ph = r() * 6.28, sz = 1 + r() * 2.2;
      const x = (bx + Math.sin(t * 0.25 + ph) * 26 + t * spd * 0.25) % 1980;
      const y = (by - t * spd + Math.cos(t * 0.2 + ph) * 14 + 1080) % 1080;
      ctx.globalAlpha = 0.10 + 0.16 * (0.5 + 0.5 * Math.sin(t * 0.9 + ph));
      ctx.fillStyle = K.C.cyan;
      ctx.beginPath(); ctx.arc(x, y, sz, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  };

  /* ---------- type ---------- */
  K.setFont = function (ctx, size, weight) {
    ctx.font = (weight || 800) + " " + size + "px Montserrat, system-ui, sans-serif";
  };
  K.text = function (ctx, str, x, y, o) {
    o = o || {};
    ctx.save();
    K.setFont(ctx, o.size || 56, o.weight || 800);
    ctx.letterSpacing = (o.tracking || 0) + "px";
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = o.base || "alphabetic";
    ctx.globalAlpha = ctx.globalAlpha * (o.alpha == null ? 1 : o.alpha);
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur || 26; }
    if (o.shadow) { ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3; }
    ctx.fillStyle = o.color || K.C.white;
    ctx.fillText(str, x, y);
    ctx.restore();
  };
  K.textWidth = function (ctx, str, size, weight, tracking) {
    ctx.save(); K.setFont(ctx, size, weight); ctx.letterSpacing = (tracking || 0) + "px";
    const w = ctx.measureText(str).width; ctx.restore(); return w;
  };

  /* ---------- infographic ---------- */
  K.badge = function (ctx, x, y, label, o) {
    o = o || {};
    const size = o.size || 34, padX = 26, h = size * 2.05;
    const w = K.textWidth(ctx, label, size, 700, 0.5) + padX * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.scale == null ? 1 : o.scale, o.scale == null ? 1 : o.scale);
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    K.rr(ctx, -w / 2, -h / 2, w, h, h / 2);
    ctx.fillStyle = "rgba(8,14,24,0.88)"; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = o.color || K.C.cyan; ctx.stroke();
    ctx.shadowColor = o.color || K.C.cyan; ctx.shadowBlur = 22;
    ctx.stroke();
    ctx.shadowBlur = 0;
    K.text(ctx, label, 0, size * 0.36, { size: size, weight: 700, color: "#EAF2F8", align: "center" });
    ctx.restore();
    return { w: w, h: h };
  };
  K.card = function (ctx, x, y, w, h, title, sub, o) {
    o = o || {};
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    K.rr(ctx, x, y, w, h, 18);
    ctx.fillStyle = "rgba(10,18,32,0.82)"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = o.color || "rgba(79,216,240,0.55)"; ctx.stroke();
    K.text(ctx, title, x + 24, y + 46, { size: o.titleSize || 36, weight: 800, color: K.C.white });
    if (sub) K.text(ctx, sub, x + 24, y + 84, { size: 26, weight: 700, color: o.color || K.C.cyan, alpha: 0.95 });
    ctx.restore();
  };
  K.arrow = function (ctx, x1, y1, x2, y2, o) {
    o = o || {};
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - (o.bend == null ? 40 : o.bend);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.lineWidth = o.w || 3.5; ctx.strokeStyle = o.color || K.C.cyan; ctx.lineCap = "round"; ctx.stroke();
    const ang = Math.atan2(y2 - my, x2 - mx);
    const s = o.head || 14;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(ang - 0.42) * s, y2 - Math.sin(ang - 0.42) * s);
    ctx.lineTo(x2 - Math.cos(ang + 0.42) * s, y2 - Math.sin(ang + 0.42) * s);
    ctx.closePath(); ctx.fillStyle = o.color || K.C.cyan; ctx.fill();
    ctx.restore();
  };
  K.meter = function (ctx, x, y, w, h, p, o) {
    o = o || {};
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    K.rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = "rgba(10,18,32,0.9)"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(79,216,240,0.35)"; ctx.stroke();
    const fillW = Math.max(0, (w - 8) * K.clamp01(p));
    if (fillW > 2) {
      K.rr(ctx, x + 4, y + 4, fillW, h - 8, (h - 8) / 2);
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, o.from || K.C.teal); g.addColorStop(1, o.to || K.C.cyan);
      ctx.fillStyle = g; ctx.fill();
    }
    ctx.restore();
  };

  /* ---------- character ---------- */
  // pose angles: 0 = straight down, positive = rotate toward +x (screen right)
  const DEF = {
    lean: 0, headTilt: 0, headX: 0, headY: 0, bob: 0,
    armL: [-0.14, -0.1], armR: [0.14, 0.1],
    legL: [-0.06, 0.02], legR: [0.06, -0.02],
    brow: 0, mouth: 0, blink: 0, open: 0,
  };
  function pose(p) { return Object.assign({}, DEF, p || {}); }

  function limb(ctx, x, y, l1, l2, a1, a2, w, color) {
    const jx = x + Math.sin(a1) * l1, jy = y + Math.cos(a1) * l1;
    const ex = jx + Math.sin(a1 + a2) * l2, ey = jy + Math.cos(a1 + a2) * l2;
    K.line(ctx, x, y, jx, jy, w, color);
    K.line(ctx, jx, jy, ex, ey, w, color);
    K.circle(ctx, jx, jy, w * 0.52); ctx.fillStyle = color; ctx.fill();
    return { x: ex, y: ey, jx, jy };
  }

  function shapes(ctx, f, override) {
    const s = f.s, P = pose(f.pose);
    const bodyCol = override || f.color || K.C.coral;
    const ink = override || K.C.ink;
    const hipY = -34 * s + P.bob * s;
    // far arm (behind the body)
    limb(ctx, -12.5 * s, hipY - 36 * s, 20 * s, 18 * s, P.armL[0], P.armL[1], 6.2 * s, ink);
    // legs
    limb(ctx, -7 * s, hipY, 18 * s, 16 * s, P.legL[0], P.legL[1], 6.8 * s, ink);
    limb(ctx, 7 * s, hipY, 18 * s, 16 * s, P.legR[0], P.legR[1], 6.8 * s, ink);
    // body
    ctx.save();
    ctx.translate(0, hipY);
    ctx.rotate(P.lean);
    K.rr(ctx, -13 * s, -42 * s, 26 * s, 44 * s, 7 * s);
    ctx.fillStyle = bodyCol; ctx.fill();
    ctx.restore();
    // head
    const hx = P.headX * s + Math.sin(P.lean) * 36 * s;
    const hy = hipY - 54 * s + P.headY * s;
    K.line(ctx, Math.sin(P.lean) * 14 * s, hipY - 42 * s, hx, hy + 9 * s, 5.6 * s, ink);
    ctx.save();
    ctx.translate(hx, hy); ctx.rotate(P.headTilt);
    K.circle(ctx, 0, 0, 13.2 * s); ctx.fillStyle = ink; ctx.fill();
    if (!override) {
      const bl = 1 - 0.88 * K.clamp01(P.blink);
      ctx.fillStyle = "rgba(216,233,246,0.95)";
      K.circle(ctx, -4.4 * s, -1.6 * s, 2.4 * s * bl); ctx.fill();
      K.circle(ctx, 4.4 * s, -1.6 * s, 2.4 * s * bl); ctx.fill();
      if (P.brow) {
        ctx.strokeStyle = "rgba(216,233,246,0.85)"; ctx.lineWidth = 1.6 * s; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-6.2 * s, -6.4 * s); ctx.lineTo(-2.4 * s, -6.4 * s - P.brow * 2.1 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6.2 * s, -6.4 * s); ctx.lineTo(2.4 * s, -6.4 * s - P.brow * 2.1 * s); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(216,233,246,0.8)"; ctx.lineWidth = 1.5 * s; ctx.lineCap = "round";
      ctx.beginPath();
      if (P.mouth >= 0) ctx.arc(0, 4.0 * s, 2.9 * s, 0.3 * Math.PI, 0.7 * Math.PI);
      else ctx.arc(0, 8.6 * s, 3.0 * s, 1.2 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();
    }
    ctx.restore();
    // near arm (in front)
    limb(ctx, 12.5 * s, hipY - 36 * s, 20 * s, 18 * s, P.armR[0], P.armR[1], 6.2 * s, ink);
  }

  /* a small helper: eased pose interpolation between keyframe pairs */
  K.figure = function (ctx, f) {
    const s = f.s || 3.4;
    ctx.save();
    ctx.globalAlpha = f.alpha == null ? 1 : f.alpha;
    if (f.shadow !== false) {
      ctx.save();
      ctx.globalAlpha *= 0.55;
      ctx.translate(f.x, f.y); ctx.scale(1, 0.2);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 44 * s);
      g.addColorStop(0, "rgba(0,0,0,0.6)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 44 * s, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    ctx.translate(f.x, f.y);
    ctx.scale(f.flip ? -1 : 1, 1);
    const rim = f.rim === false ? null : (f.rimColor || K.C.cyan);
    if (rim) {
      const d = (f.rimDir || 1) * (window.__rimD || 5);
      ctx.save();
      ctx.translate(d, -1.8);
      shapes(ctx, f, rim);
      ctx.restore();
    }
    shapes(ctx, f, null);
    ctx.restore();
  };

  K.mix = function (a, p, b, q, t) {
    const u = K.ease(t);
    p = pose(p); q = pose(q);
    return {
      lean: K.lerp(p.lean, q.lean, u), headTilt: K.lerp(p.headTilt, q.headTilt, u),
      headX: K.lerp(p.headX, q.headX, u), headY: K.lerp(p.headY, q.headY, u),
      bob: K.lerp(p.bob, q.bob, u),
      armL: [K.lerp(p.armL[0], q.armL[0], u), K.lerp(p.armL[1], q.armL[1], u)],
      armR: [K.lerp(p.armR[0], q.armR[0], u), K.lerp(p.armR[1], q.armR[1], u)],
      legL: [K.lerp(p.legL[0], q.legL[0], u), K.lerp(p.legL[1], q.legL[1], u)],
      legR: [K.lerp(p.legR[0], q.legR[0], u), K.lerp(p.legR[1], q.legR[1], u)],
      brow: K.lerp(p.brow, q.brow, u), mouth: K.lerp(p.mouth, q.mouth, u),
      blink: K.lerp(p.blink, q.blink, u),
    };
  };

  /* transparent full-frame fades */
  K.fade = function (ctx, a, color) {
    if (a <= 0.001) return;
    ctx.save(); ctx.globalAlpha = K.clamp01(a); ctx.fillStyle = color || "#05080D";
    ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
  };

  K.camera = function (ctx, cam) {
    const z = cam.zoom == null ? 1 : cam.zoom;
    ctx.translate(960, 540);
    ctx.scale(z, z);
    ctx.translate(-960 - (cam.x || 0), -540 - (cam.y || 0));
  };

  K.grain = (function () {
    let tile = null;
    return function (ctx, alpha, ox, oy) {
      if (!tile) {
        tile = K.mk(256, 256);
        const g = tile.getContext("2d");
        const img = g.createImageData(256, 256);
        const r = K.rng(7);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = 120 + r() * 135;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = r() * 26;
        }
        g.putImageData(img, 0, 0);
      }
      const p = ctx.createPattern(tile, "repeat");
      ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = "overlay";
      ctx.translate(ox || 0, oy || 0); ctx.fillStyle = p; ctx.fillRect(-ox || 0, -oy || 0, 1920, 1080);
      ctx.restore();
    };
  })();
})();
