from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import (
    GoalCreate,
    GoalResponse,
    GoalUpdate,
    HabitCreate,
    HabitUpdate,
    HabitResponse,
)
from app.repositories import GoalRepository, HabitRepository, AuditRepository

router = APIRouter(tags=["Goals & Habits"])


# =====================================================================
# Goals Endpoints
# =====================================================================
@router.get("/goals", response_model=List[GoalResponse])
async def list_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = GoalRepository(db)
    goals = await repo.list_by_user(current_user.id)
    return goals


@router.post("/goals", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    payload: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = GoalRepository(db)
    goal = await repo.create(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        target_date=payload.target_date,
        milestones=payload.milestones,
    )
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "CREATE_GOAL", "goals", details={"title": goal.title})
    return goal


@router.put("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    payload: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = GoalRepository(db)
    goal = await repo.update(goal_id, current_user.id, payload.model_dump(exclude_unset=True))
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found or unauthorized.")
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "UPDATE_GOAL", "goals", details={"goal_id": goal_id})
    return goal


@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = GoalRepository(db)
    success = await repo.delete(goal_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found or unauthorized.")
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "DELETE_GOAL", "goals", details={"goal_id": goal_id})
    return {"message": "Goal deleted successfully", "id": goal_id}


@router.post("/goals/milestones/{milestone_id}/toggle", response_model=GoalResponse)
async def toggle_milestone(
    milestone_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = GoalRepository(db)
    goal = await repo.toggle_milestone(milestone_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Milestone not found or unauthorized.")
    return goal


# =====================================================================
# Habits Endpoints
# =====================================================================
@router.get("/habits", response_model=List[HabitResponse])
async def list_habits(
    date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = HabitRepository(db)
    habits = await repo.list_by_user(current_user.id, today_str=date)
    return habits


@router.post("/habits", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    payload: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = HabitRepository(db)
    habit = await repo.create(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        target_frequency=payload.target_frequency,
        target_per_day=payload.target_per_day,
    )
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "CREATE_HABIT", "habits", details={"title": habit.title})
    return {
        "id": habit.id,
        "title": habit.title,
        "description": habit.description,
        "category": habit.category,
        "target_frequency": habit.target_frequency,
        "target_per_day": habit.target_per_day,
        "streak_count": habit.streak_count,
        "best_streak": habit.best_streak,
        "is_archived": habit.is_archived,
        "created_at": habit.created_at,
        "updated_at": habit.updated_at,
        "completed_today": False,
        "today_count": 0,
    }


@router.put("/habits/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: str,
    payload: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = HabitRepository(db)
    habit = await repo.update(habit_id, current_user.id, payload.model_dump(exclude_unset=True))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found or unauthorized.")
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "UPDATE_HABIT", "habits", details={"habit_id": habit_id})
    return {
        "id": habit.id,
        "title": habit.title,
        "description": habit.description,
        "category": habit.category,
        "target_frequency": habit.target_frequency,
        "target_per_day": habit.target_per_day,
        "streak_count": habit.streak_count,
        "best_streak": habit.best_streak,
        "is_archived": habit.is_archived,
        "created_at": habit.created_at,
        "updated_at": habit.updated_at,
        "completed_today": False,
        "today_count": 0,
    }


@router.delete("/habits/{habit_id}")
async def delete_habit(
    habit_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = HabitRepository(db)
    success = await repo.delete(habit_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Habit not found or unauthorized.")
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "DELETE_HABIT", "habits", details={"habit_id": habit_id})
    return {"message": "Habit deleted successfully", "id": habit_id}


@router.post("/habits/{habit_id}/toggle", response_model=HabitResponse)
async def toggle_habit(
    habit_id: str,
    date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = HabitRepository(db)
    result = await repo.toggle_completion(habit_id, current_user.id, date_str=date)
    if not result:
        raise HTTPException(status_code=404, detail="Habit not found or unauthorized.")
    return result
