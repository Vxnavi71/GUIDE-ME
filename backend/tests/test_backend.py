import os
import sys

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import get_password_hash, verify_password, validate_password_strength
from app.ml.ocean_engine import OceanBigFiveEngine
from app.ml.nlp_engine import NLPEmotionJournalEngine
from app.ml.stress_distress_engine import StressDistressEngine, PersonalBaselineCalculator
from app.ai.safety_guardrails import SafetyGuardrailEngine


@pytest.mark.asyncio
async def test_health_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert "GUIDE ME" in data["service"]

        res_ready = await ac.get("/ready")
        assert res_ready.status_code == 200
        assert res_ready.json()["status"] == "ready"


def test_password_security_and_hashing():
    pwd = "StrongPassword123!"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False

    # Password strength validator
    assert validate_password_strength("Short1!") is False
    assert validate_password_strength("nocapitals123!") is False
    assert validate_password_strength("NOLOWERCASE123!") is False
    assert validate_password_strength("NoNumbersAtAll!") is False
    assert validate_password_strength("ValidPass123") is True


def test_ocean_psychometrics():
    sample_answers = [
        {"question_id": "q1", "score_value": 5},
        {"question_id": "q2", "score_value": 1},
    ]
    sample_map = {
        "q1": {"domain_trait": "openness", "reverse_scored": False},
        "q2": {"domain_trait": "openness", "reverse_scored": True},
    }
    scores = OceanBigFiveEngine.calculate_scores(sample_answers, sample_map)
    assert "openness" in scores
    assert scores["openness"] == 100.0

    dominant, summary, careers = OceanBigFiveEngine.interpret_profile(scores)
    assert len(summary) > 10
    assert len(careers) > 0


def test_nlp_journal_analysis():
    positive_text = "I feel so happy, grateful, and peaceful with my progress today."
    res_pos = NLPEmotionJournalEngine.analyze_text(positive_text)
    assert res_pos["sentiment_score"] > 0.3
    assert "joy" in res_pos["dominant_emotion"] or "contentment" in res_pos["dominant_emotion"]

    distortion_text = "Nothing ever works out and it is completely ruined forever."
    res_dist = NLPEmotionJournalEngine.analyze_text(distortion_text)
    assert len(res_dist["cognitive_distortions"]) > 0
    assert res_dist["sentiment_score"] < 0


def test_stress_and_personal_baseline():
    stress_res = StressDistressEngine.evaluate_stress(
        self_report_mood=3.0,
        hrv_ms=28.0,
        sleep_hours=4.5,
        screen_time_minutes=420,
    )
    assert stress_res["risk_band"] in ["elevated", "critical"]
    assert stress_res["score"] > 50
    assert "disclaimer" in stress_res

    # Personal baseline deviation
    baseline_stats = PersonalBaselineCalculator.calculate_deviation(75.0, [30.0, 32.0, 35.0, 33.0])
    assert baseline_stats["z_score"] > 1.5


def test_crisis_safety_guardrails():
    safe_msg = "I had a busy day at work and need to sleep early."
    safe_eval = SafetyGuardrailEngine.evaluate_message_safety(safe_msg)
    assert safe_eval["is_crisis"] is False

    crisis_msg = "I feel hopeless and want to end my life."
    crisis_eval = SafetyGuardrailEngine.evaluate_message_safety(crisis_msg)
    assert crisis_eval["is_crisis"] is True
    assert "14416" in crisis_eval["intervention_text"] or "Tele-MANAS" in crisis_eval["intervention_text"]


