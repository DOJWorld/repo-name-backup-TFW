# Bilingual Parity and Accessibility Report
> **Document status:** DRAFT v0.1 (2026-11-16). Produced from the master engineering prompt only. The repository, TECHNICAL_SPEC.md, traceability-matrix.md, DPIA-TFW0957.md and compliance-guard.service.ts had NOT been supplied at authoring time. Every item marked `NOT EVIDENCED` must be completed from real files, executed tests or recorded outputs before this document is relied on. No result in this document has been fabricated.
>
> **Status legend:** `NOT EVIDENCED` (nothing verified) | `PLANNED` (design intent, unverified) | `VERIFIED` (executed/inspected, evidence ref given) | `OUTSTANDING` (known gap) | `DECISION REQUIRED`

## 1. Coverage summary
| Metric | Value |
|---|---|
| Total user-facing strings (EN) | NOT EVIDENCED |
| Welsh translations present | NOT EVIDENCED |
| Coverage % | NOT EVIDENCED (target 100%) |
| Welsh strings human-reviewed/approved | NOT EVIDENCED |
| CI check for missing keys | NOT EVIDENCED |

## 2. Surface checklist
| Surface | EN | CY | Verified by | Date |
|---|---|---|---|---|
| Navigation and accessibility labels | NOT EVIDENCED | NOT EVIDENCED | | |
| Forms and validation messages | NOT EVIDENCED | NOT EVIDENCED | | |
| API error messages (code to localised text) | NOT EVIDENCED | NOT EVIDENCED | | |
| Empty states and confirmation dialogs | NOT EVIDENCED | NOT EVIDENCED | | |
| Compliance status labels | NOT EVIDENCED | NOT EVIDENCED | | |
| QR check-in/out instructions and posters | NOT EVIDENCED | NOT EVIDENCED | | |
| Email/notification templates | NOT EVIDENCED | NOT EVIDENCED | | |
| Generated documents/PDFs | NOT EVIDENCED | NOT EVIDENCED | | |
| Language switch without reload, workflow state preserved | NOT EVIDENCED | NOT EVIDENCED | | |

## 3. Translation governance
- Central catalogue with stable keys; no hardcoded user-facing text
- Status per string: `draft-machine` / `reviewed` / `approved`; only `approved` Welsh counts as final
- Glossary of approved terminology (railway safety terms) owned by a named Welsh-language reviewer: DECISION REQUIRED
- CI fails on missing key, orphan key, placeholder mismatch, or untranslated string

## 4. WCAG 2.2 AA
| Check | Method | Result |
|---|---|---|
| Automated scan (axe or equivalent) | Not selected | NOT RUN |
| Keyboard-only operation | Manual | NOT RUN |
| Screen reader (NVDA/VoiceOver) | Manual | NOT RUN |
| Contrast, target size (2.5.8), focus not obscured (2.4.11) | Manual/automated | NOT RUN |
| `lang` attribute switches with language | Automated | NOT RUN |
| Mobile QR flow at 320px and 200% zoom | Manual | NOT RUN |
