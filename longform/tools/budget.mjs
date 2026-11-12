// Word budget: know the runtime BEFORE spending 15 minutes on narration.
//   node tools/budget.mjs [targetMinutes]
// The voice reads ~2.94 words per second at speed 1.0, scaled by script.json "speed".
// Prints the estimate, the real duration if data/lines.json is current, and what to change.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = (parseFloat(process.argv[2] || '10')) * 60;
const script = JSON.parse(fs.readFileSync(path.join(ROOT, 'script.json'), 'utf8'));
const speed = script.speed || 1;
const words = script.lines.reduce((n, l) => n + String(l.text).trim().split(/\s+/).length, 0);
const est = words / (2.94 * speed);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

let actual = null;
try {
  const lines = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/lines.json'), 'utf8'));
  if (lines.lines && lines.lines.length === script.lines.length) actual = lines.duration;
} catch {}

console.log(`lines      ${script.lines.length}`);
console.log(`words      ${words}  (speed ${speed})`);
console.log(`estimate   ${fmt(est)}`);
if (actual) console.log(`rendered   ${fmt(actual)}  ${actual / est > 1.15 || est / actual > 1.15 ? '(stale — re-run voice)' : ''}`);
console.log(`target     ${fmt(target)} ± 5%`);

const value = actual || est;
const lo = target * 0.95, hi = target * 1.05;
if (value < lo) {
  const need = Math.round((lo - value) * 2.94 * speed);
  console.log(`SHORT by ${fmt(lo - value)} — add about ${need} words, or lower "speed".`);
} else if (value > hi) {
  const cut = Math.round((value - hi) * 2.94 * speed);
  console.log(`LONG by ${fmt(value - hi)} — cut about ${cut} words, or raise "speed".`);
} else {
  console.log('ON BUDGET — safe to synthesise.');
}
