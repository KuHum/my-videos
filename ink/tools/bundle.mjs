// Bundle the explainer into one self-contained, offline-capable HTML file.
import fs from "node:fs";
import path from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => fs.readFileSync(path.join(root, p));
const b64 = (p) => read(p).toString("base64");

const order = ["src/ink-kit.js", "src/beats.js", "src/audio.js",
  "src/scenes_a.js", "src/scenes_b.js",
  "src/driver.js", "src/main.js"];
const scripts = order.map((f) => `<script>\n${read(f).toString("utf8")}\n</script>`).join("\n");

let html = read("index.html").toString("utf8");
html = html.split("__AUDIO__").join(b64("assets/vo.wav"));
html = html.split("__FONT__").join(b64("assets/Montserrat.ttf"));
html = html.split("<!--SCRIPTS-->").join(scripts);

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const out = path.join(root, "dist/index.html");
fs.writeFileSync(out, html);
console.log("bundled " + out + "  " + (html.length / 1048576).toFixed(2) + " MB");
