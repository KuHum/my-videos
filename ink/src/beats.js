/* Timing map — estimated from narration pauses (no SRT). Single source of truth. */
(function () {
  const B = (window.B = {});
  B.duration = 75.68;
  B.estimated = true;
  B.sceneDur = 0;

  // sentence spans: start/end sit mid-pause; sp/ep are the spoken bounds
  B.sentences = [
    { i: 0, start: 0.09, end: 4.79, sp: 0.19, ep: 4.65, text: "A while back, a Ugandan pastor said marriage isn't a must for ministers." },
    { i: 1, start: 4.79, end: 13.07, sp: 4.89, ep: 12.93, text: "Singleness, he argued, offers self-discovery and spiritual maturity and the church should stop pressuring pastors to marry." },
    { i: 2, start: 13.07, end: 15.40, sp: 13.17, ep: 15.26, text: "I disagree with a qualifier." },
    { i: 3, start: 15.40, end: 18.41, sp: 15.50, ep: 18.27, text: "Is your single pastor automatically a problem? No." },
    { i: 4, start: 18.41, end: 20.20, sp: 18.51, ep: 20.06, text: "Probably a problem? Yes." },
    { i: 5, start: 20.20, end: 24.18, sp: 20.30, ep: 24.04, text: "The question isn't whether a single man can be godly or fruitful." },
    { i: 6, start: 24.18, end: 28.65, sp: 24.28, ep: 28.51, text: "It's what the apostles expected when they described the man fit to pastor." },
    { i: 7, start: 28.65, end: 34.81, sp: 28.75, ep: 34.67, text: "Paul says a pastor must be \"a one-woman man\" that's about character, not a marriage certificate." },
    { i: 8, start: 34.81, end: 45.33, sp: 34.91, ep: 45.19, text: "But he immediately adds that a pastor must manage his own household well because if he can't run his family, how will he care for God's church?" },
    { i: 9, start: 45.33, end: 47.44, sp: 45.43, ep: 47.30, text: "The household is God's proving ground for shepherds." },
    { i: 10, start: 47.44, end: 50.80, sp: 47.54, ep: 50.66, text: "So marriage isn't a magic checkbox." },
    { i: 11, start: 50.80, end: 52.39, sp: 50.90, ep: 52.25, text: "It's the ordinary training ground." },
    { i: 12, start: 52.39, end: 57.06, sp: 52.49, ep: 56.92, text: "That's why the single candidate should be the outlier the burden of proof is on him." },
    { i: 13, start: 57.06, end: 62.16, sp: 57.16, ep: 62.02, text: "What about Paul? He was single but he calls his celibacy a rare, extraordinary gift." },
    { i: 14, start: 62.16, end: 64.37, sp: 62.26, ep: 64.23, text: "Luther said one in a thousand." },
    { i: 15, start: 64.37, end: 69.28, sp: 64.47, ep: 69.14, text: "A single man burning with passion isn't gifted; he's a ticking time bomb." },
    { i: 16, start: 69.28, end: 75.29, sp: 69.38, ep: 75.15, text: "So: character is the real qualification but ordinarily, look for a husband and a father." },
  ];

  const syl = (w) => {
    w = w.toLowerCase().replace(/[^a-z']/g, "");
    const g = w.match(/[aeiouy]+/g);
    let n = g ? g.length : 1;
    if (/e$/.test(w) && n > 1) n--;
    return Math.max(1, n);
  };
  B.syl = syl;

  for (const s of B.sentences) {
    const words = s.text.split(/\s+/).filter(Boolean).map((w) => ({ w, syl: syl(w) }));
    const tot = words.reduce((a, x) => a + x.syl, 0);
    let acc = 0;
    s.words = words.map((x) => {
      const t0 = s.sp + (s.ep - s.sp) * (acc / tot);
      acc += x.syl;
      const t1 = s.sp + (s.ep - s.sp) * (acc / tot);
      return { w: x.w, t: +t0.toFixed(3), end: +t1.toFixed(3) };
    });
    s.n = words.length;
  }

  B.word = function (si, needle) {
    const s = B.sentences[si];
    const clean = (x) => x.toLowerCase().replace(/[^a-z]/g, "");
    const hit = s.words.find((x) => clean(x.w) === clean(needle));
    return hit ? hit.t : s.sp;
  };
  B.at = (si, i) => B.sentences[si].words[i].t;
  B.sceneAt = (si) => Math.max(0, B.sentences[si].sp - 0.12);
})();
