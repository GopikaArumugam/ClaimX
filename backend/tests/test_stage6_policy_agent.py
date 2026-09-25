from app.agents.policy_agent import policy_agent
from app.agents.contract import AgentStatusEnum, RecommendedActionEnum


def test_policy_agent_retrieval_benchmarks():
    """Verify RAG retrieval methods (Lexical, Dense SVD, Hybrid) were experimentally evaluated."""
    benchmarks = policy_agent.retrieval_benchmarks
    assert "Lexical_TFIDF" in benchmarks
    assert "Dense_Semantic_SVD" in benchmarks
    assert "Hybrid_Dense_Lexical" in benchmarks
    assert benchmarks["Hybrid_Dense_Lexical"]["recall_at_1"] >= 0.80


def test_policy_agent_active_covered_claim():
    """Verify active comprehensive policy with standard collision returns SUCCESS and CONTINUE."""
    context = {
        "policyNumber": "POL-983742",
        "policyStatus": "Active",
        "policyCoverage": "Comprehensive Private Car Gold Zero Depreciation",
        "policyLimit": 500000.0,
        "claimedAmount": 48500.0,
        "deductible": 5000.0,
        "accidentDate": "2026-09-10",
        "claimType": "Vehicle Collision",
        "incidentDescription": "Frontal collision cracked front bumper and shattered LED headlamp.",
    }
    res = policy_agent.run("CLM-2026-01842", context)
    assert res.status == AgentStatusEnum.SUCCESS
    assert res.recommended_action == RecommendedActionEnum.CONTINUE
    assert res.confidence >= 0.95
    assert res.result["coverage_assessment"] == "COVERED_ELIGIBLE"


def test_policy_agent_expired_policy_pruning_and_ambiguous_clause():
    """
    Verify:
    1. Expired policy triggers deterministic STOP action (Dynamic Orchestrator pruning).
    2. Ambiguous undercarriage clause triggers ESCALATE to Human Review.
    """
    # 1. Expired policy -> STOP
    expired_ctx = {
        "policyNumber": "POL-441820",
        "policyStatus": "Expired",
        "policyLimit": 350000.0,
        "claimedAmount": 28000.0,
        "accidentDate": "2026-09-10",
        "incidentDescription": "Rear bumper dent.",
    }
    exp_res = policy_agent.run("CLM-2026-01640", expired_ctx)
    assert exp_res.status == AgentStatusEnum.FAILED
    assert exp_res.recommended_action == RecommendedActionEnum.STOP
    assert exp_res.result["coverage_assessment"] == "EXCLUDED_EXPIRED_POLICY"

    # 2. Ambiguous undercarriage/suspension clause -> ESCALATE
    ambig_ctx = {
        "policyNumber": "POL-610294",
        "policyStatus": "Active",
        "policyLimit": 800000.0,
        "claimedAmount": 215000.0,
        "accidentDate": "2026-09-08",
        "incidentDescription": "High-speed undercarriage and front suspension lower control arm impact.",
    }
    amb_res = policy_agent.run("CLM-2026-01903", ambig_ctx)
    assert amb_res.recommended_action == RecommendedActionEnum.ESCALATE
    assert amb_res.result["coverage_assessment"] == "AMBIGUOUS_ESCALATE_TO_HUMAN"
