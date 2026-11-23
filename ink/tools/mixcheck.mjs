// Dump the page's mixed audio to assets/mix.wav and report its stats.
import fs from "node:fs";
import { spawn } from "node:child_process";

const port = 9400 + Math.floor(Math.random() * 300);
const chrome = spawn(process.env.CHROME_PATH || "google-chrome", [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
  "--autoplay-policy=no-user-gesture-required",
  "--remote-debugging-port=" + port, "--user-data-dir=/tmp/chrome-mix-" + port,
  "--window-size=1280,720", "http://127.0.0.1:8081/",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let id = 0;
function rpc(ws, method, params) {
  return new Promise((resolve, reject) => {
    const my = ++id;
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id !== my) return;
      ws.removeEventListener("message", onMsg);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id: my, method, params: params || {} }));
  });
}
async function evaluate(ws, expression) {
  const r = await rpc(ws, "Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}

(async () => {
  let page = null;
  for (let i = 0; i < 120 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch (e) { }
    if (!page) await sleep(200);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  await rpc(ws, "Runtime.enable");
  for (let i = 0; i < 800; i++) {
    if (await evaluate(ws, "!!window.__ready").catch(() => false)) break;
    await sleep(250);
  }
  const err = await evaluate(ws, "window.__bootError || null").catch(() => null);
  if (err) console.error("boot error:", err);
  const stats = await evaluate(ws, "JSON.stringify(window.__mixStats || null)");
  const b64 = await evaluate(ws, "window.__mixWav()");
  fs.writeFileSync("assets/mix.wav", Buffer.from(b64, "base64"));
  console.log("mix stats:", stats);
  console.log("wrote assets/mix.wav", (fs.statSync("assets/mix.wav").size / 1048576).toFixed(2), "MB");
  ws.close();
  chrome.kill("SIGKILL");
  process.exit(0);
})().catch((e) => { console.error(e); chrome.kill("SIGKILL"); process.exit(1); });
