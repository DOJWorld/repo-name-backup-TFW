# Integration Register
> **Document status:** DRAFT v0.1 (2026-11-16). Produced from the master engineering prompt only. The repository, TECHNICAL_SPEC.md, traceability-matrix.md, DPIA-TFW0957.md and compliance-guard.service.ts had NOT been supplied at authoring time. Every item marked `NOT EVIDENCED` must be completed from real files, executed tests or recorded outputs before this document is relied on. No result in this document has been fabricated.
>
> **Status legend:** `NOT EVIDENCED` (nothing verified) | `PLANNED` (design intent, unverified) | `VERIFIED` (executed/inspected, evidence ref given) | `OUTSTANDING` (known gap) | `DECISION REQUIRED`

Rule: every integration shows Live / Simulated / Not started. A simulation must be visibly labelled in code, UI and API responses.

| ID | System | Purpose | Status | Auth mechanism | Permissions | Data exchanged | Data owner | Timeout | Retry | Rate limit | Audit events | Credentials needed | Adapter file |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| INT-01 | Microsoft Entra ID | Staff/contractor authentication | NOT EVIDENCED | OIDC/OAuth2 (planned) | NOT EVIDENCED | Identity claims | TfW / NOT EVIDENCED | TBD | TBD | TBD | Login success/fail | Tenant ID, client ID, secret/cert, redirect URIs | NOT EVIDENCED |
| INT-02 | TfW systems (REST) | Contractor/site data exchange | NOT EVIDENCED (access not yet available per prompt) | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | TBD | TBD | TBD | All calls | NOT EVIDENCED | NOT EVIDENCED |
| INT-03 | RISQS / certification provider | Status verification | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | Supplier status | Provider | TBD | TBD | TBD | Lookups, failures | NOT EVIDENCED | NOT EVIDENCED |
| INT-04 | Sentinel / CSCS verification | Card validity | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | Card status | Scheme owner | TBD | TBD | TBD | Lookups, failures | NOT EVIDENCED | NOT EVIDENCED |
| INT-05 | Email/notification provider | Bilingual notifications | NOT EVIDENCED | NOT EVIDENCED | n/a | Recipient, content | NOT EVIDENCED | TBD | TBD | TBD | Send events | NOT EVIDENCED | NOT EVIDENCED |

## Failure policy (required)
On timeout or error from a verification integration the guard must fail closed (deny with reason code such as upstream-unavailable) unless the specification defines a different, approved behaviour (DECISION REQUIRED).
