"""
Zara OS — Agent Conductor
Routes work between PAZRM agents. LangGraph-backed state machine.
Every action writes to immutable audit log before execution.
"""
from enum import Enum
from typing import Any

import structlog
from pydantic import BaseModel

logger = structlog.get_logger()


class AgentID(str, Enum):
    P_AUTOPILOT = "p_autopilot"
    A_SCRIBE = "a_scribe"
    Z_CLINICAL = "z_clinical"
    R_REFERRAL = "r_referral"
    M_KNOWLEDGE = "m_knowledge"


class WorkItem(BaseModel):
    work_id: str
    agent: AgentID
    encounter_id: str | None = None
    patient_id: str | None = None
    payload: dict[str, Any]
    requested_by: str  # user_id or system
    risk_tier: str  # "green" | "yellow" | "red"


class Conductor:
    """Routes work to specialist agents with full audit trail."""

    async def dispatch(self, work: WorkItem) -> dict[str, Any]:
        # 1. Pre-flight audit log
        await self._audit(work, "dispatch_start")

        # 2. Safety check (clinical guardrails per ADR-008)
        if not await self._safety_check(work):
            await self._audit(work, "safety_block")
            return {"status": "blocked", "reason": "safety_guardrail"}

        # 3. Route to agent
        logger.info("conductor_dispatch", agent=work.agent, work_id=work.work_id)

        # TODO Sprint 3: actual agent invocation via LangGraph
        result = {"status": "stub", "agent": work.agent}

        # 4. Post-flight audit log
        await self._audit(work, "dispatch_complete", result=result)
        return result

    async def _audit(self, work: WorkItem, event: str, **extra: Any) -> None:
        # TODO Sprint 1: write to immutable audit log via @zara-os/audit
        logger.info("audit", event=event, work_id=work.work_id, **extra)

    async def _safety_check(self, work: WorkItem) -> bool:
        # TODO Sprint 3: clinical safety rules per ADR-008
        return True
