from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.config_routes import router as config_router
from app.api.v1.claims import router as claims_router
from app.api.v1.audit_routes import router as audit_router
from app.api.v1.orchestrator_routes import router as orchestrator_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(config_router)
api_v1_router.include_router(claims_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(orchestrator_router)
