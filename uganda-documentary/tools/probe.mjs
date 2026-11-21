#!/usr/bin/env node
/**
 * Local debugging aid: assembles index.html + the composition the way the
 * compiler does, serves it, and prints the browser console to stdout.
 *
 *   node tools/probe.mjs [--wait 90]
 *
 * Use this when `snapshot` says "buildReady rejected" and gives no reason.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import puppeteer from "puppeteer-core";

const WAIT = (() => {
  const i = process.argv.indexOf("--wait");
  return i > 0 ? Number(process.argv[i + 1]) : 90;
})();

// 1. inline the composition into the root, as the compiler does
const root = readFileSync("index.html", "utf8");
const comp = readFileSync("compositions/film.html", "utf8");
const inner = comp.slice(comp.indexOf("<template>") + 10, comp.lastIndexOf("</template>"));
const hostRe = /<div id="film"[\s\S]*?data-width="1920"\s*data-height="1080"><\/div>/;
if (!hostRe.test(root)) {
  console.error("could not find the film host in index.html");
  process.exit(2);
}
let page = root.replace(hostRe, inner);
// Load the real runtime, so __timelines and the seek protocol exist as they do
// in a render.
page = page.replace("</head>",
  '<script src="node_modules/hyperframes/dist/hyperframe.runtime.iife.js"></script>\n</head>');
writeFileSync("_probe.html", page);

// 2. serve the project
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
  ".m4a": "audio/mp4", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".css": "text/css" };
const server = createServer((req, res) => {
  const p = normalize(join(".", decodeURIComponent(req.url.split("?")[0])));
  try {
    const body = readFileSync(p);
    res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("no");
  }
});
await new Promise((r) => server.listen(8123, r));

// 3. drive Chrome
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--use-gl=angle", "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader", "--window-size=1920,1080"]
});
const tab = await browser.newPage();
await tab.setViewport({ width: 1920, height: 1080 });

tab.on("console", (m) => console.log(`[${m.type()}] ${m.text()}`));
tab.on("pageerror", (e) => console.log(`[pageerror] ${e.message}\n${e.stack || ""}`));
tab.on("requestfailed", (r) => console.log(`[net-fail] ${r.url()} ${r.failure()?.errorText}`));

await tab.goto("http://127.0.0.1:8123/_probe.html", { waitUntil: "domcontentloaded" });

const started = Date.now();
while (Date.now() - started < WAIT * 1000) {
  await new Promise((r) => setTimeout(r, 2000));
  const state = await tab.evaluate(() => {
    const keys = window.__hf && window.__hf.buildReady ? Object.keys(window.__hf.buildReady) : [];
    return { keys, ready: window.__renderReady, building: window.__hfTimelinesBuilding };
  });
  if (state.keys.length && state.ready !== false && !state.building) break;
}

const final = await tab.evaluate(async () => {
  const out = { keys: [], failed: [], ok: [] };
  const br = window.__hf && window.__hf.buildReady ? window.__hf.buildReady : {};
  out.keys = Object.keys(br);
  for (const k of out.keys) {
    try { await br[k]; out.ok.push(k); } catch (e) { out.failed.push(k + ": " + (e && e.message)); }
  }
  out.renderReady = window.__renderReady;
  out.building = window.__hfTimelinesBuilding;
  out.canvas = !!document.querySelector("canvas");
  out.timeline = !!(window.__timelines && window.__timelines["film"]);
  return out;
});
console.log("RESULT", JSON.stringify(final, null, 1));

await browser.close();
server.close();
process.exit(0);
