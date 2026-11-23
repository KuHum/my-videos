/* Scenes 1–9 — Stickman (Ink). First half of "Your Single Pastor".
   Every page: paper is drawn by the driver; content inks on here. */
(function () {
  const K = window.K, B = window.B;
  const S = (window.SCENES = window.SCENES || []);
  const rv = (t, a, d) => K.easeOut(K.seq(t, a, a + (d == null ? 0.5 : d)));
  const FLOOR = 872;

  // word time helper: first word of sentence si matching re
  const wAt = (si, re) => {
    const s = B.sentences[si];
    const hit = s.words.find((x) => re.test(x.w.toLowerCase().replace(/[^a-z]/g, "")));
    return hit ? hit.t : s.sp;
  };

  const arch = (x, y, w, h) => {
    const r = w / 2, pts = [], N = 20;
    pts.push([x, y + h], [x, y + r]);
    for (let i = 0; i <= N; i++) {
      const a = Math.PI * (1 - i / N);
      pts.push([x + r + Math.cos(a) * r, y + r - Math.sin(a) * r]);
    }
    pts.push([x + w, y + h]);
    return pts;
  };

  /* =========================== sc01 =========================== */
  const sc01 = {
    id: "sc01", t0: 0.09, t1: 4.79, si: [0],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, ["MARRIAGE ISN'T", "A MUST"], t, t0 + 0.05, { size: 66 });
      K.line(ctx, 120, FLOOR, 1800, FLOOR, { w: 3, color: K.C.graphite, alpha: 0.5, rev: rv(t, t0 + 0.1, 0.5), seed: 1 });
      // a chapel window on the back wall, with its sill
      K.stroke(ctx, ARCH_WIN, { w: 3, color: K.C.graphite, alpha: 0.7, rev: rv(t, t0 + 0.35, 0.7) });
      K.stroke(ctx, [[262, 690], [262, 452]], { w: 1.4, color: K.C.graphite, alpha: 0.45, rev: rv(t, t0 + 0.7, 0.5) });
      K.stroke(ctx, [[498, 690], [498, 452]], { w: 1.4, color: K.C.graphite, alpha: 0.45, rev: rv(t, t0 + 0.75, 0.5) });
      K.line(ctx, 230, 690, 530, 690, { w: 3.4, color: K.C.graphite, alpha: 0.6, rev: rv(t, t0 + 0.8, 0.3), seed: 3 });
      // the pastor stands behind the pulpit: figure first, pulpit in front
      const g = K.figure(ctx, { x: 840, y: FLOOR, s: 1.0, pose: K.POSE.stand, rev: K.seq(t, t0 + 0.5, t0 + 1.6) });
      if (t > t0 + 1.3) {
        ctx.save();
        ctx.globalAlpha = rv(t, t0 + 1.4, 0.2);
        ctx.fillStyle = K.C.paper;
        ctx.fillRect(g.head.x - 11, g.head.y + g.head.r - 4, 22, 15);
        K.stroke(ctx, [[g.head.x - 11, g.head.y + g.head.r - 4], [g.head.x - 11, g.head.y + g.head.r + 11]], { w: 2, color: K.C.ink, rev: 1 });
        K.stroke(ctx, [[g.head.x + 11, g.head.y + g.head.r - 4], [g.head.x + 11, g.head.y + g.head.r + 11]], { w: 2, color: K.C.ink, rev: 1 });
        ctx.restore();
      }
      // the pulpit panel hides his legs
      K.stroke(ctx, [[740, 706], [950, 706], [972, FLOOR], [718, FLOOR], [740, 706]], { w: 4.4, color: K.C.ink, rev: rv(t, t0 + 0.25, 0.6) });
      K.hatch(ctx, 764, 722, 172, 132, { alpha: 0.2, rev: rv(t, t0 + 0.6, 0.5), step: 22 });
      K.line(ctx, 716, 698, 976, 698, { w: 6, color: K.C.ink, rev: rv(t, t0 + 0.7, 0.3), seed: 4 });
      // the wedding ring, and the strike on "must"
      K.inkCircle(ctx, RING.x, RING.y, 58, { w: 6, color: K.C.ink, rev: rv(t, t0 + 2.0, 0.5), seed: 21 });
      K.stroke(ctx, [[RING.x - 16, RING.y - 62], [RING.x - 6, RING.y - 86], [RING.x + 16, RING.y - 70]], { w: 3, color: K.C.ink, rev: rv(t, t0 + 2.3, 0.35) });
      const hit = wAt(0, /^must/);
      K.stroke(ctx, [[RING.x - 96, RING.y - 96], [RING.x + 92, RING.y + 92]], { w: 9, color: K.C.red, rev: K.easeOut(K.seq(t, hit - 0.02, hit + 0.28)), alpha: 0.95, seed: 5 });
      K.keyword(ctx, "MUST", 1270, 470, t, hit, { size: 36, ring: K.C.red, circle: true, seed: 8 });
    },
  };
  const RING = { x: 1440, y: 640 };
  const ARCH_WIN = arch(250, 430, 260, 250);

  /* =========================== sc02 =========================== */
  const sc02 = {
    id: "sc02", t0: 4.79, t1: 13.07, si: [1],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, ["THE CASE FOR", "SINGLENESS"], t, t0 + 0.05, { size: 64 });
      K.line(ctx, 120, FLOOR, 1800, FLOOR, { w: 3, color: K.C.graphite, alpha: 0.5, rev: rv(t, t0 + 0.1, 0.5), seed: 2 });
      // the path and a little back-plane life
      const back = rv(t, t0 + 0.2, 0.8);
      BIRDS.forEach((b, i) => {
        const fl = Math.sin((t - t0) * 2.2 + i) * 5;
        K.stroke(ctx, [[b[0] - 22, b[1] + fl], [b[0] - 4, b[1] - 9 + fl]], { w: 2.6, color: K.C.graphite, alpha: 0.5, rev: back, seed: 40 + i });
        K.stroke(ctx, [[b[0] - 4, b[1] - 9 + fl], [b[0] + 14, b[1] + fl]], { w: 2.6, color: K.C.graphite, alpha: 0.5, rev: back, seed: 50 + i });
      });
      TUFTS.forEach((tu, i) => K.stroke(ctx, tu, { w: 2.2, color: K.C.graphite, alpha: 0.5, rev: rv(t, t0 + 0.4 + i * 0.08, 0.3), seed: 30 + i }));
      // the walker
      const walk = K.easeOut(K.seq(t, t0 + 0.2, t0 + 7.6));
      const x = 300 + 560 * walk;
      const stride = Math.sin((t - t0) * 5.0) * 0.5 + 0.5;
      const pose = K.mixPose(K.POSE.walk, K.POSE.stand, K.seq(t, t0 + 6.6, t0 + 7.4));
      pose.legL = [-0.08 - 0.16 * stride, 0.05 + 0.12 * stride];
      pose.legR = [0.05 + 0.14 * (1 - stride), -0.04 - 0.1 * (1 - stride)];
      K.figure(ctx, { x, y: FLOOR, s: 1.0, pose, rev: K.seq(t, t0 + 0.2, t0 + 1.2) });
      // three signposts, boards under the labels
      const posts = [
        { x: 1010, y: 600, at: wAt(1, /^self/), text: "SELF-DISCOVERY" },
        { x: 1210, y: 450, at: wAt(1, /^maturity/), text: "MATURITY" },
        { x: 1430, y: 300, at: wAt(1, /^pressuring/), text: "STOP PRESSURING" },
      ];
      for (const p of posts) {
        K.line(ctx, p.x, p.y + 30, p.x, FLOOR, { w: 3.4, color: K.C.ink, rev: rv(t, p.at - 0.12, 0.35), seed: p.x });
        K.line(ctx, p.x - 16, p.y + 30, p.x + 16, p.y + 30, { w: 3, color: K.C.ink, rev: rv(t, p.at - 0.05, 0.2), seed: p.x + 1 });
        K.keyword(ctx, p.text, p.x + 34, p.y, t, p.at, { size: 34, ring: K.C.blue, circle: true, seed: p.y });
      }
      // the crowd pushes; the arrows retract on "pressuring"
      const pr = wAt(1, /^pressuring/);
      const push = 1 - K.easeIn(K.seq(t, pr, pr + 0.7));
      [0, 1].forEach((i) => {
        const cx = 120 + i * 96;
        K.figure(ctx, { x: cx, y: FLOOR, s: 0.62, pose: K.POSE.point, flip: true, rev: K.seq(t, t0 + 0.8 + i * 0.15, t0 + 1.5) });
        if (push > 0.02) K.arrow(ctx, cx + 36, FLOOR - 150, cx + 36 + 120 * push, FLOOR - 158, { w: 3, color: K.C.red, rev: push, head: 12, bend: 10 });
      });
    },
  };
  const BIRDS = [[820, 470], [1180, 418]];
  const TUFTS = [
    [[1560, 884], [1566, 858]], [[1560, 884], [1574, 866]], [[1560, 884], [1552, 864]],
    [[170, 900], [176, 874]], [[170, 900], [184, 882]],
    [[760, 878], [766, 852]], [[760, 878], [774, 860]],
  ];

  /* =========================== sc03 =========================== */
  const sc03 = {
    id: "sc03", t0: 13.07, t1: 15.40, si: [2],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, "A QUALIFIER", t, t0 + 0.05, { size: 64 });
      K.box(ctx, 430, 350, 1040, 400, { w: 3, color: K.C.ink, alpha: 0.85, rev: rv(t, t0 + 0.05, 0.45), seed: 4 });
      K.text(ctx, "MARRIAGE ISN'T A MUST", 470, 470, { size: 44, weight: 700, color: K.C.graphite, alpha: rv(t, t0 + 0.3, 0.3) });
      K.text(ctx, "QUALIFIER", 470, 640, { size: 58, weight: 800, color: K.C.ink, alpha: rv(t, t0 + 0.45, 0.3) });
      const qw = K.textWidth(ctx, "QUALIFIER", 58, 800, 0);
      const at = wAt(2, /^qualifier/);
      K.inkEllipse(ctx, 470 + qw / 2, 640 - 20, qw / 2 + 26, 48, { w: 4, color: K.C.red, rev: K.seq(t, at - 0.15, at + 0.35), seed: 12 });
      K.stroke(ctx, [[455, 690], [470 + qw + 10, 570]], { w: 8, color: K.C.red, rev: K.seq(t, at + 0.1, at + 0.4), alpha: 0.95, seed: 6 });
    },
  };

  /* =========================== sc04 =========================== */
  const sc04 = {
    id: "sc04", t0: 15.41, t1: 20.20, si: [3, 4],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, "AUTOMATICALLY? NO.", t, t0 + 0.08, { size: 64 });
      K.headline(ctx, "PROBABLY? YES.", t, t0 + 2.55, { size: 64, y: 206 });
      K.line(ctx, 120, FLOOR, 1800, FLOOR, { w: 3, color: K.C.graphite, alpha: 0.45, rev: rv(t, t0 + 0.1, 0.5), seed: 7 });
      K.figure(ctx, { x: 640, y: FLOOR, s: 1.0, pose: K.POSE.think, rev: K.seq(t, t0 + 0.15, t0 + 1.0) });
      const no = wAt(3, /^no/);
      const q = 1 - K.ease(K.seq(t, no - 0.12, no + 0.2));
      if (q > 0.01) K.text(ctx, "?", 640, 520, { size: 116, weight: 800, color: K.C.ink, align: "center", alpha: q });
      const tick = K.ease(K.seq(t, no + 0.02, no + 0.4));
      if (tick > 0) {
        K.stroke(ctx, [[602, 486], [630, 516], [686, 440]], { w: 9, color: K.C.ink, rev: tick, seed: 9 });
      }
      K.keyword(ctx, "NO", 850, 760, t, no, { size: 34, ring: K.C.red, seed: 14 });
      // an unlabelled probability meter: no invented numbers
      const mAt = wAt(4, /^$/) || this.t0;
      const mRev = K.seq(t, t0 + 3.4, t0 + 4.1);
      K.box(ctx, 1160, 600, 560, 92, { w: 3, color: K.C.ink, rev: mRev, seed: 3 });
      const yes = wAt(4, /^yes/);
      const mv = K.easeOut(K.seq(t, yes - 0.05, yes + 0.45));
      const nx = 1200 + 430 * mv;
      K.stroke(ctx, [[1220, 646], [nx, 646]], { w: 10, color: K.C.red, rev: Math.max(mRev * 0.4, mv), alpha: 0.85 });
      K.stroke(ctx, [[nx, 604], [nx - 15, 630], [nx + 15, 630], [nx, 604]], { w: 4, color: K.C.ink, rev: mv, seed: 4 });
      K.keyword(ctx, "YES", 1350, 500, t, Math.min(yes, 19.5), { size: 34, ring: K.C.blue, seed: 15 });
      void mAt;
    },
  };

  /* =========================== sc05 =========================== */
  const sc05 = {
    id: "sc05", t0: 20.20, t1: 24.18, si: [5],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, "THE QUESTION ISN'T THAT", t, t0 + 0.05, { size: 62 });
      K.box(ctx, 380, 330, 1180, 490, { w: 3, color: K.C.graphite, alpha: 0.6, rev: rv(t, t0 + 0.1, 0.5), seed: 8 });
      // prayer: two palms
      const godly = wAt(5, /^godly/);
      K.stroke(ctx, [[600, 700], [612, 620], [640, 586], [648, 600], [640, 690]], { w: 5, color: K.C.ink, rev: rv(t, t0 + 0.3, 0.5), seed: 2 });
      K.stroke(ctx, [[690, 700], [678, 620], [652, 586], [644, 600], [652, 690]], { w: 5, color: K.C.ink, rev: rv(t, t0 + 0.45, 0.5), seed: 3 });
      K.stroke(ctx, [[630, 640], [660, 640]], { w: 2, color: K.C.graphite, rev: rv(t, t0 + 0.8, 0.3), alpha: 0.7 });
      K.stroke(ctx, [[760, 620], [782, 648], [826, 588]], { w: 8, color: K.C.blue, rev: K.seq(t, godly, godly + 0.35), seed: 4 });
      // fruit: a branch with two apples
      const fruit = wAt(5, /^fruitful/);
      K.stroke(ctx, [[1100, 720], [1104, 640], [1112, 600]], { w: 4, color: K.C.ink, rev: rv(t, t0 + 0.7, 0.5), seed: 5 });
      K.stroke(ctx, [[1104, 646], [1150, 626], [1176, 638]], { w: 3, color: K.C.ink, rev: rv(t, t0 + 0.95, 0.4), seed: 6 });
      K.inkCircle(ctx, 1168, 668, 26, { w: 4, color: K.C.ink, rev: rv(t, t0 + 1.1, 0.35), seed: 7 });
      K.inkCircle(ctx, 1116, 586, 21, { w: 4, color: K.C.ink, rev: rv(t, t0 + 1.25, 0.35), seed: 8 });
      K.stroke(ctx, [[1240, 640], [1262, 668], [1304, 610]], { w: 8, color: K.C.blue, rev: K.seq(t, fruit, fruit + 0.35), seed: 9 });
      K.keyword(ctx, "GODLY", 560, 520, t, godly, { size: 34, ring: K.C.blue, seed: 16 });
      K.keyword(ctx, "FRUITFUL", 1030, 520, t, Math.min(fruit, 23.5), { size: 34, ring: K.C.blue, seed: 17 });
      // the whole idea crossed out on "isn't"
      const isn = wAt(5, /^isnt/);
      K.stroke(ctx, [[404, 790], [1536, 372]], { w: 10, color: K.C.ink, rev: K.seq(t, isn - 0.05, isn + 0.45), alpha: 0.9, seed: 1 });
    },
  };

  /* =========================== sc06 =========================== */
  const sc06 = {
    id: "sc06", t0: 24.18, t1: 28.65, si: [6],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, ["WHAT THE APOSTLES", "EXPECTED"], t, t0 + 0.05, { size: 64 });
      // unrolled scroll
      K.stroke(ctx, [[470, 392], [1150, 392], [1150, 748], [470, 748], [470, 392]], { w: 3.4, color: K.C.ink, rev: rv(t, t0 + 0.1, 0.6), seed: 2 });
      K.inkEllipse(ctx, 470, 570, 22, 178, { w: 3, color: K.C.ink, rev: rv(t, t0 + 0.4, 0.4), seed: 3 });
      K.inkEllipse(ctx, 1150, 570, 22, 178, { w: 3, color: K.C.ink, rev: rv(t, t0 + 0.5, 0.4), seed: 4 });
      RULE_LINES.forEach((y, i) => {
        K.line(ctx, 520, y, 1100, y + (i % 2 ? 2 : -2), { w: 2.4, color: K.C.graphite, alpha: 0.55, rev: rv(t, t0 + 0.8 + i * 0.12, 0.35), seed: i + 20 });
      });
      // the doorway, and the man fit to pastor inking into it
      K.stroke(ctx, arch(1380, 300, 280, 572), { w: 4, color: K.C.ink, rev: rv(t, t0 + 0.9, 0.7), seed: 5 });
      K.hatch(ctx, 1392, 320, 256, 540, { alpha: 0.16, rev: rv(t, t0 + 1.4, 0.6), step: 26 });
      const fit = wAt(6, /^fit/);
      K.figure(ctx, { x: 1520, y: 862, s: 0.95, pose: K.POSE.stand, color: K.C.ink, rev: K.seq(t, fit - 0.1, fit + 0.7) });
      K.keyword(ctx, "FIT TO PASTOR", 1230, 292, t, fit, { size: 34, ring: K.C.red, seed: 18 });
    },
  };
  const RULE_LINES = [470, 530, 590, 650, 700];

  /* =========================== sc07 =========================== */
  const sc07 = {
    id: "sc07", t0: 28.65, t1: 34.81, si: [7],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, "A ONE-WOMAN MAN", t, t0 + 0.05, { size: 64 });
      // certificate
      K.box(ctx, 470, 380, 660, 420, { w: 3.2, color: K.C.ink, rev: rv(t, t0 + 0.1, 0.5), seed: 6 });
      K.line(ctx, 520, 500, 1060, 502, { w: 2.6, color: K.C.graphite, alpha: 0.6, rev: rv(t, t0 + 0.5, 0.35), seed: 7 });
      K.line(ctx, 520, 560, 1000, 562, { w: 2.6, color: K.C.graphite, alpha: 0.6, rev: rv(t, t0 + 0.65, 0.35), seed: 8 });
      K.line(ctx, 520, 620, 1040, 622, { w: 2.6, color: K.C.graphite, alpha: 0.6, rev: rv(t, t0 + 0.8, 0.35), seed: 9 });
      K.inkCircle(ctx, 1040, 712, 44, { w: 3, color: K.C.graphite, rev: rv(t, t0 + 1.0, 0.4), seed: 10 });
      K.text(ctx, "MARRIAGE", 560, 468, { size: 40, weight: 800, color: K.C.ink, alpha: rv(t, t0 + 0.6, 0.3) });
      // the ring that stays
      K.inkCircle(ctx, 1460, 560, 66, { w: 6, color: K.C.ink, rev: rv(t, t0 + 1.5, 0.5), seed: 12 });
      K.stroke(ctx, [[1444, 494], [1460, 462], [1476, 494]], { w: 3, color: K.C.ink, rev: rv(t, t0 + 1.9, 0.3), seed: 13 });
      // the X over the certificate on "not a marriage certificate"
      const cert = wAt(7, /^certificate/);
      K.stroke(ctx, [[446, 358], [1154, 822]], { w: 9, color: K.C.red, rev: K.seq(t, cert - 0.05, cert + 0.35), seed: 14 });
      K.stroke(ctx, [[1154, 358], [446, 822]], { w: 9, color: K.C.red, rev: K.seq(t, cert + 0.18, cert + 0.5), seed: 15 });
      // character is the thing that holds
      const ch = wAt(7, /^character/);
      K.keyword(ctx, "CHARACTER", 1240, 780, t, ch, { size: 38, ring: K.C.red, circle: true, seed: 19 });
    },
  };

  /* =========================== sc08 =========================== */
  const house = (ctx, t, t0, rev0) => {
    K.stroke(ctx, [[620, 460], [960, 300], [1300, 460]], { w: 4.4, color: K.C.ink, rev: rv(t, t0 + rev0, 0.6), seed: 2 });
    K.stroke(ctx, [[620, 460], [620, 868], [1300, 868], [1300, 460]], { w: 4, color: K.C.ink, rev: rv(t, t0 + rev0 + 0.2, 0.6), seed: 3 });
    K.line(ctx, 620, 460, 1300, 460, { w: 4, color: K.C.ink, rev: rv(t, t0 + rev0 + 0.4, 0.3), seed: 4 });
    // door
    K.stroke(ctx, [[904, 868], [904, 700], [1016, 700], [1016, 868]], { w: 3.4, color: K.C.ink, rev: rv(t, t0 + rev0 + 0.5, 0.4), seed: 5 });
    // windows
    K.box(ctx, 688, 548, 104, 104, { w: 3, color: K.C.ink, rev: rv(t, t0 + rev0 + 0.6, 0.4), seed: 6 });
    K.box(ctx, 1128, 548, 104, 104, { w: 3, color: K.C.ink, rev: rv(t, t0 + rev0 + 0.7, 0.4), seed: 7 });
    K.line(ctx, 740, 548, 740, 652, { w: 2, color: K.C.graphite, rev: rv(t, t0 + rev0 + 0.9, 0.3), seed: 8 });
    K.line(ctx, 1180, 548, 1180, 652, { w: 2, color: K.C.graphite, rev: rv(t, t0 + rev0 + 0.95, 0.3), seed: 9 });
  };

  const sc08 = {
    id: "sc08", t0: 34.81, t1: 41.24, si: [8],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, ["MANAGE HIS", "HOUSEHOLD"], t, t0 + 0.05, { size: 64 });
      K.line(ctx, 120, FLOOR, 1800, FLOOR, { w: 3, color: K.C.graphite, alpha: 0.45, rev: rv(t, t0 + 0.1, 0.4), seed: 10 });
      house(ctx, t, t0, 0.15);
      // table and chairs
      K.line(ctx, 800, 782, 1120, 782, { w: 4, color: K.C.ink, rev: rv(t, t0 + 1.5, 0.4), seed: 11 });
      K.line(ctx, 820, 782, 820, 872, { w: 3, color: K.C.ink, rev: rv(t, t0 + 1.7, 0.3), seed: 12 });
      K.line(ctx, 1100, 782, 1100, 872, { w: 3, color: K.C.ink, rev: rv(t, t0 + 1.75, 0.3), seed: 13 });
      K.stroke(ctx, [[744, 800], [744, 868], [700, 868]], { w: 3, color: K.C.ink, rev: rv(t, t0 + 1.9, 0.3), seed: 14 });
      K.stroke(ctx, [[1176, 800], [1176, 868], [1220, 868]], { w: 3, color: K.C.ink, rev: rv(t, t0 + 1.95, 0.3), seed: 15 });
      // the child at the table, the pastor carrying the pot
      K.figure(ctx, { x: 960, y: 782, s: 0.5, pose: K.POSE.sit, rev: K.seq(t, t0 + 2.0, t0 + 2.7) });
      const g = K.figure(ctx, { x: 1250, y: FLOOR, s: 0.95, pose: K.POSE.carry, flip: true, rev: K.seq(t, t0 + 2.2, t0 + 3.1) });
      if (t > t0 + 2.9) {
        const hx = (g.hands[0].x + g.hands[1].x) / 2, hy = (g.hands[0].y + g.hands[1].y) / 2 + 12;
        K.stroke(ctx, [[hx - 34, hy - 30], [hx - 34, hy + 14], [hx + 34, hy + 14], [hx + 34, hy - 30]], { w: 3, color: K.C.ink, rev: rv(t, t0 + 3.0, 0.3), seed: 16 });
        K.inkEllipse(ctx, hx, hy - 30, 34, 12, { w: 2.4, color: K.C.ink, rev: rv(t, t0 + 3.1, 0.25), seed: 17 });
      }
      K.keyword(ctx, "HOUSEHOLD", 980, 250, t, wAt(8, /^household/), { size: 38, ring: K.C.blue, seed: 20 });
    },
  };

  /* =========================== sc09 =========================== */
  const sc09 = {
    id: "sc09", t0: 41.24, t1: 45.33, si: [8],
    draw(ctx, t) {
      const t0 = this.t0;
      K.headline(ctx, ["HOW WILL HE CARE", "FOR THE CHURCH?"], t, t0 + 0.05, { size: 62 });
      K.line(ctx, 120, FLOOR, 1800, FLOOR, { w: 3, color: K.C.graphite, alpha: 0.45, rev: 1, seed: 21 });
      house(ctx, t, t0, -2.4); // already on the page
      // table stays, the family stays
      K.line(ctx, 800, 782, 1120, 782, { w: 4, color: K.C.ink, rev: 1, seed: 22 });
      K.line(ctx, 820, 782, 820, 872, { w: 3, color: K.C.ink, rev: 1, seed: 23 });
      K.line(ctx, 1100, 782, 1100, 872, { w: 3, color: K.C.ink, rev: 1, seed: 24 });
      K.figure(ctx, { x: 960, y: 782, s: 0.5, pose: K.POSE.sit, rev: 1 });
      K.figure(ctx, { x: 1250, y: FLOOR, s: 0.95, pose: K.POSE.stand, flip: true, rev: 1 });
      // the roof grows a steeple: the household becomes the church
      const sp = K.seq(t, t0 + 0.3, t0 + 1.3);
      K.stroke(ctx, [[930, 300], [930, 170], [990, 170], [990, 300]], { w: 3.6, color: K.C.ink, rev: rv(t, t0 + 0.3, 0.5), seed: 2 });
      K.stroke(ctx, [[930, 170], [960, 96], [990, 170]], { w: 3.6, color: K.C.ink, rev: rv(t, t0 + 0.7, 0.45), seed: 3 });
      K.inkCircle(ctx, 960, 214, 17, { w: 2.6, color: K.C.ink, rev: rv(t, t0 + 1.1, 0.3), seed: 4 });
      void sp;
      // windows become arched
      const archAt = K.seq(t, t0 + 1.5, t0 + 2.4);
      if (archAt > 0) {
        K.stroke(ctx, arch(688, 520, 104, 130), { w: 2.6, color: K.C.ink, rev: archAt, seed: 5 });
        K.stroke(ctx, arch(1128, 520, 104, 130), { w: 2.6, color: K.C.ink, rev: K.seq(t, t0 + 1.7, t0 + 2.6), seed: 6 });
      }
      // pews in the nave
      const pews = K.seq(t, t0 + 2.8, t0 + 3.7);
      [790, 826, 858].forEach((y, i) => {
        K.line(ctx, 700 + i * 8, y, 1180 - i * 8, y, { w: 3, color: K.C.ink, rev: rv(t, t0 + 2.8 + i * 0.18, 0.35), seed: 30 + i });
        K.line(ctx, 716 + i * 8, y, 716 + i * 8, y + 12, { w: 2.2, color: K.C.ink, rev: rv(t, t0 + 3.0 + i * 0.18, 0.3), seed: 40 + i });
      });
      K.keyword(ctx, "CHURCH", 1360, 700, t, Math.min(wAt(8, /^church/), 44.42), { size: 38, ring: K.C.red, seed: 22 });
      void pews;
    },
  };

  [sc01, sc02, sc03, sc04, sc05, sc06, sc07, sc08, sc09].forEach((s) => S.push(s));
})();
