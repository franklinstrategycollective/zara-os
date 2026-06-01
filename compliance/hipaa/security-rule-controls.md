A.3 — compliance/hipaa/security-rule-controls.md
# HIPAA Security Rule Controls — Zara OS

**Version:** 1.0
**Date:** 2026-05-31
**Standard:** 45 CFR Part 164 Subpart C (§ 164.302–§ 164.318)

This document maps every HIPAA Security Rule control to its Zara OS implementation. It is the source of truth for HIPAA compliance posture and is reviewed quarterly by Dr. Jessica Edwards (HIPAA Security Officer).

---

## § 164.308 — Administrative Safeguards

### § 164.308(a)(1) — Security Management Process

| Required Implementation | Zara OS Control |
|---|---|
| (a)(1)(ii)(A) Risk Analysis | Annual risk assessment documented in `compliance/hipaa/risk-assessment.md`. Updated on every major architectural change. |
| (a)(1)(ii)(B) Risk Management | Risk register maintained in `compliance/hipaa/risk-register.md`. P0/P1 risks mitigated within 30 days. |
| (a)(1)(ii)(C) Sanction Policy | Documented in employee handbook. Acceptable use policy signed annually. |
| (a)(1)(ii)(D) Information System Activity Review | Weekly audit log review by Security Officer. Anomaly detection via Datadog Cloud SIEM. |

### § 164.308(a)(2) — Assigned Security Responsibility

- **HIPAA Security Officer:** Dr. Jessica Edwards (interim)
- **HIPAA Privacy Officer:** Dr. Jessica Edwards (interim)
- Plan: hire dedicated Security Officer at Series A

### § 164.308(a)(3) — Workforce Security

| Required Implementation | Zara OS Control |
|---|---|
| (a)(3)(ii)(A) Authorization/Supervision | Role-based access control with quarterly access reviews |
| (a)(3)(ii)(B) Workforce Clearance | Background checks on all personnel with PHI access |
| (a)(3)(ii)(C) Termination Procedures | Documented runbook in `compliance/runbooks/termination.md`. Access revoked within 1 hour of separation. |

### § 164.308(a)(4) — Information Access Management

- Unique user IDs enforced
- Role-based access (provider, MA, admin, patient, billing)
- Minimum necessary access — agents and humans
- Quarterly access reviews

### § 164.308(a)(5) — Security Awareness and Training

- New-hire HIPAA training mandatory within first week
- Annual refresher training
- Phishing simulation quarterly
- Training records in `compliance/training-log.csv`

### § 164.308(a)(6) — Security Incident Procedures

- Incident response playbook in `docs/RUNBOOK.md`
- P0 = active breach: 5-minute response, 1-hour containment
- Breach notification timeline: 60 days to HHS, faster to affected individuals
- Annual tabletop exercise

### § 164.308(a)(7) — Contingency Plan

| Control | Implementation |
|---|---|
| Data backup plan | RDS automated backups 35 days + nightly logical dumps to S3 cross-region |
| Disaster recovery plan | Documented; RPO 1hr / RTO 4hr |
| Emergency mode operation | Break-glass access procedure |
| Testing and revision | Quarterly DR drills |
| Applications and data criticality | All applications classified in `compliance/criticality.yaml` |

### § 164.308(a)(8) — Evaluation

- Annual HIPAA compliance assessment by external auditor (post-Series A)
- Continuous control monitoring via Datadog + custom HIPAA control checks in CI

### § 164.308(b)(1) — Business Associate Contracts

- All BAAs tracked in `data-flows.yaml` under `baa_registry`
- BAA template based on HHS model with Zara-specific additions
- BAA review on every new vendor onboarding

---

## § 164.310 — Physical Safeguards

### § 164.310(a)(1) — Facility Access Controls

Zara OS infrastructure is cloud-hosted (AWS). Physical safeguards are AWS's responsibility under the shared responsibility model. AWS HIPAA-eligible services meet § 164.310 requirements per AWS BAA.

