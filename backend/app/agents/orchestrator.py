from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseClaimAgent
from app.agents.contract import AgentContractOutput, RecommendedActionEnum
from app.agents.state_machine import (
    ClaimLifecycleState,
    WorkflowExecutionState,
)
from app.agents.document_agent import document_agent
from app.agents.vision_agent import vision_agent
from app.agents.policy_agent import policy_agent
from app.agents.fraud_agent import fraud_agent
from app.agents.estimation_agent import estimation_agent
from app.agents.decision_agent import decision_agent
from app.services.audit_service import AuditService


class DynamicClaimOrchestrator:
    """
    Confidence-Aware Dynamically Orchestrated Multi-Agent Engine (Section 5 & Section 23 Stage 9).

    Unlike a rigid static sequence (Document -> Vision -> Policy -> Fraud -> Estimation -> Decision),
    the Dynamic Orchestrator inspects runtime claim context, intermediate agent outputs,
    and confidence scores at each step to:
    1. Dynamically prune unnecessary downstream agents when a deterministic disqualifier occurs
       (e.g., Policy Agent returns STOP on an expired policy -> Fraud & Estimation are skipped).
    2. Pause downstream execution and transition to AWAITING_CUSTOMER when an upstream perception
       agent (Vision or Document) returns REQUEST_EVIDENCE due to low quality/confidence.
    3. Re-invoke specific agents upon customer evidence upload without re-running already-verified agents.
    4. Persist structured Section 17 audit trail events when a DB session (`db`) is provided.
    """

    def __init__(self, custom_agents: Optional[Dict[str, BaseClaimAgent]] = None):
        self.agents: Dict[str, BaseClaimAgent] = custom_agents or {
            "policy": policy_agent,
            "document": document_agent,
            "vision": vision_agent,
            "fraud": fraud_agent,
            "estimation": estimation_agent,
            "decision": decision_agent,
        }

    def select_next_step(
        self, wf_state: WorkflowExecutionState, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Inspects current workflow state and returns the next orchestration decision:
        Returns: {"action": "DISPATCH_AGENT" | "PAUSE_FOR_EVIDENCE" | "TERMINATE_PRUNED" | "READY_FOR_DECISION",
                 "target_agent": Optional[str], "reason": str}
        """
        for agent_name, out in wf_state.agent_outputs.items():
            if out.get("recommended_action") == RecommendedActionEnum.STOP.value:
                return {
                    "action": "TERMINATE_PRUNED",
                    "target_agent": None,
                    "reason": f"Agent '{agent_name}' returned STOP ({'; '.join(out.get('issues', []))}). Dynamically pruning downstream agents.",
                }

        for agent_name in ("document", "vision"):
            out = wf_state.agent_outputs.get(agent_name)
            if out and out.get("recommended_action") == RecommendedActionEnum.REQUEST_EVIDENCE.value:
                if not context.get("clarified_photo_uploaded") and wf_state.retry_counts.get(agent_name, 0) == 0:
                    return {
                        "action": "PAUSE_FOR_EVIDENCE",
                        "target_agent": agent_name,
                        "reason": f"Agent '{agent_name}' confidence ({out.get('confidence')}) below threshold. Pausing pipeline to request additional evidence from policyholder.",
                    }

        if "policy" not in wf_state.completed_agents:
            return {
                "action": "DISPATCH_AGENT",
                "target_agent": "policy",
                "reason": "Dispatching Policy Agent first to verify active coverage and avoid unnecessary perception/ML compute on invalid policies.",
            }

        if "document" not in wf_state.completed_agents:
            return {
                "action": "DISPATCH_AGENT",
                "target_agent": "document",
                "reason": "Policy verified active; dispatching Document Agent for OCR & cross-document consistency validation.",
            }

        if "vision" not in wf_state.completed_agents:
            return {
                "action": "DISPATCH_AGENT",
                "target_agent": "vision",
                "reason": "Dispatching Vision Agent for NR-IQA quality assessment, bounding-box localization, and dHash extraction.",
            }

        if "fraud" not in wf_state.completed_agents:
            return {
                "action": "DISPATCH_AGENT",
                "target_agent": "fraud",
                "reason": "Perception & Policy outputs available; dispatching Fraud Agent with cross-document and dHash features.",
            }

        if "estimation" not in wf_state.completed_agents:
            return {
                "action": "DISPATCH_AGENT",
                "target_agent": "estimation",
                "reason": "Dispatching Estimation Agent to compute OEM parts & labor baseline against claimed amount.",
            }

        if "decision" in self.agents and "decision" not in wf_state.completed_agents:
            return {
                "action": "DISPATCH_AGENT",
                "target_agent": "decision",
                "reason": "All specialized agent outputs collected; dispatching Decision Agent for final guardrail evaluation.",
            }

        return {
            "action": "READY_FOR_DECISION",
            "target_agent": None,
            "reason": "All dynamic orchestration prerequisites satisfied.",
        }

    def run_dynamic_workflow(
        self,
        claim_id: str,
        context: Dict[str, Any],
        wf_state: Optional[WorkflowExecutionState] = None,
        db: Optional[Session] = None,
    ) -> WorkflowExecutionState:
        """
        Executes the state-driven orchestration loop until a terminal state,
        an evidence request pause (AWAITING_CUSTOMER), or decision completion is reached.
        """
        state = wf_state or WorkflowExecutionState(
            claim_id=claim_id,
            current_state=ClaimLifecycleState.ORCHESTRATING,
        )

        if db is not None:
            AuditService.record_event(
                db=db,
                claim_id=claim_id,
                agent="Orchestrator",
                action="WORKFLOW_STARTED",
                result_summary="Dynamic confidence-aware orchestration loop initialized.",
                confidence=1.0,
                reason="State-driven multi-agent routing active",
                next_action="Evaluate dynamic policy & perception priority",
            )

        if context.get("clarified_photo_uploaded") and "vision" in state.completed_agents:
            vision_prev = state.agent_outputs.get("vision", {})
            if vision_prev.get("recommended_action") == RecommendedActionEnum.REQUEST_EVIDENCE.value:
                state.completed_agents.remove("vision")
                state.retry_counts["vision"] = state.retry_counts.get("vision", 0) + 1
                state.recovery_history.append({
                    "agent": "vision",
                    "event": "Customer uploaded replacement daylight photograph; re-dispatching Vision Agent.",
                    "previous_confidence": vision_prev.get("confidence"),
                })
                if db is not None:
                    AuditService.record_event(
                        db=db,
                        claim_id=claim_id,
                        agent="Vision Agent",
                        action="REPROCESS",
                        result_summary="Customer uploaded replacement daylight photograph; re-dispatching Vision Agent.",
                        confidence=vision_prev.get("confidence"),
                        reason="Confidence-aware evidence recovery triggered",
                        next_action="Re-run Vision Agent on clarified evidence",
                    )

        max_steps = 12
        steps_taken = 0

        while steps_taken < max_steps and not state.is_terminated:
            steps_taken += 1
            decision = self.select_next_step(state, context)
            act = decision["action"]

            if act == "TERMINATE_PRUNED":
                state.current_state = ClaimLifecycleState.REJECTED
                state.is_terminated = True
                if db is not None:
                    AuditService.record_event(
                        db=db,
                        claim_id=claim_id,
                        agent="Orchestrator",
                        action="TERMINATE_PRUNED",
                        result_summary=decision["reason"],
                        confidence=1.0,
                        reason="Deterministic STOP signal received",
                        next_action="Transition claim to REJECTED",
                    )
                break

            if act == "PAUSE_FOR_EVIDENCE":
                state.current_state = ClaimLifecycleState.AWAITING_CUSTOMER
                if db is not None:
                    AuditService.record_event(
                        db=db,
                        claim_id=claim_id,
                        agent="Orchestrator",
                        action="PAUSE_FOR_EVIDENCE",
                        result_summary=decision["reason"],
                        confidence=None,
                        reason="Perception confidence below threshold",
                        next_action="Transition claim to AWAITING_CUSTOMER",
                    )
                break

            if act == "READY_FOR_DECISION":
                has_escalation = any(
                    out.get("recommended_action") == RecommendedActionEnum.ESCALATE.value
                    for out in state.agent_outputs.values()
                )
                state.current_state = (
                    ClaimLifecycleState.HUMAN_REVIEW
                    if has_escalation
                    else ClaimLifecycleState.ASSESSING
                )
                break

            if act == "DISPATCH_AGENT":
                target = decision["target_agent"]
                agent_obj = self.agents[target]
                exec_ctx = {
                    **context,
                    "agent_outputs": state.agent_outputs,
                    "retry_count": state.retry_counts.get(target, 0),
                }
                contract_out: AgentContractOutput = agent_obj.run(claim_id, exec_ctx)
                state.agent_outputs[target] = contract_out.model_dump()
                if target not in state.completed_agents:
                    state.completed_agents.append(target)

                if contract_out.issues:
                    for iss in contract_out.issues:
                        if iss not in state.unresolved_issues:
                            state.unresolved_issues.append(iss)

                if db is not None:
                    AuditService.record_event(
                        db=db,
                        claim_id=claim_id,
                        agent=f"{target.capitalize()} Agent",
                        action=contract_out.recommended_action.value,
                        evidence_refs=contract_out.evidence,
                        result_summary=str(
                            contract_out.result.get("summary")
                            or contract_out.result.get("explanation")
                            or f"Completed {target} evaluation"
                        )[:240],
                        confidence=contract_out.confidence,
                        reason=(
                            f"Issues: {'; '.join(contract_out.issues[:2])}"
                            if contract_out.issues
                            else f"Confidence {contract_out.confidence:.2f} satisfies agent threshold"
                        ),
                        next_action=contract_out.recommended_action.value,
                    )

                if target == "decision":
                    rec = contract_out.result.get("final_recommendation", "HUMAN_REVIEW")
                    if rec == "APPROVE":
                        state.current_state = ClaimLifecycleState.APPROVED
                        state.is_terminated = True
                    elif rec == "MORE_EVIDENCE":
                        state.current_state = ClaimLifecycleState.AWAITING_CUSTOMER
                    else:
                        state.current_state = ClaimLifecycleState.HUMAN_REVIEW
                    break

        return state


dynamic_orchestrator = DynamicClaimOrchestrator()
