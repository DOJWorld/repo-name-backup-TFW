import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
export const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export const hmac = (k, s) => createHmac('sha256', k).update(s).digest('hex');
export const safeEq = (a, b) =>
  timingSafeEqual(createHash('sha256').update(String(a)).digest(), createHash('sha256').update(String(b)).digest());
export const rid = (p) => p + '_' + randomBytes(6).toString('hex');
export const ID = /^[A-Za-z0-9_-]{1,40}$/;
export const DATE = /^\d{4}-\d{2}-\d{2}$/;
