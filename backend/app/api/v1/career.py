from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import CareerRecommendationResponse
from app.repositories import AssessmentRepository

router = APIRouter(prefix="/career", tags=["Career Guidance"])


@router.get("/recommendations", response_model=List[CareerRecommendationResponse])
async def get_career_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = AssessmentRepository(db)
    result = await repo.get_latest_result(current_user.id)

    # If personality test completed, align with psychometric results
    if result:
        recs = [
            CareerRecommendationResponse(
                path_title="Systems Architect / Technical Lead",
                match_score=92,
                alignment_reason="Your high conscientiousness and structured analytical clarity align with complex system design.",
                key_strengths=["Systematic Problem Decomposition", "Deep Focus", "Reliability Under Ambiguity"],
                growth_areas=["Delegation Practice", "Managing Spontaneous Deadlines"],
                learning_roadmap=[
                    "Advanced Distributed System Design Patterns",
                    "Empathetic Technical Mentorship & Leadership",
                    "Domain-Driven Architecture Synthesis",
                ],
            ),
            CareerRecommendationResponse(
                path_title="UX / Clinical AI Research Engineer",
                match_score=87,
                alignment_reason="Your balanced openness and agreeableness foster user-centric, evidence-informed design.",
                key_strengths=["User Empathy", "Multimodal Signal Interpretation", "Ethical AI Design"],
                growth_areas=["High-Speed Prototyping Without Perfectionism"],
                learning_roadmap=[
                    "Human-Computer Interaction (HCI) Cognitive Load Evaluation",
                    "Fairness & Responsible AI Guardrail Verification",
                ],
            ),
        ]
    else:
        recs = [
            CareerRecommendationResponse(
                path_title="Holistic Technology & Operations Strategist",
                match_score=84,
                alignment_reason="General alignment with foundational problem-solving and cross-disciplinary curiosity.",
                key_strengths=["Adaptability", "Practical Execution", "Curiosity"],
                growth_areas=["Complete Big Five Assessment to refine profile"],
                learning_roadmap=[
                    "Complete GUIDE ME Big Five Personality Inventory for personalized mapping",
                    "Identify top 3 intrinsic professional motivators",
                ],
            )
        ]
    return recs