@pytest.mark.asyncio
async def test_auth_and_idor_protection():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Register User A
        res_a = await ac.post("/api/v1/auth/register", json={
            "email": "user_a@example.com",
            "password": "SecurePassword123!",
            "full_name": "User Alpha",
        })
        assert res_a.status_code in [201, 400]  # 400 if already exists

        # Login User A
        login_a = await ac.post("/api/v1/auth/login", json={
            "email": "user_a@example.com",
            "password": "SecurePassword123!",
        })
        token_a = login_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Verify password hash is never leaked in profile
        me_res = await ac.get("/api/v1/auth/me", headers=headers_a)
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert "password" not in me_data
        assert "hashed_password" not in me_data

        # 2. User A creates a journal entry
        j_res = await ac.post("/api/v1/journal", headers=headers_a, json={
            "title": "Private Thoughts of User A",
            "content": "Confidential reflections that nobody else should ever access.",
            "tags": ["private"],
        })
        assert j_res.status_code == 201
        journal_a_id = j_res.json()["id"]

        # 3. Register User B
        res_b = await ac.post("/api/v1/auth/register", json={
            "email": "user_b@example.com",
            "password": "SecurePassword123!",
            "full_name": "User Beta",
        })
        assert res_b.status_code in [201, 400]

        login_b = await ac.post("/api/v1/auth/login", json={
            "email": "user_b@example.com",
            "password": "SecurePassword123!",
        })
        token_b = login_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # 4. IDOR Attack: User B tries to read User A's journal entry
        idor_read = await ac.get(f"/api/v1/journal/{journal_a_id}", headers=headers_b)
        assert idor_read.status_code in [403, 404]  # Must be blocked!

        # 5. IDOR Attack: User B tries to delete User A's journal entry
        idor_delete = await ac.delete(f"/api/v1/journal/{journal_a_id}", headers=headers_b)
        assert idor_delete.status_code in [403, 404]  # Must be blocked!

        # 6. Unauthorized access without token must fail
        unauth = await ac.get("/api/v1/journal")
        assert unauth.status_code == 401


@pytest.mark.asyncio
async def test_goals_and_habits_crud():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        email = "goals_user@example.com"
        pwd = "GoalsPassword123!"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email,
            "password": pwd,
            "full_name": "Goal Master",
        })
        assert reg.status_code in [201, 400]

        login = await ac.post("/api/v1/auth/login", json={"email": email, "password": pwd})
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create Goal
        create_g = await ac.post("/api/v1/goals", headers=headers, json={
            "title": "Mindful Meditation 30-Day",
            "description": "Daily 10 minute meditation practice",
            "category": "mindfulness",
            "milestones": ["Day 1 completed", "Day 7 completed"]
        })
        assert create_g.status_code == 201
        goal_data = create_g.json()
        assert goal_data["title"] == "Mindful Meditation 30-Day"
        assert len(goal_data["milestones"]) == 2
        goal_id = goal_data["id"]

        # 2. Update Goal
        update_g = await ac.put(f"/api/v1/goals/{goal_id}", headers=headers, json={
            "description": "Updated meditation practice"
        })
        assert update_g.status_code == 200
        assert update_g.json()["description"] == "Updated meditation practice"

        # 3. Create Habit
        create_h = await ac.post("/api/v1/habits", headers=headers, json={
            "title": "Drink 2L Water",
            "description": "Keep body hydrated throughout the day",
            "category": "physical",
            "target_frequency": "daily",
            "target_per_day": 1
        })
        assert create_h.status_code == 201
        habit_data = create_h.json()
        assert habit_data["title"] == "Drink 2L Water"
        assert habit_data["streak_count"] == 0
        habit_id = habit_data["id"]

        # 4. Toggle Habit completion
        toggle_h = await ac.post(f"/api/v1/habits/{habit_id}/toggle", headers=headers)
        assert toggle_h.status_code == 200
        toggled_data = toggle_h.json()
        assert toggled_data["completed_today"] is True
        assert toggled_data["streak_count"] == 1

        # 5. List habits
        list_h = await ac.get("/api/v1/habits", headers=headers)
        assert list_h.status_code == 200
        habits_list = list_h.json()
        assert len(habits_list) >= 1
        assert any(h["id"] == habit_id for h in habits_list)


@pytest.mark.asyncio
async def test_dashboard_summary_and_dynamic_recommendations():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = f"dash_{uuid.uuid4().hex[:6]}@example.com"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Dash User"
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Test Dashboard Summary
        dash_res = await ac.get("/api/v1/wellness/dashboard-summary", headers=headers)
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert dash_data["user_name"] in ["Dash", "Dash User"]
        assert "trends_7d" in dash_data
        assert len(dash_data["trends_7d"]) == 7
        assert "habits_completed_today" in dash_data
        assert "sleep_hours" in dash_data
        assert "screen_time_hours" in dash_data
        assert dash_data["wearable_provider_mode"] == "not_connected"
        assert dash_data["sleep_hours"] is None
        assert dash_data["screen_time_hours"] is None

        # 2. Test Dynamic Recommendations
        rec_res = await ac.get("/api/v1/recommendations", headers=headers)
        assert rec_res.status_code == 200
        recs = rec_res.json()
        assert isinstance(recs, list)
        assert len(recs) > 0
        assert "confidence" in recs[0]

