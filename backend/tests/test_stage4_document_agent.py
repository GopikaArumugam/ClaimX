from app.agents.document_agent import document_agent
from app.agents.contract import AgentStatusEnum, RecommendedActionEnum


def test_document_agent_classifier_benchmark():
    """Verify candidate classifiers (MultinomialNB, LogisticRegression, LinearSVC) were evaluated."""
    metrics = document_agent.benchmark_metrics
    assert "MultinomialNB" in metrics
    assert "LogisticRegression" in metrics
    assert "LinearSVC" in metrics
    for model_name, m in metrics.items():
        assert 0.0 <= m["f1_macro"] <= 1.0
        assert m["latency_ms"] >= 0.0


def test_document_agent_valid_documents():
    """Verify high confidence and CONTINUE action on clean, consistent documents."""
    context = {
        "policyNumber": "POL-983742",
        "vehicleNumber": "TN 45 AB 1234",
        "documents": [
            {
                "name": "Policy_POL983742.pdf",
                "type": "Policy",
                "status": "Verified",
                "ocrConfidence": 98,
                "extractedFields": {"Policy Number": "POL-983742", "Insured": "Arun Kumar"},
            },
            {
                "name": "RC_Card_TN45.pdf",
                "type": "Registration",
                "status": "Verified",
                "ocrConfidence": 96,
                "extractedFields": {"Reg No": "TN 45 AB 1234", "Chassis": "MALC381CLPM19842"},
            },
        ],
    }
    res = document_agent.run("CLM-2026-01842", context)
    assert res.status == AgentStatusEnum.SUCCESS
    assert res.confidence >= 0.90
    assert res.recommended_action == RecommendedActionEnum.CONTINUE
    assert res.result["vin_consistent"] is True


def test_document_agent_missing_or_inconsistent_documents():
    """Verify missing documents trigger REQUEST_EVIDENCE and VIN mismatch is flagged."""
    # 1. Missing documents -> REQUEST_EVIDENCE
    empty_res = document_agent.run("CLM-EMPTY", {"documents": []})
    assert empty_res.status == AgentStatusEnum.NEED_MORE_EVIDENCE
    assert empty_res.recommended_action == RecommendedActionEnum.REQUEST_EVIDENCE

    # 2. VIN transposition mismatch + low quality scan -> issues flagged and confidence penalized
    inconsistent_context = {
        "policyNumber": "POL-610294",
        "vehicleNumber": "KA 03 MM 9941",
        "documents": [
            {
                "name": "RC_Card.pdf",
                "type": "Registration",
                "status": "Low Quality",
                "ocrConfidence": 70,
                "extractedFields": {"Chassis": "WBA5R1C55PFP12948"},
            },
            {
                "name": "Repair_Invoice.pdf",
                "type": "Repair Invoice",
                "status": "Low Quality",
                "ocrConfidence": 68,
                "extractedFields": {"Chassis": "WBA5R1C55PFP12984"},
            },
        ],
    }
    inc_res = document_agent.run("CLM-2026-01903", inconsistent_context)
    assert inc_res.result["vin_consistent"] is False
    assert any("Chassis/VIN mismatch" in issue for issue in inc_res.issues)
    assert inc_res.confidence < 0.80
