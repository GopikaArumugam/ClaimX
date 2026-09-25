from app.agents.decision_agent import decision_agent
from app.agents.orchestrator import dynamic_orchestrator
from app.agents.state_machine import ClaimLifecycleState


def test_decision_agent_approve_vs_human_review_guardrails():
    """
    Verify Section 11 & 30:
    1. All 6 deterministic guardrails satisfied -> APPROVE with traceable satisfied_conditions.
    2. High fraud risk + payout > INR 50,000 ceiling -> HUMAN_REVIEW with traceable unsatisfied_conditions.
    """
    clean_ctx = {
        "policyNumber": "POL-983742",
        "policyStatus": "Active",
        "policyLimit": 500000.0,
        "vehicleNumber": "TN 45 AB 1234",
        "claimedAmount": 48500.0,
        "deductible": 5000.0,
        "accidentDate": "2026-09-10",
        "incidentDescription": "Frontal collision cracked front bumper.",
        "documents": [
            {"name": "Policy.pdf", "type": "Policy", "status": "Verified", "ocrConfidence": 98, "extractedFields": {"Policy Number": "POL-983742"}}
        ],
        "accidentPhotos": [
            {"id": "IMG-01", "angle": "Front View", "quality": "Good", "visionConfidence": 95}
        ],
    }
    wf_approved = dynamic_orchestrator.run_dynamic_workflow("CLM-2026-01842", clean_ctx)
    assert wf_approved.current_state == ClaimLifecycleState.APPROVED
    assert wf_approved.is_terminated is True
    dec_out = wf_approved.agent_outputs["decision"]
    assert dec_out["result"]["final_recommendation"] == "APPROVE"
    assert len(dec_out["result"]["satisfied_conditions"]) == 6
    assert len(dec_out["result"]["unsatisfied_conditions"]) == 0

    # High-risk / high-payout BMW claim -> must escalate to HUMAN_REVIEW
    risky_ctx = {
        "policyNumber": "POL-610294",
        "policyStatus": "Active",
        "policyLimit": 800000.0,
        "vehicleNumber": "KA 03 MM 9941",
        "claimedAmount": 215000.0,
        "deductible": 10000.0,
        "accidentDate": "2026-09-08",
        "incidentDescription": "High-speed undercarriage and front suspension impact.",
        "documents": [
            {"name": "RC.pdf", "type": "Registration", "status": "Low Quality", "ocrConfidence": 74, "extractedFields": {"Chassis": "WBA5R1C55PFP12948"}},
            {"name": "Invoice.pdf", "type": "Repair Invoice", "status": "Low Quality", "ocrConfidence": 72, "extractedFields": {"Chassis": "WBA5R1C55PFP12984"}},
        ],
        "accidentPhotos": [
            {"id": "IMG-02", "angle": "Close-up", "quality": "Good", "visionConfidence": 82}
        ],
    }
    wf_review = dynamic_orchestrator.run_dynamic_workflow("CLM-2026-01903", risky_ctx)
    assert wf_review.current_state == ClaimLifecycleState.HUMAN_REVIEW
    dec_risk = wf_review.agent_outputs["decision"]
    assert dec_risk["result"]["final_recommendation"] == "HUMAN_REVIEW"
    assert len(dec_risk["result"]["unsatisfied_conditions"]) >= 2
