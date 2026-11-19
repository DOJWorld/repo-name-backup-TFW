# Placement and Connection Guide

Where every file goes, and how GitHub, Netlify, Render, Neon and the other services connect. The per-file table in section 3 is generated from `config/placement-manifest.json` and checked by `node scripts/verify-placement.mjs`, so no file can be left without a destination.

Menu names in third-party dashboards change; where a label is quoted, treat it as the closest current name and check against the provider's documentation.

## 1. Read this first: what is and is not connected

| Platform | Role in this build | Holds real data? | Connected to the code today? |
|---|---|---|---|
| **GitHub** | The single source of truth: all code, config, docs, CI | No | Yes: this is where everything is stored |
| **Netlify** | Publishes `web/` as a static preview | **Never** | Yes: builds from GitHub |
| **Render** | Runs the API as a synthetic-data staging service (Frankfurt; no UK region) | **Never** | Yes: builds from GitHub via `render.yaml` |
| **Neon** | Postgres database (London region `aws-eu-west-2` is available) | Synthetic only, and only after a reviewed adapter exists | **No.** The API uses an in-memory store and does not read `DATABASE_URL`. Creating a Neon project now achieves nothing until a database store is written |
| **AWS eu-west-2** | Real production (UK-resident) | Yes, after DPIA actions close | **No.** No infrastructure code exists yet |
| **Microsoft Entra ID** | Real sign-in | n/a | **No.** The adapter is not built |

## 2. Loose items I gave you and where each goes

| Item | Goes to | Notes |
|---|---|---|
| `tfw-portal-deploy.zip` | **Nowhere.** Unpack it, commit the unpacked files | A transport archive. Never commit it (`.gitignore` blocks it and the placement check rejects it) |
| The whole unpacked folder | GitHub repo root | See section 4 |
| `tfw-contractors-portal-prototype.html` (the published Claude link) | **Nowhere new.** It is identical to `web/index.html` | Do not commit a second copy |
| The 12 earlier evidence documents | Already merged under `docs/security`, `docs/compliance`, `docs/architecture`, `docs/accessibility`, `docs/qa`, `docs/operations` | They are templates marked NOT EVIDENCED until filled from real results |
| Your own existing documents (`TECHNICAL_SPEC.md`, traceability matrix, DPIA) | `docs/architecture/`, `docs/sms-occ-003-mapping/`, `docs/dpia/` (the paths named in the master prompt) | I have not seen them; keep them untouched |
| Your existing `compliance-guard.service.ts` | Stays at `apps/api/src/modules/compliance/` | My `apps/portal-api/src/guard.js` is a reference implementation; reconcile the two, do not delete yours |

## 3. Every file in the repository

