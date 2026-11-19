// Check-in challenge: the printed poster carries only a non-secret site URL. After the worker authenticates,
// the server issues a short-lived, HMAC-signed challenge bound to that worker and site. Single use (nonce).
import { randomBytes } from 'node:crypto';
import { hmac, safeEq } from './util.js';
export function createChallenges({ key, clock, ttlSec }) {
  const used = new Map(); // nonce -> expiry ms. Production: DB unique constraint / shared store.
  const sign = (b) => hmac(key, 'qr1.' + b);
  return {
    issue({ workerId, siteCode }) {
      const now = clock();
      for (const [n, e] of used) if (e < now) used.delete(n);
      const p = { w: workerId, s: siteCode, n: randomBytes(16).toString('base64url'), e: now + ttlSec * 1000 };
      const b = Buffer.from(JSON.stringify(p)).toString('base64url');
      return `v1.${b}.${sign(b)}`;
    },
    inspect(token, workerId) {
      const parts = typeof token === 'string' ? token.split('.') : [];
      if (parts.length !== 3 || parts[0] !== 'v1' || parts[1].length > 400) return { ok: false, code: 'QR_INVALID' };
      if (!safeEq(sign(parts[1]), parts[2])) return { ok: false, code: 'QR_INVALID' };
      let p;
      try { p = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); } catch { return { ok: false, code: 'QR_INVALID' }; }
      if (p.w !== workerId) return { ok: false, code: 'QR_INVALID' };
      if (used.has(p.n)) return { ok: false, code: 'QR_REPLAY' };
      if (!(clock() < p.e)) return { ok: false, code: 'QR_EXPIRED' };
      return { ok: true, payload: p };
    },
    consume(p) { used.set(p.n, p.e); },
  };
}
