/* Player + render entry points */
(function () {
  const K = window.K, B = window.B, A = window.AUDIO;
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);

  let voBuffer = null, musicBuf = null, sfxBuf = null, mixWavB64 = null;
  let ac = null, playing = false, startAt = 0, startCtx = 0, curT = 0;
  let nodes = { music: null, sfx: null, voice: null };
  let musicGain = null, sfxGain = null, baseGains = { mGain: 0.1, sGain: 0.2 };
  const DUR = B.duration;
  const STILLS = new URLSearchParams(location.search).has("stills");

  function dataB64ToArrayBuffer(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  async function loadFont() {
    let src = window.__FONT_B64__ ? "data:font/ttf;base64," + window.__FONT_B64__ : "assets/Montserrat.ttf";
    const face = new FontFace("Montserrat", "url(" + src + ")", { weight: "100 900", style: "normal" });
    await face.load();
    document.fonts.add(face);
    await document.fonts.ready;
  }

  async function loadVo() {
    let buf;
    if (window.__AUDIO_B64__) buf = dataB64ToArrayBuffer(window.__AUDIO_B64__);
    else buf = await (await fetch("assets/vo.wav")).arrayBuffer();
    const tmp = new AudioContext();
    const decoded = await tmp.decodeAudioData(buf.slice(0));
    await tmp.close();
    return decoded;
  }

  async function renderTrack(build) {
    const oac = new OfflineAudioContext(2, Math.ceil(A.SR * DUR), A.SR);
    build(oac, DUR);
    return await oac.startRendering();
  }

  function downmixToMono(buf) {
    const out = new Float32Array(buf.length);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) out[i] += d[i] / buf.numberOfChannels;
    }
    return out;
  }

  function voiceAt(t) {
    // sample the decoded narration (mono) at time t
    const d = voBuffer.getChannelData(0);
    const i = Math.round(t * voBuffer.sampleRate);
    return i >= 0 && i < d.length ? d[i] : 0;
  }

  function rmsOf(buf) {
    let sum = 0, n = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i += 7) { sum += d[i] * d[i]; n++; }
    }
    return Math.sqrt(sum / Math.max(1, n));
  }
  function peakOf(buf) {
    let p = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i++) p = Math.max(p, Math.abs(d[i]));
    }
    return p;
  }

  // Voice is normalised to -1.3 dBFS peak; music and effects are placed a fixed
  // distance below the voice RMS so words always sit on top of the bed.
  function computeGains() {
    const vp = Math.max(1e-6, peakOf(voBuffer));
    const voiceGain = 0.86 / vp;
    const vrms = rmsOf(voBuffer) * voiceGain;
    const mGain = (vrms * 0.135) / Math.max(1e-6, rmsOf(musicBuf));
    const sGain = (vrms * 0.22) / Math.max(1e-6, rmsOf(sfxBuf));
    return { voiceGain, mGain, sGain, vrms };
  }

  function buildMix() {
    const n = Math.ceil(A.SR * DUR);
    const g = computeGains();
    const L = new Float32Array(n), R = new Float32Array(n);
    const m = musicBuf, s = sfxBuf;
    for (let i = 0; i < n; i++) {
      const v = voiceAt(i / A.SR) * g.voiceGain;
      L[i] = v + (m.getChannelData(0)[i] || 0) * g.mGain + (s.getChannelData(0)[i] || 0) * g.sGain;
      R[i] = v + (m.getChannelData(1)[i] || 0) * g.mGain + (s.getChannelData(1)[i] || 0) * g.sGain;
    }
    let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    const trim = peak > 0.95 ? 0.95 / peak : 1;
    for (let i = 0; i < n; i++) { L[i] *= trim; R[i] *= trim; }
    return { L, R, trim, peak, gains: g };
  }

  /* ---------- playback ---------- */
  function stopAll() {
    if (!ac) return;
    for (const k of ["voice", "music", "sfx"]) if (nodes[k]) { try { nodes[k].stop(); } catch (e) { } nodes[k] = null; }
    playing = false;
  }

  function play(from) {
    if (!ac) return;
    stopAll();
    const off = Math.max(0, Math.min(from == null ? curT : from, DUR - 0.02));
    const now = ac.currentTime + 0.03;
    const mk = (buf, g, dest) => {
      const src = ac.createBufferSource(); src.buffer = buf;
      const gain = ac.createGain(); gain.gain.value = g;
      src.connect(gain); gain.connect(dest);
      src.start(now, off);
      return src;
    };
    nodes.voice = mk(voBuffer, 1, ac.destination);
    nodes.music = mk(musicBuf, 1, ac.destination);
    nodes.sfx = mk(sfxBuf, 1, ac.destination);
    // route music/sfx through their faders
    musicGain.gain.value = baseGains.mGain * (+$("music").value / 100);
    sfxGain.gain.value = baseGains.sGain * (+$("sfx").value / 100);
    nodes.music.disconnect(); nodes.music.connect(musicGain); musicGain.connect(ac.destination);
    nodes.sfx.disconnect(); nodes.sfx.connect(sfxGain); sfxGain.connect(ac.destination);
    startAt = off; startCtx = now; playing = true;
    $("play").textContent = "Pause";
  }

  function pause() {
    curT = currentTime();
    stopAll();
    $("play").textContent = "Play";
  }

  function currentTime() {
    if (!playing || !ac) return curT;
    return Math.min(DUR, startAt + (ac.currentTime - startCtx));
  }

  /* ---------- frame loop ---------- */
  function fmt(t) {
    const m = Math.floor(t / 60), s = t % 60;
    return m + ":" + (s < 10 ? "0" : "") + s.toFixed(2);
  }

  function draw(t) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    window.drawAt(ctx, t);
    ctx.restore();
  }

  function loop() {
    if (playing) {
      const t = currentTime();
      if (t >= DUR - 0.001) { pause(); curT = DUR; }
      draw(Math.min(t, DUR - 0.001));
    }
    const t = playing ? currentTime() : curT;
    $("seek").value = (t / DUR) * 1000;
    $("time").textContent = fmt(t) + " / " + fmt(DUR);
    requestAnimationFrame(loop);
  }

  /* ---------- exports ---------- */
  window.renderAt = (t) => draw(t);

  window.__frameJpeg = (t, q) => {
    draw(t);
    return canvas.toDataURL("image/jpeg", q || 0.94).split(",")[1];
  };
  window.__thumbPng = (t, w, h) => {
    draw(t);
    const c = K.mk(w, h);
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(canvas, 0, 0, w, h);
    return c.toDataURL("image/png").split(",")[1];
  };
  window.__mixWav = () => mixWavB64;
  window.__duration = DUR;
  window.__hf = { DUR, scenes: () => SCENES.map((s) => [s.t0, s.t1]) };

  /* ---------- boot ---------- */
  async function boot() {
    const T0 = performance.now();
    window.__phaseLog = [];
    const mark = (p) => { window.__bootPhase = p; window.__phaseLog.push(p + ":" + Math.round(performance.now() - T0)); };
    mark("font");
    await loadFont();
    mark("vo");
    const vo = await loadVo();
    voBuffer = vo;
    if (!STILLS) {
      ac = new AudioContext({ sampleRate: A.SR });
      musicGain = ac.createGain(); musicGain.gain.value = 1;
      sfxGain = ac.createGain(); sfxGain.gain.value = 1;

      mark("music");
      musicBuf = await renderTrack((oac, d) => {
        const master = A.buildMusic(oac, d);
        const duck = A.duck(oac, master, B);
        duck.connect(oac.destination);
      });
      mark("sfx");
      sfxBuf = await renderTrack((oac, d) => { A.buildSfx(oac, d, B); });

      mark("mix");
      const mix = buildMix();
      baseGains = mix.gains;
      mixWavB64 = A.b64(A.toWav([mix.L, mix.R], A.SR));
      window.__mixStats = { trim: mix.trim, peak: mix.peak, samples: mix.L.length, voiceGain: mix.gains.voiceGain, musicGain: mix.gains.mGain, sfxGain: mix.gains.sGain };
    } else {
      window.__mixStats = { stills: true };
    }

    mark("ready");
    draw(0);
    $("loading").style.display = "none";
    window.__ready = true;
    loop();
  }

  /* ---------- UI ---------- */
  $("play").onclick = () => { if (playing) pause(); else play(curT >= DUR - 0.05 ? 0 : curT); };
  $("restart").onclick = () => { pause(); curT = 0; draw(0); };
  $("seek").oninput = (e) => {
    const t = (e.target.value / 1000) * DUR;
    const was = playing;
    stopAll();
    curT = t; draw(t);
    if (was) play(t);
  };
  $("music").oninput = (e) => { if (musicGain) musicGain.gain.value = baseGains.mGain * (e.target.value / 100); };
  $("sfx").oninput = (e) => { if (sfxGain) sfxGain.gain.value = baseGains.sGain * (e.target.value / 100); };
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault(); $("play").onclick(); }
    if (e.code === "ArrowRight") { $("seek").value = Math.min(1000, +$("seek").value + 20); $("seek").oninput({ target: $("seek") }); }
    if (e.code === "ArrowLeft") { $("seek").value = Math.max(0, +$("seek").value - 20); $("seek").oninput({ target: $("seek") }); }
  });

  $("thumb").onclick = () => {
    const b64 = window.__thumbPng(window.__THUMB_T || 66.4, 1280, 720);
    const a = document.createElement("a");
    a.href = "data:image/png;base64," + b64;
    a.download = "single-pastor-thumbnail.png";
    a.click();
  };

  $("export").onclick = async () => {
    if (!ac) return;
    const btn = $("export");
    btn.disabled = true;
    btn.textContent = "Recording…";
    const stop = () => { try { rec.stop(); } catch (e) { } };
    pause();
    curT = 0;
    const stream = canvas.captureStream(30);
    const dest = ac.createMediaStreamDestination();
    const vsrc = ac.createBufferSource(); vsrc.buffer = voBuffer;
    const msrc = ac.createBufferSource(); msrc.buffer = musicBuf;
    const ssrc = ac.createBufferSource(); ssrc.buffer = sfxBuf;
    const mg = ac.createGain(); mg.gain.value = musicGain.gain.value;
    const sg = ac.createGain(); sg.gain.value = sfxGain.gain.value;
    vsrc.connect(dest); msrc.connect(mg); mg.connect(dest); ssrc.connect(sg); sg.connect(dest);
    for (const t of dest.stream.getAudioTracks()) stream.addTrack(t);
    const mime = ["video/mp4;codecs=avc1,mp4a.40.2", "video/webm;codecs=vp9,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12e6 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "single-pastor-recording." + (mime.includes("mp4") ? "mp4" : "webm");
      a.click();
      btn.disabled = false;
      btn.textContent = "Export video";
      vsrc.stop(); msrc.stop(); ssrc.stop();
    };
    rec.start(200);
    const t0 = ac.currentTime;
    vsrc.start(ac.currentTime + 0.05); msrc.start(ac.currentTime + 0.05); ssrc.start(ac.currentTime + 0.05);
    draw(0);
    const tick = () => {
      const t = ac.currentTime - t0;
      draw(Math.min(t, DUR - 0.001));
      if (t < DUR) requestAnimationFrame(tick); else stop();
    };
    tick();
  };

  boot().catch((e) => {
    console.error(e);
    window.__bootError = e && e.message;
    const el = $("loading");
    if (el) el.textContent = "Load failed: " + e.message;
  });
})();
