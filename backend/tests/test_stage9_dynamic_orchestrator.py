from app.agents.orchestrator import DynamicClaimOrchestrator
from app.agents.state_machine import ClaimLifecycleState


def test_dynamic_orchestrator_prunes_expired_policy():
    """
    Verify Section 5 Dynamic Orchestration:
    When a claim has an Expired policy, the Orchestrator runs the Policy Agent,
    receives STOP, and immediately terminates as REJECTED without calling
    Document, Vision, Fraud, or Estimation agents (saving 4 unnecessary agent calls).
    """
    orch = DynamicClaimOrchestrator()
    expired_context = {
        "policyNumber": "POL-441820",
        "policyStatus": "Expired",
        "policyLimit": 350000.0,
        "claimedAmount": 28000.0,
        "accidentDate": "2026-09-10",
        "incidentDescription": "Rear bumper dent.",
    }
    wf_state = orch.run_dynamic_workflow("CLM-2026-01640", expired_context)
    assert wf_state.current_state == ClaimLifecycleState.REJECTED
    assert wf_state.is_terminated is True
    assert wf_state.completed_agents == ["policy"]
    assert "vision" not in wf_state.completed_agents
    assert "fraud" not in wf_state.completed_agents
    assert "estimation" not in wf_state.completed_agents


def test_dynamic_orchestrator_pauses_on_low_vision_confidence():
    """
    Verify Section 5 Dynamic Orchestration:
    When Vision Agent returns low confidence (0.39 < 0.75), the Orchestrator pauses
    at AWAITING_CUSTOMER before calling Fraud or Estimation agents, and resumes when
    a clarified photo is provided.
    """
    orch = DynamicClaimOrchestrator()
    uncertain_context = {
        "policyNumber": "POL-983742",
        "policyStatus": "Active",
        "policyLimit": 500000.0,
        "vehicleNumber": "TN 45 AB 1234",
        "claimedAmount": 32000.0,
        "accidentDate": "2026-09-11",
        "incidentDescription": "Rear bumper scrape in dim basement.",
        "documents": [
            {"name": "Policy.pdf", "type": "Policy", "status": "Verified", "ocrConfidence": 98, "extractedFields": {"Policy": "POL-983742"}}
        ],
        "accidentPhotos": [
            {"id": "IMG-01", "angle": "Rear View", "quality": "Insufficient", "visionConfidence": 39}
        ],
    }
    paused_state = orch.run_dynamic_workflow("CLM-2026-01775", uncertain_context)
    assert paused_state.current_state == ClaimLifecycleState.AWAITING_CUSTOMER
    assert "vision" in paused_state.completed_agents
    assert "fraud" not in paused_state.completed_agents
    assert "estimation" not in paused_state.completed_agents

    # Now provide clarified photo and resume orchestration
    resumed_context = {**uncertain_context, "clarified_photo_uploaded": True}
    resumed_state = orch.run_dynamic_workflow("CLM-2026-01775", resumed_context, wf_state=paused_state)
    assert "fraud" in resumed_state.completed_agents
    assert "estimation" in resumed_state.completed_agents
    assert len(resumed_state.recovery_history) == 1
