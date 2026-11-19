# TfW Replacement Register

> **Generated** by `node scripts/gen-replacement-register.mjs` from `config/replacement-registry.json` and the real files. Do not edit by hand. Line numbers are computed from the files as they are now. `node scripts/verify-placeholders.mjs` fails CI if this register and the code disagree.

Everything below is a **working default** that lets the portal run today with synthetic data. TfW supplies or decides the real value; replace it in the place shown.

## How to replace (safe method)

1. Copy `config/tfw-values.example.json`, fill in only the IDs you have, save as `tfw-values.json` (never commit it if it holds anything sensitive).
2. Preview: `node scripts/apply-tfw-values.mjs tfw-values.json` (changes nothing).
3. Apply: `node scripts/apply-tfw-values.mjs tfw-values.json --write` (validates formats, edits files, re-syncs CSP hashes, regenerates this register, re-verifies).
4. Before go-live: `node scripts/verify-placeholders.mjs --go-live` must pass. It lists every placeholder or simulation still present.

## A. Values in the repository (machine-verified)

| ID | Name | Current working value | Where (file:line, JSON path) | Also appears in | Supplied by | Format | Effect / when to change |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TFW-01 | Product name | `TfW Contractors Portal` | `config/tenant.config.json:3` `branding.productName` | `web/index.html:10,111` | TfW communications / product owner | `text` | Shown in page titles and emails. Confirm the official product name. |
| TFW-02 | Legal entity name | `Transport for Wales` | `config/tenant.config.json:4` `branding.legalEntity` | none | TfW legal / procurement | `text` | Used in legal notices and emails. Confirm exact legal entity name for notices and DPIA references. |
| TFW-03 | Support email | `support@portal.example.invalid` | `config/tenant.config.json:5` `branding.supportEmail` | none | TfW service desk | `email` | Shown to users in error and help text. Replace with the real helpdesk mailbox. |
| TFW-04 | Security contact email | `security@portal.example.invalid` | `config/tenant.config.json:6` `branding.securityEmail` | `SECURITY.md:2` | TfW security team | `email` | Security policy contact. Replace with the real vulnerability-reporting mailbox. |
| TFW-05 | Notification sender email | `no-reply@portal.example.invalid` | `config/tenant.config.json:7` `branding.senderEmail` | none | TfW IT / DNS admin | `email` | From-address for notifications. Replace; domain needs SPF, DKIM and DMARC configured. |
| TFW-06 | Portal base URL (web origin) | `https://portal.example.invalid` | `config/tenant.config.json:10` `urls.portalBaseUrl` | none | TfW IT / DNS admin | `https-origin` | CORS allow-list on the API, Entra redirect URI. Must equal the address people open the web page at. Set to the real portal domain (no path, no trailing slash). |
| TFW-07 | API base URL | `https://tfw-portal-api.onrender.com` | `config/tenant.config.json:11` `urls.apiBaseUrl` | `web/index.html:5,8`<br>`netlify.toml:18` | Vendor (AWS) with TfW DNS | `https-origin` | Where the web page sends its requests (page meta tag + security policy in index.html and netlify.toml). Set to the real API domain. |
| TFW-08 | Extra allowed web origins | `[]` | `config/tenant.config.json:12` `urls.extraAllowedOrigins` | none | TfW IT | `https-origins` | Extra CORS allow-list entries (default none). Only if additional front-end origins are approved. |
| TFW-09 | Identity mode | `simulated` | `config/tenant.config.json:15` `identity.mode` | none | Vendor + TfW | simulated / entra | simulated = synthetic logins; entra = real sign-in (adapter NOT built yet: app refuses to start in entra mode). Change to entra ONLY after the Entra adapter is built and tested. |
| TFW-10 | Entra tenant ID | `00000000-0000-0000-0000-000000000000` | `config/tenant.config.json:17` `identity.entra.tenantId` | none | TfW Entra administrator | `guid` | Token issuer / authority. Replace with TfW directory (tenant) ID. |
| TFW-11 | Entra application (client) ID | `00000000-0000-0000-0000-000000000001` | `config/tenant.config.json:18` `identity.entra.clientId` | none | TfW Entra administrator | `guid` | OIDC client identity. Replace with the app registration client ID. |
| TFW-12 | Entra group to role map | `{"00000000-0000-0000-0000-0000000000a1":"tfw_admin","00000000-0000-0000-0000-0000000000a2":"contractor_admin","00000000-0000-0000-0000-0000000000a3":"site_manager","00000000-0000-0000-0000-0000000000a4":"safety_officer","00000000-0000-0000-0000-0000000000a5":"permit_approver","00000000-0000-0000-0000-0000000000a6":"worker","00000000-0000-0000-0000-0000000000a7":"auditor","00000000-0000-0000-0000-0000000000a8":"support"}` | `config/tenant.config.json:20` `identity.entra.groupRoleMap` | none | TfW Entra administrator | `guid-role-map` | Maps directory groups to the 8 portal roles. Replace each group object ID with the real security group for that role. |
| TFW-13 | TfW systems integration mode | `simulated` | `config/tenant.config.json:34` `integrations.tfw.mode` | none | Vendor + TfW | simulated / live | Controls whether calls are simulated. Set live only when formal API access exists and adapter is tested. |
| TFW-14 | TfW systems API base URL | `https://tfw-api.example.invalid` | `config/tenant.config.json:35` `integrations.tfw.baseUrl` | none | TfW integration team | `https-origin` | Integration endpoint. Replace with TfW API host. |
| TFW-15 | RISQS verification mode | `simulated` | `config/tenant.config.json:38` `integrations.risqs.mode` | none | Vendor + provider | simulated / live | Controls simulation. Set live only with provider access. |
| TFW-16 | RISQS provider API base URL | `https://risqs.example.invalid` | `config/tenant.config.json:39` `integrations.risqs.baseUrl` | none | RISQS provider | `https-origin` | Integration endpoint. Replace with provider host. |
| TFW-17 | Sentinel/CSCS verification mode | `simulated` | `config/tenant.config.json:42` `integrations.cards.mode` | none | Vendor + provider | simulated / live | Controls simulation. Set live only with provider access. |
| TFW-18 | Sentinel/CSCS provider API base URL | `https://cards.example.invalid` | `config/tenant.config.json:43` `integrations.cards.baseUrl` | none | Card scheme provider | `https-origin` | Integration endpoint. Replace with provider host. |
| TFW-19 | Expiry semantics | `end_of_day_utc` | `config/tenant.config.json:47` `policy.expirySemantics` | none | TfW safety / SMS-OCC-003 owner | end_of_day_utc / exact_instant_utc | end_of_day_utc: valid through the whole expiry date; exact_instant_utc: valid until 00:00 UTC on that date. Confirm against the technical specification (DECISION REQUIRED). |
| TFW-20 | Cards required for sign-in | `["sentinel","cscs"]` | `config/tenant.config.json:48` `policy.requiredCards` | none | TfW safety | `card-list` | Guard denies sign-in when a listed card is missing or expired. Confirm which cards are mandatory. |
| TFW-21 | QR challenge lifetime (seconds) | `60` | `config/tenant.config.json:52` `policy.qrChallengeTtlSeconds` | none | TfW safety / security | `int:15-300` | How long a scanned check-in remains valid. Confirm against specification. |
| TFW-22 | Session idle timeout (minutes) | `30` | `config/tenant.config.json:53` `policy.sessionIdleMinutes` | none | TfW security | `int:5-120` | Auto sign-out after inactivity. Confirm against specification. |
| TFW-23 | Session absolute lifetime (minutes) | `480` | `config/tenant.config.json:54` `policy.sessionAbsoluteMinutes` | none | TfW security | `int:30-1440` | Maximum session length. Confirm against specification. |
| TFW-24 | Permit validity (hours) | `12` | `config/tenant.config.json:55` `policy.permitValidityHours` | none | TfW safety | `int:1-72` | Authorised permit expires after this period. Confirm against specification. |
| TFW-25 | Audit retention (days) | `2555` | `config/tenant.config.json:56` `policy.auditRetentionDays` | none | TfW DPO / contract | `int:30-3650` | Retention target; deletion job is not built yet. Set from the DPIA / contract (DECISION REQUIRED). |
| TFW-26 | Site list | `[{"code":"SITE-001","name":"Demo Depot North"},{"code":"SITE-002","name":"Demo Junction South"}]` | `config/tenant.config.json:63` `sites` | none | TfW operations | `site-list` | Valid sites for permits, QR poster URLs and roll call. Replace with real sites: code (A-Z, 0-9, hyphen, 3-20 chars) and display name. |
| TFW-41 | "Built by" credit line | `Built by the FST` | `web/index.html:111` (literal) | (replace every occurrence in the file) | Vendor (the FST) | `text` | Shown in the page header and footer. Change only if the credit wording changes; the Welsh wording is in the P table (TFW-30). |
| TFW-27 | GitHub organisation handle prefix | `@ORG/` | `.github/CODEOWNERS:1,2,3,4,5,6,7,8` (literal) | (replace every occurrence in the file) | Repository owner (vendor, then TfW if transferred) | `github-handle-prefix` | Mandatory code-owner review on safety-critical paths. Replace @ORG/ with the real @organisation/ prefix; teams safety-compliance, security, data-protection, frontend must exist. |
| TFW-28 | Welsh translation review status | `draft-unreviewed` | `apps/portal-api/src/locales/cy.json:4` `_meta.reviewStatus` | none | TfW Welsh-language reviewer | draft-unreviewed / reviewed / approved | Go-live check fails until approved. Set to approved only after a qualified reviewer signs off every string. |

