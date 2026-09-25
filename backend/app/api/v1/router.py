from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.config_routes import router as config_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(config_router)
