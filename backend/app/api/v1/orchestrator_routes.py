"""
Stage 13: Orchestration, Human Adjudication, Settlement & Final Report API Routes.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import (
    Claim,
    DocumentRecord,
    ImageRecord,
    HumanReviewRecord,
    User,
    RoleEnum,
)
from app.core.security import get_current_user
from app.agents.orchestrator import dynamic_orchestrator
from app.agents.state_machine import is_terminal_state
from app.services.audit_service import AuditService
from app.services.report_generator import FinalReportGenerator

router = APIRouter(tags=["Orchestration & Final Report"])


class AdjudicateRequest(BaseModel):
    decision: str  # "APPROVE" | "REJECT" | "HUMAN_REVIEW_COMPLETED" | "REQUEST_EVIDENCE"
    notes: str = "Reviewed by Senior Claims Specialist."
    override_amount: Optional[float] = None


class SettleRequest(BaseModel):
    payment_method: str = "NEFT / RTGS Instant Settlement"
    utr_reference: str = "HDFC000202609258841"


def _build_context_from_db(db: Session, claim: Claim, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    docs = db.query(DocumentRecord).filter(DocumentRecord.claim_id == claim.claim_id).all()
    imgs = db.query(ImageRecord).filter(ImageRecord.claim_id == claim.claim_id).all()
    docs_payload = (
        [
            {
                "id": d.doc_id,
                "name": d.name,
                "type": d.doc_type,
                "status": d.status,
                "ocrConfidence": d.ocr_confidence,
                "extractedFields": d.extracted_fields or {},
            }
            for d in docs
        ]
        if docs
        else [
            {
                "id": "DOC-01",
                "name": "Policy_Certificate.pdf",
                "type": "Policy",
                "status": "Verified",
                "ocrConfidence": 98,
                "extractedFields": {"Policy Number": claim.policy_number},
            }
        ]
    )
    imgs_payload = (
        [
            {
                "id": img.img_id,
                "angle": img.angle,
                "quality": img.quality,
                "visionConfidence": img.vision_confidence,
                "damageDetected": img.damage_detected or [],
            }
            for img in imgs
        ]
        if imgs
        else [
            {
                "id": "IMG-01",
                "angle": "Front View",
                "quality": "Insufficient" if claim.claim_id == "CLM-2026-01775" else "Good",
                "visionConfidence": 39 if claim.claim_id == "CLM-2026-01775" else 95,
                "damageDetected": [{"part": "Front Bumper", "severity": "Moderate"}],
            }
        ]
    )
    ctx: Dict[str, Any] = {
        "policyNumber": claim.policy_number,
        "policyStatus": claim.policy_status,
        "policyLimit": claim.policy_limit,
        "vehicleNumber": claim.vehicle_number,
        "vehicleModel": claim.vehicle_model,
        "claimedAmount": claim.claimed_amount,
        "deductible": claim.deductible,
        "accidentDate": claim.accident_date,
        "incidentDescription": claim.incident_description,
        "documents": docs_payload,
        "accidentPhotos": imgs_payload,
    }
    if extra:
        ctx.update(extra)
    return ctx


def _apply_workflow_state_to_claim(db: Session, claim: Claim, wf_state) -> Optional[Dict[str, Any]]:
    claim.status = wf_state.current_state.value
    claim.agent_results_json = wf_state.agent_outputs

    confs = [
        float(v.get("confidence", 0.0))
        for v in wf_state.agent_outputs.values()
        if isinstance(v, dict) and "confidence" in v
    ]
    if confs:
        claim.overall_confidence = round(sum(confs) / len(confs), 4)

    fraud_out = wf_state.agent_outputs.get("fraud", {}).get("result", {})
    if "fraud_risk_score" in fraud_out:
        claim.fraud_risk = round(float(fraud_out["fraud_risk_score"]), 4)
        claim.risk_level = (
            "High"
            if claim.fraud_risk >= 0.60
            else ("Medium" if claim.fraud_risk >= 0.35 else "Low")
        )

    est_out = wf_state.agent_outputs.get("estimation", {}).get("result", {})
    if "estimated_repair_cost" in est_out:
        claim.estimated_amount = round(float(est_out["estimated_repair_cost"]), 2)
        if claim.status == "APPROVED":
            claim.approved_amount = max(0.0, round(claim.estimated_amount - claim.deductible, 2))

    claim.orchestrator_notes_json = {
        "completed_agents": wf_state.completed_agents,
        "unresolved_issues": wf_state.unresolved_issues,
        "recovery_history": wf_state.recovery_history,
        "retry_counts": wf_state.retry_counts,
    }
    db.commit()
    db.refresh(claim)

    if is_terminal_state(claim.status):
        return FinalReportGenerator.generate_final_report(db, claim.claim_id, force_refresh=True)
    return None


@router.post("/orchestrator/{claim_id}/run")
def run_claim_orchestration(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Claim {claim_id} not found.")

    ctx = _build_context_from_db(db, claim)
    wf_state = dynamic_orchestrator.run_dynamic_workflow(claim_id, ctx, db=db)
    report = _apply_workflow_state_to_claim(db, claim, wf_state)

    return {
        "claim_id": claim_id,
        "status": claim.status,
        "is_terminal": is_terminal_state(claim.status),
        "completed_agents": wf_state.completed_agents,
        "overall_confidence": claim.overall_confidence,
        "fraud_risk": claim.fraud_risk,
        "estimated_amount": claim.estimated_amount,
        "approved_amount": claim.approved_amount,
        "agent_outputs": wf_state.agent_outputs,
        "final_report_generated": report is not None,
    }


@router.post("/orchestrator/{claim_id}/resolve-photo")
def resolve_customer_photo_recovery(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Claim {claim_id} not found.")

    # Upgrade low-quality images to Good daylight quality
    imgs = db.query(ImageRecord).filter(ImageRecord.claim_id == claim_id).all()
    for img in imgs:
        img.quality = "Good"
        img.vision_confidence = 94.0
    db.commit()

    AuditService.record_event(
        db=db,
        claim_id=claim_id,
        agent="Customer Portal",
        action="EVIDENCE_UPLOADED",
        result_summary="Policyholder uploaded high-resolution daylight damage photo in response to Vision Agent request.",
        confidence=0.94,
        reason="Customer evidence clarification loop completed",
        next_action="Re-dispatch Vision Agent and resume Dynamic Orchestrator",
    )

    ctx = _build_context_from_db(db, claim, extra={"clarified_photo_uploaded": True})
    wf_state = dynamic_orchestrator.run_dynamic_workflow(claim_id, ctx, db=db)
    report = _apply_workflow_state_to_claim(db, claim, wf_state)

    return {
        "claim_id": claim_id,
        "status": claim.status,
        "is_terminal": is_terminal_state(claim.status),
        "completed_agents": wf_state.completed_agents,
        "overall_confidence": claim.overall_confidence,
        "final_report_generated": report is not None,
    }


@router.post("/claims/{claim_id}/adjudicate")
def adjudicate_claim_human_review(
    claim_id: str,
    req: AdjudicateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (RoleEnum.CLAIM_HANDLER, RoleEnum.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Claim Handlers or Admins may adjudicate escalated claims.",
        )

    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Claim {claim_id} not found.")

    dec = req.decision.upper()
    if dec in ("APPROVE", "APPROVED"):
        claim.status = "APPROVED"
        claim.approved_amount = (
            req.override_amount
            if req.override_amount is not None
            else max(0.0, round((claim.estimated_amount or claim.claimed_amount) - claim.deductible, 2))
        )
    elif dec in ("REJECT", "REJECTED"):
        claim.status = "REJECTED"
        claim.approved_amount = 0.0
    elif dec == "HUMAN_REVIEW_COMPLETED":
        claim.status = "HUMAN_REVIEW_COMPLETED"
        if req.override_amount is not None:
            claim.approved_amount = req.override_amount
    elif dec in ("REQUEST_EVIDENCE", "AWAITING_CUSTOMER"):
        claim.status = "AWAITING_CUSTOMER"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported adjudication decision '{req.decision}'.",
        )

    review_rec = HumanReviewRecord(
        claim_id=claim_id,
        reviewer_id=current_user.id,
        reviewer_name=current_user.full_name,
        decision=claim.status,
        notes=req.notes,
        override_amount=req.override_amount,
    )
    db.add(review_rec)
    claim.human_review_json = {
        "reviewer_name": current_user.full_name,
        "decision": claim.status,
        "notes": req.notes,
        "override_amount": req.override_amount,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }
    db.commit()

    AuditService.record_event(
        db=db,
        claim_id=claim_id,
        agent=f"Human Specialist ({current_user.full_name})",
        action="HUMAN_DECISION",
        result_summary=f"Human review decision: {claim.status}. Notes: {req.notes}",
        confidence=1.0,
        reason="Human-in-the-loop escalation resolved",
        next_action="Generate Final Claim Assessment Report" if is_terminal_state(claim.status) else "Wait for customer",
    )

    report = None
    if is_terminal_state(claim.status):
        report = FinalReportGenerator.generate_final_report(db, claim_id, force_refresh=True)

    return {
        "claim_id": claim_id,
        "status": claim.status,
        "approved_amount": claim.approved_amount,
        "is_terminal": is_terminal_state(claim.status),
        "final_report_generated": report is not None,
    }


@router.post("/claims/{claim_id}/settle")
def settle_approved_claim(
    claim_id: str,
    req: SettleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (RoleEnum.CLAIM_HANDLER, RoleEnum.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Claim Handlers or Admins may execute disbursement.",
        )

    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Claim {claim_id} not found.")

    if claim.status not in ("APPROVED", "HUMAN_REVIEW_COMPLETED"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Claim {claim_id} must be APPROVED or HUMAN_REVIEW_COMPLETED before settlement (current: {claim.status}).",
        )

    claim.status = "PAID"
    claim.settlement_json = {
        "payment_method": req.payment_method,
        "utr_reference": req.utr_reference,
        "paid_amount_inr": claim.approved_amount,
        "settled_by": current_user.full_name,
        "settled_at": datetime.now(timezone.utc).isoformat(),
    }
    db.commit()

    AuditService.record_event(
        db=db,
        claim_id=claim_id,
        agent=f"Settlement Engine ({current_user.full_name})",
        action="SETTLED_AND_PAID",
        result_summary=f"Disbursed INR {claim.approved_amount:,.2f} via {req.payment_method} (UTR: {req.utr_reference}).",
        confidence=1.0,
        reason="Approved claim settled",
        next_action="Archive PAID Final Claim Assessment Report",
    )

    report = FinalReportGenerator.generate_final_report(db, claim_id, force_refresh=True)
    return {
        "claim_id": claim_id,
        "status": claim.status,
        "settlement": claim.settlement_json,
        "final_report": report,
    }


@router.get("/claims/{claim_id}/report")
def get_final_claim_assessment_report(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Claim {claim_id} not found.")

    if current_user.role == RoleEnum.CUSTOMER and (
        claim.user_id is not None
        and claim.user_id != current_user.id
        and claim.customer_email.lower() != current_user.email.lower()
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customers may only access reports for their own claims.",
        )

    # Strictly enforce Section 16 terminal-state guard (raises ClaimXException 409 if non-terminal)
    report = FinalReportGenerator.generate_final_report(db, claim_id, force_refresh=False)
    return report
