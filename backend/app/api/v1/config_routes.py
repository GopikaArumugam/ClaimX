from fastapi import APIRouter, Depends
from app.core.config import settings
from app.core.security import get_current_user, require_roles
from app.db.models import User, RoleEnum
from app.schemas.common import ThresholdConfigResponse, ThresholdConfigUpdate
from app.core.logging_config import logger

router = APIRouter(prefix="/config", tags=["Configuration & Guardrails"])


@router.get("/thresholds", response_model=ThresholdConfigResponse)
def get_thresholds(_current_user: User = Depends(get_current_user)) -> ThresholdConfigResponse:
    return ThresholdConfigResponse(thresholds=settings.get_thresholds_dict())


@router.put(
    "/thresholds",
    response_model=ThresholdConfigResponse,
)
def update_thresholds(
    payload: ThresholdConfigUpdate,
    current_user: User = Depends(require_roles([RoleEnum.CLAIM_HANDLER, RoleEnum.ADMIN])),
) -> ThresholdConfigResponse:
    updates = payload.model_dump(exclude_none=True)
    updated = settings.update_thresholds(updates)
    logger.info(f"Thresholds updated by {current_user.email} ({current_user.role.value}): {updates}")
    return ThresholdConfigResponse(thresholds=updated)
