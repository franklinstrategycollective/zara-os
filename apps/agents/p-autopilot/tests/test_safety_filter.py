"""
Agent P safety filter tests.
Per ADR-008: must catch controlled substances, low confidence, etc.
"""
import pytest

from app.agents.p_autopilot.src.agent import (
    AgentPOutput,
    Artifact,
    QaFlag,
    contains_controlled_substance,
    safety_filter,
)


def make_artifact(
    resource_type: str = "ServiceRequest",
    draft: dict | None = None,
    confidence: float = 0.85,
    rationale: str = "test rationale",
) -> Artifact:
    return Artifact(
        resourceType=resource_type,
        draft=draft or {"resourceType": resource_type, "status": "draft"},
        confidence=confidence,
        rationale=rationale,
        requires_sign_off=True,
        evidence_basis="clinical_judgment",
    )


class TestControlledSubstanceDetection:
    def test_oxycodone_detected(self):
        draft = {
            "resourceType": "MedicationRequest",
            "status": "draft",
            "medicationCodeableConcept": {
                "coding": [{"display": "Oxycodone 10 mg tablet"}],
            },
        }
        assert contains_controlled_substance(draft) is True

    def test_adderall_detected(self):
        draft = {
            "resourceType": "MedicationRequest",
            "status": "draft",
            "medicationCodeableConcept": {
                "coding": [{"display": "Adderall XR 20 mg"}],
            },
        }
        assert contains_controlled_substance(draft) is True

    def test_non_controlled_passes(self):
        draft = {
            "resourceType": "MedicationRequest",
            "status": "draft",
            "medicationCodeableConcept": {
                "coding": [{"display": "Lisinopril 10 mg tablet"}],
            },
        }
        assert contains_controlled_substance(draft) is False

    def test_non_medication_passes(self):
        draft = {
            "resourceType": "ServiceRequest",
            "status": "draft",
        }
        assert contains_controlled_substance(draft) is False


class TestSafetyFilter:
    def test_controlled_substance_demoted_to_qa_flag(self):
        controlled_artifact = make_artifact(
            resource_type="MedicationRequest",
            draft={
                "resourceType": "MedicationRequest",
                "status": "draft",
                "medicationCodeableConcept": {"coding": [{"display": "Hydrocodone 5 mg"}]},
            },
        )
        normal_artifact = make_artifact()

        output = AgentPOutput(
            summary="test",
            artifacts=[controlled_artifact, normal_artifact],
            qa_flags=[],
        )

        result = safety_filter(output)

        assert len(result.artifacts) == 1
        assert result.artifacts[0].resourceType == "ServiceRequest"
        assert len(result.qa_flags) == 1
        assert result.qa_flags[0].category == "controlled_substance_flagged"
        assert result.qa_flags[0].severity == "high"

    def test_low_confidence_demoted_to_qa_flag(self):
        low_conf = make_artifact(confidence=0.3)
        high_conf = make_artifact(confidence=0.95)

        output = AgentPOutput(
            summary="test",
            artifacts=[low_conf, high_conf],
            qa_flags=[],
        )

        result = safety_filter(output)

        assert len(result.artifacts) == 1
        assert result.artifacts[0].confidence == 0.95
        assert len(result.qa_flags) == 1
        assert result.qa_flags[0].category == "low_confidence_artifact"

    def test_status_forced_to_draft(self):
        # Even if model returns status=active, filter forces draft
        artifact = make_artifact(
            draft={"resourceType": "ServiceRequest", "status": "active"},
        )
        output = AgentPOutput(summary="test", artifacts=[artifact], qa_flags=[])

        result = safety_filter(output)

        assert result.artifacts[0].draft["status"] == "draft"

    def test_empty_input_returns_empty(self):
        output = AgentPOutput(summary="test", artifacts=[], qa_flags=[])
        result = safety_filter(output)
        assert result.artifacts == []
        assert result.qa_flags == []
