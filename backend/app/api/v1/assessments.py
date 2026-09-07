from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import AssessmentQuestionSchema, AssessmentSubmission, PersonalityResultResponse
from app.repositories import AssessmentRepository
from app.services import AssessmentService
from app.ml.ocean_engine import OceanBigFiveEngine

router = APIRouter(prefix="/assessments", tags=["Personality & Assessments"])


@router.get("/ocean/questions", response_model=List[AssessmentQuestionSchema])
async def get_ocean_questions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = AssessmentRepository(db)
    assessment = await repo.get_default_assessment()
    if not assessment or not assessment.questions:
        # Fallback to in-memory question bank representation
        questions = []
        for i, q in enumerate(OceanBigFiveEngine.QUESTIONS_DATA):
            questions.append(
                AssessmentQuestionSchema(
                    id=f"q-{i+1}",
                    question_text=q["text"],
                    domain_trait=q["trait"],
                    reverse_scored=q["reverse"],
                    order_index=i + 1,
                )
            )
        return questions

    return [
        AssessmentQuestionSchema(
            id=q.id,
            question_text=q.question_text,
            domain_trait=q.domain_trait,
            reverse_scored=q.reverse_scored,
            order_index=q.order_index,
        )
        for q in assessment.questions
    ]


@router.post("/ocean/submit", response_model=PersonalityResultResponse)
async def submit_ocean_assessment(
    payload: AssessmentSubmission,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    service = AssessmentService(db)
    answers_dict = [a.model_dump() for a in payload.answers]
    result = await service.submit_assessment(current_user.id, payload.assessment_id, answers_dict)
    return result


@router.get("/ocean/latest", response_model=PersonalityResultResponse)
async def get_latest_personality_result(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = AssessmentRepository(db)
    res = await repo.get_latest_result(current_user.id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No personality assessment has been completed yet.",
        )
    return res
