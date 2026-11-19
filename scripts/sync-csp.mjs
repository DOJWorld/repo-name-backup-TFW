// Recomputes SHA-256 CSP hashes for the inline <script>/<style> in web/index.html
// and writes them into web/index.html (meta CSP) and netlify.toml (header CSP).
// Run: node scripts/sync-csp.mjs   (CI runs it with --check and fails on drift)
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const check = process.argv.includes("--check");
const h = (x) => "sha256-" + createHash("sha256").update(x, "utf8").digest("base64");
let html = readFileSync("web/index.html", "utf8");
const lf = (x) => x.replace(/\r\n?/g, "\n"); // browsers normalise newlines before hashing inline code
const sc = lf(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const st = lf(html.match(/<style>([\s\S]*?)<\/style>/)[1]);
const api = JSON.parse(readFileSync("config/tenant.config.json", "utf8")).urls.apiBaseUrl;
const fix = (txt) =>
  txt.replace(/connect-src [^;"]*/g, `connect-src ${api}`).replace(/script-src 'sha256-[^']*'/g, `script-src '${h(sc)}'`)
     .replace(/style-src 'sha256-[^']*'/g, `style-src '${h(st)}'`);
let toml = readFileSync("netlify.toml", "utf8");
const nh = fix(html), nt = fix(toml);
if (check) {
  if (nh !== html || nt !== toml) { console.error("CSP hashes out of date. Run: node scripts/sync-csp.mjs"); process.exit(1); }
  console.log("CSP hashes in sync"); process.exit(0);
}
writeFileSync("web/index.html", nh); writeFileSync("netlify.toml", nt);
console.log("script", h(sc)); console.log("style ", h(st));
