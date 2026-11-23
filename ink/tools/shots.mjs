// Capture real frames from the bundled page using Chrome DevTools Protocol.
// node tools/shots.mjs 0,4.2,9.5 [--out shots] [--url http://127.0.0.1:8081/] [--w 1920 --h 1080]
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const times = (args[0] || "0").split(",").map(Number).filter((n) => !isNaN(n));
const opt = (name, def) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : def; };
const outDir = path.resolve(opt("out", "shots"));
const url = opt("url", "http://127.0.0.1:8081/");
const port = 9300 + Math.floor(Math.random() * 400);
const profile = "/tmp/chrome-ai-garage-" + port;

const chrome = spawn(process.env.CHROME_PATH || "google-chrome", [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
  "--autoplay-policy=no-user-gesture-required",
  "--remote-debugging-port=" + port, "--user-data-dir=" + profile,
  "--window-size=1920,1080", url,
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function listTargets() {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch("http://127.0.0.1:" + port + "/json/list");
      const j = await r.json();
      const page = j.find((t) => t.type === "page");
      if (page) return page;
    } catch (e) { }
    await sleep(200);
  }
  throw new Error("chrome devtools never came up");
}

let id = 0;
function rpc(ws, method, params) {
  return new Promise((resolve, reject) => {
    const my = ++id;
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id !== my) return;
      ws.removeEventListener("message", onMsg);
      m.error ? reject(new Error(method + ": " + JSON.stringify(m.error))) : resolve(m.result);
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id: my, method, params: params || {} }));
  });
}

async function evaluate(ws, expression, awaitPromise) {
  const r = await rpc(ws, "Runtime.evaluate", { expression, awaitPromise: !!awaitPromise, returnByValue: true });
  if (r.exceptionDetails) throw new Error("page error: " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
  return r.result.value;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const target = await listTargets();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  await rpc(ws, "Runtime.enable");
  for (let i = 0; i < 600; i++) {
    const ready = await evaluate(ws, "!!window.__ready").catch(() => false);
    if (ready) break;
    await sleep(250);
  }
  const pre = opt('js', '');
  if (pre) await evaluate(ws, pre);
  const err = await evaluate(ws, "window.__bootError || null").catch(() => null);
  if (err) console.error("boot error:", err);
  const thumb = opt("thumb", "");
  if (thumb) {
    for (const spec of thumb.split(",")) {
      const [tt, w, h] = spec.split(":");
      const b64 = await evaluate(ws, `window.__thumbPng(${tt}, ${w || 1280}, ${h || 720})`);
      const f = path.join(outDir, `thumb_${String(tt).replace(".", "_")}.png`);
      fs.writeFileSync(f, Buffer.from(b64, "base64"));
      console.log(f);
    }
  }
  for (const t of times) {
    const b64 = await evaluate(ws, `window.__frameJpeg(${t}, 0.95)`);
    const f = path.join(outDir, "t" + String(t.toFixed(2)).padStart(6, "0") + ".jpg");
    fs.writeFileSync(f, Buffer.from(b64, "base64"));
    console.log(f);
  }
  ws.close();
  chrome.kill("SIGKILL");
  process.exit(0);
})().catch((e) => { console.error(e); chrome.kill("SIGKILL"); process.exit(1); });
