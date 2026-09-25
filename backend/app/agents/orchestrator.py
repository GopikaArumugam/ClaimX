from typing import Dict, Any, List, Optional
from app.agents.contract import (
    AgentContractOutput,
    AgentStatusEnum,
    RecommendedActionEnum,
)
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


class DynamicClaimOrchestrator:
    """
    Section 3, 4, 5, 23 (Stage 9): Dynamic Claim Orchestrator
    Dynamically selects the next agent or workflow action based on current claim state,
    available evidence, agent confidence outputs, and unresolved issues rather than a static pipeline.
    """

    def __init__(self):
        self.agents = {
            "document": document_agent,
            "vision": vision_agent,
            "policy": policy_agent,
            "fraud": fraud_agent,
            "estimation": estimation_agent,
            "decision": decision_agent,
        }

    def register_agent(self, name: str, agent_instance: Any) -> None:
        self.agents[name] = agent_instance

    def select_next_step(
        self,
        wf_state: WorkflowExecutionState,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Evaluates current WorkflowExecutionState and determines the next dynamic action:
        Returns {"action": "DISPATCH_AGENT" | "PAUSE_FOR_EVIDENCE" | "ESCALATE_HUMAN" | "TERMINATE_PRUNED" | "READY_FOR_DECISION",
                 "target_agent": Optional[str], "reason": str}
        """
        # 1. Check if any completed agent triggered deterministic STOP (e.g., Expired Policy pruning)
        for agent_name, out in wf_state.agent_outputs.items():
            if out.get("recommended_action") == RecommendedActionEnum.STOP.value:
                return {
                    "action": "TERMINATE_PRUNED",
                    "target_agent": None,
                    "reason": f"Agent '{agent_name}' returned STOP ({'; '.join(out.get('issues', []))}). Dynamically pruning downstream agents.",
                }

        # 2. Check if any perception agent requires customer evidence before downstream analysis
        for agent_name in ("document", "vision"):
            out = wf_state.agent_outputs.get(agent_name)
            if out and out.get("recommended_action") == RecommendedActionEnum.REQUEST_EVIDENCE.value:
                # Only pause if customer has not yet uploaded clarified evidence for this step
                if not context.get("clarified_photo_uploaded") and wf_state.retry_counts.get(agent_name, 0) == 0:
                    return {
                        "action": "PAUSE_FOR_EVIDENCE",
                        "target_agent": agent_name,
                        "reason": f"Agent '{agent_name}' confidence ({out.get('confidence')}) below threshold. Pausing pipeline to request additional evidence from policyholder.",
                    }

        # 3. Dynamic Priority 1: Policy eligibility check first if policy status is suspect or not yet verified
        if "policy" not in wf_state.completed_agents:
            return {
                "action": "DISPATCH_AGENT",
                "target_agent": "policy",
                "reason": "Dispatching Policy Agent first to verify active coverage and avoid unnecessary perception/ML compute on invalid policies.",
            }

        # 4. Dynamic Priority 2: Document verification
        if "document" not in wf_state.completed_agents:
            return {
                "action": "DISPATCH_AGENT",
                "target_agent": "document",
                "reason": "Policy verified active; dispatching Document Agent for OCR & cross-document consistency validation.",
            }

        # 5. Dynamic Priority 3: Vision damage assessment (or retry if clarified photo arrived)
        if "vision" not in wf_state.completed_agents:
            return {
                "action": "DISPATCH_AGENT",
                "target_agent": "vision",
                "reason": "Dispatching Vision Agent for NR-IQA quality assessment, bounding-box localization, and dHash extraction.",
            }

        # 6. Dynamic Priority 4: Fraud risk assessment (depends on document & vision signals)
        if "fraud" not in wf_state.completed_agents:
            return {
                "action": "DISPATCH_AGENT",
                "target_agent": "fraud",
                "reason": "Perception & Policy outputs available; dispatching Fraud Agent with cross-document and dHash features.",
            }

        # 7. Dynamic Priority 5: Repair cost estimation (depends on vision damage detections & policy deductible)
        if "estimation" not in wf_state.completed_agents:
            return {
                "action": "DISPATCH_AGENT",
                "target_agent": "estimation",
                "reason": "Dispatching Estimation Agent to compute OEM parts & labor baseline against claimed amount.",
            }

        # 8. All prerequisite evidence gathered -> Ready for Decision Agent (or direct dispatch if registered)
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
    ) -> WorkflowExecutionState:
        """
        Executes the state-driven orchestration loop until a terminal state,
        an evidence request pause (AWAITING_CUSTOMER), or decision completion is reached.
        """
        state = wf_state or WorkflowExecutionState(
            claim_id=claim_id,
            current_state=ClaimLifecycleState.ORCHESTRATING,
        )

        # If resuming with clarified customer photo, mark vision for re-execution
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

        max_steps = 12
        steps_taken = 0

        while steps_taken < max_steps and not state.is_terminated:
            steps_taken += 1
            decision = self.select_next_step(state, context)
            act = decision["action"]

            if act == "TERMINATE_PRUNED":
                state.current_state = ClaimLifecycleState.REJECTED
                state.is_terminated = True
                break

            if act == "PAUSE_FOR_EVIDENCE":
                state.current_state = ClaimLifecycleState.AWAITING_CUSTOMER
                break

            if act == "READY_FOR_DECISION":
                # If Decision Agent is not yet registered, evaluate escalate vs assessing
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

                # If Decision Agent just ran, update lifecycle state accordingly
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
