// Minimal static server for local preview and stills.  node tools/serve.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const port = Number(process.argv[2] || 8081);
const types = { ".html": "text/html", ".js": "text/javascript", ".wav": "audio/wav", ".ttf": "font/ttf", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".mp4": "video/mp4" };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(root, url === "/" ? "dist/index.html" : url);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end("not found: " + url); return; }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(data);
  });
}).listen(port, () => console.log("serving " + root + " on http://127.0.0.1:" + port));
