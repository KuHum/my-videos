/* Scenes — one function per beat, all driven by the timing map. */
(function () {
  const K = window.K, C = K.C, B = window.B;
  const S = (window.SCENES = []);

  /* ---------- shared framing helpers ---------- */
  function headline(ctx, txt, t, at, o) {
    o = o || {};
    const p = K.easeOut(K.seq(t, at, at + 0.55));
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha = p * (o.alpha == null ? 0.96 : o.alpha);
    const y = 128 + (1 - p) * 10;
    K.text(ctx, txt, 100, y, { size: o.size || 62, weight: 800, color: C.white, tracking: 0.5, shadow: true });
    const w = K.textWidth(ctx, txt, o.size || 62, 800, 0.5);
    ctx.fillStyle = o.accent || C.cyan;
    ctx.globalAlpha = p * 0.9;
    ctx.fillRect(102, y + 22, Math.min(w, 74) * p, 4);
    ctx.restore();
  }
  function labelTo(ctx, txt, x, y, t, at, color) {
    const p = K.easeOut(K.seq(t, at, at + 0.45));
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha = p;
    K.badge(ctx, x, y, txt, { color: color || C.cyan, size: 26, scale: 0.88 + 0.12 * p, alpha: p });
    ctx.restore();
  }
  function skirting(ctx, y, color) {
    ctx.fillStyle = color || "rgba(42,58,80,0.55)";
    ctx.fillRect(-40, y, 2000, 3);
  }
  function floorReflect(ctx, x, w, y, h, color, alpha) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h); ctx.restore();
  }
  function cone(ctx, x, y, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "rgba(242,178,92,0.20)");
    g.addColorStop(1, "rgba(242,178,92,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x + 40, y); ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x - w / 2, y + h); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ---------- 1 · AI is no longer science fiction ---------- */
  S.push({
    t0: 0.0, t1: 1.97,
    draw(ctx, t) {
      const lt = t - this.t0;
      const cam = { zoom: 1.04 + 0.07 * K.ease(K.seq(lt, 0, 1.97)), y: -4 };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0E1A2B", bot: "#17283C", floorY: 880 });
      skirting(ctx, 838);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? "rgba(42,58,80,0.22)" : "rgba(42,58,80,0.10)";
        ctx.fillRect(60 + i * 250, 90, 5, 748);
      }

      // framed "science fiction" poster
      const pf = 1 - K.soft(K.seq(lt, 1.28, 1.88));
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * pf;
      ctx.fillStyle = "#101E2F"; ctx.fillRect(1200, 246, 330, 450);
      ctx.strokeStyle = "rgba(58,80,108,0.95)"; ctx.lineWidth = 4; ctx.strokeRect(1200, 246, 330, 450);
      ctx.save(); ctx.translate(1365, 470);
      ctx.strokeStyle = "rgba(120,190,220,0.55)"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
      // rocket, line art
      ctx.beginPath();
      ctx.moveTo(0, -150); ctx.lineTo(26, -86); ctx.lineTo(26, 40); ctx.lineTo(-26, 40); ctx.lineTo(-26, -86); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-26, -24); ctx.lineTo(-62, 30); ctx.lineTo(-26, 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26, -24); ctx.lineTo(62, 30); ctx.lineTo(26, 22); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -96, 20, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, 46); ctx.lineTo(-4, 86); ctx.moveTo(14, 46); ctx.lineTo(4, 86); ctx.stroke();
      // orbit line + stars
      ctx.globalAlpha *= 0.6;
      ctx.strokeStyle = "rgba(120,190,220,0.30)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, -40, 128, 44, -0.35, 0, 6.283); ctx.stroke();
      ctx.fillStyle = "rgba(170,210,235,0.65)";
      for (const [sx, sy, r] of [[-96, -118, 2.2], [92, 96, 2.6], [104, -12, 2.0], [-108, 60, 1.8]]) { K.circle(ctx, sx, sy, r); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = "rgba(58,80,108,0.8)"; ctx.fillRect(1230, 612, 270, 9); ctx.fillRect(1230, 634, 170, 7);
      ctx.restore();

      // desk
      ctx.fillStyle = "#0B1420"; ctx.fillRect(1180, 742, 0, 0);
      ctx.fillStyle = "#0C1624"; ctx.fillRect(456, 742, 704, 18);
      ctx.fillStyle = "rgba(42,58,80,0.35)"; ctx.fillRect(456, 742, 704, 4);
      ctx.fillStyle = "#0A1220";
      ctx.fillRect(496, 760, 16, 120); ctx.fillRect(1104, 760, 16, 120);
      ctx.fillRect(500, 796, 620, 8);

      // monitor
      const mx = 862, my = 612;
      ctx.fillStyle = "#0A1220";
      K.rr(ctx, mx - 46, 700, 92, 14, 4); ctx.fill();
      ctx.fillRect(mx - 10, 676, 20, 28);
      ctx.save();
      ctx.translate(mx, my); ctx.rotate(-0.03);
      ctx.fillStyle = "#080F18"; K.rr(ctx, -158, -104, 316, 208, 12); ctx.fill();
      const lit = 0.4 + 0.6 * K.soft(K.seq(lt, 0.1, 0.85));
      const sg = ctx.createLinearGradient(-140, -88, 140, 88);
      sg.addColorStop(0, "rgba(26,64,86," + (0.5 * lit) + ")");
      sg.addColorStop(1, "rgba(10,26,40," + (0.95 * lit) + ")");
      ctx.fillStyle = sg; K.rr(ctx, -142, -88, 284, 176, 7); ctx.fill();
      // fiction glyph, alive at first
      const ra = (1 - K.soft(K.seq(lt, 0.95, 1.45))) * lit;
      if (ra > 0.01) {
        ctx.globalAlpha = ra;
        ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(0, -50); ctx.lineTo(22, 4); ctx.lineTo(8, 4); ctx.lineTo(8, 32); ctx.lineTo(-8, 32);
        ctx.lineTo(-8, 4); ctx.lineTo(-22, 4); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(-7, 52); ctx.moveTo(0, 32); ctx.lineTo(7, 52); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // reality: calm data grid
      const ga = K.soft(K.seq(lt, 1.12, 1.72));
      if (ga > 0.01) {
        ctx.globalAlpha = ga * lit;
        ctx.strokeStyle = "rgba(79,216,240,0.28)"; ctx.lineWidth = 1.5;
        for (let i = 0; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(-124, -72 + i * 24); ctx.lineTo(124, -72 + i * 24); ctx.stroke(); }
        for (let i = 0; i <= 9; i++) { ctx.beginPath(); ctx.moveTo(-126 + i * 28, -76); ctx.lineTo(-126 + i * 28, 74); ctx.stroke(); }
        for (let i = 0; i < 5; i++) {
          const ph = (lt * 0.7 + i * 0.19) % 1;
          ctx.fillStyle = C.cyan; ctx.globalAlpha = ga * lit * (0.95 - ph * 0.7);
          K.circle(ctx, -110 + i * 54 + ph * 30, -58 + i * 30, 3.6); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      K.glow(ctx, mx, my + 20, 340, "rgba(79,216,240,0.11)", 1);
      K.glow(ctx, mx, my + 20, 190, "rgba(79,216,240,0.16)", 1);
      // screen spill on the desk
      floorReflect(ctx, mx - 150, 300, 760, 60, "rgba(79,216,240,0.10)", 1);

      const pose = K.mix(0, { lean: 0.05, armR: [0.42, 0.3], armL: [-0.1, 0.0], headX: 0.08 },
        1, { lean: 0.14, armR: [0.92, 0.34], armL: [-0.22, -0.12], headX: 0.2, brow: 0.35 }, K.seq(lt, 0.15, 1.25));
      K.figure(ctx, { x: 592, y: 880, s: 3.5, color: C.coral, rimColor: C.cyan, rimDir: 1, pose });
      ctx.restore();

      headline(ctx, "AI", t, 0.18);
      const sp = K.soft(K.seq(lt, 0.5, 0.8)) * (1 - K.soft(K.seq(lt, 1.6, 1.95)));
      if (sp > 0.01) {
        ctx.save(); ctx.globalAlpha = sp;
        const bw = K.textWidth(ctx, "science fiction", 30, 700, 0.4) + 56;
        const bx = 1560, by = 800;
        K.badge(ctx, bx, by, "science fiction", { color: "rgba(232,96,60,0.85)", size: 30 });
        const strike = K.easeIn(K.seq(lt, 1.34, 1.7));
        if (strike > 0.01) {
          ctx.strokeStyle = C.coral; ctx.lineWidth = 4; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(bx - bw / 2 + 8, by); ctx.lineTo(bx - bw / 2 + 8 + (bw - 16) * strike, by); ctx.stroke();
        }
        ctx.restore();
      }
      K.dust(ctx, t, 11, 44);
      K.vignette(ctx, 0.95);
      K.grain(ctx, 0.05, 0, 0);
    },
  });

  /* ---------- 2 · the quiet engine ---------- */
  S.push({
    t0: 1.97, t1: 7.67,
    draw(ctx, t) {
      const lt = t - this.t0;
      const camX = 30 + 170 * K.ease(K.seq(lt, 0, 5.7));
      const tDx = B.word(1, "diagnoses"), tTr = B.word(1, "transport"), tLe = B.word(1, "learning");
      K.room(ctx, { top: "#0A1422", bot: "#152435", floorY: 880 });
      K.glow(ctx, 1000, 860, 900, "rgba(242,178,92,0.05)", 1);

      // far skyline
      ctx.save(); ctx.translate(-camX * 0.3, 0);
      for (let i = 0; i < 13; i++) {
        const w = 130 + (i * 53) % 80, h = 200 + (i * 137) % 300;
        ctx.fillStyle = "rgba(17,29,45,0.95)";
        ctx.fillRect(40 + i * 162, 880 - h, w, h);
        for (let j = 0; j < 5; j++) {
          const lit = (i * 7 + j * 3) % 5 === 0;
          ctx.fillStyle = lit ? "rgba(242,178,92,0.22)" : "rgba(42,58,80,0.35)";
          ctx.fillRect(64 + i * 162 + (j % 3) * 34, 880 - h + 30 + Math.floor(j / 3) * 40, 16, 20);
        }
      }
      ctx.restore();

      const shops = [
        { x: 360, w: 360, word: "diagnoses", t: tDx, on: 3.35, col: C.cyan, glyph: "cross" },
        { x: 870, w: 400, word: "transport", t: tTr, on: 4.55, col: C.mustard, glyph: "car" },
        { x: 1410, w: 400, word: "learning", t: tLe, on: 5.5, col: C.violet, glyph: "book" },
      ];
      for (const sh of shops) {
        const x = sh.x - camX;
        const litP = K.soft(K.seq(lt, sh.on, sh.on + 0.6));
        ctx.fillStyle = "#0C1723";
        ctx.fillRect(x - 34, 224, sh.w + 68, 656);
        ctx.fillStyle = "rgba(42,58,80,0.28)"; ctx.fillRect(x - 34, 224, sh.w + 68, 12);
        ctx.fillStyle = "rgba(10,18,30,0.9)"; ctx.fillRect(x - 34, 700, sh.w + 68, 10);
        // upper floors
        for (let rr = 0; rr < 2; rr++) for (let cc = 0; cc < 4; cc++) {
          const wx = x + 18 + cc * (sh.w - 36) / 4, wy = 276 + rr * 84;
          const onf = ((rr * 4 + cc + (sh.x | 0)) % 5 === 0);
          ctx.fillStyle = onf ? "rgba(242,178,92,0.20)" : "rgba(20,32,48,0.85)";
          ctx.fillRect(wx, wy, (sh.w - 36) / 4 - 16, 54);
        }
        // warm interior
        ctx.save();
        const g = ctx.createLinearGradient(0, 470, 0, 812);
        g.addColorStop(0, "rgba(255,206,140," + (0.10 + 0.55 * litP) + ")");
        g.addColorStop(1, "rgba(255,190,120," + (0.02 + 0.12 * litP) + ")");
        ctx.fillStyle = g; ctx.fillRect(x + 14, 470, sh.w - 28, 342);
        ctx.restore();
        // window mullions
        ctx.strokeStyle = "rgba(8,15,26,0.9)"; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(x + sh.w / 2, 470); ctx.lineTo(x + sh.w / 2, 812); ctx.stroke();
        // interior glyph
        ctx.save();
        ctx.globalAlpha = 0.32 + 0.62 * litP;
        ctx.translate(x + sh.w / 2, 650);
        ctx.strokeStyle = sh.col; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.lineJoin = "round";
        if (sh.glyph === "cross") {
          ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(0, 42); ctx.moveTo(-46, -4); ctx.lineTo(46, -4); ctx.stroke();
          ctx.lineWidth = 4; ctx.beginPath();
          ctx.moveTo(-76, 66); ctx.lineTo(-40, 66); ctx.lineTo(-24, 36); ctx.lineTo(-4, 84); ctx.lineTo(14, 52); ctx.lineTo(76, 52); ctx.stroke();
        } else if (sh.glyph === "car") {
          ctx.lineWidth = 6;
          ctx.beginPath(); ctx.roundRect(-70, -8, 140, 44, 12); ctx.stroke();
          ctx.beginPath(); ctx.roundRect(-36, -46, 72, 40, 10); ctx.stroke();
          ctx.beginPath(); ctx.arc(-40, 44, 14, 0, 6.283); ctx.arc(42, 44, 14, 0, 6.283); ctx.stroke();
          ctx.fillStyle = "rgba(8,15,26,0.95)"; ctx.fillRect(96, -70, 36, 104);
          ctx.fillStyle = litP > 0.4 ? C.teal : "#2A3A50"; K.circle(ctx, 114, 8, 12); ctx.fill();
        } else {
          ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(-84, -30); ctx.quadraticCurveTo(-40, -50, 0, -28); ctx.quadraticCurveTo(40, -50, 84, -30);
          ctx.lineTo(84, 44); ctx.quadraticCurveTo(40, 24, 0, 46); ctx.quadraticCurveTo(-40, 24, -84, 44); ctx.closePath(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(0, 46); ctx.stroke();
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-70, -8 + i * 18); ctx.lineTo(-18, -14 + i * 18); ctx.stroke(); }
        }
        ctx.restore();
        // wet pavement reflection
        floorReflect(ctx, x + 10, sh.w - 20, 884, 150, "rgba(255,196,130," + (0.05 + 0.14 * litP) + ")", 1);
        labelTo(ctx, sh.word, x + sh.w / 2, 410, t, sh.t - 0.1, sh.col);
      }

      // lamps with light pools
      for (const lx of [110, 690, 1240, 1800]) {
        const x = lx - camX * 1.12;
        K.line(ctx, x, 880, x, 640, 7, "#0A1220");
        ctx.strokeStyle = "#0A1220"; ctx.lineWidth = 7; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x, 640); ctx.quadraticCurveTo(x + 10, 604, x + 44, 600); ctx.stroke();
        ctx.fillStyle = "rgba(20,34,52,0.95)";
        ctx.beginPath(); ctx.moveTo(x + 26, 596); ctx.lineTo(x + 64, 596); ctx.lineTo(x + 56, 614); ctx.lineTo(x + 34, 614); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(255,220,170,0.95)"; ctx.fillRect(x + 36, 614, 20, 4);
        K.glow(ctx, x + 46, 618, 300, "rgba(242,178,92,0.34)", 0.8);
        floorReflect(ctx, x + 6, 82, 884, 110, "rgba(242,178,92,0.20)", 1);
      }

      // the engine cable: runs along the kerb, pulses travelling
      ctx.save(); ctx.translate(-camX, 0);
      ctx.strokeStyle = "rgba(79,216,240,0.30)"; ctx.lineWidth = 8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-120, 868); ctx.lineTo(2080, 868); ctx.stroke();
      ctx.strokeStyle = "rgba(79,216,240,0.12)"; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.moveTo(-120, 868); ctx.lineTo(2080, 868); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const ph = (lt * 0.24 + i * 0.2) % 1;
        const x = -120 + ph * 2200;
        K.glow(ctx, x, 868, 110, "rgba(79,216,240,0.75)", 0.55);
        ctx.fillStyle = "rgba(210,250,255,0.95)"; K.circle(ctx, x, 868, 4); ctx.fill();
      }
      ctx.restore();

      // sidewalk + kerb
      ctx.fillStyle = "#0A1220"; ctx.fillRect(-40, 880, 2000, 10);
      ctx.fillStyle = "#0B1522"; ctx.fillRect(-40, 890, 2000, 200);
      ctx.save(); ctx.translate(-camX * 1.35, 0);
      ctx.fillStyle = "rgba(7,12,21,0.96)"; ctx.fillRect(-100, 986, 2200, 110);
      ctx.fillStyle = "rgba(42,58,80,0.25)"; ctx.fillRect(-100, 986, 2200, 3);
      ctx.restore();

      const wp = K.seq(lt, 0, 5.7);
      const walkX = 150 + 330 * K.ease(wp) - camX;
      const ph = lt * 7.4;
      const step = Math.sin(ph);
      K.figure(ctx, {
        x: walkX, y: 880 + Math.abs(Math.sin(ph)) * -3, s: 3.25, color: C.coral, rimColor: C.amber, rimDir: 1,
        pose: {
          lean: 0.04, bob: -1.4 * Math.abs(step),
          legL: [0.44 * step, 0.22 - 0.5 * Math.abs(step)], legR: [-0.44 * step, 0.22 - 0.5 * Math.abs(step)],
          armL: [-0.4 * step, -0.28], armR: [0.4 * step, 0.3], headTilt: 0.02,
        },
      });
      headline(ctx, "quiet engine", t, 2.15);
      K.dust(ctx, t, 21, 42);
      K.vignette(ctx, 0.95);
      K.grain(ctx, 0.05, 0, 0);
    },
  });

  /* ---------- 3 · patterns, automation, freedom ---------- */
  S.push({
    t0: 7.67, t1: 13.75,
    draw(ctx, t) {
      const lt = t - this.t0;
      const tPat = B.word(2, "patterns"), tAuto = B.word(2, "automate"), tFree = B.word(2, "creativity");
      ctx.save();
      K.camera(ctx, { zoom: 1.0 + 0.06 * K.ease(K.seq(lt, 0, 6.08)), x: 20 * K.ease(K.seq(lt, 0, 6.08)) });
      K.room(ctx, { top: "#0B1626", bot: "#16283B", floorY: 900 });
      skirting(ctx, 858);
      ctx.fillStyle = "rgba(42,58,80,0.10)"; ctx.fillRect(140, 210, 830, 620);

      // dot wall
      const cols = 16, rows = 8, dx = 50, dy = 66, ox = 190, oy = 274;
      const pat = [[2, 6], [3, 5], [4, 4], [5, 3], [6, 3], [7, 2], [8, 2], [9, 2], [10, 3], [11, 3], [12, 4], [13, 5], [14, 6], [15, 7]];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const on = pat.some(([cc, rr]) => cc === c && rr === r);
        const ap = on ? K.soft(K.seq(lt, 0.5 + c * 0.05, 0.9 + c * 0.05)) : 0;
        ctx.fillStyle = on ? "rgba(79,216,240," + (0.18 + 0.75 * ap) + ")" : "rgba(42,58,80,0.42)";
        K.circle(ctx, ox + c * dx, oy + r * dy, on ? 5 + 3.4 * ap : 3.2); ctx.fill();
        if (on && ap > 0.3) K.glow(ctx, ox + c * dx, oy + r * dy, 30, "rgba(79,216,240,0.5)", 0.4 * ap);
      }
      ctx.save();
      ctx.strokeStyle = "rgba(79,216,240,0.45)"; ctx.lineWidth = 2.5; ctx.setLineDash([12, 14]);
      ctx.beginPath();
      pat.forEach(([c, r], i) => { const X = ox + c * dx, Y = oy + r * dy; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.stroke(); ctx.restore();

      // conveyor + gantry
      const bx0 = 1180, bx1 = 1870, beltY = 800;
      const ua = K.soft(K.seq(lt, 1.9, 2.7));
      // portal frame
      ctx.save(); ctx.globalAlpha = 0.15 + 0.85 * ua;
      ctx.fillStyle = "#16273A";
      ctx.fillRect(1476, 452, 18, 348); ctx.fillRect(1812, 452, 18, 348);
      ctx.fillRect(1476, 452, 354, 18);
      ctx.fillStyle = "rgba(79,216,240,0.35)"; ctx.fillRect(1476, 470, 354, 3);
      // travelling head
      ctx.save(); ctx.translate(1640, 0);
      const press = 0.5 + 0.5 * Math.sin(lt * 5.6);
      ctx.fillStyle = "#1D3149"; K.rr(ctx, -52, 470, 104, 74, 10); ctx.fill();
      ctx.fillStyle = C.teal; K.rr(ctx, -34, 544, 68, 26 + press * 30, 8); ctx.fill();
      ctx.fillStyle = "#0B111B"; ctx.fillRect(-22, 570 + press * 30, 44, 16);
      ctx.fillStyle = "rgba(79,216,240,0.95)"; K.circle(ctx, 0, 500, 6); ctx.fill();
      ctx.restore();
      ctx.restore();

      // belt
      ctx.fillStyle = "#0A1220"; ctx.fillRect(bx0, beltY, bx1 - bx0, 20);
      ctx.fillStyle = "#111E2E"; ctx.fillRect(bx0, beltY + 20, bx1 - bx0, 14);
      ctx.fillStyle = "rgba(79,216,240,0.20)"; ctx.fillRect(bx0, beltY, bx1 - bx0, 3);
      for (const lx of [1220, 1420, 1620, 1820]) { ctx.fillStyle = "#0A1220"; ctx.fillRect(lx, beltY + 34, 14, 46); }
      for (let i = 0; i < 7; i++) {
        const bx = bx0 + 46 + ((i * 104 + lt * (30 + 70 * K.soft(K.seq(lt, 1.8, 3.0)))) % (bx1 - bx0 - 76));
        const stamped = i < 4;
        ctx.save(); ctx.translate(bx, beltY - 36);
        ctx.fillStyle = stamped ? "rgba(232,176,75,0.82)" : "rgba(48,66,90,0.95)";
        K.rr(ctx, -34, -36, 68, 72, 7); ctx.fill();
        ctx.strokeStyle = "rgba(8,15,26,0.85)"; ctx.lineWidth = 3; ctx.stroke();
        if (stamped) { ctx.strokeStyle = "rgba(60,40,10,0.45)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, 2); ctx.lineTo(20, 2); ctx.stroke(); }
        ctx.restore();
      }

      // operator
      const free = K.soft(K.seq(lt, 3.7, 4.7));
      const pose = K.mix(0, { lean: 0.14, headX: 0.26, armL: [-0.1, 0.0], armR: [0.5, 0.4], brow: 0.6 },
        1, { lean: -0.04, headX: 0.02, headY: -0.2, armL: [-0.7, -0.6], armR: [0.72, 0.62], brow: 0.15 }, K.seq(lt, 2.8, 3.7));
      K.figure(ctx, { x: 1092, y: 900, s: 3.65, color: C.coral, rimColor: C.cyan, rimDir: 1, pose });

      // warm lamp for creativity
      if (free > 0.01) {
        K.glow(ctx, 1092, 760, 660, "rgba(242,178,92,0.15)", free);
        ctx.save(); ctx.globalAlpha = free * 0.75;
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * 6.283 + lt * 0.35;
          const r = 150 + 40 * Math.sin(lt * 1.4 + i);
          ctx.fillStyle = C.amber;
          K.circle(ctx, 1092 + Math.cos(a) * r, 700 + Math.sin(a) * r * 0.55, 2.2); ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();

      labelTo(ctx, "patterns", 540, 186, t, tPat - 0.1, C.cyan);
      labelTo(ctx, "automate", 1640, 392, t, tAuto - 0.1, C.mustard);
      labelTo(ctx, "creativity", 1092, 640, t, tFree - 0.1, C.amber);
      K.dust(ctx, t, 31, 34);
      K.vignette(ctx, 0.92);
      K.grain(ctx, 0.05, 0, 0);
    },
  });

  /* ---------- 4 · not automatic ---------- */
  S.push({
    t0: 13.75, t1: 15.99,
    draw(ctx, t) {
      const lt = t - this.t0;
      const cam = { zoom: 1.0 + 0.12 * K.ease(K.seq(lt, 0, 2.24)), y: 14 * K.ease(K.seq(lt, 0, 2.24)) };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#070E17", bot: "#0B1523", floorY: 940 });
      // one amber strip high on the wall
      ctx.fillStyle = "rgba(242,178,92,0.16)"; ctx.fillRect(-40, 250, 2000, 5);
      K.glow(ctx, 960, 250, 1100, "rgba(242,178,92,0.08)", 1);

      // plinth
      ctx.fillStyle = "#0B1420"; ctx.fillRect(700, 780, 520, 200);
      ctx.fillStyle = "rgba(42,58,80,0.5)"; ctx.fillRect(700, 780, 520, 6);
      ctx.fillStyle = "#0D1826"; ctx.fillRect(760, 760, 400, 22);
      // switch plate
      ctx.fillStyle = "#101C2D"; K.rr(ctx, 822, 420, 276, 372, 18); ctx.fill();
      ctx.strokeStyle = "rgba(242,178,92,0.32)"; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = "#0B1522"; K.rr(ctx, 846, 444, 228, 324, 12); ctx.fill();
      ctx.fillStyle = "rgba(242,178,92,0.20)";
      for (const [sxy, syy] of [[846, 444], [1074, 444], [846, 768], [1074, 768]]) { K.circle(ctx, sxy, syy, 5); ctx.fill(); }
      // toggle base
      ctx.fillStyle = "#16273A"; K.circle(ctx, 960, 640, 62); ctx.fill();
      ctx.strokeStyle = "rgba(79,216,240,0.22)"; ctx.lineWidth = 2; ctx.stroke();

      const flip = K.ease(K.seq(lt, 1.92, 2.14));
      ctx.save(); ctx.translate(960, 636); ctx.rotate(-0.22 + flip * 0.5);
      const lg = ctx.createLinearGradient(-20, 0, 20, 0);
      lg.addColorStop(0, "#2B4560"); lg.addColorStop(0.55, "#1B2E44"); lg.addColorStop(1, "#101E2F");
      K.rr(ctx, -22, -150, 44, 156, 22); ctx.fillStyle = lg; ctx.fill();
      ctx.strokeStyle = "rgba(79,216,240,0.35)"; ctx.lineWidth = 2; ctx.stroke();
      // knob
      K.circle(ctx, 0, -132, 34); ctx.fillStyle = "#101B2A"; ctx.fill();
      K.circle(ctx, 0, -132, 26); ctx.fillStyle = "rgba(232,96,60,0.92)"; ctx.fill();
      K.circle(ctx, -8, -140, 8); ctx.fillStyle = "rgba(255,180,160,0.5)"; ctx.fill();
      ctx.restore();
      // on/off ticks
      ctx.fillStyle = "rgba(42,58,80,0.9)";
      ctx.fillRect(884, 740, 34, 6); ctx.fillRect(1002, 740, 34, 6);

      // a hand comes in and takes the switch
      const reach = K.ease(K.seq(lt, 0.9, 1.9));
      if (reach > 0.02) {
        const gx = 700 + reach * 260, gy = 900 - reach * 322;
        ctx.save(); ctx.globalAlpha = K.clamp01(reach * 1.4);
        // forearm, running in from the bottom-left corner
        ctx.strokeStyle = C.ink; ctx.lineWidth = 74; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(320, 1180); ctx.lineTo(gx - 6, gy + 26); ctx.stroke();
        // warm edge along the top of the arm
        ctx.strokeStyle = "rgba(242,178,92,0.55)"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(330, 1136); ctx.lineTo(gx - 16, gy - 18); ctx.stroke();
        // palm gripping the shaft
        K.rr(ctx, gx - 46, gy - 34, 92, 66, 26); ctx.fillStyle = C.ink; ctx.fill();
        // fingers curl over the lever
        ctx.strokeStyle = C.ink; ctx.lineWidth = 17; ctx.lineCap = "round";
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(gx + 4, gy - 18 + i * 18); ctx.lineTo(gx + 36, gy - 22 + i * 18); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(gx - 40, gy - 30); ctx.lineTo(gx - 76, gy - 42); ctx.stroke();
        // rim light on the hand
        ctx.strokeStyle = "rgba(79,216,240,0.55)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(gx - 46, gy - 40); ctx.quadraticCurveTo(gx + 6, gy - 52, gx + 46, gy - 34); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      headline(ctx, "not automatic", t, 13.85);
      const pill = K.soft(K.seq(lt, 0.2, 0.55));
      if (pill > 0.01) K.badge(ctx, 960, 372, "importance", { color: C.mustard, size: 27, alpha: pill, scale: 0.9 + 0.1 * pill });
      K.dust(ctx, t, 41, 24);
      K.vignette(ctx, 1.2);
      K.grain(ctx, 0.06, 0, 0);
    },
  });

  /* ---------- 5 · build it responsibly ---------- */
  S.push({
    t0: 15.99, t1: 21.59,
    draw(ctx, t) {
      const lt = t - this.t0;
      const cam = { zoom: 1.02 + 0.06 * K.ease(K.seq(lt, 0, 5.6)), y: -8 * K.ease(K.seq(lt, 0, 5.6)) };
      ctx.save(); K.camera(ctx, cam);
      K.room(ctx, { top: "#0D1A2A", bot: "#17293D", floorY: 960 });
      skirting(ctx, 918);

      // pendant lamp
      K.line(ctx, 1000, 0, 1000, 210, 4, "#0A1220");
      ctx.fillStyle = "#101E30";
      ctx.beginPath(); ctx.moveTo(920, 210); ctx.lineTo(1080, 210); ctx.lineTo(1044, 254); ctx.lineTo(956, 254); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(242,178,92,0.8)"; ctx.fillRect(960, 252, 80, 6);
      K.glow(ctx, 1000, 280, 640, "rgba(242,178,92,0.22)", 1);
      cone(ctx, 1000, 262, 700, 500, 0.5);

      // workbench
      ctx.fillStyle = "#0C1624"; ctx.fillRect(560, 762, 800, 22);
      ctx.fillStyle = "rgba(242,178,92,0.20)"; ctx.fillRect(560, 762, 800, 4);
      ctx.fillStyle = "#08101B"; ctx.fillRect(576, 784, 768, 150);
      ctx.fillStyle = "#0A1220"; ctx.fillRect(604, 934, 24, 26); ctx.fillRect(1292, 934, 24, 26);

      // blocks
      const blocks = [
        { y: 712, t: 0.25 }, { y: 608, t: 1.35 }, { y: 504, t: 2.55 }, { y: 400, t: 3.75 },
      ];
      blocks.forEach((b, i) => {
        if (b.t > lt + 0.001) return;
        const p = K.easeOut(K.seq(lt, b.t, b.t + 0.55));
        const dy = (1 - p) * -110;
        ctx.save();
        ctx.globalAlpha = 0.45 + 0.55 * p;
        ctx.translate(1010, b.y + dy);
        const g = ctx.createLinearGradient(-86, -50, 86, 50);
        g.addColorStop(0, "rgba(47,183,168,0.32)");
        g.addColorStop(1, "rgba(79,216,240,0.14)");
        K.rr(ctx, -88, -50, 176, 100, 10); ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = "rgba(79,216,240,0.85)"; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.strokeStyle = "rgba(79,216,240,0.22)"; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(-74, 28); ctx.lineTo(74, 28); ctx.stroke();
        K.glow(ctx, 0, 0, 200, "rgba(79,216,240,0.16)", 0.7 * p);
        ctx.restore();
      });

      // the unit on the bench, handing a block
      ctx.save();
      const ua = K.soft(K.seq(lt, 3.0, 3.5));
      ctx.globalAlpha = 0.15 + 0.85 * ua;
      ctx.translate(1240, 762);
      const s2 = 1.6;
      ctx.fillStyle = C.teal; K.rr(ctx, -26 * s2, -58 * s2, 52 * s2, 58 * s2, 9 * s2); ctx.fill();
      K.circle(ctx, 0, -74 * s2, 17 * s2); ctx.fillStyle = C.teal; ctx.fill();
      K.circle(ctx, 0, -76 * s2, 7 * s2); ctx.fillStyle = "#0B111B"; ctx.fill();
      K.circle(ctx, 0, -76 * s2, 3 * s2); ctx.fillStyle = C.cyan; ctx.fill();
      K.line(ctx, -24 * s2, -34 * s2, -40 * s2, 6 * s2, 5.5 * s2, "#0B111B");
      K.line(ctx, 24 * s2, -34 * s2, 40 * s2, 2 * s2, 5.5 * s2, "#0B111B");
      K.glow(ctx, 0, -40 * s2, 150, "rgba(79,216,240,0.22)", 0.8);
      ctx.restore();

      // builder
      const reach = K.ease(K.seq(lt, 1.15, 1.95));
      const pose = K.mix(0, { lean: 0.12, armR: [0.62, 0.5], armL: [-0.15, -0.1], headX: 0.2, brow: 0.35 },
        1, { lean: 0.2, armR: [0.96, 0.62], armL: [-0.2, -0.14], headX: 0.28, brow: 0.25 }, K.seq(lt, 1.0, 1.8));
      K.figure(ctx, { x: 800, y: 1010, s: 3.45, color: C.violet, rimColor: C.amber, rimDir: -1, pose });
      ctx.restore();

      const cards = [
        { t: B.word(4, "transparency"), x: 280, y: 250, title: "transparency" },
        { t: B.word(4, "fairness"), x: 280, y: 396, title: "fairness" },
        { t: B.word(4, "oversight"), x: 1392, y: 300, title: "oversight" },
      ];
      for (const c of cards) {
        const p = K.easeOut(K.seq(t, c.t - 0.15, c.t + 0.35));
        if (p <= 0.01) continue;
        ctx.save(); ctx.globalAlpha = p;
        ctx.translate(c.x + (1 - p) * -36, c.y);
        K.card(ctx, 0, 0, 300, 104, c.title, "", { color: "rgba(79,216,240,0.6)" });
        ctx.restore();
      }
      headline(ctx, "responsibly", t, 16.2);
      K.dust(ctx, t, 51, 30);
      K.vignette(ctx, 0.92);
      K.grain(ctx, 0.05, 0, 0);
    },
  });

  /* ---------- 6 · used wisely ---------- */
  S.push({
    t0: 21.59, t1: 24.82,
    draw(ctx, t) {
      const lt = t - this.t0;
      ctx.save();
      K.camera(ctx, { zoom: 1.03 + 0.045 * K.ease(K.seq(lt, 0, 3.23)), y: -8 });
      K.room(ctx, { top: "#132436", bot: "#1B2E42", floorY: 900 });
      skirting(ctx, 858);

      // window onto dawn
      ctx.save();
      ctx.beginPath(); ctx.rect(1180, 240, 480, 400); ctx.clip();
      const wg = ctx.createLinearGradient(1180, 240, 1180, 640);
      wg.addColorStop(0, "#3A2C2C");
      wg.addColorStop(0.45, "#6B4A32");
      wg.addColorStop(1, "#F2B25C");
      ctx.fillStyle = wg; ctx.fillRect(1180, 240, 480, 400);
      ctx.fillStyle = "rgba(24,32,46,0.85)";
      for (let i = 0; i < 7; i++) {
        const bh = 70 + (i * 53) % 150;
        ctx.fillRect(1182 + i * 70, 640 - bh, 54, bh);
      }
      ctx.fillStyle = "rgba(242,178,92,0.22)";
      ctx.fillRect(1180, 380, 480, 6);
      ctx.restore();
      ctx.strokeStyle = "rgba(58,80,108,0.95)"; ctx.lineWidth = 14; ctx.strokeRect(1180, 240, 480, 400);
      ctx.fillStyle = "rgba(58,80,108,0.95)"; ctx.fillRect(1414, 240, 12, 400); ctx.fillRect(1180, 434, 480, 12);
      ctx.fillStyle = "#0C1624"; ctx.fillRect(1160, 640, 520, 14);
      K.glow(ctx, 1420, 430, 760, "rgba(242,178,92,0.22)", 1);
      floorReflect(ctx, 1180, 480, 900, 130, "rgba(242,178,92,0.12)", 1);

      // meter above the head
      const mp = K.ease(K.seq(lt, 1.25, 2.65));
      K.meter(ctx, 640, 402, 560, 34, mp, { from: C.teal, to: C.cyan, alpha: 0.95 });
      if (mp > 0.02) {
        K.glow(ctx, 640 + 560 * mp, 419, 70, "rgba(79,216,240,0.55)", 0.7 * mp);
      }

      // figure + the unit on the shoulder
      const lift = K.ease(K.seq(lt, 0.5, 1.5));
      K.figure(ctx, {
        x: 840, y: 900, s: 3.7, color: C.coral, rimColor: C.amber, rimDir: -1,
        pose: { lean: 0.01, headY: -0.15 * lift, armL: [-0.62, -0.5], armR: [0.62, 0.5], brow: 0.35 },
      });
      ctx.save(); ctx.translate(908, 646 - 26 * lift);
      ctx.fillStyle = C.teal; K.rr(ctx, -26, -36, 52, 42, 8); ctx.fill();
      K.circle(ctx, 0, -46, 18); ctx.fillStyle = C.teal; ctx.fill();
      K.circle(ctx, 0, -48, 7); ctx.fillStyle = "#0B111B"; ctx.fill();
      K.circle(ctx, 0, -48, 3); ctx.fillStyle = C.cyan; ctx.fill();
      K.line(ctx, -22, -30, -34, 2, 4.8, "#0B111B");
      K.line(ctx, 22, -30, 34, 2, 4.8, "#0B111B");
      K.glow(ctx, 0, -10, 110, "rgba(79,216,240,0.20)", 0.7);
      ctx.restore();
      ctx.restore();

      headline(ctx, "amplifies", t, 22.1);
      const pl = K.soft(K.seq(t, B.word(5, "potential") - 0.15, B.word(5, "potential") + 0.25));
      if (pl > 0.01) K.badge(ctx, 920, 340, "potential", { color: C.cyan, size: 27, alpha: pl, scale: 0.9 + 0.1 * pl });
      K.dust(ctx, t, 61, 34);
      K.vignette(ctx, 0.85);
      K.grain(ctx, 0.05, 0, 0);
    },
  });

  /* ---------- 7 · ignored: the gap widens ---------- */
  S.push({
    t0: 24.82, t1: 26.54,
    draw(ctx, t) {
      const lt = t - this.t0;
      K.room(ctx, { top: "#091320", bot: "#0F1D2C", floorY: 900 });
      // dim back wall
      ctx.fillStyle = "rgba(42,58,80,0.10)"; ctx.fillRect(-40, 300, 2000, 300);
      ctx.fillStyle = "rgba(242,178,92,0.07)"; ctx.fillRect(1300, 360, 300, 200);
      K.glow(ctx, 1450, 460, 320, "rgba(242,178,92,0.08)", 1);
      skirting(ctx, 858);

      const split = K.ease(K.seq(lt, 0.3, 1.95));
      const gapW = 40 + 250 * split;
      const leftEdge = 860 - split * 60, rightEdge = leftEdge + gapW;
      const mid = (leftEdge + rightEdge) / 2;

      // chasm light
      ctx.save();
      const cg = ctx.createLinearGradient(0, 900, 0, 1080);
      cg.addColorStop(0, "rgba(232,96,60,0.16)");
      cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cg; ctx.fillRect(leftEdge - 20, 900, gapW + 40, 180);
      ctx.restore();

      // platforms (top face + front face)
      for (const [x0, x1] of [[140, leftEdge], [rightEdge, 1780]]) {
        const pg = ctx.createLinearGradient(0, 884, 0, 1080);
        pg.addColorStop(0, "rgba(34,52,74,0.95)");
        pg.addColorStop(0.18, "rgba(16,28,44,0.98)");
        pg.addColorStop(1, "rgba(8,14,24,1)");
        ctx.fillStyle = pg; ctx.fillRect(x0, 884, x1 - x0, 196);
        ctx.fillStyle = "rgba(242,178,92,0.55)"; ctx.fillRect(x0, 880, x1 - x0, 4);
        ctx.fillStyle = "rgba(242,178,92,0.10)"; ctx.fillRect(x0, 884, x1 - x0, 18);
      }

      // void
      ctx.fillStyle = "#03070C";
      ctx.beginPath();
      ctx.moveTo(leftEdge, 900); ctx.lineTo(rightEdge, 900);
      ctx.lineTo(rightEdge + 46, 1080); ctx.lineTo(leftEdge - 46, 1080);
      ctx.closePath(); ctx.fill();

      // figures
      K.figure(ctx, { x: 660 - split * 34, y: 900, s: 3.35, color: C.coral, rimColor: C.cyan, rimDir: 1, pose: { lean: 0.04, armR: [0.52, 0.42], headX: 0.18, brow: 0.75, mouth: -0.5 } });
      K.figure(ctx, { x: 1300 + gapW + split * 34, y: 900, s: 3.35, color: C.violet, rimColor: C.cyan, rimDir: -1, alpha: 0.92, pose: { lean: -0.04, armL: [-0.52, -0.42], headX: -0.18, brow: 0.75, mouth: -0.5 } });
      // the ignored unit, far right, dim
      ctx.save(); ctx.globalAlpha = 0.4; ctx.translate(1792, 900);
      const s2 = 1.35;
      ctx.fillStyle = C.teal; K.rr(ctx, -24 * s2, -54 * s2, 48 * s2, 54 * s2, 8 * s2); ctx.fill();
      K.circle(ctx, 0, -68 * s2, 16 * s2); ctx.fillStyle = C.teal; ctx.fill();
      K.circle(ctx, 0, -70 * s2, 6 * s2); ctx.fillStyle = "#0B111B"; ctx.fill();
      ctx.restore();

      headline(ctx, "widens gaps", t, 25.0);
      const gp = K.soft(K.seq(t, B.word(6, "gaps") - 0.25, B.word(6, "gaps") + 0.15));
      if (gp > 0.01) {
        ctx.save(); ctx.globalAlpha = gp;
        K.arrow(ctx, 700 - split * 34, 742, 1290 + gapW + split * 34, 742, { color: C.coral, bend: 86, w: 3 });
        K.badge(ctx, mid, 826, "gaps", { color: C.coral, size: 25, alpha: 0.95 });
        ctx.restore();
      }
      K.dust(ctx, t, 71, 26);
      K.vignette(ctx, 1.02);
      K.grain(ctx, 0.055, 0, 0);
    },
  });

  /* ---------- 8 · the real importance? ---------- */
  S.push({
    t0: 26.54, t1: 29.35,
    draw(ctx, t) {
      const lt = t - this.t0;
      ctx.save();
      K.camera(ctx, { zoom: 1.18 - 0.22 * K.ease(K.seq(lt, 0, 2.8)), y: 26 * K.ease(K.seq(lt, 0, 2.8)) });
      K.room(ctx, { top: "#080F1A", bot: "#0E1B29", floorY: 900 });
      // wall panelling + ceiling strip
      for (let i = 0; i < 7; i++) ctx.fillStyle = "rgba(42,58,80,0.14)", ctx.fillRect(120 + i * 260, 120, 4, 740);
      ctx.fillStyle = "rgba(79,216,240,0.10)"; ctx.fillRect(-40, 150, 2000, 4);
      K.glow(ctx, 960, 152, 1200, "rgba(79,216,240,0.05)", 1);

      // two doorways with warm rooms behind
      for (const dx0 of [292, 1388]) {
        ctx.fillStyle = "rgba(242,178,92,0.16)"; ctx.fillRect(dx0, 452, 240, 448);
        ctx.fillStyle = "rgba(242,178,92,0.10)"; ctx.fillRect(dx0 + 30, 470, 180, 430);
        ctx.fillStyle = "#0A1420";
        ctx.fillRect(dx0 - 16, 436, 16, 464); ctx.fillRect(dx0 + 240, 436, 16, 464); ctx.fillRect(dx0 - 16, 436, 272, 18);
        ctx.fillStyle = "rgba(242,178,92,0.30)"; ctx.fillRect(dx0, 452, 240, 4);
        K.glow(ctx, dx0 + 120, 640, 260, "rgba(242,178,92,0.12)", 0.9);
        floorReflect(ctx, dx0, 240, 900, 120, "rgba(242,178,92,0.12)", 1);
      }
      ctx.fillStyle = "#0B1522"; ctx.fillRect(-40, 900, 2000, 200);
      ctx.fillStyle = "rgba(42,58,80,0.35)"; ctx.fillRect(-40, 900, 2000, 3);

      K.figure(ctx, { x: 700, y: 900, s: 2.6, color: C.coral, rimColor: C.cyan, rimDir: 1, pose: { headTilt: -0.12, brow: 0.35 } });
      K.figure(ctx, { x: 1420, y: 900, s: 2.6, color: C.violet, rimColor: C.cyan, rimDir: -1, alpha: 0.82, pose: { headTilt: 0.1, brow: 0.35 } });
      ctx.restore();

      const drawP = K.ease(K.seq(lt, 0.5, 1.5));
      if (drawP > 0.01) {
        ctx.save();
        ctx.translate(1250, 300);
        ctx.strokeStyle = "rgba(79,216,240,0.95)"; ctx.lineWidth = 11; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.shadowColor = C.cyan; ctx.shadowBlur = 34;
        const hookP = K.clamp01(drawP / 0.72), dotP = K.clamp01((drawP - 0.78) / 0.22);
        // hook: up the left, over the top, down the right, sweeping into the stem
        const hooks = [
          { p: hookP },
        ];
        if (hookP > 0) {
          const p1 = K.clamp01(hookP / 0.55), p2 = K.clamp01((hookP - 0.55) / 0.45);
          ctx.globalAlpha = K.clamp01(hookP * 3);
          ctx.beginPath();
          ctx.moveTo(-50, -74);
          ctx.bezierCurveTo(-50, -148, 48, -148, 48, -76);
          ctx.stroke();
          if (p2 > 0) {
            ctx.beginPath();
            ctx.moveTo(48, -76);
            const ex = 0, ey = 20 * p2;
            ctx.bezierCurveTo(48 + (0 - 48) * p2, -76 + 46 * p2, 4 * p2, -44 * p2, 0, ey);
            ctx.stroke();
            ctx.globalAlpha = K.clamp01((hookP - 0.55) * 3);
            ctx.beginPath(); ctx.moveTo(0, 20 * p2); ctx.lineTo(0, 20 + 34 * p2); ctx.stroke();
          }
        }
        if (dotP > 0) {
          ctx.globalAlpha = dotP;
          ctx.beginPath(); ctx.arc(0, 126, 10 * dotP, 0, 6.283);
          ctx.fillStyle = "rgba(79,216,240,0.95)"; ctx.fill();
        }
        ctx.restore();
      }
      K.dust(ctx, t, 81, 30);
      K.vignette(ctx, 1.16);
      headline(ctx, "the real importance?", t, 26.72);
      K.grain(ctx, 0.06, 0, 0);
    },
  });

  /* ---------- 9 · it's a tool ---------- */
  S.push({
    t0: 29.35, t1: 30.36,
    draw(ctx, t) {
      const lt = t - this.t0;
      ctx.save();
      K.camera(ctx, { zoom: 1.0 + 0.06 * K.ease(K.seq(lt, 0, 1.01)), y: 8 });
      K.room(ctx, { top: "#0A1119", bot: "#0D1723", floorY: 742 });
      // pendant lamp
      K.line(ctx, 960, -20, 960, 86, 4, "#0A1220");
      ctx.fillStyle = "#101E30";
      ctx.beginPath(); ctx.moveTo(900, 86); ctx.lineTo(1020, 86); ctx.lineTo(994, 126); ctx.lineTo(926, 126); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,225,180,0.9)"; ctx.fillRect(934, 124, 52, 5);
      K.glow(ctx, 960, 130, 460, "rgba(242,178,92,0.26)", 1);
      cone(ctx, 960, 130, 620, 610, 0.5);

      // bench
      ctx.fillStyle = "#0E1A28"; ctx.fillRect(-40, 742, 2000, 24);
      ctx.fillStyle = "rgba(242,178,92,0.30)"; ctx.fillRect(-40, 742, 2000, 4);
      ctx.fillStyle = "#091019"; ctx.fillRect(-40, 766, 2000, 314);
      ctx.strokeStyle = "rgba(42,58,80,0.45)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-40, 830); ctx.lineTo(1960, 830); ctx.stroke();
      floorReflect(ctx, 620, 680, 766, 110, "rgba(242,178,92,0.10)", 1);

      // contact shadow + the tool
      ctx.save();
      ctx.globalAlpha = 0.6; ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath(); ctx.ellipse(960, 742, 250, 15, 0, 0, 6.283); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(960, 716); ctx.rotate(-0.06);
      const g = ctx.createLinearGradient(0, -22, 0, 22);
      g.addColorStop(0, "#A8BBCE"); g.addColorStop(0.38, "#5C728C"); g.addColorStop(1, "#1F2E3F");
      K.rr(ctx, -248, -19, 496, 38, 11); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = "#16273A"; K.rr(ctx, 56, -21, 130, 42, 9); ctx.fill();
      ctx.strokeStyle = "rgba(232,176,75,0.75)"; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(70 + i * 30, -19); ctx.lineTo(70 + i * 30, 19); ctx.stroke(); }
      ctx.strokeStyle = "#A8BBCE"; ctx.lineWidth = 13; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(-246, 0, 33, -1.95, 1.25); ctx.stroke();
      ctx.strokeStyle = "rgba(79,216,240,0.55)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-210, -14); ctx.lineTo(150, -14); ctx.stroke();
      ctx.restore();

      // a hand rests on the grip
      const reach = K.ease(K.seq(lt, 0.3, 0.8));
      if (reach > 0.02) {
        const x = 1290 - reach * 150, y = 700 + (1 - reach) * 40;
        ctx.save(); ctx.globalAlpha = reach;
        ctx.shadowColor = "rgba(242,178,92,0.35)"; ctx.shadowBlur = 26;
        ctx.strokeStyle = "#2C4054"; ctx.lineWidth = 84; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(1900, 1080); ctx.lineTo(x + 8, y + 28); ctx.stroke();
        ctx.strokeStyle = "rgba(255,214,160,0.55)"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(1890, 1040); ctx.lineTo(x + 34, y + 4); ctx.stroke();
        ctx.fillStyle = C.ink;
        K.rr(ctx, x - 34, y - 24, 78, 58, 24); ctx.fill();
        ctx.strokeStyle = C.ink; ctx.lineWidth = 15; ctx.lineCap = "round";
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 8, y - 12 + i * 16); ctx.lineTo(x + 34, y - 8 + i * 16); ctx.stroke(); }
        ctx.strokeStyle = "rgba(255,214,160,0.9)"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x - 32, y - 30); ctx.quadraticCurveTo(x + 4, y - 40, x + 32, y - 16); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      headline(ctx, "a tool", t, 29.46);
      K.dust(ctx, t, 91, 18);
      K.vignette(ctx, 1.04);
      K.grain(ctx, 0.06, 0, 0);
    },
  });

  /* ---------- 10 · serves everyone ---------- */
  S.push({
    t0: 30.36, t1: 33.84,
    draw(ctx, t) {
      const lt = t - this.t0;
      ctx.save();
      K.camera(ctx, { zoom: 1.14 - 0.18 * K.ease(K.seq(lt, 0, 3.4)), y: 16 });
      K.room(ctx, { top: "#0A1320", bot: "#122234", floorY: 900 });
      const warm = K.ease(K.seq(lt, 1.5, 3.0));
      K.glow(ctx, 960, 460, 1300, "rgba(242,178,92,0.13)", 0.5 + 0.5 * warm);
      skirting(ctx, 858);

      // pedestal
      ctx.fillStyle = "#0C1624"; ctx.fillRect(890, 720, 142, 180);
      ctx.fillStyle = "#16273A"; ctx.fillRect(876, 700, 170, 22);
      ctx.fillStyle = "rgba(242,178,92,0.55)"; ctx.fillRect(876, 700, 170, 4);
      ctx.save(); ctx.translate(961, 684); ctx.rotate(-0.26);
      const g = ctx.createLinearGradient(0, -13, 0, 13);
      g.addColorStop(0, "#A8BBCE"); g.addColorStop(1, "#1F2E3F");
      K.rr(ctx, -128, -15, 256, 30, 9); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = "#A8BBCE"; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(-128, 0, 23, -1.95, 1.25); ctx.stroke();
      ctx.strokeStyle = "rgba(255,240,215,0.55)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-112, -13); ctx.lineTo(112, -13); ctx.stroke();
      ctx.strokeStyle = "rgba(79,216,240,0.5)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-80, -10); ctx.lineTo(90, -10); ctx.stroke();
      ctx.restore();
      K.glow(ctx, 961, 690, 260, "rgba(242,178,92,0.22)", 0.7 + 0.3 * warm);

      // the one who chooses
      const reach = K.ease(K.seq(lt, 0.55, 1.7));
      K.figure(ctx, { x: 600, y: 900, s: 3.45, color: C.coral, rimColor: C.amber, rimDir: -1, pose: { lean: 0.1, armR: [0.72 * reach, 0.5 * reach], headX: 0.22, brow: 0.25 } });

      // others, in a shallow arc, lighting up one by one
      const others = [
        { x: 1160, y: 905, s: 2.9, t: 1.45 },
        { x: 1340, y: 912, s: 2.8, t: 1.75 },
        { x: 1520, y: 920, s: 2.7, t: 2.05 },
        { x: 1690, y: 928, s: 2.62, t: 2.32 },
        { x: 1830, y: 936, s: 2.55, t: 2.55 },
      ];
      const cols = [C.violet, C.teal, C.mustard, C.violet, C.teal];
      others.forEach((o, i) => {
        const p = K.soft(K.seq(lt, o.t, o.t + 0.6));
        if (p > 0.02) K.glow(ctx, o.x, o.y - 110, 280, "rgba(242,178,92,0.14)", p * 0.9);
        K.figure(ctx, {
          x: o.x, y: o.y, s: o.s, color: cols[i], rimColor: C.amber, rimDir: -1,
          alpha: 0.46 + 0.54 * p, pose: { headTilt: 0.03, brow: 0.2, armL: [-0.16, -0.12], armR: [0.16, 0.12] },
        });
      });
      ctx.restore();

      headline(ctx, "everyone", t, 32.5, { alpha: 0.9 });
      K.dust(ctx, t, 101, 34);
      K.vignette(ctx, 0.85);
      K.fade(ctx, K.soft(K.seq(t, 33.42, 33.84)) * 0.94);
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
