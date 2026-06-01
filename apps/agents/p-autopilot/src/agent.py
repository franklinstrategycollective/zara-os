"""
Agent P — Post-Visit Autopilot runtime.
Per ADR-003, ADR-008.
"""
import hashlib
import json
import uuid
from pathlib import Path
from typing import Any

import structlog
from pydantic import BaseModel, Field, field_validator

logger = structlog.get_logger()

# ─── Schemas ───

class Artifact(BaseModel):
    resourceType: str
    draft: dict[str, Any]
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str
    requires_sign_off: bool = True
    evidence_basis: str

    @field_validator("draft")
    @classmethod
    def must_be_draft_status(cls, v: dict[str, Any]) -> dict[str, Any]:
        if v.get("status") not in ("draft", "proposed", "active"):
            raise ValueError("Draft must have valid FHIR status")
        # Force status=draft for safety — provider activates
        if v.get("status") != "proposed":
            v["status"] = "draft"
        return v


class QaFlag(BaseModel):
    category: str
    description: str
    severity: str


class AgentPOutput(BaseModel):
    summary: str
    artifacts: list[Artifact]
    qa_flags: list[QaFlag]
    halt_reason: str | None = None


class AgentPInput(BaseModel):
    encounter: dict[str, Any]
    note: str
    patient_summary: dict[str, Any]
    recent_observations: list[dict[str, Any]]
    provider_preferences: dict[str, Any]
    coverage: dict[str, Any] | None


# ─── Safety checks per ADR-008 ───

CONTROLLED_SUBSTANCE_MARKERS = {
    "schedule ii", "schedule iii", "schedule iv", "schedule v",
    "oxycodone", "hydrocodone", "fentanyl", "morphine", "adderall",
    "ritalin", "xanax", "alprazolam", "diazepam", "klonopin",
    "ambien", "lunesta", "tramadol", "codeine",
}


def contains_controlled_substance(draft: dict[str, Any]) -> bool:
    """Pre-flight check: does this draft involve a controlled substance?"""
    if draft.get("resourceType") != "MedicationRequest":
        return False
    medication = draft.get("medicationCodeableConcept", {})
    text = json.dumps(medication).lower()
    return any(marker in text for marker in CONTROLLED_SUBSTANCE_MARKERS)


def safety_filter(output: AgentPOutput) -> AgentPOutput:
    """Apply ADR-008 safety guardrails to agent output."""
    safe_artifacts = []
    for artifact in output.artifacts:
        # Hard rule: no controlled substance prescriptions
        if contains_controlled_substance(artifact.draft):
            output.qa_flags.append(QaFlag(
                category="controlled_substance_flagged",
                description=(
                    f"Agent P flagged but did not draft controlled substance: "
                    f"{artifact.rationale[:100]}"
                ),
                severity="high",
            ))
            continue

        # Hard rule: confidence < 0.5 → demote to QA flag
        if artifact.confidence < 0.5:
            output.qa_flags.append(QaFlag(
                category="low_confidence_artifact",
                description=f"Demoted from artifact: {artifact.rationale[:100]}",
                severity="medium",
            ))
            continue

        # Force status=draft
        artifact.draft["status"] = "draft"
        safe_artifacts.append(artifact)

    output.artifacts = safe_artifacts
    return output


# ─── Agent runtime ───

class AgentP:
    """Post-Visit Autopilot agent."""

    def __init__(self, bedrock_client: Any, audit_writer: Any):
        self.bedrock = bedrock_client
        self.audit = audit_writer
        prompt_path = Path(__file__).parent.parent / "prompts" / "system.md"
        self.system_prompt = prompt_path.read_text()
        self.prompt_hash = hashlib.sha256(self.system_prompt.encode()).hexdigest()[:16]

    async def run(
        self,
        agent_input: AgentPInput,
        actor_context: dict[str, str],
    ) -> AgentPOutput:
        """Execute Agent P against an encounter."""
        trace_id = str(uuid.uuid4())

        # Pre-flight audit log
        await self.audit({
            "event_id": str(uuid.uuid4()),
            "actor_id": "agent_p",
            "actor_type": "agent_p",
            "action": "create",
            "resource_type": "AgentRun",
            "resource_id": trace_id,
            "patient_id": agent_input.encounter.get("subject", {}).get("reference", "").replace("Patient/", ""),
            "tenant_id": actor_context["tenant_id"],
            "request_id": actor_context["request_id"],
            "outcome": "success",
            "metadata": {
                "agent": "p_autopilot",
                "prompt_hash": self.prompt_hash,
                "phase": "start",
            },
        })

        # Build user message
        user_message = json.dumps(agent_input.model_dump(), indent=2)

        try:
            # Invoke Bedrock Claude
            response = await self._invoke_bedrock(user_message)
            raw_output = self._extract_json(response)
            output = AgentPOutput.model_validate(raw_output)
        except Exception as e:
            logger.error("agent_p_failure", error=str(e), trace_id=trace_id)
            await self.audit({
                "event_id": str(uuid.uuid4()),
                "actor_id": "agent_p",
                "actor_type": "agent_p",
                "action": "create",
                "resource_type": "AgentRun",
                "resource_id": trace_id,
                "tenant_id": actor_context["tenant_id"],
                "request_id": actor_context["request_id"],
                "outcome": "error",
                "metadata": {"error": str(e), "phase": "complete"},
            })
            raise

        # If model halted, respect it
        if output.halt_reason:
            logger.info("agent_p_halted", reason=output.halt_reason, trace_id=trace_id)
            return output

        # Apply safety filter
        output = safety_filter(output)

        # Post-flight audit
        await self.audit({
            "event_id": str(uuid.uuid4()),
            "actor_id": "agent_p",
            "actor_type": "agent_p",
            "action": "create",
            "resource_type": "AgentRun",
            "resource_id": trace_id,
            "tenant_id": actor_context["tenant_id"],
            "request_id": actor_context["request_id"],
            "outcome": "success",
            "metadata": {
                "agent": "p_autopilot",
                "prompt_hash": self.prompt_hash,
                "phase": "complete",
                "artifacts_drafted": len(output.artifacts),
                "qa_flags": len(output.qa_flags),
            },
        })

        return output

    async def _invoke_bedrock(self, user_message: str) -> str:
        """Invoke Bedrock Claude. Stub for Sprint 1 — real impl Sprint 3."""
        # TODO Sprint 3: real boto3 bedrock-runtime invoke_model call
        raise NotImplementedError("Bedrock invocation pending Sprint 3")

    def _extract_json(self, response: str) -> dict[str, Any]:
        """Extract JSON from Claude response. Robust to surrounding text."""
        # Find first { and last }
        start = response.find("{")
        end = response.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("No JSON found in agent response")
        return json.loads(response[start : end + 1])
