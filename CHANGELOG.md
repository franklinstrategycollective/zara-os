# Changelog

All notable changes to Zara OS will be documented in this file.

## [0.1.0] - 2026-05-31
### Added
- Complete monorepo scaffold using pnpm workspaces.
- Cloudflare Workers reception application `apps/reception` built on Hono.
- Specialized typescript agents: `IntakeAgent`, `TriageAgent`, `SchedulingAgent`, and `EscalationAgent`.
- Core patient EHR and scheduling tools for integration testing.
- Unified HIPAA cryptographic audit logging library under `packages/compliance`.
- Core architecture decision records (ADRs 001 through 004).
- Automated HIPAA CI gate control verification script (`scripts/hipaa-control-check.mjs`).
