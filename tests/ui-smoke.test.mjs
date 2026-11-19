// Runs the REAL page script (web/index.html) against the REAL API, driving it through a minimal DOM stand-in.
// Covers whole journeys, English/Welsh switching and the hard-stop messages as a person would see them.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import net from "node:net";
import { createApp } from "../apps/portal-api/src/server.js";
import { loadConfig } from "../apps/portal-api/src/config.js";

const html = readFileSync("web/index.html", "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const PASS = randomBytes(12).toString("hex");
const stm = (f, ms) => { const x = setTimeout(f, ms); x.unref?.(); return x; };
const ENVV = { DATA_CLASSIFICATION: "synthetic", AUDIT_HMAC_KEY: randomBytes(32).toString("hex"), QR_SIGNING_KEY: randomBytes(32).toString("hex"), SIMULATED_USER_PASSWORD: PASS };
const cfg = loadConfig(); cfg.policy.rateLimitPerMinute = 5000; cfg.policy.loginRateLimitPerMinute = 100;
const app = createApp({ config: cfg, env: ENVV });
await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${app.server.address().port}`;
after(() => { app.server.closeAllConnections?.(); app.server.close(); });

class El {
  constructor(tag) { this.tag = tag; this.kids = []; this.attrs = {}; this.ls = {}; this.value = ""; this.className = ""; this.id = ""; }
  append(...c) { this.kids.push(...c); } replaceChildren(...c) { this.kids = c; }
  setAttribute(k, v) { this.attrs[k] = v; if (k === "id") this.id = v; if (k === "value") this.value = v; }
  addEventListener(e, f) { (this.ls[e] ??= []).push(f); }
}
const text = (e) => (typeof e === "string" ? e : e.kids.map(text).join(" "));
const all = (e, f, out = []) => { if (typeof e === "string") return out; if (f(e)) out.push(e); e.kids.forEach((k) => all(k, f, out)); return out; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function page({ path = "/", api = BASE } = {}) {
  const root = new El("div"); root.id = "app";
  const doc = { createElement: (t) => new El(t), createElementNS: (_n, t) => new El(t), getElementById: (id) => (id === "app" ? root : all(root, (e) => e.id === id)[0] || null),
    querySelector: (sel) => ({ content: sel.includes("warm-max") ? "2" : api }), documentElement: { lang: "" }, title: "" };
  const ctx = { document: doc, location: { pathname: path, origin: "https://portal.test" }, window: { print() {} }, navigator: { language: "en-GB" }, fetch, TextEncoder, console, Date, URL, AbortController, setTimeout: stm, clearTimeout };
  vm.runInNewContext(script, ctx);
  const p = {
    root, doc, text: () => text(root),
    async waitFor(s, ms = 4000) { const end = Date.now() + ms; while (Date.now() < end) { if (p.text().includes(s)) return; await sleep(15); } throw new Error(`timed out waiting for "${s}". Page says: ${p.text().slice(0, 600)}`); },
    async click(label) { const b = all(root, (e) => e.ls.click && text(e).trim() === label)[0]; assert.ok(b, `no button "${label}"`); await Promise.all(b.ls.click.map((f) => f({ target: b }))); },
    async set(id, v, fire = false) { const e = doc.getElementById(id); assert.ok(e, `no field ${id}`); e.value = v; if (fire) await Promise.all((e.ls.change || []).map((f) => f({ target: e }))); },
    async login(user) { await p.waitFor("Test account"); await p.set("f-user", user); await p.set("f-pass", PASS); await p.click("Sign in"); },
  };
  return p;
}

test("contractor requests, approver authorises, worker is refused then checks in and out", async () => {
  let a = page(); await a.login("alpha.admin"); await a.waitFor("All company checks are valid.");
  await a.click("Permits"); await a.waitFor("Request a permit"); await a.click("Request a permit"); await a.waitFor("Requested");
  let b = page(); await b.login("approver"); await b.waitFor("Authorise"); await b.click("Authorise"); await b.waitFor("Authorised");
  const w = page({ path: "/s/SITE-002" }); await w.login("alpha.w1");
  await w.waitFor("You opened the poster for Demo Junction South."); await w.click("Check in");
  await w.waitFor("No authorised permit-to-work."); assert.match(w.text(), /Nothing was changed\./);
  await w.click("Cymraeg"); assert.match(w.text(), /Dim trwydded i weithio wedi’i hawdurdodi\./);   // message re-translated, workflow kept
  await w.click("English");
  await w.set("f-site", "SITE-001", true); await w.click("Check in"); await w.waitFor("You are signed in. Stay safe.");
  assert.match(w.text(), /You are signed in at Demo Depot North since/);
  await w.click("Check out"); await w.waitFor("You are signed out.");
});

test("worker without induction is refused with the reason in the user's language", async () => {
  const w = page(); await w.login("alpha.w2"); await w.waitFor("Check in"); await w.click("Check in");
  await w.waitFor("No site induction is recorded."); await w.click("Cymraeg");
  assert.match(w.text(), /Nid oes cofnod o sefydlu ar y safle\./); assert.match(w.text(), /Adeiladwyd gan yr FST/);
});

test("safety officer approves RAMS and expires insurance; the contractor is then hard-stopped", async () => {
  const s = page(); await s.login("safety"); await s.waitFor("RAMS awaiting approval");
  await s.click("Approve"); await s.waitFor("Done.");
  await s.set("f-ins", "2020-01-01"); await s.click("Save"); await s.waitFor("Company insurance has expired.");
  const a = page(); await a.login("alpha.admin"); await a.waitFor("Company insurance has expired.");
  await a.click("Permits"); await a.waitFor("Request a permit"); await a.click("Request a permit");
  await a.waitFor("A compliance check refused this action."); assert.match(a.text(), /Company insurance has expired\./); assert.match(a.text(), /Nothing was changed\./);
});

test("auditor sees the chain is intact; site manager sees a QR poster; support sees no data", async () => {
  const u = page(); await u.login("auditor"); await u.waitFor("Audit log"); await u.click("Verify audit chain"); await u.waitFor("Audit chain is intact.");
  assert.match(u.text(), /permit\.request/);
  const m = page(); await m.login("sitemgr"); await m.waitFor("Printable QR poster");
  const svg = all(m.root, (e) => e.tag === "svg")[0]; assert.ok(svg); assert.equal(svg.attrs["aria-label"], "https://portal.test/s/SITE-001");
  assert.ok(all(svg, (e) => e.tag === "path")[0].attrs.d.length > 200); assert.match(m.text(), /Print poster/);
  const sp = page(); await sp.login("support"); await sp.waitFor("support staff cannot see data");
});

test("network failure is reported and never treated as success", async () => {
  const n = page({ api: "http://127.0.0.1:1" }); await n.login("alpha.w1");
  await n.waitFor("Cannot reach the server.", 8000); assert.match(n.text(), /Nothing was changed\./);
});

test("wrong password is refused; Welsh/English label parity; every used key exists", async () => {
  const n = page(); await n.waitFor("Test account"); await n.set("f-user", "alpha.w1"); await n.set("f-pass", "wrong-password"); await n.click("Sign in");
  await n.waitFor("Incorrect username or password.");
  const P = new Function("return " + script.match(/const P=(\{[\s\S]*?\n\});\nconst S=/)[1])();
  for (const [k, v] of Object.entries(P)) { assert.equal(v.length, 2, k); assert.ok(v[0].trim() && v[1].trim(), k); }
  const used = [...script.matchAll(/\bt\("([A-Za-z_]+)"\)/g)].map((m) => m[1]);
  for (const k of used) assert.ok(P[k], "missing key " + k);
  for (const [pre, list] of [["r_", ["worker", "contractor_admin", "permit_approver", "safety_officer", "site_manager", "tfw_admin", "auditor", "support"]], ["n_", ["checkin", "company", "permits", "safety", "rollcall", "audit", "none"]], ["p_", ["requested", "authorised", "revoked"]], ["m_", ["submitted", "approved"]], ["v_", ["valid", "invalid", "suspended"]]])
    for (const x of list) assert.ok(P[pre + x], "missing key " + pre + x);
});

test("the screen draws immediately even if the engine never answers (sleeping server)", async () => {
  const sockets = []; const hung = net.createServer((s) => { sockets.push(s); }); await new Promise((r) => hung.listen(0, "127.0.0.1", r));
  const n = page({ api: `http://127.0.0.1:${hung.address().port}` });
  const t0 = Date.now(); await n.waitFor("Test account", 1500); assert.ok(Date.now() - t0 < 1500);
  assert.match(n.text(), /Built by the FST/);
  sockets.forEach((s) => s.destroy()); hung.close();
});

test("free-tier cold start: page shows a waking status, then signs in by itself when the engine comes up", async () => {
  const probe = net.createServer(); await new Promise((r) => probe.listen(0, "127.0.0.1", r)); const port = probe.address().port; await new Promise((r) => probe.close(r));
  const n = page({ api: `http://127.0.0.1:${port}` });
  await n.waitFor("Waking the test server", 1500);                       // visible at once, never blank
  await n.set("f-user", "alpha.w1"); await n.set("f-pass", PASS);
  const clicked = n.click("Sign in");                                    // pressed while the engine is still asleep
  const late = createApp({ config: cfg, env: ENVV });
  await sleep(600); await new Promise((r) => late.server.listen(port, "127.0.0.1", r));   // engine wakes up
  try { await clicked; await n.waitFor("Check in", 8000); assert.match(n.text(), /Built by the FST/); }
  finally { late.server.closeAllConnections?.(); late.server.close(); }
});
