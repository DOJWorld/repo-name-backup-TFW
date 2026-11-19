# Environments, Secrets and Platform Setup

**Real secret values are not supplied here, by design.** Anything typed into a chat or committed to a repo should be treated as exposed. Generate each value yourself with the commands below and store it only in the platform named.

> **Update (supersedes parts of section 2):** the API now reads only `PORT`, `DATA_CLASSIFICATION`, `AWS_REGION`, `AUDIT_HMAC_KEY`, `QR_SIGNING_KEY`, `SIMULATED_USER_PASSWORD`, `TRUST_PROXY` and optional `TENANT_CONFIG`. Sessions use random opaque tokens, so `SESSION_SECRET` is not used. Policy values (timeouts, TTLs, retention) and all TfW-specific values live in `config/tenant.config.json` and are listed in `docs/handover/TFW_REPLACEMENT_REGISTER.md`. Rows below for variables the code does not read are future requirements.

## 1. Which platform holds what
| Platform | Role | May hold real data? | Holds |
|---|---|---|---|
| GitHub | Source, CI, change control | No | Code, workflows, CODEOWNERS. Secrets only for CI (table 3) |
| Netlify | Static UI preview | **Never** | `web/` only, synthetic data. No functions, forms, Identity, Analytics, env secrets |
| Render | Synthetic-data API staging | **Never** (no UK region; Frankfurt is EU, not UK) | API with `DATA_CLASSIFICATION=synthetic` and simulated integrations |
| AWS eu-west-2 | Production and UK staging | Yes, after DPIA actions closed | API, DB, S3, KMS, Secrets Manager, CloudWatch, backups |

## 2. Variables and how to obtain values
Generate a secret: `openssl rand -base64 48`

| Variable | Netlify | Render (synthetic) | AWS prod (Secrets Manager / task env) | Value / source |
|---|---|---|---|---|
| NODE_VERSION | 20 | n/a | n/a | fixed |
| PREVIEW_DATA_CLASS | synthetic | n/a | n/a | fixed |
| APP_ENV | n/a | staging | production | fixed per env |
| DATA_CLASSIFICATION | n/a | synthetic | real | fixed per env; guard refuses mismatch |
| ENFORCE_DATA_CLASS_GUARD | n/a | true | true | fixed |
| AWS_REGION | n/a | n/a | eu-west-2 | fixed |
| ALLOWED_ORIGINS | n/a | Netlify preview origin | production web origin only | your URLs, no wildcards |
| DATABASE_URL | never | synthetic DB only | RDS in eu-west-2, TLS required, secret in Secrets Manager | from DB provisioning (engine to confirm from your schema) |
| SESSION_SECRET | never | generateValue | Secrets Manager | `openssl rand -base64 48`, distinct per environment |
| QR_SIGNING_KEY | never | generateValue | Secrets Manager (prefer KMS-managed signing) | as above, distinct |
| AUDIT_HMAC_KEY | never | generateValue | Secrets Manager / KMS | as above, distinct |
| SESSION_TTL_MINUTES / SESSION_ABSOLUTE_TTL_MINUTES | n/a | 30 / 480 | 30 / 480 | proposed defaults: confirm against spec |
| QR_TOKEN_TTL_SECONDS | n/a | 60 | 60 | proposed default: confirm against spec |
| ENTRA_MODE | n/a | simulated | live only once TfW issues app registration | fixed |
| ENTRA_TENANT_ID, ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET (or certificate), ENTRA_REDIRECT_URI | never | leave empty | Secrets Manager | issued by the TfW Entra administrator |
| TFW_API_MODE, RISQS_MODE | n/a | simulated | live only with formal access | fixed |
| TFW_API_BASE_URL / CLIENT_ID / CLIENT_SECRET | never | empty | Secrets Manager | issued by TfW |
| INTEGRATION_FAIL_MODE | n/a | closed | closed | deny on integration failure (confirm in spec) |
| DOCUMENT_BUCKET, KMS_KEY_ID | never | not used | eu-west-2 S3 + KMS | from IaC outputs |
| RATE_LIMIT_WINDOW_SECONDS / RATE_LIMIT_MAX | n/a | 60 / 100 | tune after load test | proposed defaults |
| TRUST_PROXY | n/a | 1 | match actual proxy hops | verify |
| AUDIT_RETENTION_DAYS | n/a | n/a | DECISION REQUIRED | from DPIA / contract |
| LOG_LEVEL, DEFAULT_LOCALE, SUPPORTED_LOCALES | n/a | info, en, en,cy | same | fixed |

