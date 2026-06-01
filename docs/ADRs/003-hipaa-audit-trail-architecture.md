# ADR-003: HIPAA Cryptographic Audit Trail

## Context & Problem Statement
HIPAA §164.312(b) requires systems to record and examine activity in systems containing PHI. Standard text-based application logs can be modified or deleted by compromised superuser accounts, violating audit integrity.

## Decision
Zara OS will implement an append-only cryptographically-chained database structure for all audit events.

## Mechanism
Every log entry stores the SHA-256 hash of the previous log entry. Any alteration or deletion of past events breaks the chain verification immediately.

## Consequences
- **Pros:** Absolute, non-repudiable proof of system mutations. Defensible in federal HIPAA audits.
- **Cons:** ~15-30ms execution cost to calculate hashes and commit write before proceeding.
