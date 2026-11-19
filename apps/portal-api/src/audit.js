import { hmac } from './util.js';
const ZERO = '0'.repeat(64);
const SENSITIVE = /pass|token|secret|authoriz|challenge|cookie|key/i;
const canon = (e) => JSON.stringify([e.seq, e.ts, e.actor, e.role, e.action, e.resource, e.outcome, e.reason, e.cid, e.detail, e.prev]);
export function sanitize(d) {
  if (d == null || typeof d !== 'object') return null;
  const o = {};
  for (const [k, v] of Object.entries(d)) {
    if (SENSITIVE.test(k)) continue;
    o[k] = typeof v === 'string' ? v.slice(0, 200) : typeof v === 'object' && v !== null ? sanitize(v) : v;
  }
  return o;
}
export function verifyChain(entries, key) {
  let prev = ZERO;
  for (const e of entries) {
    if (e.prev !== prev || hmac(key, canon(e)) !== e.hash) return { ok: false, brokenAt: e.seq };
    prev = e.hash;
  }
  return { ok: true, size: entries.length };
}
export function createAudit(key) {
  const log = [];
  let last = ZERO;
  return {
    append(x) {
      const e = { seq: log.length + 1, ts: x.ts, actor: x.actor, role: x.role ?? null, action: x.action, resource: x.resource ?? null,
        outcome: x.outcome, reason: x.reason ?? null, cid: x.cid, detail: sanitize(x.detail), prev: last };
      e.hash = hmac(key, canon(e));
      last = e.hash;
      log.push(Object.freeze(e));
      return e.seq;
    },
    entries: () => log.map((e) => ({ ...e })),
    verify: () => verifyChain(log, key),
    size: () => log.length,
  };
}
