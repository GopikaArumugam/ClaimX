import enum
from typing import Dict, Any, List
from pydantic import BaseModel, Field, field_validator


class AgentStatusEnum(str, enum.Enum):
    """Standard Agent Status values (Section 12)."""
    SUCCESS = "SUCCESS"
    NEED_MORE_EVIDENCE = "NEED_MORE_EVIDENCE"
    FAILED = "FAILED"


class RecommendedActionEnum(str, enum.Enum):
    """Standard Recommended Action values (Section 12)."""
    CONTINUE = "CONTINUE"
    RETRY = "RETRY"
    REQUEST_EVIDENCE = "REQUEST_EVIDENCE"
    ESCALATE = "ESCALATE"
    STOP = "STOP"


class AgentNameEnum(str, enum.Enum):
    ORCHESTRATOR = "orchestrator"
    DOCUMENT = "document"
    VISION = "vision"
    POLICY = "policy"
    FRAUD = "fraud"
    ESTIMATION = "estimation"
    DECISION = "decision"


class AgentContractOutput(BaseModel):
    """
    Standardized Agent Communication Contract (Section 12 & 13).
    Ensures the Claim Orchestrator remains model- and agent-independent.
    """
    claim_id: str = Field(..., min_length=3)
    agent: str = Field(..., min_length=2)
    status: AgentStatusEnum
    result: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence: List[str] = Field(default_factory=list)
    issues: List[str] = Field(default_factory=list)
    recommended_action: RecommendedActionEnum
    execution_time_ms: float = Field(default=0.0, ge=0.0)
    model_version: str = Field(default="v1.0")

    @field_validator("confidence")
    @classmethod
    def normalize_confidence(cls, v: float) -> float:
        return round(float(v), 4)

    def to_frontend_agent_result(self, display_name: str, summary: str) -> Dict[str, Any]:
        """Adapts the research contract output to the existing frontend AgentResult UI shape."""
        ui_status_map = {
            AgentStatusEnum.SUCCESS: "COMPLETED",
            AgentStatusEnum.NEED_MORE_EVIDENCE: "LOW_CONFIDENCE",
            AgentStatusEnum.FAILED: "FAILED",
        }
        ui_status = ui_status_map.get(self.status, "COMPLETED")
        if self.recommended_action == RecommendedActionEnum.ESCALATE:
            ui_status = "ESCALATED"
        elif self.recommended_action == RecommendedActionEnum.REQUEST_EVIDENCE:
            ui_status = "LOW_CONFIDENCE"

        return {
            "agentId": self.agent,
            "name": display_name,
            "status": ui_status,
            "confidence": int(round(self.confidence * 100)),
            "summary": summary,
            "evidence": self.evidence,
            "requiredAction": self.recommended_action.value,
            "reasonForAction": "; ".join(self.issues) if self.issues else "Confidence threshold satisfied",
            "details": self.result,
        }
