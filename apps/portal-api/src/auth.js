// SIMULATED identity provider. Not Microsoft Entra ID. Refuses to run with real data (see server.js).
import { randomBytes } from 'node:crypto';
import { sha256 } from './util.js';
export function createSessions({ clock, idleMin, absMin }) {
  const m = new Map();
  return {
    create(user) { const tok = randomBytes(32).toString('base64url'); const n = clock(); m.set(sha256(tok), { user, created: n, last: n }); return tok; },
    lookup(tok) {
      if (typeof tok !== 'string' || tok.length < 20 || tok.length > 100) return null;
      const h = sha256(tok), s = m.get(h), n = clock();
      if (!s) return null;
      if (n - s.created > absMin * 60000 || n - s.last > idleMin * 60000) { m.delete(h); return null; }
      s.last = n; return s.user;
    },
    revoke(tok) { m.delete(sha256(tok)); },
  };
}
export function createLockout({ clock, max, minutes }) {
  const m = new Map();
  return {
    locked(u) { const e = m.get(u); return !!e && e.n >= max && clock() - e.first < minutes * 60000; },
    fail(u) { const n = clock(), e = m.get(u); if (!e || n - e.first >= minutes * 60000) m.set(u, { n: 1, first: n }); else e.n++; },
    ok(u) { m.delete(u); },
  };
}
