"""
Stage 13 Verification Tests (Section 16):
1. Verify Final Claim Assessment Report is strictly BLOCKED (HTTP 409) in non-terminal states
   (e.g., AWAITING_CUSTOMER on CLM-2026-01775, HUMAN_REVIEW on CLM-2026-01903).
2. Verify Final Claim Assessment Report is generated with all 9 mandatory sections in terminal states
   (APPROVED, REJECTED, HUMAN_REVIEW_COMPLETED, PAID).
"""

from fastapi.testclient import TestClient
from app.main import app


def test_final_report_blocked_in_non_terminal_states_and_generated_in_terminal_states():
    with TestClient(app) as client:
        login_resp = client.post(
            "/api/v1/auth/login",
            json={"email": "anand.officer@aiclaims.internal", "password": "password123"},
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Non-terminal claim CLM-2026-01775 (AWAITING_CUSTOMER) -> must return 409 Conflict
        blocked_resp = client.get("/api/v1/claims/CLM-2026-01775/report", headers=headers)
        assert blocked_resp.status_code == 409
        assert blocked_resp.json()["error_code"] == "NON_TERMINAL_STATE_REPORT_BLOCKED"

        # 2. Non-terminal claim CLM-2026-01903 (HUMAN_REVIEW) -> must return 409 Conflict
        blocked_hr = client.get("/api/v1/claims/CLM-2026-01903/report", headers=headers)
        assert blocked_hr.status_code == 409
        assert blocked_hr.json()["error_code"] == "NON_TERMINAL_STATE_REPORT_BLOCKED"

        # 3. Terminal claim CLM-2026-01842 (APPROVED) -> must return 200 with all 9 mandatory sections
        ok_resp = client.get("/api/v1/claims/CLM-2026-01842/report", headers=headers)
        assert ok_resp.status_code == 200
        report = ok_resp.json()
        assert report["claim_id"] == "CLM-2026-01842"
        assert report["terminal_state"] in ("APPROVED", "PAID")
        for sec_key in [
            "section_1_claim_summary",
            "section_2_submitted_evidence",
            "section_3_agent_by_agent_analysis",
            "section_4_confidence_and_recovery_history",
            "section_5_policy_coverage_analysis",
            "section_6_fraud_risk_analysis",
            "section_7_repair_cost_estimation",
            "section_8_final_decision_analysis",
            "section_9_complete_audit_timeline",
        ]:
            assert sec_key in report, f"Missing mandatory report section: {sec_key}"

        # 4. Adjudicate CLM-2026-01903 from HUMAN_REVIEW -> HUMAN_REVIEW_COMPLETED and verify report
        adj_resp = client.post(
            "/api/v1/claims/CLM-2026-01903/adjudicate",
            headers=headers,
            json={
                "decision": "HUMAN_REVIEW_COMPLETED",
                "notes": "SIU verified chassis oxidation as pre-existing; partial OEM payout approved.",
                "override_amount": 115000.0,
            },
        )
        assert adj_resp.status_code == 200
        assert adj_resp.json()["is_terminal"] is True
        assert adj_resp.json()["final_report_generated"] is True

        hr_report_resp = client.get("/api/v1/claims/CLM-2026-01903/report", headers=headers)
        assert hr_report_resp.status_code == 200
        hr_report = hr_report_resp.json()
        assert hr_report["terminal_state"] == "HUMAN_REVIEW_COMPLETED"
        assert (
            hr_report["section_8_final_decision_analysis"]["human_specialist_adjudication"]["override_amount_inr"]
            == 115000.0
        )
