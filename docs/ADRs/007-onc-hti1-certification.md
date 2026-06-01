# ADR-007: ONC HTI-1 Certification Path

**Date:** 2026-05-31
**Status:** Accepted
**Deciders:** Dr. Jessica Edwards, Rick Jefferson

## Context

To compete in the EHR market and qualify customers for CMS incentive programs (Promoting Interoperability, MIPS), Zara OS must achieve ONC Health IT Certification under HTI-1.

HTI-1 introduces § 170.315(b)(11) — Decision Support Intervention — which governs AI/ML features. This is uniquely relevant to Zara OS's agent architecture.

## Decision

Target ONC HTI-1 certification by Q4 2026 with the following criteria:

**Phase 1 (Q3 2026 — pre-certification):**
- (d)(1) Authentication, access control, authorization
- (d)(2) Auditable events and tamper-resistance
- (d)(3) Audit reports
- (d)(7) End-user device encryption
- (d)(12) Encrypt authentication credentials
- (d)(13) Multi-factor authentication

**Phase 2 (Q4 2026 — clinical features):**
- (a)(1) CPOE — Medications
- (a)(2) CPOE — Laboratory
- (a)(3) CPOE — Diagnostic imaging
- (a)(4) Drug-drug, drug-allergy interaction checks
- (a)(5) Demographics
- (a)(9) Clinical decision support
- (b)(1) Transitions of care
- (b)(2) Clinical information reconciliation
- (b)(3) Electronic prescribing
- (b)(11) Decision Support Intervention (DSI) — **AI rule**

**Phase 3 (2027 — APIs + reporting):**
- (g)(7) Application access — patient selection
- (g)(9) Application access — all data request
- (g)(10) Standardized API for patient and population services (FHIR R4)
- (c)(1)–(c)(4) Clinical quality measures

**(b)(11) DSI specific requirements (the AI rule):**
Every agent in Zara OS must publish "source attributes":
- Source of training data (and whether it includes any of the 31 categories of demographic/social/health data the rule lists)
- Intended use
- Intended user population
- Output type
- Performance metrics including fairness across demographic groups
- Caution / contraindication information
- Notice of when an AI is in use vs. evidence-based rule

Source attributes published at: `/.well-known/dsi-attributes.json` (machine-readable) + human-readable page.

## Consequences

**Positive:**
- Certification unlocks market access (customers need certified EHR for CMS programs)
- HTI-1 (b)(11) compliance differentiates from non-certified AI scribes
- ONC certification signals enterprise readiness

**Negative:**
- Certification process is 6–9 months, $50K–$150K in testing lab fees
- Engineering overhead of maintaining certified features
- HTI-2 and beyond will add more requirements

**Risk mitigation:**
- Engage authorized testing lab (ATL) by Q3 2026
- Hire ONC certification consultant for navigation
- Architect (b)(11) compliance from day one, not bolted on

## References

- ONC HTI-1 Final Rule: https://www.healthit.gov/topic/laws-regulation-and-policy/health-data-technology-and-interoperability-certification-program
- § 170.315 criteria: https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-D/part-170
- DSI requirements: https://www.healthit.gov/topic/section-170315b11-decision-support-interventions
