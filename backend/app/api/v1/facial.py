from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import FacialFramePayload, FacialAnalysisResponse
from app.ml.facial_engine import FacialAnalysisEngine
from app.repositories import AuditRepository

router = APIRouter(prefix="/facial-analysis", tags=["Camera & Facial Signal Analysis"])


@router.post("/process-frame", response_model=FacialAnalysisResponse)
async def process_facial_frame(
    payload: FacialFramePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Privacy-First Facial Signal Processor.
    Processes user's browser camera frame purely in volatile RAM.
    Does NOT write frames to disk or database.
    """
    # Privacy verification: user must have enabled camera consent in their privacy center
    consent = current_user.consent
    if consent and not consent.camera_consent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Camera consent not granted. Enable in Privacy Center."
        )

    analysis = FacialAnalysisEngine.analyze_frame_base64(payload.image_base64)
    return analysis
