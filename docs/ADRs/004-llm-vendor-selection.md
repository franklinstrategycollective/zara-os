# ADR-004: Multi-Model LLM Routing Strategy

## Context & Problem Statement
Using a single proprietary AI model creates vendor lock-in, price vulnerability, and downtime risk. Furthermore, medical reasoning requires massive intelligence (e.g., Claude 3.5 Sonnet / Opus), whereas routine intake is easily handled by cheaper, open-source models.

## Decision
Implement dynamic multi-model routing using the **Cloudflare AI Gateway** to handle failover, caching, and rate tracking.

## Model Mapping
- **Clinical Triage / Medical Reasoning:** Claude 3.5 Sonnet or AWS Bedrock Llama 3 70B (under active BAA).
- **Routine Intake / Scheduling:** Cloudflare Workers AI Llama 3 8B (fast, low-cost).
- **Administrative Redaction:** Locally-compiled regex and standard V8 tools.

## Consequences
- **Pros:** 40% lower operational costs, active failovers, and centralized BAA coverage.
