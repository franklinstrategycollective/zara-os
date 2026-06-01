# Security Policy — Zara OS

## Reporting a Vulnerability

If you discover a security vulnerability in Zara OS, please report it responsibly.

**DO NOT** open a public GitHub issue.

**DO** email: security@rjbusinesssolutions.org

You should receive a response within 24 hours. We will keep you informed throughout remediation.

## Supported Versions

| Version | Supported |
|---|---|
| main | ✅ |
| pre-release | ❌ |

## HIPAA-Specific Disclosures

If your vulnerability report involves potential PHI exposure:
1. Do not share PHI with us via email
2. Provide reproduction steps without including PHI
3. Note "PHI exposure suspected" in subject line for priority routing

## Bug Bounty

Pre-launch: invitation-only program. Contact security@rjbusinesssolutions.org for details.

## Encryption

All Zara OS PHI is encrypted at rest (AES-256 via AWS KMS) and in transit (TLS 1.3 minimum). Customer-managed encryption keys available on Enterprise tier.

## Auditing

All PHI access is logged immutably and retained for 7 years minimum per HIPAA.

## Compliance Targets

- HIPAA Security Rule
- HIPAA Privacy Rule
- HIPAA Breach Notification Rule
- SOC 2 Type II
- HITRUST CSF
- ONC HTI-1 Certification
