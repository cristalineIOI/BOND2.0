import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// Bond-OpenAI phone relay. The browser talks to this server (same origin) and
// this server forwards /api/* to the relay's /v1/*, which avoids CORS and keeps
// any relay token server-side. Override the endpoint/token with env vars.
const RELAY_ENDPOINT = (
  process.env.RELAY_ENDPOINT || "https://bond-openai-demo-relay.onrender.com"
).replace(/\/$/, "");
const RELAY_TOKEN = process.env.RELAY_TOKEN || "";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  if (p === "/") p = "/index.html";
  const abs = path.join(__dirname, p);
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  const asIndex = path.join(__dirname, p, "index.html");
  if (fs.existsSync(asIndex)) return asIndex;
  const asHtml = abs + ".html";
  if (fs.existsSync(asHtml)) return asHtml;
  return null;
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => resolve(""));
  });
}

async function proxyRelay(req, res) {
  // /api/calls -> {relay}/v1/calls, preserving sub-paths and query.
  const target = RELAY_ENDPOINT + req.url.replace(/^\/api/, "/v1");
  const headers = { "Content-Type": "application/json" };
  if (RELAY_TOKEN) headers["Authorization"] = "Bearer " + RELAY_TOKEN;
  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await readBody(req);
  }
  try {
    const upstream = await fetch(target, init);
    const text = await upstream.text();
    res.writeHead(upstream.status, {
      "Content-Type": upstream.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    });
    res.end(text);
  } catch (err) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "relay_unreachable", message: String(err) }));
  }
}

const server = http.createServer((req, res) => {
  if ((req.url || "").startsWith("/api/")) {
    proxyRelay(req, res);
    return;
  }
  const file = resolveFile(req.url || "/");
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found: " + req.url);
    return;
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log("Bond clone → http://localhost:" + PORT);
});