<!-- BEGIN:FILE_TABLE -->
| File | GitHub | Netlify | Render | Neon | Purpose |
| --- | --- | --- | --- | --- | --- |
| `.env.example` | repo root (placeholders only) | not used | not used | not used | Template; real .env is never committed |
| `.gitattributes` | repo root | not used | not used | not used | Forces LF line endings so security hashes stay correct on Windows |
| `.github/CODEOWNERS` | .github/ (must be at repo root) | not used | not used | not used | CI workflow, CODEOWNERS, Dependabot |
| `.github/dependabot.yml` | .github/ (must be at repo root) | not used | not used | not used | CI workflow, CODEOWNERS, Dependabot |
| `.github/workflows/ci.yml` | .github/ (must be at repo root) | not used | not used | not used | CI workflow, CODEOWNERS, Dependabot |
| `.gitignore` | repo root | not used | not used | not used | Keeps secrets and build output out of Git |
| `.nvmrc` | repo root | READ AUTOMATICALLY for the Node version | READ AUTOMATICALLY for the Node version | not used | Pins Node 20 for Netlify, Render and developers |
| `CHANGELOG.md` | repo root | not used | not used | not used | Release notes |
| `README.md` | repo root | not used | not used | not used | Orientation |
| `SECURITY.md` | repo root | not used | not used | not used | Vulnerability reporting policy (GitHub shows it on the Security tab) |
| `apps/portal-api/package.json` | apps/portal-api/ | not used | RUN: build step (npm run build) and Node engine | not used | API manifest (no third-party dependencies) |
| `apps/portal-api/src/audit.js` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/src/auth.js` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/src/config.js` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/src/guard.js` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/src/i18n.js` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/src/locales/cy.json` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/src/locales/en.json` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/src/qr.js` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/src/rbac.js` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/src/server.js` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/src/store.js` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/src/util.js` | apps/portal-api/src/ | not used | RUN: node src/server.js | not used (store.js is in-memory; a Neon-backed store is not built yet) | API source code and locale files |
| `apps/portal-api/tests/api.test.js` | apps/portal-api/tests/ | not used | present in checkout, never executed by Render | not used | API tests, executed by CI (npm test) |
| `config/placement-manifest.json` | config/ | not used | not used | not used | Replacement registry, example values file, this manifest. Handover tooling |
| `config/replacement-registry.json` | config/ | not used | not used | not used | Replacement registry, example values file, this manifest. Handover tooling |
| `config/tenant.config.json` | config/ | not used | READ AT RUNTIME from the repo checkout (../../config relative to apps/portal-api) | not used | All TfW-specific values live here |
| `config/tfw-values.example.json` | config/ | not used | not used | not used | Replacement registry, example values file, this manifest. Handover tooling |
| `docs/accessibility/BILINGUAL_PARITY_REPORT.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/architecture/DATA_FLOW_AND_RESIDENCY.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/architecture/INTEGRATION_REGISTER.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/compliance/COMPLIANCE_EVIDENCE_REGISTER.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/compliance/SMS_OCC_003_COVERAGE_REPORT.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/handover/FRESH_START_CHECKLIST.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/handover/PLACEMENT_AND_CONNECTION_GUIDE.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/handover/START_HERE_PLAIN_ENGLISH.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/handover/TESTER_GUIDE.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/handover/TFW_REPLACEMENT_REGISTER.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/handover/VERIFICATION_LOG.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/operations/DEPLOYMENT_AND_ROLLBACK.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/operations/ENVIRONMENTS_AND_SECRETS.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/operations/INCIDENT_RESPONSE.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/operations/PRODUCTION_READINESS_REPORT.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/qa/TEST_EXECUTION_REPORT.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/security/SECURITY_ASSESSMENT.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/security/SECURITY_TEST_RESULTS.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `docs/security/THREAT_MODEL.md` | docs/ (same sub-folders) | not used | not used | not used | Evidence, architecture, operations and handover documents. Never deployed |
| `netlify.toml` | repo root | READ AUTOMATICALLY from repo root: build command, publish dir, security headers | not used | not used | Netlify configuration |
| `package.json` | repo root | not used | not used | not used | Root convenience commands (npm run verify / npm test). No third-party dependencies |
| `render.yaml` | repo root | not used | READ AS BLUEPRINT from repo root (New > Blueprint) | not used | Render synthetic-staging service definition |
| `scripts/_registry-lib.mjs` | scripts/ | not used | not used | not used | Registry verify/generate/apply and placement check. Run by CI and by engineers |
| `scripts/apply-tfw-values.mjs` | scripts/ | not used | not used | not used | Registry verify/generate/apply and placement check. Run by CI and by engineers |
| `scripts/gen-replacement-register.mjs` | scripts/ | not used | not used | not used | Registry verify/generate/apply and placement check. Run by CI and by engineers |
| `scripts/make-secrets.mjs` | scripts/ | not used | not used | not used | Registry verify/generate/apply and placement check. Run by CI and by engineers |
| `scripts/preview-safety-check.mjs` | scripts/ (must stay at this path) | RUN in the Netlify build command | not used | not used | Fails the preview build if it could leak data or call out |
| `scripts/sync-csp.mjs` | scripts/ (must stay at this path) | RUN in the Netlify build command | not used | not used | Keeps CSP hashes in step with the page |
| `scripts/verify-placeholders.mjs` | scripts/ | not used | not used | not used | Registry verify/generate/apply and placement check. Run by CI and by engineers |
| `scripts/verify-placement.mjs` | scripts/ | not used | not used | not used | Registry verify/generate/apply and placement check. Run by CI and by engineers |
| `tests/replacement.test.mjs` | tests/ | not used | not used | not used | Tests of the handover tooling, run by CI |
| `tests/ui-smoke.test.mjs` | tests/ | not used | not used | not used | Tests of the handover tooling, run by CI |
| `web/index.html` | web/index.html (repo root /web) | PUBLISHED: the site served from publish dir web | not used | not used | Static UI simulation. Synthetic data only |
<!-- END:FILE_TABLE -->

