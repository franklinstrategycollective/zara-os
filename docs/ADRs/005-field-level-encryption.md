# ADR-005: Field-Level Encryption Strategy

**Date:** 2026-05-31
**Status:** Accepted
**Deciders:** Dr. Jessica Edwards, Rick Jefferson

## Context

HIPAA requires encryption of PHI at rest. AWS RDS and Supabase both encrypt storage volumes. However, storage-level encryption alone does not protect against:
- Database admin access
- Backup theft scenarios
- Logical query log exposure
- Lateral movement post-compromise

Defense in depth requires application-layer field-level encryption of sensitive PHI fields.

## Decision

**Three-tier encryption:**

**Tier 1 — Always encrypted at field level (application-layer AES-256-GCM):**
- SSN, full date of birth, full address (street level)
- Insurance subscriber IDs
- Full clinical notes (`DocumentReference.content`)
- Audio recordings
- Genetic data (if ever collected)

**Tier 2 — Deterministic encryption (for fields requiring exact-match search):**
- Phone numbers, email addresses (for patient lookup)
- Member IDs

**Tier 3 — Storage-level encryption only (AWS KMS via RDS/S3):**
- Names, partial DOB (year only), city, state, ZIP3
- Encounter timestamps
- Diagnosis codes (de-identification analysis: code alone is not PHI in isolation)

**Key management:**
- Tenant-specific KMS keys (one per practice/hospital)
- Per-tenant data key encryption key (DEK) wrapped by tenant KMS key
- Key rotation: tenant KMS keys rotate every 90 days, DEKs rotate annually
- Customer-managed keys (CMK) available on Enterprise tier

**Implementation:**
- `packages/encryption` provides `EncryptedField<T>` TypeScript type
- SQLAlchemy custom type for Python core API
- Encryption happens in application code BEFORE the ORM
- Decryption happens AFTER the ORM, with audit log of every decrypt

## Consequences

**Positive:**
- Defense-in-depth meets HITRUST and SOC 2 expectations
- Database compromise alone does not yield PHI plaintext
- Per-tenant key isolation supports BAA termination cleanup
- Audit log captures every decrypt for HIPAA minimum-necessary

**Negative:**
- Cannot use database-level full-text search on encrypted fields (use OpenSearch with redacted index)
- Performance overhead ~5–10ms per encrypted field read
- Application code complexity higher
- Key management is operationally critical

**Risk mitigation:**
- Key recovery: AWS KMS replica keys in second region
- Tested key rotation runbook quarterly
- Encryption-as-a-service abstraction so app code never touches raw AES

## References

- NIST SP 800-57 (Key Management)
- AWS KMS best practices: https://docs.aws.amazon.com/kms/latest/developerguide/best-practices.html
- HIPAA Security Rule § 164.312(a)(2)(iv)
