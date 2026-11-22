// Render the explainer to MP4 in headless Chromium: frames -> ffmpeg, then mux the mix.
// Usage: node tools/render.mjs [--out renders/ai-garage.mp4] [--crf 18]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const arg = (name, def) => { const i = process.argv.indexOf("--" + name); return i > 0 ? process.argv[i + 1] : def; };
const outFile = path.resolve(root, arg("out", "renders/ai-garage.mp4"));
const thumbFile = path.resolve(root, arg("thumb", "renders/ai-garage-thumbnail.png"));
const stillsDir = path.resolve(root, arg("stills", "renders/stills"));
const CRF = arg("crf", "18");
const LIMIT = Number(arg("limit", "0"));
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.mkdirSync(stillsDir, { recursive: true });

const MIME = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".wav": "audio/wav" };
const server = http.createServer((req, res) => {
  const p = path.join(root, "dist", decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
    res.end(d);
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const exe = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome";
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: "new",
  protocolTimeout: 900000,
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
    "--force-device-scale-factor=1"],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on("console", (m) => { if (m.type() === "error") console.error("[page]", m.text()); });
page.on("pageerror", (e) => console.error("[pageerror]", e.message));

console.log("opening", `http://127.0.0.1:${port}/`);
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded", timeout: 120000 });
let ready = false;
for (let i = 0; i < 600; i++) {
  ready = await page.evaluate(() => !!(window.__ready || window.__bootError)).catch(() => false);
  if (ready) break;
  await new Promise((r) => setTimeout(r, 400));
}
if (!ready) throw new Error("page never became ready");
const bootErr = await page.evaluate(() => window.__bootError || null);
if (bootErr) throw new Error("page boot failed: " + bootErr);

const dur = await page.evaluate(() => window.__duration);
const fps = 30;
let frames = Math.ceil(dur * fps);
if (LIMIT > 0) frames = Math.min(frames, LIMIT);
console.log(`duration ${dur}s  -> ${frames} frames @ ${fps}fps`);

const b64 = await page.evaluate(() => window.__mixWav());
const wav = path.resolve(root, "renders/mix.wav");
fs.writeFileSync(wav, Buffer.from(b64, "base64"));
console.log("mix:", (fs.statSync(wav).size / 1048576).toFixed(2), "MB");

const tmp = outFile.replace(/\.mp4$/, ".tmp.mp4");
const ff = spawn("ffmpeg", [
  "-y", "-hide_banner", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(fps), "-vcodec", "mjpeg", "-i", "-",
  "-i", wav,
  "-filter:a", "volume=5.4dB,alimiter=limit=0.84:attack=5:release=60:level=false",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", CRF, "-pix_fmt", "yuv420p", "-r", String(fps),
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
  "-shortest", "-movflags", "+faststart", tmp,
], { stdio: ["pipe", "inherit", "inherit"] });
const ffDone = new Promise((res, rej) => ff.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exit " + c)))));

const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  const t = i / fps;
  const jpg = await page.evaluate((tt, q) => window.__frameJpeg(tt, q), t, 0.95);
  if (!ff.stdin.write(Buffer.from(jpg, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % 100 === 0 || i === frames - 1) {
    const el = (Date.now() - t0) / 1000;
    console.log(`frame ${i + 1}/${frames}  ${(i + 1 / Math.max(el, 0.001)).toFixed(1)} fps  ${el.toFixed(0)}s`);
  }
}
ff.stdin.end();
await ffDone;
fs.renameSync(tmp, outFile);
console.log("video:", outFile, (fs.statSync(outFile).size / 1048576).toFixed(1), "MB");

// hero frame for the thumbnail (no captions or marks in this style anyway)
const png = await page.evaluate(() => window.__thumbPng(32.55, 1280, 720));
fs.writeFileSync(thumbFile, Buffer.from(png, "base64"));
console.log("thumbnail:", thumbFile);

// QA stills straight out of the delivered file
const marks = [1.4, 4.6, 9.8, 15.5, 20.1, 23.4, 26.2, 29.9, 32.7];
for (const m of marks) {
  const f = path.join(stillsDir, `frame_${m.toFixed(1)}.jpg`);
  await new Promise((res, rej) => {
    const p = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-ss", String(m), "-i", outFile, "-frames:v", "1", "-q:v", "3", f], { stdio: "inherit" });
    p.on("exit", (c) => (c === 0 ? res() : rej(new Error("still exit " + c))));
  });
}
console.log("stills:", stillsDir);

await browser.close();
server.close();
