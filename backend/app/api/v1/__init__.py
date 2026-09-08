from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.assessments import router as assessments_router
from app.api.v1.journal import router as journal_router
from app.api.v1.mood_stress import router as mood_stress_router
from app.api.v1.companion import router as companion_router
from app.api.v1.facial import router as facial_router
from app.api.v1.wellness import router as wellness_router
from app.api.v1.goals import router as goals_router
from app.api.v1.career import router as career_router
from app.api.v1.safety import router as safety_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.wearables import router as wearables_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(assessments_router)
api_router.include_router(journal_router)
api_router.include_router(mood_stress_router)
api_router.include_router(companion_router)
api_router.include_router(facial_router)
api_router.include_router(wellness_router)
api_router.include_router(goals_router)
api_router.include_router(career_router)
api_router.include_router(safety_router)
api_router.include_router(recommendations_router)
api_router.include_router(wearables_router)
