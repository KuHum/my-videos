// Smoke test: transport, boot, and a few real frames. Fails loudly, in seconds.
// Usage: node tools/check.mjs
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".wav": "audio/wav" };

/* 1. serve dist/ (NOTE: "/" must map to index.html, not to the directory) */
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
const stills = process.env.STILLS === "1" ? "?stills=1" : "";
const url = `http://127.0.0.1:${server.address().port}/${stills}`;

/* 2. transport check before anything else */
const res = await fetch(url);
const body = await res.text();
console.log(`GET / -> ${res.status}  ${(body.length / 1048576).toFixed(2)} MB`);
if (res.status !== 200) throw new Error("the page is not being served (status " + res.status + ")");
if (body.length < 200000) throw new Error("the page is too small (" + body.length + " bytes) — bundle missing?");
if (!body.includes("id=\"stage\"")) throw new Error("served page is not the explainer (no #stage canvas)");

/* 3. one browser, one session */
const profile = fs.mkdtempSync(path.join("/tmp", "check-ai-garage-"));
const noSandbox = process.env.CHROME_NO_SANDBOX || process.env.CI || process.getuid?.() === 0;
const chrome = spawn(process.env.CHROME_PATH || "google-chrome", [
  "--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profile,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--window-size=1920,1080",
  "--disable-dev-shm-usage", "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
  "--autoplay-policy=no-user-gesture-required",
  ...(noSandbox ? ["--no-sandbox", "--disable-setuid-sandbox"] : []),
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let chromeErr = "";
chrome.stderr.on("data", (d) => { chromeErr += d.toString(); });

let dbgPort = null;
for (let i = 0; i < 200 && !dbgPort; i++) {
  try { dbgPort = fs.readFileSync(path.join(profile, "DevToolsActivePort"), "utf8").split("\n")[0].trim(); } catch (e) { await sleep(100); }
}
if (!dbgPort) throw new Error("chrome did not start:\n" + chromeErr.slice(-600));

const page = await (await fetch(`http://127.0.0.1:${dbgPort}/json/new?${encodeURIComponent(url)}`, { method: "PUT" })).json();
let id = 0;
const pending = new Map();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("cdp socket failed")); });
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
});
const send = (method, params) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
await send("Runtime.enable", {});
const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("page error: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
};

/* 4. wait for the document to parse, then require the API */
let hasApi = false;
for (let i = 0; i < 150 && !hasApi; i++) {
  hasApi = await ev("typeof window.drawAt === 'function'").catch(() => false);
  if (!hasApi) await sleep(100);
}
const api = await ev("JSON.stringify({draw:typeof window.drawAt, frame:typeof window.__frameJpeg, ready:!!window.__ready, state:document.readyState, err:window.__bootError||null})");
console.log("page api:", api);
if (!hasApi) throw new Error("window.drawAt missing after 15s — the page scripts did not run");

const t0 = Date.now();
let ready = false;
for (let i = 0; i < 1200; i++) {
  ready = await ev("!!(window.__ready || window.__bootError)");
  if (ready) break;
  if (i % 50 === 0) console.log(`boot ${(i / 10).toFixed(0)}s`, await ev("JSON.stringify(window.__phaseLog||[])"));
  await sleep(100);
}
if (!ready) throw new Error("page never became ready:\n" + chromeErr.slice(-400));
const bootErr = await ev("window.__bootError || null");
if (bootErr) throw new Error("page boot failed: " + bootErr);
console.log(`ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

/* 5. draw real frames and prove they are not blank */
const dur = await ev("window.__duration");
for (const t of [0.4, dur * 0.33, dur * 0.66, dur - 0.6]) {
  const colors = await ev(`(() => {
    window.__frameJpeg(${t}, 0.9);
    const c = document.getElementById("stage"), g = c.getContext("2d");
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const seen = new Set();
    for (let i = 0; i < d.length; i += 2400) seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    return seen.size;
  })()`);
  console.log(`t=${t.toFixed(2)}s  distinct colours: ${colors}`);
  if (colors < 40) throw new Error(`frame at ${t.toFixed(2)}s looks blank (${colors} colours)`);
}

console.log(`CHECK OK — duration ${dur.toFixed(2)}s, ${Math.ceil(dur * 30)} frames at 30 fps`);
ws.close();
chrome.kill("SIGKILL");
server.close();
