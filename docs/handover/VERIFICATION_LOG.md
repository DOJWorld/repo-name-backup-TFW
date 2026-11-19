# Verification Log (executed in the authoring sandbox, 2026-11-16, Node 22, no network)
No commit SHA: not yet in a git repository. Re-run in CI before relying on this.

| Check | Command | Result |
|---|---|---|
| API tests (19) | `cd apps/portal-api && npm test` | 19 pass, 0 fail |
| Replacement tooling tests (6) | `node --test tests/replacement.test.mjs` | 6 pass, 0 fail |
| Registry consistency | `node scripts/verify-placeholders.mjs` | OK: 40 entries |
| Go-live gate | `node scripts/verify-placeholders.mjs --go-live` | Fails as designed (placeholders and simulation remain) |
| CSP hashes in sync | `node scripts/sync-csp.mjs --check` | OK |
| Preview safety | `node scripts/preview-safety-check.mjs` | 0 violations |
| Placement manifest | `node scripts/verify-placement.mjs` | OK: 52 files, 18 rules |
| CLI boot + health + Welsh error | `node src/server.js` | OK |
| Real-data startup guard | `DATA_CLASSIFICATION=real ... node src/server.js` | Refused (REAL_DATA_WITH_SIMULATED_IDENTITY) |

Covered by API tests: expired insurance, RISQS, induction, RAMS, permit, revoked permit, expired Sentinel/CSCS, expiry between challenge and commit, end-of-day expiry edge, QR replay/tamper/theft/expiry, concurrent check-in and concurrent authorisation, IDOR, unauthorised roles, client-supplied time and prototype-pollution payloads, login lockout and rate limit, session timeout, audit chain tamper detection, secrets absent from audit, body/content-type/CORS limits, EN/CY parity, startup guards.

NOT run: browser/UI tests, accessibility audit, DAST/penetration test, dependency scan (no dependencies), load/performance, database and restore tests, any real Entra/TfW integration, GitHub/Netlify/Render deployment.

## Update: live-test build (web app wired to the API)
| Check | Result |
|---|---|
| API tests (now 21) | 21 pass, 0 fail |
| UI journey tests (`tests/ui-smoke.test.mjs`): real page script against real API via a DOM stand-in | 6 pass, 0 fail |
| QR generator: decoded with OpenCV for URLs needing QR versions 2, 3, 4 and 6; and the page's own copy decoded for two Netlify-style poster URLs | all decode to the exact URL (one-off check, not in CI) |
| Safety scanner negative test (fetch to other host, WebSocket, localStorage, innerHTML) | rejected, exit 1 |
| NOT run in a real browser or on real phones; no camera scan test; no accessibility audit |

## Release 0.2.0 (executed in the authoring sandbox, Node 22, no network)
| Check | Result |
|---|---|
| `npm test` (placement, registry, CSP hashes, preview safety, API tests, journey tests, tooling tests) | 22 API + 13 journey/tooling pass, 0 fail |
| CRLF (Windows line endings) copy of the page and netlify.toml | security-hash check still passes |
| EXTRA_ALLOWED_ORIGINS: exact https origins accepted; `*`, http, paths, wildcards, more than 5 refused at startup | covered by API tests |
| Clean unzip into an empty folder, then `npm test` and engine start-up | see release notes |
NOT run: real browser, real phones, GitHub/Netlify/Render builds by me, security or accessibility audits.
