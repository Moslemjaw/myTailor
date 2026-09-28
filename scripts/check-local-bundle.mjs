// Tampering Test #5 (complete version) — scan EVERY browser file of a local
// production build, including chunks only loaded on signed-in pages.
//
// Usage: npm run build && node --env-file=.env scripts/check-local-bundle.mjs

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = ".next/static";

const secrets = [
  { label: "OPENROUTER_API_KEY value", value: process.env.OPENROUTER_API_KEY },
  { label: "SUPABASE_SECRET_KEY value", value: process.env.SUPABASE_SECRET_KEY },
  { label: 'prefix "sk-or-"', value: "sk-or-" },
  { label: 'name "OPENROUTER_API_KEY"', value: "OPENROUTER_API_KEY" },
  { label: 'host "openrouter.ai"', value: "openrouter.ai" },
].filter((n) => n.value);

// Positive control: this value is meant to reach the browser.
const control = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

let files = 0;
let bytes = 0;
let controlFound = 0;
const hits = [];

for (const file of walk(ROOT)) {
  const text = readFileSync(file, "utf8");
  files++;
  bytes += text.length;
  if (control && text.includes(control)) controlFound++;
  for (const s of secrets) if (text.includes(s.value)) hits.push({ file, label: s.label });
}

console.log(`Scanned:      ${ROOT} — ${files} files, ${(bytes / 1024).toFixed(0)} KB`);
console.log(`Searched for: ${secrets.map((s) => s.label).join(", ")}`);
console.log(`Control:      publishable Supabase key found in ${controlFound} file(s) ${controlFound ? "(expected — scanner works)" : "(!)"}`);
console.log("");
if (hits.length === 0) {
  console.log("RESULT: PASS — no secret found in any browser file.");
} else {
  console.log("RESULT: FAIL");
  for (const h of hits) console.log(`  ${h.label} found in ${h.file}`);
  process.exitCode = 1;
}
