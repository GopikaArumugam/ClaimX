from typing import Dict, Any, List
import numpy as np
from app.core.config import settings
from app.agents.base_agent import BaseClaimAgent
from app.agents.contract import (
    AgentContractOutput,
    AgentStatusEnum,
    RecommendedActionEnum,
)


class DecisionAgent(BaseClaimAgent):
    """
    Section 11 & 30 (Stage 11): Explainable Decision & Safety Guardrail Agent
    Combines outputs from Document, Vision, Policy, Fraud, and Estimation agents.
    Applies deterministic business/policy guardrails and produces traceable explanations.
    Possible recommendations: APPROVE, HUMAN_REVIEW, MORE_EVIDENCE.
    """

    agent_name = "decision"
    display_name = "Decision Agent"
    model_version = "deterministic-guardrail-synthesis-v1.0"

    def _process(self, claim_id: str, context: Dict[str, Any]) -> AgentContractOutput:
        agent_outputs: Dict[str, Dict[str, Any]] = context.get("agent_outputs") or {}

        doc_out = agent_outputs.get("document", {})
        vis_out = agent_outputs.get("vision", {})
        pol_out = agent_outputs.get("policy", {})
        frd_out = agent_outputs.get("fraud", {})
        est_out = agent_outputs.get("estimation", {})

        satisfied: List[str] = []
        unsatisfied: List[str] = []
        unresolved_issues: List[str] = []
        evidence_considered: List[str] = []

        for name, out in agent_outputs.items():
            evidence_considered.extend(out.get("evidence", []))
            unresolved_issues.extend(out.get("issues", []))

        # 1. Policy Guardrail
        pol_conf = float(pol_out.get("confidence", 0.95))
        pol_verdict = (pol_out.get("result") or {}).get("coverage_assessment", "COVERED_ELIGIBLE")
        if pol_verdict == "COVERED_ELIGIBLE" and pol_conf >= settings.POLICY_CONFIDENCE_THRESHOLD:
            satisfied.append(f"Policy Coverage Active & Eligible (conf={pol_conf:.2f} >= {settings.POLICY_CONFIDENCE_THRESHOLD:.2f})")
        else:
            unsatisfied.append(f"Policy Coverage Ambiguous or Excluded ({pol_verdict}, conf={pol_conf:.2f})")

        # 2. Document Guardrail
        doc_conf = float(doc_out.get("confidence", 0.95))
        vin_ok = (doc_out.get("result") or {}).get("vin_consistent", True)
        if doc_conf >= settings.DOCUMENT_CONFIDENCE_THRESHOLD and vin_ok:
            satisfied.append(f"Document OCR & VIN Consistency Verified (conf={doc_conf:.2f} >= {settings.DOCUMENT_CONFIDENCE_THRESHOLD:.2f})")
        else:
            unsatisfied.append(f"Document Verification Insufficient or VIN Mismatch (conf={doc_conf:.2f}, vin_consistent={vin_ok})")

        # 3. Vision Guardrail
        vis_conf = float(vis_out.get("confidence", 0.94))
        if vis_conf >= settings.VISION_CONFIDENCE_THRESHOLD:
            satisfied.append(f"Visual Damage Assessment Verified (conf={vis_conf:.2f} >= {settings.VISION_CONFIDENCE_THRESHOLD:.2f})")
        else:
            unsatisfied.append(f"Visual Damage Confidence Insufficient (conf={vis_conf:.2f} < {settings.VISION_CONFIDENCE_THRESHOLD:.2f})")

        # 4. Fraud Guardrail
        fraud_score = float((frd_out.get("result") or {}).get("fraud_risk_score", context.get("fraudRisk", 0.12)))
        if fraud_score > 1.0:
            fraud_score = fraud_score / 100.0
        if fraud_score < settings.FRAUD_REVIEW_THRESHOLD:
            satisfied.append(f"Fraud Risk Below Escalation Threshold ({fraud_score:.2f} < {settings.FRAUD_REVIEW_THRESHOLD:.2f})")
        else:
            unsatisfied.append(f"Fraud Risk Exceeded Escalation Threshold ({fraud_score:.2f} >= {settings.FRAUD_REVIEW_THRESHOLD:.2f})")

        # 5. Cost Estimation & Auto-Approval Ceiling Guardrail (Section 11)
        est_res = est_out.get("result") or {}
        net_payable = float(est_res.get("net_payable_amount_inr", context.get("approvedAmount") or 43000.0))
        variance_pct = float(est_res.get("invoice_variance_pct", 2.0))
        max_ceiling = settings.MAX_AUTO_APPROVAL_AMOUNT_INR

        if net_payable <= max_ceiling and variance_pct <= 25.0:
            satisfied.append(
                f"Net Settlement Within Auto-Approval Safety Ceiling (INR {net_payable:,.0f} <= INR {max_ceiling:,.0f}, variance={variance_pct:.1f}%)"
            )
        else:
            unsatisfied.append(
                f"Net Settlement Exceeds Auto-Approval Safety Ceiling or Variance Limit (INR {net_payable:,.0f} vs ceiling INR {max_ceiling:,.0f}, variance={variance_pct:.1f}%)"
            )

        # Aggregate confidence
        conf_values = [
            float(out.get("confidence", 0.90))
            for out in [doc_out, vis_out, pol_out, frd_out, est_out]
            if out
        ] or [0.92]
        aggregate_confidence = round(float(np.mean(conf_values)), 4)

        if aggregate_confidence >= settings.DECISION_CONFIDENCE_THRESHOLD:
            satisfied.append(f"Aggregate Multi-Agent Confidence Satisfied ({aggregate_confidence:.2f} >= {settings.DECISION_CONFIDENCE_THRESHOLD:.2f})")
        else:
            unsatisfied.append(f"Aggregate Multi-Agent Confidence Below Threshold ({aggregate_confidence:.2f} < {settings.DECISION_CONFIDENCE_THRESHOLD:.2f})")

        # Determine final recommendation: APPROVE, MORE_EVIDENCE, or HUMAN_REVIEW
        needs_evidence = any(
            out.get("recommended_action") == RecommendedActionEnum.REQUEST_EVIDENCE.value
            for out in [doc_out, vis_out]
            if out
        )

        if len(unsatisfied) == 0:
            final_recommendation = "APPROVE"
            recommended_action = RecommendedActionEnum.CONTINUE
            status = AgentStatusEnum.SUCCESS
            why_recommended = (
                f"All {len(satisfied)} deterministic eligibility, fraud, confidence, and financial ceiling guardrails were satisfied. "
                f"Net payout of INR {net_payable:,.0f} approved for Straight-Through Processing."
            )
        elif needs_evidence and fraud_score < settings.FRAUD_REVIEW_THRESHOLD:
            final_recommendation = "MORE_EVIDENCE"
            recommended_action = RecommendedActionEnum.REQUEST_EVIDENCE
            status = AgentStatusEnum.NEED_MORE_EVIDENCE
            why_recommended = (
                f"Additional customer evidence required due to low perception confidence ({'; '.join(unsatisfied)})."
            )
        else:
            final_recommendation = "HUMAN_REVIEW"
            recommended_action = RecommendedActionEnum.ESCALATE
            status = AgentStatusEnum.SUCCESS
            why_recommended = (
                f"Escalated to Human-in-the-Loop Review because {len(unsatisfied)} guardrail condition(s) were not satisfied: "
                f"{'; '.join(unsatisfied)}."
            )

        return AgentContractOutput(
            claim_id=claim_id,
            agent=self.agent_name,
            status=status,
            result={
                "final_recommendation": final_recommendation,
                "approved_amount_inr": net_payable if final_recommendation == "APPROVE" else 0.0,
                "satisfied_conditions": satisfied,
                "unsatisfied_conditions": unsatisfied,
                "unresolved_issues": unresolved_issues,
                "why_recommended": why_recommended,
            },
            confidence=aggregate_confidence,
            evidence=evidence_considered[:10],
            issues=unresolved_issues,
            recommended_action=recommended_action,
        )


decision_agent = DecisionAgent()
