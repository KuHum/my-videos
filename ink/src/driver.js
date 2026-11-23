/* Scene driver — page selection, page-turn transitions, paper grain, end fade.
   Integrator-owned: writers only push scenes into window.SCENES. */
(function () {
  const K = window.K;
  const TR = 0.22;   // page-turn blink


  window.drawAt = function (ctx, t) {
    const S = window.SCENES;
    t = Math.max(0, Math.min(t, window.B.duration - 0.001));

    let idx = 0;
    for (let i = 0; i < S.length; i++) if (t >= S[i].t0) idx = i;
    const sc = S[idx];

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    K.paper(ctx);

    const turning = idx > 0 && t < sc.t0 + TR;
    if (turning) {
      // a page-turn blink: the old page dips to paper, then the new page inks
      // in. Nothing doubles up and no headline is ever cut mid-glyph.
      const p = K.clamp01((t - sc.t0) / TR);
      const prev = S[idx - 1];
      const half = 0.5;
      let a;
      if (p < half) {
        prev.draw(ctx, Math.max(prev.t0, prev.t1 - 0.001));
        a = 0.9 * K.ease(p / half);
      } else {
        sc.draw(ctx, t);
        a = 0.9 * (1 - K.ease((p - half) / (1 - half)));
      }
      if (a > 0.001) {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = K.C.paper;
        ctx.fillRect(0, 0, K.W, K.H);
        ctx.restore();
      }
    } else {
      sc.draw(ctx, t);
    }

    K.grain(ctx, 0.5, 0, 0);

    // open on paper, close on paper
    const fadeIn = K.ease(K.seq(t, 0, 0.38));
    const fadeOut = K.ease(K.seq(t, window.B.duration - 0.5, window.B.duration - 0.04));
    const a = Math.max(1 - fadeIn, fadeOut);
    if (a > 0.001) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = K.C.paper;
      ctx.fillRect(0, 0, K.W, K.H);
      ctx.restore();
    }
    ctx.restore();
    return sc;
  };
})();