Never set on Netlify: DATABASE_URL, any secret, key, token or credential, real URLs of production APIs.

## 3. GitHub setup
1. Create a private repo; push this package alongside your existing code (merge `.github/`, `scripts/`, `web/`, `netlify.toml`, `render.yaml`, `.env.example`, `.gitignore`, `SECURITY.md`).
2. Settings, Code security: enable Dependency graph, Dependabot alerts and security updates, Secret scanning, **Push protection**, Code scanning (CodeQL via workflow).
3. Branch protection on `main`: require PR, 2 approvals, CODEOWNERS review, required status checks (`preview-safety`, `secrets`, `codeql`, `api`), up-to-date branches, signed commits, no force-push, no deletion, applies to admins.
4. Environments: `staging` (required reviewer), `production` (two required reviewers, restricted to `main`).
5. Actions secrets: `GITLEAKS_LICENSE` (org repos). If you trigger Render via deploy hook: `RENDER_DEPLOY_HOOK_URL` as a **staging environment** secret only.
6. AWS deploys: use GitHub OIDC to an IAM role (store `AWS_ROLE_ARN` as an environment variable); never long-lived AWS keys.
7. Pin every Action to a commit SHA (let Dependabot maintain); the workflow uses version tags as shipped and that is a known gap until pinned.
8. Replace `@ORG/...` handles in CODEOWNERS.

## 4. Netlify setup
Connect the GitHub repo; build command and publish dir come from `netlify.toml`. Disable: Functions, Forms, Identity, Analytics, Split Testing, Deploy Notifications containing data. Set deploy previews to require authentication (Netlify password/SSO protection) if the plan allows. After any change to inline CSS/JS run `node scripts/sync-csp.mjs`; CI fails if hashes drift.

## 5. Render setup
Create from `render.yaml` (Blueprint). Fill the `sync: false` variables in the dashboard. Auto-deploy is off. Do not attach real data. Region is permanent once created.

## 6. AWS eu-west-2 (production): not included in this package
No IaC existed to review, so none is invented. Required before any real data: SCP denying non-eu-west-2 regions, KMS CMKs, S3 Block Public Access and Object Lock for audit, RDS encrypted with Multi-AZ, Secrets Manager rotation, WAF, CloudTrail/Config, backups restore-tested, and an approved disaster-recovery location.

## 7. Verified vs not verified (this package)
| Item | State |
|---|---|
| `web/index.html` passes `preview-safety-check.mjs` (0 violations) | Executed here |
| Checker rejects fetch/localStorage/innerHTML/external URL/secret in a deliberate bad file (5 violations, exit 1) | Executed here |
| CSP hashes in sync between index.html and netlify.toml | Executed here |
| Inline script JS syntax valid | Executed here |
| Netlify, Render, GitHub configuration actually applied; CI run on GitHub; Render build | **Not run** |
| render.yaml build/start commands match your API | **Assumption** |
| Penetration test, ASVS assessment, WCAG audit, Welsh review | **Not done** |

## 8. Residual risk
No deployment is unhackable. Remaining exposure includes unreviewed API code, third-party dependencies, compromised maintainer accounts, misconfigured cloud resources, insider misuse, and zero-days. Controls above reduce likelihood and impact; they do not remove them.
