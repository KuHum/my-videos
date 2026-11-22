/* Timing map — estimated from narration pauses (no SRT). Single source of truth. */
(function () {
  const B = (window.B = {});
  B.duration = 33.84;

  // sentence spans: start/end sit mid-pause; speech* are measured onsets/offsets
  B.sentences = [
    { i: 0, start: 0.00, end: 1.97, sp: 0.11, ep: 1.77, text: "AI is no longer science fiction." },
    { i: 1, start: 1.97, end: 7.67, sp: 2.17, ep: 7.33, text: "It's the quiet engine behind faster diagnoses, safer transport, and personalized learning." },
    { i: 2, start: 7.67, end: 13.75, sp: 8.01, ep: 13.52, text: "It helps us spot patterns humans miss, automate repetitive work, and free time for creativity." },
    { i: 3, start: 13.75, end: 15.99, sp: 13.97, ep: 15.63, text: "But importance isn't automatic." },
    { i: 4, start: 15.99, end: 21.59, sp: 16.36, ep: 21.38, text: "We must build AI responsibly—with transparency, fairness, and human oversight." },
    { i: 5, start: 21.59, end: 24.82, sp: 21.80, ep: 24.64, text: "Used wisely, AI amplifies human potential." },
    { i: 6, start: 24.82, end: 26.54, sp: 25.00, ep: 26.36, text: "Ignored or misused, it widens gaps." },
    { i: 7, start: 26.54, end: 29.35, sp: 27.96, ep: 29.20, text: "The real importance of AI?" },
    { i: 8, start: 29.35, end: 30.36, sp: 29.49, ep: 30.00, text: "It's a tool." },
    { i: 9, start: 30.36, end: 33.84, sp: 30.73, ep: 33.47, text: "Our choices decide whether it serves everyone." },
  ];

  const syl = (w) => {
    w = w.toLowerCase().replace(/[^a-z']/g, "");
    const g = w.match(/[aeiouy]+/g);
    let n = g ? g.length : 1;
    if (/e$/.test(w) && n > 1) n--;
    if (w.length <= 3) n = Math.max(1, n);
    return Math.max(1, n);
  };
  B.syl = syl;

  // word objects with timings spread across the measured speech span
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
  }

  // word lookup: B.word(1, "diagnoses")
  B.word = function (si, needle) {
    const s = B.sentences[si];
    const hit = s.words.find((x) => x.w.toLowerCase().replace(/[^a-z]/g, "") === needle.toLowerCase());
    return hit ? hit.t : s.sp;
  };
  // scene boundary for a sentence: begin just before its speech onset
  B.sceneAt = (si) => Math.max(0, B.sentences[si].sp - 0.12);
})();
