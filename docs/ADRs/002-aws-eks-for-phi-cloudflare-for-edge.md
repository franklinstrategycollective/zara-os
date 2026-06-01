# ADR-002: AWS EKS for PHI, Cloudflare for Edge

**Date:** 2026-05-31
**Status:** Accepted
**Deciders:** Dr. Jessica Edwards, Rick Jefferson

## Context

Zara OS handles PHI under HIPAA. The standard RJ Business Solutions fleet pattern runs entirely on Cloudflare (Workers + Pages + D1 + R2 + KV). However, Cloudflare's default Workers/Pages tier is NOT covered by a HIPAA BAA — only Cloudflare Enterprise with explicit BAA addendum covers PHI workloads, and even then only for specific services.

We must decide where PHI lives and where it is processed.

## Decision

**Two-plane architecture:**

**PHI Plane (AWS HIPAA-eligible):**
- All PHI storage: AWS RDS Postgres (or Supabase Team HIPAA tier)
- All PHI processing: AWS EKS (Kubernetes)
- All PHI object storage: AWS S3 + KMS
- All AI inference on PHI: AWS Bedrock (Claude via Anthropic-AWS BAA chain)
- All voice/transcription: AWS Transcribe Medical
- All audit logging: AWS CloudTrail + immutable S3

**Edge Plane (Cloudflare, non-PHI only):**
- Marketing site: Cloudflare Pages
- Public APIs (pricing, blog, docs): Cloudflare Workers
- DDoS + WAF for AWS origin: Cloudflare in front of AWS ALB
- Auth flow initiation (OAuth redirect, not callback): Cloudflare Workers
- DNS: Cloudflare DNS

**Hard rule:** Any code path that touches PHI runs on the PHI Plane. Cloudflare Workers code never receives, processes, or stores PHI in any form.

## Consequences

**Positive:**
- HIPAA BAA chain is clean and defensible
- Edge plane preserves fleet pattern speed/cost for non-PHI surfaces
- AWS HIPAA-eligible services are battle-tested in healthcare
- Bedrock provides BAA-covered access to Claude (Anthropic does not yet offer direct BAA to startups)

**Negative:**
- Two infrastructure stacks to maintain (Terraform for AWS, Wrangler for Cloudflare)
- Higher baseline cost than Cloudflare-only (~$3K–5K/mo MVP, $15K+/mo at 100 practices)
- More complex deployment topology
- Cross-plane authentication requires careful design

**Risk mitigation:**
- Single Terraform monorepo manages both planes
- CI gate blocks any PR that adds PHI-handling code to `apps/api-edge/`
- Architecture review required for any new data flow crossing planes

## Alternatives Considered

| Option | Why rejected |
|---|---|
| Cloudflare-only with Enterprise BAA | BAA covers limited services; AI inference not BAA-covered |
| Azure-only (Azure for Health) | Lock-in, less competitive AI pricing |
| GCP-only (Google Cloud Healthcare API) | Smaller ecosystem, Anthropic via Vertex less mature |
| Hybrid AWS + Azure | Operational complexity exceeds value |
| Self-hosted on bare metal | Compliance burden too high for early stage |

## References

- AWS HIPAA Eligible Services: https://aws.amazon.com/compliance/hipaa-eligible-services-reference/
- Cloudflare HIPAA: https://www.cloudflare.com/trust-hub/us-privacy-compliance/
- Anthropic on AWS Bedrock: https://aws.amazon.com/bedrock/anthropic/
