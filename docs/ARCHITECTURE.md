A.2 — docs/ARCHITECTURE.md (Full Architecture Document)
# Zara OS — System Architecture

**Version:** 1.0
**Date:** 2026-05-31
**Authors:** Dr. Jessica Edwards, Rick Jefferson
**Status:** Foundational — superseded only by approved ADRs

---

## 1. Executive Summary

Zara OS is a five-layer, AI-native operating system for hospitals and independent practices. It replaces Epic-class infrastructure with a FHIR R4-native core, an agent orchestration layer (PAZRM), and a strict HIPAA-compliant deployment topology that separates PHI workloads (AWS HIPAA-eligible services) from edge workloads (Cloudflare).

The system is designed for ONC HTI-1 certification, SOC 2 Type II compliance, and HITRUST CSF alignment from day one — not bolted on.

---

## 2. The Five Layers

### Layer 1 — Infrastructure + Trust

**PHI Plane (AWS):**
- VPC with private subnets, no public IPs on PHI workloads
- EKS for containerized services (FHIR server, core API, agent runtime)
- RDS Postgres (or Supabase Team HIPAA) for transactional data
- S3 + KMS for PHI blob storage, immutable audit logs
- Bedrock for LLM inference (Claude Opus + Sonnet + Haiku)
- Transcribe Medical for ambient scribe
- CloudTrail + GuardDuty + Security Hub for security telemetry
- Secrets Manager for credentials with auto-rotation

**Edge Plane (Cloudflare):**
- Pages for marketing site + docs
- Workers for non-PHI APIs
- DNS + WAF in front of AWS ALB
- Turnstile for CAPTCHA

**Cross-plane connectivity:**
- Cloudflare → AWS ALB via authenticated origin pulls (mTLS)
- Internal services communicate over private VPC only
- All PHI traffic encrypted in transit (TLS 1.3, mTLS service-to-service)

### Layer 2 — FHIR + Data

**Source of truth:** Forked Medplum FHIR R4 server.

**Resources implemented (Phase 1):**
Patient, Practitioner, Organization, Encounter, Observation, Condition, MedicationRequest, AllergyIntolerance, DocumentReference, Appointment, Coverage, ServiceRequest, DiagnosticReport, Procedure, Immunization, CarePlan, Claim, Communication, Task, Provenance

**Extensions (Zara-specific):**
- `agent-attribution`: Identifies the agent that created/modified a resource
- `confidence-score`: Float 0–1 attached to AI-generated content
- `requires-supervision`: Boolean flagging items pending provider review
- `safety-classification`: Enum (routine, requires-review, critical-alert)

**Data classification:**
| Tier | Examples | Storage |
|---|---|---|
| Tier 1 (always field-encrypted) | SSN, audio, full notes | App-layer AES-256-GCM |
| Tier 2 (deterministic encryption) | Phone, email, member ID | Searchable encrypted |
| Tier 3 (storage encrypted) | Names, ZIP3, dates | KMS at storage layer |

**Vector store:** pgvector co-located with primary Postgres for semantic search over notes, transcripts, forms.

### Layer 3 — API + Business Logic

**Three API surfaces:**

1. **Edge API (`apps/api-edge`, Cloudflare Workers + Hono):**
   - Public/marketing endpoints
   - OAuth initiation (redirects to core for actual token exchange)
   - Status, health, public pricing

2. **Core API (`apps/api-core`, FastAPI on EKS):**
   - All PHI-handling endpoints
   - Routes mirror FHIR resources with business logic on top
   - GraphQL gateway for clinician app
   - WebSocket subscriptions for realtime collaboration

3. **FHIR API (Medplum, on EKS):**
   - SMART on FHIR for third-party app integration
   - RESTful FHIR R4 endpoints
   - Bulk Data API (FHIR Bulk Data Access spec)

