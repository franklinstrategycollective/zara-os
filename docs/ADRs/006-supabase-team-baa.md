# ADR-006: Supabase Team Plan + BAA for Postgres

**Date:** 2026-05-31
**Status:** Accepted (with fallback)
**Deciders:** Dr. Jessica Edwards, Rick Jefferson

## Context

We need a managed Postgres for FHIR data, audit logs, and operational tables. Options:
- AWS RDS Postgres (HIPAA-eligible, native AWS)
- Supabase Team plan + HIPAA add-on
- Self-host on EKS

Supabase offers significant DX advantages (Auth, Realtime, Storage, RLS) but adds a vendor.

## Decision

**Primary: Supabase Team plan ($599/mo + HIPAA add-on) with signed BAA.**
**Fallback: AWS RDS Postgres if Supabase BAA terms change unfavorably.**

Rationale:
- Supabase Postgres is standard Postgres 17 — migration to RDS is straightforward
- Supabase Auth + Row Level Security accelerates MVP by ~6 weeks
- Supabase Realtime is useful for clinician collaboration features
- Supabase Storage covers non-clinical file needs (avatars, branding)

**Conditions for staying on Supabase:**
- BAA must remain in force
- HIPAA tier must remain at Team plan pricing or below comparable RDS cost
- Performance must meet p95 < 50ms for FHIR resource reads

**Trigger to migrate to RDS:**
- BAA termination or material change
- 100+ tenants — at that scale, dedicated RDS instances per major tenant becomes economical
- Performance degradation persisting >7 days

## Consequences

**Positive:**
- Faster MVP (Auth + RLS + Realtime out of the box)
- Lower ops burden in early days
- pgvector available for semantic search

**Negative:**
- Vendor lock-in to Supabase-specific features (must abstract or avoid)
- BAA scope narrower than self-managed
- Database performance ceiling lower than tuned RDS

**Risk mitigation:**
- All Supabase-specific features wrapped in `packages/db` abstraction
- Daily logical backups to our own S3 bucket
- Monthly DR drill: restore to a separate RDS instance from backup

## References

- Supabase HIPAA: https://supabase.com/solutions/healthcare
- Supabase BAA terms: https://supabase.com/legal/baa
