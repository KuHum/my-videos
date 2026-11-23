import fs from "node:fs";
const T = JSON.parse(fs.readFileSync(new URL("./timing.json", import.meta.url), "utf8"));
const q = (s) => JSON.stringify(s);
let out = `/* Timing map — estimated from narration pauses (no SRT). Single source of truth. */
(function () {
  const B = (window.B = {});
  B.duration = 76.80;
  B.estimated = true;

  // sentence spans: start/end sit mid-pause; sp/ep are the spoken bounds
  B.sentences = [
`;
T.sentences.forEach((s, i) => {
  const sp = +(s.start + 0.10).toFixed(2), ep = +(s.end - 0.14).toFixed(2);
  out += `    { i: ${i}, start: ${s.start.toFixed(2)}, end: ${s.end.toFixed(2)}, sp: ${sp.toFixed(2)}, ep: ${ep.toFixed(2)}, text: ${q(s.text)} },\n`;
});
out += `  ];

  const syl = (w) => {
    w = w.toLowerCase().replace(/[^a-z']/g, "");
    const g = w.match(/[aeiouy]+/g);
    let n = g ? g.length : 1;
    if (/e$/.test(w) && n > 1) n--;
    return Math.max(1, n);
  };
  B.syl = syl;

  for (const s of B.sentences) {
    const words = s.text.split(/\\s+/).filter(Boolean).map((w) => ({ w, syl: syl(w) }));
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
`;
fs.writeFileSync(new URL("../src/beats.js", import.meta.url), out);
console.log("wrote src/beats.js", out.length, "bytes");
