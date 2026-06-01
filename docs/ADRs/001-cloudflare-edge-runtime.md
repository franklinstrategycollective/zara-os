# ADR-001: Cloudflare Edge Runtime for Reception Layer

## Context & Problem Statement
Patient voice and SMS interactions require sub-200ms latency to feel conversational. Traditional serverless stacks (such as AWS Lambda) suffer from cold starts of 1–3 seconds, causing unacceptable voice lag.

## Decision
We will deploy the main administrative routing layer, including `apps/reception`, on **Cloudflare Workers**.

## Alternatives Considered
- **AWS Lambda + Node.js:** High cold starts and expensive regional routing.
- **Dedicated EC2 Containers:** High infrastructure overhead, idle host costs, and slower global scaling.

## Consequences
- **Pros:** Sub-50ms cold starts, native global distribution, and Durable Object integration for persistent patient sessions.
- **Cons:** Limited to V8 isolate-supported npm packages; heavy AI model computation must be proxied to AWS Bedrock or Cloudflare Workers AI.
- **Compliance:** Cloudflare Workers are HIPAA-eligible under the standard Enterprise BAA.
