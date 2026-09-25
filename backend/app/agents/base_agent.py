import time
from abc import ABC, abstractmethod
from typing import Dict, Any
from app.core.config import settings
from app.core.logging_config import logger
from app.agents.contract import (
    AgentContractOutput,
    AgentStatusEnum,
    RecommendedActionEnum,
)


class BaseClaimAgent(ABC):
    """
    Abstract Base Interface for all Specialized ClaimX Agents (Section 12, 13, 31).
    Provides:
    - Centralized confidence threshold lookup from settings
    - Automatic latency measurement
    - Resilient error boundary so agent exceptions return structured FAILED contracts
      rather than crashing the entire workflow (Section 31).
    """

    agent_name: str = "base"
    display_name: str = "Base Agent"
    model_version: str = "v1.0"

    def get_confidence_threshold(self) -> float:
        threshold_map = {
            "document": settings.DOCUMENT_CONFIDENCE_THRESHOLD,
            "vision": settings.VISION_CONFIDENCE_THRESHOLD,
            "policy": settings.POLICY_CONFIDENCE_THRESHOLD,
            "decision": settings.DECISION_CONFIDENCE_THRESHOLD,
            "fraud": settings.FRAUD_REVIEW_THRESHOLD,
            "estimation": 0.75,
        }
        return threshold_map.get(self.agent_name, 0.80)

    def evaluate_confidence_action(
        self,
        confidence: float,
        retry_count: int = 0,
        can_request_customer_evidence: bool = True,
    ) -> RecommendedActionEnum:
        """
        Determines confidence-aware recommended action (Section 13):
        - If confidence >= configured threshold -> CONTINUE
        - If confidence < threshold and can request customer evidence -> REQUEST_EVIDENCE
        - If retries < MAX_AGENT_RETRIES -> RETRY
        - Otherwise -> ESCALATE to Human Review
        """
        threshold = self.get_confidence_threshold()
        if confidence >= threshold:
            return RecommendedActionEnum.CONTINUE
        if can_request_customer_evidence and retry_count == 0:
            return RecommendedActionEnum.REQUEST_EVIDENCE
        if retry_count < settings.MAX_AGENT_RETRIES:
            return RecommendedActionEnum.RETRY
        return RecommendedActionEnum.ESCALATE

    @abstractmethod
    def _process(self, claim_id: str, context: Dict[str, Any]) -> AgentContractOutput:
        """Subclasses implement core domain/ML logic here."""
        pass

    def run(self, claim_id: str, context: Dict[str, Any]) -> AgentContractOutput:
        """
        Executes the agent safely with timing and error containment (Section 31).
        """
        start = time.perf_counter()
        try:
            output = self._process(claim_id, context)
            elapsed_ms = round((time.perf_counter() - start) * 1000.0, 2)
            output.execution_time_ms = elapsed_ms
            output.model_version = self.model_version
            return output
        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - start) * 1000.0, 2)
            logger.error(f"Agent '{self.agent_name}' failed on claim '{claim_id}': {exc}")
            return AgentContractOutput(
                claim_id=claim_id,
                agent=self.agent_name,
                status=AgentStatusEnum.FAILED,
                result={"error": str(exc)},
                confidence=0.0,
                evidence=[],
                issues=[f"Agent execution failure: {str(exc)}"],
                recommended_action=RecommendedActionEnum.ESCALATE,
                execution_time_ms=elapsed_ms,
                model_version=self.model_version,
            )
