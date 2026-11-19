# Compliance Evidence Register
> **Document status:** DRAFT v0.1 (2026-11-16). Produced from the master engineering prompt only. The repository, TECHNICAL_SPEC.md, traceability-matrix.md, DPIA-TFW0957.md and compliance-guard.service.ts had NOT been supplied at authoring time. Every item marked `NOT EVIDENCED` must be completed from real files, executed tests or recorded outputs before this document is relied on. No result in this document has been fabricated.
>
> **Status legend:** `NOT EVIDENCED` (nothing verified) | `PLANNED` (design intent, unverified) | `VERIFIED` (executed/inspected, evidence ref given) | `OUTSTANDING` (known gap) | `DECISION REQUIRED`

## 1. Purpose
Single register linking each requirement to implementation, test and evidence. A requirement is `VERIFIED` only when backend enforcement exists, an automated test was executed with a recorded result, and an evidence artefact is referenced. UI status indicators are never evidence.

## 2. Register
Requirement IDs must be copied from `traceability-matrix.md`. None have been invented here.

| Req ID | Description | Appendix | Backend impl. | Frontend repr. | Test ref | Last run | Result | Evidence ref | Outstanding issue | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| (from matrix) | | A | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | never | NOT RUN | NOT EVIDENCED | Matrix not supplied | NOT EVIDENCED |

## 3. Evidence types
Executed test report (with commit SHA), CI run URL, signed audit export, IaC plan output, region-confirmation output (e.g. AWS CLI/Config), scan reports, DPIA action log, formal TfW approvals (only if actually issued).

## 4. Claims explicitly NOT made
TfW approval; certification of any kind; UK GDPR compliance; live Entra ID, TfW or RISQS integration.

## 5. Completion checklist
- [ ] Import all requirement IDs from the matrix
- [ ] Link each to real file paths and test names
- [ ] Attach execution results with commit SHAs
