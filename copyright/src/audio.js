/* Original score + sound design, synthesised with Web Audio (deterministic). */
(function () {
  const A = (window.AUDIO = {});
  const C = (window.K && window.K.C) || {};

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

  function piano(ac, bus, t, freq, vel, len) {
    const g = ac.createGain();
    const out = ac.createGain();
    const f = ac.createBiquadFilter();
    f.type = "lowpass"; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(1400, t + 0.5);
    g.connect(f); f.connect(out); out.connect(bus);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(vel, t + 0.012);
    out.gain.exponentialRampToValueAtTime(vel * 0.28, t + 0.35);
    out.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const parts = [[1, 1], [2.002, 0.33], [3.01, 0.12], [4.18, 0.05]];
    for (const [m, a] of parts) {
      const o = ac.createOscillator();
      o.type = "sine"; o.frequency.value = freq * m;
      const ga = ac.createGain(); ga.gain.value = a;
      o.connect(ga); ga.connect(g); o.start(t); o.stop(t + len + 0.05);
    }
    return out;
  }

  function pad(ac, bus, t, dur, freqs, vel) {
    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(vel, t + Math.min(1.8, dur * 0.35));
    out.gain.setValueAtTime(vel, t + dur * 0.7);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.8);
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700; f.Q.value = 0.6;
    f.connect(out); out.connect(bus);
    for (const fr of freqs) {
      for (const det of [-4, 4]) {
        const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = fr; o.detune.value = det;
        const g = ac.createGain(); g.gain.value = 0.05;
        o.connect(g); g.connect(f); o.start(t); o.stop(t + dur + 0.9);
      }
    }
    return out;
  }

  function chime(ac, bus, t, freq, vel) {
    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(vel, t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    out.connect(bus);
    for (const [m, a] of [[1, 1], [2.01, 0.25], [3.0, 0.08]]) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = freq * m;
      const g = ac.createGain(); g.gain.value = a; o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 0.95);
    }
  }

  function whoosh(ac, bus, t, up, vel) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac, 0.9, 12345);
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(up ? 260 : 2400, t);
    bp.frequency.exponentialRampToValueAtTime(up ? 2600 : 260, t + 0.55);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
    src.connect(bp); bp.connect(g); g.connect(bus); src.start(t); src.stop(t + 0.9);
  }

  function click(ac, bus, t, vel) {
    const src = ac.createBufferSource(); src.buffer = noiseBuffer(ac, 0.12, 777);
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 3;
    const g = ac.createGain();
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    src.connect(bp); bp.connect(g); g.connect(bus); src.start(t); src.stop(t + 0.12);
  }

  // heavy rubber-stamp / press impact
  function thump(ac, bus, t, vel, metal) {
    const o = ac.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(metal ? 96 : 72, t);
    o.frequency.exponentialRampToValueAtTime(metal ? 44 : 38, t + 0.22);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.36);
    const src = ac.createBufferSource(); src.buffer = noiseBuffer(ac, 0.2, 909);
    const bp = ac.createBiquadFilter(); bp.type = "lowpass"; bp.frequency.value = metal ? 1800 : 900;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(vel * 0.55, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(bp); bp.connect(ng); ng.connect(bus); src.start(t); src.stop(t + 0.2);
    if (metal) {
      for (const [f, a] of [[1180, 0.05], [1760, 0.03], [2630, 0.02]]) {
        const p = ac.createOscillator(); p.type = "sine"; p.frequency.value = f;
        const pg = ac.createGain();
        pg.gain.setValueAtTime(a * vel * 2, t + 0.01); pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        p.connect(pg); pg.connect(bus); p.start(t); p.stop(t + 0.3);
      }
    }
  }

  // paper / page flip
  function page(ac, bus, t, vel) {
    const src = ac.createBufferSource(); src.buffer = noiseBuffer(ac, 0.5, 313);
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(1400, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 0.2);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(bp); bp.connect(g); g.connect(bus); src.start(t); src.stop(t + 0.5);
  }

  const CH = {
    Am: [110.0, 164.81, 220.0, 261.63],
    F: [87.31, 130.81, 174.61, 220.0],
    C: [130.81, 196.0, 261.63, 329.63],
    G: [98.0, 146.83, 196.0, 246.94],
    Em: [82.41, 123.47, 164.81, 196.0],
    Dm: [73.42, 146.83, 174.61, 220.0],
  };

  /* music: felt piano + warm pad + slow pulse, written against the timing map */
  A.buildMusic = function (ac, dur) {
    const master = ac.createGain();
    master.gain.value = 0.9;
    master.connect(ac.destination);
    const bus = ac.createGain(); bus.gain.value = 1;
    const verb = smallReverb(ac, 0.32);
    bus.connect(master); bus.connect(verb.input); verb.tail.connect(master);

    // room tone
    const rt = ac.createBufferSource(); rt.buffer = noiseBuffer(ac, dur, 4242); rt.loop = true;
    const rtf = ac.createBiquadFilter(); rtf.type = "lowpass"; rtf.frequency.value = 300;
    const rtg = ac.createGain(); rtg.gain.value = 0.045;
    rt.connect(rtf); rtf.connect(rtg); rtg.connect(master); rt.start(0);

    const prog = [
      [0.0, 4.2, "Am"], [4.2, 8.6, "F"], [8.6, 13.0, "C"], [13.0, 17.4, "G"],
      [17.4, 21.6, "Am"], [21.6, 26.0, "Em"], [26.0, 30.4, "F"], [30.4, 34.6, "G"],
      [34.6, 39.0, "C"], [39.0, 43.4, "G"], [43.4, 47.6, "Am"], [47.6, 52.0, "F"],
      [52.0, 56.4, "C"], [56.4, 60.6, "G"], [60.6, 64.8, "Am"], [64.8, 69.2, "F"],
      [69.2, 73.2, "G"], [73.2, 76.8, "Am"],
    ];
    for (const [t0, t1, name] of prog) {
      const notes = CH[name];
      pad(ac, bus, t0, t1 - t0, [notes[0], notes[0] * 1.5], 0.15);
      const step = 0.64;
      for (let t = t0 + 0.1, k = 0; t < t1 - 0.2; t += step, k++) {
        const f = notes[(k + 1) % notes.length] * (k % 4 === 3 ? 2 : 1);
        piano(ac, bus, t, f, k % 4 === 0 ? 0.19 : 0.11, 1.6);
      }
      piano(ac, bus, t0 + 0.05, notes[0] * 0.5, 0.2, 2.4);
    }

    // lifts at the argument turns
    piano(ac, bus, 20.2, 329.63, 0.15, 2.6);
    piano(ac, bus, 36.1, 392.0, 0.14, 2.4);
    piano(ac, bus, 47.6, 349.23, 0.13, 2.6);
    piano(ac, bus, 54.5, 261.63, 0.17, 2.8);
    piano(ac, bus, 54.52, 329.63, 0.13, 2.8);
    piano(ac, bus, 60.7, 220.0, 0.2, 2.6);
    piano(ac, bus, 65.6, 174.61, 0.16, 2.6);
    piano(ac, bus, 73.25, 261.63, 0.2, 2.6);
    piano(ac, bus, 73.27, 329.63, 0.15, 2.6);
    piano(ac, bus, 75.1, 220.0, 0.18, 2.2);
    piano(ac, bus, 75.12, 261.63, 0.14, 2.2);

    // slow pulse through the middle, stops before the last line
    for (let t = 8.0; t < 69.0; t += 1.42) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = 55;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.075, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.65);
    }

    // fade in / resolve
    master.gain.setValueAtTime(0.0001, 0);
    master.gain.exponentialRampToValueAtTime(0.9, 1.0);
    master.gain.setValueAtTime(0.9, dur - 1.6);
    master.gain.linearRampToValueAtTime(0.0001, dur - 0.05);
    return master;
  };

  /* ducking envelope for music, from the timing map */
  A.duck = function (ac, musicGain, T) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.32, 0);
    const spans = T.sentences.map((s) => [s.sp, s.ep]);
    for (const [a, b] of spans) {
      g.gain.setTargetAtTime(0.32, Math.max(0, a - 0.12), 0.18);
      g.gain.setTargetAtTime(0.5, b + 0.2, 0.5);
    }
    musicGain.connect(g);
    return g;
  };

  /* sound effects: stamps, badges, cuts, light changes */
  A.buildSfx = function (ac, dur, T) {
    const master = ac.createGain(); master.gain.value = 1;
    master.connect(ac.destination);
    const bus = ac.createGain();
    const verb = smallReverb(ac, 0.22);
    bus.connect(master); bus.connect(verb.input); verb.tail.connect(master);

    // soft cut whooshes on the biggest scene changes only
    for (const [t, up, v] of [
      [3.66, 1, 0.16], [20.02, 0, 0.18], [28.17, 1, 0.15], [40.18, 0, 0.17],
      [47.40, 1, 0.16], [54.35, 0, 0.16], [61.74, 0, 0.14], [69.86, 1, 0.16], [73.18, 0, 0.14],
    ]) whoosh(ac, bus, t, up, v);

    // stamps and presses
    thump(ac, bus, 2.55, 0.5, true);      // S1 die prints MADE-UP
    thump(ac, bus, 6.28, 0.55, true);     // S2 statute pressed
    thump(ac, bus, 20.85, 0.5, true);     // S6 grant sealed
    thump(ac, bus, 66.55, 0.5, true);     // S15 limited grant
    thump(ac, bus, 68.75, 0.4, false);    // S15 blank die (dull)
    thump(ac, bus, 74.35, 0.36, true);    // S17 PRUDENT

    // paper: calendar decades, contract hem, certificate
    page(ac, bus, 49.0, 0.10); page(ac, bus, 50.1, 0.09); page(ac, bus, 51.2, 0.10); page(ac, bus, 52.3, 0.08);
    page(ac, bus, 61.95, 0.12);            // robe draped
    click(ac, bus, 64.55, 0.12);           // hem lifts

    // billboard switch-on
    click(ac, bus, 40.45, 0.2); click(ac, bus, 42.25, 0.16); click(ac, bus, 43.0, 0.14);

    // badge chimes on their words
    const b = (si, word, freq, vel) => chime(ac, bus, Math.max(0.2, B.word(si, word) - 0.04), freq, vel == null ? 0.13 : vel);
    b(0, "copyright", 1318.5); b(0, "made-up", 1174.66, 0.16);
    b(1, "statute", 1567.98, 0.14); b(1, "discovered", 987.77, 0.12);
    b(2, "theft", 622.25, 0.17); b(2, "copying", 1318.5, 0.13);
    b(3, "theft", 622.25, 0.18);
    b(4, "still", 1760.0, 0.14); b(4, "there", 1975.5, 0.14);
    b(5, "government-granted", 1567.98, 0.14); b(5, "monopoly—a", 880.0, 0.16);
    b(5, "privilege", 1318.5, 0.13); b(5, "natural", 1046.5, 0.12);
    b(6, "terms", 1318.5, 0.11); b(6, "exceptions", 1480.0, 0.11); b(6, "licenses", 1661.22, 0.11); b(6, "expiration", 880.0, 0.13);
    b(7, "positive", 1046.5, 0.14); b(7, "wise", 1567.98, 0.12); b(7, "foolish", 739.99, 0.13);
    b(8, "piracy", 622.25, 0.15); b(8, "stealing", 698.46, 0.15); b(8, "marketing", 987.77, 0.13);
    b(9, "stealing", 622.25, 0.14); b(9, "so", 1567.98, 0.12);
    b(10, "decades", 880.0, 0.13); b(10, "country", 1174.66, 0.12);
    b(11, "defraud", 1318.5, 0.14); b(11, "contracts", 1480.0, 0.14); b(11, "another's", 1760.0, 0.14);
    b(12, "commanded", 1046.5, 0.16);
    b(13, "clothing", 880.0, 0.13);
    b(14, "limited", 1318.5, 0.13); b(14, "sin", 466.16, 0.2);
    b(15, "righteousness", 783.99, 0.14);
    b(16, "prudent", 1174.66, 0.14);
    b(17, "holy", 391.99, 0.18);

    // low swells on the two mood turns
    for (const [t, v] of [[61.6, 0.08], [75.0, 0.11]]) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(42, t); o.frequency.linearRampToValueAtTime(58, t + 1.4);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.9);
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
