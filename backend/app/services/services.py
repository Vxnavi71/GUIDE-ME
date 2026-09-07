from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password, get_password_hash, validate_password_strength, create_access_token, create_refresh_token, decode_token
from app.repositories import (
    UserRepository,
    JournalRepository,
    AssessmentRepository,
    MoodStressRepository,
    ConversationRepository,
    GoalRepository,
    HabitRepository,
    WellnessRepository,
    SafetyRepository,
    AuditRepository,
)
from app.ml import (
    OceanBigFiveEngine,
    NLPEmotionJournalEngine,
    StressDistressEngine,
    FacialAnalysisEngine,
    RecommendationEngine,
)
from app.ai import SafetyGuardrailEngine, AIContextBuilder, get_llm_provider
from app.integrations import get_wearable_provider


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)
        self.audit_repo = AuditRepository(db)

    async def register(self, email: str, password: str, full_name: str, preferred_name: Optional[str] = None, occupation: Optional[str] = None) -> Dict[str, Any]:
        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email address already exists.")

        if not validate_password_strength(password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.",
            )

        hashed = get_password_hash(password)
        user = await self.user_repo.create_user(
            email=email,
            hashed_password=hashed,
            full_name=full_name,
            preferred_name=preferred_name,
            occupation=occupation,
        )
        await self.audit_repo.log_action(user.id, "REGISTER", "users", details={"email": email})

        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": full_name,
        }

    async def login(self, email: str, password: str) -> Dict[str, Any]:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been deactivated.")

        await self.audit_repo.log_action(user.id, "LOGIN", "auth")
        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id)
        full_name = user.profile.full_name if user.profile else user.email.split("@")[0]

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": full_name,
        }

    async def refresh_tokens(self, refresh_token: str) -> Dict[str, str]:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")

        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

        new_access = create_access_token(user.id, user.role)
        new_refresh = create_refresh_token(user.id)
        return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


