# Data Flow and Residency
> **Document status:** DRAFT v0.1 (2026-11-16). Produced from the master engineering prompt only. The repository, TECHNICAL_SPEC.md, traceability-matrix.md, DPIA-TFW0957.md and compliance-guard.service.ts had NOT been supplied at authoring time. Every item marked `NOT EVIDENCED` must be completed from real files, executed tests or recorded outputs before this document is relied on. No result in this document has been fabricated.
>
> **Status legend:** `NOT EVIDENCED` (nothing verified) | `PLANNED` (design intent, unverified) | `VERIFIED` (executed/inspected, evidence ref given) | `OUTSTANDING` (known gap) | `DECISION REQUIRED`

## 1. Intended deployment (design intent, UNVERIFIED)
| Component | Intended location | Evidence |
|---|---|---|
| Application hosting | AWS eu-west-2 | NOT EVIDENCED |
| Primary database | eu-west-2 | NOT EVIDENCED |
| Backups / DR | UK region(s) only; DR region to be confirmed (eu-west-2 multi-AZ or other UK arrangement) | DECISION REQUIRED |
| Document storage | eu-west-2 S3, KMS encrypted | NOT EVIDENCED |
| Audit logs / monitoring | eu-west-2 | NOT EVIDENCED |
| Secrets | AWS Secrets Manager eu-west-2 | NOT EVIDENCED |
| Netlify | Static UI preview, synthetic data only | NOT EVIDENCED |

## 2. Why London hosting alone is insufficient
Each of the following can move personal data outside the UK and must be individually reviewed: email/SMS providers, error tracking, APM/telemetry, log shipping, CDN, DNS, Entra ID tenant data location, support tooling, CI artefacts, translation services, AV scanning services, global AWS services (IAM, CloudFront, Route 53) and vendor support access.

## 3. Data flow inventory (to complete)
| Flow | Source | Destination | Data categories | Transport | Location | Processor | Basis/DPIA ref | Status |
|---|---|---|---|---|---|---|---|---|
| Client to API | Browser | ALB/API | Identity, credentials | TLS | eu-west-2 | n/a | NOT EVIDENCED | NOT EVIDENCED |
| API to DB | API | DB | All | TLS | eu-west-2 | n/a | NOT EVIDENCED | NOT EVIDENCED |
| API to Entra ID | API | Microsoft | Auth identifiers | TLS | NOT EVIDENCED | Microsoft | NOT EVIDENCED | NOT EVIDENCED |
| API to email provider | API | Provider | Name, email | TLS | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED |
| Telemetry | API | NOT EVIDENCED | NOT EVIDENCED | | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED | NOT EVIDENCED |

## 4. Enforcement controls (planned)
AWS Organizations SCP denying non-eu-west-2 regions (except required global services), IaC region pinning, AWS Config rules, egress allow-listing, CI check that fails on unreviewed outbound domains/SDKs.

## 5. Evidence to collect
IaC plan output, `aws configservice` compliance output, S3/RDS region listings, SCP JSON, subprocessor list with locations, DPIA action log.

## 6. Open DPIA items
NOT EVIDENCED. DPIA-TFW0957.md not supplied. Do not assert UK GDPR compliance on the basis of hosting region.
