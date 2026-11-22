// Estimate sentence boundaries by DP over silence runs, guided by syllable counts.
import fs from "node:fs";

const buf = fs.readFileSync(new URL("../assets/vo.wav", import.meta.url));
let off = 12, dataOff = -1, dataLen = 0, rate = 24000;
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
const thresh = peak * 0.035;
const gaps = [];
let run = 0;
for (let f = 0; f < frames; f++) {
  if (rms[f] < thresh) run++;
  else { if (run >= 14) gaps.push({ a: (f - run) * 0.01, b: f * 0.01, len: run * 0.01 }); run = 0; }
}

const sentences = [
  ["AI is no longer science fiction.", 10],
  ["It's the quiet engine behind faster diagnoses, safer transport, and personalized learning.", 26],
  ["It helps us spot patterns humans miss, automate repetitive work, and free time for creativity.", 26],
  ["But importance isn't automatic.", 10],
  ["We must build AI responsibly—with transparency, fairness, and human oversight.", 22],
  ["Used wisely, AI amplifies human potential.", 13],
  ["Ignored or misused, it widens gaps.", 9],
  ["The real importance of AI?", 8],
  ["It's a tool.", 3],
  ["Our choices decide whether it serves everyone.", 13],
];
const totalSyl = sentences.reduce((s, x) => s + x[1], 0);
const K = sentences.length - 1;

// candidate boundaries: pause midpoints
const cands = gaps.map((g) => ({ t: (g.a + g.b) / 2, len: g.len }));
cands.sort((p, q) => p.t - q.t);

// predicted boundary times from syllable proportions over speech span
const t0 = 0.05, t1 = dur - 0.35;
const target = [];
let acc = 0;
for (let i = 0; i < K; i++) { acc += sentences[i][1]; target.push(t0 + (t1 - t0) * (acc / totalSyl)); }

const N = cands.length;
const INF = 1e9;
// f[i][j] = min cost placing boundary i using candidate j (as its index in 1..N)
const f = Array.from({ length: K + 1 }, () => new Float64Array(N + 1).fill(INF));
const prevIdx = Array.from({ length: K + 1 }, () => new Int32Array(N + 1).fill(-1));
for (let j = 0; j <= N; j++) { f[0][j] = 0; prevIdx[0][j] = -1; }
for (let i = 1; i <= K; i++) {
  for (let j = 1; j <= N; j++) {
    // option A: skip candidate j
    if (f[i][j - 1] < f[i][j]) { f[i][j] = f[i][j - 1]; prevIdx[i][j] = -2; }
    const c = cands[j - 1];
    const dev = Math.abs(c.t - target[i - 1]);
    if (dev > 1.7) continue;
    const cost = dev * dev - 0.35 * Math.min(c.len, 0.5);
    const val = f[i - 1][j - 1] + cost;
    if (val < f[i][j]) { f[i][j] = val; prevIdx[i][j] = j - 1; }
  }
}
if (f[K][N] >= INF) { console.error('no feasible alignment'); process.exit(1); }
const chosen = [];
let jj = N;
for (let i = K; i >= 1; i--) {
  while (jj > 0 && prevIdx[i][jj] === -2) jj--;
  chosen.unshift(cands[jj - 1]);
  jj = prevIdx[i][jj];
}
let start = 0;
const out = [];
sentences.forEach((s, i) => {
  const end = i < K ? chosen[i].t : dur;
  out.push({ i, start: +start.toFixed(2), end: +end.toFixed(2), text: s[0] });
  start = end;
});
for (const o of out) {
  console.log(`${String(o.i + 1).padStart(2)}  ${o.start.toFixed(2).padStart(6)} → ${o.end.toFixed(2).padStart(6)}  (${(o.end - o.start).toFixed(2)}s)  ${o.text}`);
}
fs.writeFileSync(new URL("../src/timing.sentences.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("\nwrote src/timing.sentences.json");
