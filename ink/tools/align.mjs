// Align sentence boundaries to narration pauses (10 ms RMS), guided by syllable counts.
// Prints spans + wpm and writes timing.json.
import fs from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const buf = fs.readFileSync(root + "assets/vo.wav");
let off = 12, dataOff = -1, dataLen = 0, rate = 48000;
while (off + 8 <= buf.length) {
  const id = buf.toString("ascii", off, off + 4);
  const size = buf.readUInt32LE(off + 4);
  if (id === "data") { dataOff = off + 8; dataLen = size; break; }
  if (id === "fmt ") rate = buf.readUInt32LE(off + 12);
  off += 8 + size + (size & 1);
}
const n = Math.floor(dataLen / 2);
const win = Math.round(rate * 0.01);
const frames = Math.floor(n / win);
const rms = new Float32Array(frames);
for (let f = 0; f < frames; f++) {
  let s = 0;
  for (let i = 0; i < win; i++) { const v = buf.readInt16LE(dataOff + (f * win + i) * 2) / 32768; s += v * v; }
  rms[f] = Math.sqrt(s / win);
}
const dur = n / rate;
const peak = Math.max(...rms);
const thresh = peak * 0.030;
const gaps = [];
let run = 0;
for (let f = 0; f < frames; f++) {
  if (rms[f] < thresh) run++;
  else { if (run >= 18) gaps.push({ a: (f - run) * 0.01, b: f * 0.01, len: run * 0.01 }); run = 0; }
}
if (run >= 18) gaps.push({ a: (frames - run) * 0.01, b: frames * 0.01, len: run * 0.01 });

const sentences = JSON.parse(fs.readFileSync(root + "tools/script.json", "utf8"));
const syl = (w) => {
  w = w.toLowerCase().replace(/[^a-z']/g, "");
  const g = w.match(/[aeiouy]+/g);
  let k = g ? g.length : 1;
  if (/e$/.test(w) && k > 1) k--;
  return Math.max(1, k);
};
const S = sentences.map((text) => {
  const words = text.split(/\s+/).filter(Boolean);
  return { text, words, syl: words.reduce((a, w) => a + syl(w), 0), n: words.length };
});
const totalSyl = S.reduce((a, s) => a + s.syl, 0);
const totalWords = S.reduce((a, s) => a + s.n, 0);

// speech start/end: trim leading/trailing silence
let f0 = 0, f1 = frames - 1;
while (f0 < frames && rms[f0] < thresh) f0++;
while (f1 > 0 && rms[f1] < thresh) f1--;
const t0 = f0 * 0.01, t1 = f1 * 0.01 + 0.01;

const cands = gaps.filter((g) => g.a > t0 + 0.6 && g.b < t1 - 0.6).map((g) => ({ t: (g.a + g.b) / 2, len: g.len }));
cands.sort((p, q) => p.t - q.t);
const K = S.length - 1;

const target = [];
let acc = 0;
for (let i = 0; i < K; i++) { acc += S[i].syl; target.push(t0 + (t1 - t0) * (acc / totalSyl)); }

// DP: assign strictly increasing candidates to boundaries
const N = cands.length, INF = 1e18;
const cost = (i, j) => {
  const c = cands[j];
  const d = Math.abs(c.t - target[i]);
  const short = Math.max(0, 0.34 - c.len);
  return d * 1.0 + short * 9.0;
};
const f = Array.from({ length: K }, () => new Float64Array(N).fill(INF));
const back = Array.from({ length: K }, () => new Int32Array(N).fill(-1));
for (let j = 0; j < N; j++) f[0][j] = cost(0, j);
for (let i = 1; i < K; i++) {
  for (let j = i; j < N; j++) {
    let best = INF, bj = -1;
    for (let q = i - 1; q < j; q++) if (f[i - 1][q] < best) { best = f[i - 1][q]; bj = q; }
    f[i][j] = best + cost(i, j);
    back[i][j] = bj;
  }
}
let best = INF, bj = -1;
for (let j = K - 1; j < N; j++) if (f[K - 1][j] < best) { best = f[K - 1][j]; bj = j; }
const pick = [];
for (let i = K - 1, j = bj; i >= 0; i--) { pick[i] = j; j = back[i][j]; }

const bounds = pick.map((j) => cands[j]);
const spans = S.map((s, i) => {
  const a = i === 0 ? t0 : bounds[i - 1].t;
  const b = i === S.length - 1 ? t1 : bounds[i].t;
  return { ...s, start: a, end: b, words: s.words };
});
console.log(`dur ${dur.toFixed(2)}  speech ${t0.toFixed(2)}-${t1.toFixed(2)}  words ${totalWords}  wpm ${(totalWords / (t1 - t0) * 60).toFixed(1)}`);
console.log("idx  start   end    s   words  wpm   pause  text");
spans.forEach((s, i) => {
  const wpm = (s.n / (s.end - s.start) * 60).toFixed(0);
  const p = i < bounds.length ? bounds[i].len.toFixed(2) : "-";
  console.log(`${String(i).padStart(2)}  ${s.start.toFixed(2)}  ${s.end.toFixed(2)}  ${(s.end - s.start).toFixed(2)}  ${String(s.n).padStart(3)}   ${String(wpm).padStart(3)}   ${p}   ${s.text.slice(0, 58)}`);
});

// word times inside each sentence by syllable count
const out = spans.map((s) => {
  const tot = s.words.reduce((a, w) => a + syl(w), 0);
  let a = 0;
  const words = s.words.map((w) => {
    const d = syl(w) / tot;
    const r = { w, t: +(s.start + (s.end - s.start) * a).toFixed(3), e: +(s.start + (s.end - s.start) * (a + d)).toFixed(3) };
    a += d;
    return r;
  });
  return { text: s.text, start: +s.start.toFixed(3), end: +s.end.toFixed(3), words };
});
fs.writeFileSync(root + "tools/timing.json", JSON.stringify({ duration: dur, sentences: out }, null, 1));
console.log("\nwrote tools/timing.json");
