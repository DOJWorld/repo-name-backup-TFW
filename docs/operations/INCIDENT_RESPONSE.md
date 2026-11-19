# Incident Response
> **Document status:** DRAFT v0.1 (2026-11-16). Produced from the master engineering prompt only. The repository, TECHNICAL_SPEC.md, traceability-matrix.md, DPIA-TFW0957.md and compliance-guard.service.ts had NOT been supplied at authoring time. Every item marked `NOT EVIDENCED` must be completed from real files, executed tests or recorded outputs before this document is relied on. No result in this document has been fabricated.
>
> **Status legend:** `NOT EVIDENCED` (nothing verified) | `PLANNED` (design intent, unverified) | `VERIFIED` (executed/inspected, evidence ref given) | `OUTSTANDING` (known gap) | `DECISION REQUIRED`

## 1. Roles
Incident lead, security lead, DPO contact, TfW contact, communications. Names: NOT EVIDENCED.

## 2. Severity
| Sev | Examples | Initial response |
|---|---|---|
| 1 | Hard-stop bypass in production; confirmed personal data breach; audit tampering | Immediate; contain, escalate to TfW per contract |
| 2 | Suspected compromise; integration failure causing denials at scale | Within agreed SLA |
| 3 | Contained vulnerability, degraded service | Normal queue |
| 4 | Minor | Backlog |

## 3. Procedure
Detect, triage, contain (revoke sessions/keys, disable endpoint, rotate secrets), preserve evidence (audit and infrastructure logs, UK-resident), eradicate, recover, post-incident review.

## 4. Personal data breach (UK GDPR)
Assess risk to individuals; notify the ICO within 72 hours of becoming aware where required; notify affected individuals where high risk; notify controller/TfW per contract. Notification timelines and contacts: confirm against DPIA and contract (NOT EVIDENCED).

## 5. Safety-specific
If the guard is found to have wrongly allowed sign-in or permit issuance: identify affected records from the audit log, notify site managers for emergency accountability, revoke affected authorisations, and report per SMS-OCC-003 reporting requirements (NOT EVIDENCED).

## 6. Exercises
Tabletop exercise date and outcome: NOT RUN.
