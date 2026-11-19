// Verifies config/replacement-registry.json against the real files.
//   node scripts/verify-placeholders.mjs            -> consistency checks (CI)
//   node scripts/verify-placeholders.mjs --go-live  -> also fails while ANY placeholder/simulation remains
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { registry, readJson, getPath, same, walk, isText, literalsOf, root, validateValue } from "./_registry-lib.mjs";
const goLive = process.argv.includes("--go-live");
const reg = registry(); const errs = []; const fail = (m) => errs.push(m);
const cache = {}; const json = (f) => (cache[f] ??= readJson(f));
const text = (f) => readFileSync(join(root, f), "utf8");

// 1. every config/literal entry matches the file; value passes its format rule
for (const e of reg.entries) {
  if (e.kind === "config") {
    if (!existsSync(join(root, e.file))) { fail(`${e.id}: file missing ${e.file}`); continue; }
    const actual = getPath(json(e.file), e.jsonPath);
    if (!same(actual, e.currentValue)) fail(`${e.id}: ${e.file} ${e.jsonPath} is ${JSON.stringify(actual)} but registry says ${JSON.stringify(e.currentValue)}`);
    if (!validateValue(e, actual)) fail(`${e.id}: value fails format '${e.format}'`);
  } else if (e.kind === "literal") {
    if (!text(e.file).includes(e.currentValue)) fail(`${e.id}: literal ${e.currentValue} not found in ${e.file}`);
  } else if (e.kind === "text-block") {
    if (!existsSync(join(root, e.file))) fail(`${e.id}: file missing ${e.file}`);
  } else if (e.kind !== "external") fail(`${e.id}: unknown kind`);
  if (e.kind === "external" && !e.whereSet) fail(`${e.id}: external entry needs whereSet`);
}
// 2. every leaf of the tenant config is registered or explicitly fixed
const C = "config/tenant.config.json";
const regPaths = new Set(reg.entries.filter((e) => e.file === C).map((e) => e.jsonPath));
const fixedPaths = new Set(reg.fixed.map((f) => f.jsonPath));
(function leaves(o, p) {
  for (const [k, v] of Object.entries(o)) {
    const path = p ? p + "." + k : k;
    if (regPaths.has(path) || fixedPaths.has(path)) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) leaves(v, path); else fail(`unregistered config leaf: ${path}`);
  }
})(json(C), "");
for (const p of [...regPaths, ...fixedPaths]) if (getPath(json(C), p) === undefined) fail(`registered path not in config: ${p}`);
if (text(C) !== JSON.stringify(json(C), null, 2) + "\n") fail(`${C} is not canonical (JSON.stringify 2-space); line numbers in the register would be wrong`);

// 3. no registered literal appears in an undeclared file (catches hard-coded copies)
const EXCL = (f) => f === "config/replacement-registry.json" || /(^|\/)tfw-values[^/]*\.json$/.test(f) || f.startsWith("docs/handover/") || f.startsWith("scripts/") || f.startsWith("tests/") || /(^|\/)README\.md$/.test(f) || !isText(f);
const files = walk().filter((f) => !EXCL(f));
for (const e of reg.entries) for (const lit of literalsOf(e)) {
  if (lit.length < 4) continue;
  for (const f of files) {
    if (f === e.file || e.alsoIn.includes(f)) continue;
    if (text(f).includes(lit)) fail(`${e.id}: literal '${lit}' appears in undeclared file ${f} (add to alsoIn or remove the hard-coded copy)`);
  }
  for (const f of e.alsoIn) if (!text(f).includes(lit)) fail(`${e.id}: alsoIn ${f} does not contain '${lit}' (stale declaration)`);
}
// 4. go-live gate
if (goLive) {
  const markers = ["example.invalid", "00000000-0000-0000-0000-", "@ORG/"];
  for (const f of walk().filter((f) => isText(f) && !f.startsWith("docs/") && !f.startsWith("scripts/") && !f.startsWith("tests/") && f !== "config/replacement-registry.json" && !/README\.md$/.test(f)))
    for (const m of markers) if (text(f).includes(m)) fail(`GO-LIVE: placeholder '${m}' still in ${f}`);
  for (const e of reg.entries.filter((x) => x.kind === "config" && x.options)) {
    const v = getPath(json(e.file), e.jsonPath);
    if (v === "simulated" || v === "draft-unreviewed") fail(`GO-LIVE: ${e.id} ${e.name} is still '${v}'`);
  }
  fail("GO-LIVE: identity.mode=entra requires the Entra adapter, which is not built in this version (apps/portal-api refuses to start)");
}
if (errs.length) { console.error(errs.map((e) => "FAIL " + e).join("\n")); console.error(`${errs.length} problem(s)`); process.exit(1); }
console.log(`registry OK: ${reg.entries.length} entries, ${files.length} files scanned${goLive ? ", go-live gate passed" : ""}`);