## 4. GitHub (do this first)

1. **Create the repository**: private, in the organisation that will own it. Do not initialise with a README.
2. **If you already have a TfW repository** (it contains `apps/api`, `docs/architecture/TECHNICAL_SPEC.md` and an existing `.github/workflows`): do **not** overwrite. Create a branch `integrate/portal-api`, copy the files in, and resolve these likely collisions by hand: `.github/workflows/*`, `.gitignore`, `README.md`, `SECURITY.md`, `netlify.toml`, `render.yaml`, `docs/*`.
3. **Push** the unpacked folder to `main` (new repo) or the branch (existing repo).
4. **Settings > Code security**: enable Dependency graph, Dependabot alerts and security updates, Secret scanning, Push protection, Code scanning.
5. **Settings > Branches** (rule on `main`): require a pull request, 2 approvals, Code Owners review, status checks `preview-safety`, `secrets`, `codeql`, `registry`, `api`; require up-to-date branch; no force pushes; apply to administrators.
6. **Settings > Environments**: create `staging` (one required reviewer) and `production` (two required reviewers, deployment branch `main` only).
7. **Settings > Secrets and variables > Actions**: add `GITLEAKS_LICENSE` (repository secret; required by the Gitleaks action for organisation repositories). Optional: `RENDER_DEPLOY_HOOK_URL` as a **staging environment** secret. Later: `AWS_ROLE_ARN` as a **production environment variable** (not a secret).
8. **Edit `.github/CODEOWNERS`**: replace `@ORG/` with your organisation and create the four teams it names (registry item TFW-27).
9. **Run**: open a pull request; all five checks must go green. Fix any failure; never bypass it.

## 5. Netlify (static preview only)

1. **Add new site > Import from Git**, choose the GitHub repository.
2. Leave **Base directory** empty. The build command, publish directory (`web`) and headers are read from `netlify.toml`; confirm Netlify shows them rather than overriding them.
3. **Environment variables**: none are required. `netlify.toml` sets `NODE_VERSION=20` and a label `PREVIEW_DATA_CLASS=synthetic`. **Never add** any secret, database URL, API credential or production URL here.
4. **Disable** Netlify Functions, Forms, Identity, Analytics and any add-on that stores visitor data.
5. If your plan allows it, enable **password or SSO protection** for deploy previews.
6. **Check**: the deploy log must show `scanned 1 file(s), 0 violation(s)` and `CSP hashes in sync`. If either fails the deploy correctly stops.
7. **Custom domain** (later): Netlify > Domain management; DNS record at TfW's DNS provider (registry TFW-36, TFW-37).

## 6. Render (synthetic staging API only)