## B. Text to replace wholesale

| ID | Name | File | Supplied by | What to do |
| --- | --- | --- | --- | --- |
| TFW-29 | Welsh API messages | `apps/portal-api/src/locales/cy.json` | TfW Welsh-language reviewer / translation service | Replace every value with approved Welsh (keep keys identical to en.json) |
| TFW-30 | Welsh UI strings (web) | `web/index.html` | TfW Welsh-language reviewer / translation service | Replace the Welsh (second) string in every pair of the P table in the inline script, and the Welsh sentence in the loading message inside <div id="app">; then run node scripts/sync-csp.mjs |

## C. Values set outside the repository (not machine-verifiable)

| ID | Name | Where it is set | Supplied by | When / effect | Secret? |
| --- | --- | --- | --- | --- | --- |
| TFW-31 | ENTRA_CLIENT_SECRET (or certificate) | AWS Secrets Manager (eu-west-2) -> API task environment; not used while identity.mode=simulated | TfW Entra administrator | Needed only when the Entra adapter is built and identity.mode=entra. Confidential-client authentication to Entra. | **Yes**: never commit |
| TFW-32 | Entra app registration redirect URI | Entra admin centre -> App registrations -> Authentication. Value: <urls.portalBaseUrl>/auth/callback | TfW Entra administrator | Register exactly the derived redirect URI. Entra rejects mismatched redirect URIs. | No |
| TFW-33 | TFW_API_CLIENT_ID / TFW_API_CLIENT_SECRET | AWS Secrets Manager (eu-west-2) | TfW integration team | Needed only when integrations.tfw.mode=live. Authenticates the portal to TfW systems. | **Yes**: never commit |
| TFW-34 | RISQS_API_KEY | AWS Secrets Manager (eu-west-2) | RISQS provider | Needed only when integrations.risqs.mode=live. Authenticates to RISQS provider. | **Yes**: never commit |
| TFW-35 | CARDS_API_KEY | AWS Secrets Manager (eu-west-2) | Sentinel/CSCS provider | Needed only when integrations.cards.mode=live. Authenticates to card verification provider. | **Yes**: never commit |
| TFW-36 | Custom domain for the web preview/site | Netlify -> Site configuration -> Domain management (preview only); production web domain via TfW DNS | TfW IT / DNS admin | When TfW assigns the domain. Public hostname. | No |
| TFW-37 | DNS records (portal, API, email SPF/DKIM/DMARC) | TfW DNS provider | TfW IT / DNS admin | When domains are assigned. Name resolution and email authentication. | No |
| TFW-38 | AWS_ROLE_ARN | GitHub -> Settings -> Environments -> production -> Variables (not a secret) | Vendor AWS administrator | When the AWS account/role is created. OIDC deploy role for production. | No |
| TFW-39 | RENDER_DEPLOY_HOOK_URL | GitHub -> Settings -> Environments -> staging -> Secrets | Vendor | Only if Render staging is deployed via hook. Triggers synthetic staging deploy. | **Yes**: never commit |
| TFW-40 | Remove SIMULATED_USER_PASSWORD; set DATA_CLASSIFICATION=real | Production runtime environment only (AWS) | Vendor, approved by TfW | At go-live, after identity.mode=entra works. Simulated logins must not exist in a real-data environment (app refuses real data with simulated identity). | No |
| TFW-42 | EXTRA_ALLOWED_ORIGINS (the address the web page is opened at) | Render > service > Environment > EXTRA_ALLOWED_ORIGINS. Value = the Netlify address, for example https://your-site.netlify.app (no slash; up to 5, comma-separated) | Vendor | Whenever the web page is moved to a new address. Not needed once TFW-06 holds the real portal address. Lets the engine accept requests from that web page (CORS). | No |

