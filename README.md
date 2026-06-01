# Zara OS

![RJ Business Solutions](https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg)

**The AI-native operating system for hospitals and independent practices.**

Replacing Epic-class infrastructure at 90% lower cost. FHIR R4 native. Five agent modules. Already in production at the founder's own 24-state telehealth practice.

---

## Founder

**Dr. Jessica Edwards, DO, MBA**
Board-Certified Family Medicine Physician | Founder, Zara Medical | EWOR Ideation Fellowship Applicant 2026

## Built by

**RJ Business Solutions**
📍 1342 NM 333, Tijeras, New Mexico 87059
🌐 https://rjbusinesssolutions.org
📧 support@rjbusinesssolutions.org

**Build Date:** 2026-05-31

---

## The Five Agents (PAZRM)

| Agent | Role | Function |
|---|---|---|
| **P** | Post-Visit Autopilot | Auto-creates orders, referrals, letters, billing, follow-ups |
| **A** | AI Scribe Converter | Ambient transcription → SOAP note → coding suggestions |
| **Z** | Zara Clinical Assistant | Chart summary, med/allergy checks, care-gap alerts |
| **R** | Referral Specialist | Detects need, assembles packet, routes, tracks closure |
| **M** | Medical Super Knowledge | Semantic search across notes, forms, transcripts with citations |

## Architecture

Five-layer architecture: Human Interface → Agent Orchestration → API + Business Logic → FHIR + Data → Infrastructure + Trust.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system design.

## Compliance

HIPAA Security Rule + Privacy Rule + Breach Notification | SOC 2 Type II (in progress) | HITRUST CSF (planned) | ONC HTI-1 Certification (target Q4 2026)

See [`compliance/`](compliance/) for the full control matrix.

## Tech Stack

- **Frontend:** Next.js 16.2, React 19, Tailwind 4.2, shadcn/ui
- **Edge API:** Hono on Cloudflare Workers (non-PHI only)
- **Core API:** FastAPI 0.136 on Python 3.13 (PHI handling, AWS EKS)
- **FHIR Server:** Forked Medplum (Apache 2.0)
- **Database:** Supabase Postgres 17 (HIPAA tier) + pgvector
- **AI:** AWS Bedrock (Claude Opus + Sonnet) + AWS Transcribe Medical
- **Orchestration:** LangGraph + CrewAI
- **Infra:** AWS EKS (PHI) + Cloudflare (edge) + Terraform + GitHub Actions

## Status

🏗️ **Pre-MVP — Scaffold complete, awaiting EWOR Ideation Fellowship outcome for Sprint 1 execution.**

## License

Proprietary. © 2026 RJ Business Solutions. All rights reserved.