1. **New > Blueprint**, choose the GitHub repository. Render reads `render.yaml` at the repo root.
2. The service is created in **Frankfurt** with auto-deploy **off**. Deploy manually or through the `staging` environment hook.
3. Three secrets are generated by Render: `AUDIT_HMAC_KEY`, `QR_SIGNING_KEY`, `SIMULATED_USER_PASSWORD`. Read the last one from the dashboard if you need to sign in to the synthetic API. Do not copy these anywhere else.
4. **Check**: open `https://<service-name>.onrender.com/health`; expect `{"data":{"status":"ok"}}` and the header `x-integration-mode: simulated`.
5. **Not verified by me**: the Render build and start commands (`cd apps/portal-api && ...`). Confirm on first deploy.
6. Render has **no UK region**. Never attach real data. Do not add `DATA_CLASSIFICATION=real` here; the API would refuse to start, which is the intended safeguard.
7. **CORS** (only when the web page starts calling the API): the Netlify origin must be allowed. Set it through the replacement tool (registry TFW-08), not by editing code.

## 7. Neon (optional; not wired in)

Create a Neon project only when a database-backed store is built. When you do:
1. Choose region **AWS Europe (London) `aws-eu-west-2`**. The region is fixed at creation and cannot be moved.
2. Synthetic data only until the DPIA covers Neon as a processor (including support access and control-plane location, which I have not verified).
3. Create a dedicated database and a least-privilege application role; use the pooled connection string with TLS required.
4. Store the connection string **only** as `DATABASE_URL` in Render's dashboard (`sync: false`) and, later, AWS Secrets Manager. Never in GitHub, Netlify or any file.
5. Real production uses a UK-resident AWS database under the vendor's control (see section 8), not Neon, unless TfW approves Neon in the DPIA.

## 8. Other places to connect (none are connected yet)

| Where | What to do there | Registry ID |
|---|---|---|
| **Microsoft Entra admin centre** (TfW's) | Register the application; add redirect URI `<portal URL>/auth/callback`; create the 8 role security groups; give the vendor the tenant ID, client ID and group object IDs; issue a client secret or certificate | TFW-09 to 12, TFW-31, TFW-32 |
| **TfW DNS provider** | Records for the portal, API and email (SPF, DKIM, DMARC) | TFW-06, 07, 05, 37 |
| **AWS account, eu-west-2** (vendor) | Secrets Manager, KMS, UK database, S3 with Object Lock for audit, WAF, CloudTrail, backups; GitHub OIDC role. **No infrastructure code exists yet** | TFW-38, 40 |
| **TfW systems / RISQS / Sentinel-CSCS providers** | Obtain API access and credentials; adapters are not built | TFW-13 to 18, 33 to 35 |
| **Email service** | A UK-resident sender for notifications; not built | TFW-05 |
| **Monitoring / uptime / error tracking** | None chosen. Any tool must be UK-resident or approved in the DPIA | none |
| **Password manager** | Hold every secret the vendor generates; nothing is emailed or pasted into chat | none |

## 9. Order of operations

1. GitHub repo, settings, CODEOWNERS (section 4). 2. First pull request, all checks green. 3. Netlify preview (section 5). 4. Render staging (section 6). 5. Apply TfW values as they arrive (`apply-tfw-values.mjs`). 6. Build the Entra adapter, database store, live adapters. 7. AWS production. 8. `verify-placeholders.mjs --go-live` must pass.

## 10. What a reviewer can still legitimately raise today

I cannot make this unflaggable, and I will not hide these:

1. Identity is simulated; the Entra adapter does not exist.
2. The store and audit log are in memory (lost on restart; no retention job).
3. GitHub Actions use version tags, not commit hashes (needs network access to pin; Dependabot can maintain them once pinned).
4. One shared synthetic password for all test users (acceptable only because real data is refused).
5. Render (Frankfurt) is not UK-resident; allowed here only because it is synthetic-only.
6. No penetration test, accessibility audit, load test or restore test has been run.
7. Welsh text is an unreviewed draft.
8. The 12 evidence documents are honest templates, not evidence.
9. The web UI is a simulation and does not call the API.
10. No infrastructure-as-code for AWS exists.

## 11. Checks to run after every step

```
node scripts/verify-placement.mjs
node scripts/verify-placeholders.mjs
node scripts/sync-csp.mjs --check
node scripts/preview-safety-check.mjs
(cd apps/portal-api && npm test)
node --test tests/replacement.test.mjs
```
