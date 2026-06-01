# Zara OS — Vocabulary Lock

This document is the canonical glossary for the Zara OS monorepo. All code, ADRs, docs, and PRs must use these terms exactly. When vocabulary drifts in any conversation, this file is the source of truth.

## Domain Vocabulary

| Term | Definition | Anti-confusion note |
|---|---|---|
| **Encounter** | A single clinical interaction between patient and provider. FHIR `Encounter` resource. | Not the same as Appointment (the scheduled slot) or Visit (colloquial). |
| **Appointment** | A scheduled time slot. May or may not result in an Encounter. | Always FHIR `Appointment`. |
| **Patient** | An individual receiving care. FHIR `Patient` resource. | Never "user" in clinical context. Users are providers, admins, MAs. |
| **Practitioner** | A licensed provider. FHIR `Practitioner` resource. | NPI-bearing. Includes physicians, NPs, PAs. |
| **Observation** | A measurement or finding. FHIR `Observation` resource. | Vitals, labs, screening results. Not "data point." |
| **DocumentReference** | A clinical document. FHIR `DocumentReference` resource. | SOAP notes, scanned PDFs, transcripts. |
| **ServiceRequest** | An order. FHIR `ServiceRequest` resource. | Labs, imaging, referrals all use ServiceRequest. |
| **PHI** | Protected Health Information per HIPAA. Any data identifying a patient + their health info. | Treat as toxic by default. |
| **De-identified** | Stripped per HIPAA Safe Harbor (18 identifiers removed) or Expert Determination. | "Anonymized" is not a HIPAA term — never use. |
| **BAA** | Business Associate Agreement. Required between any party processing PHI on our behalf. | No BAA = no PHI flows there. |
| **MPI** | Master Patient Index. Single source of truth for patient identity across systems. | Not a "patient database." |

## Agent Vocabulary

| Term | Definition |
|---|---|
| **PAZRM** | The five agents: Post-Visit Autopilot, AI Scribe, Zara Clinical, Referral, Medical Knowledge. |
| **Conductor** | The orchestrator that routes work between agents. |
| **Reasoning trace** | The full chain-of-thought for an agent action. Stored immutably for audit. |
| **Provenance** | FHIR resource attributing every clinical change to its source (human or agent). |
| **Break-glass** | Emergency access overriding normal RBAC, with mandatory justification + alert. |
| **Minimum necessary** | HIPAA principle: only access the minimum PHI needed for the task. |

## System Vocabulary

| Term | Definition |
|---|---|
| **Edge** | Cloudflare Workers tier. Non-PHI only. |
| **Core** | AWS EKS tier. Where PHI lives and is processed. |
| **FHIR server** | The Medplum fork. The source of truth for clinical data. |
| **Audit log** | Immutable record of every PHI access. CloudTrail + S3 + Datadog. |
| **Tenant** | A practice or hospital using Zara OS. Each tenant gets isolated KMS keys. |

## Cross-references

- ADR-001 to ADR-008: see `docs/ADRs/`
- HIPAA controls: see `compliance/hipaa/security-rule-controls.md`
- Data flows: see `data-flows.yaml`
