# Zara OS — Autoresearch Manifest

## Frozen (agent NEVER modifies)
- `evaluation/`
- `tests/fhir-conformance/`
- `tests/probes/`
- `compliance/hipaa/security-rule-controls.md`
- `compliance/onc-hti1/`
- `data-flows.yaml`
- `docs/ADRs/` (existing ADRs are immutable; new ones additive only)
- Target metric definitions (below)
- Budget caps (below)

## Mutable (agent may modify)
- `apps/web/components/`
- `apps/web/app/(marketing)/`
- `apps/agents/*/prompts/`
- `apps/agents/*/tools/`
- Performance optimizations in non-PHI paths

## Target Metrics

| Metric | Definition | Direction |
|---|---|---|
| `provider_time_saved_min_per_encounter` | Time from encounter start to chart-closed | minimize |
| `scribe_note_acceptance_rate` | % of AI-drafted SOAP notes accepted with <10% edits | maximize |
| `referral_close_loop_rate` | % of referrals with confirmed specialist appointment within 14d | maximize |
| `code_capture_rate` | % of billable codes captured by Agent P vs human baseline | maximize |
| `fhir_conformance_score` | Touchstone FHIR R4 conformance test pass rate | maintain at 100% |
| `phi_audit_completeness` | % of PHI accesses with full audit log | maintain at 100% |

## Budget Caps

- Inference cost per encounter: <$0.50 (Bedrock + Transcribe)
- API p95 latency: <800ms (non-AI), <3s (AI-augmented)
- Daily autoresearch experiment cost: <$25
- Total monthly AI inference cap: $5,000 until 100 providers onboarded

## Experimentation Rules

- One variable change per experiment
- Frozen evaluation harness runs against synthetic patient cohort only
- NEVER experiment against real PHI
- Winning variants require >5% improvement at p<0.05 over n>500 synthetic encounters
