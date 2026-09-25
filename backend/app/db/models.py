import enum
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Text,
    Enum as SqlEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RoleEnum(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    CLAIM_HANDLER = "CLAIM_HANDLER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleEnum] = mapped_column(SqlEnum(RoleEnum), default=RoleEnum.CUSTOMER, nullable=False)
    policy_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    policy_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    holder_name: Mapped[str] = mapped_column(String(255), nullable=False)
    vehicle_number: Mapped[str] = mapped_column(String(100), nullable=False)
    vehicle_model: Mapped[str] = mapped_column(String(255), nullable=False)
    coverage_type: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Active")
    coverage_limit: Mapped[float] = mapped_column(Float, default=500000.0)
    deductible: Mapped[float] = mapped_column(Float, default=5000.0)
    valid_from: Mapped[str] = mapped_column(String(50), nullable=False)
    valid_until: Mapped[str] = mapped_column(String(50), nullable=False)
    clauses_json: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(64), default="")
    customer_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    policy_number: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    policy_coverage: Mapped[str] = mapped_column(String(255), default="Comprehensive Private Car Gold")
    policy_status: Mapped[str] = mapped_column(String(50), default="Active")
    policy_limit: Mapped[float] = mapped_column(Float, default=500000.0)

    vehicle_number: Mapped[str] = mapped_column(String(100), nullable=False)
    vehicle_model: Mapped[str] = mapped_column(String(255), nullable=False)
    accident_date: Mapped[str] = mapped_column(String(50), nullable=False)
    accident_location: Mapped[str] = mapped_column(String(255), nullable=False)
    claim_type: Mapped[str] = mapped_column(String(100), default="Vehicle Collision")
    incident_description: Mapped[str] = mapped_column(Text, nullable=False)

    claimed_amount: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_amount: Mapped[float] = mapped_column(Float, default=0.0)
    approved_amount: Mapped[float] = mapped_column(Float, default=0.0)
    deductible: Mapped[float] = mapped_column(Float, default=5000.0)

    fraud_risk: Mapped[float] = mapped_column(Float, default=0.0)
    overall_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    current_agent: Mapped[str] = mapped_column(String(64), default="orchestrator")
    status: Mapped[str] = mapped_column(String(64), default="SUBMITTED", index=True)
    risk_level: Mapped[str] = mapped_column(String(32), default="Low")

    agent_results_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    orchestrator_notes_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    settlement_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    human_review_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class DocumentRecord(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    doc_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    claim_id: Mapped[str] = mapped_column(String(64), ForeignKey("claims.claim_id"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Pending")
    ocr_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    file_size: Mapped[str] = mapped_column(String(50), default="1.0 MB")
    storage_uri: Mapped[str] = mapped_column(Text, nullable=False)
    extracted_fields: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ImageRecord(Base):
    __tablename__ = "images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    img_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    claim_id: Mapped[str] = mapped_column(String(64), ForeignKey("claims.claim_id"), index=True)
    angle: Mapped[str] = mapped_column(String(100), default="Front View")
    storage_uri: Mapped[str] = mapped_column(Text, nullable=False)
    quality: Mapped[str] = mapped_column(String(50), default="Good")
    vision_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    dhash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    damage_detected: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AgentExecutionRecord(Base):
    __tablename__ = "agent_executions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_id: Mapped[str] = mapped_column(String(64), ForeignKey("claims.claim_id"), index=True)
    agent: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    result_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    evidence: Mapped[List[str]] = mapped_column(JSON, default=list)
    issues: Mapped[List[str]] = mapped_column(JSON, default=list)
    recommended_action: Mapped[str] = mapped_column(String(50), nullable=False)
    execution_time_ms: Mapped[float] = mapped_column(Float, default=0.0)
    model_version: Mapped[str] = mapped_column(String(100), default="v1.0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class FraudAssessmentRecord(Base):
    __tablename__ = "fraud_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_id: Mapped[str] = mapped_column(String(64), ForeignKey("claims.claim_id"), index=True)
    fraud_risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    contributing_signals: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    recommendation: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class CostEstimateRecord(Base):
    __tablename__ = "cost_estimates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_id: Mapped[str] = mapped_column(String(64), ForeignKey("claims.claim_id"), index=True)
    estimated_amount: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    breakdown: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class DecisionRecord(Base):
    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_id: Mapped[str] = mapped_column(String(64), ForeignKey("claims.claim_id"), index=True)
    recommendation: Mapped[str] = mapped_column(String(64), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    satisfied_conditions: Mapped[List[str]] = mapped_column(JSON, default=list)
    unsatisfied_conditions: Mapped[List[str]] = mapped_column(JSON, default=list)
    unresolved_issues: Mapped[List[str]] = mapped_column(JSON, default=list)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class HumanReviewRecord(Base):
    __tablename__ = "human_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_id: Mapped[str] = mapped_column(String(64), ForeignKey("claims.claim_id"), index=True)
    reviewer_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    decision: Mapped[str] = mapped_column(String(64), nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    override_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AuditEventRecord(Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_id: Mapped[str] = mapped_column(String(64), ForeignKey("claims.claim_id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    agent: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    evidence_refs: Mapped[List[str]] = mapped_column(JSON, default=list)
    result_summary: Mapped[str] = mapped_column(Text, default="")
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reason: Mapped[str] = mapped_column(Text, default="")
    next_action: Mapped[str] = mapped_column(String(100), default="")


class FinalReportRecord(Base):
    __tablename__ = "final_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_id: Mapped[str] = mapped_column(String(64), ForeignKey("claims.claim_id"), unique=True, index=True)
    terminal_state: Mapped[str] = mapped_column(String(64), nullable=False)
    report_payload: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
