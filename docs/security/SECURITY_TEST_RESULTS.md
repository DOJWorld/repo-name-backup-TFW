# Security Test Results
> **Document status:** DRAFT v0.1 (2026-11-16). Produced from the master engineering prompt only. The repository, TECHNICAL_SPEC.md, traceability-matrix.md, DPIA-TFW0957.md and compliance-guard.service.ts had NOT been supplied at authoring time. Every item marked `NOT EVIDENCED` must be completed from real files, executed tests or recorded outputs before this document is relied on. No result in this document has been fabricated.
>
> **Status legend:** `NOT EVIDENCED` (nothing verified) | `PLANNED` (design intent, unverified) | `VERIFIED` (executed/inspected, evidence ref given) | `OUTSTANDING` (known gap) | `DECISION REQUIRED`

## 1. Execution record
| Run ID | Date (UTC) | Commit SHA | Environment | Executor | Command | Result |
|---|---|---|---|---|---|---|
| (no runs recorded) | | | | | | |

## 2. Test catalogue (planned; none executed)
| ID | Test | Expected outcome | Test file | Result |
|---|---|---|---|---|
| SEC-001 | Unauthenticated call to protected endpoint | 401 + audit | NOT EVIDENCED | NOT RUN |
| SEC-002 | Worker calls permit-approval endpoint | 403 + audit | NOT EVIDENCED | NOT RUN |
| SEC-003 | Contractor A reads contractor B records by ID | 403/404, no data, audit | NOT EVIDENCED | NOT RUN |
| SEC-004 | Permit with expired insurance | Reject, reason code, no state change, audit | NOT EVIDENCED | NOT RUN |
| SEC-005 | Permit without valid RISQS where required | As SEC-004 | NOT EVIDENCED | NOT RUN |
| SEC-006 | QR sign-in with expired Sentinel | As SEC-004 | NOT EVIDENCED | NOT RUN |
| SEC-007 | QR sign-in with expired CSCS | As SEC-004 | NOT EVIDENCED | NOT RUN |
| SEC-008 | QR sign-in without valid induction | As SEC-004 | NOT EVIDENCED | NOT RUN |
| SEC-009 | QR sign-in without approved RAMS (where required) | As SEC-004 | NOT EVIDENCED | NOT RUN |
| SEC-010 | Use permit after revocation | Reject | NOT EVIDENCED | NOT RUN |
| SEC-011 | Replay accepted QR request | Reject (nonce used) | NOT EVIDENCED | NOT RUN |
| SEC-012 | Modified QR payload/signature | Reject | NOT EVIDENCED | NOT RUN |
| SEC-013 | Client timestamp / device clock changed | Server time governs | NOT EVIDENCED | NOT RUN |
| SEC-014 | Credential expires between check and execution | Reject at execution | NOT EVIDENCED | NOT RUN |
| SEC-015 | Concurrent permit requests / sign-ins | One outcome, no duplicates | NOT EVIDENCED | NOT RUN |
| SEC-016 | Crafted payload bypassing frontend validation | Rejected server-side | NOT EVIDENCED | NOT RUN |
| SEC-017 | Expired/revoked session reuse | 401 | NOT EVIDENCED | NOT RUN |
| SEC-018 | Injection payloads on all inputs | 400, no injection | NOT EVIDENCED | NOT RUN |
| SEC-019 | Script payloads in free text and translations | Encoded output | NOT EVIDENCED | NOT RUN |
| SEC-020 | Cross-origin state change (if cookie auth) | Rejected | NOT EVIDENCED | NOT RUN |
| SEC-021 | Malicious/oversized/mis-typed upload | Rejected/quarantined | NOT EVIDENCED | NOT RUN |
| SEC-022 | Burst requests to login, QR, API | 429 | NOT EVIDENCED | NOT RUN |
| SEC-023 | Modify/delete audit record | Denied; tamper detectable | NOT EVIDENCED | NOT RUN |
| SEC-024 | Inspect logs for passwords/tokens/PII | None | NOT EVIDENCED | NOT RUN |
| SEC-025 | Secret scan of repo and history | None | NOT EVIDENCED | NOT RUN |
| SEC-026 | Dependency vulnerability scan | No unaccepted Critical/High | NOT EVIDENCED | NOT RUN |
| SEC-027 | Netlify build contains no prod config/data | Pass | NOT EVIDENCED | NOT RUN |

## 3. Scan results
| Purpose | Tool | Date | Commit | Result | Report ref |
|---|---|---|---|---|---|
| SAST | not selected | NOT RUN | | | |
| SCA | not selected | NOT RUN | | | |
| Secrets | not selected | NOT RUN | | | |
| IaC | not selected | NOT RUN | | | |
| DAST | not selected | NOT RUN | | | |

The authoring sandbox has no network access; dependency audits and DAST must run in CI or a connected environment.
