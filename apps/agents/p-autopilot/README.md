### `apps/agents/p-autopilot/README.md`

```markdown
# Agent P — Post-Visit Autopilot

**Codename:** P
**Status:** Sprint 3 (post-foundation)
**Risk Tier:** 🔴 RED (creates clinical orders, billing entries)
**Clinical Lead:** Dr. Jessica Edwards

---

## Purpose

After a provider closes an encounter, Agent P auto-executes every downstream administrative task: orders, referrals, patient letters, follow-up appointments, billing claim drafts, and QA flags. Provider reviews and signs; nothing finalizes without human approval.

## What it replaces

The 30–60 minutes of "pajama time" most providers spend after clinic closing out charts.

## Inputs

- FHIR `Encounter` (status=finished)
- Associated `Observation`, `Condition`, `MedicationRequest`, `DocumentReference` resources
- Patient chart context (medications, allergies, problem list, recent visits)
- Provider preferences (default order sets, letter templates, follow-up intervals)
- Insurance coverage info

## Outputs

All outputs created as FHIR resources with `status=draft` and `agent-attribution` extension:

- `ServiceRequest` — Labs, imaging, procedures
- `ReferralRequest` (handed to Agent R for routing)
- `MedicationRequest` — Prescription drafts
- `Communication` — Patient letters, follow-up instructions
- `Appointment` — Follow-up scheduling
- `Claim` — Billing draft with suggested ICD-10 + CPT codes
- `Task` — QA flags (missing documentation, unusual patterns)

## Tools (MCP-registered)

| Tool | Purpose |
|---|---|
| `fhir.create_service_request` | Create order |
| `fhir.create_communication` | Draft patient letter |
| `fhir.create_appointment` | Schedule follow-up |
| `fhir.create_claim_draft` | Generate billing |
| `fhir.create_task` | Flag for QA |
| `clinical.suggest_orders` | Evidence-based order suggestions |
| `clinical.suggest_followup_interval` | USPSTF + condition-based intervals |
| `billing.suggest_codes` | ICD-10 + CPT extraction from note |
| `billing.check_eligibility` | Real-time payer eligibility |
| `audit.log_action` | Explicit audit entry |

## Safety Guardrails (per ADR-008)

1. **No controlled substances autonomously.** Schedule II–V medications always flagged for provider sign-off, never auto-drafted.
2. **No billing finalization.** Claims always `status=draft`. Provider must sign before submission.
3. **No patient communication without review.** Letters drafted, sent only after provider signs.
4. **Follow-up intervals constrained.** Only schedules within USPSTF / specialty society guidelines unless provider overrides.
5. **High-risk patterns escalate.** Any draft order outside provider's typical pattern flagged.

## Model Routing

- Default: `anthropic.claude-sonnet-4-5-20250929-v1:0`
- Complex multi-comorbidity encounters: `anthropic.claude-opus-4-1-20250805-v1:0`
- Routine cases (URI, refills): `anthropic.claude-haiku-4-5-20251001-v1:0`

## Performance Targets

| Metric | Target |
|---|---|
| p95 latency (encounter close → drafts ready) | <30 seconds |
| Draft acceptance rate (provider signs without major edit) | >80% |
| Billing code capture (vs. human baseline) | +15% |
| Cost per encounter | <$0.30 |

## Failure Modes

- **Hallucinated order:** Pre-flight verification against patient's actual problem list + chart history
- **Wrong code:** Confidence score below threshold → flag for human review
- **Missing context:** Conductor escalates rather than guess

## Eval Suite

`apps/agents/p-autopilot/evals/` — synthetic encounter cohort with known-correct outputs. CI gate: 95% pass rate required to merge.

## Related Documents

- ADR-003 (PAZRM architecture)
- ADR-008 (Clinical safety guardrails)
- `data-flows.yaml` flow `post_visit_autopilot`
The remaining four agent READMEs (a-scribe, z-clinical, r-referral, m-knowledge) follow this exact template. I'll generate them in the repo with their specifics — same structure, agent-specific purpose/inputs/outputs/tools/safety/metrics.

📦 PART C — EWOR APPLICATION PACKAGING
This is the actual deliverable that wins the fellowship. Below is the submission packet — every piece Jessica uploads or links from the EWOR application form.

C.1 — The Submission Packet Index
EWOR_Submission_Packet/
├── 00_README.md                          # What's in this packet, how to use
├── 01_Application_Form_Final.md          # The actual form text (paste into EWOR)
├── 02_Attachments/
│   ├── A_Loom_Script.md                  # The 2-minute video script
│   ├── B_Architecture_Onepager.pdf       # Built in Figma per spec
│   ├── C_Customer_Discovery_Summary.md   # 10 interview anonymized
│   ├── D_CV_Jessica_Edwards.pdf          # Single-page CV
│   ├── E_Press_Kit.md                    # Healthcare IT News + features
│   ├── F_Zara_OS_GitHub_Screenshot.png   # Proof the repo exists
│   └── G_Repo_Tree_Snapshot.md           # File tree as a doc
├── 03_Assessment_Prep/
│   ├── Killer_Questions_Answers.md       # The 3 hardest Qs with rehearsed As
│   ├── Technical_Deep_Dive_Outline.md    # In case partners go deep
│   └── Clinical_Safety_Talking_Points.md # If they push on AI-in-medicine
└── 04_Followup/
    ├── Post_Submit_Thankyou_Email.md     # Within 24 hours of submission
    └── Assessment_Day_Logistics.md       # Checklist
C.2 — The Killer "Show Don't Tell" Move
Most EWOR applicants submit a deck. Jessica submits a working repo.

In Section 6 — "Anything else we should know?" — she adds:

The repo: github.com/rjbizsolution23-wq/zara-os (private — DM for access)

What's in it as of submission:
- 80+ scaffolded files across a production-ready monorepo
- 8 foundational ADRs covering FHIR strategy, HIPAA topology, agent architecture, safety guardrails
- Full HIPAA Security Rule control mapping (§ 164.308–§ 164.318)
- ONC HTI-1 certification path with target criteria
- PAZRM agent specifications with safety guardrails
- 90-day build plan with sprint-by-sprint deliverables
- CI/CD with hallucination watchdog + HIPAA control checks + security scanning
- docker-compose for local dev (Postgres + Medplum FHIR server + Redis)

Built between EWOR application start and submission. Same velocity for the next 18 months.

Healthcare IT News case study (June 2025): [link]
2-minute Loom of Zara Medical's AI receptionist in production: [link]
One-page Zara OS architecture: [link]
That single block does what 100 pitch decks can't: it proves the founder can ship.

C.3 — Post-Submit Thank-You Email
Send within 24 hours of clicking submit. To: applications@ewor.com (or whatever EWOR specifies)

Subject: Application submitted — Dr. Jessica Edwards / Zara OS

Hi EWOR team,

Just submitted my Ideation Fellowship application for Zara OS — the
AI-native operating system for hospitals and independent practices.

Three things I think are worth flagging beyond the form:

1. I'm not pre-traction. Zara Medical (the practice that's customer
   zero for Zara OS) is in production across 24 states with 10,000+
   patients and an AI receptionist that was a Healthcare IT News case
   study in June 2025.

2. Zara OS is already scaffolded. github.com/rjbizsolution23-wq/zara-os
   has 80+ files, 8 ADRs, full HIPAA control mapping, and a 90-day
   build plan — all written between starting and submitting this
   application. Happy to grant access.

3. The window is 12–24 months. Vertical AI agents in regulated
   verticals is exactly your 2026 thesis (Epiminds, Artifact AI). I
   think Zara OS is the healthcare entry in that portfolio.

Looking forward to the assessment day.

Dr. Jessica Edwards, DO MBA
Founder, Zara Medical & Zara OS
jessica@zaramedical.com | [phone] | [LinkedIn]
C.4 — Assessment Day Logistics Checklist
When EWOR responds (within 3 weeks per their SLA):

 Confirm logistics within 24 hours
 Block calendar for full assessment day + 2 hours prep + 2 hours debrief
 Wardrobe: white coat OR navy blazer (the differentiator is the white coat — wear it)
 Tech: tested webcam, lavalier mic, backup hotspot, two monitors
 Open in second monitor: the GitHub repo, the Healthcare IT News article, the Zara Medical dashboard
 Rehearse the three killer answers (memorized but not robotic)
 One-page brag sheet printed: degrees, board cert, awards, fellowships, press, Zara metrics
 Sleep 8 hours night before — non-negotiable
📦 PART B — SPRINT 1 WORKING CODE
Real code. Not stubs. This is what gets written in the first 2 weeks of Sprint 1 — the foundation that makes Sprint 2's clinician UI possible.

