"""
Stage 13: Final Claim Assessment Report Generator (Section 16).
Strictly enforces that the Final Claim Assessment Report is generated ONLY when
the claim has reached a terminal state (APPROVED, REJECTED, HUMAN_REVIEW_COMPLETED, PAID).
Includes all 9 mandatory research & regulatory audit sections.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.agents.state_machine import is_terminal_state
from app.core.exceptions import ClaimXException
from app.db.models import (
    Claim,
    DocumentRecord,
    ImageRecord,
    FinalReportRecord,
    HumanReviewRecord,
)
from app.services.audit_service import AuditService


class FinalReportGenerator:
    """
    Constructs and persists the Section 16 Final Claim Assessment Report.
    Raises ClaimXException (HTTP 409) if invoked on any non-terminal claim state.
    """

    @staticmethod
    def generate_final_report(
        db: Session,
        claim_id: str,
        force_refresh: bool = True,
    ) -> Dict[str, Any]:
        claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
        if not claim:
            raise ClaimXException(
                message=f"Claim '{claim_id}' not found.",
                error_code="CLAIM_NOT_FOUND",
                status_code=404,
            )

        if not is_terminal_state(claim.status):
            raise ClaimXException(
                message=(
                    f"Final Claim Assessment Report cannot be generated while claim '{claim_id}' "
                    f"is in non-terminal state '{claim.status}'. Allowed terminal states: "
                    "APPROVED, REJECTED, HUMAN_REVIEW_COMPLETED, PAID."
                ),
                error_code="NON_TERMINAL_STATE_REPORT_BLOCKED",
                status_code=409,
            )

        existing = (
            db.query(FinalReportRecord)
            .filter(FinalReportRecord.claim_id == claim_id)
            .first()
        )
        if existing and not force_refresh:
            return existing.report_payload

        now_iso = datetime.now(timezone.utc).isoformat()
        docs = db.query(DocumentRecord).filter(DocumentRecord.claim_id == claim_id).all()
        images = db.query(ImageRecord).filter(ImageRecord.claim_id == claim_id).all()
        reviews = (
            db.query(HumanReviewRecord)
            .filter(HumanReviewRecord.claim_id == claim_id)
            .order_by(HumanReviewRecord.id.desc())
            .all()
        )
        audit_events = AuditService.get_claim_audit_trail(db, claim_id)

        agent_results: Dict[str, Any] = claim.agent_results_json or {}
        policy_res = agent_results.get("policy", {}).get("result", {})
        fraud_res = agent_results.get("fraud", {}).get("result", {})
        est_res = agent_results.get("estimation", {}).get("result", {})
        dec_res = agent_results.get("decision", {}).get("result", {})
        orch_notes = claim.orchestrator_notes_json or {}

        # Section 1: Claim Summary
        section_1_claim_summary = {
            "report_id": f"RPT-{claim.claim_id}",
            "claim_id": claim.claim_id,
            "terminal_state": claim.status,
            "generated_at": now_iso,
            "policyholder_name": claim.customer_name,
            "policyholder_email": claim.customer_email,
            "policy_number": claim.policy_number,
            "vehicle_number": claim.vehicle_number,
            "vehicle_model": claim.vehicle_model,
            "accident_date": claim.accident_date,
            "accident_location": claim.accident_location,
            "claim_type": claim.claim_type,
            "claimed_amount_inr": claim.claimed_amount,
            "estimated_amount_inr": claim.estimated_amount,
            "approved_payable_amount_inr": claim.approved_amount,
            "deductible_inr": claim.deductible,
            "overall_ai_confidence": round(float(claim.overall_confidence or 0.0), 4),
        }

        # Section 2: Submitted Evidence
        section_2_submitted_evidence = {
            "total_documents": len(docs),
            "total_images": len(images),
            "documents": [
                {
                    "doc_id": d.doc_id,
                    "name": d.name,
                    "doc_type": d.doc_type,
                    "status": d.status,
                    "ocr_confidence": d.ocr_confidence,
                    "extracted_fields": d.extracted_fields,
                }
                for d in docs
            ],
            "images": [
                {
                    "img_id": img.img_id,
                    "angle": img.angle,
                    "quality": img.quality,
                    "vision_confidence": img.vision_confidence,
                    "dhash": img.dhash,
                    "damage_detected": img.damage_detected,
                }
                for img in images
            ],
        }

        # Section 3: Agent-by-Agent Analysis
        section_3_agent_by_agent_analysis = []
        for agent_key, agent_payload in agent_results.items():
            if isinstance(agent_payload, dict):
                section_3_agent_by_agent_analysis.append(
                    {
                        "agent": agent_payload.get("agent", agent_key),
                        "status": agent_payload.get("status", "SUCCESS"),
                        "confidence": agent_payload.get("confidence", 0.0),
                        "recommended_action": agent_payload.get("recommended_action", "CONTINUE"),
                        "issues": agent_payload.get("issues", []),
                        "evidence_used": agent_payload.get("evidence", []),
                        "summary": (
                            agent_payload.get("result", {}).get("summary")
                            or agent_payload.get("result", {}).get("explanation")
                            or f"Completed {agent_key} evaluation."
                        ),
                    }
                )

        # Section 4: Confidence & Recovery History
        recovery_events = [
            ev
            for ev in audit_events
            if ev["action"]
            in (
                "REQUEST_EVIDENCE",
                "REPROCESS",
                "PAUSE_FOR_EVIDENCE",
                "RETRY",
                "ALTERNATIVE_PROCESSING_FALLBACK",
                "ESCALATE",
            )
        ]
        section_4_confidence_and_recovery_history = {
            "overall_confidence": round(float(claim.overall_confidence or 0.0), 4),
            "recovery_invocations_count": len(recovery_events),
            "orchestrator_recovery_notes": orch_notes.get("recovery_history", []),
            "recovery_audit_events": recovery_events,
        }

        # Section 5: Policy Coverage Analysis
        section_5_policy_coverage_analysis = {
            "policy_number": claim.policy_number,
            "policy_status": claim.policy_status,
            "coverage_type": claim.policy_coverage,
            "coverage_limit_inr": claim.policy_limit,
            "deductible_inr": claim.deductible,
            "deterministic_eligibility": policy_res.get("deterministic_checks", {
                "is_active": claim.policy_status == "Active",
                "within_coverage_limit": claim.claimed_amount <= claim.policy_limit,
            }),
            "retrieved_policy_clauses": policy_res.get("retrieved_clauses", []),
        }

        # Section 6: Fraud Risk Analysis
        section_6_fraud_risk_analysis = {
            "fraud_risk_score": round(float(claim.fraud_risk or 0.0), 4),
            "risk_band": claim.risk_level,
            "contributing_signals": fraud_res.get("contributing_signals", []),
            "selected_model": fraud_res.get(
                "selected_model", "HistGradientBoosting_Calibrated_Ensemble"
            ),
            "recommendation": agent_results.get("fraud", {}).get(
                "recommended_action", "CONTINUE"
            ),
        }

        # Section 7: Repair Cost Estimation
        section_7_repair_cost_estimation = {
            "claimed_amount_inr": claim.claimed_amount,
            "ai_estimated_repair_cost_inr": claim.estimated_amount,
            "policy_deductible_inr": claim.deductible,
            "net_payable_amount_inr": claim.approved_amount,
            "itemized_breakdown": est_res.get("itemized_breakdown", []),
            "invoice_deviation_ratio": est_res.get("invoice_deviation_ratio", 0.0),
        }

        # Section 8: Final Decision Analysis
        human_review_summary: Optional[Dict[str, Any]] = None
        if reviews:
            latest = reviews[0]
            human_review_summary = {
                "reviewer_name": latest.reviewer_name,
                "decision": latest.decision,
                "notes": latest.notes,
                "override_amount_inr": latest.override_amount,
                "reviewed_at": latest.created_at.isoformat() if latest.created_at else now_iso,
            }
        elif claim.human_review_json:
            human_review_summary = claim.human_review_json

        section_8_final_decision_analysis = {
            "final_terminal_status": claim.status,
            "ai_recommendation": dec_res.get("final_recommendation", claim.status),
            "satisfied_conditions": dec_res.get("satisfied_conditions", []),
            "unsatisfied_conditions": dec_res.get("unsatisfied_conditions", []),
            "unresolved_issues": dec_res.get("unresolved_issues", []),
            "decision_explanation": dec_res.get(
                "explanation",
                f"Claim reached terminal state '{claim.status}' with approved amount INR {claim.approved_amount:,.2f}.",
            ),
            "human_specialist_adjudication": human_review_summary,
            "settlement_details": claim.settlement_json,
        }

        # Section 9: Complete Audit Timeline
        section_9_complete_audit_timeline = audit_events

        report_payload = {
            "report_id": f"RPT-{claim.claim_id}",
            "claim_id": claim.claim_id,
            "terminal_state": claim.status,
            "generated_at": now_iso,
            "section_1_claim_summary": section_1_claim_summary,
            "section_2_submitted_evidence": section_2_submitted_evidence,
            "section_3_agent_by_agent_analysis": section_3_agent_by_agent_analysis,
            "section_4_confidence_and_recovery_history": section_4_confidence_and_recovery_history,
            "section_5_policy_coverage_analysis": section_5_policy_coverage_analysis,
            "section_6_fraud_risk_analysis": section_6_fraud_risk_analysis,
            "section_7_repair_cost_estimation": section_7_repair_cost_estimation,
            "section_8_final_decision_analysis": section_8_final_decision_analysis,
            "section_9_complete_audit_timeline": section_9_complete_audit_timeline,
        }

        if existing:
            existing.terminal_state = claim.status
            existing.report_payload = report_payload
            existing.generated_at = datetime.now(timezone.utc)
        else:
            new_rep = FinalReportRecord(
                claim_id=claim_id,
                terminal_state=claim.status,
                report_payload=report_payload,
            )
            db.add(new_rep)

        AuditService.record_event(
            db=db,
            claim_id=claim_id,
            agent="Final Report Generator",
            action="FINAL_REPORT_GENERATED",
            result_summary=f"Generated Section 16 Final Claim Assessment Report in terminal state '{claim.status}'.",
            confidence=claim.overall_confidence,
            reason=f"Terminal state '{claim.status}' verified",
            next_action="Archive immutable assessment dossier",
            commit=True,
        )

        return report_payload
