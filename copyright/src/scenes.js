/* Scenes — one function per beat, all driven by the timing map.
   Copyright Is Not Holy — Cinematic Stickman, Canvas 2D. */
(function () {
  const K = window.K, C = K.C, B = window.B;
  const S = (window.SCENES = []);

  /* ================= shared framing ================= */
  const clamp01 = K.clamp01;
  const rv = (t, at, d) => K.easeOut(K.seq(t, at, at + (d || 0.5)));

  function screen(ctx, fn) {
    const m = ctx.getTransform();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    fn();
    ctx.setTransform(m);
  }

  function headline(ctx, txt, t, at, o) {
    o = o || {};
    const p = rv(t, at, o.d || 0.55);
    if (p <= 0) return;
    const size = o.size || 60;
    screen(ctx, () => {
      ctx.save();
      ctx.globalAlpha = p * 0.97;
      const y = (o.y || 128) + (1 - p) * 12;
      K.text(ctx, txt, o.x || 100, y, { size: size, weight: 800, color: o.color || C.white, tracking: 0.5, shadow: true });
      const w = Math.min(K.textWidth(ctx, txt, size, 800, 0.5), o.maxW || 900);
      ctx.globalAlpha = p * 0.9;
      ctx.fillStyle = o.accent || C.cyan;
      ctx.fillRect((o.x || 100) + 2, y + 22, w * p, 4);
      ctx.restore();
    });
  }

  function tag(ctx, txt, x, y, t, at, color, o) {
    o = o || {};
    const p = rv(t, at, o.d || 0.35);
    if (p <= 0.01) return;
    const s = (o.size || 28) * (0.82 + 0.18 * p);
    ctx.save();
    ctx.globalAlpha = p;
    K.badge(ctx, x, y, txt, { color: color || C.cyan, size: s });
    ctx.restore();
  }

  function sub(ctx, txt, x, y, t, at, o) {
    o = o || {};
    const p = rv(t, at, o.d || 0.45);
    if (p <= 0.01) return;
    screen(ctx, () => {
      ctx.save();
      ctx.globalAlpha = p * (o.alpha == null ? 0.92 : o.alpha);
      K.text(ctx, txt, x, y, { size: o.size || 30, weight: 700, color: o.color || "rgba(200,220,238,0.9)", tracking: 0.4 });
      ctx.restore();
    });
  }

  function pool(ctx, x, y, rx, ry, color, a) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = a;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  function floorLine(ctx, y) {
    ctx.fillStyle = "rgba(10,18,32,0.92)"; ctx.fillRect(-60, y, 2040, 4);
    ctx.fillStyle = "rgba(79,216,240,0.10)"; ctx.fillRect(-60, y, 2040, 1);
  }

  function wallPanels(ctx, y0, y1, n, color, a) {
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a;
    for (let i = 0; i < n; i++) {
      const x = -40 + i * ((2000) / n);
      ctx.fillStyle = color || "rgba(42,58,80,0.30)";
      ctx.fillRect(x + 6, y0, 3, y1 - y0);
    }
    ctx.restore();
  }

  function archWindow(ctx, x, y, w, h, glowA, tone) {
    const t = tone || "rgba(242,178,92,1)";
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + h);
    ctx.lineTo(x - w / 2, y + w / 2);
    ctx.arc(x, y + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(x + w / 2, y + h);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y - w / 2, 0, y + h);
    g.addColorStop(0, "rgba(242,178,92,0.38)");
    g.addColorStop(0.5, "rgba(242,178,92,0.20)");
    g.addColorStop(1, "rgba(90,70,50,0.06)");
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "rgba(58,80,108,1)"; ctx.lineWidth = 7; ctx.stroke();
    // mullions
    ctx.strokeStyle = "rgba(40,56,78,0.95)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y - w / 2 + 2); ctx.lineTo(x, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 4, y + h * 0.55); ctx.lineTo(x + w / 2 - 4, y + h * 0.55); ctx.stroke();
    ctx.restore();
    pool(ctx, x, y + h * 0.7, w * 1.5, h * 0.9, "rgba(242,178,92,0.16)", glowA == null ? 1 : glowA);
  }

  function column(ctx, x, y0, y1, w, a) {
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, "#141F30"); g.addColorStop(0.45, "#243449"); g.addColorStop(0.62, "#2C3E56"); g.addColorStop(1, "#0E1826");
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, y0, w, y1 - y0);
    ctx.fillStyle = "#2E425C"; ctx.fillRect(x - w / 2 - 12, y0, w + 24, 16);
    ctx.fillStyle = "#1A2739"; ctx.fillRect(x - w / 2 - 10, y1 - 18, w + 20, 18);
    ctx.fillStyle = "rgba(79,216,240,0.10)"; ctx.fillRect(x + w / 2 - 5, y0, 3, y1 - y0);
    ctx.restore();
  }

  function lamp(ctx, x, topY, h, warm) {
    ctx.save();
    ctx.fillStyle = "#0B111B"; ctx.fillRect(x - 3, topY, 6, h);
    ctx.fillStyle = "#1A2739"; ctx.beginPath(); ctx.ellipse(x, topY + h, 26, 8, 0, 0, 6.283); ctx.fill();
    const g = ctx.createLinearGradient(x, topY - 40, x, topY);
    g.addColorStop(0, "rgba(242,178,92,0.9)"); g.addColorStop(1, "rgba(242,178,92,0.25)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 22, topY - 4); ctx.lineTo(x + 22, topY - 4); ctx.lineTo(x + 34, topY - 44); ctx.lineTo(x - 34, topY - 44); ctx.closePath(); ctx.fill();
    ctx.restore();
    pool(ctx, x, topY - 22, 170, 170, warm || "rgba(242,178,92,0.55)", 0.9);
  }

  function cone(ctx, x, y, w, h, a, tone) {
    ctx.save();
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, tone || "rgba(242,178,92,0.26)");
    g.addColorStop(1, "rgba(242,178,92,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.lineTo(x + 26, y); ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x - w / 2, y + h); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function desk(ctx, x, y, w, tone) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 6, w * 0.62, 18, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = tone || "#1B2A3D"; ctx.fillRect(x, y, w, 26);
    ctx.fillStyle = "rgba(242,178,92,0.20)"; ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = "#101A29"; ctx.fillRect(x + 18, y + 26, 16, 120); ctx.fillRect(x + w - 34, y + 26, 16, 120);
    ctx.fillStyle = "rgba(79,216,240,0.06)"; ctx.fillRect(x + 18, y + 26, 4, 120);
    ctx.restore();
  }

  function openBook(ctx, x, y, w, page, glow) {
    // y is the spine top; book lies flat-ish in 2.5D
    const h = w * 0.62;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath(); ctx.ellipse(0, h * 0.55, w * 0.75, h * 0.22, 0, 0, 6.283); ctx.fill();
    // cover
    ctx.fillStyle = "#3A1F22";
    ctx.beginPath();
    ctx.moveTo(-w * 0.62, h * 0.10); ctx.lineTo(-w * 0.5, -h * 0.08);
    ctx.lineTo(w * 0.5, -h * 0.08); ctx.lineTo(w * 0.62, h * 0.10);
    ctx.lineTo(w * 0.5, h * 0.72); ctx.lineTo(-w * 0.5, h * 0.72); ctx.closePath(); ctx.fill();
    // pages
    for (let i = 0; i < 2; i++) {
      const s = i ? 1 : -1;
      ctx.fillStyle = i ? "#E8DCC8" : "#F2E9D8";
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.03); ctx.quadraticCurveTo(s * w * 0.3, -h * 0.10, s * w * 0.46, -h * 0.02);
      ctx.lineTo(s * w * 0.46, h * 0.58); ctx.quadraticCurveTo(s * w * 0.28, h * 0.52, 0, h * 0.60);
      ctx.closePath(); ctx.fill();
      // ruling + text lines
      ctx.strokeStyle = "rgba(60,70,80,0.35)"; ctx.lineWidth = 1.2;
      for (let k = 0; k < 7; k++) {
        const yy = h * 0.06 + k * h * 0.07;
        ctx.beginPath(); ctx.moveTo(s * (w * 0.04 + (k % 3) * 0.02), yy); ctx.lineTo(s * (w * 0.40 - (k % 4) * 0.02), yy + h * 0.01); ctx.stroke();
      }
    }
    // spine
    ctx.fillStyle = "rgba(20,14,12,0.55)"; ctx.fillRect(-3, -h * 0.04, 6, h * 0.64);
    if (glow) {
      const g = ctx.createLinearGradient(0, -h * 0.1, 0, h * 0.2);
      g.addColorStop(0, "rgba(79,216,240,0)");
      g.addColorStop(0.5, "rgba(79,216,240," + 0.20 * glow + ")");
      g.addColorStop(1, "rgba(79,216,240,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-w * 0.46, -h * 0.02); ctx.lineTo(0, -h * 0.03); ctx.lineTo(0, h * 0.60); ctx.lineTo(-w * 0.46, h * 0.58); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function noteGlyph(ctx, x, y, s, rot, color, a) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.fillStyle = color || C.cyan;
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 6.4, -0.35, 0, 6.283); ctx.fill();
    ctx.fillRect(6.2, -46, 3.6, 46);
    // flag drawn as a filled bezier so its ends meet the stem exactly
    ctx.beginPath();
    ctx.moveTo(9.8, -46);
    ctx.bezierCurveTo(22, -40, 22, -30, 15, -24);
    ctx.bezierCurveTo(20, -32, 15, -38, 9.8, -39);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function notes(ctx, t, x, y, n, spread, color, a) {
    for (let i = 0; i < n; i++) {
      const ph = i * 1.7;
      const dx = x + (i - (n - 1) / 2) * spread + Math.sin(t * 0.9 + ph) * 12;
      const dy = y + Math.cos(t * 0.7 + ph) * 16 - (t - (t | 0)) * 0;
      noteGlyph(ctx, dx, dy, 1 + 0.1 * Math.sin(t + ph), Math.sin(t * 0.6 + ph) * 0.15, color, a);
    }
  }

  function ox(ctx, x, y, s, a, face) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(face === -1 ? -s : s, s);
    ctx.globalAlpha = a == null ? 1 : a;
    const ink = "#0B111B";
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineCap = "round"; ctx.lineJoin = "round";
    // legs
    ctx.lineWidth = 8;
    for (const lx of [-42, -18, 24, 46]) { ctx.beginPath(); ctx.moveTo(lx, -52); ctx.lineTo(lx + (lx > 0 ? 4 : -4), -2); ctx.stroke(); }
    // body
    ctx.beginPath(); ctx.ellipse(0, -74, 58, 34, 0, 0, 6.283); ctx.fill();
    // tail
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-56, -82); ctx.quadraticCurveTo(-78, -66, -74, -40); ctx.stroke();
    // neck + head
    ctx.fillRect(40, -100, 26, 30);
    ctx.beginPath(); ctx.ellipse(74, -104, 26, 19, -0.1, 0, 6.283); ctx.fill();
    // muzzle
    ctx.beginPath(); ctx.ellipse(94, -98, 12, 9, 0, 0, 6.283); ctx.fill();
    // horns (two curves, ends meet the head)
    ctx.strokeStyle = "#C9D8E6"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(66, -118); ctx.quadraticCurveTo(58, -140, 74, -146); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(82, -120); ctx.quadraticCurveTo(92, -142, 106, -138); ctx.stroke();
    // eye
    ctx.fillStyle = "rgba(200,220,238,0.85)"; ctx.beginPath(); ctx.arc(72, -110, 2.4, 0, 6.283); ctx.fill();
    ctx.restore();
    // rim light along the back
    ctx.save();
    ctx.globalAlpha = (a == null ? 1 : a) * 0.55;
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.translate(x, y); ctx.scale(face === -1 ? -s : s, s);
    ctx.beginPath(); ctx.moveTo(-52, -104); ctx.quadraticCurveTo(-20, -112, 34, -104); ctx.stroke();
    ctx.restore();
  }

  function tablet(ctx, x, y, w, h, label, glow, a, tone) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath(); ctx.ellipse(0, 6, w * 0.62, 14, 0, 0, 6.283); ctx.fill();
    // stone slab, slightly chipped top
    const g = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
    g.addColorStop(0, tone || "#22334A"); g.addColorStop(0.55, tone || "#2C3F58"); g.addColorStop(1, "#162234");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h);
    ctx.lineTo(-w * 0.38, -h - 6); ctx.lineTo(-w * 0.12, -h + 2);
    ctx.lineTo(w * 0.2, -h - 5); ctx.lineTo(w / 2, -h + 3);
    ctx.lineTo(w / 2, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(79,216,240,0.18)"; ctx.lineWidth = 2; ctx.stroke();
    if (glow) {
      ctx.save();
      ctx.shadowColor = glow; ctx.shadowBlur = 30;
      ctx.strokeStyle = glow; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    if (label) {
      ctx.save();
      ctx.globalAlpha = a == null ? 1 : a;
      K.text(ctx, label, x, y - h * 0.4, { size: Math.min(46, w * 0.133), weight: 800, color: glow ? glow : "rgba(220,235,248,0.9)", align: "center", shadow: true });
      ctx.restore();
    }
  }

  function press(ctx, x, baseY, drop, o) {
    o = o || {};
    const top = baseY - 430;
    ctx.save();
    // plinth
    ctx.fillStyle = "#101A29"; ctx.fillRect(x - 210, baseY - 46, 420, 46);
    ctx.fillStyle = "#1B2A3D"; ctx.fillRect(x - 240, baseY - 54, 480, 12);
    // posts
    ctx.fillStyle = "#1A2739"; ctx.fillRect(x - 170, top, 30, 390); ctx.fillRect(x + 140, top, 30, 390);
    ctx.fillStyle = "#26384E"; ctx.fillRect(x - 176, top, 42, 12); ctx.fillRect(x + 134, top, 42, 12);
    // crossbar
    ctx.fillStyle = "#22334A"; ctx.fillRect(x - 190, top - 24, 380, 30);
    ctx.fillStyle = "rgba(79,216,240,0.12)"; ctx.fillRect(x - 190, top - 24, 380, 3);
    // screw
    ctx.fillStyle = "#8FA7BD"; ctx.fillRect(x - 12, top - 6, 24, 140 + drop);
    ctx.fillStyle = "#5E7488"; for (let i = 0; i < 9; i++) ctx.fillRect(x - 12, top + 6 + i * 16, 24, 4);
    // die block
    const by = top + 140 + drop;
    ctx.fillStyle = "#2A3A50"; ctx.fillRect(x - 150, by, 300, 66);
    ctx.fillStyle = "#3A4F6B"; ctx.fillRect(x - 150, by, 300, 8);
    ctx.fillStyle = "#1A2739"; ctx.fillRect(x - 110, by + 66, 220, 16);
    if (o.impact) {
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = o.impact;
      ctx.fillStyle = "rgba(79,216,240,0.5)"; ctx.fillRect(x - 150, by + 70, 300, 6);
      ctx.restore();
    }
    // T-handle on the screw
    ctx.save();
    ctx.translate(x, top - 96);
    ctx.fillStyle = "#5E7488"; ctx.fillRect(-6, 0, 12, 100);
    ctx.fillStyle = "#8FA7BD"; ctx.fillRect(-74, -10, 148, 20);
    ctx.fillStyle = "#3A4F6B"; ctx.fillRect(-74, 8, 148, 5);
    ctx.restore();
    // paper on plinth
    ctx.fillStyle = "#E8DCC8";
    ctx.fillRect(x - 132, baseY - 86, 264, 44);
    ctx.fillStyle = "rgba(60,50,40,0.18)"; ctx.fillRect(x - 132, baseY - 86, 264, 4);
    ctx.restore();
  }

  function signArrow(ctx, x, y, w, dir, label, color, a) {
    ctx.save();
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.translate(x, y); ctx.scale(dir < 0 ? -1 : 1, 1);
    ctx.fillStyle = "rgba(10,18,32,0.92)";
    ctx.beginPath();
    ctx.moveTo(0, -w * 0.18); ctx.lineTo(w * 0.72, -w * 0.18); ctx.lineTo(w * 0.72, -w * 0.34);
    ctx.lineTo(w, 0); ctx.lineTo(w * 0.72, w * 0.34); ctx.lineTo(w * 0.72, w * 0.18);
    ctx.lineTo(0, w * 0.18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color || C.cyan; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = a == null ? 1 : a;
    K.text(ctx, label, x + (dir < 0 ? -w * 0.42 : w * 0.42), y + 10, { size: w * 0.15, weight: 800, color: color || C.cyan, align: "center", shadow: true });
    ctx.restore();
  }

  function certificate(ctx, x, y, w, rot, a) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha = a == null ? 1 : a;
    ctx.fillStyle = "#EADFC8"; ctx.fillRect(-w / 2, -w * 0.36, w, w * 0.72);
    ctx.strokeStyle = "#8A7A5F"; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 + 12, -w * 0.36 + 12, w - 24, w * 0.72 - 24);
    ctx.fillStyle = "rgba(60,50,40,0.16)";
    for (let i = 0; i < 5; i++) ctx.fillRect(-w / 2 + 30, -w * 0.2 + i * w * 0.08, w * 0.5, 4);
    ctx.fillStyle = "rgba(232,96,60,0.75)";
    ctx.beginPath(); ctx.arc(w * 0.26, w * 0.16, w * 0.09, 0, 6.283); ctx.fill();
    ctx.strokeStyle = "rgba(232,96,60,0.45)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(w * 0.26, w * 0.16, w * 0.115, 0, 6.283); ctx.stroke();
    ctx.restore();
  }

  /* ================= 1 · 0.09  "Here's the case" ================= */
  S.push({
    t0: 0.0, t1: 3.73,
    draw(ctx, t) {
      const lt = t;
      const cam = { zoom: 1.02 + 0.06 * K.ease(K.seq(lt, 0, 3.73)), x: 0 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0E1A2B", bot: "#18293D", floorY: 880 });
      archWindow(ctx, 1450, 210, 250, 420, 0.9);
      column(ctx, 1180, 120, 880, 58, 0.85);
      column(ctx, 230, 90, 880, 74, 0.95);
      wallPanels(ctx, 120, 880, 7, "rgba(42,58,80,0.20)");
      // floor boards
      ctx.strokeStyle = "rgba(79,216,240,0.05)"; ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(-100, 900 + i * 22); ctx.lineTo(2020, 900 + i * 22); ctx.stroke(); }
      floorLine(ctx, 878);

      // plinth + book
      const open = K.ease(K.seq(lt, 0.95, 1.5));
      ctx.fillStyle = "#0C1624"; ctx.fillRect(600, 700, 420, 180);
      ctx.fillStyle = "#132033"; ctx.fillRect(582, 686, 456, 18);
      ctx.fillStyle = "rgba(242,178,92,0.18)"; ctx.fillRect(582, 686, 456, 3);
      openBook(ctx, 810, 706 - 10 * open, 300, open, 0.5 + 0.5 * open);
      if (open > 0.2) {
        pool(ctx, 810, 700, 260, 120, "rgba(79,216,240,0.20)", open * 0.9);
      }
      // the case stamp
      const st = rv(lt, 2.5, 0.3);
      if (st > 0.01) {
        ctx.save();
        ctx.globalAlpha = st;
        ctx.translate(810, 660); ctx.rotate(-0.06);
        ctx.strokeStyle = C.amber; ctx.lineWidth = 4;
        ctx.strokeRect(-120, -26, 240, 52);
        K.text(ctx, "MADE-UP", 0, 12, { size: 34, weight: 800, color: C.amber, align: "center", tracking: 2, glow: C.amber, blur: 18 });
        ctx.restore();
      }

      // character enters from the left, case file under arm
      const walk = K.soft(K.seq(lt, 0.5, 2.4));
      const bob = Math.sin(lt * 7) * 0.03 * (walk > 0.02 && walk < 0.98 ? 1 : 0);
      K.figure(ctx, {
        x: 300 + 240 * walk, y: 905, s: 3.35, color: C.coral, rimColor: C.cyan, rimDir: 1,
        pose: { lean: 0.05 * walk, bob: bob, armL: [-0.2, -0.15], armR: [0.5 + 0.2 * walk, 0.35], headX: 0.3 * walk, brow: 0.35, mouth: 0.2 },
      });
      // case file
      ctx.save();
      ctx.translate(420 + 240 * walk, 760); ctx.rotate(-0.12);
      ctx.fillStyle = "#C9B79A"; ctx.fillRect(-42, -54, 84, 64);
      ctx.fillStyle = "rgba(232,96,60,0.85)"; ctx.fillRect(-42, -54, 84, 9);
      ctx.restore();

      headline(ctx, "THE CASE", t, 0.15);
      if (t > 1.1) tag(ctx, "copyright law", 520, 500, t, 1.1, C.cyan, { size: 26 });
      if (t > 2.55) tag(ctx, "A MORAL RULE?", 1080, 470, t, 2.55, C.amber, { size: 26 });

      K.dust(ctx, t, 12, 28);
      K.vignette(ctx, 0.8);
      K.fade(ctx, 1 - rv(lt, 0, 0.6));
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 2 · 3.73  made by statute, not discovered ================= */
  S.push({
    t0: 3.73, t1: 9.86,
    draw(ctx, t) {
      const lt = t - 3.73;
      const cam = { zoom: 1.04, x: -40 + 210 * K.ease(K.seq(t, 6.0, 9.4)) };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0D1828", bot: "#152538", floorY: 890 });
      wallPanels(ctx, 100, 890, 9, "rgba(42,58,80,0.24)");
      floorLine(ctx, 888);
      // hanging bulb
      lamp(ctx, 960, 160, 90);
      cone(ctx, 960, 214, 640, 660, 0.85);
      // shelves with statute volumes
      for (let r = 0; r < 2; r++) {
        const yy = 330 + r * 180;
        ctx.fillStyle = "#1A2739"; ctx.fillRect(1180, yy, 470, 12);
        for (let i = 0; i < 9; i++) {
          ctx.fillStyle = ["#2A3A50", "#3A4F6B", "#4A3527", "#26404A"][(i + r) % 4];
          const hh = 58 + ((i * 37) % 26);
          ctx.fillRect(1192 + i * 50, yy - hh, 30, hh);
          ctx.fillStyle = "rgba(242,178,92,0.25)"; ctx.fillRect(1192 + i * 50, yy - hh + 6, 30, 2);
        }
      }
      // press on the left
      const pressT = K.ease(K.seq(t, 5.6, 6.15));
      press(ctx, 560, 890, (1 - pressT) * 150, { impact: pressT > 0.95 ? 0.9 : 0, wheel: pressT * 0.8 });
      const flash = Math.max(0, 1 - Math.abs(t - 6.15) / 0.35);
      if (flash > 0.02) pool(ctx, 560, 780, 300, 170, "rgba(79,216,240,0.5)", flash);
      if (t > 6.1) {
        ctx.save();
        ctx.globalAlpha = rv(t, 6.1, 0.3);
        ctx.translate(560, 846); ctx.rotate(-0.02);
        K.text(ctx, "STATUTE", 0, 0, { size: 30, weight: 800, color: "#0B111B", align: "center", tracking: 3 });
        ctx.restore();
        tag(ctx, "INVENTED", 560, 330, t, 6.35, C.amber);
      }
      if (t > 7.55) tag(ctx, "NOT FOUND", 1530, 540, t, 7.55, C.cyan, { size: 24, d: 0.3 });

      // the empty plinth where a moral order would be
      const emptyA = rv(t, 7.15, 0.7);
      ctx.save(); ctx.globalAlpha = 0.55 + 0.45 * emptyA;
      ctx.fillStyle = "#0C1624"; ctx.fillRect(1400, 700, 260, 190);
      ctx.fillStyle = "#132033"; ctx.fillRect(1386, 686, 288, 18);
      ctx.strokeStyle = "rgba(79,216,240,0.25)"; ctx.lineWidth = 2;
      ctx.setLineDash([8, 10]);
      ctx.strokeRect(1440, 610, 180, 72);
      ctx.setLineDash([]);
      ctx.restore();
      if (t > 7.95) {
        const q = rv(t, 7.9, 0.4);
        ctx.save(); ctx.globalAlpha = q; ctx.translate(1530, 660);
        K.text(ctx, "?", 0, 0, { size: 64, weight: 800, color: "rgba(120,190,220,0.7)", align: "center" });
        ctx.restore();
        tag(ctx, "MORAL ORDER", 1530, 560, t, 8.0, C.cyan, { size: 22 });
      }
      // a searcher's beam sweeps the empty plinth
      const sweep = Math.sin((t - 7.2) * 0.9) * 0.5;
      ctx.save(); ctx.globalAlpha = 0.25 * rv(t, 7.3, 0.5);
      ctx.translate(1530, 560); ctx.rotate(sweep * 0.2);
      const g = ctx.createLinearGradient(0, 0, 0, 340);
      g.addColorStop(0, "rgba(79,216,240,0.35)"); g.addColorStop(1, "rgba(79,216,240,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(110, 340); ctx.lineTo(-110, 340); ctx.closePath(); ctx.fill();
      ctx.restore();

      headline(ctx, "MADE, NOT FOUND", t, 3.85, { size: 58 });
      K.dust(ctx, t, 31, 26);
      K.vignette(ctx, 0.82);
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 3 · 9.86  theft, not copying ================= */
  S.push({
    t0: 9.86, t1: 13.84,
    draw(ctx, t) {
      const lt = t - 9.86;
      const cam = { zoom: 1.03 + 0.03 * K.ease(K.seq(lt, 0, 4)), x: 0 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0C1626", bot: "#131F31", floorY: 920 });
      wallPanels(ctx, 90, 920, 5, "rgba(42,58,80,0.20)");
      // top light
      cone(ctx, 960, 0, 900, 760, 0.5, "rgba(200,220,240,0.14)");
      floorLine(ctx, 918);
      // two tablets
      tablet(ctx, 640, 760, 300, 360, null, null, 1);
      tablet(ctx, 1280, 760, 300, 360, null, null, 1);
      // left icon: ox + hand
      ox(ctx, 640, 700, 0.92, 0.95, 1);
      tag(ctx, "THEFT", 640, 505, t, B.word(2, "theft"), C.coral, { size: 30 });
      // right icon: notes copied
      notes(ctx, t, 1280, 610, 3, 46, C.cyan, 0.95);
      tag(ctx, "COPYING", 1280, 505, t, B.word(2, "copying"), C.cyan, { size: 30 });
      // the command numerals on the tablets (VII — generic stone marking, not a likeness)
      K.text(ctx, "VII", 640, 420, { size: 40, weight: 800, color: "rgba(220,235,248,0.35)", align: "center", tracking: 4 });
      K.text(ctx, "VII", 1280, 420, { size: 40, weight: 800, color: "rgba(220,235,248,0.12)", align: "center", tracking: 4 });

      // line between them with a slash: theft is forbidden, copying is not
      const lp = rv(t, 12.1, 0.4);
      if (lp > 0.01) {
        ctx.save(); ctx.globalAlpha = lp;
        ctx.strokeStyle = "rgba(120,190,220,0.5)"; ctx.lineWidth = 3; ctx.setLineDash([10, 12]);
        ctx.beginPath(); ctx.moveTo(800, 700); ctx.lineTo(1120, 700); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      headline(ctx, "THEFT \u2260 COPYING", t, 10.0, { size: 60 });
      sub(ctx, "the Commandment names theft, not copying", 104, 176, t, 11.9, { size: 26, color: "rgba(170,195,215,0.75)" });
      K.dust(ctx, t, 44, 24);
      K.vignette(ctx, 0.86);
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 4 · 13.84  take the ox ================= */
  S.push({
    t0: 13.84, t1: 16.27,
    draw(ctx, t) {
      const lt = t - 13.84;
      const cam = { zoom: 1.05, x: -60 + 190 * K.ease(K.seq(lt, 0, 2.43)) };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0B1523", bot: "#141F30", floorY: 900 });
      // brick wall
      ctx.save(); ctx.globalAlpha = 0.5;
      for (let r = 0; r < 9; r++) for (let c = 0; c < 12; c++) {
        ctx.fillStyle = (r + c) % 3 ? "rgba(42,58,80,0.30)" : "rgba(58,48,44,0.35)";
        ctx.fillRect(-60 + c * 175 + (r % 2) * 88, 220 + r * 52, 168, 46);
      }
      ctx.restore();
      // streetlamp
      lamp(ctx, 400, 300, 250);
      cone(ctx, 400, 352, 620, 540, 0.7);
      // fence
      for (let i = 0; i < 7; i++) {
        const fx = 1180 + i * 110;
        ctx.fillStyle = "#101A29"; ctx.fillRect(fx, 690, 9, 210);
        ctx.fillStyle = "#1B2A3D"; ctx.fillRect(fx - 8, 676, 25, 10);
      }
      ctx.fillStyle = "rgba(16,26,41,0.9)"; ctx.fillRect(1160, 740, 760, 8); ctx.fillRect(1160, 820, 760, 8);
      floorLine(ctx, 898);
      // thief leading the ox
      const step = Math.sin(lt * 6.4);
      K.figure(ctx, {
        x: 700 + 90 * K.soft(K.seq(lt, 0, 2.2)), y: 926, s: 3.3, color: C.violet, rimColor: C.amber, rimDir: -1,
        pose: { lean: 0.16, bob: step * 0.04, armR: [1.15, 0.35], armL: [-0.35, 0.2], legL: [0.32 * step, 0.1], legR: [-0.32 * step, 0.1], headX: 0.2, brow: 0.4 },
      });
      // rope
      ctx.strokeStyle = "rgba(232,176,75,0.85)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(790, 790); ctx.quadraticCurveTo(850, 806, 920, 796); ctx.stroke();
      // ox
      ox(ctx, 1010, 924, 1.25, 1, 1);
      if (t > 15.62) {
        tag(ctx, "THEFT", 740, 560, t, B.word(3, "theft"), C.coral, { size: 30 });
      }
      headline(ctx, "TAKE THE OX", t, 13.95, { size: 58 });
      K.dust(ctx, t, 55, 20);
      K.vignette(ctx, 0.85);
      K.grain(ctx, 0.05, 0, 0);
    },
  });

  /* ================= 5 · 16.27  sing the song, ox still there ================= */
  S.push({
    t0: 16.27, t1: 20.08,
    draw(ctx, t) {
      const lt = t - 16.27;
      const cam = { zoom: 1.03, x: 40 - 80 * K.ease(K.seq(lt, 0, 3.8)) };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0B1523", bot: "#152131", floorY: 900 });
      ctx.save(); ctx.globalAlpha = 0.45;
      for (let r = 0; r < 9; r++) for (let c = 0; c < 12; c++) {
        ctx.fillStyle = (r + c) % 3 ? "rgba(42,58,80,0.28)" : "rgba(58,48,44,0.32)";
        ctx.fillRect(-60 + c * 175 + (r % 2) * 88, 220 + r * 52, 168, 46);
      }
      ctx.restore();
      lamp(ctx, 360, 300, 250);
      cone(ctx, 360, 352, 560, 520, 0.6);
      // same fence, now behind
      for (let i = 0; i < 6; i++) {
        const fx = 1240 + i * 120;
        ctx.fillStyle = "#101A29"; ctx.fillRect(fx, 700, 9, 200);
        ctx.fillStyle = "#1B2A3D"; ctx.fillRect(fx - 8, 686, 25, 10);
      }
      ctx.fillStyle = "rgba(16,26,41,0.9)"; ctx.fillRect(1220, 748, 700, 7);
      floorLine(ctx, 898);
      // ox is back, whole
      ox(ctx, 1550, 924, 1.25, 1, -1);
      if (t > 19.6) tag(ctx, "STILL HERE", 1500, 560, t, B.word(4, "still"), C.cyan, { size: 28 });
      // singer
      const bounce = Math.sin(lt * 4.2) * 0.03;
      K.figure(ctx, {
        x: 760, y: 926, s: 3.35, color: C.coral, rimColor: C.amber, rimDir: -1,
        pose: { lean: -0.04, bob: bounce, armR: [0.5, -0.9], armL: [-0.5, 0.7], headTilt: -0.06, headY: -0.04, mouth: 1, brow: 0.3 },
      });
      // notes leave him and land with a second figure
      const p = rv(t, 16.9, 0.6);
      if (p > 0) notes(ctx, t, 900 + 120 * K.soft(K.seq(lt, 0.6, 2.6)), 690, 3, 60, C.cyan, p);
      const p2 = rv(t, 17.8, 0.6);
      if (p2 > 0) {
        K.figure(ctx, {
          x: 1120, y: 926, s: 3.1, color: C.teal, rimColor: C.cyan, rimDir: -1, alpha: 0.35 + 0.65 * p2,
          pose: { lean: 0.05, armR: [0.9, -0.6], armL: [-0.2, 0.3], headTilt: 0.08, mouth: 1, brow: 0.3 },
        });
      }
      // the song still in the singer's chest: a small steady glow
      pool(ctx, 748, 830, 70, 70, "rgba(79,216,240,0.35)", 0.9 + 0.1 * Math.sin(t * 3));
      headline(ctx, "SING THE SONG", t, 16.4, { size: 58 });
      sub(ctx, "the ox is still there", 104, 176, t, 19.4, { size: 26, color: "rgba(170,195,215,0.75)" });
      K.dust(ctx, t, 66, 20);
      K.vignette(ctx, 0.85);
      K.grain(ctx, 0.05, 0, 0);
    },
  });

  /* ================= 6 · 20.08  a granted monopoly ================= */
  S.push({
    t0: 20.08, t1: 28.23,
    draw(ctx, t) {
      const pan = K.ease(K.seq(t, 22.7, 24.1));
      const cam = { zoom: 1.02 + 0.04 * K.ease(K.seq(t, 25.4, 28.0)), x: 430 * pan, y: -10 * pan };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0D1828", bot: "#17283C", floorY: 905 });
      archWindow(ctx, 1150, 190, 220, 460, 0.7, "rgba(242,178,92,0.8)");
      column(ctx, 180, 80, 905, 70, 0.9);
      column(ctx, 1880, 60, 905, 80, 0.9);
      wallPanels(ctx, 110, 905, 9, "rgba(42,58,80,0.18)");
      floorLine(ctx, 903);

      // --- the grant is handed over at the desk ---
      desk(ctx, 230, 690, 800);
      const slide = K.soft(K.seq(t, 20.5, 21.6));
      certificate(ctx, 570 + 210 * slide, 640 - 6 * slide, 200, -0.04 + slide * 0.04, 1);
      if (t > 20.85) {
        const sp = Math.max(0, 1 - Math.abs(t - 20.9) / 0.3);
        if (sp > 0.02) pool(ctx, 570, 650, 180, 80, "rgba(242,178,92,0.45)", sp);
        tag(ctx, "GOVERNMENT-GRANTED", 700, 500, t, B.word(5, "government-granted"), C.amber, { size: 22 });
      }
      K.figure(ctx, {
        x: 470, y: 905, s: 3.15, color: C.violet, rimColor: C.amber, rimDir: -1,
        pose: { lean: 0.08, armR: [1.0, -0.25], armL: [-0.15, 0.1], headX: 0.12, brow: 0.35, mouth: -0.2 },
      });
      const step = K.soft(K.seq(t, 20.2, 21.0));
      K.figure(ctx, {
        x: 830 + 30 * step, y: 905, s: 3.2, color: C.coral, rimColor: C.cyan, rimDir: 1,
        pose: { lean: -0.04, armR: [0.85, 0.55], armL: [-0.28, -0.1], headX: -0.08, brow: 0.2, mouth: 0.3 },
      });

      // --- pan to the enclosed song ---
      // plinth
      ctx.fillStyle = "#0C1624"; ctx.fillRect(1300, 760, 250, 140);
      ctx.fillStyle = "#132033"; ctx.fillRect(1286, 746, 278, 16);
      ctx.fillStyle = "rgba(242,178,92,0.16)"; ctx.fillRect(1286, 746, 278, 3);
      notes(ctx, t, 1425, 700, 3, 46, C.cyan, 0.95);
      pool(ctx, 1425, 720, 170, 80, "rgba(79,216,240,0.22)", 0.9);

      const fence = K.ease(K.seq(t, 22.7, 24.2));
      if (fence > 0.01) {
        const posts = [1290, 1425, 1560];
        posts.forEach((px, i) => {
          const h = 140 * K.ease(K.seq(t, 22.7 + i * 0.2, 23.15 + i * 0.2));
          if (h <= 0) return;
          ctx.strokeStyle = "rgba(10,18,32,1)"; ctx.lineWidth = 9;
          ctx.beginPath(); ctx.moveTo(px, 760); ctx.lineTo(px, 760 - h); ctx.stroke();
          ctx.strokeStyle = C.amber; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(px, 760); ctx.lineTo(px, 760 - h); ctx.stroke();
          ctx.fillStyle = C.amber;
          ctx.beginPath(); ctx.moveTo(px, 748 - h); ctx.lineTo(px - 7, 758 - h); ctx.lineTo(px + 7, 758 - h); ctx.closePath(); ctx.fill();
        });
        for (let i = 0; i < posts.length - 1; i++) {
          const a = K.ease(K.seq(t, 23.25 + i * 0.18, 23.65 + i * 0.18));
          if (a <= 0) continue;
          ctx.strokeStyle = "rgba(242,178,92,0.8)"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(posts[i], 640);
          ctx.quadraticCurveTo((posts[i] + posts[i + 1]) / 2, 672, posts[i + 1], 640);
          ctx.stroke();
        }
        tag(ctx, "MONOPOLY", 1150, 480, t, B.word(5, "monopoly—a"), C.amber, { size: 28 });
      }

      // privilege: a grant hung on a wire, with no roots beneath
      if (t > 25.85) {
        const sway = Math.sin(t * 1.5) * 4;
        ctx.save(); ctx.globalAlpha = rv(t, 25.85, 0.5);
        ctx.strokeStyle = "rgba(200,220,238,0.6)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(1425, 250); ctx.lineTo(1425, 330 + sway); ctx.stroke();
        ctx.fillStyle = "rgba(200,220,238,0.45)"; ctx.beginPath(); ctx.arc(1425, 246, 7, 0, 6.283); ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(1425, 390 + sway);
        K.rr(ctx, -150, -60, 300, 120, 10);
        ctx.fillStyle = "rgba(8,14,24,0.96)"; ctx.fill();
        ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke();
        K.text(ctx, "THE GRANT", 0, 8, { size: 30, weight: 800, color: C.white, align: "center", tracking: 2 });
        ctx.restore();
        // dashed ghost of roots that are not there, under the plinth
        ctx.save(); ctx.globalAlpha = 0.4; ctx.setLineDash([6, 9]);
        ctx.strokeStyle = C.coral; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(1425, 900); ctx.lineTo(1425, 950);
        ctx.moveTo(1425, 950); ctx.lineTo(1385, 990); ctx.moveTo(1425, 950); ctx.lineTo(1465, 990);
        ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        tag(ctx, "NO ROOTS", 1680, 690, t, B.word(5, "rooted"), C.coral, { size: 22 });
        tag(ctx, "A PRIVILEGE", 1680, 590, t, B.word(5, "privilege") - 0.3, C.amber, { size: 24 });
      }
      headline(ctx, "A GRANTED MONOPOLY", t, 20.2, { size: 56 });
      K.dust(ctx, t, 77, 24);
      K.vignette(ctx, 0.86);
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 7 · 28.23  terms, exceptions, licences, expiry ================= */
  S.push({
    t0: 28.23, t1: 35.99,
    draw(ctx, t) {
      const lt = t - 28.23;
      const cam = { zoom: 1.02, x: 0 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0C1726", bot: "#152335", floorY: 900 });
      // card-catalogue wall
      for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
        const x = 1180 + c * 92, y = 220 + r * 118;
        ctx.fillStyle = "rgba(26,39,57,0.85)"; ctx.fillRect(x, y, 82, 106);
        ctx.fillStyle = "rgba(10,18,32,0.9)"; ctx.fillRect(x + 6, y + 8, 70, 58);
        ctx.fillStyle = "rgba(242,178,92,0.35)"; ctx.fillRect(x + 34, y + 72, 14, 6);
      }
      floorLine(ctx, 898);
      // left: policy folder on a desk
      desk(ctx, 180, 700, 560);
      ctx.save();
      ctx.translate(430, 660);
      ctx.fillStyle = "#8A6A3E"; ctx.fillRect(-140, -60, 280, 130);
      ctx.fillStyle = "#A07C48"; ctx.fillRect(-140, -60, 280, 22);
      ctx.fillStyle = "#A07C48"; ctx.fillRect(-130, -88, 110, 30);
      ctx.fillStyle = "#2A3A50"; ctx.fillRect(-120, -30, 240, 80);
      K.text(ctx, "POLICY", 0, 22, { size: 30, weight: 800, color: "rgba(220,235,248,0.9)", align: "center", tracking: 3 });
      ctx.restore();

      // four cards fly out to a pinboard
      const cards = [
        { t: 28.9, x: 560, y: 300, label: "TERMS", icon: "clock" },
        { t: 30.4, x: 900, y: 250, label: "EXCEPTIONS", icon: "door" },
        { t: 31.9, x: 1240, y: 300, label: "LICENCES", icon: "stamp" },
        { t: 33.5, x: 1560, y: 250, label: "EXPIRY", icon: "hour" },
      ];
      const cardsA = rv(t, 28.4, 0.4);
      if (cardsA > 0.01) {
        ctx.save(); ctx.globalAlpha = cardsA;
        K.rr(ctx, 460, 180, 1300, 470, 26);
        ctx.fillStyle = "rgba(10,18,32,0.55)"; ctx.fill();
        ctx.strokeStyle = "rgba(79,216,240,0.18)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      for (const cd of cards) {
        const p = rv(t, cd.t, 0.4);
        if (p <= 0.01) continue;
        const bw = 260, bh = 150;
        ctx.save();
        ctx.globalAlpha = p;
        ctx.translate(cd.x, cd.y + (1 - p) * -30);
        K.rr(ctx, -bw / 2, -bh / 2, bw, bh, 18);
        ctx.fillStyle = "rgba(13,24,38,0.96)"; ctx.fill();
        ctx.strokeStyle = C.cyan; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.shadowColor = C.cyan; ctx.shadowBlur = 20; ctx.stroke(); ctx.shadowBlur = 0;
        K.text(ctx, cd.label, 0, 26, { size: 30, weight: 800, color: C.white, align: "center", tracking: 1 });
        // icons
        ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.lineCap = "round";
        if (cd.icon === "clock") {
          ctx.beginPath(); ctx.arc(0, -28, 22, 0, 6.283); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(0, -42); ctx.moveTo(0, -28); ctx.lineTo(12, -22); ctx.stroke();
        } else if (cd.icon === "door") {
          ctx.strokeRect(-16, -48, 32, 44);
          ctx.beginPath(); ctx.arc(8, -26, 2.6, 0, 6.283); ctx.stroke();
        } else if (cd.icon === "stamp") {
          ctx.strokeRect(-14, -52, 28, 12);
          ctx.beginPath(); ctx.moveTo(-10, -40); ctx.lineTo(-10, -30); ctx.lineTo(10, -30); ctx.lineTo(10, -40); ctx.stroke();
          ctx.fillStyle = C.cyan; ctx.fillRect(-16, -28, 32, 6);
        } else {
          ctx.beginPath(); ctx.moveTo(-18, -48); ctx.lineTo(18, -48); ctx.lineTo(-18, -14); ctx.lineTo(18, -14); ctx.stroke();
          ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(0, -10, 4, 0, 6.283); ctx.fill();
        }
        ctx.restore();
      }

      // all four collapse into POLICY
      const fold = K.ease(K.seq(t, 34.6, 35.4));
      if (fold > 0.01) {
        ctx.save();
        ctx.globalAlpha = 1 - fold;
        for (const cd of cards) {
          const x = K.lerp(cd.x, 430, fold), y = K.lerp(cd.y, 650, fold);
          ctx.fillStyle = "rgba(13,24,38,0.9)"; ctx.fillRect(x - 130, y - 75, 260, 150);
        }
        ctx.restore();
        tag(ctx, "POLICY, NOT MORALITY", 430, 520, t, 34.7, C.amber, { size: 24 });
        // halo above the folder goes out
        const h = rv(t, 34.9, 0.4) * (1 - rv(t, 35.5, 0.4));
        if (h > 0.01) {
          ctx.save(); ctx.globalAlpha = h;
          ctx.strokeStyle = C.amber; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.ellipse(430, 520, 70, 22, 0, 0, 6.283); ctx.stroke();
          ctx.restore();
        }
      }
      headline(ctx, "THE SMALL PRINT", t, 28.35, { size: 58 });
      sub(ctx, "terms · exceptions · licences · expiry", 104, 176, t, 28.7, { size: 26, color: "rgba(170,195,215,0.75)" });
      K.dust(ctx, t, 88, 26);
      K.vignette(ctx, 0.86);
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 8 · 35.99  positive law: wise or foolish ================= */
  S.push({
    t0: 35.99, t1: 40.23,
    draw(ctx, t) {
      const lt = t - 35.99;
      const cam = { zoom: 1.04, x: -30 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0C1726", bot: "#142335", floorY: 910 });
      // corridor receding: two walls, a split path
      ctx.fillStyle = "rgba(42,58,80,0.25)";
      ctx.beginPath(); ctx.moveTo(0, 910); ctx.lineTo(760, 880); ctx.lineTo(760, 430); ctx.lineTo(0, 250); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1920, 910); ctx.lineTo(1160, 880); ctx.lineTo(1160, 430); ctx.lineTo(1920, 250); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#0B1523";
      ctx.beginPath(); ctx.moveTo(760, 880); ctx.lineTo(1160, 880); ctx.lineTo(1160, 430); ctx.lineTo(760, 430); ctx.closePath(); ctx.fill();
      floorLine(ctx, 908);
      // path fork
      ctx.strokeStyle = "rgba(79,216,240,0.25)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(960, 910); ctx.lineTo(960, 760); ctx.moveTo(960, 760); ctx.lineTo(640, 560); ctx.moveTo(960, 760); ctx.lineTo(1280, 560); ctx.stroke();
      // signpost
      ctx.fillStyle = "#16243A"; ctx.fillRect(946, 380, 28, 460);
      ctx.fillStyle = "#2A3A50"; ctx.fillRect(930, 370, 60, 18);
      signArrow(ctx, 700, 520, 250, -1, "WISE", C.cyan, rv(t, 37.7, 0.4));
      signArrow(ctx, 1220, 520, 250, 1, "FOOLISH", C.coral, rv(t, 38.9, 0.4));
      // plate: POSITIVE LAW
      const pl = rv(t, 36.4, 0.45);
      if (pl > 0.01) {
        ctx.save(); ctx.globalAlpha = pl;
        ctx.translate(960, 440);
        K.rr(ctx, -190, -40, 380, 80, 12);
        ctx.fillStyle = "rgba(8,14,24,0.95)"; ctx.fill();
        ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke();
        K.text(ctx, "POSITIVE LAW", 0, 14, { size: 38, weight: 800, color: C.white, align: "center", tracking: 2 });
        ctx.restore();
      }
      // wall lamp over the fork
      lamp(ctx, 300, 300, 250);
      // figure at the fork
      const turn = K.ease(K.seq(t, 37.9, 39.2));
      K.figure(ctx, {
        x: 960, y: 930, s: 3.4, color: C.coral, rimColor: C.cyan, rimDir: -1,
        pose: { lean: 0, headX: -0.35 + 0.7 * turn, headTilt: 0.04, armL: [-0.2, -0.1], armR: [0.2, 0.1], brow: 0.3 },
      });
      headline(ctx, "POSITIVE LAW", t, 36.1, { size: 58 });
      sub(ctx, "can be wise or foolish", 104, 176, t, 38.7, { size: 26, color: "rgba(170,195,215,0.75)" });
      K.dust(ctx, t, 99, 22);
      K.vignette(ctx, 0.87);
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 9 · 40.23  piracy / stealing / marketing ================= */
  S.push({
    t0: 40.23, t1: 43.66,
    draw(ctx, t) {
      const lt = t - 40.23;
      const cam = { zoom: 1.02 + 0.04 * K.ease(K.seq(lt, 0, 3.4)), x: 10 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0A1320", bot: "#0F1B2B", floorY: 930 });
      // skyline
      ctx.save(); ctx.globalAlpha = 0.85;
      for (let i = 0; i < 14; i++) {
        const w = 80 + (i * 53) % 120, h = 150 + (i * 97) % 300, x = -40 + i * 150;
        ctx.fillStyle = "#0C1624"; ctx.fillRect(x, 900 - h, w, h);
        for (let k = 0; k < 6; k++) if ((i + k) % 3 === 0) { ctx.fillStyle = "rgba(242,178,92,0.35)"; ctx.fillRect(x + 18 + (k % 2) * 40, 900 - h + 30 + k * 40, 12, 16); }
      }
      ctx.restore();
      // scaffold + billboard
      ctx.fillStyle = "#101A29"; ctx.fillRect(300, 560, 24, 370); ctx.fillRect(1560, 560, 24, 370);
      ctx.fillStyle = "#16243A"; ctx.fillRect(260, 520, 1400, 420);
      ctx.strokeStyle = "#2A3A50"; ctx.lineWidth = 8; ctx.strokeRect(260, 520, 1400, 420);
      ctx.fillStyle = "rgba(10,18,32,0.95)"; ctx.fillRect(290, 550, 1340, 360);
      // neon signs
      const on1 = rv(t, 40.45, 0.25), on2 = rv(t, 42.15, 0.25), on3 = rv(t, 42.95, 0.3);
      const flick = (tt) => (tt > 0.01 ? 1 : 0) * (0.86 + 0.14 * Math.sin(t * 47));
      if (on1 > 0.01) {
        ctx.save();
        ctx.globalAlpha = flick(on1);
        ctx.shadowColor = C.coral; ctx.shadowBlur = 40;
        ctx.strokeStyle = C.coral; ctx.lineWidth = 4;
        K.text(ctx, "PIRACY", 700, 700, { size: 130, weight: 800, color: "rgba(232,96,60,0.9)", align: "center", tracking: 6 });
        ctx.restore();
      }
      if (on2 > 0.01) {
        ctx.save();
        ctx.globalAlpha = flick(on2);
        ctx.shadowColor = C.amber; ctx.shadowBlur = 40;
        K.text(ctx, "STEALING", 1220, 700, { size: 96, weight: 800, color: "rgba(242,178,92,0.9)", align: "center", tracking: 4 });
        ctx.restore();
      }
      // small sign
      if (on3 > 0.01) {
        ctx.save(); ctx.globalAlpha = on3;
        ctx.fillStyle = "rgba(10,18,32,0.95)"; ctx.fillRect(1390, 760, 220, 90);
        ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.strokeRect(1390, 760, 220, 90);
        K.text(ctx, "MARKETING", 1500, 818, { size: 30, weight: 800, color: C.cyan, align: "center", tracking: 2 });
        ctx.restore();
      }
      // lever + marketer
      ctx.fillStyle = "#16243A"; ctx.fillRect(1700, 860, 90, 70);
      ctx.fillStyle = "#2A3A50"; ctx.fillRect(1740, 800, 10, 70);
      ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(1745, 796, 12, 0, 6.283); ctx.fill();
      K.figure(ctx, {
        x: 1600, y: 940, s: 3.1, color: C.teal, rimColor: C.amber, rimDir: 1,
        pose: { lean: 0.15, armR: [0.95, 0.2], armL: [-0.3, 0.2], headX: 0.2, brow: 0.5, mouth: -0.2 },
      });
      headline(ctx, "THE WORDS", t, 40.35, { size: 58 });
      sub(ctx, "what the trade calls it", 104, 176, t, 41.0, { size: 26, color: "rgba(170,195,215,0.7)" });
      K.dust(ctx, t, 111, 18);
      K.vignette(ctx, 0.86);
      K.grain(ctx, 0.05, 0, 0);
    },
  });

  /* ================= 10 · 43.66  a label is not a fact ================= */
  S.push({
    t0: 43.66, t1: 47.45,
    draw(ctx, t) {
      const lt = t - 43.66;
      const cam = { zoom: 1.55 - 0.05 * K.ease(K.seq(lt, 0, 3.8)), x: 0, y: 40 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0B1421", bot: "#101C2C", floorY: 940 });
      floorLine(ctx, 938);
      // a music stand, close
      ctx.fillStyle = "#101A29"; ctx.fillRect(930, 720, 18, 220); ctx.fillRect(840, 900, 200, 14);
      ctx.strokeStyle = "#2A3A50"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(860, 720); ctx.lineTo(1010, 720); ctx.moveTo(860, 640); ctx.lineTo(860, 720); ctx.moveTo(1010, 640); ctx.lineTo(1010, 720); ctx.stroke();
      // sheet music
      ctx.save();
      ctx.translate(935, 640); ctx.rotate(-0.05);
      ctx.fillStyle = "#EADFC8"; ctx.fillRect(-170, -110, 340, 220);
      ctx.strokeStyle = "rgba(60,70,80,0.30)"; ctx.lineWidth = 1.4;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-150, -50 + i * 16); ctx.lineTo(150, -50 + i * 16); ctx.stroke(); }
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-150, 30 + i * 16); ctx.lineTo(150, 30 + i * 16); ctx.stroke(); }
      ctx.restore();
      // the song, glowing off the page
      notes(ctx, t, 940, 690, 4, 58, C.cyan, 0.95);
      // sticker slapped on
      const slap = K.ease(K.seq(t, 44.15, 44.35));
      const peel = K.ease(K.seq(t, 45.75, 46.35));
      if (slap > 0.01 && peel < 0.99) {
        ctx.save();
        ctx.globalAlpha = 1 - peel;
        ctx.translate(940 - peel * 260, 690 - peel * 180);
        ctx.rotate(-0.22 + Math.sin(t * 2) * 0.02 + peel * 0.9);
        ctx.scale(1 + (1 - slap) * 0.4, 1 + (1 - slap) * 0.4);
        ctx.fillStyle = "rgba(232,96,60,0.95)";
        K.rr(ctx, -140, -46, 280, 92, 10); ctx.fill();
        ctx.strokeStyle = "rgba(255,235,220,0.85)"; ctx.lineWidth = 3; ctx.stroke();
        K.text(ctx, "STEALING", 0, 14, { size: 44, weight: 800, color: "#1B0E0A", align: "center", tracking: 2 });
        ctx.restore();
      }
      if (t > 45.8) pool(ctx, 940, 690, 260, 110, "rgba(79,216,240,0.35)", rv(t, 45.8, 0.5));
      // freeze and point
      const dimA = rv(t, 44.7, 0.35) * (1 - rv(t, 45.5, 0.4));
      K.fade(ctx, dimA * 0.45);
      K.arrow(ctx, 1240, 520, 1075, 640, { color: C.cyan, alpha: dimA, w: 3 });
      tag(ctx, "A LABEL", 1290, 478, t, 44.85, C.cyan, { size: 26 });
      tag(ctx, "NOT A FACT", 1290, 560, t, 46.6, C.cyan, { size: 26 });
      headline(ctx, "A LABEL ISN'T A FACT", t, 43.8, { size: 56 });
      K.dust(ctx, t, 122, 16);
      K.vignette(ctx, 0.9);
      K.grain(ctx, 0.05, 0, 0);
    },
  });

  /* ================= 11 · 47.45  rules change, countries differ ================= */
  S.push({
    t0: 47.45, t1: 54.40,
    draw(ctx, t) {
      const cam = { zoom: 1.02, x: 430 * K.ease(K.seq(t, 51.3, 52.7)) };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0C1726", bot: "#142234", floorY: 905 });
      floorLine(ctx, 903);
      // library shelves, left
      for (let r = 0; r < 4; r++) {
        const yy = 320 + r * 150;
        ctx.fillStyle = "#16243A"; ctx.fillRect(40, yy, 780, 14);
        for (let i = 0; i < 16; i++) {
          const hh = 76 + ((i * 41 + r * 17) % 34);
          ctx.fillStyle = ["#2A3A50", "#3A4F6B", "#4A3527", "#26404A", "#4A2A30"][(i + r) % 5];
          ctx.fillRect(52 + i * 48, yy - hh, 38, hh);
          ctx.fillStyle = "rgba(242,178,92,0.22)"; ctx.fillRect(52 + i * 48, yy - hh + 8, 38, 3);
        }
      }
      // desk + calendar pad
      desk(ctx, 260, 760, 520);
      ctx.save();
      ctx.translate(420, 690);
      ctx.fillStyle = "#EADFC8"; ctx.fillRect(-110, -80, 220, 150);
      ctx.fillStyle = "rgba(60,50,40,0.22)";
      for (let i = 0; i < 6; i++) ctx.fillRect(-86, -40 + i * 18, 172, 4);
      ctx.fillStyle = "#8A6A3E"; ctx.fillRect(-110, -80, 220, 16);
      ctx.fillStyle = "#22334A";
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-72 + i * 48, -80, 7, 0, 6.283); ctx.fill(); }
      ctx.restore();
      // clock on the wall
      const clockX = 700, clockY = 250;
      ctx.fillStyle = "rgba(10,18,32,0.9)"; ctx.beginPath(); ctx.arc(clockX, clockY, 58, 0, 6.283); ctx.fill();
      ctx.strokeStyle = "rgba(242,178,92,0.75)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(clockX, clockY, 58, 0, 6.283); ctx.stroke();
      const spin = K.ease(K.seq(t, 50.2, 53.6));
      for (const [len, wdt, sp] of [[36, 6, 1], [48, 4, 1.6]]) {
        const an = -Math.PI / 2 + spin * 14 * sp;
        ctx.strokeStyle = sp === 1 ? C.white : C.cyan; ctx.lineWidth = wdt;
        ctx.beginPath(); ctx.moveTo(clockX, clockY); ctx.lineTo(clockX + Math.cos(an) * len, clockY + Math.sin(an) * len); ctx.stroke();
      }
      // decade pages flying off the pad
      for (let i = 0; i < 4; i++) {
        const p = K.soft(K.seq(t, 49.0 + i * 1.05, 49.6 + i * 1.05));
        if (p <= 0 || p >= 1) continue;
        ctx.save();
        ctx.globalAlpha = Math.sin(p * Math.PI) * 0.9;
        ctx.translate(430 + p * 300, 660 - p * 240);
        ctx.rotate(p * 1.2);
        ctx.fillStyle = "#EADFC8"; ctx.fillRect(-52, -34, 104, 68);
        ctx.restore();
      }
      tag(ctx, "DECADES", 760, 560, t, 49.0, C.amber, { size: 26 });

      // map wall, right
      const mapX = 1400, mapY = 480;
      if (t > 51.9) {
        const mp = rv(t, 51.9, 0.5);
        ctx.save(); ctx.globalAlpha = 0.9 * mp;
        K.rr(ctx, mapX - 340, mapY - 260, 680, 520, 18);
        ctx.fillStyle = "#0D1B2B"; ctx.fill();
        ctx.strokeStyle = "rgba(79,216,240,0.28)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = "rgba(79,216,240,0.10)"; ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(mapX - 330, mapY - 250 + i * 86); ctx.lineTo(mapX + 330, mapY - 250 + i * 86); ctx.stroke(); }
        for (let i = 1; i < 7; i++) { ctx.beginPath(); ctx.moveTo(mapX - 340 + i * 110, mapY - 260); ctx.lineTo(mapX - 340 + i * 110, mapY + 260); ctx.stroke(); }
        ctx.fillStyle = "rgba(79,216,240,0.20)";
        const blobs = [[-190, -100, 150, 60], [-40, 50, 110, 80], [100, -140, 130, 50], [180, 80, 90, 100], [-140, 140, 80, 50]];
        for (const [bx, by, bw, bh] of blobs) {
          for (let k = 0; k < 9; k++) {
            const rr = K.rng(k + bx * 3 + by);
            ctx.beginPath(); ctx.ellipse(mapX + bx + (rr() - 0.5) * bw, mapY + by + (rr() - 0.5) * bh, 5 + rr() * 10, 5 + rr() * 10, 0, 0, 6.283); ctx.fill();
          }
        }
        ctx.restore();
        const pins = [[-170, -60, "A"], [40, 70, "B"], [180, -90, "C"]];
        pins.forEach(([px, py, lab], i) => {
          const pp = rv(t, 52.0 + i * 0.25, 0.35);
          if (pp <= 0.01) return;
          ctx.save(); ctx.globalAlpha = pp;
          const X = mapX + px, Y = mapY + py;
          ctx.strokeStyle = C.amber; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, Y - 66); ctx.stroke();
          ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(X, Y, 7, 0, 6.283); ctx.fill();
          ctx.fillStyle = "rgba(10,18,32,0.95)"; ctx.fillRect(X - 48, Y - 112, 96, 46);
          ctx.strokeStyle = "rgba(242,178,92,0.7)"; ctx.lineWidth = 2; ctx.strokeRect(X - 48, Y - 112, 96, 46);
          K.text(ctx, lab, X, Y - 81, { size: 26, weight: 800, color: C.white, align: "center" });
          ctx.fillStyle = "rgba(79,216,240,0.85)"; ctx.fillRect(X - 36, Y - 128, 20 + i * 10, 8);
          ctx.restore();
        });
        tag(ctx, "COUNTRY TO COUNTRY", mapX, mapY + 330, t, 53.4, C.cyan, { size: 24 });
      }
      // globe filler at the right edge after the pan
      ctx.save(); ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#101A29"; ctx.fillRect(1830, 760, 160, 20);
      ctx.fillStyle = "#1B2A3D"; ctx.fillRect(1892, 600, 12, 160);
      ctx.beginPath(); ctx.arc(1898, 560, 78, 0, 6.283); ctx.fillStyle = "#0D1B2B"; ctx.fill();
      ctx.strokeStyle = "rgba(79,216,240,0.35)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(1898, 560, 82, 30, 0, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(1898, 560, 34, 78, 0, 0, 6.283); ctx.stroke();
      ctx.restore();
      headline(ctx, "RULES CHANGE", t, 47.6, { size: 58 });
      sub(ctx, "decades, and borders", 104, 176, t, 48.7, { size: 26, color: "rgba(170,195,215,0.72)" });
      K.dust(ctx, t, 133, 24);
      K.vignette(ctx, 0.87);
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 12 · 54.40  the real moral duties ================= */
  S.push({
    t0: 54.40, t1: 60.62,
    draw(ctx, t) {
      const lt = t - 54.40;
      const cam = { zoom: 1.02 + 0.04 * K.ease(K.seq(lt, 0, 6.2)), x: 0 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0B1626", bot: "#121F30", floorY: 930 });
      // dark hall, three light shafts
      floorLine(ctx, 928);
      const lit = [
        { x: 520, at: B.word(11, "defraud") - 0.15, label: "DON'T DEFRAUD", icon: "mask" },
        { x: 960, at: B.word(11, "contracts") - 0.12, label: "HONOR CONTRACTS", icon: "hand" },
        { x: 1400, at: B.word(11, "another's") - 0.12, label: "DON'T CLAIM", icon: "pen" },
      ];
      lit.forEach((L, i) => {
        const p = rv(t, L.at, 0.45);
        const a = 0.28 + 0.72 * p;
        if (p > 0.01) {
          const g = ctx.createLinearGradient(L.x, 120, L.x, 800);
          g.addColorStop(0, "rgba(200,225,245," + 0.16 * p + ")");
          g.addColorStop(1, "rgba(200,225,245,0)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.moveTo(L.x - 90, 120); ctx.lineTo(L.x + 90, 120); ctx.lineTo(L.x + 150, 800); ctx.lineTo(L.x - 150, 800); ctx.closePath(); ctx.fill();
        }
        tablet(ctx, L.x, 800, 280, 420, null, p > 0.5 ? C.cyan : null, a);
        const parts = L.label.split(" ");
        const lc = p > 0.5 ? C.white : "rgba(200,220,238,0.55)";
        K.text(ctx, parts[0], L.x, 552, { size: 27, weight: 800, color: lc, align: "center", tracking: 1, shadow: true });
        K.text(ctx, parts.slice(1).join(" "), L.x, 586, { size: 27, weight: 800, color: lc, align: "center", tracking: 1, shadow: true });
        // icon above the text
        ctx.save();
        ctx.translate(L.x, 660); ctx.strokeStyle = p > 0.5 ? C.cyan : "rgba(150,175,200,0.5)"; ctx.lineWidth = 4; ctx.lineCap = "round";
        if (L.icon === "mask") {
          // a coin pushed away
          ctx.beginPath(); ctx.arc(0, 0, 24, 0, 6.283); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-34, 30); ctx.lineTo(34, -30); ctx.stroke();
        } else if (L.icon === "hand") {
          // two hands meeting
          ctx.beginPath(); ctx.moveTo(-34, 6); ctx.lineTo(-8, -14); ctx.lineTo(4, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(34, 6); ctx.lineTo(8, -14); ctx.lineTo(-4, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-16, 20); ctx.lineTo(16, 20); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(-26, 22); ctx.lineTo(10, -22); ctx.lineTo(26, -8); ctx.lineTo(-10, 30); ctx.closePath(); ctx.stroke();
        }
        ctx.restore();
      });
      headline(ctx, "THE REAL DUTIES", t, 54.55, { size: 58 });
      sub(ctx, "commanded, not granted", 104, 176, t, 56.0, { size: 26, color: "rgba(170,195,215,0.72)" });
      K.dust(ctx, t, 144, 22);
      K.vignette(ctx, 0.88);
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 13 · 60.62  those are commanded ================= */
  S.push({
    t0: 60.62, t1: 61.78,
    draw(ctx, t) {
      const lt = t - 60.62;
      const cam = { zoom: 1.0 + 0.025 * K.ease(K.seq(lt, 0, 1.16)), x: 0 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0C1828", bot: "#131F31", floorY: 930 });
      floorLine(ctx, 928);
      // the three tablets now blaze together
      for (const x of [520, 960, 1400]) {
        const g = ctx.createLinearGradient(x, 90, x, 830);
        g.addColorStop(0, "rgba(210,232,250,0.26)"); g.addColorStop(1, "rgba(210,232,250,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x - 100, 90); ctx.lineTo(x + 100, 90); ctx.lineTo(x + 160, 830); ctx.lineTo(x - 160, 830); ctx.closePath(); ctx.fill();
        tablet(ctx, x, 800, 280, 420, null, C.cyan, 1);
        pool(ctx, x, 300, 240, 320, "rgba(79,216,240,0.22)", 0.9);
      }
      ctx.save();
      for (const L of [["DON'T", "DEFRAUD", 520], ["HONOR", "CONTRACTS", 960], ["DON'T", "CLAIM", 1400]]) {
        K.text(ctx, L[0], L[2], 700, { size: 30, weight: 800, color: "rgba(235,245,252,0.95)", align: "center", tracking: 1, shadow: true });
        K.text(ctx, L[1], L[2], 740, { size: 30, weight: 800, color: "rgba(235,245,252,0.95)", align: "center", tracking: 1, shadow: true });
      }
      ctx.restore();
      const p = rv(t, 60.72, 0.4);
      ctx.save(); ctx.globalAlpha = p;
      K.text(ctx, "COMMANDED", 960, 300, { size: 78, weight: 800, color: C.white, align: "center", tracking: 7, shadow: true, glow: C.cyan, blur: 30 });
      ctx.restore();
      K.dust(ctx, t, 155, 18);
      K.vignette(ctx, 0.9);
      K.grain(ctx, 0.05, 0, 0);
    },
  });

  /* ================= 14 · 61.78  a bargain dressed as morality ================= */
  S.push({
    t0: 61.78, t1: 65.53,
    draw(ctx, t) {
      const lt = t - 61.78;
      const cam = { zoom: 1.04 + 0.05 * K.ease(K.seq(lt, 2.8, 3.7)), x: 0, y: 10 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0C1726", bot: "#16263B", floorY: 920 });
      archWindow(ctx, 1460, 200, 200, 400, 0.5);
      floorLine(ctx, 918);
      // tailor's stand
      ctx.fillStyle = "#101A29"; ctx.fillRect(930, 760, 20, 160); ctx.fillRect(840, 900, 200, 16);
      ctx.fillStyle = "#1B2A3D"; ctx.beginPath(); ctx.ellipse(940, 762, 130, 26, 0, 0, 6.283); ctx.fill();
      // the contract
      certificate(ctx, 940, 600, 200, 0, 1);
      ctx.save();
      ctx.fillStyle = "#8A6A3E"; ctx.fillRect(900, 470, 80, 26);
      ctx.restore();
      // robe drops over it
      const drop = K.ease(K.seq(t, 63.4, 64.2));
      const lift = K.ease(K.seq(t, 64.5, 65.0));
      if (drop > 0.01) {
        ctx.save();
        ctx.translate(940, 420 + (1 - drop) * -120);
        ctx.globalAlpha = 1;
        const g = ctx.createLinearGradient(-160, 0, 160, 0);
        g.addColorStop(0, "#101A29"); g.addColorStop(0.45, "#1C2B3E"); g.addColorStop(1, "#0A1220");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-118, 0); ctx.lineTo(118, 0); ctx.lineTo(150, 120); ctx.lineTo(178, 330);
        ctx.lineTo(80, 350); ctx.lineTo(0, 330); ctx.lineTo(-80, 350); ctx.lineTo(-178, 330);
        ctx.lineTo(-150, 120); ctx.closePath(); ctx.fill();
        // collar
        ctx.fillStyle = "#EADFC8";
        ctx.beginPath(); ctx.moveTo(-40, 2); ctx.lineTo(0, 46); ctx.lineTo(40, 2); ctx.lineTo(22, -10); ctx.lineTo(0, 18); ctx.lineTo(-22, -10); ctx.closePath(); ctx.fill();
        // hem lifts, fine print
        ctx.save();
        ctx.translate(0, 330 - lift * 60);
        ctx.fillStyle = "#EADFC8";
        ctx.fillRect(-140, 0, 280, 34 + lift * 40);
        ctx.fillStyle = "rgba(60,50,40,0.55)";
        for (let i = 0; i < 5; i++) ctx.fillRect(-120, 10 + i * 9, 220, 3);
        ctx.restore();
        ctx.restore();
        if (lift > 0.2) tag(ctx, "TERMS", 940, 768, t, 64.55, C.cyan, { size: 22 });
      }
      headline(ctx, "DRESSED AS MORALITY", t, 61.95, { size: 54 });
      sub(ctx, "the rest is a legal bargain", 104, 176, t, 62.6, { size: 26, color: "rgba(170,195,215,0.72)" });
      K.dust(ctx, t, 166, 22);
      K.vignette(ctx, 0.87);
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 15 · 65.53  limited grant / cannot make sin ================= */
  S.push({
    t0: 65.53, t1: 69.90,
    draw(ctx, t) {
      const lt = t - 65.53;
      const cam = { zoom: 1.02, x: 0 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0D1826", bot: "#152335", floorY: 905 });
      wallPanels(ctx, 120, 905, 9, "rgba(42,58,80,0.22)");
      floorLine(ctx, 903);
      lamp(ctx, 960, 120, 80);
      // press A: stamps LIMITED
      const a = K.ease(K.seq(t, 66.05, 66.55));
      press(ctx, 560, 900, (1 - a) * 140, { impact: a > 0.96 ? 0.8 : 0, wheel: a * 0.7 });
      if (t > 66.5) {
        ctx.save(); ctx.globalAlpha = rv(t, 66.5, 0.3);
        K.text(ctx, "LIMITED", 560, 844, { size: 24, weight: 800, color: "#1B0E0A", align: "center", tracking: 2 });
        ctx.restore();
        tag(ctx, "A LIMITED GRANT", 560, 360, t, 66.6, C.cyan, { size: 24 });
      }
      // press B: blank die
      const b = K.ease(K.seq(t, 68.3, 68.85));
      press(ctx, 1360, 900, (1 - b) * 170, { impact: 0, wheel: b * 0.9 });
      if (t > 68.85) {
        // nothing printed: an outline of the word, then it goes
        const o = rv(t, 68.9, 0.2) * (1 - rv(t, 69.5, 0.35));
        if (o > 0.01) {
          ctx.save(); ctx.globalAlpha = o;
          K.setFont(ctx, 30, 800); ctx.textAlign = "center"; ctx.letterSpacing = "3px";
          ctx.strokeStyle = C.coral; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
          ctx.strokeText("SIN", 1360, 840);
          ctx.setLineDash([]);
          ctx.restore();
        }
        tag(ctx, "NO SIN", 1360, 520, t, 69.55, C.coral, { size: 26 });
      }
      // the state's press room sign
      ctx.save();
      K.rr(ctx, 830, 210, 260, 64, 10);
      ctx.fillStyle = "rgba(8,14,24,0.9)"; ctx.fill();
      ctx.strokeStyle = "rgba(242,178,92,0.55)"; ctx.lineWidth = 2; ctx.stroke();
      K.text(ctx, "THE STATE", 960, 254, { size: 28, weight: 800, color: "rgba(242,178,92,0.85)", align: "center", tracking: 4 });
      ctx.restore();
      headline(ctx, "LIMITED GRANT", t, 65.7, { size: 58 });
      sub(ctx, "the state can grant; it cannot sanctify", 104, 176, t, 67.4, { size: 26, color: "rgba(170,195,215,0.7)" });
      K.dust(ctx, t, 177, 20);
      K.vignette(ctx, 0.88);
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 16 · 69.90  baptizing a statutory monopoly ================= */
  S.push({
    t0: 69.90, t1: 73.22,
    draw(ctx, t) {
      const lt = t - 69.90;
      const cam = { zoom: 1.05 + 0.03 * K.ease(K.seq(lt, 0, 3.3)), x: -40 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0C1726", bot: "#142233", floorY: 920 });
      floorLine(ctx, 918);
      // stone basin
      ctx.fillStyle = "#1B2A3D";
      ctx.beginPath(); ctx.moveTo(700, 720); ctx.quadraticCurveTo(880, 800, 1060, 720); ctx.lineTo(1030, 900); ctx.lineTo(730, 900); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#22334A";
      ctx.beginPath(); ctx.ellipse(880, 720, 180, 40, 0, 0, 6.283); ctx.fill();
      const sh = 0.5 + 0.5 * Math.sin(t * 2.4);
      ctx.fillStyle = "rgba(79,216,240,0.30)";
      ctx.beginPath(); ctx.ellipse(880, 724, 162, 30, 0, 0, 6.283); ctx.fill();
      ctx.strokeStyle = "rgba(150,235,250," + (0.35 + 0.3 * sh) + ")"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(880, 724, 108 + sh * 28, 20 + sh * 5, 0, 0, 6.283); ctx.stroke();
      pool(ctx, 880, 718, 280, 110, "rgba(79,216,240,0.35)", 0.9);

      // plaque on its stand
      ctx.fillStyle = "#101A29"; ctx.fillRect(1284, 470, 14, 450); ctx.fillRect(1214, 904, 160, 14);
      const plaqueY = 400;
      ctx.save();
      ctx.translate(1291, plaqueY);
      K.rr(ctx, -160, -96, 320, 192, 12);
      ctx.fillStyle = "rgba(8,14,24,0.96)"; ctx.fill();
      ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke();
      K.text(ctx, "MONOPOLY", 0, 2, { size: 38, weight: 800, color: C.white, align: "center", tracking: 2 });
      K.text(ctx, "statutory", 0, 44, { size: 22, weight: 700, color: "rgba(242,178,92,0.75)", align: "center", tracking: 2 });
      ctx.restore();

      // a hand pours from above
      ctx.save();
      ctx.strokeStyle = "#0B111B"; ctx.lineWidth = 34; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(1120, -40); ctx.lineTo(1150, 170); ctx.stroke();
      ctx.fillStyle = "#0B111B"; ctx.beginPath(); ctx.arc(1152, 186, 26, 0, 6.283); ctx.fill();
      ctx.translate(1176, 210); ctx.rotate(-0.35);
      ctx.fillStyle = "#22334A";
      K.rr(ctx, -44, -48, 88, 90, 14); ctx.fill();
      ctx.fillStyle = "#2C3E56";
      ctx.beginPath(); ctx.moveTo(38, -30); ctx.lineTo(84, -14); ctx.lineTo(38, 2); ctx.closePath(); ctx.fill();
      ctx.restore();
      const pour = rv(t, 70.6, 0.4);
      if (pour > 0.01) {
        ctx.save(); ctx.globalAlpha = 0.75 * pour;
        ctx.strokeStyle = "rgba(150,235,250,0.85)"; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(1214, 196); ctx.quadraticCurveTo(1230, 250, 1240, 310); ctx.stroke();
        ctx.restore();
      }
      const drops = rv(t, 70.9, 1.6);
      if (drops > 0 && drops < 1) {
        for (let i = 0; i < 8; i++) {
          const p = (drops * 1.5 + i * 0.12) % 1;
          const x = 1240 + Math.sin(i) * 10, y = 312 + p * 150;
          ctx.fillStyle = "rgba(150,235,250," + (0.85 - p * 0.7) + ")";
          ctx.beginPath(); ctx.ellipse(x, y, 3.2, 7 + p * 3, 0, 0, 6.283); ctx.fill();
        }
      }
      if (t > 72.25) {
        ctx.save(); ctx.globalAlpha = rv(t, 72.25, 0.4);
        const gp = ctx.createLinearGradient(1140, 330, 1400, 500);
        gp.addColorStop(0, "rgba(150,235,250,0)"); gp.addColorStop(0.5, "rgba(150,235,250,0.32)"); gp.addColorStop(1, "rgba(150,235,250,0)");
        ctx.fillStyle = gp; ctx.fillRect(1140, 320, 320, 180);
        ctx.restore();
        tag(ctx, "RIGHTEOUSNESS?", 1291, 280, t, 72.4, C.cyan, { size: 24 });
      }
      headline(ctx, "NOT A SACRAMENT", t, 70.1, { size: 56 });
      K.dust(ctx, t, 188, 24);
      K.vignette(ctx, 0.88);
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 17 · 73.22  prudent, not holy ================= */
  S.push({
    t0: 73.22, t1: 75.05,
    draw(ctx, t) {
      const lt = t - 73.22;
      const cam = { zoom: 1.04 + 0.03 * K.ease(K.seq(lt, 0, 1.8)), x: 0, y: 16 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0D1A29", bot: "#18293B", floorY: 900 });
      floorLine(ctx, 898);
      // workshop bench
      desk(ctx, 420, 760, 1080, "#2A2018");
      // tools: level, clamp, small lock, toolbox
      ctx.save();
      ctx.translate(640, 740); ctx.rotate(-0.03);
      ctx.fillStyle = "#22334A"; ctx.fillRect(-150, -16, 300, 30);
      ctx.fillStyle = "rgba(79,216,240,0.65)"; ctx.fillRect(-40, -10, 80, 18);
      ctx.restore();
      ctx.save();
      ctx.translate(1080, 720);
      ctx.fillStyle = "#3A2A20"; ctx.fillRect(-90, -70, 180, 70);
      ctx.fillStyle = "#5A4030"; ctx.fillRect(-90, -70, 180, 10);
      ctx.fillStyle = "#8FA7BD"; ctx.fillRect(-14, -34, 28, 24);
      ctx.restore();
      ctx.save();
      ctx.translate(860, 750);
      ctx.strokeStyle = "#8FA7BD"; ctx.lineWidth = 6; ctx.strokeRect(-26, -30, 52, 48);
      ctx.beginPath(); ctx.arc(0, -30, 16, Math.PI, 0); ctx.stroke();
      ctx.restore();
      // the plaque on the bench
      ctx.save();
      ctx.translate(900, 660);
      K.rr(ctx, -150, -90, 300, 180, 12);
      ctx.fillStyle = "rgba(8,14,24,0.96)"; ctx.fill();
      ctx.strokeStyle = "rgba(242,178,92,0.65)"; ctx.lineWidth = 3; ctx.stroke();
      K.text(ctx, "COPYRIGHT", 0, -6, { size: 36, weight: 800, color: C.white, align: "center", tracking: 2 });
      K.text(ctx, "a limited grant", 0, 38, { size: 20, weight: 700, color: "rgba(200,220,238,0.6)", align: "center" });
      ctx.restore();
      // warm lamp
      lamp(ctx, 300, 380, 380);
      cone(ctx, 300, 432, 500, 470, 0.5);
      // PRUDENT stamp
      const st = K.ease(K.seq(t, 74.3, 74.45));
      if (st > 0.01) {
        ctx.save();
        ctx.globalAlpha = st;
        ctx.translate(900, 560); ctx.rotate(-0.07);
        ctx.strokeStyle = C.amber; ctx.lineWidth = 4;
        ctx.strokeRect(-118, -26, 236, 52);
        K.text(ctx, "PRUDENT", 0, 12, { size: 34, weight: 800, color: C.amber, align: "center", tracking: 3 });
        ctx.restore();
      }
      headline(ctx, "PRUDENT", t, 73.35, { size: 58 });
      sub(ctx, "a reasonable bargain, not a sacred one", 104, 176, t, 73.8, { size: 26, color: "rgba(170,195,215,0.72)" });
      K.dust(ctx, t, 199, 20);
      K.vignette(ctx, 0.85);
      K.grain(ctx, 0.045, 0, 0);
    },
  });

  /* ================= 18 · 75.05  it is not holy ================= */
  S.push({
    t0: 75.05, t1: 76.80,
    draw(ctx, t) {
      const lt = t - 75.05;
      const cam = { zoom: 1.18 - 0.02 * K.ease(K.seq(lt, 0, 1.75)), x: 0, y: 26 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0B1523", bot: "#101C2C", floorY: 940 });
      floorLine(ctx, 938);
      desk(ctx, 240, 800, 1240, "#2A2018");
      lamp(ctx, 420, 420, 360);
      // plaque close
      ctx.save();
      ctx.translate(930, 640);
      K.rr(ctx, -230, -140, 460, 280, 16);
      ctx.fillStyle = "rgba(8,14,24,0.97)"; ctx.fill();
      ctx.strokeStyle = "rgba(242,178,92,0.55)"; ctx.lineWidth = 3; ctx.stroke();
      K.text(ctx, "COPYRIGHT", 0, -20, { size: 54, weight: 800, color: C.white, align: "center", tracking: 3 });
      K.text(ctx, "a limited grant", 5, 44, { size: 26, weight: 700, color: "rgba(200,220,238,0.6)", align: "center" });
      ctx.restore();
      // the wire halo behind the plaque, and it switches off
      const on = 1 - K.ease(K.seq(t, 75.86, 76.1));
      ctx.save();
      ctx.globalAlpha = 0.2 + 0.8 * on;
      ctx.strokeStyle = on > 0.05 ? C.amber : "rgba(120,140,160,0.5)";
      ctx.lineWidth = 7;
      if (on > 0.05) { ctx.shadowColor = C.amber; ctx.shadowBlur = 40 * on; }
      ctx.beginPath(); ctx.ellipse(930, 440, 150, 46, 0, 0, 6.283); ctx.stroke();
      ctx.restore();
      // the wire is visible after the light dies
      if (on < 0.2) {
        ctx.save(); ctx.globalAlpha = 0.45;
        ctx.strokeStyle = "rgba(150,170,190,0.7)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(830, 470); ctx.lineTo(830, 520); ctx.stroke();
        ctx.restore();
      }
      headline(ctx, "NOT HOLY", t, 75.1, { size: 62, color: C.coral, accent: C.coral });
      K.dust(ctx, t, 210, 18);
      K.vignette(ctx, 0.9);
      K.fade(ctx, K.clamp01(K.seq(t, 76.34, 76.78)) * 0.95);
      K.grain(ctx, 0.05, 0, 0);
    },
  });

  window.drawAt = function (ctx, t) {
    ctx.save();
    ctx.fillStyle = "#05080D"; ctx.fillRect(0, 0, 1920, 1080);
    let sc = null;
    for (const s of S) if (t >= s.t0 && t < s.t1) { sc = s; break; }
    if (!sc) sc = t < S[0].t0 ? S[0] : S[S.length - 1];
    ctx.save();
    sc.draw(ctx, Math.max(sc.t0, Math.min(t, sc.t1 - 0.001)), t);
    ctx.restore();
    ctx.restore();
    return sc;
  };
})();
