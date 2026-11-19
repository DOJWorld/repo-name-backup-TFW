# SMS-OCC-003 Coverage Report
> **Document status:** DRAFT v0.1 (2026-11-16). Produced from the master engineering prompt only. The repository, TECHNICAL_SPEC.md, traceability-matrix.md, DPIA-TFW0957.md and compliance-guard.service.ts had NOT been supplied at authoring time. Every item marked `NOT EVIDENCED` must be completed from real files, executed tests or recorded outputs before this document is relied on. No result in this document has been fabricated.
>
> **Status legend:** `NOT EVIDENCED` (nothing verified) | `PLANNED` (design intent, unverified) | `VERIFIED` (executed/inspected, evidence ref given) | `OUTSTANDING` (known gap) | `DECISION REQUIRED`

## 1. Safety chain (as stated in the master prompt)
Company insurance / RISQS (Appendix A) -> Site induction (Appendix D) -> Approved RAMS (Appendix E) -> Authorised permit-to-work (Appendix G) -> Live mobile QR roll call and audit log (Appendix H).

Each downstream step must be refused by the backend when any upstream condition is unmet, with reason code, user-facing explanation, audit event, correlation ID and no state change.

## 2. Appendix coverage
Appendices B, C and F are not described in the prompt; their titles and requirements must come from the matrix. Nothing is assumed.

| Appendix | Subject | Requirements (count) | Implemented | Tested | Tests passing | Outstanding |
|---|---|---|---|---|---|---|
| A | Company insurance / RISQS | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED |
| B | Title not supplied | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED |
| C | Title not supplied | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED |
| D | Site induction | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED |
| E | Approved RAMS | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED |
| F | Title not supplied | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED |
| G | Permit-to-work | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED |
| H | QR roll call and audit log | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED |

## 3. Chain-break test matrix (to be executed)
| Case | Upstream failure | Blocked action | Expected | Test ref | Result |
|---|---|---|---|---|---|
| CB-01 | Insurance expired | Permit issue | Reject | NOT EVIDENCED | NOT RUN |
| CB-02 | RISQS invalid/not held where required | Permit issue | Reject | NOT EVIDENCED | NOT RUN |
| CB-03 | No site induction | Permit issue / QR sign-in | Reject | NOT EVIDENCED | NOT RUN |
| CB-04 | RAMS not approved | Permit issue / QR sign-in (per workflow) | Reject | NOT EVIDENCED | NOT RUN |
| CB-05 | Permit not authorised or revoked | QR sign-in | Reject | NOT EVIDENCED | NOT RUN |
| CB-06 | Sentinel/CSCS expired | QR sign-in | Reject | NOT EVIDENCED | NOT RUN |
| CB-07 | Credential expires mid-flow | Final commit | Reject at execution | NOT EVIDENCED | NOT RUN |

## 4. Ambiguities / decisions required
- Exact prerequisites for QR sign-in (is RAMS or permit required for every site/work type?)
- Expiry semantics (end of day vs exact timestamp; timezone Europe/London vs UTC storage)
- Approved offline contingency, if any
- Emergency roll-call workflow definition