## D. Fixed: do NOT change

| File | Path | Why |
| --- | --- | --- |
| `config/tenant.config.json` | `identity.entra.redirectPath` | Route implemented by the API; changing requires code change |
| `config/tenant.config.json` | `policy.integrationFailMode` | Engine only supports fail-closed |
| `config/tenant.config.json` | `policy.rateLimitPerMinute` | Vendor security tunable; change via security review |
| `config/tenant.config.json` | `policy.loginRateLimitPerMinute` | Vendor security tunable |
| `config/tenant.config.json` | `policy.maxLoginFailures` | Vendor security tunable |
| `config/tenant.config.json` | `policy.lockoutMinutes` | Vendor security tunable |
| `config/tenant.config.json` | `residency.requiredRegion` | Principle A: UK data sovereignty (eu-west-2). Not changeable |

## E. Known work remaining before real TfW values can be used

- **Entra ID adapter is not built.** Setting `identity.mode` to `entra` makes the API refuse to start. It needs OIDC authorisation-code + PKCE, JWT validation against the tenant JWKS, and group-to-role mapping from TFW-12.
- **Live integrations are not built** (TfW systems, RISQS, Sentinel/CSCS). The `mode` switches exist; the adapters do not.
- **Database is in-memory** (`apps/portal-api/src/store.js`); production needs the UK-resident database behind the same interface, with transactions or row locks.
- **Audit log is in-memory**; production needs append-only UK-resident storage and a retention/deletion job (TFW-25).
- **Welsh text is an unreviewed draft** (TFW-28 to TFW-30).
- **Web UI is still the standalone simulation**; it is not yet calling the API.
