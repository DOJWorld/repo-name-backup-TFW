import { readFileSync } from 'node:fs';
const ROLES = ['tfw_admin', 'contractor_admin', 'site_manager', 'safety_officer', 'permit_approver', 'worker', 'auditor', 'support'];
const ORIGIN = /^https:\/\/[a-z0-9.-]+(:\d+)?$/;
const GUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
export function loadConfig(path) {
  const p = path || process.env.TENANT_CONFIG || new URL('../../../config/tenant.config.json', import.meta.url);
  const c = JSON.parse(readFileSync(p, 'utf8'));
  validateConfig(c);
  return c;
}
export function validateConfig(c) {
  const bad = (m) => { throw new Error('CONFIG_INVALID: ' + m); };
  if (!['simulated', 'entra'].includes(c.identity?.mode)) bad('identity.mode');
  if (!GUID.test(c.identity.entra.tenantId) || !GUID.test(c.identity.entra.clientId)) bad('entra ids must be GUIDs');
  for (const [g, r] of Object.entries(c.identity.entra.groupRoleMap)) if (!GUID.test(g) || !ROLES.includes(r)) bad('groupRoleMap');
  if (!ORIGIN.test(c.urls.portalBaseUrl) || !ORIGIN.test(c.urls.apiBaseUrl)) bad('urls must be https origins without path');
  if (!c.urls.extraAllowedOrigins.every((o) => ORIGIN.test(o))) bad('extraAllowedOrigins');
  for (const k of ['tfw', 'risqs', 'cards']) {
    if (!['simulated', 'live'].includes(c.integrations[k]?.mode)) bad('integrations.' + k + '.mode');
    if (!ORIGIN.test(c.integrations[k].baseUrl)) bad('integrations.' + k + '.baseUrl');
  }
  const p = c.policy;
  if (!['end_of_day_utc', 'exact_instant_utc'].includes(p.expirySemantics)) bad('policy.expirySemantics');
  if (!Array.isArray(p.requiredCards) || p.requiredCards.some((x) => !['sentinel', 'cscs'].includes(x))) bad('policy.requiredCards');
  for (const k of ['qrChallengeTtlSeconds', 'sessionIdleMinutes', 'sessionAbsoluteMinutes', 'permitValidityHours', 'auditRetentionDays', 'rateLimitPerMinute', 'loginRateLimitPerMinute', 'maxLoginFailures', 'lockoutMinutes'])
    if (!Number.isInteger(p[k]) || p[k] < 1) bad('policy.' + k);
  if (p.integrationFailMode !== 'closed') bad('policy.integrationFailMode must be closed');
  if (!Array.isArray(c.sites) || !c.sites.length || c.sites.some((s) => !/^[A-Z0-9-]{3,20}$/.test(s.code) || !s.name)) bad('sites');
  if (c.residency.requiredRegion !== 'eu-west-2') bad('residency.requiredRegion is fixed');
}
export function deriveUrls(c) {
  const o = c.urls.portalBaseUrl;
  return { allowedOrigins: [o, ...c.urls.extraAllowedOrigins], redirectUri: o + c.identity.entra.redirectPath,
    authority: `https://login.microsoftonline.com/${c.identity.entra.tenantId}/v2.0`, posterUrl: (code) => `${o}/s/${code}` };
}
