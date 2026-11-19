# Test Execution Report
> **Document status:** DRAFT v0.1 (2026-11-16). Produced from the master engineering prompt only. The repository, TECHNICAL_SPEC.md, traceability-matrix.md, DPIA-TFW0957.md and compliance-guard.service.ts had NOT been supplied at authoring time. Every item marked `NOT EVIDENCED` must be completed from real files, executed tests or recorded outputs before this document is relied on. No result in this document has been fabricated.
>
> **Status legend:** `NOT EVIDENCED` (nothing verified) | `PLANNED` (design intent, unverified) | `VERIFIED` (executed/inspected, evidence ref given) | `OUTSTANDING` (known gap) | `DECISION REQUIRED`

## 1. Execution log
| Run ID | Date (UTC) | Commit SHA | Environment | Command | Total | Passed | Failed | Skipped | CI URL |
|---|---|---|---|---|---|---|---|---|---|
| (no runs recorded) | | | | | | | | | |

## 2. Suites
| Category | Scope | Suite location | Last run | Result |
|---|---|---|---|---|
| Unit | Compliance guard, expiry, authz, permits, QR validation, i18n, audit events | NOT EVIDENCED | never | NOT RUN |
| Integration | AuthN, API authz, DB transactions, contractor isolation, documents, workflows, QR, adapters | NOT EVIDENCED | never | NOT RUN |
| Security | See SECURITY_TEST_RESULTS.md | NOT EVIDENCED | never | NOT RUN |
| Negative (chain-break) | See SMS_OCC_003_COVERAGE_REPORT.md section 3 | NOT EVIDENCED | never | NOT RUN |
| Regression | Pre-existing functionality baseline | NOT EVIDENCED | never | NOT RUN |
| Accessibility | WCAG 2.2 AA | NOT EVIDENCED | never | NOT RUN |
| Bilingual | Major workflows in EN and CY | NOT EVIDENCED | never | NOT RUN |
| Performance | API latency, query efficiency, concurrency | NOT EVIDENCED | never | NOT RUN |
| Resilience | Timeouts, restart, failure recovery, backup restore | NOT EVIDENCED | never | NOT RUN |

## 3. Baseline requirement
Before any change, run the existing suite and record the baseline here so regressions are provable.

## 4. Defects
| ID | Found by | Severity | Description | Fix commit | Re-test result |
|---|---|---|---|---|---|
| (none recorded) | | | | | |

## 5. Rule
A test is reported as passed only with a recorded run ID and commit SHA above.
