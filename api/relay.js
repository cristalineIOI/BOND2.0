// Vercel serverless proxy: browser calls same-origin /api/*, this forwards to
// the Bond-OpenAI relay /v1/* so there is no CORS and any token stays server-side.
// vercel.json rewrites every /api/:path* to this single function; the original
// segments arrive in req.query.path (a catch-all bracket file only matched a
// single segment here, which 404'd the poll GET /api/calls/:id in production).
// Mirrors server.mjs (used for local `npm start`). Configure via env:
//   RELAY_ENDPOINT (default: public demo relay), RELAY_TOKEN (private relay only).

const RELAY_ENDPOINT = (
  process.env.RELAY_ENDPOINT || "https://bond-openai-demo-relay.onrender.com"
).replace(/\/$/, "");
const RELAY_TOKEN = process.env.RELAY_TOKEN || "";

export default async function handler(req, res) {
  const segs = req.query.path;
  const sub = Array.isArray(segs) ? segs.join("/") : segs ? String(segs) : "";
  const target = `${RELAY_ENDPOINT}/v1/${sub}`;

  const headers = { "Content-Type": "application/json" };
  if (RELAY_TOKEN) headers["Authorization"] = "Bearer " + RELAY_TOKEN;

  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
  }

  try {
    const upstream = await fetch(target, init);
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json"
    );
    res.setHeader("Cache-Control", "no-store");
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: "relay_unreachable", message: String(err) });
  }
}
