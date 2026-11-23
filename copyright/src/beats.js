/* Timing map — estimated from narration pauses (no SRT). Single source of truth. */
(function () {
  const B = (window.B = {});
  B.duration = 76.80;
  B.estimated = true;

  // sentence spans: start/end sit mid-pause; sp/ep are the spoken bounds
  B.sentences = [
    { i: 0, start: 0.09, end: 3.73, sp: 0.19, ep: 3.58, text: "Here's the case: copyright law is a made-up moral rule." },
    { i: 1, start: 3.73, end: 9.86, sp: 3.83, ep: 9.71, text: "Not made-up as in useless—made-up as in invented by statute, not discovered in the moral order." },
    { i: 2, start: 9.86, end: 13.84, sp: 9.96, ep: 13.70, text: "The Seventh Commandment forbids theft; it does not forbid copying." },
    { i: 3, start: 13.84, end: 16.27, sp: 13.94, ep: 16.13, text: "You can take a man's ox, and that's theft." },
    { i: 4, start: 16.27, end: 20.08, sp: 16.37, ep: 19.94, text: "You can learn his song and sing it, and the ox is still there." },
    { i: 5, start: 20.08, end: 28.23, sp: 20.18, ep: 28.09, text: "Copyright is a government-granted monopoly—a privilege created to incentivize production, not a natural right rooted in creation." },
    { i: 6, start: 28.23, end: 35.99, sp: 28.33, ep: 35.85, text: "It has terms, exceptions, compulsory licenses, and expiration dates because it is policy, not morality." },
    { i: 7, start: 35.99, end: 40.23, sp: 36.09, ep: 40.09, text: "That is positive law, and positive law can be wise or foolish." },
    { i: 8, start: 40.23, end: 43.66, sp: 40.34, ep: 43.52, text: "We treat infringement as “piracy” and “stealing,” but that's marketing." },
    { i: 9, start: 43.66, end: 47.45, sp: 43.77, ep: 47.31, text: "Calling a thing stealing doesn't make it so." },
    { i: 10, start: 47.45, end: 54.40, sp: 47.55, ep: 54.26, text: "If copyright were intrinsically immoral to violate, the rules would not change every few decades or differ by country." },
    { i: 11, start: 54.40, end: 60.62, sp: 54.50, ep: 60.48, text: "The real moral duties are: don't defraud, honor contracts, and don't claim another's work as your own." },
    { i: 12, start: 60.62, end: 61.78, sp: 60.72, ep: 61.64, text: "Those are commanded." },
    { i: 13, start: 61.78, end: 65.53, sp: 61.88, ep: 65.39, text: "The rest is a legal bargain dressed in moral clothing." },
    { i: 14, start: 65.53, end: 69.90, sp: 65.63, ep: 69.76, text: "The state may grant limited monopolies; it cannot manufacture sin." },
    { i: 15, start: 69.90, end: 73.22, sp: 70.00, ep: 73.08, text: "So stop baptizing statutory monopolies as righteousness." },
    { i: 16, start: 73.22, end: 75.05, sp: 73.32, ep: 74.91, text: "Copyright may be prudent." },
    { i: 17, start: 75.05, end: 76.32, sp: 75.15, ep: 76.18, text: "It is not holy." },
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
