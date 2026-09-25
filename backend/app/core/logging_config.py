import logging
import sys
from datetime import datetime, timezone
import json


class StructuredResearchFormatter(logging.Formatter):
    """
    Formats log records with ISO-8601 UTC timestamps, module context,
    and structured metadata for auditability and experiment tracking.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }
        if hasattr(record, "claim_id"):
            log_payload["claim_id"] = getattr(record, "claim_id")
        if hasattr(record, "agent"):
            log_payload["agent"] = getattr(record, "agent")
        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_payload)


def setup_logging(level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger("claimx")
    logger.setLevel(level)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        handler.setFormatter(StructuredResearchFormatter())
        logger.addHandler(handler)
    return logger


logger = setup_logging()
