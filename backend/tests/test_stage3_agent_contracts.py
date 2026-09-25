from typing import Dict, Any
import pytest
from app.agents.contract import (
    AgentContractOutput,
    AgentStatusEnum,
    RecommendedActionEnum,
)
from app.agents.state_machine import (
    is_terminal_state,
    validate_state_transition,
)
from app.agents.base_agent import BaseClaimAgent
from app.core.exceptions import ClaimXException


class DummyVisionAgent(BaseClaimAgent):
    agent_name = "vision"
    display_name = "Vision Agent"
    model_version = "yolov8n-test"

    def _process(self, claim_id: str, context: Dict[str, Any]) -> AgentContractOutput:
        if context.get("trigger_crash"):
            raise RuntimeError("Simulated GPU out of memory error")
        conf = float(context.get("confidence", 0.91))
        retry_count = int(context.get("retry_count", 0))
        action = self.evaluate_confidence_action(conf, retry_count=retry_count)
        status = (
            AgentStatusEnum.SUCCESS
            if action == RecommendedActionEnum.CONTINUE
            else AgentStatusEnum.NEED_MORE_EVIDENCE
        )
        return AgentContractOutput(
            claim_id=claim_id,
            agent=self.agent_name,
            status=status,
            result={"vehicle_detected": True},
            confidence=conf,
            evidence=["image_04.jpg"],
            issues=[] if conf >= 0.75 else ["Low illumination detected"],
            recommended_action=action,
        )


def test_standard_agent_contract_and_frontend_adapter():
    """Verify Section 12 Standard Agent Contract fields and frontend serialization."""
    contract = AgentContractOutput(
        claim_id="CLM001",
        agent="vision",
        status=AgentStatusEnum.SUCCESS,
        result={"damage_parts": ["front_bumper"]},
        confidence=0.91234,
        evidence=["image_04.jpg"],
        issues=[],
        recommended_action=RecommendedActionEnum.CONTINUE,
    )
    assert contract.confidence == 0.9123
    ui_obj = contract.to_frontend_agent_result("Vision Agent", "Damage localized")
    assert ui_obj["agentId"] == "vision"
    assert ui_obj["status"] == "COMPLETED"
    assert ui_obj["confidence"] == 91


def test_claim_state_machine_and_terminal_guard():
    """Verify valid transitions, illegal transition blocking, and terminal state checks."""
    assert validate_state_transition("SUBMITTED", "ORCHESTRATING") is True
    assert validate_state_transition("ORCHESTRATING", "AWAITING_CUSTOMER") is True
    assert validate_state_transition("AWAITING_CUSTOMER", "PROCESSING") is True

    # Terminal state check (Section 16)
    assert is_terminal_state("ORCHESTRATING") is False
    assert is_terminal_state("AWAITING_CUSTOMER") is False
    assert is_terminal_state("APPROVED") is True
    assert is_terminal_state("HUMAN_REVIEW_COMPLETED") is True

    # Illegal transition from PAID back to PROCESSING must raise ClaimXException
    with pytest.raises(ClaimXException) as exc_info:
        validate_state_transition("PAID", "PROCESSING")
    assert exc_info.value.error_code == "INVALID_STATE_TRANSITION"


def test_confidence_aware_recovery_and_error_containment():
    """Verify confidence threshold routing and resilient error containment on agent crash."""
    agent = DummyVisionAgent()

    # High confidence (0.92 >= 0.75) -> CONTINUE
    res_high = agent.run("CLM001", {"confidence": 0.92})
    assert res_high.status == AgentStatusEnum.SUCCESS
    assert res_high.recommended_action == RecommendedActionEnum.CONTINUE
    assert res_high.execution_time_ms >= 0.0

    # Low confidence on initial try (0.39 < 0.75, retry=0) -> REQUEST_EVIDENCE
    res_low = agent.run("CLM001", {"confidence": 0.39, "retry_count": 0})
    assert res_low.status == AgentStatusEnum.NEED_MORE_EVIDENCE
    assert res_low.recommended_action == RecommendedActionEnum.REQUEST_EVIDENCE

    # Low confidence after customer evidence retry (0.45 < 0.75, retry=1) -> RETRY
    res_retry = agent.run("CLM001", {"confidence": 0.45, "retry_count": 1})
    assert res_retry.recommended_action == RecommendedActionEnum.RETRY

    # Low confidence when retries exhausted (retry=2) -> ESCALATE
    res_esc = agent.run("CLM001", {"confidence": 0.45, "retry_count": 2})
    assert res_esc.recommended_action == RecommendedActionEnum.ESCALATE

    # Unhandled runtime exception inside agent -> contained as FAILED + ESCALATE
    res_crash = agent.run("CLM001", {"trigger_crash": True})
    assert res_crash.status == AgentStatusEnum.FAILED
    assert res_crash.recommended_action == RecommendedActionEnum.ESCALATE
    assert "Simulated GPU out of memory error" in res_crash.issues[0]
