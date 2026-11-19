// Fails the build if the static preview could leak data, call out, or run unsafe code.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const rules = [
  [/XMLHttpRequest|WebSocket|sendBeacon|EventSource|importScripts|navigator\.serviceWorker/, "network API other than fetch"],
  [/localStorage|sessionStorage|indexedDB|document\.cookie/, "browser storage"],
  [/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|new Function/, "unsafe DOM/code sink"],
  [/<script[^>]*\bsrc=|<link[^>]*\bhref=|<iframe|<img[^>]*\bsrc=["']https?:/i, "external resource"],
  [/AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(secret|password|api[_-]?key|token)\s*[:=]\s*["'][A-Za-z0-9+\/_=-]{16,}["']/i, "possible secret"],
];
const api = JSON.parse(readFileSync("config/tenant.config.json", "utf8")).urls.apiBaseUrl;
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); } })("web");
let bad = 0;
for (const f of files) {
  const t = readFileSync(f, "utf8");
  for (const u of t.match(/https?:\/\/[^\s"'`)<;]+/g) || []) if (u !== api && u !== "http://www.w3.org/2000/svg") { bad++; console.error(`FAIL ${f}: external URL: ${u.slice(0, 60)}`); }
  for (const [re, why] of rules) { const m = t.match(re); if (m) { bad++; console.error(`FAIL ${f}: ${why}: ${m[0].slice(0, 60)}`); } }
}
console.log(`scanned ${files.length} file(s), ${bad} violation(s)`);
process.exit(bad ? 1 : 0);
