/* Scenes 10–17 — Stickman (Ink). Second half of "Your Single Pastor". */
(function () {
  const K = window.K, B = window.B;
  const S = (window.SCENES = window.SCENES || []);
  const rv = (t, a, d) => K.easeOut(K.seq(t, a, a + (d == null ? 0.5 : d)));
  const FLOOR = 872;
  const wAt = (si, re) => {
    const s = B.sentences[si];
    const hit = s.words.find((x) => re.test(x.w.toLowerCase().replace(/[^a-z]/g, "")));
    return hit ? hit.t : s.sp;
  };

  const gauss = (x) => Math.exp(-Math.pow((x - 1000) / 190, 2));
  const CURVE = [];
  for (let x = 520; x <= 1480; x += 24) CURVE.push([x, 800 - 250 * gauss(x)]);
  const DOTS = [880, 940, 1000, 1060, 1120, 960].map((x, i) => [x, 800 - 10 - (i % 2) * 6]);
  const FUSE = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    FUSE.push([790 + 470 * u, 700 - 90 * Math.sin(u * Math.PI * 0.9) - 40 * u]);
  }
  const FLAME = [[-16, 46], [-26, 4], [-18, -30], [0, -62], [18, -30], [26, 4], [16, 46], [0, 34], [-16, 46]];

  /* =========================== sc10 =========================== */
  const sc10 = {
    id: "sc10", t0: 45.33, t1: 47.44, si: [9],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, "PROVING GROUND", t, t0 + 0.05, { size: 64 });
      K.line(ctx, 120, FLOOR, 1800, FLOOR, { w: 2.6, color: K.C.graphite, alpha: 0.4, rev: rv(t, t0 + 0.05, 0.4), seed: 1 });
      // the proving ground: a low platform
      K.stroke(ctx, [[560, 804], [1360, 800], [1350, 880], [572, 878], [560, 804]], { w: 4, color: K.C.ink, rev: rv(t, t0 + 0.05, 0.45), seed: 2 });
      K.hatch(ctx, 580, 816, 760, 56, { alpha: 0.14, rev: rv(t, t0 + 0.3, 0.5), step: 34 });
      K.figure(ctx, { x: 960, y: 802, s: 1.0, pose: K.POSE.stand, rev: K.seq(t, t0 + 0.25, t0 + 1.0) });
      // two test marks land: a pass stamp and a crack
      const stamp = K.seq(t, t0 + 1.0, t0 + 1.45);
      K.stroke(ctx, [[690, 706], [716, 736], [774, 664]], { w: 9, color: K.C.blue, rev: stamp, seed: 3 });
      K.stroke(ctx, [[1120, 700], [1148, 726], [1176, 700], [1204, 730], [1232, 706]], { w: 4, color: K.C.ink, rev: K.seq(t, t0 + 1.15, t0 + 1.7), seed: 4 });

    },
  };

  /* =========================== sc11 =========================== */
  const sc11 = {
    id: "sc11", t0: 47.44, t1: 52.39, si: [10, 11],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, "NOT A MAGIC CHECKBOX", t, t0 + 0.08, { size: 64 });
      // a checkbox grid, and the tick that scribbles itself out
      const g = K.seq(t, t0 + 0.15, t0 + 0.8);
      BOXES.forEach((b, i) => K.box(ctx, b[0], b[1], 160, 160, { w: 3.2, color: K.C.ink, rev: K.seq(t, t0 + 0.15 + i * 0.12, t0 + 0.7 + i * 0.12), seed: 10 + i }));
      void g;
      const tickAt = wAt(10, /^checkbox/);
      K.stroke(ctx, [[1148, 612], [1178, 648], [1240, 556]], { w: 8, color: K.C.ink, rev: K.seq(t, t0 + 0.9, t0 + 1.3), seed: 5 });
      // it is not a checkbox: the tick is scribbled out
      SCRIBBLE.forEach((pts, i) => {
        K.stroke(ctx, pts, { w: 5, color: K.C.red, rev: K.seq(t, tickAt - 0.05 + i * 0.05, tickAt + 0.25 + i * 0.05), seed: 20 + i });
      });
      K.keyword(ctx, "CHECKBOX", 1010, 476, t, tickAt, { size: 34, ring: K.C.red, seed: 7 });
      // ordinary things are the training ground
      const ord = wAt(11, /^ordinary/);
      const objs = [
        [[560, 800], [636, 800], [636, 832], [560, 832], [560, 800]],
        [[780, 760], [842, 760], [842, 832], [780, 832], [780, 760]],
        [[960, 782], [1044, 776], [1040, 812], [956, 816], [960, 782]],
      ];
      objs.forEach((pts, i) => {
        K.stroke(ctx, pts, { w: 3.2, color: K.C.ink, rev: K.seq(t, ord + 0.05 + i * 0.14, ord + 0.5 + i * 0.14), seed: 30 + i });
      });
      K.line(ctx, 540, 840, 1080, 840, { w: 2, color: K.C.graphite, alpha: 0.45, rev: K.seq(t, ord + 0.05, ord + 0.35), seed: 43 });
      K.inkEllipse(ctx, 598, 806, 60, 14, { w: 2.2, color: K.C.graphite, rev: K.seq(t, ord + 0.1, ord + 0.5), seed: 40 });
      K.stroke(ctx, [[842, 772], [872, 784], [842, 796]], { w: 3, color: K.C.ink, rev: K.seq(t, ord + 0.45, ord + 0.7), seed: 41 });
      K.line(ctx, 960, 752, 1044, 748, { w: 2.6, color: K.C.graphite, rev: K.seq(t, ord + 0.5, ord + 0.8), seed: 42 });
      K.headline(ctx, "ORDINARY TRAINING GROUND", t, ord, { size: 58, y: 206 });
    },
  };
  const BOXES = [[1120, 520], [1320, 520], [1120, 720], [1320, 720]];
  const SCRIBBLE = [
    [[1136, 570], [1200, 600], [1250, 560], [1190, 620], [1240, 660], [1170, 630]],
    [[1200, 640], [1140, 600], [1220, 560], [1180, 620], [1240, 600]],
  ];

  /* =========================== sc12 =========================== */
  const sc12 = {
    id: "sc12", t0: 52.39, t1: 53.78, si: [12],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, "THE OUTLIER", t, t0 + 0.02, { size: 64 });
      K.line(ctx, 500, 804, 1500, 804, { w: 2.6, color: K.C.graphite, alpha: 0.55, rev: rv(t, t0 + 0.05, 0.35), seed: 1 });
      K.curve(ctx, CURVE, { w: 4, color: K.C.ink, rev: K.seq(t, t0 + 0.1, t0 + 0.6), seed: 2 });
      DOTS.forEach((d, i) => {
        K.inkCircle(ctx, d[0], d[1], 11, { w: 3, color: K.C.ink, rev: K.seq(t, t0 + 0.35 + i * 0.03, t0 + 0.5 + i * 0.03), seed: 10 + i });
      });
      K.inkCircle(ctx, 1566, 800, 13, { w: 4, color: K.C.red, rev: K.seq(t, t0 + 0.55, t0 + 0.85), seed: 4 });
    },
  };

  /* =========================== sc13 =========================== */
  const sc13 = {
    id: "sc13", t0: 53.78, t1: 57.06, si: [12],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, "THE BURDEN OF PROOF", t, t0 + 0.05, { size: 62 });
      K.line(ctx, 500, 804, 1500, 804, { w: 2.6, color: K.C.graphite, alpha: 0.45, rev: 1, seed: 1 });
      K.curve(ctx, CURVE, { w: 3.4, color: K.C.graphite, rev: 1, alpha: 0.7, seed: 2 });
      DOTS.forEach((d, i) => K.inkCircle(ctx, d[0], d[1], 9, { w: 2.4, color: K.C.graphite, rev: 1, seed: 10 + i }));
      // the outlier, still out there
      const press = K.easeIn(K.seq(t, t0 + 0.5, t0 + 1.7));
      const dy = 800 + 16 * press;
      K.inkEllipse(ctx, 1566, dy, 13 + 9 * press, 13 - 4 * press, { w: 4, color: K.C.red, rev: 1, seed: 4 });
      // a weight lowered onto him: the burden of proof
      const wy = 536 + 214 * press;
      K.stroke(ctx, [[1522, wy], [1610, wy], [1594, wy + 62], [1538, wy + 62], [1522, wy]], { w: 4.6, color: K.C.ink, rev: rv(t, t0 + 0.2, 0.4), seed: 5 });
      K.stroke(ctx, [[1552, wy], [1552, wy - 26], [1580, wy - 26], [1580, wy]], { w: 3.4, color: K.C.ink, rev: rv(t, t0 + 0.3, 0.35), seed: 6 });
      K.text(ctx, "PROOF", 1566, wy + 44, { size: 22, weight: 800, color: K.C.ink, align: "center", alpha: rv(t, t0 + 0.4, 0.3) });
      K.keyword(ctx, "OUTLIER", 1300, 720, t, wAt(12, /^outlier/), { size: 34, ring: K.C.red, seed: 6 });
      K.keyword(ctx, "BURDEN OF PROOF", 1010, 400, t, wAt(12, /^burden/), { size: 38, ring: K.C.red, seed: 7 });
      K.arrow(ctx, 1150, 430, 1480, 660, { w: 3, color: K.C.red, rev: K.seq(t, t0 + 0.8, t0 + 1.5), bend: 60 });
    },
  };

  /* =========================== sc14 =========================== */
  const sc14 = {
    id: "sc14", t0: 57.06, t1: 62.16, si: [13],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, "PAUL: A RARE GIFT", t, t0 + 0.05, { size: 62 });
      K.line(ctx, 120, FLOOR, 1800, FLOOR, { w: 2.6, color: K.C.graphite, alpha: 0.4, rev: rv(t, t0 + 0.1, 0.4), seed: 1 });
      const g = K.figure(ctx, {
        x: 880, y: FLOOR, s: 1.05, rev: K.seq(t, t0 + 0.15, t0 + 1.2),
        pose: { armL: [-0.32, -1.62], armR: [0.32, 1.62], headX: 2, headY: 2 },
      });
      // a small gift, cupped in both hands, growing on the word
      const hx = (g.hands[0].x + g.hands[1].x) / 2;
      const hy = g.shoulderY + 132;
      const gift = wAt(13, /^gift/);
      const fl = K.seq(t, 61.0, 61.85);
      if (fl > 0.01) {
        const s = 1.25 + 0.5 * fl;
        const pts = FLAME.map((p) => [hx + p[0] * s, hy + p[1] * s]);
        K.stroke(ctx, pts, { w: 3.6, color: K.C.red, rev: K.easeOut(fl), seed: 2 });
        K.highlight(ctx, hx - 20 * s, hy - 26 * s, 40 * s, 54 * s, { alpha: 0.5 * fl, rev: fl });
        K.stroke(ctx, [[hx, hy + 26 * s], [hx - 6 * s, hy + 8 * s], [hx + 2 * s, hy - 12 * s], [hx + 8 * s, hy + 6 * s], [hx, hy + 20 * s]], { w: 2.4, color: K.C.wash, rev: fl, alpha: 0.95, seed: 3 });
      }
      K.keyword(ctx, "RARE", 1250, 560, t, wAt(13, /^rare/), { size: 36, ring: K.C.blue, seed: 4 });
      K.keyword(ctx, "EXTRAORDINARY", 1180, 680, t, wAt(13, /^extraordinary/), { size: 36, ring: K.C.blue, seed: 5 });
      // one quiet line under the figure: he was single
      K.text(ctx, "he was single", 880, 930, { size: 30, weight: 700, color: K.C.graphite, align: "center", alpha: rv(t, t0 + 1.6, 0.4) });
    },
  };

  /* =========================== sc15 =========================== */
  const sc15 = {
    id: "sc15", t0: 62.16, t1: 64.37, si: [14],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, "ONE IN A THOUSAND", t, t0 + 0.05, { size: 62 });
      K.ticks(ctx, 430, 330, 40, 25, 26, 9, { w: 2, color: K.C.ink, alpha: 0.85, rev: K.seq(t, t0 + 0.1, t0 + 1.1) });
      const at = wAt(14, /^thousand/);
      const k = K.seq(t, at - 0.1, at + 0.3);
      if (k > 0) {
        K.stroke(ctx, [[866, 706], [910, 662]], { w: 8, color: K.C.red, rev: k, seed: 2 });
        K.inkCircle(ctx, 888, 684, 30, { w: 3.4, color: K.C.red, rev: K.seq(t, at, at + 0.35), seed: 3 });
      }
    },
  };

  /* =========================== sc16 =========================== */
  const sc16 = {
    id: "sc16", t0: 64.37, t1: 69.28, si: [15],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, "NOT GIFTED—TICKING", t, t0 + 0.08, { size: 62 });
      K.line(ctx, 120, FLOOR, 1800, FLOOR, { w: 2.6, color: K.C.graphite, alpha: 0.4, rev: rv(t, t0 + 0.1, 0.4), seed: 1 });
      const g = K.figure(ctx, { x: 700, y: FLOOR, s: 1.05, pose: K.POSE.open, rev: K.seq(t, t0 + 0.15, t0 + 1.1) });
      // heat coming off him
      const burn = K.seq(t, t0 + 3.6, t0 + 4.9);
      for (let i = 0; i < 3; i++) {
        const hx = g.head.x - 28 + i * 28;
        const pts = [[hx, g.head.y - g.head.r - 18], [hx + 10, g.head.y - g.head.r - 42], [hx - 6, g.head.y - g.head.r - 66]];
        K.stroke(ctx, pts, { w: 2.6, color: K.C.red, alpha: 0.55 + 0.35 * burn, rev: K.seq(t, t0 + 0.6 + i * 0.15, t0 + 1.4 + i * 0.15), seed: 10 + i });
      }
      // a clock and a fuse
      K.inkCircle(ctx, 1330, 520, 78, { w: 4.2, color: K.C.ink, rev: rv(t, t0 + 0.5, 0.5), seed: 4 });
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i;
        K.line(ctx, 1330 + Math.cos(a) * 62, 520 + Math.sin(a) * 62, 1330 + Math.cos(a) * 72, 520 + Math.sin(a) * 72, { w: 2.4, color: K.C.ink, rev: rv(t, t0 + 0.9, 0.3), seed: 20 + i });
      }
      const tickCount = Math.floor((t - t0) / 0.62);
      const secA = -Math.PI / 2 + (tickCount % 12) * (Math.PI / 6);
      K.line(ctx, 1330, 520, 1330 + Math.cos(secA) * 58, 520 + Math.sin(secA) * 58, { w: 3.4, color: K.C.red, rev: 1, seed: 5 });
      K.line(ctx, 1330, 520, 1330, 520 - 44, { w: 3, color: K.C.ink, rev: rv(t, t0 + 1.0, 0.3), seed: 6 });
      // fuse from his hand to the clock, burning down
      const lit = K.seq(t, t0 + 1.4, t0 + 5.0);
      K.stroke(ctx, FUSE, { w: 3, color: K.C.graphite, alpha: 0.5, rev: rv(t, t0 + 0.9, 0.5), seed: 7 });
      const keep = 1 - lit * 0.92;
      K.stroke(ctx, FUSE, { w: 3.6, color: K.C.ink, rev: keep, seed: 8 });
      if (lit > 0.005 && lit < 0.995) {
        const fi = Math.floor(keep * (FUSE.length - 1));
        const p = FUSE[fi];
        K.inkCircle(ctx, p[0], p[1], 7, { w: 3, color: K.C.red, rev: 1, seed: 9 });
        for (let i = 0; i < 3; i++) {
          const a = -0.9 + i * 0.9;
          K.line(ctx, p[0], p[1], p[0] + Math.cos(a) * 16, p[1] - 14 - Math.sin(a) * 10, { w: 1.8, color: K.C.wash, rev: 1, alpha: 0.8, seed: 30 + i });
        }
      }
      // "not gifted": a red cross on the word itself
      const gt = wAt(15, /^gifted/);
      const x0 = 100 + K.textWidth(ctx, "NOT ", 62, 800, -0.5);
      const wq = K.textWidth(ctx, "GIFTED", 62, 800, -0.5);
      K.screen(ctx, () => {
        K.stroke(ctx, [[x0 - 30, 72], [x0 + wq - 8, 196]], { w: 8, color: K.C.red, rev: K.seq(t, gt - 0.05, gt + 0.3), seed: 11 });
        K.stroke(ctx, [[x0 + wq - 8, 72], [x0 - 30, 196]], { w: 8, color: K.C.red, rev: K.seq(t, gt + 0.18, gt + 0.5), seed: 12 });
      });
      K.keyword(ctx, "TIME BOMB", 1280, 740, t, Math.min(wAt(15, /^bomb/), 68.4), { size: 38, ring: K.C.red, seed: 13 });
    },
  };

  /* =========================== sc17 =========================== */
  const sc17 = {
    id: "sc17", t0: 69.28, t1: 75.68, si: [16],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, ["LOOK FOR A HUSBAND", "AND A FATHER"], t, t0 + 0.1, { size: 64 });
      // a small family, drawn quietly behind the words
      const fam = K.seq(t, t0 + 4.6, t0 + 5.6);
      if (fam > 0) {
        ctx.save();
        ctx.globalAlpha = fam * 0.9;
        K.figure(ctx, { x: 1590, y: FLOOR, s: 0.6, pose: K.POSE.stand, rev: fam });
        K.figure(ctx, { x: 1470, y: FLOOR, s: 0.58, pose: K.POSE.stand, flip: true, rev: fam });
        K.figure(ctx, { x: 1530, y: FLOOR, s: 0.34, pose: K.POSE.stand, rev: fam });
        ctx.restore();
      }
      const ch = wAt(16, /^character/);
      const hus = wAt(16, /^husband/);
      const fat = wAt(16, /^father/);
      // character is the real qualification
      K.keyword(ctx, "CHARACTER", 360, 560, t, ch, { size: 40, ring: K.C.red, circle: true, seed: 2 });
      const cw = K.textWidth(ctx, "CHARACTER", 40, 800, 0.6);
      K.stroke(ctx, [[360 + cw + 34, 520], [360 + cw + 62, 552], [360 + cw + 116, 476]], { w: 8, color: K.C.blue, rev: K.seq(t, ch + 0.35, ch + 0.7), seed: 3 });
      // ordinarily, a husband and a father
      K.keyword(ctx, "HUSBAND", 820, 700, t, hus, { size: 38, ring: K.C.red, circle: true, seed: 4 });
      K.keyword(ctx, "FATHER", 1300, 560, t, fat, { size: 38, ring: K.C.red, circle: true, seed: 5 });
      // the closing underline sweeps under the headline
      const endU = K.easeOut(K.seq(t, 73.4, 74.4));
      K.screen(ctx, () => {
        const y = 128 + 64 * 1.16 + 16;
        K.stroke(ctx, [[96, y], [96 + 900 * endU, y + 2]], { w: 7, color: K.C.ink, rev: endU, alpha: 0.9, seed: 6 });
      });
      void t0;
    },
  };

  [sc10, sc11, sc12, sc13, sc14, sc15, sc16, sc17].forEach((s) => S.push(s));
})();
