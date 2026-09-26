"""
Stage 16 Verification Tests:
Executes the reproducible 6-experiment research benchmark suite and verifies
both JSON and Markdown publication artifacts are generated with valid empirical metrics.
"""

from experiments.run_research_experiments import (
    run_all_research_experiments,
    RESULTS_DIR,
)


def test_reproducible_research_experiments_execution_and_artifacts():
    res = run_all_research_experiments()
    assert res["random_seed"] == 42

    exp1 = res["experiment_1_static_vs_dynamic_orchestration"]
    assert exp1["cohort_size"] == 100
    assert exp1["static_pipeline_agent_invocations"] == 600
    assert exp1["dynamic_orchestrator_initial_invocations"] < 600
    assert exp1["agent_invocation_savings_percent"] > 15.0
    assert exp1["expired_policy_claims_pruned_early"] == 15
    assert exp1["low_quality_claims_paused_before_downstream"] == 15

    exp2 = res["experiment_2_confidence_recovery_ablation"]
    assert exp2["with_recovery_autonomous_resolution_rate_pct"] == 100.0
    assert exp2["mean_confidence_gain_delta"] > 0.45

    exp3 = res["experiment_3_agent_model_comparisons"]
    assert "document_classification_models" in exp3
    assert "vision_damage_severity_models" in exp3
    assert "policy_rag_retrieval_models" in exp3
    assert "fraud_imbalanced_classification_models" in exp3
    assert "repair_cost_regression_models" in exp3

    exp4 = res["experiment_4_threshold_sensitivity_analysis"]
    assert len(exp4) == 6

    assert (RESULTS_DIR / "experimental_results.json").exists()
    assert (RESULTS_DIR / "RESEARCH_EVALUATION_REPORT.md").exists()
