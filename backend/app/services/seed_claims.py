from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.db.models import (
    Claim,
    Policy,
    DocumentRecord,
    ImageRecord,
    AuditEventRecord,
)

AGENTS_LIST = ["orchestrator", "document", "vision", "policy", "fraud", "estimation", "decision"]


def default_agent_results() -> Dict[str, Any]:
    names = {
        "orchestrator": "Claim Orchestrator",
        "document": "Document Agent",
        "vision": "Vision Agent",
        "policy": "Policy Agent",
        "fraud": "Fraud Agent",
        "estimation": "Estimation Agent",
        "decision": "Decision Agent",
    }
    return {
        aid: {
            "agentId": aid,
            "name": names[aid],
            "status": "IDLE",
            "confidence": 0,
            "summary": "Awaiting dynamic orchestrator dispatch.",
            "evidence": [],
        }
        for aid in AGENTS_LIST
    }


def serialize_claim(db: Session, claim: Claim) -> Dict[str, Any]:
    """Serializes relational Claim + child Document/Image/Audit records into the canonical frontend/API schema."""
    docs = db.query(DocumentRecord).filter(DocumentRecord.claim_id == claim.claim_id).all()
    imgs = db.query(ImageRecord).filter(ImageRecord.claim_id == claim.claim_id).all()
    events = (
        db.query(AuditEventRecord)
        .filter(AuditEventRecord.claim_id == claim.claim_id)
        .order_by(AuditEventRecord.id.desc())
        .all()
    )

    documents_list = [
        {
            "id": d.doc_id,
            "name": d.name,
            "type": d.doc_type,
            "status": d.status,
            "ocrConfidence": int(d.ocr_confidence * 100) if d.ocr_confidence <= 1.0 else int(d.ocr_confidence),
            "fileSize": d.file_size,
            "uploadDate": d.created_at.strftime("%Y-%m-%d") if d.created_at else "2026-09-12",
            "extractedFields": d.extracted_fields or {},
            "previewUrl": d.storage_uri,
        }
        for d in docs
    ]

    photos_list = [
        {
            "id": img.img_id,
            "angle": img.angle,
            "url": img.storage_uri,
            "quality": img.quality,
            "visionConfidence": int(img.vision_confidence * 100) if img.vision_confidence <= 1.0 else int(img.vision_confidence),
            "damageDetected": img.damage_detected or [],
        }
        for img in imgs
    ]

    damage_items: List[Dict[str, Any]] = []
    for p in photos_list:
        damage_items.extend(p.get("damageDetected", []))

    activity_feed = [
        {
            "id": f"ACT-{ev.id}",
            "timestamp": ev.timestamp.strftime("%H:%M:%S") if ev.timestamp else "09:00:00",
            "agentId": ev.agent,
            "agentName": ev.agent.capitalize() + " Agent" if ev.agent != "orchestrator" else "Claim Orchestrator",
            "action": f"{ev.action} — {ev.result_summary}".strip(" —"),
            "type": "decision" if ev.agent == "decision" else ("alert" if "LOW" in ev.action.upper() or "ESCALATE" in ev.next_action.upper() else "info"),
            "confidence": int(ev.confidence * 100) if ev.confidence is not None and ev.confidence <= 1.0 else ev.confidence,
            "claimId": claim.claim_id,
        }
        for ev in events
    ]

    return {
        "claimId": claim.claim_id,
        "customer": {
            "name": claim.customer_name,
            "email": claim.customer_email,
            "phone": claim.customer_phone,
            "address": claim.customer_address,
        },
        "policyNumber": claim.policy_number,
        "policyCoverage": claim.policy_coverage,
        "policyStatus": claim.policy_status,
        "policyLimit": claim.policy_limit,
        "vehicleNumber": claim.vehicle_number,
        "vehicleModel": claim.vehicle_model,
        "accidentDate": claim.accident_date,
        "accidentLocation": claim.accident_location,
        "claimType": claim.claim_type,
        "incidentDescription": claim.incident_description,
        "claimedAmount": claim.claimed_amount,
        "estimatedAmount": claim.estimated_amount,
        "approvedAmount": claim.approved_amount,
        "deductible": claim.deductible,
        "fraudRisk": int(claim.fraud_risk * 100) if 0 < claim.fraud_risk <= 1.0 else int(claim.fraud_risk),
        "overallConfidence": int(claim.overall_confidence * 100) if 0 < claim.overall_confidence <= 1.0 else int(claim.overall_confidence),
        "currentAgent": claim.current_agent,
        "status": claim.status,
        "risk": claim.risk_level,
        "createdAt": claim.created_at.strftime("%Y-%m-%d %H:%M:%S") if claim.created_at else "2026-09-11 08:30:00",
        "updatedAt": claim.updated_at.strftime("%Y-%m-%d %H:%M:%S") if claim.updated_at else "2026-09-12 08:42:21",
        "agentResults": claim.agent_results_json or default_agent_results(),
        "documents": documents_list,
        "accidentPhotos": photos_list,
        "damageAssessment": damage_items,
        "fraudSignals": [],
        "estimationBreakdown": [],
        "settlement": claim.settlement_json,
        "orchestratorNotes": claim.orchestrator_notes_json,
        "humanReviewNotes": claim.human_review_json,
        "activityFeed": activity_feed,
    }


