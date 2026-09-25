import enum
from typing import Dict, Set, List, Any
from pydantic import BaseModel, Field
from app.core.exceptions import ClaimXException


class ClaimLifecycleState(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    ORCHESTRATING = "ORCHESTRATING"
    PROCESSING = "PROCESSING"
    AWAITING_CUSTOMER = "AWAITING_CUSTOMER"
    ASSESSING = "ASSESSING"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    HUMAN_REVIEW_COMPLETED = "HUMAN_REVIEW_COMPLETED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING"
    PAID = "PAID"


TERMINAL_CLAIM_STATES: Set[ClaimLifecycleState] = {
    ClaimLifecycleState.APPROVED,
    ClaimLifecycleState.REJECTED,
    ClaimLifecycleState.HUMAN_REVIEW_COMPLETED,
    ClaimLifecycleState.PAID,
}

ALLOWED_TRANSITIONS: Dict[ClaimLifecycleState, Set[ClaimLifecycleState]] = {
    ClaimLifecycleState.DRAFT: {ClaimLifecycleState.SUBMITTED},
    ClaimLifecycleState.SUBMITTED: {
        ClaimLifecycleState.ORCHESTRATING,
        ClaimLifecycleState.PROCESSING,
        ClaimLifecycleState.HUMAN_REVIEW,
    },
    ClaimLifecycleState.ORCHESTRATING: {
        ClaimLifecycleState.PROCESSING,
        ClaimLifecycleState.AWAITING_CUSTOMER,
        ClaimLifecycleState.HUMAN_REVIEW,
        ClaimLifecycleState.APPROVED,
        ClaimLifecycleState.REJECTED,
    },
    ClaimLifecycleState.PROCESSING: {
        ClaimLifecycleState.ORCHESTRATING,
        ClaimLifecycleState.AWAITING_CUSTOMER,
        ClaimLifecycleState.ASSESSING,
        ClaimLifecycleState.HUMAN_REVIEW,
        ClaimLifecycleState.APPROVED,
        ClaimLifecycleState.REJECTED,
    },
    ClaimLifecycleState.AWAITING_CUSTOMER: {
        ClaimLifecycleState.ORCHESTRATING,
        ClaimLifecycleState.PROCESSING,
        ClaimLifecycleState.HUMAN_REVIEW,
    },
    ClaimLifecycleState.ASSESSING: {
        ClaimLifecycleState.ORCHESTRATING,
        ClaimLifecycleState.APPROVED,
        ClaimLifecycleState.HUMAN_REVIEW,
        ClaimLifecycleState.REJECTED,
    },
    ClaimLifecycleState.HUMAN_REVIEW: {
        ClaimLifecycleState.HUMAN_REVIEW_COMPLETED,
        ClaimLifecycleState.APPROVED,
        ClaimLifecycleState.REJECTED,
        ClaimLifecycleState.AWAITING_CUSTOMER,
    },
    ClaimLifecycleState.HUMAN_REVIEW_COMPLETED: {
        ClaimLifecycleState.APPROVED,
        ClaimLifecycleState.REJECTED,
        ClaimLifecycleState.PAID,
    },
    ClaimLifecycleState.APPROVED: {
        ClaimLifecycleState.PAYMENT_PROCESSING,
        ClaimLifecycleState.PAID,
    },
    ClaimLifecycleState.PAYMENT_PROCESSING: {
        ClaimLifecycleState.PAID,
    },
    ClaimLifecycleState.REJECTED: set(),
    ClaimLifecycleState.PAID: set(),
}


def is_terminal_state(state: str) -> bool:
    """
    Checks whether a claim state is terminal (Section 16).
    The Final Claim Assessment Report may ONLY be generated in a terminal state.
    """
    try:
        enum_state = ClaimLifecycleState(state)
        return enum_state in TERMINAL_CLAIM_STATES
    except ValueError:
        return False


def validate_state_transition(current_state: str, next_state: str) -> bool:
    """Validates whether transitioning from current_state to next_state is permitted."""
    if current_state == next_state:
        return True
    try:
        curr = ClaimLifecycleState(current_state)
        nxt = ClaimLifecycleState(next_state)
    except ValueError as exc:
        raise ClaimXException(f"Invalid claim lifecycle state: {exc}")

    allowed = ALLOWED_TRANSITIONS.get(curr, set())
    if nxt not in allowed:
        raise ClaimXException(
            message=f"Illegal claim state transition from '{curr.value}' to '{nxt.value}'",
            error_code="INVALID_STATE_TRANSITION",
        )
    return True


class WorkflowExecutionState(BaseModel):
    """
    Runtime orchestration context tracking completed agents, retry counts,
    confidence scores, and unresolved issues for dynamic routing (Section 5 & 13).
    """
    claim_id: str
    current_state: ClaimLifecycleState = ClaimLifecycleState.SUBMITTED
    completed_agents: List[str] = Field(default_factory=list)
    retry_counts: Dict[str, int] = Field(default_factory=dict)
    agent_outputs: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    unresolved_issues: List[str] = Field(default_factory=list)
    recovery_history: List[Dict[str, Any]] = Field(default_factory=list)
    is_terminated: bool = False
