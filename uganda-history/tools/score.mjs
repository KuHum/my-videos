#!/usr/bin/env node
/**
 * Builds the 60 s score for "Uganda — A History in Six Beats".
 *
 * Deterministic by construction: a fixed seed drives the only noise source, so
 * the same bytes come out on any machine, and CI can rebuild the track instead
 * of committing a binary.
 *
 * The bed is a slow four-chord pad (Dm - Bb - F - Dm/A) under a sub, with a
 * soft shaker pulse that starts in the kingdoms beat and a heartbeat that
 * arrives with the railway. A rising swell closes on the end card.
 *
 *   node tools/score.mjs assets/score.wav
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SR = 44100;
const DURATION = 60;
const N = SR * DURATION;

// ---------------------------------------------------------------------------
// Deterministic noise
// ---------------------------------------------------------------------------
let seed = 0x9e3779b9;
function rnd() {
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >> 17;
  seed ^= seed << 5; seed >>>= 0;
  return (seed / 0xffffffff) * 2 - 1;
}

// ---------------------------------------------------------------------------
// Harmony: one chord per beat group. Frequencies in Hz.
// ---------------------------------------------------------------------------
const CHORDS = [
  { at: 0,  notes: [73.42, 110.0, 174.61], sub: 36.71 },   // Dm
  { at: 15, notes: [58.27, 116.54, 174.61], sub: 29.14 },  // Bb
  { at: 30, notes: [43.65, 87.31, 130.81], sub: 43.65 },   // F
  { at: 45, notes: [55.0, 110.0, 164.81], sub: 55.0 }      // A (dominant, open)
];
const XFADE = 3.2; // seconds of overlap between chords

function envelopeFor(t, at) {
  // long fade in from the chord's start, and out where the next one begins
  const inA = Math.min(1, Math.max(0, (t - at) / XFADE));
  const next = CHORDS.find((c) => c.at > at);
  let outA = 1;
  if (next) outA = Math.min(1, Math.max(0, (next.at + XFADE - t) / (XFADE * 2)));
  return Math.min(inA, outA);
}

function pad(t) {
  let s = 0;
  for (const chord of CHORDS) {
    const env = envelopeFor(t, chord.at);
    if (env <= 0) continue;
    for (let i = 0; i < chord.notes.length; i++) {
      const f = chord.notes[i];
      const detune = 1 + 0.0016 * Math.sin(t * 0.21 + i);
      // two partials per note: fundamental plus a quiet fifth-up shimmer
      s += env * (
        0.30 * Math.sin(2 * Math.PI * f * detune * t) +
        0.09 * Math.sin(2 * Math.PI * f * 2 * detune * t + 1.1) +
        0.05 * Math.sin(2 * Math.PI * f * 1.5 * t + 2.3)
      );
    }
    // a sub that swells with the chord
    s += env * 0.34 * Math.sin(2 * Math.PI * chord.sub * t);
  }
  return s;
}

// Shaker: short filtered-noise ticks on a 0.75 s pulse, from the kingdoms beat.
function shaker(t) {
  const start = 9.5;
  if (t < start) return 0;
  const pulse = 0.75;
  const phase = (t - start) % pulse;
  const decay = Math.exp(-phase * 26);
  if (decay < 0.002) return 0;
  const accent = ((Math.floor((t - start) / pulse) % 4) === 0) ? 1 : 0.55;
  return rnd() * decay * accent * 0.16;
}

// Heartbeat: a low sine drop every 1.5 s, from the protectorate beat on.
function heartbeat(t) {
  const start = 30.4;
  if (t < start) return 0;
  const pulse = 1.5;
  const phase = (t - start) % pulse;
  const life = Math.min(1, (t - start) / 4);
  if (phase > 0.5) return 0;
  const env = Math.exp(-phase * 9);
  const f = 62 - 22 * Math.min(1, phase / 0.5);
  return Math.sin(2 * Math.PI * f * phase) * env * 0.22 * life;
}

// A riser under the closing two beats, then a soft hit on the end card.
function riser(t) {
  let s = 0;
  if (t > 52.5 && t < 58.4) {
    const p = (t - 52.5) / (58.4 - 52.5);
    const f = 120 + 620 * p * p;
    s += Math.sin(2 * Math.PI * f * t) * 0.055 * p * p;
    s += rnd() * 0.05 * p * p * p;
  }
  if (t > 56.1 && t < 59.5) {
    const p = t - 56.1;
    s += Math.sin(2 * Math.PI * 55 * p) * Math.exp(-p * 1.9) * 0.16;
  }
  return s;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function highpassLite(x, prev, a) { return a * (prev + x); }

const out = Buffer.alloc(44 + N * 4);
let lpL = 0, lpR = 0;

for (let i = 0; i < N; i++) {
  const t = i / SR;

  let mono = pad(t);
  const perc = shaker(t) + heartbeat(t) + riser(t);

  // gentle tonal tilt so the shaker sits above the pad
  lpL = highpassLite(perc, lpL, 0.34);
  lpR = highpassLite(perc, lpR, 0.34);

  // top and tail: fade the first 0.6 s up, the last 0.7 s down
  const fadeIn = Math.min(1, t / 0.6);
  const fadeOut = Math.min(1, (DURATION - t) / 0.7);
  const master = fadeIn * fadeOut;

  let l = (mono * 0.92 + lpL) * master;
  let r = (mono * 0.92 + lpR * 0.85 + mono * 0.06) * master;

  // soft saturation instead of clipping
  l = Math.tanh(l * 1.15) * 0.72;
  r = Math.tanh(r * 1.15) * 0.72;

  const o = 44 + i * 4;
  out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(l * 32767))), o);
  out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(r * 32767))), o + 2);
}

// RIFF header
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
console.log(`score: ${dest} (${(out.length / 1048576).toFixed(1)} MB, ${DURATION}s, ${SR} Hz stereo)`);
