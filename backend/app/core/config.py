from typing import Dict, Any
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized configuration for ClaimX Backend & Research Framework.
    All confidence thresholds, safety limits, and reproducibility parameters
    are managed here rather than scattered across agent logic (Section 13 & 27).
    """

    APP_NAME: str = "ClaimX: Confidence-Aware Multi-Agent Insurance Framework"
    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = 5000

    # Database Configuration (PostgreSQL + pgvector primary, SQLite research fallback)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/claimx_db"
    FALLBACK_SQLITE_URL: str = "sqlite:///./claimx_research.db"
    USE_POSTGRES: bool = False

    # JWT & RBAC Security Configuration (Section 21)
    JWT_SECRET_KEY: str = "claimx-scopus-research-secret-key-2026-verified"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Centralized Confidence-Aware Recovery Thresholds (Section 13)
    DOCUMENT_CONFIDENCE_THRESHOLD: float = Field(default=0.80, ge=0.0, le=1.0)
    VISION_CONFIDENCE_THRESHOLD: float = Field(default=0.75, ge=0.0, le=1.0)
    POLICY_CONFIDENCE_THRESHOLD: float = Field(default=0.85, ge=0.0, le=1.0)
    DECISION_CONFIDENCE_THRESHOLD: float = Field(default=0.85, ge=0.0, le=1.0)
    FRAUD_REVIEW_THRESHOLD: float = Field(default=0.45, ge=0.0, le=1.0)

    # Deterministic Financial & Retry Guardrails (Section 11 & 13)
    MAX_AUTO_APPROVAL_AMOUNT_INR: float = Field(default=50000.0, ge=0.0)
    MAX_AGENT_RETRIES: int = Field(default=2, ge=0, le=5)

    # Research Reproducibility Metadata (Section 27)
    RANDOM_SEED: int = 42
    EXPERIMENT_VERSION: str = "exp-v1.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def active_database_url(self) -> str:
        if self.USE_POSTGRES:
            return self.DATABASE_URL
        return self.FALLBACK_SQLITE_URL

    def get_thresholds_dict(self) -> Dict[str, Any]:
        return {
            "document_confidence_threshold": self.DOCUMENT_CONFIDENCE_THRESHOLD,
            "vision_confidence_threshold": self.VISION_CONFIDENCE_THRESHOLD,
            "policy_confidence_threshold": self.POLICY_CONFIDENCE_THRESHOLD,
            "decision_confidence_threshold": self.DECISION_CONFIDENCE_THRESHOLD,
            "fraud_review_threshold": self.FRAUD_REVIEW_THRESHOLD,
            "max_auto_approval_amount_inr": self.MAX_AUTO_APPROVAL_AMOUNT_INR,
            "max_agent_retries": self.MAX_AGENT_RETRIES,
            "random_seed": self.RANDOM_SEED,
            "experiment_version": self.EXPERIMENT_VERSION,
        }

    def update_thresholds(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        mapping = {
            "document_confidence_threshold": "DOCUMENT_CONFIDENCE_THRESHOLD",
            "vision_confidence_threshold": "VISION_CONFIDENCE_THRESHOLD",
            "policy_confidence_threshold": "POLICY_CONFIDENCE_THRESHOLD",
            "decision_confidence_threshold": "DECISION_CONFIDENCE_THRESHOLD",
            "fraud_review_threshold": "FRAUD_REVIEW_THRESHOLD",
            "max_auto_approval_amount_inr": "MAX_AUTO_APPROVAL_AMOUNT_INR",
            "max_agent_retries": "MAX_AGENT_RETRIES",
        }
        for key, value in updates.items():
            attr = mapping.get(key)
            if attr and value is not None:
                setattr(self, attr, value)
        return self.get_thresholds_dict()


settings = Settings()
