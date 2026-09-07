from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import (
    MoodCreate,
    MoodResponse,
    StressObservationResponse,
    DistressEventCreate,
    DistressEventResponse,
)
from app.repositories import MoodStressRepository, WellnessRepository, JournalRepository, AuditRepository
from app.ml.stress_distress_engine import StressDistressEngine

router = APIRouter(tags=["Mood & Stress Monitoring"])


@router.post("/moods", response_model=MoodResponse, status_code=status.HTTP_201_CREATED)
async def log_mood(
    payload: MoodCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = MoodStressRepository(db)
    entry = await repo.log_mood(
        user_id=current_user.id,
        score=payload.score,
        valence=payload.valence,
        arousal=payload.arousal,
        energy_level=payload.energy_level,
        tags=payload.tags,
        note=payload.note,
    )
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "LOG_MOOD", "mood_entries", details={"score": payload.score})
    return entry


@router.get("/moods", response_model=List[MoodResponse])
async def list_moods(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = MoodStressRepository(db)
    return await repo.list_moods(current_user.id)


@router.post("/stress/evaluate", response_model=StressObservationResponse)
async def evaluate_current_stress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    mood_repo = MoodStressRepository(db)
    wellness_repo = WellnessRepository(db)
    journal_repo = JournalRepository(db)

    # 1. Fetch user's latest mood entries
    recent_moods = await mood_repo.list_moods(current_user.id, limit=3)
    latest_mood = recent_moods[0].score if recent_moods else None

    # 2. Fetch user's latest wellness metrics (sleep, hrv)
    recent_wellness = await wellness_repo.list_recent_metrics(current_user.id, limit=3)
    latest_hrv = recent_wellness[0].hrv_ms if recent_wellness else None
    latest_sleep = recent_wellness[0].sleep_hours if recent_wellness else None

    # 3. Fetch user's latest digital wellbeing screen time
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    digital_metric = await wellness_repo.get_digital_wellbeing(current_user.id, today_str)
    latest_screen_time = digital_metric.total_screen_time_minutes if digital_metric else None

    # 4. Fetch user's latest journal sentiment
    recent_journals = await journal_repo.list_by_user(current_user.id, limit=3)
    latest_sentiment = None
    if recent_journals and recent_journals[0].analysis:
        latest_sentiment = recent_journals[0].analysis.sentiment_score

    # 5. Fetch rolling historical stress scores
    history_stress = await mood_repo.get_recent_stress_scores(current_user.id, limit=14)

    eval_result = StressDistressEngine.evaluate_stress(
        self_report_mood=latest_mood,
        hrv_ms=latest_hrv,
        sleep_hours=latest_sleep,
        screen_time_minutes=latest_screen_time,
        sentiment_score=latest_sentiment,
        historical_stress_scores=history_stress,
    )

    source_val = "uncalibrated" if eval_result.get("insufficient_data") else "multimodal"
    obs = await mood_repo.log_stress(
        user_id=current_user.id,
        score=eval_result["score"],
        confidence=eval_result["confidence"],
        risk_band=eval_result["risk_band"],
        evidence=eval_result["evidence"],
        source=source_val,
        deviation_from_baseline=eval_result["deviation_from_baseline"],
    )
    return obs


@router.get("/stress/latest", response_model=Optional[StressObservationResponse])
async def get_latest_stress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = MoodStressRepository(db)
    return await repo.get_latest_stress(current_user.id)


@router.get("/stress/history", response_model=List[StressObservationResponse])
async def get_stress_history(
    limit: int = 14,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = MoodStressRepository(db)
    return await repo.list_recent_stress_observations(current_user.id, limit=limit)



@router.post("/distress/report", response_model=DistressEventResponse, status_code=status.HTTP_201_CREATED)
async def report_distress(
    payload: DistressEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = MoodStressRepository(db)
    support = [
        "Tele-MANAS (Govt of India 24/7): Call 14416 or 1800-891-4416",
        "KIRAN Mental Health Helpline: Call 1800-599-0019 (24/7)",
        "Vandrevala Foundation Helpline: Call +91 9999 666 555",
        "National Emergency Services: Call 112",
        "AASRA Crisis Line: Call +91 98204 66726",
        "NIMHANS Helpline: Call 080-46110007",
    ]
    event = await repo.log_distress(
        user_id=current_user.id,
        risk_level=payload.risk_level,
        triggers=payload.triggers,
        symptoms=payload.symptoms,
        support_recommended=support,
    )
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "REPORT_DISTRESS", "distress_events", details={"risk_level": payload.risk_level})
    return event
