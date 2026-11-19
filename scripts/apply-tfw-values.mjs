// Applies TfW-supplied values safely.  node scripts/apply-tfw-values.mjs <values.json> [--write]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { registry, readJson, getPath, setPath, same, validateValue, root } from "./_registry-lib.mjs";
const [, , vf, ...flags] = process.argv; const write = flags.includes("--write");
if (!vf) { console.error("usage: node scripts/apply-tfw-values.mjs <values.json> [--write]"); process.exit(2); }
const vals = JSON.parse(readFileSync(vf, "utf8")); const reg = registry(); const errs = []; const plan = [];
const rd = (f) => readFileSync(join(root, f), "utf8");
const jsonCache = {}, textCache = {};
for (const [id, nv] of Object.entries(vals)) {
  if (id.startsWith("_")) continue;
  const e = reg.entries.find((x) => x.id === id);
  if (!e) { errs.push(`${id}: unknown ID`); continue; }
  if (!["config", "literal"].includes(e.kind)) { errs.push(`${id}: '${e.name}' is ${e.kind}; set it where the register says (${e.whereSet || e.file})`); continue; }
  if (!validateValue(e, nv)) { errs.push(`${id}: value ${JSON.stringify(nv)} fails format '${e.format}'`); continue; }
  if (same(nv, e.currentValue)) continue;
  plan.push({ e, old: e.currentValue, nv });
}
if (errs.length) { console.error(errs.map((x) => "REJECTED " + x).join("\n")); process.exit(1); }
for (const { e, old, nv } of plan) {
  console.log(`${e.id} ${e.name}: ${JSON.stringify(old)} -> ${JSON.stringify(nv)}`);
  if (e.kind === "config") { (jsonCache[e.file] ??= readJson(e.file)); setPath(jsonCache[e.file], e.jsonPath, nv); }
  const literal = e.kind === "literal" || (e.scanLiteral && typeof old === "string");
  const files = e.kind === "literal" ? [e.file] : e.alsoIn;
  if (literal) for (const f of files) { const t = (textCache[f] ??= rd(f)); if (!t.includes(old)) errs.push(`${e.id}: '${old}' not found in ${f}`); textCache[f] = t.split(old).join(nv); }
  e.currentValue = nv;
}
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
if (!write) { console.log(`\n${plan.length} change(s) planned. Re-run with --write to apply.`); process.exit(0); }
for (const [f, o] of Object.entries(jsonCache)) writeFileSync(join(root, f), JSON.stringify(o, null, 2) + "\n");
for (const [f, t] of Object.entries(textCache)) writeFileSync(join(root, f), t);
writeFileSync(join(root, "config/replacement-registry.json"), JSON.stringify(reg, null, 2) + "\n");
const run = (...a) => execFileSync(process.execPath, a, { cwd: root, stdio: "inherit" });
if (Object.keys(textCache).includes("web/index.html") || Object.keys(textCache).includes("netlify.toml") || plan.length) run("scripts/sync-csp.mjs");
run("scripts/gen-replacement-register.mjs");
run("scripts/verify-placeholders.mjs");
console.log("applied and verified");
