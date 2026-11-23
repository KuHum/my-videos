/* Original score + sound design for the Ink build — pizzicato, brushed pulse,
   pen scratches, paper rustles. Web Audio, deterministic, reusing the kit mixer. */
(function () {
  const A = (window.AUDIO = {});
  A.SR = 48000;

  function noiseBuffer(ac, sec, seed) {
    const b = ac.createBuffer(1, Math.ceil(ac.sampleRate * sec), ac.sampleRate);
    const d = b.getChannelData(0);
    let s = seed >>> 0;
    const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = last * 0.94 + (r() * 2 - 1) * 0.06; d[i] = last * 3.2; }
    return b;
  }
  A.noiseBuffer = noiseBuffer;

  // cheap stereo feedback-delay reverb: warm enough, milliseconds to render
  function smallReverb(ac, mix) {
    const input = ac.createGain();
    const wet = ac.createGain(); wet.gain.value = mix;
    const out = ac.createGain();
    input.connect(out);
    const taps = [[0.037, 0.5], [0.061, 0.42], [0.089, 0.34], [0.127, 0.24]];
    for (const [d, g] of taps) {
      const dl = ac.createDelay(1.0); dl.delayTime.value = d;
      const fb = ac.createGain(); fb.gain.value = 0.42;
      const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600;
      const wetTap = ac.createGain(); wetTap.gain.value = g;
      input.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl);
      lp.connect(wetTap); wetTap.connect(wet);
    }
    wet.connect(out);
    return { input, tail: out };
  }

  /* pizzicato: triangle, ~0.18 s decay, lowpass 2.2 kHz */
  function pizza(ac, bus, t, freq, vel, len) {
    const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = freq;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200; lp.Q.value = 0.9;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (len || 0.19));
    o.connect(lp); lp.connect(g); g.connect(bus);
    o.start(t); o.stop(t + (len || 0.19) + 0.04);
  }

  /* brushed pulse: noise burst through a 3–6 kHz bandpass, ~0.08 s */
  function brush(ac, bus, t, vel, seed) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac, 0.16, seed || 91);
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 4400; bp.Q.value = 0.8;
    const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2600;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
    src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(bus);
    src.start(t); src.stop(t + 0.18);
  }

  /* felt piano, unchanged from the cinematic kit */
  function piano(ac, bus, t, freq, vel, len) {
    const g = ac.createGain();
    const out = ac.createGain();
    const f = ac.createBiquadFilter();
    f.type = "lowpass"; f.frequency.setValueAtTime(3000, t); f.frequency.exponentialRampToValueAtTime(1300, t + 0.5);
    g.connect(f); f.connect(out); out.connect(bus);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(vel, t + 0.014);
    out.gain.exponentialRampToValueAtTime(vel * 0.28, t + 0.32);
    out.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const parts = [[1, 1], [2.002, 0.3], [3.01, 0.1], [4.18, 0.04]];
    for (const [m, a] of parts) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = freq * m;
      const ga = ac.createGain(); ga.gain.value = a;
      o.connect(ga); ga.connect(g); o.start(t); o.stop(t + len + 0.05);
    }
    return out;
  }

  /* pen scratch: noise whose envelope follows a draw-on window */
  function pen(ac, bus, t, dur, vel, seed) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac, Math.max(0.15, dur), seed || 500);
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(3200, t);
    bp.frequency.exponentialRampToValueAtTime(5200, t + dur * 0.5);
    bp.frequency.exponentialRampToValueAtTime(3600, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.03);
    g.gain.setValueAtTime(vel, t + Math.max(0.05, dur * 0.75));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(bus);
    src.start(t); src.stop(t + dur + 0.05);
  }

  function page(ac, bus, t, vel) {
    const src = ac.createBufferSource(); src.buffer = noiseBuffer(ac, 0.5, 313);
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(1400, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 0.2);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(bp); bp.connect(g); g.connect(bus); src.start(t); src.stop(t + 0.5);
  }

  function chime(ac, bus, t, freq, vel) {
    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(vel, t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    out.connect(bus);
    for (const [m, a] of [[1, 1], [2.01, 0.22], [3.0, 0.06]]) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = freq * m;
      const g = ac.createGain(); g.gain.value = a; o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 0.9);
    }
  }

  function pop(ac, bus, t, vel) {
    const o = ac.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.05);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.1);
  }

  const CH = {
    C: [130.81, 196.0, 261.63, 329.63],
    G: [98.0, 146.83, 196.0, 246.94],
    Am: [110.0, 164.81, 220.0, 261.63],
    F: [87.31, 130.81, 174.61, 220.0],
  };

  /* light and curious: pizzicato over a brushed rhythm, felt piano at the turns */
  A.buildMusic = function (ac, dur) {
    const master = ac.createGain();
    master.gain.value = 0.9;
    master.connect(ac.destination);
    const bus = ac.createGain(); bus.gain.value = 1;
    const verb = smallReverb(ac, 0.26);
    bus.connect(master); bus.connect(verb.input); verb.tail.connect(master);

    // paper room tone
    const rt = ac.createBufferSource(); rt.buffer = noiseBuffer(ac, dur, 4242); rt.loop = true;
    const rtf = ac.createBiquadFilter(); rtf.type = "lowpass"; rtf.frequency.value = 420;
    const rtg = ac.createGain(); rtg.gain.value = 0.035;
    rt.connect(rtf); rtf.connect(rtg); rtg.connect(master); rt.start(0);

    const names = ["C", "G", "Am", "F"];
    const bar = 4.73; // 16 bars over 75.68 s
    const R = (() => { let s = 2024; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();

    for (let b = 0; b * bar < dur - 0.2; b++) {
      const t0 = b * bar;
      const t1 = Math.min(dur, t0 + bar);
      const notes = CH[names[b % 4]];
      // brushed pulse, light, on the beat and the off-beat
      for (let t = t0 + 0.06, k = 0; t < t1 - 0.12; t += bar / 4, k++) {
        brush(ac, bus, t, k % 2 === 0 ? 0.05 + R() * 0.02 : 0.028 + R() * 0.014, 91 + b * 7 + k);
      }
      // pizzicato arpeggio, pattern varies a little per bar
      const step = bar / 4;
      for (let t = t0 + 0.04, k = 0; t < t1 - 0.1; t += step, k++) {
        const idx = (k + (b % 2 === 0 ? 0 : 1)) % notes.length;
        const f = notes[idx] * (k === 2 ? 2 : k === 3 ? 1 : 1);
        pizza(ac, bus, t, f, (k === 0 ? 0.15 : 0.095) * (0.85 + R() * 0.3));
      }
      // low pizzicato root at the bar line
      pizza(ac, bus, t0 + 0.02, notes[0] / 2, 0.13, 0.32);
      // felt piano motif at every other bar
      if (b % 2 === 0) {
        piano(ac, bus, t0 + 0.3, notes[2], 0.075, 1.9);
        piano(ac, bus, t0 + 1.55, notes[3], 0.055, 1.7);
      }
    }

    // lifts where the argument turns
    piano(ac, bus, 45.36, 392.0, 0.08, 2.2);
    piano(ac, bus, 57.09, 349.23, 0.075, 2.2);
    piano(ac, bus, 64.4, 233.08, 0.09, 2.4);
    piano(ac, bus, 69.31, 261.63, 0.085, 2.6);
    pizza(ac, bus, 69.32, 523.25, 0.1, 0.4);

    // fade in / resolve
    master.gain.setValueAtTime(0.0001, 0);
    master.gain.exponentialRampToValueAtTime(0.9, 1.0);
    master.gain.setValueAtTime(0.9, Math.max(1.05, dur - 1.4));
    master.gain.linearRampToValueAtTime(0.0001, dur - 0.05);
    return master;
  };

  /* ducking driven by the timing map */
  A.duck = function (ac, musicGain, T) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.34, 0);
    for (const s of T.sentences) {
      g.gain.setTargetAtTime(0.34, Math.max(0, s.sp - 0.12), 0.16);
      g.gain.setTargetAtTime(0.52, s.ep + 0.2, 0.5);
    }
    musicGain.connect(g);
    return g;
  };

  /* SFX scheduled from the timing map: draw-ons, page turns, label chimes */
  A.buildSfx = function (ac, dur, T) {
    const master = ac.createGain(); master.gain.value = 1;
    master.connect(ac.destination);
    const bus = ac.createGain();
    const verb = smallReverb(ac, 0.2);
    bus.connect(master); bus.connect(verb.input); verb.tail.connect(master);

    const sceneStarts = [0.09, 4.79, 13.07, 15.41, 20.20, 24.18, 28.65, 34.81, 41.24,
      45.33, 47.44, 52.39, 53.78, 57.06, 62.16, 64.37, 69.28];

    // pen scratch under each page's draw-on; paper rustle as the page turns
    sceneStarts.forEach((t, i) => {
      if (t > 0.2) page(ac, bus, Math.max(0.02, t - 0.02), i === 0 ? 0.1 : 0.085);
      pen(ac, bus, t + 0.04, Math.min(0.85, 0.42 + (i % 3) * 0.14), 0.05 + (i % 2) * 0.012, 400 + i * 13);
    });

    const wAt = (si, re) => {
      const s = T.sentences[si];
      const hit = s.words.find((x) => re.test(x.w.toLowerCase()));
      return hit ? hit.t : s.sp;
    };

    // label chimes land on their words
    chime(ac, bus, Math.max(0.2, wAt(0, /^must/) - 0.04), 1318.5, 0.12);
    chime(ac, bus, Math.max(0.2, wAt(1, /^single/) - 0.04), 1174.66, 0.11);
    chime(ac, bus, Math.max(0.2, wAt(2, /^qualifier/) - 0.04), 1567.98, 0.12);
    chime(ac, bus, Math.max(0.2, wAt(3, /^automatically/) - 0.04), 1046.5, 0.11);
    chime(ac, bus, Math.max(0.2, wAt(3, /^no\.?$/) - 0.04), 1318.5, 0.13);
    chime(ac, bus, Math.max(0.2, wAt(4, /^yes\.?$/) - 0.04), 987.77, 0.14);
    chime(ac, bus, wAt(5, /^godly/) - 0.04, 1480.0, 0.1);
    chime(ac, bus, wAt(6, /^apostles/) - 0.04, 1567.98, 0.12);
    chime(ac, bus, wAt(7, /^one-woman/) - 0.04, 880.0, 0.13);
    chime(ac, bus, wAt(7, /^character/) - 0.04, 1174.66, 0.13);
    chime(ac, bus, wAt(7, /^certificate/) - 0.04, 622.25, 0.12);
    chime(ac, bus, wAt(8, /^household/) - 0.04, 1046.5, 0.11);
    chime(ac, bus, wAt(9, /^proving/) - 0.04, 1318.5, 0.12);
    chime(ac, bus, wAt(10, /^checkbox/) - 0.04, 783.99, 0.13);
    chime(ac, bus, wAt(11, /^training/) - 0.04, 987.77, 0.12);
    chime(ac, bus, wAt(12, /^outlier/) - 0.04, 1174.66, 0.13);
    chime(ac, bus, wAt(12, /^burden/) - 0.04, 880.0, 0.12);
    chime(ac, bus, wAt(13, /^celibacy/) - 0.04, 1567.98, 0.12);
    chime(ac, bus, wAt(14, /^thousand/) - 0.04, 1318.5, 0.14);
    chime(ac, bus, wAt(15, /^bomb/) - 0.04, 466.16, 0.17);
    chime(ac, bus, wAt(16, /^husband/) - 0.04, 1174.66, 0.12);
    chime(ac, bus, wAt(16, /^father/) - 0.04, 987.77, 0.12);

    // small events: checkbox tick, house-to-church, tick of the clock
    pop(ac, bus, 50.3, 0.1);
    pop(ac, bus, 51.2, 0.08);
    chime(ac, bus, 43.0, 1760.0, 0.07);
    for (let t = 64.5; t < 68.6; t += 0.63) pop(ac, bus, t, 0.05);

    // low swells on the two mood turns
    for (const [t, v] of [[63.9, 0.075], [69.1, 0.06]]) {
      const o = ac.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(48, t); o.frequency.linearRampToValueAtTime(64, t + 1.2);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.8);
    }
    return master;
  };

  A.toWav = function (channels, sampleRate) {
    const n = channels[0].length, ch = channels.length;
    const buf = new ArrayBuffer(44 + n * ch * 2);
    const v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVE");
    w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
    v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * ch * 2, true);
    v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
    w(36, "data"); v.setUint32(40, n * ch * 2, true);
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
      let s = Math.max(-1, Math.min(1, channels[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2;
    }
    return buf;
  };

  A.b64 = function (arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let s = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    return btoa(s);
  };
})();
