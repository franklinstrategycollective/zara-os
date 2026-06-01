# ADR-001: FHIR R4 via Forked Medplum

**Date:** 2026-05-31
**Status:** Accepted
**Deciders:** Dr. Jessica Edwards (founder), Rick Jefferson (build engine)

## Context

Zara OS must implement FHIR R4 to comply with CMS-0057-F (effective January 1, 2026) and to qualify for ONC HTI-1 certification. We must decide between (a) building our own FHIR R4 server, (b) using a commercial FHIR-as-a-service (Smile CDR, Firely Server, Azure Health Data Services), or (c) forking an open-source FHIR server.

## Decision

Fork **Medplum** (Apache 2.0 licensed, TypeScript, production-grade) and deploy a customized version on AWS EKS.

## Consequences

**Positive:**
- Zero licensing cost
- Full control over schema extensions for agent attribution (Provenance) and supervision workflow
- Native TypeScript — aligns with our frontend stack
- Active maintenance, strong community
- Already used in production by multiple healthcare startups

**Negative:**
- Maintenance burden of staying current with upstream
- Must build our own audit, encryption, and HIPAA-specific extensions
- ~3–6 month learning curve for the engineering team

**Risk mitigation:**
- Keep upstream Medplum as a git remote; merge security patches within 7 days of release
- All custom extensions live in our fork's `packages/zara-extensions` to minimize merge conflicts

## Alternatives Considered

| Option | Why rejected |
|---|---|
| Build from scratch | 12+ month delay, no value created |
| Smile CDR | Java stack mismatch, licensing cost ($50K+/yr) |
| Azure Health Data Services | Vendor lock-in to Azure, less control |
| Firely Server (.NET) | Stack mismatch |
| HAPI FHIR (Java) | Stack mismatch, harder to extend |

## References

- Medplum: https://www.medplum.com
- FHIR R4: https://hl7.org/fhir/R4/
- CMS-0057-F: https://www.cms.gov/priorities/burden-reduction/overview/interoperability/policies-regulations/cms-interoperability-prior-authorization-final-rule-cms-0057-f
