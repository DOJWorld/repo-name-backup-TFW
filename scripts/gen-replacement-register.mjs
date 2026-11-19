// Generates docs/handover/TFW_REPLACEMENT_REGISTER.md from the registry and the REAL files (line numbers are computed, not typed).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { registry, readJson, lineMap, literalsOf, root } from "./_registry-lib.mjs";
const reg = registry();
const text = (f) => readFileSync(join(root, f), "utf8");
const canon = (f) => text(f) === JSON.stringify(readJson(f), null, 2) + "\n";
const maps = {};
function lineOfPath(e) {
  if (!canon(e.file)) throw new Error(`${e.file} is not canonical JSON; cannot compute line numbers`);
  const m = (maps[e.file] ??= lineMap(readJson(e.file)));
  const n = m[e.jsonPath]; const key = e.jsonPath.split(".").pop();
  if (!text(e.file).split("\n")[n - 1].includes(`"${key}"`)) throw new Error(`line map mismatch for ${e.id}`);
  return n;
}
const linesOf = (f, lit) => text(f).split("\n").flatMap((l, i) => (l.includes(lit) ? [i + 1] : []));
const show = (v) => (v === null || v === undefined ? "n/a" : "`" + (typeof v === "string" ? v : JSON.stringify(v)).replace(/\|/g, "\\|") + "`");
const row = (...c) => "| " + c.join(" | ") + " |";
let o = [];
o.push("# TfW Replacement Register", "",
  "> **Generated** by `node scripts/gen-replacement-register.mjs` from `config/replacement-registry.json` and the real files. Do not edit by hand. Line numbers are computed from the files as they are now. `node scripts/verify-placeholders.mjs` fails CI if this register and the code disagree.", "",
  "Everything below is a **working default** that lets the portal run today with synthetic data. TfW supplies or decides the real value; replace it in the place shown.", "",
  "## How to replace (safe method)", "",
  "1. Copy `config/tfw-values.example.json`, fill in only the IDs you have, save as `tfw-values.json` (never commit it if it holds anything sensitive).",
  "2. Preview: `node scripts/apply-tfw-values.mjs tfw-values.json` (changes nothing).",
  "3. Apply: `node scripts/apply-tfw-values.mjs tfw-values.json --write` (validates formats, edits files, re-syncs CSP hashes, regenerates this register, re-verifies).",
  "4. Before go-live: `node scripts/verify-placeholders.mjs --go-live` must pass. It lists every placeholder or simulation still present.", "",
  "## A. Values in the repository (machine-verified)", "",
  row("ID", "Name", "Current working value", "Where (file:line, JSON path)", "Also appears in", "Supplied by", "Format", "Effect / when to change"),
  row(...Array(8).fill("---")));
for (const e of reg.entries.filter((x) => x.kind === "config" || x.kind === "literal")) {
  let where, also = [];
  if (e.kind === "config") where = `\`${e.file}:${lineOfPath(e)}\` \`${e.jsonPath}\``;
  else where = `\`${e.file}:${linesOf(e.file, e.currentValue).join(",")}\` (literal)`;
  for (const f of e.alsoIn) for (const lit of literalsOf(e)) { const l = linesOf(f, lit); if (l.length) also.push(`\`${f}:${l.join(",")}\``); }
  if (e.kind === "literal") also.push("(replace every occurrence in the file)");
  o.push(row(e.id, e.name, show(e.currentValue), where, [...new Set(also)].join("<br>") || "none", e.providedBy, e.options ? e.options.join(" / ") : "`" + e.format + "`", `${e.effect}. ${e.whenToChange}.`.replace(/\|/g, "/")));
}
o.push("", "## B. Text to replace wholesale", "", row("ID", "Name", "File", "Supplied by", "What to do"), row(...Array(5).fill("---")));
for (const e of reg.entries.filter((x) => x.kind === "text-block")) o.push(row(e.id, e.name, `\`${e.file}\``, e.providedBy, e.whenToChange));
o.push("", "## C. Values set outside the repository (not machine-verifiable)", "", row("ID", "Name", "Where it is set", "Supplied by", "When / effect", "Secret?"), row(...Array(6).fill("---")));
for (const e of reg.entries.filter((x) => x.kind === "external")) o.push(row(e.id, e.name, e.whereSet, e.providedBy, `${e.whenToChange}. ${e.effect}.`, e.secret ? "**Yes**: never commit" : "No"));
o.push("", "## D. Fixed: do NOT change", "", row("File", "Path", "Why"), row("---", "---", "---"));
for (const f of reg.fixed) o.push(row(`\`${f.file}\``, `\`${f.jsonPath}\``, f.reason));
o.push("", "## E. Known work remaining before real TfW values can be used", "",
  "- **Entra ID adapter is not built.** Setting `identity.mode` to `entra` makes the API refuse to start. It needs OIDC authorisation-code + PKCE, JWT validation against the tenant JWKS, and group-to-role mapping from TFW-12.",
  "- **Live integrations are not built** (TfW systems, RISQS, Sentinel/CSCS). The `mode` switches exist; the adapters do not.",
  "- **Database is in-memory** (`apps/portal-api/src/store.js`); production needs the UK-resident database behind the same interface, with transactions or row locks.",
  "- **Audit log is in-memory**; production needs append-only UK-resident storage and a retention/deletion job (TFW-25).",
  "- **Welsh text is an unreviewed draft** (TFW-28 to TFW-30).",
  "- **Web UI is still the standalone simulation**; it is not yet calling the API.", "");
writeFileSync(join(root, "docs/handover/TFW_REPLACEMENT_REGISTER.md"), o.join("\n"));
console.log("wrote docs/handover/TFW_REPLACEMENT_REGISTER.md (" + reg.entries.length + " entries)");
