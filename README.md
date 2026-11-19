**New here? Read `docs/handover/START_HERE_PLAIN_ENGLISH.md` first.**

# TfW Contractors Portal (working build, synthetic data)

Contractor safety and compliance portal for railway sites. Enforces the safety chain on the server (company insurance and RISQS, then site induction, approved RAMS, authorised permit-to-work, then live QR roll call) and records every decision in a tamper-evident audit log. English and Welsh throughout. Built by the FST.

> **Status: test build.** Invented data, simulated sign-in, in-memory storage. Not connected to real TfW, Microsoft Entra ID, RISQS or card-scheme systems, and not approved for real data. See the limits below.

## How it fits together

```
 Worker's phone / browser ──►  Netlify: web/ (static page)  ──►  Render: apps/portal-api (engine)
                                      │                                  │
                                      └──────── both built from this GitHub repository
 Real production (later): AWS eu-west-2 (London). Render and Netlify never hold real data.
```

## What is in the repository

| Path | What it is |
|---|---|
| `apps/portal-api/` | Engine: hard-stop guard, permits, RAMS, QR check-in, audit chain, roles, EN/CY messages. Zero third-party dependencies |
| `web/` | The web app (single page, strict security policy) |
| `config/` | `tenant.config.json` (every TfW-specific value) and the replacement registry |
| `scripts/` | CSP sync, preview safety check, registry verify/generate/apply, placement check |
| `tests/` | End-to-end journey tests and tooling tests |
| `docs/` | Evidence templates, architecture, operations, handover guides |
| `.github/` | CI, CODEOWNERS, Dependabot |
| `netlify.toml`, `render.yaml` | Hosting configuration |

## Run it on your computer (Node 20 or newer)

```
npm run verify                # structure, registry, security-hash and safety checks
npm test                      # everything: 22 API tests + journeys + tooling
export AUDIT_HMAC_KEY=$(openssl rand -hex 32) QR_SIGNING_KEY=$(openssl rand -hex 32) SIMULATED_USER_PASSWORD=$(openssl rand -hex 12)
npm start                     # engine on http://localhost:3000  (PowerShell: see START_HERE guide)
```

## Settings

- **Environment variables** (Render): `NODE_VERSION`, `DATA_CLASSIFICATION`, `TRUST_PROXY`, `AUDIT_HMAC_KEY`, `QR_SIGNING_KEY`, `SIMULATED_USER_PASSWORD`, and optionally `EXTRA_ALLOWED_ORIGINS`. Full table in `docs/handover/START_HERE_PLAIN_ENGLISH.md`.
- **TfW details** go in `config/tenant.config.json` through `node scripts/apply-tfw-values.mjs` (see `docs/handover/TFW_REPLACEMENT_REGISTER.md`).
- **Before real use:** `node scripts/verify-placeholders.mjs --go-live` must pass. It fails today by design.

## Security posture (what is and is not true)

Built in: server-side hard-stops re-checked at execution; contractor isolation; role-based access; single-use QR challenges bound to the worker; hash-chained audit log; rate limiting and lockout; strict Content Security Policy by hash; no browser storage; startup refusal of real data unless UK-resident and non-simulated identity.

Not done: independent penetration test, accessibility audit, load test; Entra ID sign-in, live integrations, persistent database and AWS infrastructure are not built; Welsh text is an unreviewed draft. Details: `docs/handover/PLACEMENT_AND_CONNECTION_GUIDE.md` section 10.

## Licence

Proprietary. Licence terms to be agreed with the client; no open-source licence is granted by this repository.
