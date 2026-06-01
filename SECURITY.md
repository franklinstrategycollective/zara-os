# Security & HIPAA Compliance Posture

Zara OS is designed from the ground up to respect patient confidentiality and adhere strictly to the **HIPAA Security Rule** and **SOC 2 Type II** security criteria.

## Core Pillars of Security

### 1. Zero PHI on Edge Runtimes
Cloudflare Workers and Durable Objects process patient streams in real-time but do not persist or cache any raw Protected Health Information (PHI) in edge-side storage.

### 2. Mandatory End-to-End Encryption
- **In Transit:** All APIs require HTTPS/TLS 1.3 with secure cipher suites. Communication with backends utilizes Mutually Authenticated TLS (mTLS).
- **At Rest:** Database instances on Supabase and Medplum utilize AES-256 transparent data encryption.

### 3. Cryptographically Chained Audit Logging
Every action, data modification, or tool request results in an entry in an append-only database. Each log contains:
- Cryptographic hash chaining (SHA-256 of the current log combined with the prior entry's hash).
- Verified UTC timestamp.
- IP Address and identity signature of the requester.

## Vulnerability Disclosure
If you find a security vulnerability, please do not file a public issue. Email security@zaramedical.com directly to initiate our private disclosure and patch protocol.
