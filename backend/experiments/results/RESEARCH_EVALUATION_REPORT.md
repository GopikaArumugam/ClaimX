# ClaimX Empirical Evaluation Report (Reproducible Benchmark Suite)

- **Suite Version**: `ClaimX-Research-v1.0`
- **Fixed Random Seed**: `42`

## Experiment 1: Static Pipeline vs. Dynamic Confidence-Aware Orchestration ($N=100$)

| Metric | Static Sequential Pipeline | Dynamic Confidence-Aware Orchestrator | Improvement |
| :--- | :---: | :---: | :---: |
| Total Agent Invocations | 600 | 480 | **-20.0% Calls Saved** |
| Expired Policy Claims Early Pruned | 0 | 15 | **100% Downstream Pruned** |
| Low-Quality Evidence Paused Before Fraud/Est | 0 | 15 | **100% Premature Compute Avoided** |

## Experiment 2: Confidence-Aware Recovery Ablation Study ($N=15$ Low-Quality Claims)

| Configuration | Autonomous Resolution Rate (%) | Mean Pre-Recovery Confidence | Mean Post-Recovery Confidence | Confidence Gain ($\Delta C$) |
| :--- | :---: | :---: | :---: | :---: |
| Without Confidence Recovery | 0.0% | 0.29 | 0.29 | +0.0000 |
| **With Confidence-Aware Recovery** | **100.0%** | 0.29 | **0.94** | **+0.65** |

## Experiment 4: Confidence Threshold ($\tau$) Sensitivity Analysis

| Threshold ($\tau$) | Autonomous Approval (%) | Recovery Trigger (%) | Human Escalation (%) | Early Rejection (%) | False Approval (%) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 0.50 | 55.0% | 15.0% | 15.0% | 15.0% | 0.0% |
| 0.60 | 55.0% | 15.0% | 15.0% | 15.0% | 0.0% |
| 0.70 | 55.0% | 15.0% | 15.0% | 15.0% | 0.0% |
| 0.75 | 0.0% | 70.0% | 15.0% | 15.0% | 0.0% |
| 0.80 | 0.0% | 70.0% | 15.0% | 15.0% | 0.0% |
| 0.90 | 0.0% | 70.0% | 15.0% | 15.0% | 0.0% |

## Experiment 6: Agent Execution Latency Profile

| Specialized Agent | Invocations | Mean Latency (ms) | Median Latency (ms) | P95 Latency (ms) |
| :--- | :---: | :---: | :---: | :---: |
| `policy` | 100 | 1.513 | 1.365 | 2.911 |
| `document` | 85 | 1.323 | 1.13 | 2.91 |
| `vision` | 85 | 1.256 | 1.02 | 2.51 |
| `fraud` | 70 | 4.708 | 4.095 | 8.75 |
| `estimation` | 70 | 0.237 | 0.18 | 0.392 |
| `decision` | 70 | 0.076 | 0.06 | 0.162 |