**API conventions:**
- All endpoints versioned: `/api/v1/...`
- Idempotency keys on all mutating operations
- Pagination via cursor (RFC 5988 link headers)
- Error format: RFC 7807 Problem Details JSON
- Rate limits: per-IP + per-user + per-tenant

### Layer 4 — Agent Orchestration (PAZRM)

**Conductor:** LangGraph state machine. Routes WorkItems to specialist agents. Stateless except for LangGraph checkpoints stored in Postgres.

**Agent runtime architecture:**
WorkItem arrives ↓ Conductor: classify intent, select agent(s) ↓ Pre-flight audit log + safety check (ADR-008) ↓ Agent: load patient context (FHIR bundle, redacted to minimum necessary) ↓ Agent: reason via Bedrock (Claude Sonnet default, Opus for complex) ↓ Agent: invoke tools via MCP (FHIR ops, external APIs, etc.) ↓ Agent: produce structured output (Pydantic-validated) ↓ Post-flight audit log + Provenance resource written ↓ Result returned to caller (UI, workflow, or downstream agent)

**Memory (per `@rj/memory`):**
- Working: per-session context in Redis
- Episodic: encounter-scoped events in pgvector
- Semantic: extracted facts in Postgres
- Procedural: skill registry per agent
- Hierarchical: hot/warm/cold tiering
- Prospective: scheduled tasks via SQS
- Shared: cross-agent state via Postgres advisory locks

**Tool registry (MCP-compliant):**
- `fhir.*` — FHIR resource ops
- `clinical.*` — drug interactions, care gaps, evidence lookup
- `scheduler.*` — appointment booking
- `billing.*` — claim drafting, eligibility check
- `directory.*` — specialist lookup, insurance network
- `communication.*` — secure messaging, fax, email
- `audit.*` — explicit audit log writes

### Layer 5 — Human Interface

**Web (Next.js 16):**
- Clinician app: chart view, encounter charting, orders, inbox, supervision queue
- Patient portal: appointments, records, secure messaging, intake forms
- Admin console: practice ops, user management, billing, reports

**Mobile (Phase 2 — React Native + Expo):**
- Clinician on-the-go: rounds, quick chart access, voice scribe
- Patient app: portal feature parity