class JournalService:
    def __init__(self, db: AsyncSession):
        self.journal_repo = JournalRepository(db)
        self.audit_repo = AuditRepository(db)

    async def create_entry(self, user_id: str, title: str, content: str, tags: List[str], mood_context: Optional[str]) -> Any:
        journal = await self.journal_repo.create(user_id, title, content, tags, mood_context)
        # NLP analysis
        nlp_res = NLPEmotionJournalEngine.analyze_text(content)
        analysis = await self.journal_repo.attach_analysis(
            journal_id=journal.id,
            user_id=user_id,
            sentiment_score=nlp_res["sentiment_score"],
            dominant_emotion=nlp_res["dominant_emotion"],
            cognitive_distortions=nlp_res["cognitive_distortions"],
            topics=nlp_res["topics"],
            reflection_prompt=nlp_res["reflection_prompt"],
            recommended_action=nlp_res["recommended_action"],
        )
        await self.audit_repo.log_action(user_id, "CREATE", "journals", details={"journal_id": journal.id})
        return await self.journal_repo.get_by_id(journal.id, user_id)

    async def list_entries(self, user_id: str) -> List[Any]:
        return await self.journal_repo.list_by_user(user_id)

    async def get_entry(self, journal_id: str, user_id: str) -> Any:
        entry = await self.journal_repo.get_by_id(journal_id, user_id)
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found or unauthorized.")
        return entry

    async def delete_entry(self, journal_id: str, user_id: str) -> bool:
        success = await self.journal_repo.delete(journal_id, user_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found or unauthorized.")
        await self.audit_repo.log_action(user_id, "DELETE", "journals", details={"journal_id": journal_id})
        return True


class AssessmentService:
    def __init__(self, db: AsyncSession):
        self.assessment_repo = AssessmentRepository(db)
        self.audit_repo = AuditRepository(db)

    async def submit_assessment(self, user_id: str, assessment_id: str, answers: List[Dict[str, Any]]) -> Any:
        assessment = await self.assessment_repo.get_default_assessment()
        questions_map = {}
        if assessment:
            for q in assessment.questions:
                questions_map[q.id] = {
                    "domain_trait": q.domain_trait,
                    "reverse_scored": q.reverse_scored,
                }

        scores = OceanBigFiveEngine.calculate_scores(answers, questions_map)
        dominant, summary, careers = OceanBigFiveEngine.interpret_profile(scores)

        result = await self.assessment_repo.save_result(
            user_id=user_id,
            assessment_id=assessment_id,
            scores=scores,
            dominant_traits=dominant,
            analysis_summary=summary,
            career_strengths=careers,
        )
        await self.audit_repo.log_action(user_id, "SUBMIT_ASSESSMENT", "assessments", details={"assessment_id": assessment_id})
        return result


class CompanionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.conv_repo = ConversationRepository(db)
        self.user_repo = UserRepository(db)
        self.assess_repo = AssessmentRepository(db)
        self.mood_repo = MoodStressRepository(db)
        self.goal_repo = GoalRepository(db)
        self.habit_repo = HabitRepository(db)
        self.journal_repo = JournalRepository(db)
        self.wellness_repo = WellnessRepository(db)
        self.safety_repo = SafetyRepository(db)
        self.audit_repo = AuditRepository(db)

    async def _assemble_system_prompt(self, user_id: str) -> Tuple[str, Any]:
        user = await self.user_repo.get_by_id(user_id)
        user_name = user.profile.preferred_name if user and user.profile else "Friend"
        personality = await self.assess_repo.get_latest_result(user_id)

        # Active Goals
        goals = await self.goal_repo.list_by_user(user_id)
        active_goals = [f"{g.title} ({g.progress_percentage}% completed)" for g in goals if g.status == "in_progress"][:4]

        # Active Habits & Streaks
        habits = await self.habit_repo.list_by_user(user_id)
        active_habits = [f"{h['title']} ({h['streak_count']}d streak)" for h in habits[:4]]

        # Recent Journal Themes
        recent_journals = await self.journal_repo.list_by_user(user_id, limit=3)
        journal_themes = []
        for j in recent_journals:
            if j.analysis:
                journal_themes.append(f"{j.analysis.dominant_emotion} on {', '.join(j.analysis.topics or ['life'])}")

        # Recent Sleep & Screen Time
        recent_wellness = await self.wellness_repo.list_recent_metrics(user_id, limit=1)
        sleep_hours = recent_wellness[0].sleep_hours if recent_wellness else None

        from datetime import datetime, timezone
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        dw = await self.wellness_repo.get_digital_wellbeing(user_id, today_str)
        screen_time_hours = round(dw.total_screen_time_minutes / 60.0, 1) if dw and dw.total_screen_time_minutes else None

        # Mood & Stress
        recent_moods = await self.mood_repo.list_moods(user_id, limit=1)
        current_mood = recent_moods[0].score if recent_moods else None

        stress_obs = await self.mood_repo.get_latest_stress(user_id)
        stress_band = stress_obs.risk_band if stress_obs else None

        memories = await self.conv_repo.list_memories(user_id)
        mem_texts = [f"{m.key}: {m.content}" for m in memories]

        prompt = AIContextBuilder.assemble_system_prompt(
            user_name=user_name,
            personality_summary=personality.analysis_summary if personality else None,
            dominant_traits=personality.dominant_traits if personality else None,
            current_mood_score=current_mood,
            stress_risk_band=stress_band,
            active_goals=active_goals,
            active_habits=active_habits,
            recent_journal_themes=journal_themes,
            sleep_hours=sleep_hours,
            screen_time_hours=screen_time_hours,
            active_memories=mem_texts,
        )
        return prompt, user

    async def process_message(self, user_id: str, content: str, conversation_id: Optional[str] = None) -> Any:
        conv = None
        if conversation_id:
            conv = await self.conv_repo.get_conversation_by_id(conversation_id, user_id)
        if not conv:
            conv = await self.conv_repo.get_or_create_active_conversation(user_id)

        # 1. Save user message
        user_msg = await self.conv_repo.add_message(conv.id, user_id, "user", content)

        # 2. Safety Guardrail Evaluation
        safety_eval = SafetyGuardrailEngine.evaluate_message_safety(content)
        if safety_eval["is_crisis"]:
            await self.safety_repo.log_safety_event(
                user_id=user_id,
                severity="urgent",
                event_type="crisis_keyword_detected",
                details={"preview": content[:100]},
                support_displayed=["Tele-MANAS: 14416", "KIRAN: 1800-599-0019", "Vandrevala Foundation: +91 9999 666 555", "Emergency: 112"],
            )
            asst_msg = await self.conv_repo.add_message(
                conv.id,
                user_id,
                "assistant",
                safety_eval["intervention_text"],
                metadata_json={"safety_triggered": True, "crisis": True},
            )
            return asst_msg

        # 3. Multimodal Context Assembling
        system_prompt, user = await self._assemble_system_prompt(user_id)
        history = [{"role": m.sender_role, "content": m.content} for m in conv.messages[-14:]]

        # 4. Invoke LLM Provider with tool dispatching
        provider = get_llm_provider()
        response_text, extracted_memories = await provider.generate_response(
            content,
            system_prompt,
            history,
            user_id=user_id,
            db=self.db,
        )

        # 5. Extract and store memories if user permitted
        if user and user.consent and user.consent.memory_consent:
            for mem in extracted_memories:
                await self.conv_repo.add_memory(
                    user_id=user_id,
                    memory_type=mem["type"],
                    key=mem["key"],
                    content=mem["content"],
                    confidence=mem["confidence"],
                )

        # 6. Save assistant message
        asst_msg = await self.conv_repo.add_message(
            conv.id,
            user_id,
            "assistant",
            response_text,
            metadata_json={"provider": type(provider).__name__},
        )
        return asst_msg

    async def process_message_stream(self, user_id: str, content: str, conversation_id: Optional[str] = None):
        """
        Asynchronous generator yielding Server-Sent Events (SSE) for real-time streaming.
        """
        import json
        conv = None
        if conversation_id:
            conv = await self.conv_repo.get_conversation_by_id(conversation_id, user_id)
        if not conv:
            conv = await self.conv_repo.get_or_create_active_conversation(user_id)

        # Save user message
        await self.conv_repo.add_message(conv.id, user_id, "user", content)

        # Safety Guardrail Evaluation
        safety_eval = SafetyGuardrailEngine.evaluate_message_safety(content)
        if safety_eval["is_crisis"]:
            await self.safety_repo.log_safety_event(
                user_id=user_id,
                severity="urgent",
                event_type="crisis_keyword_detected",
                details={"preview": content[:100]},
                support_displayed=["Tele-MANAS: 14416", "KIRAN: 1800-599-0019", "Vandrevala Foundation: +91 9999 666 555", "Emergency: 112"],
            )
            asst_msg = await self.conv_repo.add_message(
                conv.id,
                user_id,
                "assistant",
                safety_eval["intervention_text"],
                metadata_json={"safety_triggered": True, "crisis": True},
            )
            yield f"data: {json.dumps({'type': 'crisis', 'content': safety_eval['intervention_text'], 'message_id': asst_msg.id})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'full_text': safety_eval['intervention_text']})}\n\n"
            return

        system_prompt, user = await self._assemble_system_prompt(user_id)
        history = [{"role": m.sender_role, "content": m.content} for m in conv.messages[-14:]]

        provider = get_llm_provider()
        from app.ai.gemini_provider import GeminiProvider

        accumulated_text = []
        extracted_memories = []

        if isinstance(provider, GeminiProvider):
            async for event in provider.stream_conversation(content, system_prompt, history, user_id=user_id, db=self.db):
                if event.get("type") == "delta":
                    accumulated_text.append(event.get("content", ""))
                elif event.get("type") == "done":
                    extracted_memories = event.get("extracted_memories", [])
                yield f"data: {json.dumps(event)}\n\n"
        else:
            # Simulated streaming for Mock/External
            resp_text, extracted = await provider.generate_response(content, system_prompt, history, user_id=user_id, db=self.db)
            extracted_memories = extracted
            words = resp_text.split(" ")
            for i, w in enumerate(words):
                chunk = w + (" " if i < len(words) - 1 else "")
                accumulated_text.append(chunk)
                yield f"data: {json.dumps({'type': 'delta', 'content': chunk})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'full_text': resp_text, 'extracted_memories': extracted})}\n\n"

        full_content = "".join(accumulated_text).strip()
        if not full_content:
            full_content = "I am listening and here to support you."

        # Save assistant message
        asst_msg = await self.conv_repo.add_message(
            conv.id,
            user_id,
            "assistant",
            full_content,
            metadata_json={"provider": type(provider).__name__, "streamed": True},
        )

        # Store consented memories
        if user and user.consent and user.consent.memory_consent and extracted_memories:
            for mem in extracted_memories:
                await self.conv_repo.add_memory(
                    user_id=user_id,
                    memory_type=mem["type"],
                    key=mem["key"],
                    content=mem["content"],
                    confidence=mem["confidence"],
                )

