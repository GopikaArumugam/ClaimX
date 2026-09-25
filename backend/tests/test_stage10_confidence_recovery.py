from app.agents.recovery_engine import recovery_engine
from app.agents.vision_agent import vision_agent
from app.agents.state_machine import WorkflowExecutionState, ClaimLifecycleState
from app.agents.contract import AgentContractOutput, AgentStatusEnum, RecommendedActionEnum


def test_confidence_recovery_request_evidence_and_reprocess():
    """
    Verify Section 13 Confidence-Aware Recovery:
    1. Low Vision confidence (0.39) triggers REQUEST_EVIDENCE and records recovery_history.
    2. Re-processing with new customer image recovers confidence (>= 0.90) and returns CONTINUE.
    """
    wf_state = WorkflowExecutionState(claim_id="CLM-2026-01775")
    ctx = {
        "accidentPhotos": [{"id": "IMG-01", "angle": "Rear View", "quality": "Insufficient", "visionConfidence": 39}],
        "incidentDescription": "Rear bumper scrape in dark basement.",
    }
    low_out = vision_agent.run("CLM-2026-01775", ctx)
    step1 = recovery_engine.handle_low_confidence_or_failure(low_out, wf_state, ctx, agent_instance=vision_agent)
    assert step1["recovery_action"] == "REQUEST_EVIDENCE"
    assert step1["target_state"] == ClaimLifecycleState.AWAITING_CUSTOMER
    assert len(wf_state.recovery_history) == 1

    # Step 2: Customer uploads new image -> Reprocess & Recover
    ctx_reupload = {**ctx, "clarified_photo_uploaded": True}
    step2 = recovery_engine.handle_low_confidence_or_failure(low_out, wf_state, ctx_reupload, agent_instance=vision_agent)
    assert step2["recovery_action"] == "CONTINUE"
    assert step2["final_output"].confidence >= 0.90
    assert wf_state.recovery_history[-1]["stage"] == "CONFIDENCE_RECOVERY_RETRY"


def test_alternative_processing_fallback_and_exhausted_escalation():
    """
    Verify:
    1. Primary agent failure invokes ALTERNATIVE_PROCESSING_FALLBACK and recovers.
    2. When max retries are exhausted and confidence remains low, engine routes to ESCALATE (HUMAN_REVIEW).
    """
    wf_state = WorkflowExecutionState(claim_id="CLM-FAIL-01")
    failed_contract = AgentContractOutput(
        claim_id="CLM-FAIL-01",
        agent="vision",
        status=AgentStatusEnum.FAILED,
        result={"error": "Primary detector timeout"},
        confidence=0.0,
        evidence=[],
        issues=["Primary detector timeout"],
        recommended_action=RecommendedActionEnum.ESCALATE,
    )
    fallback_res = recovery_engine.handle_low_confidence_or_failure(
        failed_contract,
        wf_state,
        {"allow_alternative_fallback": True},
        agent_instance=vision_agent,
    )
    assert fallback_res["recovery_action"] == "CONTINUE"
    assert wf_state.recovery_history[-1]["stage"] == "ALTERNATIVE_PROCESSING_FALLBACK"

    # Exhaust retries -> must escalate to HUMAN_REVIEW
    wf_exhausted = WorkflowExecutionState(claim_id="CLM-EXH-01", retry_counts={"vision": 2})
    low_contract = AgentContractOutput(
        claim_id="CLM-EXH-01",
        agent="vision",
        status=AgentStatusEnum.NEED_MORE_EVIDENCE,
        result={},
        confidence=0.41,
        evidence=[],
        issues=["Persistent glare"],
        recommended_action=RecommendedActionEnum.ESCALATE,
    )
    esc_res = recovery_engine.handle_low_confidence_or_failure(
        low_contract,
        wf_exhausted,
        {"clarified_photo_uploaded": True},
        agent_instance=vision_agent,
    )
    assert esc_res["recovery_action"] == "ESCALATE"
    assert esc_res["target_state"] == ClaimLifecycleState.HUMAN_REVIEW
