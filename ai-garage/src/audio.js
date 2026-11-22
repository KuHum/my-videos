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

  function reverbIR(ac, sec, decay) {
    const len = Math.ceil(ac.sampleRate * sec);
    const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let s = (ch ? 99173 : 424242) >>> 0;
      const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return ir;
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
    out.gain.exponentialRampToValueAtTime(vel, t + Math.min(1.6, dur * 0.35));
    out.gain.setValueAtTime(vel, t + dur * 0.7);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.7);
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 720; f.Q.value = 0.6;
    f.connect(out); out.connect(bus);
    for (const fr of freqs) {
      for (const det of [-4, 4]) {
        const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = fr; o.detune.value = det;
        const g = ac.createGain(); g.gain.value = 0.055;
        o.connect(g); g.connect(f); o.start(t); o.stop(t + dur + 0.8);
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

  const CH = {
    Am: [110.0, 164.81, 220.0, 261.63],
    F: [87.31, 130.81, 174.61, 220.0],
    C: [130.81, 196.0, 261.63, 329.63],
    G: [98.0, 146.83, 196.0, 246.94],
  };

  /* music: felt piano + warm pad + slow pulse, written against the timing map */
  A.buildMusic = function (ac, dur) {
    const master = ac.createGain();
    master.gain.value = 0.9;
    const verb = ac.createConvolver(); verb.buffer = reverbIR(ac, 2.6, 2.4);
    const wet = ac.createGain(); wet.gain.value = 0.32;
    verb.connect(wet); wet.connect(master); master.connect(ac.destination);
    const bus = ac.createGain(); bus.gain.value = 1;
    bus.connect(master); bus.connect(verb);

    // room tone
    const rt = ac.createBufferSource(); rt.buffer = noiseBuffer(ac, dur, 4242); rt.loop = true;
    const rtf = ac.createBiquadFilter(); rtf.type = "lowpass"; rtf.frequency.value = 320;
    const rtg = ac.createGain(); rtg.gain.value = 0.05;
    rt.connect(rtf); rtf.connect(rtg); rtg.connect(master); rt.start(0);

    const prog = [
      [0.0, 4.0, "Am"], [4.0, 8.0, "F"], [8.0, 12.0, "C"], [12.0, 16.0, "G"],
      [16.0, 20.5, "Am"], [20.5, 24.5, "F"], [24.5, 28.0, "C"], [28.0, 31.5, "G"], [31.5, 33.84, "Am"],
    ];
    for (const [t0, t1, name] of prog) {
      const notes = CH[name];
      pad(ac, bus, t0, t1 - t0, [notes[0], notes[0] * 1.5], 0.16);
      // arpeggio
      const step = 0.62;
      for (let t = t0, k = 0; t < t1 - 0.15; t += step, k++) {
        const f = notes[(k + 1) % notes.length] * (k % 4 === 3 ? 2 : 1);
        piano(ac, bus, t, f, k % 4 === 0 ? 0.20 : 0.13, 1.5);
      }
      piano(ac, bus, t0, notes[0] * 0.5, 0.22, 2.4);
    }
    // swell into the build (16s) and the finale (30.4s)
    piano(ac, bus, 16.05, 329.63, 0.16, 2.8);
    piano(ac, bus, 21.85, 523.25, 0.13, 2.2);
    piano(ac, bus, 30.6, 440.0, 0.18, 2.6);
    piano(ac, bus, 32.3, 329.63, 0.20, 2.4);
    piano(ac, bus, 32.31, 261.63, 0.16, 2.4);
    piano(ac, bus, 32.32, 220.0, 0.14, 2.4);

    // slow pulse under the middle section
    for (let t = 8.0; t < 30.0; t += 1.35) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = 55;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.6);
    }

    // fade in / resolve
    master.gain.setValueAtTime(0.0001, 0);
    master.gain.exponentialRampToValueAtTime(0.9, 1.0);
    master.gain.setValueAtTime(0.9, dur - 1.2);
    master.gain.linearRampToValueAtTime(0.0001, dur - 0.05);
    return master;
  };

  /* ducking envelope for music, from the timing map */
  A.duck = function (ac, musicGain, T) {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.34, 0);
    const spans = T.sentences.map((s) => [s.sp, s.ep]);
    for (const [a, b] of spans) {
      g.gain.setTargetAtTime(0.34, Math.max(0, a - 0.12), 0.18);
      g.gain.setTargetAtTime(0.52, b + 0.18, 0.5);
    }
    musicGain.connect(g);
    return g;
  };

  /* sound effects: badges, transitions, light changes */
  A.buildSfx = function (ac, dur, T) {
    const master = ac.createGain(); master.gain.value = 1;
    const verb = ac.createConvolver(); verb.buffer = reverbIR(ac, 1.8, 2.6);
    const wet = ac.createGain(); wet.gain.value = 0.22;
    verb.connect(wet); wet.connect(master); master.connect(ac.destination);
    const bus = ac.createGain(); bus.connect(master); bus.connect(verb);

    const sceneStarts = T.sentences.map((s) => s.start + 0.02);
    sceneStarts.forEach((t, i) => { if (t > 0.4 && i > 0) whoosh(ac, bus, t - 0.12, i % 2 === 1, 0.22); });

    const b = (si, word, freq, vel) => {
      const t = (window.B.word(si, word));
      chime(ac, bus, t - 0.05, freq, vel == null ? 0.15 : vel);
    };
    b(1, "diagnoses", 1318.5, 0.14); b(1, "transport", 1567.98, 0.13); b(1, "learning", 1760.0, 0.13);
    b(4, "transparency", 1318.5, 0.13); b(4, "fairness", 1480.0, 0.13); b(4, "oversight", 1760.0, 0.13);
    b(5, "potential", 1975.5, 0.15);
    b(6, "gaps", 622.25, 0.2);
    b(8, "tool", 987.77, 0.16);
    b(9, "everyone", 1567.98, 0.14);

    // light changes / mechanical beats
    click(ac, bus, T.sentences[3].sp - 0.05, 0.16);
    click(ac, bus, T.sentences[4].sp + 0.15, 0.13);
    click(ac, bus, T.sentences[9].sp + 0.1, 0.12);

    // low swell on the mood shift at 13.75 and the wide at 26.55
    for (const t of [13.55, 26.4, 29.35]) {
      const o = ac.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(42, t); o.frequency.linearRampToValueAtTime(58, t + 1.2);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.7);
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
    const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(s);
  };
})();
