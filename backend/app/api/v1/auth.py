from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, RefreshTokenRequest, UserProfileResponse
from app.services import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_async_db)):
    service = AuthService(db)
    return await service.register(
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        preferred_name=payload.preferred_name,
        occupation=payload.occupation,
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_async_db)):
    service = AuthService(db)
    return await service.login(email=payload.email, password=payload.password)


@router.post("/refresh")
async def refresh_token(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_async_db)):
    service = AuthService(db)
    return await service.refresh_tokens(payload.refresh_token)


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    full_name = current_user.profile.full_name if current_user.profile else current_user.email
    preferred_name = current_user.profile.preferred_name if current_user.profile else None
    timezone = current_user.profile.timezone if current_user.profile else "UTC"
    occupation = current_user.profile.occupation if current_user.profile else None
    bio = current_user.profile.bio if current_user.profile else None
    avatar_url = current_user.profile.avatar_url if current_user.profile else None

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        full_name=full_name,
        preferred_name=preferred_name,
        timezone=timezone,
        occupation=occupation,
        bio=bio,
        avatar_url=avatar_url,
        created_at=current_user.created_at,
    )
