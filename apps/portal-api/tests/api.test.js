import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createApp } from '../src/server.js';
import { loadConfig } from '../src/config.js';
import { verifyChain } from '../src/audit.js';
import { LOCALES, missingKeys } from '../src/i18n.js';

const cfg = loadConfig();
const [S1, S2] = cfg.sites.map((s) => s.code);
const PASS = randomBytes(12).toString('hex');
const ENV = { DATA_CLASSIFICATION: 'synthetic', AWS_REGION: 'eu-west-2', AUDIT_HMAC_KEY: randomBytes(32).toString('hex'), QR_SIGNING_KEY: randomBytes(32).toString('hex'), SIMULATED_USER_PASSWORD: PASS };
const START = Date.UTC(2026, 10, 16, 12, 0, 0);
const opened = [];
after(() => { for (const a of opened) { a.server.closeAllConnections?.(); a.server.close(); } });

async function boot(opts = {}) {
  let T = START;
  const app = createApp({ config: opts.config || loadConfig(), env: { ...ENV, ...(opts.env || {}) }, clock: () => T });
  opened.push(app);
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const tokens = {};
  const call = async (method, path, { token, body, headers = {}, raw } = {}) => {
    const h = { ...headers };
    if (token) h.authorization = 'Bearer ' + token;
    if (body !== undefined && !h['content-type']) h['content-type'] = 'application/json';
    const r = await fetch(base + path, { method, headers: h, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
    const text = await r.text();
    return { status: r.status, headers: r.headers, json: text ? JSON.parse(text) : null };
  };
  const login = async (u) => {
    if (!tokens[u]) { const r = await call('POST', '/auth/login', { body: { username: u, password: PASS } }); assert.equal(r.status, 200); tokens[u] = r.json.data.token; }
    return tokens[u];
  };
  const as = async (u, method, path, body, extra = {}) => call(method, path, { token: await login(u), body, ...extra });
  return { app, call, as, login, tokens, advance: (ms) => { T += ms; }, close: () => new Promise((r) => { app.server.closeAllConnections?.(); app.server.close(r); }) };
}
const lastAudit = (app) => app.audit.entries().at(-1);
async function authorisedPermit(c, siteCode = S1) {
  const p = await c.as('alpha.admin', 'POST', '/permits', { contractorId: 'c_alpha', siteCode, leadWorkerId: 'w_a1', ramsId: 'r_alpha_1' });
  assert.equal(p.status, 201);
  const a = await c.as('approver', 'POST', `/permits/${p.json.data.id}/authorise`, {});
  assert.equal(a.status, 200);
  return p.json.data.id;
}
const challenge = async (c, user = 'alpha.w1', siteCode = S1) => (await c.as(user, 'POST', '/checkins/challenge', { siteCode })).json.data.challenge;

test('health + security headers + simulation flag', async () => {
  const c = await boot();
  const r = await c.call('GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.match(r.headers.get('strict-transport-security'), /max-age/);
  assert.equal(r.headers.get('x-integration-mode'), 'simulated');
  assert.ok(r.headers.get('x-correlation-id'));
  await c.close();
});

test('unauthenticated, wrong role, and direct-API bypass are rejected and audited', async () => {
  const c = await boot();
  const r1 = await c.call('GET', '/me');
  assert.equal(r1.status, 401);
  assert.equal(lastAudit(c.app).reason, 'UNAUTHENTICATED');
  const r2 = await c.as('alpha.w1', 'POST', '/permits', { contractorId: 'c_alpha', siteCode: S1, leadWorkerId: 'w_a1', ramsId: 'r_alpha_1' });
  assert.equal(r2.status, 403);
  assert.equal(lastAudit(c.app).action, 'authz.denied');
  const r3 = await c.as('alpha.admin', 'POST', '/permits/prm_x/authorise', {});
  assert.equal(r3.status, 403);
  const r4 = await c.as('alpha.w1', 'PATCH', '/workers/w_a1/credentials', { sentinelExpiry: '2099-01-01' });
  assert.equal(r4.status, 403);
  assert.equal(c.app.store.permits.size, 0);
  await c.close();
});

test('IDOR: contractor cannot read or act on another contractor (404, no leak)', async () => {
  const c = await boot();
  assert.equal((await c.as('alpha.admin', 'GET', '/contractors/c_beta/compliance')).status, 404);
  assert.equal((await c.as('alpha.admin', 'POST', '/permits', { contractorId: 'c_beta', siteCode: S1, leadWorkerId: 'w_b1', ramsId: 'r_beta_1' })).status, 404);
  const own = await c.as('alpha.admin', 'GET', '/contractors/c_alpha/compliance');
  assert.equal(own.status, 200);
  assert.deepEqual(own.json.data.companyReasons, []);
  await c.close();
});

test('hard-stop: expired insurance blocks permit; no state change; audit has matching correlation ID', async () => {
  const c = await boot();
  assert.equal((await c.as('safety', 'PATCH', '/contractors/c_alpha/credentials', { insuranceExpiry: '2026-11-15' })).status, 200);
  const r = await c.as('alpha.admin', 'POST', '/permits', { contractorId: 'c_alpha', siteCode: S1, leadWorkerId: 'w_a1', ramsId: 'r_alpha_1' });
  assert.equal(r.status, 403);
  assert.equal(r.json.error.code, 'COMPLIANCE_DENIED');
  assert.equal(r.json.error.reasons[0].code, 'INSURANCE_EXPIRED');
  assert.equal(c.app.store.permits.size, 0);
  const a = lastAudit(c.app);
  assert.equal(a.outcome, 'denied');
  assert.equal(a.cid, r.json.error.correlationId);
  assert.equal(a.cid, r.headers.get('x-correlation-id'));
  await c.close();
});

test('expiry semantics: valid through end of expiry day UTC, invalid the next day', async () => {
  const c = await boot();
  await c.as('safety', 'PATCH', '/contractors/c_alpha/credentials', { insuranceExpiry: '2026-11-16' });
  assert.equal((await c.as('alpha.admin', 'POST', '/permits', { contractorId: 'c_alpha', siteCode: S1, leadWorkerId: 'w_a1', ramsId: 'r_alpha_1' })).status, 201);
  c.advance(13 * 3600 * 1000);
  for (const k of Object.keys(c.tokens)) delete c.tokens[k];
  const r = await c.as('alpha.admin', 'POST', '/permits', { contractorId: 'c_alpha', siteCode: S1, leadWorkerId: 'w_a1', ramsId: 'r_alpha_1' });
  assert.equal(r.status, 403);
  assert.equal(r.json.error.reasons[0].code, 'INSURANCE_EXPIRED');
  await c.close();
});

test('hard-stop: RISQS invalid, induction missing, RAMS not approved', async () => {
  const c = await boot();
  await c.as('safety', 'PATCH', '/contractors/c_alpha/credentials', { risqsStatus: 'suspended' });
  let r = await c.as('alpha.admin', 'POST', '/permits', { contractorId: 'c_alpha', siteCode: S1, leadWorkerId: 'w_a1', ramsId: 'r_alpha_1' });
  assert.equal(r.json.error.reasons[0].code, 'RISQS_INVALID');
  await c.as('safety', 'PATCH', '/contractors/c_alpha/credentials', { risqsStatus: 'valid' });
  r = await c.as('alpha.admin', 'POST', '/permits', { contractorId: 'c_alpha', siteCode: S1, leadWorkerId: 'w_a2', ramsId: 'r_alpha_1' });
  assert.equal(r.json.error.reasons[0].code, 'INDUCTION_MISSING');
  r = await c.as('beta.admin', 'POST', '/permits', { contractorId: 'c_beta', siteCode: S1, leadWorkerId: 'w_b1', ramsId: 'r_beta_1' });
  assert.equal(r.json.error.reasons[0].code, 'RAMS_NOT_APPROVED');
  assert.equal(c.app.store.permits.size, 0);
  await c.close();
});

test('safety chain: RAMS approval unlocks the permit; full happy path with roll call and checkout', async () => {
  const c = await boot();
  assert.equal((await c.as('safety', 'POST', '/rams/r_beta_1/approve', {})).status, 200);
  const pid = (await c.as('beta.admin', 'POST', '/permits', { contractorId: 'c_beta', siteCode: S1, leadWorkerId: 'w_b1', ramsId: 'r_beta_1' })).json.data.id;
  assert.equal((await c.as('approver', 'POST', `/permits/${pid}/authorise`, {})).status, 200);
  const ch = await challenge(c, 'beta.w1');
  const ci = await c.as('beta.w1', 'POST', '/checkins', { challenge: ch });
  assert.equal(ci.status, 201);
  const rc = await c.as('sitemgr', 'GET', `/rollcall/${S1}`);
  assert.equal(rc.json.data.count, 1);
  assert.equal((await c.as('beta.w1', 'POST', '/checkouts', { siteCode: S1 })).status, 200);
  assert.equal((await c.as('sitemgr', 'GET', `/rollcall/${S1}`)).json.data.count, 0);
  assert.equal((await c.as('beta.w1', 'POST', '/checkouts', { siteCode: S1 })).json.error.code, 'NOT_CHECKED_IN');
  await c.close();
});

test('check-in is refused without an authorised permit, after revocation, and on expired cards', async () => {
  const c = await boot();
  let r = await c.as('alpha.w1', 'POST', '/checkins/challenge', { siteCode: S1 });
  assert.equal(r.status, 403);
  assert.equal(r.json.error.reasons[0].code, 'PERMIT_NOT_AUTHORISED');
  const pid = await authorisedPermit(c);
  assert.equal((await c.as('alpha.w1', 'POST', '/checkins/challenge', { siteCode: S1 })).status, 200);
  await c.as('safety', 'PATCH', '/workers/w_a1/credentials', { cscsExpiry: '2026-11-01' });
  r = await c.as('alpha.w1', 'POST', '/checkins/challenge', { siteCode: S1 });
  assert.equal(r.json.error.reasons[0].code, 'CSCS_EXPIRED');
  await c.as('safety', 'PATCH', '/workers/w_a1/credentials', { cscsExpiry: '2027-01-01', sentinelExpiry: '2026-10-01' });
  assert.equal((await c.as('alpha.w1', 'POST', '/checkins/challenge', { siteCode: S1 })).json.error.reasons[0].code, 'SENTINEL_EXPIRED');
  await c.as('safety', 'PATCH', '/workers/w_a1/credentials', { sentinelExpiry: '2027-01-01' });
  assert.equal((await c.as('approver', 'POST', `/permits/${pid}/revoke`, {})).status, 200);
  r = await c.as('alpha.w1', 'POST', '/checkins/challenge', { siteCode: S1 });
  assert.equal(r.json.error.reasons[0].code, 'PERMIT_REVOKED');
  assert.equal(c.app.store.attendance.length, 0);
  await c.close();
});

test('credential that expires between challenge and commit is refused at execution', async () => {
  const c = await boot();
  await authorisedPermit(c);
  const ch = await challenge(c);
  await c.as('safety', 'PATCH', '/workers/w_a1/credentials', { sentinelExpiry: '2026-11-15' });
  const r = await c.as('alpha.w1', 'POST', '/checkins', { challenge: ch });
  assert.equal(r.status, 403);
  assert.equal(r.json.error.reasons[0].code, 'SENTINEL_EXPIRED');
  assert.equal(c.app.store.attendance.length, 0);
  await c.close();
});

test('QR: replay, tamper, theft by another worker, expiry', async () => {
  const c = await boot();
  await authorisedPermit(c);
  const ch = await challenge(c);
  assert.equal((await c.as('alpha.w1', 'POST', '/checkins', { challenge: ch })).status, 201);
  await c.as('alpha.w1', 'POST', '/checkouts', { siteCode: S1 });
  const rep = await c.as('alpha.w1', 'POST', '/checkins', { challenge: ch });
  assert.equal(rep.status, 409);
  assert.equal(rep.json.error.code, 'QR_REPLAY');
  const ch2 = await challenge(c);
  const tampered = ch2.slice(0, -1) + (ch2.endsWith('0') ? '1' : '0');
  assert.equal((await c.as('alpha.w1', 'POST', '/checkins', { challenge: tampered })).json.error.code, 'QR_INVALID');
  assert.equal((await c.as('beta.w1', 'POST', '/checkins', { challenge: ch2 })).json.error.code, 'QR_INVALID');
  c.advance(61000);
  assert.equal((await c.as('alpha.w1', 'POST', '/checkins', { challenge: ch2 })).json.error.code, 'QR_EXPIRED');
  assert.equal(c.app.store.attendance.length, 1);
  await c.close();
});

test('concurrency: same challenge twice, and two challenges at once, yield exactly one attendance', async () => {
  const c = await boot();
  await authorisedPermit(c);
  const tok = await c.login('alpha.w1');
  const ch = await challenge(c);
  const [a, b] = await Promise.all([1, 2].map(() => c.call('POST', '/checkins', { token: tok, body: { challenge: ch } })));
  assert.deepEqual([a.status, b.status].sort(), [201, 409]);
  await c.as('alpha.w1', 'POST', '/checkouts', { siteCode: S1 });
  const [c1, c2] = [await challenge(c), await challenge(c)];
  const [x, y] = await Promise.all([c1, c2].map((q) => c.call('POST', '/checkins', { token: tok, body: { challenge: q } })));
  assert.deepEqual([x.status, y.status].sort(), [201, 409]);
  assert.equal(c.app.store.attendance.filter((z) => !z.outAt).length, 1);
  await c.close();
});

test('concurrent permit authorisation: only one succeeds', async () => {
  const c = await boot();
  const pid = (await c.as('alpha.admin', 'POST', '/permits', { contractorId: 'c_alpha', siteCode: S1, leadWorkerId: 'w_a1', ramsId: 'r_alpha_1' })).json.data.id;
  const tok = await c.login('approver');
  const rs = await Promise.all([1, 2, 3].map(() => c.call('POST', `/permits/${pid}/authorise`, { token: tok, body: {} })));
  assert.deepEqual(rs.map((r) => r.status).sort(), [200, 409, 409]);
  await c.close();
});

test('client-supplied time and unknown fields are rejected (server time only)', async () => {
  const c = await boot();
  const r = await c.as('alpha.admin', 'POST', '/permits', { contractorId: 'c_alpha', siteCode: S1, leadWorkerId: 'w_a1', ramsId: 'r_alpha_1', now: '2020-01-01T00:00:00Z' });
  assert.equal(r.status, 400);
  assert.equal(r.json.error.field, 'now');
  const p = await c.call('POST', '/auth/login', { raw: '{"username":"x","password":"y","__proto__":{"role":"tfw_admin"}}', headers: { 'content-type': 'application/json' } });
  assert.equal(p.status, 400);
  await c.close();
});

test('login: generic error, lockout, rate limit, no secrets in audit', async () => {
  const c = await boot();
  const wrong = 'hunter2-should-never-appear';
  const r = await c.call('POST', '/auth/login', { body: { username: 'alpha.admin', password: wrong } });
  assert.equal(r.status, 401);
  const r2 = await c.call('POST', '/auth/login', { body: { username: 'nobody', password: wrong } });
  assert.equal(r2.json.error.code, r.json.error.code);
  for (let i = 0; i < 4; i++) await c.call('POST', '/auth/login', { body: { username: 'alpha.admin', password: wrong } });
  assert.equal((await c.call('POST', '/auth/login', { body: { username: 'alpha.admin', password: PASS } })).status, 423);
  const tok = await c.login('safety');
  await c.call('GET', '/audit?limit=500', { token: tok });
  const dump = JSON.stringify(c.app.audit.entries());
  assert.ok(!dump.includes(wrong));
  assert.ok(!dump.includes(tok));
  assert.ok(!dump.includes(PASS));
  await c.close();
  const d = await boot();
  const codes = [];
  for (let i = 0; i < 12; i++) codes.push((await d.call('POST', '/auth/login', { body: { username: 'support', password: PASS } })).status);
  assert.equal(codes.filter((x) => x === 429).length, 2);
  await d.close();
});

test('session idle timeout and logout', async () => {
  const c = await boot();
  const tok = await c.login('safety');
  assert.equal((await c.call('GET', '/me', { token: tok })).status, 200);
  await c.call('POST', '/auth/logout', { token: tok, body: {} });
  assert.equal((await c.call('GET', '/me', { token: tok })).status, 401);
  const d = await boot();
  const t2 = await d.login('safety');
  d.advance(31 * 60000);
  assert.equal((await d.call('GET', '/me', { token: t2 })).status, 401);
  await c.close(); await d.close();
});

test('audit chain verifies; tampering with a copy is detected; only audit roles may read', async () => {
  const c = await boot();
  await authorisedPermit(c);
  assert.equal((await c.as('alpha.admin', 'GET', '/audit')).status, 403);
  const v = await c.as('auditor', 'GET', '/audit/verify');
  assert.equal(v.json.data.ok, true);
  const copy = c.app.audit.entries();
  copy[1] = { ...copy[1], outcome: copy[1].outcome === 'allowed' ? 'denied' : 'allowed' };
  assert.deepEqual(verifyChain(copy, c.app.auditKey), { ok: false, brokenAt: 2 });
  const del = c.app.audit.entries(); del.splice(1, 1);
  assert.equal(verifyChain(del, c.app.auditKey).ok, false);
  await c.close();
});

test('body limits, content type, CORS allow-list', async () => {
  const c = await boot();
  const big = await c.call('POST', '/auth/login', { raw: JSON.stringify({ username: 'a'.repeat(20000), password: 'b' }), headers: { 'content-type': 'application/json' } }).catch((e) => ({ status: 'reset', e }));
  assert.ok(big.status === 413 || big.status === 'reset');
  const mt = await c.call('POST', '/auth/login', { raw: 'x', headers: { 'content-type': 'text/plain' } });
  assert.equal(mt.status, 415);
  const ok = await c.call('GET', '/health', { headers: { origin: cfg.urls.portalBaseUrl } });
  assert.equal(ok.headers.get('access-control-allow-origin'), cfg.urls.portalBaseUrl);
  const bad = await c.call('GET', '/health', { headers: { origin: 'https://evil.example' } });
  assert.equal(bad.headers.get('access-control-allow-origin'), null);
  assert.equal((await c.call('OPTIONS', '/permits', { headers: { origin: 'https://evil.example' } })).status, 403);
  await c.close();
});

test('English/Welsh: localised errors and reason codes; key parity', async () => {
  const c = await boot();
  const en = await c.call('GET', '/me');
  const cy = await c.call('GET', '/me?lang=cy');
  assert.equal(en.json.error.message, LOCALES.en.UNAUTHENTICATED);
  assert.equal(cy.json.error.message, LOCALES.cy.UNAUTHENTICATED);
  assert.notEqual(en.json.error.message, cy.json.error.message);
  const acc = await c.call('GET', '/me', { headers: { 'accept-language': 'cy-GB,cy;q=0.9' } });
  assert.equal(acc.json.error.message, LOCALES.cy.UNAUTHENTICATED);
  assert.deepEqual(missingKeys(), { missingInCy: [], orphanInCy: [] });
  await c.close();
});

test('startup guards: real data needs eu-west-2 + live identity; secrets required; entra adapter not built', () => {
  const mk = (env, config) => () => createApp({ config: config || loadConfig(), env: { ...ENV, ...env } });
  assert.throws(mk({ DATA_CLASSIFICATION: 'real', AWS_REGION: 'us-east-1' }), /RESIDENCY_GUARD/);
  assert.throws(mk({ DATA_CLASSIFICATION: 'real', AWS_REGION: 'eu-west-2' }), /REAL_DATA_WITH_SIMULATED_IDENTITY/);
  assert.throws(mk({ AUDIT_HMAC_KEY: 'short' }), /AUDIT_HMAC_KEY/);
  assert.throws(mk({ SIMULATED_USER_PASSWORD: '' }), /SIMULATED_USER_PASSWORD/);
  const c = loadConfig(); c.identity.mode = 'entra';
  assert.throws(mk({}, c), /IDENTITY_MODE_NOT_IMPLEMENTED/);
});

test('directory and list endpoints are scoped per role and tenant', async () => {
  const c = await boot();
  assert.equal((await c.call('GET', '/sites')).status, 401);
  assert.equal((await c.as('alpha.w1', 'GET', '/sites')).json.data.length, cfg.sites.length);
  assert.deepEqual((await c.as('alpha.admin', 'GET', '/contractors')).json.data.map((x) => x.id), ['c_alpha']);
  assert.equal((await c.as('safety', 'GET', '/contractors')).json.data.length, 2);
  assert.equal((await c.as('alpha.admin', 'GET', '/contractors/c_beta/workers')).status, 404);
  assert.equal((await c.as('alpha.admin', 'GET', '/contractors/c_alpha/workers')).json.data.length, 2);
  assert.equal((await c.as('alpha.w1', 'GET', '/permits')).status, 403);
  assert.equal((await c.as('alpha.w1', 'GET', '/contractors')).status, 403);
  await authorisedPermit(c);
  assert.equal((await c.as('alpha.admin', 'GET', '/permits')).json.data.length, 1);
  assert.equal((await c.as('beta.admin', 'GET', '/permits')).json.data.length, 0);
  assert.equal((await c.as('approver', 'GET', '/permits')).json.data.length, 1);
  assert.deepEqual((await c.as('beta.admin', 'GET', '/rams')).json.data.map((x) => x.contractorId), ['c_beta']);
  assert.equal((await c.as('alpha.w1', 'GET', '/checkins/me')).json.data.present, null);
  await c.as('alpha.w1', 'POST', '/checkins', { challenge: await challenge(c) });
  assert.equal((await c.as('alpha.w1', 'GET', '/checkins/me')).json.data.present.siteCode, S1);
  await c.close();
});

test('public /i18n serves both languages with identical keys and no metadata', async () => {
  const c = await boot();
  const r = await c.call('GET', '/i18n');
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(r.json.data.en).sort(), Object.keys(r.json.data.cy).sort());
  assert.ok(!('_meta' in r.json.data.en));
  await c.close();
});

test('EXTRA_ALLOWED_ORIGINS adds exact https origins only; wildcards and junk are refused at startup', async () => {
  const c = await boot({ env: { EXTRA_ALLOWED_ORIGINS: 'https://site-1.netlify.app, https://other.test:8443' } });
  assert.equal((await c.call('GET', '/health', { headers: { origin: 'https://site-1.netlify.app' } })).headers.get('access-control-allow-origin'), 'https://site-1.netlify.app');
  assert.equal((await c.call('GET', '/health', { headers: { origin: 'https://evil.netlify.app' } })).headers.get('access-control-allow-origin'), null);
  await c.close();
  for (const bad of ['*', 'http://insecure.test', 'https://x.test/path', 'https://*.netlify.app', 'a,b,c,d,e,f'.split(',').map((x) => `https://${x}.test`).join(',')])
    assert.throws(() => createApp({ config: loadConfig(), env: { ...ENV, EXTRA_ALLOWED_ORIGINS: bad } }), /EXTRA_ALLOWED_ORIGINS/);
});
