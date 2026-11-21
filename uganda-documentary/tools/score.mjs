#!/usr/bin/env node
/**
 * The score for the Uganda documentary: a slow four-chord bed that follows the
 * chapters, with a pulse that arrives with the kingdoms and a dark turn under
 * the hard years. Deterministic — same bytes on every machine, no binary in git.
 *
 *   node tools/score.mjs assets/score.wav
 *
 * Chapter boundaries come from data/chapters.json, so the harmony moves when
 * the film moves.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const SR = 44100;
const chapters = JSON.parse(readFileSync("data/chapters.json", "utf8"));
const DURATION = +(chapters.at(-1).start + chapters.at(-1).duration + 4.4).toFixed(2);
const N = Math.round(SR * DURATION);

let seed = 0x51ed270b;
function rnd() {
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >> 17;
  seed ^= seed << 5; seed >>>= 0;
  return (seed / 0xffffffff) * 2 - 1;
}

// One chord per chapter: home, warm, open, home, minor-dark, resolve.
const CHORDS = [
  { notes: [73.42, 110.0, 174.61], sub: 36.71 },  // Dm
  { notes: [58.27, 116.54, 174.61], sub: 29.14 }, // Bb
  { notes: [87.31, 130.81, 174.61], sub: 43.65 }, // F
  { notes: [73.42, 110.0, 146.83], sub: 36.71 },  // Dm
  { notes: [49.0, 98.0, 146.83], sub: 24.5 },     // G (low, tense)
  { notes: [73.42, 110.0, 185.0], sub: 36.71 }    // D, open fifth
];
const XF = 4.0;

function envelope(t, at, until) {
  const inA = Math.min(1, Math.max(0, (t - at) / XF));
  const outA = Math.min(1, Math.max(0, (until + XF - t) / (XF * 2)));
  return Math.min(inA, outA);
}

function pad(t) {
  let s = 0;
  for (let i = 0; i < chapters.length; i++) {
    const at = i === 0 ? -2 : chapters[i].start;
    const until = i + 1 < chapters.length ? chapters[i + 1].start : DURATION;
    if (t < at - XF * 2 || t > until + XF * 2) continue;
    const env = envelope(t, at, until);
    if (env <= 0) continue;
    const chord = CHORDS[i % CHORDS.length];
    for (let n = 0; n < chord.notes.length; n++) {
      const f = chord.notes[n];
      const det = 1 + 0.0014 * Math.sin(t * 0.19 + n);
      s += env * (
        0.30 * Math.sin(2 * Math.PI * f * det * t) +
        0.08 * Math.sin(2 * Math.PI * f * 2 * det * t + 1.1) +
        0.04 * Math.sin(2 * Math.PI * f * 1.5 * t + 2.3)
      );
    }
    s += env * 0.32 * Math.sin(2 * Math.PI * chord.sub * t);
  }
  return s;
}

// A soft pulse from the kingdoms chapter, faster and heavier in the hard years.
function pulse(t) {
  const from = chapters[1].start;
  if (t < from) return 0;
  const heavy = t > chapters[4].start && t < chapters[5].start;
  const period = heavy ? 0.62 : 0.9;
  const phase = (t - from) % period;
  if (phase > 0.42) return 0;
  const env = Math.exp(-phase * (heavy ? 14 : 20));
  const accent = Math.floor((t - from) / period) % 4 === 0 ? 1 : 0.45;
  return Math.sin(2 * Math.PI * (heavy ? 58 : 74) * phase) * env * accent * (heavy ? 0.16 : 0.10);
}

// A riser into the last chapter, and a soft hit when it lands.
function riser(t) {
  const target = chapters[5].start;
  let s = 0;
  if (t > target - 7 && t < target) {
    const p = 1 - (target - t) / 7;
    s += Math.sin(2 * Math.PI * (110 + 520 * p * p) * t) * 0.05 * p * p;
    s += rnd() * 0.045 * p * p * p;
  }
  if (t > target && t < target + 3) {
    const p = t - target;
    s += Math.sin(2 * Math.PI * 55 * p) * Math.exp(-p * 1.8) * 0.15;
  }
  return s;
}

const out = Buffer.alloc(44 + N * 4);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const mono = pad(t);
  const perc = pulse(t) + riser(t);
  const fadeIn = Math.min(1, t / 1.2);
  const fadeOut = Math.min(1, (DURATION - t) / 1.4);
  const master = fadeIn * fadeOut;
  let l = (mono * 0.9 + perc) * master;
  let r = (mono * 0.9 + perc * 0.86 + mono * 0.06) * master;
  l = Math.tanh(l * 1.1) * 0.70;
  r = Math.tanh(r * 1.1) * 0.70;
  const o = 44 + i * 4;
  out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(l * 32767))), o);
  out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(r * 32767))), o + 2);
}

out.write("RIFF", 0);
out.writeUInt32LE(36 + N * 4, 4);
out.write("WAVE", 8);
out.write("fmt ", 12);
out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20);
out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28);
out.writeUInt16LE(4, 32);
out.writeUInt16LE(16, 34);
out.write("data", 36);
out.writeUInt32LE(N * 4, 40);

const dest = process.argv[2] || "assets/score.wav";
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, out);
console.log(`score: ${dest} (${DURATION}s, ${SR} Hz stereo)`);
