from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import JournalCreate, JournalResponse
from app.services import JournalService

router = APIRouter(prefix="/journal", tags=["Journal & AI Reflection"])


@router.get("", response_model=List[JournalResponse])
async def list_journals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    service = JournalService(db)
    return await service.list_entries(current_user.id)


@router.post("", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
async def create_journal(
    payload: JournalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    service = JournalService(db)
    return await service.create_entry(
        user_id=current_user.id,
        title=payload.title,
        content=payload.content,
        tags=payload.tags,
        mood_context=payload.mood_context,
    )


@router.get("/{journal_id}", response_model=JournalResponse)
async def get_journal(
    journal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    service = JournalService(db)
    return await service.get_entry(journal_id, current_user.id)


@router.delete("/{journal_id}", status_code=status.HTTP_200_OK)
async def delete_journal(
    journal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    service = JournalService(db)
    await service.delete_entry(journal_id, current_user.id)
    return {"status": "success", "message": "Journal entry deleted successfully."}
