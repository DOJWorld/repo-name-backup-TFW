// node scripts/verify-placement.mjs          -> verify
// node scripts/verify-placement.mjs --write  -> regenerate the file table inside docs/handover/PLACEMENT_AND_CONNECTION_GUIDE.md
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readJson, walk, root } from "./_registry-lib.mjs";
const rules = readJson("config/placement-manifest.json").rules; const errs = []; const used = new Map();
const files = walk().sort();
const hit = (f) => rules.find((r) => (r.match.endsWith("/") ? f.startsWith(r.match) : f === r.match));
for (const f of files) {
  if (/(^|\/)\.env$|\.pem$|\.key$|\.p12$|(^|\/)tfw-values\.json$|\.zip$|\.tar\.gz$|node_modules/.test(f)) errs.push(`forbidden file present: ${f}`);
  const r = hit(f); if (!r) errs.push(`file not in placement manifest: ${f}`); else used.set(r, (used.get(r) || 0) + 1);
}
for (const r of rules) if (!used.has(r)) errs.push(`rule matches no file: ${r.match}`);
const rows = files.map((f) => { const r = hit(f); return `| \`${f}\` | ${r.github} | ${r.netlify} | ${r.render} | ${r.neon} | ${r.why} |`; });
const table = ["| File | GitHub | Netlify | Render | Neon | Purpose |", "| --- | --- | --- | --- | --- | --- |", ...rows].join("\n");
const guide = "docs/handover/PLACEMENT_AND_CONNECTION_GUIDE.md", B = "<!-- BEGIN:FILE_TABLE -->", E = "<!-- END:FILE_TABLE -->";
if (existsSync(join(root, guide))) {
  const t = readFileSync(join(root, guide), "utf8"); const a = t.indexOf(B), b = t.indexOf(E);
  if (a < 0 || b < 0) errs.push("guide is missing table markers");
  else {
    const next = t.slice(0, a + B.length) + "\n" + table + "\n" + t.slice(b);
    if (process.argv.includes("--write")) writeFileSync(join(root, guide), next);
    else if (next !== t) errs.push("file table in the guide is out of date: run node scripts/verify-placement.mjs --write");
  }
} else errs.push("guide missing");
if (errs.length) { console.error(errs.map((e) => "FAIL " + e).join("\n")); process.exit(1); }
console.log(`placement OK: ${files.length} files, ${rules.length} rules`);
