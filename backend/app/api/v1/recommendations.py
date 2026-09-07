from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import RecommendationResponse
from datetime import datetime, timezone
from app.repositories import AssessmentRepository, GoalRepository, MoodStressRepository, WellnessRepository
from app.ml.recommendation_engine import RecommendationEngine

router = APIRouter(prefix="/recommendations", tags=["Recommendation Engine"])


@router.get("", response_model=List[RecommendationResponse])
async def get_active_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    assess_repo = AssessmentRepository(db)
    goal_repo = GoalRepository(db)
    mood_repo = MoodStressRepository(db)
    wellness_repo = WellnessRepository(db)

    personality = await assess_repo.get_latest_result(current_user.id)
    goals = await goal_repo.list_by_user(current_user.id)
    active_goals = [g for g in goals if g.status == "in_progress"]

    latest_stress = await mood_repo.get_latest_stress(current_user.id)
    stress_risk_band = latest_stress.risk_band if latest_stress else "low"

    recent_wellness = await wellness_repo.list_recent_metrics(current_user.id, limit=1)
    sleep_hours = recent_wellness[0].sleep_hours if recent_wellness else 7.4

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dw_metric = await wellness_repo.get_digital_wellbeing(current_user.id, today_str)
    screen_time_minutes = dw_metric.total_screen_time_minutes if dw_metric else 240

    raw_recs = RecommendationEngine.generate_recommendations(
        stress_risk_band=stress_risk_band,
        sleep_hours=sleep_hours,
        screen_time_minutes=screen_time_minutes,
        dominant_traits=personality.dominant_traits if personality else None,
        active_goal_count=len(active_goals),
    )

    now = datetime.now(timezone.utc)
    return [
        RecommendationResponse(
            id=f"rec-{i+1}",
            category=r["category"],
            title=r["title"],
            description=r["description"],
            reason=r["reason"],
            priority=r["priority"],
            confidence=r["confidence"],
            action_url=r["action_url"],
            is_dismissed=False,
            created_at=now,
        )
        for i, r in enumerate(raw_recs)
    ]
