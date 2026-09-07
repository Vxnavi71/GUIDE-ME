import os
import sys
import uuid
import pytest
from httpx import AsyncClient, ASGITransport

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.ai.context_builder import AIContextBuilder
from app.ai.tools import ToolDispatcher, GEMINI_FUNCTION_DECLARATIONS
from app.core.database import AsyncSessionLocal


def test_context_builder_multimodal_synthesis():
    system_prompt = AIContextBuilder.assemble_system_prompt(
        user_name="Aarav",
        personality_summary="High conscientiousness and openness.",
        dominant_traits=["Conscientiousness", "Openness"],
        current_mood_score=8.0,
        stress_risk_band="Low",
        active_goals=["Run 5km daily (40% completed)"],
        active_habits=["Morning meditation (7d streak)"],
        recent_journal_themes=["Gratitude on family"],
        sleep_hours=7.5,
        screen_time_hours=3.2,
        active_memories=["pref_tea: Prefers herbal green tea"],
    )
    assert "Aarav" in system_prompt
    assert "Conscientiousness" in system_prompt
    assert "8.0/10" in system_prompt
    assert "Morning meditation" in system_prompt
    assert "7.5 hours" in system_prompt
    assert "3.2 hours" in system_prompt
    assert "14416" in system_prompt  # Indian Tele-MANAS crisis line mentioned
    assert "tools" in system_prompt.lower()


def test_tools_schema_and_declarations():
    tools = ToolDispatcher.get_gemini_tools_spec()
    assert len(tools) == 1
    decls = tools[0]["function_declarations"]
    tool_names = [d["name"] for d in decls]
    assert "create_goal" in tool_names
    assert "update_goal" in tool_names
    assert "delete_goal" in tool_names
    assert "create_habit" in tool_names
    assert "complete_habit" in tool_names
    assert "delete_habit" in tool_names
    assert "create_journal_entry" in tool_names
    assert "get_user_wellbeing_data" in tool_names
    assert "log_quick_mood" in tool_names


