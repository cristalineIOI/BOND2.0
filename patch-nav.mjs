import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NAV_FIX = `
<script id="local-nav-fix">
(function () {
  // Framer SPA routing breaks on a static localhost clone.
  // Force full page loads for same-origin links.
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    var url;
    try { url = new URL(href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // in-page anchors
    e.preventDefault();
    e.stopPropagation();
    location.href = url.pathname + url.search + url.hash;
  }, true);
})();
</script>
`;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      walk(p, out);
    } else if (name === "index.html") {
      out.push(p);
    }
  }
  return out;
}

for (const file of walk(__dirname)) {
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("id=\"local-nav-fix\"")) {
    html = html.replace(/<script id="local-nav-fix">[\s\S]*?<\/script>\s*/g, "");
  }
  if (html.includes("</body>")) {
    html = html.replace("</body>", NAV_FIX + "</body>");
  } else {
    html += NAV_FIX;
  }
  fs.writeFileSync(file, html, "utf8");
  console.log("patched", path.relative(__dirname, file));
}
