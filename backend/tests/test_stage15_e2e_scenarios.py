"""
Stage 15: End-to-End Multi-Agent Scenario Validation (Section 23 Stage 15).
Validates all 5 operational & research scenarios end-to-end:
- Scenario A: Normal Autonomous Claim Approval -> Settlement -> Final Report
- Scenario B: Low Vision Confidence -> AWAITING_CUSTOMER -> Clarified Photo Recovery -> Approval -> Final Report
- Scenario C: Forensic VIN / Fraud Anomaly -> HUMAN_REVIEW -> Human Adjudication -> Final Report
- Scenario D: Expired Policy Deterministic STOP -> Early Pipeline Pruning -> REJECTED
- Scenario E: Agent Runtime Failure -> Alternative Processing Fallback & Safe Escalation
"""

from fastapi.testclient import TestClient
from app.main import app
from app.agents.orchestrator import DynamicClaimOrchestrator
from app.agents.recovery_engine import recovery_engine
from app.agents.vision_agent import vision_agent
from app.agents.state_machine import ClaimLifecycleState, WorkflowExecutionState
from app.agents.contract import (
    AgentContractOutput,
    AgentStatusEnum,
    RecommendedActionEnum,
)


def test_scenario_a_normal_approval_and_settlement():
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"email": "anand.officer@aiclaims.internal", "password": "password123"},
        )
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Run full orchestrator on CLM-2026-01842
        run_res = client.post("/api/v1/orchestrator/CLM-2026-01842/run", headers=headers)
        assert run_res.status_code == 200
        data = run_res.json()
        assert data["status"] == "APPROVED"
        assert data["is_terminal"] is True
        assert data["final_report_generated"] is True

        # Settle claim to PAID and verify updated Final Report
        settle_res = client.post(
            "/api/v1/claims/CLM-2026-01842/settle",
            headers=headers,
            json={
                "payment_method": "NEFT / RTGS Instant Settlement",
                "utr_reference": "UTR202609260001",
            },
        )
        assert settle_res.status_code == 200
        assert settle_res.json()["status"] == "PAID"
        assert settle_res.json()["final_report"]["terminal_state"] == "PAID"


def test_scenario_b_low_vision_confidence_recovery_loop():
    orchestrator = DynamicClaimOrchestrator()
    blurry_ctx = {
        "policyNumber": "POL-983742",
        "policyStatus": "Active",
        "policyLimit": 500000.0,
        "vehicleNumber": "TN 45 AB 1234",
        "claimedAmount": 32000.0,
        "deductible": 5000.0,
        "accidentDate": "2026-09-11",
        "incidentDescription": "Rear bumper scrape in dim basement.",
        "documents": [
            {
                "name": "Policy.pdf",
                "type": "Policy",
                "status": "Verified",
                "ocrConfidence": 98,
                "extractedFields": {"Policy": "POL-983742"},
            }
        ],
        "accidentPhotos": [
            {
                "id": "IMG-01",
                "angle": "Rear View",
                "quality": "Insufficient",
                "visionConfidence": 39,
            }
        ],
    }

    # Step 1: Pauses at AWAITING_CUSTOMER when Vision Agent returns REQUEST_EVIDENCE
    wf_paused = orchestrator.run_dynamic_workflow("CLM-2026-01775", blurry_ctx)
    assert wf_paused.current_state == ClaimLifecycleState.AWAITING_CUSTOMER
    assert "fraud" not in wf_paused.completed_agents
    assert "estimation" not in wf_paused.completed_agents

    # Step 2: Customer uploads clarified daylight photo -> resumes from Vision Agent -> APPROVED
    clarified_ctx = {
        **blurry_ctx,
        "clarified_photo_uploaded": True,
        "accidentPhotos": [
            {
                "id": "IMG-CLEAR-02",
                "angle": "Rear View Daylight",
                "quality": "Good",
                "visionConfidence": 94,
            }
        ],
    }
    wf_resumed = orchestrator.run_dynamic_workflow(
        "CLM-2026-01775", clarified_ctx, wf_state=wf_paused
    )
    assert wf_resumed.current_state == ClaimLifecycleState.APPROVED
    assert wf_resumed.retry_counts.get("vision", 0) == 1
    assert len(wf_resumed.recovery_history) == 1


def test_scenario_c_suspicious_fraud_escalation_and_human_adjudication():
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"email": "anand.officer@aiclaims.internal", "password": "password123"},
        )
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Adjudicate escalated high-risk claim CLM-2026-01903
        adj = client.post(
            "/api/v1/claims/CLM-2026-01903/adjudicate",
            headers=headers,
            json={
                "decision": "HUMAN_REVIEW_COMPLETED",
                "notes": "Confirmed VIN transposition was clerical; excluded pre-existing rust panel.",
                "override_amount": 118000.0,
            },
        )
        assert adj.status_code == 200
        assert adj.json()["status"] == "HUMAN_REVIEW_COMPLETED"
        assert adj.json()["final_report_generated"] is True


def test_scenario_d_expired_policy_deterministic_pruning():
    orchestrator = DynamicClaimOrchestrator()
    expired_ctx = {
        "policyNumber": "POL-441820",
        "policyStatus": "Expired",
        "policyLimit": 350000.0,
        "validFrom": "2023-01-01",
        "validUntil": "2025-12-31",
        "accidentDate": "2026-09-10",
        "claimedAmount": 42000.0,
        "deductible": 3000.0,
    }
    wf_pruned = orchestrator.run_dynamic_workflow("CLM-2026-01999", expired_ctx)
    assert wf_pruned.current_state == ClaimLifecycleState.REJECTED
    assert wf_pruned.is_terminated is True
    assert wf_pruned.completed_agents == ["policy"]


def test_scenario_e_agent_runtime_failure_fallback_recovery():
    wf_state = WorkflowExecutionState(claim_id="CLM-FAIL-E2E")
    failed_contract = AgentContractOutput(
        claim_id="CLM-FAIL-E2E",
        agent="vision",
        status=AgentStatusEnum.FAILED,
        result={"error": "Primary detector CUDA timeout"},
        confidence=0.0,
        evidence=[],
        issues=["Primary detector CUDA timeout"],
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

    wf_exhausted = WorkflowExecutionState(claim_id="CLM-EXH-E2E", retry_counts={"vision": 2})
    low_contract = AgentContractOutput(
        claim_id="CLM-EXH-E2E",
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
