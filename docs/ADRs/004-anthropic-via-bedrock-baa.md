# ADR-004: Anthropic via AWS Bedrock for BAA Coverage

**Date:** 2026-05-31
**Status:** Accepted
**Deciders:** Dr. Jessica Edwards, Rick Jefferson

## Context

Zara OS agents require LLM inference on prompts that contain PHI (patient charts, encounter notes, lab results). Direct Anthropic API does not offer a HIPAA BAA to early-stage companies. We must choose an inference path that is BAA-covered.

## Decision

Use **AWS Bedrock** for all LLM inference involving PHI. Bedrock provides Claude Opus 4 and Claude Sonnet 4.5 via Anthropic-AWS partnership, with BAA coverage flowing through AWS's HIPAA-eligible services agreement.

**Model assignments:**
- `anthropic.claude-sonnet-4-5-20250929-v1:0` — default for all agents
- `anthropic.claude-opus-4-1-20250805-v1:0` — Agent P complex post-visit planning, Agent Z critical drug interaction reasoning
- `anthropic.claude-haiku-4-5-20251001-v1:0` — high-volume low-stakes routing decisions in Conductor

**Non-PHI inference** (marketing copy, internal tools, etc.) may use direct Anthropic API for cost and latency optimization.

## Consequences

**Positive:**
- BAA chain is clean (Anthropic→AWS→Zara OS→Customer)
- VPC endpoints keep traffic off public internet
- Bedrock IAM integrates with our existing AWS auth
- Cross-region failover available

**Negative:**
- Bedrock pricing is ~15% higher than direct Anthropic
- Slightly higher latency than direct API
- New model availability lags direct Anthropic by 1–4 weeks

**Risk mitigation:**
- Build inference abstraction layer (`packages/ai-inference`) so future migration is a config change
- Monitor Anthropic's direct BAA program — switch if/when offered

## Alternatives Considered

| Option | Why rejected |
|---|---|
| Direct Anthropic API | No BAA for early-stage |
| OpenAI Enterprise | No Claude family, weaker clinical reasoning per current evals |
| Self-host open-source | Compliance + cost + quality gap too large at MVP |
| Azure OpenAI | Locked to GPT family, no Claude |

## References

- AWS Bedrock: https://aws.amazon.com/bedrock/
- AWS HIPAA Eligible Services: https://aws.amazon.com/compliance/hipaa-eligible-services-reference/
- Anthropic on Bedrock: https://aws.amazon.com/bedrock/anthropic/
