import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const SITE = "https://www.bondapp.io";

// Discovered / known Framer routes for this site
const PAGES = [
  "/",
  "/pricing",
  "/about",
  "/careers",
  "/cookies",
  "/privacy-policy",
  "/terms-of-service",
  "/insights",
  "/careers/frontend-design-engineer",
  "/careers/full-stack-engineer",
  "/careers/mobile-native-engineer",
  "/careers/cracked-backend-data-engineer",
  "/careers/customer-success",
  "/careers/marketing-graphic-design-intern",
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function fetchBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error("too many redirects: " + url));
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,*/*",
        },
        timeout: 90000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = new URL(res.headers.location, url).href;
          res.resume();
          return resolve(fetchBuffer(next, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: res.headers["content-type"] || "",
          })
        );
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

function pageToFile(route) {
  if (route === "/") return path.join(OUT, "index.html");
  const clean = route.replace(/^\//, "").replace(/\/$/, "");
  return path.join(OUT, clean, "index.html");
}

function rewriteInternalLinks(html) {
  // Point same-site absolute URLs to relative local paths
  let out = html;

  // https://www.bondapp.io/pricing -> /pricing/ (and similar)
  out = out.replace(
    /https?:\/\/(?:www\.)?bondapp\.io(\/[^"'`\s?#]*)?/g,
    (_m, pth = "/") => {
      const clean = (pth || "/").replace(/\/$/, "") || "/";
      if (clean === "/") return "./";
      return clean + "/";
    }
  );

  // Soften Framer editor / analytics so they don't break the clone
  out = out.replace(
    /<script[^>]*src=["']https:\/\/events\.framer\.com[^"']*["'][^>]*><\/script>/gi,
    "<!-- framer events removed -->"
  );

  return out;
}

async function discoverExtraRoutes(html) {
  const routes = new Set();
  const patterns = [
    /https?:\/\/(?:www\.)?bondapp\.io(\/[a-z0-9][a-z0-9_\-\/]*)/gi,
    /href=["'](\/[a-z0-9][a-z0-9_\-\/]*)["']/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html))) {
      let p = m[1].replace(/\/$/, "") || "/";
      if (p.includes(".")) continue;
      if (p.length > 80) continue;
      // only allow simple path segments
      if (!/^\/[a-z0-9][a-z0-9_\-\/]*$/i.test(p === "/" ? "/" : p)) continue;
      routes.add(p);
    }
  }
  return routes;
}

async function main() {
  ensureDir(OUT);
  const todo = new Set(PAGES);
  const done = new Set();
  const report = { ok: [], fail: [] };

  while (todo.size) {
    const route = todo.values().next().value;
    todo.delete(route);
    if (done.has(route)) continue;
    done.add(route);

    const url = SITE + (route === "/" ? "/" : route);
    const file = pageToFile(route);
    console.log("GET", url, "→", path.relative(OUT, file));

    try {
      const { buffer, contentType } = await fetchBuffer(url);
      if (!contentType.includes("text/html") && !buffer.slice(0, 20).toString().includes("<!")) {
        console.warn("SKIP non-html", url, contentType);
        report.fail.push({ route, error: "not html: " + contentType });
        continue;
      }
      let html = buffer.toString("utf8");

      // Discover more routes from this page
      for (const r of await discoverExtraRoutes(html)) {
        if (!done.has(r) && r.split("/").filter(Boolean).length <= 4) {
          todo.add(r);
        }
      }

      html = rewriteInternalLinks(html);
      ensureDir(path.dirname(file));
      fs.writeFileSync(file, html, "utf8");
      report.ok.push(route);
      console.log("  OK", (buffer.length / 1024).toFixed(0) + "KB");
    } catch (e) {
      console.warn("  FAIL", e.message);
      report.fail.push({ route, error: e.message });
    }
  }

  // Write a tiny local server + readme
  fs.writeFileSync(
    path.join(OUT, "server.mjs"),
    `import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

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

const server = http.createServer((req, res) => {
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
`
  );

  fs.writeFileSync(
    path.join(OUT, "package.json"),
    JSON.stringify(
      {
        name: "bond-clone",
        private: true,
        type: "module",
        scripts: {
          start: "node server.mjs",
          mirror: "node fetch-pages.mjs",
        },
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(OUT, "README.md"),
    `# Bond website clone (local)

Copie locale du site marketing [bondapp.io](https://www.bondapp.io/) (Framer).

Les assets images/fonts/JS Framer restent chargés depuis \`framerusercontent.com\` (CDN) —
le HTML est local et modifiable.

## Lancer

\`\`\`bash
npm start
\`\`\`

Ouvre http://localhost:3000

## Modifier

Édite \`index.html\` (home), \`pricing/index.html\`, \`about/index.html\`, etc.
Recharge le navigateur pour voir les changements.

## Re-télécharger les pages

\`\`\`bash
node fetch-pages.mjs
\`\`\`
`
  );

  fs.writeFileSync(path.join(OUT, "_pages-report.json"), JSON.stringify(report, null, 2));
  console.log("\\nDone. OK:", report.ok.length, "FAIL:", report.fail.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
