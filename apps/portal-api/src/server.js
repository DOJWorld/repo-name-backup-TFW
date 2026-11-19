import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { loadConfig, deriveUrls } from './config.js';
import { createStore } from './store.js';
import { createAudit } from './audit.js';
import { createSessions, createLockout } from './auth.js';
import { createChallenges } from './qr.js';
import { evaluate, companyReasons } from './guard.js';
import { can, inScope } from './rbac.js';
import { t, pickLang, LOCALES } from './i18n.js';
import { safeEq, rid, ID, DATE } from './util.js';

class HttpError extends Error {
  constructor(status, code, extra = {}) { super(code); this.status = status; this.code = code; this.extra = extra; }
}
const need = (env, k, min) => {
  const v = env[k];
  if (typeof v !== 'string' || v.length < min) throw new Error(`CONFIG: ${k} must be set (min ${min} chars)`);
  return v;
};
const V = {
  id: (v) => typeof v === 'string' && ID.test(v),
  date: (v) => typeof v === 'string' && DATE.test(v) && !Number.isNaN(Date.parse(v + 'T00:00:00Z')),
  str: (v) => typeof v === 'string' && v.length > 0 && v.length <= 256,
  site: (v) => typeof v === 'string' && /^[A-Z0-9-]{3,20}$/.test(v),
  oneOf: (...a) => (v) => a.includes(v),
};
function check(body, schema) {
  const bad = (field) => { throw new HttpError(400, 'VALIDATION', { field }); };
  if (body === null || typeof body !== 'object' || Array.isArray(body)) bad(null);
  for (const k of Object.keys(body)) if (!Object.hasOwn(schema, k)) bad(k);
  let n = 0;
  for (const [k, [fn, req]] of Object.entries(schema)) {
    if (body[k] === undefined) { if (req) bad(k); continue; }
    if (!fn(body[k])) bad(k);
    n++;
  }
  return n;
}
const SEC = {
  'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'", 'cross-origin-resource-policy': 'same-site',
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
};

