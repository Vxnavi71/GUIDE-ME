from typing import List, Optional
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import CareerRecommendationResponse, CareerPreferencesCreate
from app.repositories import AssessmentRepository
from app.ml.career_engine import CareerPathwayEngine

router = APIRouter(prefix="/career", tags=["Career Guidance"])


@router.post("/recommendations", response_model=List[CareerRecommendationResponse])
async def get_career_recommendations_post(
    preferences: Optional[CareerPreferencesCreate] = Body(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await _get_recommendations(current_user, db, preferences)


@router.get("/recommendations", response_model=List[CareerRecommendationResponse])
async def get_career_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await _get_recommendations(current_user, db, None)


async def _get_recommendations(current_user: User, db: AsyncSession, preferences: Optional[CareerPreferencesCreate] = None):
    repo = AssessmentRepository(db)
    result = await repo.get_latest_result(current_user.id)

    if result:
        # Extract OCEAN scores
        ocean_scores = {
            "openness": result.openness * 100 if result.openness <= 1.0 else result.openness,
            "conscientiousness": result.conscientiousness * 100 if result.conscientiousness <= 1.0 else result.conscientiousness,
            "extraversion": result.extraversion * 100 if result.extraversion <= 1.0 else result.extraversion,
            "agreeableness": result.agreeableness * 100 if result.agreeableness <= 1.0 else result.agreeableness,
            "neuroticism": result.neuroticism * 100 if result.neuroticism <= 1.0 else result.neuroticism,
        }

        user_interests = preferences.interests if preferences else []
        user_skills = preferences.skills if preferences else []
        user_education = preferences.education if preferences else None
        user_goals = preferences.goals if preferences else []

        recs = CareerPathwayEngine.generate_recommendations(
            ocean_scores=ocean_scores,
            user_interests=user_interests,
            user_skills=user_skills,
            user_education=user_education,
            user_goals=user_goals
        )
        return [CareerRecommendationResponse(**rec) for rec in recs]
    else:
        return [
            CareerRecommendationResponse(
                path_title="Holistic Technology & Operations Strategist",
                match_score=84,
                alignment_reason="General alignment with foundational problem-solving and cross-disciplinary curiosity.",
                key_strengths=["Adaptability", "Practical Execution", "Curiosity"],
                growth_areas=["Complete Big Five Assessment to refine profile"],
                learning_roadmap=[
                    "Complete GUIDE ME Big Five Personality Inventory for personalized mapping",
                    "Identify top 3 intrinsic professional motivators",
                ]
            )
        ]

@router.post("/preferences")
async def update_career_preferences(
    preferences: CareerPreferencesCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    # For now, just return a success message. 
    # In a full implementation, we would save this to the database in a user_preferences table or user model.
    return {"status": "success", "message": "Career preferences updated successfully."}
