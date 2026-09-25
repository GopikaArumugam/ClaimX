import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import (
    Claim,
    DocumentRecord,
    ImageRecord,
    AuditEventRecord,
    User,
    RoleEnum,
)
from app.schemas.claim import ClaimCreateRequest, ClaimUpdateRequest
from app.services.seed_claims import (
    serialize_claim,
    default_agent_results,
    seed_default_policies_and_claims,
)
from app.services.storage_service import storage_service, validate_file_payload
from app.core.security import bearer_scheme, decode_access_token
from app.core.exceptions import ResourceNotFoundException, AuthorizationException

router = APIRouter(prefix="/claims", tags=["Claims & Evidence Management"])


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not credentials or not credentials.credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    email = payload.get("sub")
    return db.query(User).filter(User.email == email).first()


def verify_claim_access(claim: Claim, user: Optional[User]) -> None:
    """Enforces Section 21 Security: Customers can only access their own claims."""
    if user and user.role == RoleEnum.CUSTOMER:
        if claim.customer_email.lower().strip() != user.email.lower().strip():
            raise AuthorizationException(
                f"Customer '{user.email}' is not authorized to access claim '{claim.claim_id}'"
            )


@router.get("")
def list_claims(
    status_filter: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    query = db.query(Claim)
    if current_user and current_user.role == RoleEnum.CUSTOMER:
        query = query.filter(Claim.customer_email == current_user.email)
    if status_filter:
        query = query.filter(Claim.status == status_filter)

    claims = query.order_by(Claim.id.desc()).all()
    data = [serialize_claim(db, c) for c in claims]
    return {"success": True, "count": len(data), "data": data}


@router.get("/kpis")
def get_claims_kpis(db: Session = Depends(get_db)):
    claims = db.query(Claim).all()
    total = len(claims)
    approved = sum(1 for c in claims if c.status in ("APPROVED", "PAID"))
    review = sum(1 for c in claims if c.status == "HUMAN_REVIEW")
    fraud = sum(1 for c in claims if c.fraud_risk >= 0.45)
    rate = f"{(approved / total * 100):.1f}%" if total > 0 else "0.0%"
    return {
        "success": True,
        "data": {
            "totalClaims": total,
            "aiProcessed": total,
            "aiAutonomousRate": rate,
            "autoApproved": approved,
            "humanReviewCount": review,
            "potentialFraud": fraud,
        },
    }


@router.get("/{claim_id}")
def get_claim_by_id(
    claim_id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise ResourceNotFoundException("Claim", claim_id)
    verify_claim_access(claim, current_user)
    return {"success": True, "data": serialize_claim(db, claim)}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_claim(
    payload: ClaimCreateRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    cid = payload.claimId or f"CLM-2026-{uuid.uuid4().int % 90000 + 10000}"
    claim = Claim(
        claim_id=cid,
        user_id=current_user.id if current_user else None,
        customer_name=payload.customer.name,
        customer_email=payload.customer.email.lower().strip(),
        customer_phone=payload.customer.phone,
        customer_address=payload.customer.address,
        policy_number=payload.policyNumber,
        policy_coverage=payload.policyCoverage,
        policy_status=payload.policyStatus,
        policy_limit=payload.policyLimit,
        vehicle_number=payload.vehicleNumber,
        vehicle_model=payload.vehicleModel,
        accident_date=payload.accidentDate,
        accident_location=payload.accidentLocation,
        claim_type=payload.claimType,
        incident_description=payload.incidentDescription,
        claimed_amount=payload.claimedAmount,
        estimated_amount=0.0,
        approved_amount=0.0,
        deductible=payload.deductible,
        fraud_risk=0.0,
        overall_confidence=0.0,
        current_agent="orchestrator",
        status="SUBMITTED",
        risk_level="Low",
        agent_results_json=default_agent_results(),
    )
    db.add(claim)
    db.add(
        AuditEventRecord(
            claim_id=cid,
            agent="orchestrator",
            action="Claim Created",
            evidence_refs=[payload.policyNumber, payload.vehicleNumber],
            result_summary=f"Claim submitted for {payload.customer.name} (Claimed: INR {payload.claimedAmount:,.2f})",
            confidence=1.0,
            reason="Initial customer claim intake submission",
            next_action="ORCHESTRATE",
        )
    )
    db.commit()
    db.refresh(claim)
    return {"success": True, "data": serialize_claim(db, claim)}


@router.put("/{claim_id}")
def update_claim(
    claim_id: str,
    payload: ClaimUpdateRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise ResourceNotFoundException("Claim", claim_id)
    verify_claim_access(claim, current_user)

    if payload.status is not None:
        claim.status = payload.status
    if payload.currentAgent is not None:
        claim.current_agent = payload.currentAgent
    if payload.estimatedAmount is not None:
        claim.estimated_amount = payload.estimatedAmount
    if payload.approvedAmount is not None:
        claim.approved_amount = payload.approvedAmount
    if payload.fraudRisk is not None:
        claim.fraud_risk = payload.fraudRisk
    if payload.overallConfidence is not None:
        claim.overall_confidence = payload.overallConfidence
    if payload.risk is not None:
        claim.risk_level = payload.risk
    if payload.agentResults is not None:
        claim.agent_results_json = payload.agentResults
    if payload.orchestratorNotes is not None:
        claim.orchestrator_notes_json = payload.orchestratorNotes
    if payload.settlement is not None:
        claim.settlement_json = payload.settlement
    if payload.humanReviewNotes is not None:
        claim.human_review_json = payload.humanReviewNotes

    db.commit()
    db.refresh(claim)
    return {"success": True, "data": serialize_claim(db, claim)}


@router.post("/{claim_id}/documents", status_code=status.HTTP_201_CREATED)
async def upload_claim_document(
    claim_id: str,
    file: UploadFile = File(...),
    doc_type: str = Form("Policy"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise ResourceNotFoundException("Claim", claim_id)
    verify_claim_access(claim, current_user)

    content = await file.read()
    _sha256, size_str = validate_file_payload(file.filename or "document.pdf", content, category="document")
    storage_uri = storage_service.put_object(claim_id, "documents", file.filename or "document.pdf", content)

    doc_rec = DocumentRecord(
        doc_id=f"DOC-{uuid.uuid4().hex[:6].upper()}",
        claim_id=claim_id,
        name=file.filename or "document.pdf",
        doc_type=doc_type,
        status="Verified",
        ocr_confidence=0.96,
        file_size=size_str,
        storage_uri=storage_uri,
        extracted_fields={"Document Type": doc_type, "Claim Reference": claim_id},
    )
    db.add(doc_rec)
    db.add(
        AuditEventRecord(
            claim_id=claim_id,
            agent="document",
            action="Document Uploaded",
            evidence_refs=[doc_rec.name],
            result_summary=f"Stored {doc_type} '{doc_rec.name}' ({size_str}) in object storage",
            confidence=1.0,
            reason="Evidence ingestion",
            next_action="DOCUMENT_ANALYSIS",
        )
    )
    db.commit()
    db.refresh(doc_rec)
    return {
        "success": True,
        "document": {
            "id": doc_rec.doc_id,
            "name": doc_rec.name,
            "type": doc_rec.doc_type,
            "status": doc_rec.status,
            "fileSize": doc_rec.file_size,
            "storageUri": doc_rec.storage_uri,
        },
    }


@router.post("/{claim_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_claim_image(
    claim_id: str,
    file: UploadFile = File(...),
    angle: str = Form("Front View"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise ResourceNotFoundException("Claim", claim_id)
    verify_claim_access(claim, current_user)

    content = await file.read()
    _sha256, _size_str = validate_file_payload(file.filename or "photo.jpg", content, category="image")
    storage_uri = storage_service.put_object(claim_id, "images", file.filename or "photo.jpg", content)

    img_rec = ImageRecord(
        img_id=f"IMG-{uuid.uuid4().hex[:6].upper()}",
        claim_id=claim_id,
        angle=angle,
        storage_uri=storage_uri,
        quality="Good",
        vision_confidence=0.94,
        damage_detected=[],
    )
    db.add(img_rec)
    db.add(
        AuditEventRecord(
            claim_id=claim_id,
            agent="vision",
            action="Image Evidence Uploaded",
            evidence_refs=[file.filename or "photo.jpg"],
            result_summary=f"Stored vehicle image ({angle}) in object storage",
            confidence=1.0,
            reason="Visual evidence ingestion",
            next_action="VISION_ANALYSIS",
        )
    )
    db.commit()
    db.refresh(img_rec)
    return {
        "success": True,
        "image": {
            "id": img_rec.img_id,
            "angle": img_rec.angle,
            "storageUri": img_rec.storage_uri,
            "quality": img_rec.quality,
        },
    }


@router.post("/reset")
def reset_claims_state(db: Session = Depends(get_db)):
    db.query(AuditEventRecord).delete()
    db.query(ImageRecord).delete()
    db.query(DocumentRecord).delete()
    db.query(Claim).delete()
    db.commit()
    seed_default_policies_and_claims(db)
    return {"success": True, "message": "All claims reset to default research benchmark state"}
