"""
Audit log middleware — captures every request involving PHI.
Per HIPAA § 164.312(b).
"""
import uuid
from typing import Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger()


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Logs every request to the immutable audit log."""

    # Routes that involve PHI — every operation here is audited
    PHI_ROUTE_PREFIXES = [
        "/api/v1/patients",
        "/api/v1/encounters",
        "/api/v1/observations",
        "/api/v1/medications",
        "/api/v1/conditions",
        "/api/v1/allergies",
        "/api/v1/documents",
        "/api/v1/referrals",
        "/api/v1/appointments",
        "/api/v1/agents",
    ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        is_phi_route = any(
            request.url.path.startswith(prefix) for prefix in self.PHI_ROUTE_PREFIXES
        )

        if not is_phi_route:
            return await call_next(request)

        # Pre-flight log
        actor_id = self._get_actor_id(request)
        tenant_id = self._get_tenant_id(request)

        response = await call_next(request)

        # Post-flight log
        action = self._method_to_action(request.method)
        outcome = "success" if response.status_code < 400 else (
            "denied" if response.status_code in (401, 403) else "error"
        )

        logger.info(
            "audit",
            event_id=str(uuid.uuid4()),
            actor_id=actor_id,
            actor_type="human",
            action=action,
            resource_type=self._extract_resource_type(request.url.path),
            tenant_id=tenant_id,
            request_id=request_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            outcome=outcome,
            path=request.url.path,
            method=request.method,
            status_code=response.status_code,
        )

        # TODO Sprint 1.5: persist to audit_log table via AuditLog SDK
        return response

    def _get_actor_id(self, request: Request) -> str:
        return getattr(request.state, "user_id", "anonymous")

    def _get_tenant_id(self, request: Request) -> str:
        return getattr(request.state, "tenant_id", "unknown")

    def _method_to_action(self, method: str) -> str:
        mapping = {
            "GET": "read",
            "POST": "create",
            "PUT": "update",
            "PATCH": "update",
            "DELETE": "delete",
        }
        return mapping.get(method, "read")

    def _extract_resource_type(self, path: str) -> str:
        parts = path.strip("/").split("/")
        if len(parts) >= 3:
            return parts[2]  # /api/v1/{resource}
        return "unknown"