For our own offices (if any): badge access, visitor log, no PHI on local devices.

### § 164.310(b) — Workstation Use

- Acceptable Use Policy mandates secure workstation usage
- No PHI stored locally on workstations
- Auto-lock after 15 minutes

### § 164.310(c) — Workstation Security

- Full-disk encryption required on all workstations
- MDM (Jamf for macOS, Intune for Windows) enforced

### § 164.310(d)(1) — Device and Media Controls

- No PHI on removable media — enforced via DLP
- Device disposal: factory wipe + cryptographic erasure
- Asset inventory in `compliance/asset-inventory.yaml`

---

## § 164.312 — Technical Safeguards

### § 164.312(a)(1) — Access Control

| Required Implementation | Zara OS Control |
|---|---|
| (a)(2)(i) Unique User Identification | Every user has unique UUID. Service accounts uniquely identified. |
| (a)(2)(ii) Emergency Access | Break-glass procedure with mandatory justification + supervisor notification |
| (a)(2)(iii) Automatic Logoff | 15-minute idle timeout enforced |
| (a)(2)(iv) Encryption and Decryption | AES-256-GCM at field level (ADR-005) + KMS at storage layer |

### § 164.312(b) — Audit Controls

Every PHI-touching operation writes to immutable audit log:
```json
{
  "event_id": "uuid",
  "timestamp": "ISO8601",
  "actor_id": "string",
  "actor_type": "human | agent_P | agent_A | agent_Z | agent_R | agent_M",
  "action": "create | read | update | delete | export",
  "resource_type": "Patient | Observation | ...",
  "resource_id": "string",
  "patient_id": "string",
  "justification": "string | null",
  "ip_address": "string",
  "outcome": "success | denied | error",
  "phi_fields_accessed": ["string"]
}
Storage: S3 with Object Lock (WORM) in compliance mode
Retention: 7 years minimum
Review: Weekly automated anomaly detection + quarterly manual review
§ 164.312(c)(1) — Integrity
SHA-256 checksums on all PHI documents
FHIR Provenance resource on every clinical change
Database constraints + application validation
Tamper-evident audit log (S3 Object Lock)
§ 164.312(d) — Person or Entity Authentication
WebAuthn hardware key option for providers
TOTP MFA required for all users (configurable per role, but always for providers and admins)
Service-to-service: mTLS with short-lived certs from internal CA
§ 164.312(e)(1) — Transmission Security
Required Implementation	Zara OS Control
(e)(2)(i) Integrity Controls	TLS 1.3 with strong cipher suites; HSTS enforced
(e)(2)(ii) Encryption	All PHI transmission encrypted; certificate pinning on mobile
§ 164.314 — Organizational Requirements
§ 164.314(a) — Business Associate Contracts
BAA template stored in compliance/templates/baa-template.md
All BAAs counter-signed by RJ Business Solutions legal
BAA renewal triggers documented
§ 164.316 — Policies and Procedures
Document	Location
HIPAA Policies	compliance/hipaa/policies.md
Privacy Policy	apps/web/app/(marketing)/privacy/page.tsx
Terms of Service	apps/web/app/(marketing)/terms/page.tsx
Notice of Privacy Practices	apps/web/app/(marketing)/npp/page.tsx
Breach Notification Procedures	compliance/hipaa/breach-notification-plan.md
Incident Response	docs/RUNBOOK.md
Retention: 6 years from creation or last effective date.

Continuous Compliance Monitoring
Automated checks (every PR):

.github/workflows/hipaa-control-check.yml runs:
No PHI patterns in code
No .env files committed
data-flows.yaml present and well-formed
BAA registry up to date
Secrets scan clean
Quarterly reviews:

Access review
Audit log spot check (random sampling)
Risk register update
Training compliance
Annual:

Full HIPAA risk assessment refresh
External audit (post-Series A)
DR tabletop exercise
Policy review and signoff
## A.4 — Agent Module READMEs

I'll give you P in full; the rest follow the same shape.

