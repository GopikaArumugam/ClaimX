from app.agents.estimation_agent import estimation_agent
from app.agents.contract import RecommendedActionEnum


def test_estimation_agent_regression_benchmarks():
    """Verify candidate regression models were evaluated using MAE, RMSE, R², and MAPE."""
    benchmarks = estimation_agent.regression_benchmarks
    expected = {
        "Linear_Ridge_Regression",
        "RandomForest_Regressor",
        "GradientBoosting_Regressor",
        "HistGradientBoosting_Regressor",
    }
    assert expected.issubset(set(benchmarks.keys()))
    for name, m in benchmarks.items():
        assert m["mae_inr"] > 0.0
        assert m["rmse_inr"] >= m["mae_inr"]
        assert 0.50 <= m["r2_score"] <= 1.0
        assert m["mape_pct"] > 0.0


def test_estimation_agent_normal_vs_inflated_invoice():
    """
    Verify:
    1. Normal claim (CLM-2026-01842) calculates INR 48,000 baseline, INR 5,000 deductible, INR 43,000 net payout, and CONTINUE.
    2. Inflated invoice (CLM-2026-01903: INR 215,000 vs INR 142,000 baseline) flags >50% variance and recommends ESCALATE.
    """
    res_norm = estimation_agent.run(
        "CLM-2026-01842",
        {"claimedAmount": 48500.0, "deductible": 5000.0, "policyLimit": 500000.0},
    )
    assert res_norm.result["estimated_amount_inr"] == 48000.0
    assert res_norm.result["net_payable_amount_inr"] == 43000.0
    assert res_norm.recommended_action == RecommendedActionEnum.CONTINUE

    res_inflated = estimation_agent.run(
        "CLM-2026-01903",
        {"claimedAmount": 215000.0, "deductible": 10000.0, "policyLimit": 800000.0},
    )
    assert res_inflated.result["invoice_variance_pct"] > 50.0
    assert res_inflated.recommended_action == RecommendedActionEnum.ESCALATE
    assert len(res_inflated.issues) >= 1
