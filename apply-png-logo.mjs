import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WIDTH = 128;
const HEIGHT = 26;
const MASK_CSS =
  "url(/assets/logo-bond-2-mask.png) alpha no-repeat center / 100% 100%";

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "assets") continue;
      walk(p, out);
    } else if (name === "index.html") out.push(p);
  }
  return out;
}

const DATA_MASK_RE =
  /url\("data:image\/svg\+xml,<svg display=\\"block\\" role=\\"presentation\\" viewBox=\\"0 0 178 32\\"[\s\S]*?<\/svg>"\)(?: alpha no-repeat center \/ 100% 100%)?/g;

const OVERRIDE = [
  '<style id="bond-2-logo-override">',
  '  a[data-framer-name="logo"] .framer-WCpzp,',
  "  .framer-WCpzp.framer-1yrsrus {",
  `    width: ${WIDTH}px !important;`,
  `    height: ${HEIGHT}px !important;`,
  "    aspect-ratio: 568 / 118 !important;",
  `    -webkit-mask: ${MASK_CSS} !important;`,
  `    mask: ${MASK_CSS} !important;`,
  "    background-color: var(--sgwngf, #faf8f6) !important;",
  "    background-image: none !important;",
  "  }",
  "</style>",
].join("\n");

let files = 0;
for (const file of walk(__dirname)) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  if (DATA_MASK_RE.test(html)) {
    DATA_MASK_RE.lastIndex = 0;
    html = html.replace(
      DATA_MASK_RE,
      'url("/assets/logo-bond-2-mask.png") alpha no-repeat center / 100% 100%'
    );
  }

  html = html.replace(
    /aspect-ratio:5\.5625;height:var\(--framer-aspect-ratio-supported,26px\);flex:none;width:142px;/g,
    `aspect-ratio:4.8136;height:var(--framer-aspect-ratio-supported,${HEIGHT}px);flex:none;width:${WIDTH}px;`
  );
  html = html.replace(
    /aspect-ratio:5\.15;height:var\(--framer-aspect-ratio-supported,20px\);flex:none;width:103px;/g,
    `aspect-ratio:4.8136;height:var(--framer-aspect-ratio-supported,${HEIGHT}px);flex:none;width:${WIDTH}px;`
  );

  html = html.replace(
    /<style id="bond-2-logo-override">[\s\S]*?<\/style>(?:\s*<script id="bond-2-logo-keep">[\s\S]*?<\/script>)?/g,
    ""
  );
  html = html.replace("</head>", OVERRIDE + "\n</head>");

  if (html !== before) {
    fs.writeFileSync(file, html, "utf8");
    files++;
    console.log("ok", path.relative(__dirname, file));
  }
}
console.log("files", files);
