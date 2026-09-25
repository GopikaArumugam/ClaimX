"""
Stage 12 Verification Tests:
- Structured Section 17 Audit Trail recording during Dynamic Claim Orchestration
- GET /api/v1/claims/{claim_id}/audit-trail endpoint verification
"""

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.agents.orchestrator import DynamicClaimOrchestrator
from app.services.audit_service import AuditService

client = TestClient(app)


def test_audit_trail_recorded_during_orchestration_and_queried_via_api():
    # Authenticate first so lifespan seeds default claims including CLM-2026-01842
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "anand.officer@aiclaims.internal", "password": "password123"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    with SessionLocal() as db:
        orchestrator = DynamicClaimOrchestrator()
        claim_ctx = {
            "policyNumber": "POL-983742",
            "policyStatus": "Active",
            "policyLimit": 500000.0,
            "vehicleNumber": "TN 45 AB 1234",
            "claimedAmount": 48500.0,
            "deductible": 5000.0,
            "accidentDate": "2026-09-10",
            "incidentDescription": "Frontal collision cracked front bumper.",
            "documents": [
                {
                    "name": "Policy.pdf",
                    "type": "Policy",
                    "status": "Verified",
                    "ocrConfidence": 98,
                    "extractedFields": {"Policy Number": "POL-983742"},
                }
            ],
            "accidentPhotos": [
                {
                    "id": "IMG-01",
                    "angle": "Front View",
                    "quality": "Good",
                    "visionConfidence": 95,
                }
            ],
        }
        wf_state = orchestrator.run_dynamic_workflow("CLM-2026-01842", claim_ctx, db=db)
        assert wf_state.current_state.value == "APPROVED"

        events = AuditService.get_claim_audit_trail(db, "CLM-2026-01842")
        assert len(events) >= 7
        first_event = events[0]
        assert "timestamp" in first_event
        assert first_event["claim_id"] == "CLM-2026-01842"
        assert "agent" in first_event
        assert "action" in first_event
        assert "evidence_refs" in first_event
        assert "result_summary" in first_event
        assert "confidence" in first_event
        assert "reason" in first_event
        assert "next_action" in first_event

    audit_resp = client.get(
        "/api/v1/claims/CLM-2026-01842/audit-trail",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert audit_resp.status_code == 200
    payload = audit_resp.json()
    assert payload["claim_id"] == "CLM-2026-01842"
    assert payload["event_count"] >= 7
    agents_logged = [e["agent"] for e in payload["audit_events"]]
    assert "Orchestrator" in agents_logged
    assert "Policy Agent" in agents_logged
    assert "Document Agent" in agents_logged
    assert "Vision Agent" in agents_logged
    assert "Decision Agent" in agents_logged
