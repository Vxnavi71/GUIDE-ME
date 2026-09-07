from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User, DigitalWellbeingMetric
from app.schemas.schemas import (
    WellnessMetricCreate,
    WellnessMetricResponse,
    SleepSummaryResponse,
    DigitalWellbeingResponse,
    DigitalWellbeingUpdate,
    DigitalWellbeingDayTrend,
    DashboardSummaryResponse,
    DashboardTrendPoint,
)
from app.repositories import (
    WellnessRepository,
    AuditRepository,
    MoodStressRepository,
    HabitRepository,
    GoalRepository,
)
from app.integrations import get_wearable_provider

router = APIRouter(prefix="/wellness", tags=["Wellness, Wearables & Digital Wellbeing"])


@router.get("/metrics", response_model=List[WellnessMetricResponse])
async def get_wellness_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = WellnessRepository(db)
    metrics = await repo.list_recent_metrics(current_user.id)
    return metrics


@router.post("/metrics", response_model=WellnessMetricResponse)
async def log_wellness_metric(
    payload: WellnessMetricCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = WellnessRepository(db)
    metric = await repo.log_metric(current_user.id, payload.model_dump())
    return metric


@router.post("/sync-wearables", response_model=WellnessMetricResponse)
async def sync_wearable_device(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    provider = get_wearable_provider("mock")
    data = await provider.fetch_latest_metrics(current_user.id)

    repo = WellnessRepository(db)
    metric = await repo.log_metric(current_user.id, data)
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "SYNC_WEARABLE", "wearables", details={"device": data.get("device_name")})
    return metric


@router.get("/sleep/summary", response_model=SleepSummaryResponse)
async def get_sleep_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = WellnessRepository(db)
    today = datetime.now(timezone.utc)
    today_str = today.strftime("%Y-%m-%d")

    metrics = await repo.list_recent_metrics(current_user.id, limit=7)
    if not metrics:
        return SleepSummaryResponse(
            metric_date=None,
            sleep_hours=None,
            target_sleep_hours=8.0,
            sleep_quality_score=None,
            consistency_percentage=None,
            stages={},
            trend_7d=[],
            stress_correlation_note="No sleep data logged yet. Connect a wearable device or log your sleep to receive recovery insights.",
        )

    today_metric = next((m for m in metrics if m.metric_date == today_str), None)
    if not today_metric and metrics:
        today_metric = metrics[0]

    # Calculate 7-day trend from real records only
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    records_by_date = {m.metric_date: m for m in metrics}
    trend_7d = []
    total_qual = 0
    valid_count = 0

    for i in range(6, -1, -1):
        day_date = today - timedelta(days=i)
        d_str = day_date.strftime("%Y-%m-%d")
        d_name = days[day_date.weekday()]

        if d_str in records_by_date:
            rec = records_by_date[d_str]
            sh = rec.sleep_hours
            sq = rec.sleep_quality_score
            if sq is not None:
                total_qual += sq
                valid_count += 1
            trend_7d.append({
                "date": d_str,
                "day_name": d_name,
                "sleep_hours": sh,
                "sleep_quality_score": sq,
                "target_met": (sh is not None and sh >= 7.0),
            })
        else:
            trend_7d.append({
                "date": d_str,
                "day_name": d_name,
                "sleep_hours": None,
                "sleep_quality_score": None,
                "target_met": False,
            })

    avg_qual = total_qual / valid_count if valid_count else None
    consistency = int(min(100, max(0, avg_qual))) if avg_qual is not None else None
    stages = today_metric.sleep_stages or {}

    if today_metric.sleep_hours is not None:
        if today_metric.sleep_hours < 6.5:
            stress_note = f"Sleep duration was {today_metric.sleep_hours}h. Sub-6.5h sleep increases autonomic stress sensitivity by ~25%."
        else:
            stress_note = f"Restorative duration achieved ({today_metric.sleep_hours}h). Quality sleep actively buffers against stress spikes."
    else:
        stress_note = "Sleep duration unrecorded."

    return SleepSummaryResponse(
        metric_date=today_metric.metric_date,
        sleep_hours=today_metric.sleep_hours,
        target_sleep_hours=8.0,
        sleep_quality_score=today_metric.sleep_quality_score,
        consistency_percentage=consistency,
        stages=stages,
        trend_7d=trend_7d,
        stress_correlation_note=stress_note,
    )


@router.get("/digital-wellbeing", response_model=DigitalWellbeingResponse)
async def get_digital_wellbeing(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = WellnessRepository(db)
    today = datetime.now(timezone.utc)
    today_str = today.strftime("%Y-%m-%d")

    recent_records = await repo.list_recent_digital_wellbeing(current_user.id, limit=7)
    today_metric = await repo.get_digital_wellbeing(current_user.id, today_str)

    if not today_metric and not recent_records:
        return DigitalWellbeingResponse(
            id=None,
            metric_date=None,
            total_screen_time_minutes=None,
            focus_time_minutes=None,
            notification_count=None,
            night_screen_minutes=None,
            pickup_count=None,
            target_limit_minutes=300,
            categories={},
            provider_mode="not_connected",
            weekly_trends=[],
        )

    metric = today_metric or recent_records[0]
    records_by_date = {r.metric_date: r for r in recent_records}

    weekly_trends: List[DigitalWellbeingDayTrend] = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    for i in range(6, -1, -1):
        day_date = today - timedelta(days=i)
        d_str = day_date.strftime("%Y-%m-%d")
        day_name = days[day_date.weekday()]

        if d_str in records_by_date:
            rec = records_by_date[d_str]
            st = rec.total_screen_time_minutes or 0
            ft = rec.focus_time_minutes or 0
            target = rec.target_limit_minutes or 300
            weekly_trends.append(
                DigitalWellbeingDayTrend(
                    date=d_str,
                    day_name=day_name,
                    total_screen_time_minutes=st,
                    focus_time_minutes=ft,
                    is_target_met=(st <= target),
                )
            )

    return DigitalWellbeingResponse(
        id=metric.id,
        metric_date=metric.metric_date,
        total_screen_time_minutes=metric.total_screen_time_minutes,
        focus_time_minutes=metric.focus_time_minutes,
        notification_count=metric.notification_count,
        night_screen_minutes=metric.night_screen_minutes,
        pickup_count=metric.pickup_count,
        target_limit_minutes=metric.target_limit_minutes or 300,
        categories=metric.categories or {},
        provider_mode="connected",
        weekly_trends=weekly_trends,
    )


@router.post("/digital-wellbeing", response_model=DigitalWellbeingResponse)
async def update_digital_wellbeing(
    payload: DigitalWellbeingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = WellnessRepository(db)
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data = payload.model_dump(exclude_unset=True)
    data["metric_date"] = today_str

    metric = await repo.log_digital_wellbeing(current_user.id, data)
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "UPDATE_DIGITAL_WELLBEING", "digital_wellbeing")
    return await get_digital_wellbeing(current_user=current_user, db=db)


@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    wellness_repo = WellnessRepository(db)
    mood_repo = MoodStressRepository(db)
    habit_repo = HabitRepository(db)
    goal_repo = GoalRepository(db)

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    # 1. User Name
    user_name = "Friend"
    if getattr(current_user, "profile", None):
        user_name = current_user.profile.preferred_name or current_user.profile.full_name or "Friend"
    elif getattr(current_user, "email", None):
        user_name = current_user.email.split("@")[0]

    # 2. Mood
    recent_moods = await mood_repo.list_moods(current_user.id, limit=7)
    if recent_moods:
        latest_mood = recent_moods[0].score
        if latest_mood >= 7.0:
            mood_label = "Optimal emotional valence"
        elif latest_mood >= 5.0:
            mood_label = "Balanced emotional state"
        else:
            mood_label = "Attentive recovery needed"
    else:
        latest_mood = None
        mood_label = "No mood logged yet"

    # 3. Stress
    latest_stress = await mood_repo.get_latest_stress(current_user.id)
    if latest_stress and latest_stress.score is not None:
        stress_score = latest_stress.score
        stress_deviation = latest_stress.deviation_from_baseline
        stress_risk_band = latest_stress.risk_band
    else:
        stress_score = None
        stress_deviation = None
        stress_risk_band = None

    # 4. Sleep & Wearables
    recent_wellness = await wellness_repo.list_recent_metrics(current_user.id, limit=7)
    today_wellness = next((m for m in recent_wellness if m.metric_date == today_str), None)
    if not today_wellness and recent_wellness:
        today_wellness = recent_wellness[0]

    sleep_hours = today_wellness.sleep_hours if today_wellness else None
    hrv_ms = int(today_wellness.hrv_ms) if today_wellness and today_wellness.hrv_ms is not None else None
    resting_hr = int(today_wellness.resting_heart_rate) if today_wellness and today_wellness.resting_heart_rate is not None else None

    # 5. Digital Wellbeing
    dw_metric = await wellness_repo.get_digital_wellbeing(current_user.id, today_str)
    if not dw_metric:
        recent_dw = await wellness_repo.list_recent_digital_wellbeing(current_user.id, limit=1)
        dw_metric = recent_dw[0] if recent_dw else None

    screen_time_hours = round(dw_metric.total_screen_time_minutes / 60.0, 1) if dw_metric and dw_metric.total_screen_time_minutes is not None else None
    screen_time_target_hours = round(dw_metric.target_limit_minutes / 60.0, 1) if dw_metric and dw_metric.target_limit_minutes is not None else 5.0
    focus_time_hours = round(dw_metric.focus_time_minutes / 60.0, 1) if dw_metric and dw_metric.focus_time_minutes is not None else None
    pickup_count = dw_metric.pickup_count if dw_metric and dw_metric.pickup_count is not None else None

    # 6. Habits & Goals
    habits = await habit_repo.list_by_user(current_user.id)
    habits_total = len(habits)
    habits_completed = sum(1 for h in habits if h.get("completed_today"))
    habit_rate = round((habits_completed / habits_total) * 100.0, 1) if habits_total > 0 else 0.0

    goals = await goal_repo.list_by_user(current_user.id)
    active_goals_count = sum(1 for g in goals if g.status == "in_progress")

    # 7. 7-Day Trend Chart - Real points with null for unrecorded days
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    mood_by_date = {m.recorded_at.strftime("%Y-%m-%d"): m.score for m in recent_moods}
    stress_obs = await mood_repo.list_recent_stress_observations(current_user.id, limit=7)
    stress_by_date = {s.recorded_at.strftime("%Y-%m-%d"): s.score for s in stress_obs if s.score is not None}

    trends_7d: List[DashboardTrendPoint] = []
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        d_str = day_date.strftime("%Y-%m-%d")
        d_name = days[day_date.weekday()]

        m_val = round(mood_by_date[d_str], 1) if d_str in mood_by_date else None
        s_val = round(stress_by_date[d_str], 1) if d_str in stress_by_date else None

        trends_7d.append(
            DashboardTrendPoint(
                day=d_name,
                date=d_str,
                mood=m_val,
                stress=s_val,
            )
        )

    baseline_calibrated = bool(latest_stress and latest_stress.score is not None and len(recent_moods) >= 3)
    wearable_mode = "connected" if today_wellness else "not_connected"
    screen_mode = "connected" if dw_metric else "not_connected"

    return DashboardSummaryResponse(
        user_name=user_name,
        baseline_calibrated=baseline_calibrated,
        stress_deviation=stress_deviation,
        latest_mood=latest_mood,
        mood_label=mood_label,
        stress_score=stress_score,
        stress_risk_band=stress_risk_band,
        sleep_hours=sleep_hours,
        sleep_target=8.0,
        hrv_ms=hrv_ms,
        resting_hr=resting_hr,
        screen_time_hours=screen_time_hours,
        screen_time_target_hours=screen_time_target_hours,
        focus_time_hours=focus_time_hours,
        pickup_count=pickup_count,
        habits_completed_today=habits_completed,
        habits_total_today=habits_total,
        habit_completion_rate=habit_rate,
        active_goals_count=active_goals_count,
        trends_7d=trends_7d,
        wearable_provider_mode=wearable_mode,
        screen_provider_mode=screen_mode,
    )

