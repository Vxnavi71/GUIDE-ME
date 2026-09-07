from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import (
    ChatMessageCreate,
    ChatMessageResponse,
    ConversationResponse,
    ConversationSummary,
    ConversationCreate,
    MemoryItemResponse,
    MemoryCreate,
    MemoryUpdate,
    ActionConfirmationResponse,
)
from app.repositories import ConversationRepository
from app.services import CompanionService
from app.ai.tools import ToolDispatcher

router = APIRouter(prefix="/companion", tags=["AI Companion & Memory"])


@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_companion(
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Standard single-turn message endpoint for backwards compatibility and non-streaming clients.
    """
    service = CompanionService(db)
    msg = await service.process_message(
        user_id=current_user.id,
        content=payload.content,
        conversation_id=payload.conversation_id,
    )
    return msg


@router.post("/chat/stream")
async def stream_chat_with_companion(
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Server-Sent Events (SSE) streaming endpoint for the AI Companion.
    Emits real-time tokens, tool executions, confirmation requests, and completion events.
    """
    service = CompanionService(db)
    return StreamingResponse(
        service.process_message_stream(
            user_id=current_user.id,
            content=payload.content,
            conversation_id=payload.conversation_id,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ==========================================
# Multi-Session Conversation Management
# ==========================================
@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    List all conversational sessions belonging to the authenticated user.
    """
    repo = ConversationRepository(db)
    return await repo.list_user_conversations(current_user.id)


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Create a new conversation session for the authenticated user.
    """
    repo = ConversationRepository(db)
    conv = await repo.create_conversation(current_user.id, payload.title)
    return conv


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Fetch a specific conversation session and all its messages.
    """
    repo = ConversationRepository(db)
    conv = await repo.get_conversation_by_id(conversation_id, current_user.id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found.")
    return conv


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Permanently delete a conversation thread.
    """
    repo = ConversationRepository(db)
    deleted = await repo.delete_conversation(conversation_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found or unauthorized.")
    return {"status": "success", "message": "Conversation session deleted."}


@router.get("/conversation", response_model=ConversationResponse)
async def get_active_conversation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Get or create the default active conversation session.
    """
    repo = ConversationRepository(db)
    conv = await repo.get_or_create_active_conversation(current_user.id)
    return conv


@router.post("/clear", status_code=status.HTTP_200_OK)
async def clear_companion_chat(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Clear all messages in the active conversation thread.
    """
    repo = ConversationRepository(db)
    conv = await repo.get_or_create_active_conversation(current_user.id)
    await repo.clear_messages(conv.id, current_user.id)
    return {"status": "success", "message": "Conversation history cleared."}


# ==========================================
# Tool Action Confirmations (Destructive Safety)
# ==========================================
@router.post("/actions/{action_id}/confirm", response_model=ActionConfirmationResponse)
async def confirm_action(
    action_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Execute a pending destructive action (e.g. deleting a goal or habit) after explicit user confirmation.
    """
    res = await ToolDispatcher.confirm_action(action_id, current_user.id, db)
    if res.get("status") != "success":
        raise HTTPException(status_code=400, detail=res.get("message", "Confirmation failed."))
    return {
        "status": "success",
        "action_id": action_id,
        "tool": res.get("tool"),
        "message": res.get("message"),
        "result": res,
    }


@router.post("/actions/{action_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_action(
    action_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a pending destructive action.
    """
    res = ToolDispatcher.cancel_action(action_id, current_user.id)
    if res.get("status") != "cancelled":
        raise HTTPException(status_code=404, detail="Action not found or already executed.")
    return {"status": "cancelled", "message": "Action cancelled by user."}


# ==========================================
# Memory Management
# ==========================================
@router.get("/memories", response_model=List[MemoryItemResponse])
async def list_memories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    List user-consented long-term memories.
    """
    repo = ConversationRepository(db)
    return await repo.list_memories(current_user.id)


@router.post("/memories", response_model=MemoryItemResponse)
async def create_memory(
    payload: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Manually store a new structured long-term memory.
    """
    repo = ConversationRepository(db)
    mem = await repo.add_memory(
        user_id=current_user.id,
        memory_type=payload.memory_type,
        key=payload.key,
        content=payload.content,
        confidence=payload.confidence,
    )
    return mem


@router.put("/memories/{memory_id}", response_model=MemoryItemResponse)
async def update_memory(
    memory_id: str,
    payload: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Update the content or active status of an existing memory.
    """
    repo = ConversationRepository(db)
    mem = await repo.update_memory(
        memory_id=memory_id,
        user_id=current_user.id,
        content=payload.content,
        is_active=payload.is_active,
    )
    if not mem:
        raise HTTPException(status_code=404, detail="Memory item not found.")
    return mem


@router.delete("/memories/{memory_id}", status_code=status.HTTP_200_OK)
async def delete_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Permanently delete a long-term memory item.
    """
    repo = ConversationRepository(db)
    deleted = await repo.delete_memory(memory_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory item not found or unauthorized.")
    return {"status": "success", "message": "Memory item permanently removed."}