**Voice (Phase 1.5 — Twilio + Bedrock):**
- AI receptionist (Zara Medical's existing system, migrated to Zara OS)
- Patient outbound reminders
- Telephone-mediated intake

---

## 3. Data Flow Examples

### Example A: Patient Books an Appointment

Patient (Portal/SMS) → Edge API (Cloudflare Worker) [non-PHI: just intent] → Core API auth check → Core API: GET available slots from Appointment resources → Patient selects slot → Core API: create FHIR Appointment + send confirmation → Audit log entry written → Confirmation: SMS via Twilio + email via Resend

### Example B: Provider Closes an Encounter

Provider clicks "Sign and Close Encounter" → Core API: validate encounter has required documentation → Core API: write FHIR Encounter with status=finished → Conductor: trigger Agent P (Post-Visit Autopilot) → Agent P loads encounter + chart context → Agent P drafts: orders, referrals, patient letter, follow-up appointment, billing claim → Each draft created as FHIR resource with status=draft + agent-attribution extension → Provider notification: "5 items pending your review" → Provider reviews + signs each → Items move to status=active → Audit log entries throughout

### Example C: AI Scribe During Encounter

Provider opens encounter, taps "Start Scribe" → Patient consent verified (FHIR Consent resource) → Audio stream → AWS Transcribe Medical (HIPAA-eligible) → Live transcript displayed → Provider closes encounter → Agent A loads full transcript → Agent A drafts SOAP note + ICD-10/CPT suggestions → DocumentReference created with status=preliminary → Confidence scores attached to each section → Provider reviews, edits, signs → status=final → Original audio retained 30 days, then auto-deleted

---

## 4. Security Architecture

(Summarized — full detail in `compliance/hipaa/security-rule-controls.md`)

- **Identity:** Supabase Auth + WebAuthn + TOTP MFA. RS256 JWTs.
- **Authorization:** RBAC (provider, MA, admin, patient, billing, etc.) + tenant isolation + minimum necessary
- **Encryption:** Field-level (ADR-005) + KMS at rest + TLS 1.3 in transit
- **Audit:** Immutable S3-backed log of every PHI access, 7-year retention
- **Network:** Private VPC, no public IPs on PHI workloads, WAF in front
- **Secrets:** AWS Secrets Manager with auto-rotation
- **Vulnerability management:** Dependabot, semgrep, OWASP ZAP, monthly penetration tests pre-launch and quarterly post-launch
- **Incident response:** P0–P3 severity, defined playbooks, 5-minute P0 response SLA

---

## 5. Deployment Topology

                ┌─────────────────────────────────┐
                │  Cloudflare (Edge Plane)        │
                │   • Pages (marketing)           │
                │   • Workers (public APIs)       │
                │   • DNS + WAF                   │
                └─────────────────────────────────┘
                              │
                              │ mTLS, authenticated
                              ▼
                ┌─────────────────────────────────┐
                │  AWS (PHI Plane)                │
                │  ┌────────────────────────────┐ │
                │  │ ALB (TLS termination)      │ │
                │  └────────────────────────────┘ │
                │              │                   │
                │  ┌───────────┴──────────────┐   │
                │  │   EKS Cluster            │   │
                │  │  • api-core (FastAPI)    │   │
                │  │  • fhir-server (Medplum) │   │
                │  │  • agents (PAZRM)        │   │
                │  │  • conductor             │   │
                │  └──────────────────────────┘   │
                │              │                   │
                │  ┌───────────┴──────────────┐   │
                │  │  RDS Postgres (PHI)      │   │
                │  │  S3 (PHI blobs + audit)  │   │
                │  │  ElastiCache Redis       │   │
                │  │  Bedrock (Claude)        │   │
                │  │  Transcribe Medical      │   │
                │  └──────────────────────────┘   │
                └─────────────────────────────────┘
---

## 6. Scalability Targets

| Metric | MVP | Year 1 | Year 3 |
|---|---|---|---|
| Tenants (practices+hospitals) | 1 (Zara Medical) | 100 | 2,000 |
| Active users | 5 | 500 | 10,000 |
| Patients in system | 10K | 250K | 5M |
| Encounters/day | 50 | 5,000 | 100,000 |
| FHIR API rps (p99) | 10 | 500 | 10,000 |
| AI inference calls/day | 200 | 20,000 | 400,000 |
| Storage (PHI blobs) | 100GB | 5TB | 100TB |

---

## 7. Disaster Recovery

- **RPO:** 1 hour (continuous WAL shipping to S3)
- **RTO:** 4 hours (cross-region failover documented)
- **Backups:** RDS automated 35 days + logical dumps to S3 nightly
- **DR drills:** Quarterly, documented, signed off by Jessica
- **Tabletop exercises:** Annual, with clinical advisory board

---

## 8. Open Architecture Questions (to resolve before Sprint 2)

1. **HIE integration strategy** — direct CommonWell + Carequality joining, or wait for TEFCA QHIN model to mature?
2. **e-prescribing** — Surescripts integration in Phase 1 or Phase 2?
3. **Lab integration** — direct interfaces with major labs (Quest, LabCorp) or via Health Gorilla aggregator?
4. **Imaging** — DICOM viewer in-app or integrate Ambra/Life Image?
5. **Voice receptionist migration** — preserve Zara Medical's existing setup or rebuild on AWS Connect?

These are tracked in `docs/OPEN_QUESTIONS.md`.

---

## 9. References

- ADR-001 through ADR-008 in `docs/ADRs/`
- HIPAA controls in `compliance/hipaa/`
- Data flows in `data-flows.yaml`
- ONC HTI-1 criteria in `compliance/onc-hti1/`
