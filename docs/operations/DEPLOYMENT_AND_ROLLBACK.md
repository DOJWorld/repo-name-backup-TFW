# Deployment and Rollback
> **Document status:** DRAFT v0.1 (2026-11-16). Produced from the master engineering prompt only. The repository, TECHNICAL_SPEC.md, traceability-matrix.md, DPIA-TFW0957.md and compliance-guard.service.ts had NOT been supplied at authoring time. Every item marked `NOT EVIDENCED` must be completed from real files, executed tests or recorded outputs before this document is relied on. No result in this document has been fabricated.
>
> **Status legend:** `NOT EVIDENCED` (nothing verified) | `PLANNED` (design intent, unverified) | `VERIFIED` (executed/inspected, evidence ref given) | `OUTSTANDING` (known gap) | `DECISION REQUIRED`

## 1. Environments
| Env | Location | Data | Purpose |
|---|---|---|---|
| Local | Developer | Synthetic | Development |
| Netlify preview | Netlify | Synthetic only, static UI | UI review; never APIs, DB, real records or credentials |
| Staging | AWS eu-west-2 | Synthetic or approved masked | Pre-release verification |
| Production | AWS eu-west-2 | Real | Live service |

## 2. Pipeline gates (target; existing workflow not yet reviewed)
Lint/format, type check, unit, integration, compliance regression, SAST, SCA, secret scan, IaC validation, build, i18n completeness, a11y scan, staging deploy, smoke tests, manual production approval (change record), post-deploy smoke tests. Critical/High security or compliance failures block release. Exceptions require documented risk acceptance.

## 3. Deployment procedure
NOT EVIDENCED (IaC and workflows not supplied). Required content: prerequisites, approvals, migration order, deploy steps, smoke-test list, verification of region.

## 4. Rollback
| Scenario | Action | Owner | Tested |
|---|---|---|---|
| Bad application release | Redeploy previous signed artefact | NOT EVIDENCED | NOT RUN |
| Failed migration | Backward-compatible migrations; restore from snapshot if needed | NOT EVIDENCED | NOT RUN |
| Compliance regression found | Disable affected endpoint or roll back; never relax the guard | NOT EVIDENCED | NOT RUN |

## 5. Backup and restore
RPO/RTO: DECISION REQUIRED. Last successful restore test: NOT RUN.
