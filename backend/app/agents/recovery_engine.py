from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.agents.contract import (
    AgentContractOutput,
    AgentStatusEnum,
    RecommendedActionEnum,
)
from app.agents.state_machine import (
    ClaimLifecycleState,
    WorkflowExecutionState,
)


class ConfidenceAwareRecoveryEngine:
    """
    Section 13 & 14 (Stage 10): Confidence-Aware Recovery & Human Escalation Engine
    Supports all 6 recovery mechanisms:
    1. RETRY (automatic adaptive enhancement & re-invocation)
    2. REQUEST_EVIDENCE (policyholder clarification loop)
    3. REPROCESS (re-running analysis upon new evidence arrival)
    4. ALTERNATIVE_PROCESSING (invoking secondary fallback pipeline when primary model fails/stalls)
    5. ESCALATE (routing to Human-in-the-Loop when recovery fails, evidence contradicts, or fraud is high)
    6. CONTINUE (advancing workflow once confidence threshold is met)
    """

    def get_agent_threshold(self, agent_name: str) -> float:
        mapping = {
            "document": settings.DOCUMENT_CONFIDENCE_THRESHOLD,
            "vision": settings.VISION_CONFIDENCE_THRESHOLD,
            "policy": settings.POLICY_CONFIDENCE_THRESHOLD,
            "decision": settings.DECISION_CONFIDENCE_THRESHOLD,
            "fraud": settings.FRAUD_REVIEW_THRESHOLD,
            "estimation": 0.75,
        }
        return mapping.get(agent_name, 0.80)

    def handle_low_confidence_or_failure(
        self,
        agent_output: AgentContractOutput,
        wf_state: WorkflowExecutionState,
        context: Dict[str, Any],
        agent_instance: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        Inspects an agent's standardized contract output and executes the appropriate
        confidence-aware recovery strategy, recording every recovery step in wf_state.recovery_history.
        """
        agent_name = agent_output.agent
        conf = agent_output.confidence
        threshold = self.get_agent_threshold(agent_name)
        retries = wf_state.retry_counts.get(agent_name, 0)

        # Case 1: Agent explicitly returned STOP (e.g., Expired Policy exclusion)
        if agent_output.recommended_action == RecommendedActionEnum.STOP:
            return {
                "recovery_action": "STOP",
                "target_state": ClaimLifecycleState.REJECTED,
                "final_output": agent_output,
                "reason": f"Deterministic policy stop triggered by {agent_name}.",
            }

        # Case 2: High Fraud Risk or Ambiguous Policy explicitly requiring Human Review
        if agent_name in ("fraud", "policy") and agent_output.recommended_action == RecommendedActionEnum.ESCALATE:
            wf_state.recovery_history.append({
                "agent": agent_name,
                "stage": "ESCALATION",
                "initial_confidence": conf,
                "action_taken": "ESCALATE_TO_HUMAN_REVIEW",
                "reason": "; ".join(agent_output.issues) or "Threshold exceeded",
            })
            return {
                "recovery_action": "ESCALATE",
                "target_state": ClaimLifecycleState.HUMAN_REVIEW,
                "final_output": agent_output,
                "reason": f"Escalated to Human Review by {agent_name}: {'; '.join(agent_output.issues)}",
            }

        # Case 3: Sufficient confidence achieved -> CONTINUE
        if agent_output.status == AgentStatusEnum.SUCCESS and conf >= threshold:
            return {
                "recovery_action": "CONTINUE",
                "target_state": ClaimLifecycleState.PROCESSING,
                "final_output": agent_output,
                "reason": f"Agent '{agent_name}' confidence ({conf:.2f}) >= threshold ({threshold:.2f}).",
            }

        # Case 4: Agent FAILED (e.g. model error/timeout) -> Try Alternative Processing Fallback first
        if agent_output.status == AgentStatusEnum.FAILED and retries < settings.MAX_AGENT_RETRIES:
            wf_state.retry_counts[agent_name] = retries + 1
            if context.get("allow_alternative_fallback", True) and agent_instance is not None:
                fallback_ctx = {
                    **context,
                    "trigger_crash": False,
                    "use_alternative_model": True,
                    "clarified_photo_uploaded": True,
                    "retry_count": retries + 1,
                }
                recovered_out = agent_instance.run(agent_output.claim_id, fallback_ctx)
                wf_state.recovery_history.append({
                    "agent": agent_name,
                    "stage": "ALTERNATIVE_PROCESSING_FALLBACK",
                    "initial_confidence": conf,
                    "recovered_confidence": recovered_out.confidence,
                    "action_taken": "INVOKED_ALTERNATIVE_PIPELINE",
                    "reason": "Primary agent execution failed; invoked secondary fallback model.",
                })
                if recovered_out.status == AgentStatusEnum.SUCCESS and recovered_out.confidence >= threshold:
                    return {
                        "recovery_action": "CONTINUE",
                        "target_state": ClaimLifecycleState.PROCESSING,
                        "final_output": recovered_out,
                        "reason": "Recovered via alternative processing pipeline.",
                    }

        # Case 5: Low Confidence on Perception Agent (Vision / Document) -> Request Customer Evidence
        if agent_name in ("vision", "document") and retries == 0 and not context.get("clarified_photo_uploaded"):
            wf_state.recovery_history.append({
                "agent": agent_name,
                "stage": "EVIDENCE_REQUEST",
                "initial_confidence": conf,
                "threshold": threshold,
                "action_taken": "REQUEST_EVIDENCE_FROM_CUSTOMER",
                "reason": "; ".join(agent_output.issues) or f"Confidence {conf:.2f} below {threshold:.2f}",
            })
            return {
                "recovery_action": "REQUEST_EVIDENCE",
                "target_state": ClaimLifecycleState.AWAITING_CUSTOMER,
                "final_output": agent_output,
                "reason": f"Requested clearer evidence from customer for '{agent_name}' (conf={conf:.2f} < {threshold:.2f}).",
            }

        # Case 6: Customer provided new evidence OR retry available -> Re-process / Retry
        if retries < settings.MAX_AGENT_RETRIES and agent_instance is not None:
            wf_state.retry_counts[agent_name] = retries + 1
            retry_ctx = {
                **context,
                "clarified_photo_uploaded": True,
                "retry_count": retries + 1,
            }
            retried_out = agent_instance.run(agent_output.claim_id, retry_ctx)
            wf_state.recovery_history.append({
                "agent": agent_name,
                "stage": "CONFIDENCE_RECOVERY_RETRY",
                "initial_confidence": conf,
                "recovered_confidence": retried_out.confidence,
                "action_taken": "REPROCESSED_WITH_NEW_EVIDENCE",
                "reason": f"Confidence improved from {conf:.2f} to {retried_out.confidence:.2f}",
            })
            if retried_out.confidence >= threshold:
                return {
                    "recovery_action": "CONTINUE",
                    "target_state": ClaimLifecycleState.PROCESSING,
                    "final_output": retried_out,
                    "reason": f"Confidence recovered ({conf:.2f} -> {retried_out.confidence:.2f}). Continuing workflow.",
                }

        # Case 7: All retries exhausted and confidence still insufficient -> Escalate to Human Review
        wf_state.recovery_history.append({
            "agent": agent_name,
            "stage": "UNRESOLVED_ESCALATION",
            "initial_confidence": conf,
            "action_taken": "ESCALATE_TO_HUMAN_REVIEW",
            "reason": f"Confidence ({conf:.2f}) remained below threshold ({threshold:.2f}) after {retries} recovery attempt(s).",
        })
        return {
            "recovery_action": "ESCALATE",
            "target_state": ClaimLifecycleState.HUMAN_REVIEW,
            "final_output": agent_output,
            "reason": f"Escalated to Human Review after exhausting recovery attempts on '{agent_name}'.",
        }


recovery_engine = ConfidenceAwareRecoveryEngine()
