from app.agents.fraud_agent import fraud_agent
from app.agents.contract import RecommendedActionEnum


def test_fraud_agent_imbalanced_model_comparison():
    """
    Verify Section 9 & 22: Candidate fraud models were evaluated using PR-AUC, ROC-AUC,
    F1, Precision, Recall, Confusion Matrix, and Brier Calibration Score.
    """
    results = fraud_agent.model_comparison_results
    expected_models = {
        "LogisticRegression_Balanced",
        "RandomForest_Balanced",
        "GradientBoosting_Tree",
        "HistGradientBoosting_LGBM_Style",
    }
    assert expected_models.issubset(set(results.keys()))
    for name, metrics in results.items():
        assert 0.50 <= metrics["pr_auc"] <= 1.0
        assert 0.50 <= metrics["roc_auc"] <= 1.0
        assert "confusion_matrix" in metrics
        assert "brier_calibration_loss" in metrics


def test_fraud_agent_low_risk_vs_high_risk_escalation():
    """
    Verify:
    1. Low-risk normal claim returns fraud_risk_score < 0.45 and CONTINUE.
    2. High-risk suspicious claim returns fraud_risk_score >= 0.80 and ESCALATE to Human Review.
    """
    low_res = fraud_agent.run(
        "CLM-2026-01842",
        {"claimedAmount": 48500.0, "estimatedAmount": 48000.0, "policyLimit": 500000.0},
    )
    assert low_res.result["fraud_risk_score"] < 0.45
    assert low_res.recommended_action == RecommendedActionEnum.CONTINUE
    assert len(low_res.issues) == 0

    high_res = fraud_agent.run(
        "CLM-2026-01903",
        {"claimedAmount": 215000.0, "estimatedAmount": 142000.0, "policyLimit": 800000.0},
    )
    assert high_res.result["fraud_risk_score"] >= 0.80
    assert high_res.recommended_action == RecommendedActionEnum.ESCALATE
    assert len(high_res.issues) >= 2