@pytest.mark.asyncio
async def test_tool_execution_and_destructive_confirmation():
    async with AsyncSessionLocal() as db:
        # Create a test user via API
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            email = f"companion_tool_{uuid.uuid4().hex[:6]}@example.com"
            reg = await ac.post("/api/v1/auth/register", json={
                "email": email,
                "password": "SecurePassword123!",
                "full_name": "Companion Tester",
            })
            token = reg.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # 1. Test create_goal tool via ToolDispatcher
            me_res = await ac.get("/api/v1/auth/me", headers=headers)
            user_id = me_res.json()["id"]

            goal_res = await ToolDispatcher.execute(
                "create_goal",
                {"title": "Test Walk 30 Mins", "category": "physical", "milestones": ["M1", "M2"]},
                user_id=user_id,
                db=db,
            )
            await db.commit()
            assert goal_res["status"] == "success"
            assert goal_res["action"] == "goal_created"
            goal_id = goal_res["goal_id"]

            # 2. Test create_habit tool via ToolDispatcher
            habit_res = await ToolDispatcher.execute(
                "create_habit",
                {"title": "Hydration 2L", "category": "wellness"},
                user_id=user_id,
                db=db,
            )
            await db.commit()
            assert habit_res["status"] == "success"
            habit_id = habit_res["habit_id"]

            # 3. Test destructive delete_goal tool -> requires confirmation
            del_goal_res = await ToolDispatcher.execute(
                "delete_goal",
                {"goal_id": goal_id, "goal_title": "Test Walk 30 Mins"},
                user_id=user_id,
                db=db,
            )
            assert del_goal_res["confirmation_required"] is True
            action_id = del_goal_res["action_id"]

            # 4. Confirm action via API endpoint POST /companion/actions/{action_id}/confirm
            confirm_res = await ac.post(f"/api/v1/companion/actions/{action_id}/confirm", headers=headers)
            assert confirm_res.status_code == 200
            assert confirm_res.json()["status"] == "success"

            # Verify goal is indeed deleted
            goals_list = await ac.get("/api/v1/goals", headers=headers)
            assert all(g["id"] != goal_id for g in goals_list.json())

            # 5. Test destructive delete_habit tool -> cancellation flow
            del_habit_res = await ToolDispatcher.execute(
                "delete_habit",
                {"habit_id": habit_id, "habit_title": "Hydration 2L"},
                user_id=user_id,
                db=db,
            )
            assert del_habit_res["confirmation_required"] is True
            action_id2 = del_habit_res["action_id"]

            cancel_res = await ac.post(f"/api/v1/companion/actions/{action_id2}/cancel", headers=headers)
            assert cancel_res.status_code == 200
            assert cancel_res.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_companion_multisession_and_memory_crud():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = f"companion_multi_{uuid.uuid4().hex[:6]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "MultiSession Tester",
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create a new conversation session
        conv_create = await ac.post(
            "/api/v1/companion/conversations",
            headers=headers,
            json={"title": "Evening Wind-down Session"},
        )
        assert conv_create.status_code == 200
        conv_data = conv_create.json()
        assert conv_data["title"] == "Evening Wind-down Session"
        conv_id = conv_data["id"]

        # 2. List conversations
        convs_res = await ac.get("/api/v1/companion/conversations", headers=headers)
        assert convs_res.status_code == 200
        assert any(c["id"] == conv_id for c in convs_res.json())

        # 3. Chat in specific session
        chat_res = await ac.post("/api/v1/companion/chat", headers=headers, json={
            "content": "Hello companion, I want to wind down tonight.",
            "conversation_id": conv_id,
        })
        assert chat_res.status_code == 200
        assert chat_res.json()["sender_role"] == "assistant"

        # 4. Fetch specific conversation
        conv_fetch = await ac.get(f"/api/v1/companion/conversations/{conv_id}", headers=headers)
        assert conv_fetch.status_code == 200
        assert len(conv_fetch.json()["messages"]) >= 2

        # 5. Memory CRUD: Create memory
        mem_res = await ac.post("/api/v1/companion/memories", headers=headers, json={
            "key": "evening_routine",
            "content": "Prefers reading fiction before sleep",
            "memory_type": "preference",
            "confidence": 0.95,
        })
        assert mem_res.status_code == 200
        mem_id = mem_res.json()["id"]

        # 6. List memories
        mems_list = await ac.get("/api/v1/companion/memories", headers=headers)
        assert mems_list.status_code == 200
        assert any(m["id"] == mem_id for m in mems_list.json())

        # 7. Update memory
        update_mem = await ac.put(f"/api/v1/companion/memories/{mem_id}", headers=headers, json={
            "content": "Prefers reading gentle sci-fi before sleep",
        })
        assert update_mem.status_code == 200
        assert update_mem.json()["content"] == "Prefers reading gentle sci-fi before sleep"

        # 8. Delete memory
        del_mem = await ac.delete(f"/api/v1/companion/memories/{mem_id}", headers=headers)
        assert del_mem.status_code == 200

        # 9. Delete conversation session
        del_conv = await ac.delete(f"/api/v1/companion/conversations/{conv_id}", headers=headers)
        assert del_conv.status_code == 200


@pytest.mark.asyncio
async def test_companion_streaming_and_crisis_guardrail():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = f"stream_{uuid.uuid4().hex[:6]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Stream Tester",
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Normal message streaming
        stream_res = await ac.post("/api/v1/companion/chat/stream", headers=headers, json={
            "content": "Hello, how can I ground myself right now?",
        })
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers.get("content-type", "")
        stream_text = stream_res.text
        assert "data:" in stream_text
        assert "done" in stream_text

        # 2. Crisis trigger during streaming -> triggers Indian helpline intervention
        crisis_stream = await ac.post("/api/v1/companion/chat/stream", headers=headers, json={
            "content": "I can't go on anymore, I want to end my life",
        })
        assert crisis_stream.status_code == 200
        crisis_text = crisis_stream.text
        assert "14416" in crisis_text or "1800-599-0019" in crisis_text or "Tele-MANAS" in crisis_text
