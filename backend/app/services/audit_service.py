"""
Stage 12: Structured Audit Trail & Provenance Engine (Section 17).
Records every claim submission, evidence upload, agent invocation, confidence score,
recovery action, human escalation, human decision, final claim decision, and report generation
into an immutable AuditEventRecord trail.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.db.models import AuditEventRecord


class AuditService:
    """
    Records and queries structured Section 17 audit events for regulatory & academic provenance.
    """

    @staticmethod
    def record_event(
        db: Session,
        claim_id: str,
        agent: str,
        action: str,
        result_summary: str,
        confidence: Optional[float] = None,
        evidence_refs: Optional[List[str]] = None,
        reason: str = "",
        next_action: str = "",
        commit: bool = True,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        ev_refs = evidence_refs or []

        record = AuditEventRecord(
            timestamp=now,
            claim_id=claim_id,
            agent=agent,
            action=action,
            evidence_refs=ev_refs,
            result_summary=result_summary,
            confidence=round(float(confidence), 4) if confidence is not None else None,
            reason=reason,
            next_action=next_action,
        )
        db.add(record)

        if commit:
            db.commit()
            db.refresh(record)

        return AuditService.serialize_event(record)

    @staticmethod
    def serialize_event(record: AuditEventRecord) -> Dict[str, Any]:
        ts = record.timestamp.isoformat() if record.timestamp else datetime.now(timezone.utc).isoformat()
        return {
            "id": record.id,
            "timestamp": ts,
            "claim_id": record.claim_id,
            "agent": record.agent,
            "action": record.action,
            "evidence_refs": record.evidence_refs or [],
            "result_summary": record.result_summary,
            "confidence": record.confidence,
            "reason": record.reason or "",
            "next_action": record.next_action or "",
        }

    @staticmethod
    def get_claim_audit_trail(db: Session, claim_id: str) -> List[Dict[str, Any]]:
        records = (
            db.query(AuditEventRecord)
            .filter(AuditEventRecord.claim_id == claim_id)
            .order_by(AuditEventRecord.id.asc())
            .all()
        )
        return [AuditService.serialize_event(r) for r in records]
