"""
Patient resource endpoints — FHIR R4 Patient.
Every operation audited. Field-level encryption on sensitive fields.
"""
from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field

logger = structlog.get_logger()
router = APIRouter()


class PatientCreate(BaseModel):
    given_name: str = Field(..., min_length=1, max_length=100)
    family_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    gender: str = Field(..., pattern="^(male|female|other|unknown)$")
    email: EmailStr | None = None
    phone: str | None = None


class PatientResponse(BaseModel):
    id: UUID
    given_name: str
    family_name: str
    date_of_birth: str
    gender: str
    email: EmailStr | None
    phone: str | None
    created_at: str


async def require_authenticated_user(request: Request) -> dict:
    """Auth dependency — extracts user from JWT, attaches to request.state."""
    # TODO Sprint 1.5: real JWT verification
    user = {"id": "stub-user", "tenant_id": "stub-tenant", "role": "provider"}
    request.state.user_id = user["id"]
    request.state.tenant_id = user["tenant_id"]
    return user


async def require_minimum_necessary_access(
    request: Request,
    user: Annotated[dict, Depends(require_authenticated_user)],
) -> dict:
    """HIPAA minimum-necessary: validate the user has reason to access this resource."""
    if user["role"] not in ("provider", "ma", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient role for patient access",
        )
    return user


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreate,
    user: Annotated[dict, Depends(require_minimum_necessary_access)],
) -> PatientResponse:
    """Create a new patient. Writes to FHIR server. Audit logged."""
    logger.info("patient_create_attempt", actor=user["id"])

    # TODO Sprint 2: call FHIR server to create Patient resource
    # TODO Sprint 2: field-level encrypt name + DOB before storage
    # TODO Sprint 2: emit Provenance resource

    # Stub response for Sprint 1
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Patient creation pending Sprint 2 — FHIR server integration",
    )


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: UUID,
    user: Annotated[dict, Depends(require_minimum_necessary_access)],
) -> PatientResponse:
    """Get patient by ID. Audit logged. Field decryption with audit trail."""
    logger.info("patient_read_attempt", actor=user["id"], patient_id=str(patient_id))

    # TODO Sprint 2: fetch from FHIR server, decrypt fields, return
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Patient retrieval pending Sprint 2",
    )
