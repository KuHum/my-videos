// Render the explainer to MP4 with headless Chromium over DevTools Protocol.
// No browser-automation dependency: Node's built-in WebSocket drives the page.
// Usage: node tools/render.mjs [--out renders/ai-garage.mp4] [--limit N] [--crf 18]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const arg = (name, def) => { const i = process.argv.indexOf("--" + name); return i > 0 ? process.argv[i + 1] : def; };
const outFile = path.resolve(root, arg("out", "renders/ai-garage.mp4"));
const thumbFile = path.resolve(root, arg("thumb", "renders/ai-garage-thumbnail.png"));
const stillsDir = path.resolve(root, arg("stills", "renders/stills"));
const CRF = arg("crf", "18");
const LIMIT = Number(arg("limit", "0"));
const ONLY = arg("only", "");
const FPS = 30;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.mkdirSync(stillsDir, { recursive: true });

/* ---------- static server for dist/ ---------- */
const MIME = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".wav": "audio/wav" };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]);
  const p = path.join(root, "dist", u === "/" ? "index.html" : u);
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(d);
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const stillsQ = process.env.STILLS === "1" ? "?stills=1" : "";
const url = `http://127.0.0.1:${port}/${stillsQ}`;

/* ---------- chrome + CDP ---------- */
const profile = fs.mkdtempSync(path.join("/tmp", "chrome-ai-garage-"));
const noSandbox = process.env.CHROME_NO_SANDBOX || process.env.CI || process.getuid?.() === 0;
const chrome = spawn(process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || "google-chrome", [
  "--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profile,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--window-size=1920,1080",
  "--disable-dev-shm-usage", "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
  "--autoplay-policy=no-user-gesture-required", "--force-device-scale-factor=1",
  ...(noSandbox ? ["--no-sandbox", "--disable-setuid-sandbox"] : []),
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
let chromeErr = "";
chrome.stderr.on("data", (d) => { chromeErr += d.toString(); if (chromeErr.length > 4000) chromeErr = chromeErr.slice(-4000); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let dbgPort = null;
for (let i = 0; i < 300 && !dbgPort; i++) {
  try { dbgPort = fs.readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split("\n")[0].trim(); } catch (e) { await sleep(100); }
}
if (!dbgPort) throw new Error("chrome did not start:\n" + chromeErr.trim());

const page = await (await fetch(`http://127.0.0.1:${dbgPort}/json/new?${encodeURIComponent(url)}`, { method: "PUT" })).json();

let id = 0;
function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const my = ++id;
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id !== my) return;
      ws.removeEventListener("message", onMsg);
      m.error ? reject(new Error(method + ": " + m.error.message)) : resolve(m.result);
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id: my, method, params: params || {} }));
  });
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("cdp socket failed")); });
const pageLogs = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.method === "Runtime.exceptionThrown") pageLogs.push("EXC " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") pageLogs.push("ERR " + m.params.args.map((a) => a.value ?? a.description).join(" "));
});
await rpc("Runtime.enable", {});

