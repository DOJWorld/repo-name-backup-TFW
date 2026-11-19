# Threat Model: TFW Contractors Portal
> **Document status:** DRAFT v0.1 (2026-11-16). Produced from the master engineering prompt only. The repository, TECHNICAL_SPEC.md, traceability-matrix.md, DPIA-TFW0957.md and compliance-guard.service.ts had NOT been supplied at authoring time. Every item marked `NOT EVIDENCED` must be completed from real files, executed tests or recorded outputs before this document is relied on. No result in this document has been fabricated.
>
> **Status legend:** `NOT EVIDENCED` (nothing verified) | `PLANNED` (design intent, unverified) | `VERIFIED` (executed/inspected, evidence ref given) | `OUTSTANDING` (known gap) | `DECISION REQUIRED`

## 1. Scope and method
STRIDE per trust boundary, mapped to OWASP API Security Top 10 (2023) and ASVS families. Scope: browser/mobile client, API, database, document store, audit store, Entra ID, TfW adapters, CI/CD, AWS eu-west-2, Netlify static preview.

## 2. Trust boundaries
| ID | Boundary | Notes |
|---|---|---|
| TB1 | Internet to CDN/WAF/ALB | Public attack surface |
| TB2 | Client to API | Client untrusted for all compliance decisions |
| TB3 | API to database / document store | Tenant isolation enforced here |
| TB4 | API to external integrations (Entra ID, TfW, RISQS/certification providers) | Each adapter flagged real vs simulated |
| TB5 | CI/CD to AWS | Supply-chain and deploy-credential risk |
| TB6 | Netlify preview | Synthetic data only; no path to production data |

## 3. Threat register
| # | Threat | STRIDE | OWASP API | Planned control | Impl. ref | Test ref | Status |
|---|---|---|---|---|---|---|---|
| T01 | Unauthorised API access | S/E | API2 | Entra ID OIDC, short-lived tokens, server-side session validation | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T02 | Privilege escalation | E | API5 | RBAC, deny-by-default, role changes audited | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T03 | Contractor-to-contractor exposure / IDOR | I | API1 | Tenant ID from session never request; row-level scoping; opaque IDs | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T04 | Account takeover | S | API2 | MFA via Entra, lockout, anomaly alerts | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T05 | Session hijack / expired session reuse | S | API2 | Secure cookie/token binding, server-side revocation | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T06 | Hard-stop bypass via direct API or edited JS | T/E | API5, API6 | Guard evaluated server-side on every sensitive op; frontend advisory only | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T07 | Expiry manipulation / client clock | T | API6 | Server UTC time only; check at authorisation and execution; defined expiry semantics | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T08 | Race: concurrent permit/sign-in; expiry between check and act | T | API6 | Single transaction, locking/versioning, re-evaluate at commit | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T09 | QR replay / cloning / screenshot sharing | S/T | API2 | Signed rotating tokens, single-use nonce, site and worker binding, no PII in QR | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T10 | Offline bypass of live checks | T | API6 | No offline authorisation; explicit refusal; only spec-approved contingency | DECISION REQUIRED | NOT EVIDENCED | DECISION REQUIRED |
| T11 | Injection | T | API8 | Parameterised queries, schema validation | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T12 | XSS incl. via translation strings | T | API8 | Output encoding, CSP, no raw HTML in translations | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T13 | CSRF | T | API2 | SameSite; CSRF token if cookie auth | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T14 | Malicious file upload | T/I | API8 | Allow-list, content sniffing, AV scan, isolated UK bucket | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T15 | Audit log tampering | R/T | API8 | Append-only, hash chain, restricted writer, separate account | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T16 | Sensitive data in logs/URLs/QR/analytics | I | API3 | Redaction, minimisation, no PII in URLs | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T17 | DoS / API abuse | D | API4 | WAF, rate limits, payload limits, timeouts | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T18 | Supply-chain compromise | T | API10 | Lockfiles, SCA, SBOM, CI actions pinned by SHA | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T19 | Cloud misconfiguration | I/E | n/a | IaC validation, AWS Config, no public stores, SCP limiting to eu-west-2 | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T20 | Secrets exposure | I | n/a | Secrets Manager (eu-west-2), CI secret scanning | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T21 | Unvetted integration / subprocessor | I | API10 | Integration register, processor review, egress allow-list | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T22 | Production data in Netlify preview | I | n/a | Synthetic-data build guard; no prod env vars in Netlify | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T23 | Telemetry / support access exporting data outside UK | I | n/a | Review each SDK and vendor region | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T24 | Unauthorised permit approval | E | API5 | Approver role, separation of duties, guard re-check | NOT EVIDENCED | NOT EVIDENCED | PLANNED |
| T25 | Reuse of revoked permit/authorisation | T | API6 | State machine; revocation checked at point of use | NOT EVIDENCED | NOT EVIDENCED | PLANNED |

## 4. Residual risk
Cannot be assessed until implementation is reviewed. Owner, treatment and acceptance date per OUTSTANDING item: NOT EVIDENCED.

## 5. Completion checklist
- [ ] Fill Impl. ref and Test ref from real files
- [ ] Add threats found in code review
- [ ] Reconcile with TECHNICAL_SPEC.md security section
