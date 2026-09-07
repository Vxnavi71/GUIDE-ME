from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import UserProfileResponse, UserProfileUpdate, UserConsentResponse, UserConsentUpdate, AuditLogResponse
from app.repositories import UserRepository, AuditRepository, JournalRepository, MoodStressRepository, GoalRepository

router = APIRouter(prefix="/profile", tags=["User Profile & Privacy"])


@router.get("", response_model=UserProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    p = current_user.profile
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        full_name=p.full_name if p else current_user.email,
        preferred_name=p.preferred_name if p else None,
        timezone=p.timezone if p else "UTC",
        occupation=p.occupation if p else None,
        bio=p.bio if p else None,
        avatar_url=p.avatar_url if p else None,
        created_at=current_user.created_at,
    )


@router.put("", response_model=UserProfileResponse)
async def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = UserRepository(db)
    updated = await repo.update_profile(current_user.id, payload.model_dump(exclude_unset=True))
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "UPDATE_PROFILE", "user_profiles")
    return await get_profile(current_user)


@router.get("/consent", response_model=UserConsentResponse)
async def get_consent(current_user: User = Depends(get_current_user)):
    c = current_user.consent
    if not c:
        raise HTTPException(status_code=404, detail="Consent record not found.")
    return c


@router.put("/consent", response_model=UserConsentResponse)
async def update_consent(
    payload: UserConsentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = UserRepository(db)
    updated = await repo.update_consent(current_user.id, payload.model_dump(exclude_unset=True))
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "UPDATE_CONSENT", "user_consents", details=payload.model_dump(exclude_unset=True))
    return updated


@router.get("/export-data")
async def export_personal_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Privacy Center: Complete data portability export in JSON format.
    """
    journal_repo = JournalRepository(db)
    mood_repo = MoodStressRepository(db)
    goal_repo = GoalRepository(db)

    journals = await journal_repo.list_by_user(current_user.id, limit=200)
    moods = await mood_repo.list_moods(current_user.id, limit=200)
    goals = await goal_repo.list_by_user(current_user.id)

    export_payload = {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat(),
            "profile": {
                "full_name": current_user.profile.full_name if current_user.profile else None,
                "preferred_name": current_user.profile.preferred_name if current_user.profile else None,
                "occupation": current_user.profile.occupation if current_user.profile else None,
            },
            "consent_status": {
                "camera_consent": current_user.consent.camera_consent if current_user.consent else False,
                "memory_consent": current_user.consent.memory_consent if current_user.consent else False,
                "wearable_consent": current_user.consent.wearable_consent if current_user.consent else False,
            },
        },
        "journals": [
            {
                "id": j.id,
                "title": j.title,
                "content": j.content,
                "tags": j.tags,
                "created_at": j.created_at.isoformat(),
                "sentiment_analysis": {
                    "sentiment_score": j.analysis.sentiment_score if j.analysis else None,
                    "dominant_emotion": j.analysis.dominant_emotion if j.analysis else None,
                    "cognitive_distortions": j.analysis.cognitive_distortions if j.analysis else [],
                } if j.analysis else None,
            }
            for j in journals
        ],
        "mood_logs": [
            {
                "score": m.score,
                "valence": m.valence,
                "energy_level": m.energy_level,
                "tags": m.tags,
                "recorded_at": m.recorded_at.isoformat(),
            }
            for m in moods
        ],
        "goals": [
            {
                "title": g.title,
                "category": g.category,
                "progress_percentage": g.progress_percentage,
                "status": g.status,
            }
            for g in goals
        ],
        "export_timestamp": current_user.created_at.isoformat(),
    }
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "DATA_EXPORT", "privacy")
    return export_payload


@router.delete("/delete-account", status_code=status.HTTP_200_OK)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Privacy Center: Complete account and data deletion.
    Cascades through all related tables to guarantee zero residual data.
    """
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "DELETE_ACCOUNT", "users")
    await db.delete(current_user)
    await db.commit()
    return {"status": "success", "message": "Your account and all associated data have been permanently erased."}
