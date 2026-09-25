from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import logger
from app.core.security import hash_password
from app.db.session import init_db, SessionLocal
from app.db.models import User, RoleEnum
from app.schemas.common import HealthResponse
from app.services.seed_claims import seed_default_policies_and_claims
from app.api.v1.router import api_v1_router


def seed_default_users(db: Session) -> None:
    default_accounts = [
        {
            "email": "arun.kumar@gmail.com",
            "full_name": "Arun Kumar",
            "role": RoleEnum.CUSTOMER,
            "policy_number": "POL-983742",
            "phone": "+91 98452 11984",
        },
        {
            "email": "anand.officer@aiclaims.internal",
            "full_name": "Anand Officer",
            "role": RoleEnum.CLAIM_HANDLER,
            "policy_number": None,
            "phone": "+91 98400 10001",
        },
        {
            "email": "admin@aiclaims.internal",
            "full_name": "System Administrator",
            "role": RoleEnum.ADMIN,
            "policy_number": None,
            "phone": "+91 98400 10000",
        },
    ]

    for acc in default_accounts:
        exists = db.query(User).filter(User.email == acc["email"]).first()
        if not exists:
            user = User(
                email=acc["email"],
                full_name=acc["full_name"],
                hashed_password=hash_password("password123"),
                role=acc["role"],
                policy_number=acc["policy_number"],
                phone=acc["phone"],
                is_active=True,
            )
            db.add(user)
    db.commit()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Initializing ClaimX Database, RBAC, and Seed Evidence...")
    init_db()
    with SessionLocal() as db:
        seed_default_users(db)
        seed_default_policies_and_claims(db)
    logger.info("ClaimX Backend ready.")
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="A Confidence-Aware Dynamically Orchestrated Multi-Agent Framework for End-to-End Insurance Claim Automation and Explainable Decision Support.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    @app.get("/api/health", response_model=HealthResponse, tags=["Health"])
    @app.get("/api/v1/health", response_model=HealthResponse, tags=["Health"])
    def health_check() -> HealthResponse:
        dialect = "postgresql" if settings.USE_POSTGRES else "sqlite"
        return HealthResponse(
            status="healthy",
            timestamp=datetime.now(timezone.utc).isoformat(),
            service=settings.APP_NAME,
            version=settings.APP_VERSION,
            database_dialect=dialect,
            experiment_version=settings.EXPERIMENT_VERSION,
        )

    app.include_router(api_v1_router, prefix=settings.API_V1_STR)
    app.include_router(api_v1_router, prefix="/api")
    return app


app = create_app()
