// Tampering Test #5 — search the client bundle for the AI API key.
//
// Crawls the public pages of a deployment (default: production), downloads
// every JavaScript file the browser is sent, follows chunk references inside
// those files, and searches everything for:
//   - the real OPENROUTER_API_KEY value (read from .env, never printed)
//   - the OpenRouter key prefix "sk-or-"
//   - the variable name "OPENROUTER_API_KEY"
//   - the Supabase secret key (read from .env, never printed)
//
// Usage: node --env-file=.env scripts/check-bundle.mjs [baseUrl]

const BASE = (process.argv[2] ?? "https://mytailor-sigma.vercel.app").replace(/\/$/, "");
const PAGES = ["/", "/login", "/signup", "/how-it-works", "/for-tailors", "/forgot-password", "/terms", "/privacy"];

const needles = [
  { label: "OPENROUTER_API_KEY value", value: process.env.OPENROUTER_API_KEY },
  { label: "SUPABASE_SECRET_KEY value", value: process.env.SUPABASE_SECRET_KEY },
  { label: 'prefix "sk-or-"', value: "sk-or-" },
  { label: 'name "OPENROUTER_API_KEY"', value: "OPENROUTER_API_KEY" },
  { label: 'host "openrouter.ai"', value: "openrouter.ai" },
].filter((n) => n.value);

const scriptRe = /(?:https?:\/\/[^"'\s]+)?\/_next\/static\/[^"'\s)\\]+?\.js/g;

const seen = new Set();
const queue = [];
const hits = [];
let bytes = 0;

function enqueue(src) {
  const url = src.startsWith("http") ? src : BASE + src;
  if (!url.startsWith(BASE) || seen.has(url)) return;
  seen.add(url);
  queue.push(url);
}

const publicHits = new Set();
function search(where, text) {
  bytes += text.length;
  const pk = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (pk && text.includes(pk)) publicHits.add(where);
  for (const n of needles) if (text.includes(n.value)) hits.push({ where, label: n.label });
}

for (const path of PAGES) {
  const res = await fetch(BASE + path);
  const html = await res.text();
  search(`HTML ${path}`, html);
  for (const m of html.matchAll(scriptRe)) enqueue(m[0]);
}

while (queue.length) {
  const url = queue.shift();
  const res = await fetch(url);
  if (!res.ok) continue;
  const js = await res.text();
  search(url.replace(BASE, ""), js);
  for (const m of js.matchAll(scriptRe)) enqueue(m[0]);
}

console.log(`Target:        ${BASE}`);
console.log(`Pages crawled: ${PAGES.length}`);
console.log(`JS files:      ${seen.size}`);
console.log(`Bytes scanned: ${(bytes / 1024).toFixed(0)} KB`);
console.log(`Searched for:  ${needles.map((n) => n.label).join(", ")}`);
if (!process.env.OPENROUTER_API_KEY) console.log("WARNING: OPENROUTER_API_KEY not set locally — real key value not searched.");
console.log("");
// Positive control: the publishable key is meant to be public, so finding it
// proves the scanner really sees the environment values that ship to the browser.
const pk = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (pk) console.log(`Control:       publishable Supabase key ${publicHits.size ? "FOUND (expected — scanner works)" : "not found"}`);
if (hits.length === 0) {
  console.log("RESULT: PASS — no match in any HTML page or JavaScript file.");
} else {
  console.log("RESULT: FAIL");
  for (const h of hits) console.log(`  ${h.label} found in ${h.where}`);
  process.exitCode = 1;
}