def seed_default_policies_and_claims(db: Session) -> None:
    """Seeds canonical policies and realistic test claims if none exist."""
    if db.query(Policy).count() == 0:
        policies = [
            Policy(
                policy_number="POL-983742",
                holder_name="Arun Kumar",
                vehicle_number="TN 45 AB 1234",
                vehicle_model="2023 Hyundai Creta SX (O)",
                coverage_type="Comprehensive Private Car Gold",
                status="Active",
                coverage_limit=500000.0,
                deductible=5000.0,
                valid_from="2025-03-16",
                valid_until="2027-03-15",
                clauses_json=[
                    {"clause_id": "CL-01", "title": "Collision & Accidental Damage", "covered": True, "text": "Covers direct accidental external impact damage to insured vehicle body, bumper, lamps, and panels."},
                    {"clause_id": "CL-02", "title": "Zero Depreciation Add-On", "covered": True, "text": "100% OEM replacement coverage on plastic, fiber, glass, and metal parts without depreciation deduction."},
                    {"clause_id": "CL-03", "title": "Compulsory Deductible", "covered": True, "text": "Mandatory deductible of INR 5,000 applies per claim incident."},
                ],
            ),
            Policy(
                policy_number="POL-610294",
                holder_name="Priya Sharma",
                vehicle_number="KA 03 MM 9941",
                vehicle_model="2024 BMW 3 Series 330i",
                coverage_type="Zero Depreciation Gold Plan",
                status="Active",
                coverage_limit=800000.0,
                deductible=10000.0,
                valid_from="2025-06-01",
                valid_until="2027-05-31",
                clauses_json=[
                    {"clause_id": "CL-10", "title": "High-Value Undercarriage Clause", "covered": True, "text": "Undercarriage and suspension damage requires physical surveyor verification if repair exceeds INR 50,000."},
                ],
            ),
            Policy(
                policy_number="POL-441820",
                holder_name="Vikram Nair",
                vehicle_number="KL 07 CD 7721",
                vehicle_model="2022 Maruti Suzuki Baleno Alpha",
                coverage_type="Standard Motor Comprehensive",
                status="Expired",
                coverage_limit=350000.0,
                deductible=3000.0,
                valid_from="2023-01-01",
                valid_until="2025-12-31",
                clauses_json=[
                    {"clause_id": "CL-20", "title": "Policy Lapse Exclusion", "covered": False, "text": "No liability attaches for accidents occurring after policy expiration date."},
                ],
            ),
        ]
        db.add_all(policies)
        db.commit()

    if db.query(Claim).count() == 0:
        seed_claims = [
            Claim(
                claim_id="CLM-2026-01842",
                customer_name="Arun Kumar",
                customer_email="arun.kumar@gmail.com",
                customer_phone="+91 98452 11984",
                customer_address="Plot 42, Anna Nagar, Chennai, Tamil Nadu",
                policy_number="POL-983742",
                policy_coverage="Comprehensive Private Car Gold",
                policy_status="Active",
                policy_limit=500000.0,
                vehicle_number="TN 45 AB 1234",
                vehicle_model="2023 Hyundai Creta SX (O)",
                accident_date="2026-09-10",
                accident_location="Mount Road Jn, Chennai",
                claim_type="Vehicle Collision",
                incident_description="Frontal collision at intersection due to sudden braking by vehicle ahead. Front bumper cracked and left headlamp shattered.",
                claimed_amount=48500.0,
                estimated_amount=48000.0,
                approved_amount=43000.0,
                deductible=5000.0,
                fraud_risk=0.12,
                overall_confidence=0.94,
                current_agent="decision",
                status="APPROVED",
                risk_level="Low",
                agent_results_json=default_agent_results(),
            ),
            Claim(
                claim_id="CLM-2026-01775",
                customer_name="Arun Kumar",
                customer_email="arun.kumar@gmail.com",
                customer_phone="+91 98452 11984",
                customer_address="Plot 42, Anna Nagar, Chennai, Tamil Nadu",
                policy_number="POL-983742",
                policy_coverage="Comprehensive Private Car Gold",
                policy_status="Active",
                policy_limit=500000.0,
                vehicle_number="TN 45 AB 1234",
                vehicle_model="2023 Hyundai Creta SX (O)",
                accident_date="2026-09-11",
                accident_location="OMR IT Expressway, Chennai",
                claim_type="Vehicle Collision",
                incident_description="Rear-quarter scrape in basement parking under dim lighting.",
                claimed_amount=32000.0,
                estimated_amount=29500.0,
                approved_amount=0.0,
                deductible=5000.0,
                fraud_risk=0.18,
                overall_confidence=0.39,
                current_agent="vision",
                status="AWAITING_CUSTOMER",
                risk_level="Low",
                agent_results_json=default_agent_results(),
            ),
            Claim(
                claim_id="CLM-2026-01903",
                customer_name="Priya Sharma",
                customer_email="priya.s91@outlook.com",
                customer_phone="+91 91234 56789",
                customer_address="Indiranagar 100ft Road, Bengaluru, Karnataka",
                policy_number="POL-610294",
                policy_coverage="Zero Depreciation Gold Plan",
                policy_status="Active",
                policy_limit=800000.0,
                vehicle_number="KA 03 MM 9941",
                vehicle_model="2024 BMW 3 Series 330i",
                accident_date="2026-09-08",
                accident_location="Outer Ring Road, Bellandur, Bengaluru",
                claim_type="Vehicle Collision",
                incident_description="High-speed undercarriage and front suspension impact after hitting a road divider at midnight.",
                claimed_amount=215000.0,
                estimated_amount=142000.0,
                approved_amount=0.0,
                deductible=10000.0,
                fraud_risk=0.87,
                overall_confidence=0.71,
                current_agent="decision",
                status="HUMAN_REVIEW",
                risk_level="High",
                agent_results_json=default_agent_results(),
            ),
        ]
        db.add_all(seed_claims)
        db.commit()
    else:
        # Ensure canonical initial states on startup for deterministic reproducibility
        canonical_states = {
            "CLM-2026-01842": "APPROVED",
            "CLM-2026-01775": "AWAITING_CUSTOMER",
            "CLM-2026-01903": "HUMAN_REVIEW",
        }
        for cid, st in canonical_states.items():
            c = db.query(Claim).filter(Claim.claim_id == cid).first()
            if c:
                c.status = st
        db.commit()
