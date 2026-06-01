# ADR-008: Clinical Safety Guardrails for Agents

**Date:** 2026-05-31
**Status:** Accepted
**Deciders:** Dr. Jessica Edwards (clinical lead), Rick Jefferson

## Context

LLM-based agents can hallucinate, miss critical context, or produce confidently wrong clinical content. In healthcare, the cost of a wrong action is patient harm. We must define non-negotiable safety guardrails that every agent passes through.

## Decision

**Universal guardrails (all agents):**

1. **No autonomous high-stakes actions.** Controlled substance orders, life-sustaining medication changes, do-not-resuscitate decisions — agent drafts only; human signs.

2. **No diagnostic assertion.** Agents say "consider," "evidence suggests," "differential includes" — never "the patient has."

3. **Every action is reversible.** Soft deletes only. Full event sourcing. Any agent action can be reverted within 30 days without data loss.

4. **Every action is attributed.** FHIR Provenance resource for every create/update, identifying agent ID, model version, prompt hash, reasoning trace ID.

5. **Critical alerts escalate.** Drug-drug interactions classified "major" or "contraindicated" trigger visual + audible alerts; cannot be dismissed without explicit acknowledgment.

6. **Patient safety > workflow speed.** When uncertain, agent halts and asks human. Better a slow workflow than a wrong action.

**Agent-specific guardrails:**

**P (Post-Visit Autopilot):**
- Cannot finalize billing — drafts only
- Cannot send patient letters without provider review
- Controlled substance orders flagged for explicit provider sign-off
- Follow-up appointments only auto-scheduled within evidence-based intervals

**A (AI Scribe):**
- Notes are draft until provider signs
- Cannot delete or alter audio after transcription
- Coding suggestions never auto-submit
- Confidence scores displayed for every extracted element

**Z (Clinical Assistant):**
- Never asserts diagnosis as fact
- Cites source for every clinical recommendation (USPSTF, drug DB, etc.)
- Critical alerts (life-threatening interactions, allergies) require explicit acknowledge
- Care-gap reminders are suggestions, not orders

**R (Referral Specialist):**
- Verifies insurance network before routing
- Confirms specialist accepts new patients
- Closed-loop tracking flags any referral without follow-up within 14 days
- Cannot transmit PHI via non-HIPAA channels

**M (Medical Knowledge):**
- Returns only data user is authorized for (RBAC + minimum necessary)
- Every cross-patient query requires explicit org permission
- Every access logged for HIPAA audit
- "Break-glass" emergency access fully audited + supervisor notified

**Continuous validation:**
- Weekly red-team exercise against agent prompts
- Monthly clinical safety review with Jessica + clinical advisory board
- Quarterly bias audit across demographic groups
- Annual external safety audit by independent clinical informaticist

## Consequences

**Positive:**
- Defensible posture for malpractice and regulatory scrutiny
- Aligns with ONC HTI-1 (b)(11) DSI requirements
- Builds clinician trust faster — they see we take this seriously
- Reduces catastrophic failure modes

**Negative:**
- Slower agent throughput vs. fully autonomous
- More human-in-the-loop touchpoints
- Higher engineering complexity

**Risk mitigation:**
- Build safety layer as a reusable middleware applied to every agent
- Test safety layer with adversarial prompts in CI
- Maintain "safety incident log" for any guardrail trigger — review monthly

## References

- HIPAA Security Rule
- ONC HTI-1 § 170.315(b)(11)
- FDA Software as a Medical Device (SaMD) framework
- ISMP best practices for clinical decision support
