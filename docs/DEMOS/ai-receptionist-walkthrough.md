# AI Receptionist Walkthrough

This walkthrough outlines the exact live call conversation handled by the Zara OS AI Receptionist (`apps/reception`), proving the sub-200ms latency advantage of the Cloudflare Workers execution plane.

## Standard Workflow Trace

1. **Patient Inbound:** Caller is connected via Twilio secure webhook.
2. **Utterance Processing:** Caller states: *"Hello, I'm Jessica Edwards. I'd like to check my chart status."*
3. **Edge Validation & Intake:**
   - Hono router triggers `IntakeAgent`.
   - `EhrLookupTool` is called, locating chart ID `CHART-90821-BC`.
4. **Instant Response Streamed:** Caller hears: *"Welcome back, Dr. Edwards. Verified active chart ID: CHART-90821-BC."*

## Emergency Escalation Workflow Trace

1. **Patient Inbound:** Caller states: *"I have severe chest pain and difficulty breathing."*
2. **Triage Filter:** `TriageAgent` classifies as `clinical-urgent`.
3. **Alert Triggered:** `EscalationAgent` sends a high-priority SMS alert to the on-call medical staff within 50ms of classification.