export function createApp({ config = loadConfig(), env = process.env, clock = Date.now } = {}) {
  const dataClass = env.DATA_CLASSIFICATION || 'synthetic';
  if (dataClass === 'real') {
    if (env.AWS_REGION !== config.residency.requiredRegion) throw new Error('RESIDENCY_GUARD: real data requires AWS_REGION=' + config.residency.requiredRegion);
    if (config.identity.mode === 'simulated') throw new Error('REAL_DATA_WITH_SIMULATED_IDENTITY: refused');
  }
  if (config.identity.mode !== 'simulated') throw new Error('IDENTITY_MODE_NOT_IMPLEMENTED: the Entra ID adapter is not built yet');
  const auditKey = need(env, 'AUDIT_HMAC_KEY', 32), qrKey = need(env, 'QR_SIGNING_KEY', 32), simPass = need(env, 'SIMULATED_USER_PASSWORD', 12);
  const P = config.policy, urls = deriveUrls(config), trustProxy = env.TRUST_PROXY === '1';
  const extraOrigins = String(env.EXTRA_ALLOWED_ORIGINS || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (extraOrigins.length > 5 || extraOrigins.some((o) => !/^https:\/\/[a-z0-9.-]+(:\d+)?$/.test(o))) throw new Error('CONFIG: EXTRA_ALLOWED_ORIGINS must be up to 5 comma-separated https origins (no path, no wildcard)');
  const allowedOrigins = [...urls.allowedOrigins, ...extraOrigins];
  const store = createStore(config, clock());
  const audit = createAudit(auditKey);
  const sessions = createSessions({ clock, idleMin: P.sessionIdleMinutes, absMin: P.sessionAbsoluteMinutes });
  const lockout = createLockout({ clock, max: P.maxLoginFailures, minutes: P.lockoutMinutes });
  const challenges = createChallenges({ key: qrKey, clock, ttlSec: P.qrChallengeTtlSeconds });
  const hits = new Map();
  const rateOk = (key, limit, now) => {
    if (hits.size > 5000) for (const [k, a] of hits) if (!a.length || now - a[a.length - 1] > 60000) hits.delete(k);
    const a = (hits.get(key) || []).filter((x) => now - x < 60000);
    if (a.length >= limit) { hits.set(key, a); return false; }
    a.push(now); hits.set(key, a); return true;
  };
  const iso = () => new Date(clock()).toISOString();

  const pickPermit = (contractorId, siteCode) => {
    const all = [...store.permits.values()].filter((p) => p.contractorId === contractorId && p.siteCode === siteCode).sort((a, b) => b.n - a.n);
    return all.find((p) => p.status === 'authorised' && clock() < Date.parse(p.expiry)) || all[0] || null;
  };
  const ramsFor = (contractorId, siteCode) => {
    const l = [...store.rams.values()].filter((r) => r.contractorId === contractorId && r.siteCode === siteCode);
    return l.find((r) => r.status === 'approved') || l[0] || null;
  };
  const checkinCtx = (worker, siteCode) => {
    const permit = pickPermit(worker.contractorId, siteCode);
    return { contractor: store.contractors.get(worker.contractorId), worker, siteCode, permit,
      rams: permit ? store.rams.get(permit.ramsId) : ramsFor(worker.contractorId, siteCode) };
  };

  async function handle(req, res) {
    const cid = randomUUID();
    let user = null;
    const url = new URL(req.url, 'http://localhost');
    const lang = pickLang(url.searchParams.get('lang'), req.headers['accept-language']);
    const origin = req.headers.origin;
    const cors = {};
    if (origin && allowedOrigins.includes(origin)) {
      Object.assign(cors, { 'access-control-allow-origin': origin, vary: 'Origin', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, PATCH', 'access-control-max-age': '600' });
    }
    const send = (status, obj) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'x-correlation-id': cid, 'x-integration-mode': config.identity.mode, ...SEC, ...cors });
      res.end(JSON.stringify(obj));
    };
    const A = (action, resource, outcome, reason, detail) =>
      audit.append({ ts: iso(), actor: user ? user.id : 'anonymous', role: user ? user.role : null, action, resource, outcome, reason, cid, detail });
    const denyGuard = (action, resource, g, detail) => {
      A(action, resource, 'denied', g.first, { ...detail, reasons: g.reasons });
      throw new HttpError(g.reasons.includes('GUARD_ERROR') ? 500 : 403, 'COMPLIANCE_DENIED', { reasons: g.reasons });
    };
    try {
      if (req.method === 'OPTIONS') { if (cors['access-control-allow-origin']) { res.writeHead(204, { 'x-correlation-id': cid, ...SEC, ...cors }); return res.end(); } throw new HttpError(403, 'FORBIDDEN'); }
      const fwd = String(req.headers['x-forwarded-for'] || '').split(',').pop().trim();
      const ip = trustProxy && fwd ? fwd : req.socket.remoteAddress || 'unknown';
      const isLogin = req.method === 'POST' && url.pathname === '/auth/login';
      if (!rateOk((isLogin ? 'login:' : 'api:') + ip, isLogin ? P.loginRateLimitPerMinute : P.rateLimitPerMinute, clock())) { A('rate.limit', url.pathname.slice(0, 60), 'denied', 'RATE_LIMITED'); throw new HttpError(429, 'RATE_LIMITED'); }

      let body;
      if (req.method === 'POST' || req.method === 'PATCH') {
        if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE');
        let size = 0; const chunks = [];
        for await (const ch of req) { size += ch.length; if (size > 16384) throw new HttpError(413, 'PAYLOAD_TOO_LARGE'); chunks.push(ch); }
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw new HttpError(400, 'VALIDATION'); }
      }
      const m = (re) => url.pathname.match(re);
      const route = (method, re, perm, fn, isPublic = false) => (req.method === method && m(re) ? { re, perm, fn, isPublic } : null);
      const ID_ = '([A-Za-z0-9_-]{1,40})';
      const found = [
        route('GET', /^\/i18n$/, null, () => {
          const pure = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('_')));
          return [200, { en: pure(LOCALES.en), cy: pure(LOCALES.cy) }];
        }, true),
        route('GET', /^\/sites$/, null, () => [200, [...store.sites.values()].map((x) => ({ code: x.code, name: x.name }))]),
        route('GET', /^\/contractors$/, 'directory.read', () =>
          [200, [...store.contractors.values()].filter((c) => inScope(user, c.id)).map((c) => ({ id: c.id, name: c.name }))]),
        route('GET', new RegExp(`^/contractors/${ID_}/workers$`), 'directory.read', () => {
          const id = m(new RegExp(`^/contractors/${ID_}/workers$`))[1];
          if (!store.contractors.has(id) || !inScope(user, id)) throw new HttpError(404, 'NOT_FOUND');
          return [200, [...store.workers.values()].filter((w) => w.contractorId === id).map((w) => ({ id: w.id, name: w.name, cards: w.cards, inductions: w.inductions }))];
        }),
        route('GET', /^\/rams$/, 'compliance.read', () =>
          [200, [...store.rams.values()].filter((r) => inScope(user, r.contractorId)).map((r) => ({ id: r.id, contractorId: r.contractorId, siteCode: r.siteCode, status: r.status, expiry: r.expiry }))]),
        route('GET', /^\/permits$/, 'permit.read', () =>
          [200, [...store.permits.values()].filter((p) => inScope(user, p.contractorId)).sort((a, b) => b.n - a.n)
            .map((p) => ({ id: p.id, contractorId: p.contractorId, siteCode: p.siteCode, leadWorkerId: p.leadWorkerId, ramsId: p.ramsId, status: p.status, expiry: p.expiry }))]),
        route('GET', /^\/checkins\/me$/, 'checkin', () => {
          const a = store.attendance.find((x) => x.workerId === user.workerId && !x.outAt);
          return [200, { present: a ? { siteCode: a.siteCode, inAt: a.inAt } : null }];
        }),
        route('GET', /^\/health$/, null, () => [200, { status: 'ok' }], true),
        route('POST', /^\/auth\/login$/, null, () => {
          check(body, { username: [V.str, true], password: [V.str, true] });
          if (lockout.locked(body.username)) { A('auth.login', null, 'denied', 'ACCOUNT_LOCKED'); throw new HttpError(423, 'ACCOUNT_LOCKED'); }
          const u = store.users.find((x) => x.username === body.username);
          const okPass = safeEq(body.password, simPass);
          if (!u || !okPass) { lockout.fail(body.username); A('auth.login', null, 'denied', 'INVALID_CREDENTIALS'); throw new HttpError(401, 'INVALID_CREDENTIALS'); }
          lockout.ok(body.username); user = u; A('auth.login', u.id, 'allowed', null);
          return [200, { token: sessions.create(u), role: u.role, simulated: true }];
        }, true),
        route('POST', /^\/auth\/logout$/, null, () => { sessions.revoke(String(req.headers.authorization || '').slice(7)); A('auth.logout', user.id, 'allowed'); return [200, { ok: true }]; }),
        route('GET', /^\/me$/, null, () => [200, { id: user.id, role: user.role, contractorId: user.contractorId, workerId: user.workerId }]),
        route('GET', new RegExp(`^/contractors/${ID_}/compliance$`), 'compliance.read', () => {
          const id = m(new RegExp(`^/contractors/${ID_}/compliance$`))[1], c = store.contractors.get(id);
          if (!c || !inScope(user, id)) { A('compliance.read', id, 'denied', 'NOT_FOUND'); throw new HttpError(404, 'NOT_FOUND'); }
          const ramsList = [...store.rams.values()].filter((r) => r.contractorId === id).map((r) => ({ id: r.id, siteCode: r.siteCode, status: r.status }));
          return [200, { contractorId: id, name: c.name, insuranceExpiry: c.insuranceExpiry, risqsStatus: c.risqsStatus, risqsExpiry: c.risqsExpiry, companyReasons: companyReasons(c, clock(), P), rams: ramsList }];
        }),
        route('PATCH', new RegExp(`^/contractors/${ID_}/credentials$`), 'credential.verify', () => {
          const id = m(new RegExp(`^/contractors/${ID_}/credentials$`))[1], c = store.contractors.get(id);
          if (!c) throw new HttpError(404, 'NOT_FOUND');
          if (!check(body, { insuranceExpiry: [V.date], risqsStatus: [V.oneOf('valid', 'invalid', 'suspended')], risqsExpiry: [V.date] })) throw new HttpError(400, 'VALIDATION');
          const before = { insuranceExpiry: c.insuranceExpiry, risqsStatus: c.risqsStatus, risqsExpiry: c.risqsExpiry };
          Object.assign(c, body);
          A('credential.update', id, 'allowed', null, { before, after: body });
          return [200, { contractorId: id }];
        }),
        route('PATCH', new RegExp(`^/workers/${ID_}/credentials$`), 'credential.verify', () => {
          const id = m(new RegExp(`^/workers/${ID_}/credentials$`))[1], w = store.workers.get(id);
          if (!w) throw new HttpError(404, 'NOT_FOUND');
          if (!check(body, { sentinelExpiry: [V.date], cscsExpiry: [V.date] })) throw new HttpError(400, 'VALIDATION');
          const before = { ...w.cards };
          if (body.sentinelExpiry) w.cards.sentinel = body.sentinelExpiry;
          if (body.cscsExpiry) w.cards.cscs = body.cscsExpiry;
          A('credential.update', id, 'allowed', null, { before, after: body });
          return [200, { workerId: id }];
        }),
        route('POST', new RegExp(`^/workers/${ID_}/inductions$`), 'induction.record', () => {
          const id = m(new RegExp(`^/workers/${ID_}/inductions$`))[1], w = store.workers.get(id);
          check(body, { siteCode: [V.site, true], expiry: [V.date, true] });
          if (!w || !store.sites.has(body.siteCode)) throw new HttpError(404, 'NOT_FOUND');
          w.inductions[body.siteCode] = body.expiry;
          A('induction.record', id, 'allowed', null, { siteCode: body.siteCode, expiry: body.expiry });
          return [201, { workerId: id }];
        }),
        route('POST', /^\/rams$/, 'rams.submit', () => {
          check(body, { contractorId: [V.id, true], siteCode: [V.site, true], expiry: [V.date, true] });
          if (!inScope(user, body.contractorId) || !store.contractors.has(body.contractorId) || !store.sites.has(body.siteCode)) { A('rams.submit', body.contractorId, 'denied', 'NOT_FOUND'); throw new HttpError(404, 'NOT_FOUND'); }
          const r = { id: rid('rms'), contractorId: body.contractorId, siteCode: body.siteCode, status: 'submitted', expiry: body.expiry };
          store.rams.set(r.id, r); A('rams.submit', r.id, 'allowed', null);
          return [201, { id: r.id, status: r.status }];
        }),
        route('POST', new RegExp(`^/rams/${ID_}/approve$`), 'rams.approve', () => {
          const r = store.rams.get(m(new RegExp(`^/rams/${ID_}/approve$`))[1]);
          if (!r) throw new HttpError(404, 'NOT_FOUND');
          if (r.status !== 'submitted') { A('rams.approve', r.id, 'denied', 'PERMIT_STATE_INVALID'); throw new HttpError(409, 'PERMIT_STATE_INVALID'); }
          r.status = 'approved'; A('rams.approve', r.id, 'allowed', null);
          return [200, { id: r.id, status: r.status }];
        }),
        route('POST', /^\/permits$/, 'permit.request', () => {
          check(body, { contractorId: [V.id, true], siteCode: [V.site, true], leadWorkerId: [V.id, true], ramsId: [V.id, true] });
          const w = store.workers.get(body.leadWorkerId), r = store.rams.get(body.ramsId);
          if (!inScope(user, body.contractorId) || !store.contractors.has(body.contractorId) || !store.sites.has(body.siteCode) || !w || w.contractorId !== body.contractorId || !r || r.contractorId !== body.contractorId) {
            A('permit.request', body.contractorId, 'denied', 'NOT_FOUND'); throw new HttpError(404, 'NOT_FOUND');
          }
          const g = evaluate('permit', { contractor: store.contractors.get(body.contractorId), worker: w, siteCode: body.siteCode, rams: r }, clock(), P);
          if (!g.allowed) denyGuard('permit.request', body.contractorId, g, { siteCode: body.siteCode });
          const p = { id: rid('prm'), n: ++store.seq, contractorId: body.contractorId, siteCode: body.siteCode, leadWorkerId: w.id, ramsId: r.id, status: 'requested', requestedBy: user.id, expiry: null };
          store.permits.set(p.id, p); A('permit.request', p.id, 'allowed', null);
          return [201, { id: p.id, status: p.status }];
        }),
        route('POST', new RegExp(`^/permits/${ID_}/authorise$`), 'permit.authorise', () => {
          const p = store.permits.get(m(new RegExp(`^/permits/${ID_}/authorise$`))[1]);
          if (!p) throw new HttpError(404, 'NOT_FOUND');
          if (p.status !== 'requested') { A('permit.authorise', p.id, 'denied', 'PERMIT_STATE_INVALID'); throw new HttpError(409, 'PERMIT_STATE_INVALID'); }
          // Re-evaluated now, at the point of execution, from stored records (never from the request).
          const g = evaluate('permit', { contractor: store.contractors.get(p.contractorId), worker: store.workers.get(p.leadWorkerId), siteCode: p.siteCode, rams: store.rams.get(p.ramsId) }, clock(), P);
          if (!g.allowed) denyGuard('permit.authorise', p.id, g, { siteCode: p.siteCode });
          p.status = 'authorised'; p.authorisedBy = user.id; p.expiry = new Date(clock() + P.permitValidityHours * 3600000).toISOString();
          A('permit.authorise', p.id, 'allowed', null, { expiry: p.expiry });
          return [200, { id: p.id, status: p.status, expiry: p.expiry }];
        }),
        route('POST', new RegExp(`^/permits/${ID_}/revoke$`), 'permit.revoke', () => {
          const p = store.permits.get(m(new RegExp(`^/permits/${ID_}/revoke$`))[1]);
          if (!p) throw new HttpError(404, 'NOT_FOUND');
          if (!['requested', 'authorised'].includes(p.status)) { A('permit.revoke', p.id, 'denied', 'PERMIT_STATE_INVALID'); throw new HttpError(409, 'PERMIT_STATE_INVALID'); }
          p.status = 'revoked'; A('permit.revoke', p.id, 'allowed', null);
          return [200, { id: p.id, status: p.status }];
        }),
        route('GET', new RegExp(`^/permits/${ID_}$`), 'permit.read', () => {
          const p = store.permits.get(m(new RegExp(`^/permits/${ID_}$`))[1]);
          if (!p || !inScope(user, p.contractorId)) throw new HttpError(404, 'NOT_FOUND');
          return [200, { id: p.id, siteCode: p.siteCode, status: p.status, expiry: p.expiry }];
        }),
        route('POST', /^\/checkins\/challenge$/, 'checkin', () => {
          check(body, { siteCode: [V.site, true] });
          const w = store.workers.get(user.workerId);
          if (!w || !store.sites.has(body.siteCode)) throw new HttpError(404, 'NOT_FOUND');
          const g = evaluate('checkin', checkinCtx(w, body.siteCode), clock(), P);
          if (!g.allowed) denyGuard('checkin.challenge', w.id, g, { siteCode: body.siteCode });
          A('checkin.challenge', w.id, 'allowed', null, { siteCode: body.siteCode });
          return [200, { challenge: challenges.issue({ workerId: w.id, siteCode: body.siteCode }), expiresInSeconds: P.qrChallengeTtlSeconds }];
        }),
        route('POST', /^\/checkins$/, 'checkin', () => {
          check(body, { challenge: [V.str, true] });
          const w = store.workers.get(user.workerId);
          if (!w) throw new HttpError(404, 'NOT_FOUND');
          const q = challenges.inspect(body.challenge, w.id);
          if (!q.ok) { A('checkin.commit', w.id, 'denied', q.code); throw new HttpError(q.code === 'QR_REPLAY' ? 409 : 403, q.code); }
          const siteCode = q.payload.s;
          const g = evaluate('checkin', checkinCtx(w, siteCode), clock(), P);
          if (!g.allowed) denyGuard('checkin.commit', w.id, g, { siteCode });
          if (store.attendance.some((a) => a.workerId === w.id && !a.outAt)) { A('checkin.commit', w.id, 'denied', 'DUPLICATE_CHECKIN', { siteCode }); throw new HttpError(409, 'DUPLICATE_CHECKIN'); }
          challenges.consume(q.payload);
          const a = { id: rid('att'), workerId: w.id, contractorId: w.contractorId, siteCode, inAt: iso(), outAt: null, permitId: pickPermit(w.contractorId, siteCode).id };
          store.attendance.push(a); A('checkin.commit', a.id, 'allowed', null, { siteCode });
          return [201, { id: a.id, siteCode, inAt: a.inAt }];
        }),
        route('POST', /^\/checkouts$/, 'checkin', () => {
          check(body, { siteCode: [V.site, true] });
          const a = store.attendance.find((x) => x.workerId === user.workerId && x.siteCode === body.siteCode && !x.outAt);
          if (!a) { A('checkout', user.workerId, 'denied', 'NOT_CHECKED_IN'); throw new HttpError(409, 'NOT_CHECKED_IN'); }
          a.outAt = iso(); A('checkout', a.id, 'allowed', null, { siteCode: a.siteCode });
          return [200, { id: a.id, outAt: a.outAt }];
        }),
        route('GET', new RegExp(`^/rollcall/([A-Z0-9-]{3,20})$`), 'rollcall.read', () => {
          const code = m(/^\/rollcall\/([A-Z0-9-]{3,20})$/)[1];
          if (!store.sites.has(code)) throw new HttpError(404, 'NOT_FOUND');
          const present = store.attendance.filter((a) => a.siteCode === code && !a.outAt).map((a) => ({ workerId: a.workerId, name: store.workers.get(a.workerId).name, contractorId: a.contractorId, inAt: a.inAt }));
          return [200, { siteCode: code, count: present.length, present }];
        }),
        route('GET', new RegExp(`^/sites/([A-Z0-9-]{3,20})/poster$`), 'rollcall.read', () => {
          const code = m(/^\/sites\/([A-Z0-9-]{3,20})\/poster$/)[1];
          if (!store.sites.has(code)) throw new HttpError(404, 'NOT_FOUND');
          return [200, { siteCode: code, url: urls.posterUrl(code) }];
        }),
        route('GET', /^\/audit$/, 'audit.read', () => {
          const lim = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1), 500);
          A('audit.read', null, 'allowed', null);
          return [200, { entries: audit.entries().slice(-lim) }];
        }),
        route('GET', /^\/audit\/verify$/, 'audit.read', () => [200, audit.verify()]),
      ].find(Boolean);

      if (!found) throw new HttpError(404, 'NOT_FOUND');
      if (!found.isPublic) {
        const auth = String(req.headers.authorization || '');
        user = auth.startsWith('Bearer ') ? sessions.lookup(auth.slice(7)) : null;
        if (!user) { A('auth.required', url.pathname.slice(0, 60), 'denied', 'UNAUTHENTICATED'); throw new HttpError(401, 'UNAUTHENTICATED'); }
        if (found.perm && !can(user.role, found.perm)) { A('authz.denied', url.pathname.slice(0, 60), 'denied', 'FORBIDDEN', { perm: found.perm }); throw new HttpError(403, 'FORBIDDEN'); }
      }
      const [status, data] = found.fn();
      return send(status, { data });
    } catch (e) {
      if (!(e instanceof HttpError)) { process.stderr.write(JSON.stringify({ level: 'error', cid, type: e?.constructor?.name }) + '\n'); e = new HttpError(500, 'INTERNAL'); }
      const reasons = (e.extra.reasons || []).map((c) => ({ code: c, message: t(lang, c) }));
      return send(e.status, { error: { code: e.code, message: t(lang, e.code), correlationId: cid, ...(reasons.length ? { reasons } : {}), ...(e.extra.field ? { field: e.extra.field } : {}) } });
    }
  }
  const server = http.createServer(handle);
  server.requestTimeout = 15000; server.headersTimeout = 10000; server.keepAliveTimeout = 5000; server.maxHeadersCount = 50;
  return { server, store, audit, auditKey, config };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = createApp();
  const port = Number(process.env.PORT || 3000);
  app.server.listen(port, '0.0.0.0', () => process.stdout.write(JSON.stringify({ msg: 'listening', port, identity: app.config.identity.mode, dataClass: process.env.DATA_CLASSIFICATION || 'synthetic' }) + '\n'));
}
