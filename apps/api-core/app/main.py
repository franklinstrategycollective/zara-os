"""
Zara OS — Core API
PHI handling layer. Deploy to AWS EKS only. Never to Cloudflare.
"""
import os
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.middleware.audit_log import AuditLogMiddleware
from app.middleware.phi_redaction import PHIRedactionMiddleware
from app.middleware.rate_limit import RateLimitMiddleware

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("zara_os_api_core_starting", env=os.getenv("NODE_ENV", "development"))
    # Startup: DB pool, Redis, FHIR client init
    yield
    logger.info("zara_os_api_core_stopping")


app = FastAPI(
    title="Zara OS Core API",
    description="PHI handling layer — HIPAA-eligible deployment only",
    version="0.0.1",
    lifespan=lifespan,
    docs_url="/internal/docs" if os.getenv("NODE_ENV") != "production" else None,
    redoc_url=None,
    openapi_url="/internal/openapi.json" if os.getenv("NODE_ENV") != "production" else None,
)

# Order matters: audit log first (captures everything), then PHI redaction, then rate limit
app.add_middleware(AuditLogMiddleware)
app.add_middleware(PHIRedactionMiddleware)
app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("APP_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "zara-os-api-core", "version": "0.0.1"}


@app.get("/ready")
async def ready():
    # TODO Sprint 1: DB + Redis + FHIR server connectivity checks
    return {"status": "ready"}


# TODO Sprint 1: include routers from app.routes
# from app.routes import patients, encounters, observations
# app.include_router(patients.router, prefix="/api/v1/patients", tags=["patients"])