async function evaluate(expression) {
  const r = await rpc("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("page error: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}

/* ---------- boot ---------- */
console.log("opening", url);
const t0 = Date.now();
let ready = false;
for (let i = 0; i < 3000; i++) {
  ready = await evaluate("!!(window.__ready || window.__bootError)").catch(() => false);
  if (ready) break;
  if (i % 50 === 0) {
    const ph = await evaluate("JSON.stringify(window.__phaseLog||[])").catch(() => "[]");
    console.log(`boot ${(i / 10).toFixed(0)}s ${ph}`);
  }
  await sleep(100);
}
if (!ready) {
  const ph = await evaluate("JSON.stringify(window.__phaseLog||[])").catch(() => "[]");
  throw new Error("page never became ready; phases " + ph + "\n" + pageLogs.slice(-6).join("\n") + "\n" + chromeErr.slice(-600));
}
const bootErr = await evaluate("window.__bootError || null");
if (bootErr) throw new Error("page boot failed: " + bootErr);
console.log(`ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

const dur = await evaluate("window.__duration");
if (ONLY) {
  const dir = path.resolve(root, "renders/check");
  fs.mkdirSync(dir, { recursive: true });
  for (const t of ONLY.split(",").map(Number)) {
    const b = await evaluate(`window.__frameJpeg(${t}, 0.95)`);
    const f = path.join(dir, `t${t.toFixed(2)}.jpg`);
    fs.writeFileSync(f, Buffer.from(b, "base64"));
    console.log(f);
  }
  ws.close(); chrome.kill("SIGKILL"); server.close(); process.exit(0);
}
let frames = Math.ceil(dur * FPS);
if (LIMIT > 0) frames = Math.min(frames, LIMIT);
console.log(`duration ${dur}s -> ${frames} frames @ ${FPS}fps`);

const b64 = await evaluate("window.__mixWav()");
const wav = path.resolve(root, "renders/mix.wav");
fs.mkdirSync(path.dirname(wav), { recursive: true });
fs.writeFileSync(wav, Buffer.from(b64, "base64"));
console.log("mix:", (fs.statSync(wav).size / 1048576).toFixed(2), "MB");

/* ---------- frames to disk, then encode ---------- */
const frameDir = fs.mkdtempSync(path.join("/tmp", "ai-garage-frames-"));
const tFrame = Date.now();
for (let i = 0; i < frames; i++) {
  let jpg = null;
  for (let attempt = 0; attempt < 3 && !jpg; attempt++) {
    jpg = await evaluate(`window.__frameJpeg(${i / FPS}, 0.95)`).catch(() => null);
  }
  if (!jpg) throw new Error("frame " + i + " failed\n" + pageLogs.slice(-4).join("\n"));
  fs.writeFileSync(path.join(frameDir, `f${String(i).padStart(6, "0")}.jpg`), Buffer.from(jpg, "base64"));
  if (i % 100 === 0 || i === frames - 1) {
    const el = (Date.now() - tFrame) / 1000;
    console.log(`frame ${i + 1}/${frames}  ${((i + 1) / Math.max(el, 0.001)).toFixed(1)} fps  ${el.toFixed(0)}s`);
  }
}

const tmp = outFile.replace(/\.mp4$/, ".tmp.mp4");
const ffArgs = ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(frameDir, "f%06d.jpg")];
if (LIMIT === 0) ffArgs.push("-i", wav);
ffArgs.push(
  "-filter:a", "loudnorm=I=-14:TP=-1.0:LRA=7",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", CRF, "-pix_fmt", "yuv420p", "-r", String(FPS),
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
  "-shortest", "-movflags", "+faststart", tmp,
);
const ff = spawn("ffmpeg", ffArgs, { stdio: ["ignore", "inherit", "inherit"] });
await new Promise((res, rej) => ff.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exit " + c)))));
fs.rmSync(frameDir, { recursive: true, force: true });
fs.renameSync(tmp, outFile);
console.log("video:", outFile, (fs.statSync(outFile).size / 1048576).toFixed(1), "MB");

/* ---------- thumbnail + QA stills ---------- */
if (LIMIT === 0) {
  const png = await evaluate("window.__thumbPng(74.6, 1280, 720)");
  fs.writeFileSync(thumbFile, Buffer.from(png, "base64"));
  console.log("thumbnail:", thumbFile);
  for (const m of [1.2, 7.0, 14.9, 19.9, 23.9, 28.0, 34.3, 40.5, 44.9, 50.6, 56.8, 61.9, 64.2, 69.0, 74.6]) {
    const f = path.join(stillsDir, `frame_${m.toFixed(1)}.jpg`);
    await new Promise((res, rej) => {
      const p = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-ss", String(m), "-i", outFile, "-frames:v", "1", "-q:v", "3", f], { stdio: "inherit" });
      p.on("exit", (c) => (c === 0 ? res() : rej(new Error("still exit " + c))));
    });
  }
  console.log("stills:", stillsDir);
}

ws.close();
chrome.kill("SIGKILL");
server.close();
