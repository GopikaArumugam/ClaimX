"""
Stage 12: Structured Audit Trail API Routes (Section 17).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Claim, User, RoleEnum
from app.core.security import get_current_user
from app.services.audit_service import AuditService

router = APIRouter(prefix="/claims", tags=["Audit Trail"])


@router.get("/{claim_id}/audit-trail")
def get_claim_audit_trail(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim {claim_id} not found.",
        )

    if current_user.role == RoleEnum.CUSTOMER and (
        claim.user_id is not None
        and claim.user_id != current_user.id
        and claim.customer_email.lower() != current_user.email.lower()
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customers may only view audit trails for their own claims.",
        )

    events = AuditService.get_claim_audit_trail(db, claim_id)
    return {
        "claim_id": claim_id,
        "event_count": len(events),
        "audit_events": events,
    }
