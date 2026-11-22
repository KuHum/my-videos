// Estimate sentence boundaries from silence in the narration.
// Prints 10 ms RMS energy, silent runs, and a suggested split map.
import fs from "node:fs";

const buf = fs.readFileSync(new URL("../assets/vo.wav", import.meta.url));
// PCM s16le mono 24k: find "data" chunk
let off = 12, dataOff = -1, dataLen = 0, rate = 24000;
while (off + 8 <= buf.length) {
  const id = buf.toString("ascii", off, off + 4);
  const size = buf.readUInt32LE(off + 4);
  if (id === "data") { dataOff = off + 8; dataLen = size; break; }
  if (id === "fmt ") rate = buf.readUInt32LE(off + 12);
  off += 8 + size + (size & 1);
}
const n = Math.floor(dataLen / 2);
const win = Math.round(rate * 0.01); // 10 ms
const frames = Math.floor(n / win);
const rms = new Float32Array(frames);
for (let f = 0; f < frames; f++) {
  let s = 0;
  for (let i = 0; i < win; i++) { const v = buf.readInt16LE(dataOff + (f * win + i) * 2) / 32768; s += v * v; }
  rms[f] = Math.sqrt(s / win);
}
const peak = Math.max(...rms);
const sorted = [...rms].sort((a, b) => a - b);
const noise = sorted[Math.floor(frames * 0.10)];
const thresh = Math.max(noise * 2.2, peak * 0.035);
const minGap = 12; // 120 ms

const gaps = [];
let run = 0;
for (let f = 0; f < frames; f++) {
  if (rms[f] < thresh) run++;
  else { if (run >= minGap) gaps.push([(f - run) * 0.01, f * 0.01]); run = 0; }
}
if (run >= minGap) gaps.push([(frames - run) * 0.01, frames * 0.01]);

const dur = n / rate;
console.log(`dur ${dur.toFixed(3)}s  rate ${rate}  frames ${frames}  peak ${peak.toFixed(3)} noise ${noise.toFixed(4)} thresh ${thresh.toFixed(4)}`);
console.log("silent runs (start,end,len):");
for (const [a, b] of gaps) console.log(`  ${a.toFixed(2)}  ${b.toFixed(2)}  ${(b - a).toFixed(2)}`);
// energy envelope per 100 ms, useful for eyeballing sentence gaps
let env = "";
for (let i = 0; i < frames; i += 10) {
  let v = 0; for (let k = 0; k < 10 && i + k < frames; k++) v = Math.max(v, rms[i + k]);
  env += " .:-=+*#%@".charAt(Math.min(9, Math.round(v / peak * 9)));
}
console.log("\n100ms envelope:\n" + env.match(/.{1,100}/g).join("\n"));
