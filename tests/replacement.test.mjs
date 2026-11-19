import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, writeFileSync, readFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const SRC = process.cwd();
const scratch = () => {
  const d = mkdtempSync(join(tmpdir(), "tfw-"));
  cpSync(SRC, d, { recursive: true, filter: (s) => !/node_modules|\.git$|\.tar\.gz$/.test(s) });
  return d;
};
const run = (cwd, script, ...args) => spawnSync(process.execPath, [join("scripts", script), ...args], { cwd, encoding: "utf8" });

test("registry verifies on the shipped repo", () => {
  const r = run(SRC, "verify-placeholders.mjs");
  assert.equal(r.status, 0, r.stderr);
});

test("generated register is current (no hand drift)", () => {
  const d = scratch();
  const before = readFileSync(join(d, "docs/handover/TFW_REPLACEMENT_REGISTER.md"), "utf8");
  assert.equal(run(d, "gen-replacement-register.mjs").status, 0);
  assert.equal(readFileSync(join(d, "docs/handover/TFW_REPLACEMENT_REGISTER.md"), "utf8"), before);
});

test("dry run changes nothing; --write applies, re-verifies, and API still boots config", () => {
  const d = scratch();
  const vals = join(d, "tfw-values.json");
  writeFileSync(vals, JSON.stringify({ "TFW-06": "https://portal.sample-tfw.test", "TFW-03": "helpdesk@sample-tfw.test", "TFW-01": "TfW Contractor Safety Portal", "TFW-04": "sec@sample-tfw.test", "TFW-21": 90, "TFW-07": "https://api.sample-tfw.test", "TFW-41": "Built by Sample Team", "TFW-26": [{ code: "CDF-001", name: "Cardiff Depot" }] }));
  const cfgBefore = readFileSync(join(d, "config/tenant.config.json"), "utf8");
  assert.equal(run(d, "apply-tfw-values.mjs", vals).status, 0);
  assert.equal(readFileSync(join(d, "config/tenant.config.json"), "utf8"), cfgBefore);
  const w = run(d, "apply-tfw-values.mjs", vals, "--write");
  assert.equal(w.status, 0, w.stdout + w.stderr);
  const cfg = JSON.parse(readFileSync(join(d, "config/tenant.config.json"), "utf8"));
  assert.equal(cfg.urls.portalBaseUrl, "https://portal.sample-tfw.test");
  assert.equal(cfg.policy.qrChallengeTtlSeconds, 90);
  assert.match(readFileSync(join(d, "SECURITY.md"), "utf8"), /sec@sample-tfw\.test/);
  assert.match(readFileSync(join(d, "web/index.html"), "utf8"), /TfW Contractor Safety Portal/);
  const pg = readFileSync(join(d, "web/index.html"), "utf8"), nt = readFileSync(join(d, "netlify.toml"), "utf8");
  assert.match(pg, /name="api-base" content="https:\/\/api\.sample-tfw\.test"/); assert.match(pg, /connect-src https:\/\/api\.sample-tfw\.test;/);
  assert.match(nt, /connect-src https:\/\/api\.sample-tfw\.test;/); assert.match(pg, /Built by Sample Team/);
  assert.equal(run(d, "verify-placeholders.mjs").status, 0);
  assert.equal(run(d, "sync-csp.mjs", "--check").status, 0);
  assert.equal(run(d, "preview-safety-check.mjs").status, 0);
  const api = spawnSync(process.execPath, ["--input-type=module", "-e", "import('./apps/portal-api/src/config.js').then(m=>{m.loadConfig('config/tenant.config.json');console.log('config-ok')})"], { cwd: d, encoding: "utf8" });
  assert.match(api.stdout, /config-ok/, api.stderr);
});

test("bad values, unknown IDs and external-only IDs are rejected before any write", () => {
  const d = scratch();
  const cases = [{ "TFW-06": "http://insecure.test" }, { "TFW-06": "https://x.test/path" }, { "TFW-10": "not-a-guid" }, { "TFW-21": 5000 }, { "TFW-09": "live" },
    { "TFW-99": "x" }, { "TFW-31": "secret-value" }, { "TFW-12": { a: "tfw_admin" } }, { "TFW-26": [{ code: "bad code", name: "x" }] }, { "TFW-27": "ORG/" }];
  for (const c of cases) {
    const f = join(d, "tfw-values.json"); writeFileSync(f, JSON.stringify(c));
    const r = run(d, "apply-tfw-values.mjs", f, "--write");
    assert.equal(r.status, 1, JSON.stringify(c));
    assert.match(r.stderr, /REJECTED/);
  }
  assert.equal(run(d, "verify-placeholders.mjs").status, 0);
});

test("verifier catches a hard-coded copy, an unregistered config leaf, and registry drift", () => {
  let d = scratch();
  appendFileSync(join(d, "render.yaml"), "# https://portal.example.invalid\n");
  let r = run(d, "verify-placeholders.mjs");
  assert.equal(r.status, 1); assert.match(r.stderr, /undeclared file render\.yaml/);
  d = scratch();
  const c = JSON.parse(readFileSync(join(d, "config/tenant.config.json"), "utf8")); c.branding.newThing = "x";
  writeFileSync(join(d, "config/tenant.config.json"), JSON.stringify(c, null, 2) + "\n");
  r = run(d, "verify-placeholders.mjs");
  assert.equal(r.status, 1); assert.match(r.stderr, /unregistered config leaf: branding\.newThing/);
  d = scratch();
  const c2 = JSON.parse(readFileSync(join(d, "config/tenant.config.json"), "utf8")); c2.urls.apiBaseUrl = "https://api.other.test";
  writeFileSync(join(d, "config/tenant.config.json"), JSON.stringify(c2, null, 2) + "\n");
  r = run(d, "verify-placeholders.mjs");
  assert.equal(r.status, 1); assert.match(r.stderr, /TFW-07/);
});

test("go-live gate fails while placeholders or simulation remain, and names them", () => {
  const r = run(SRC, "verify-placeholders.mjs", "--go-live");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /GO-LIVE: placeholder 'example\.invalid'/);
  assert.match(r.stderr, /GO-LIVE: TFW-09/);
  assert.match(r.stderr, /GO-LIVE: TFW-28/);
  assert.match(r.stderr, /@ORG\//);
});

test("Windows line endings (CRLF) do not break the security hash check", () => {
  const d = scratch();
  const f = join(d, "web/index.html");
  writeFileSync(f, readFileSync(f, "utf8").replace(/\n/g, "\r\n"));
  const nt = join(d, "netlify.toml"); writeFileSync(nt, readFileSync(nt, "utf8").replace(/\n/g, "\r\n"));
  assert.equal(run(d, "sync-csp.mjs", "--check").status, 0);
});

test("make-secrets prints two different 64-character keys and a 24-character password, and writes no files", () => {
  const r = run(SRC, "make-secrets.mjs"); assert.equal(r.status, 0);
  const g = (n) => new RegExp("^" + n + "=([0-9a-f]+)$", "m").exec(r.stdout)[1];
  assert.equal(g("AUDIT_HMAC_KEY").length, 64); assert.equal(g("QR_SIGNING_KEY").length, 64); assert.equal(g("SIMULATED_USER_PASSWORD").length, 24);
  assert.notEqual(g("AUDIT_HMAC_KEY"), g("QR_SIGNING_KEY"));
  assert.notEqual(run(SRC, "make-secrets.mjs").stdout, r.stdout);
});
