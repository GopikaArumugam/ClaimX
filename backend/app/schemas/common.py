from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    timestamp: str
    service: str
    version: str
    database_dialect: str
    experiment_version: str


class ThresholdConfigUpdate(BaseModel):
    document_confidence_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    vision_confidence_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    policy_confidence_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    decision_confidence_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    fraud_review_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    max_auto_approval_amount_inr: Optional[float] = Field(default=None, ge=0.0)
    max_agent_retries: Optional[int] = Field(default=None, ge=0, le=5)


class ThresholdConfigResponse(BaseModel):
    success: bool = True
    thresholds: Dict[str, Any]
