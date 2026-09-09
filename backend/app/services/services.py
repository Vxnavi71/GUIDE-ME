import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("guideme.services")

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
        self.db = db
        self.journal_repo = JournalRepository(db)
        self.audit_repo = AuditRepository(db)

    async def create_entry(self, user_id: str, title: str, content: str, tags: List[str], mood_context: Optional[str]) -> Any:
        journal = await self.journal_repo.create(user_id, title, content, tags, mood_context)
        # NLP analysis grounds the reflection in measurable signals; the language model then
        # writes the actual feedback the user reads.
        nlp_res = NLPEmotionJournalEngine.analyze_text(content)
        reflection = await self._generate_reflection(user_id, content, mood_context, nlp_res)
        analysis = await self.journal_repo.attach_analysis(
            journal_id=journal.id,
            user_id=user_id,
            sentiment_score=nlp_res["sentiment_score"],
            dominant_emotion=nlp_res["dominant_emotion"],
            cognitive_distortions=nlp_res["cognitive_distortions"],
            topics=nlp_res["topics"],
            reflection_prompt=reflection,
            recommended_action=nlp_res["recommended_action"],
        )
        await self.audit_repo.log_action(user_id, "CREATE", "journals", details={"journal_id": journal.id})
        return await self.journal_repo.get_by_id(journal.id, user_id)

    async def _generate_reflection(
        self,
        user_id: str,
        content: str,
        mood_context: Optional[str],
        nlp_res: Dict[str, Any],
    ) -> str:
        """
        Produces the reflection the user sees after submitting an entry.

        The active LLM provider writes it, grounded in the NLP signals so the model responds to
        what the entry actually contains rather than inventing detail. If the provider is
        unavailable or errors, we fall back to the deterministic NLP prompt so the user is never
        left without feedback.
        """
        fallback = nlp_res.get("reflection_prompt") or ""
        if not content or not content.strip():
            return fallback

        distortions = nlp_res.get("cognitive_distortions") or []
        topics = nlp_res.get("topics") or []
        sentiment = nlp_res.get("sentiment_score")

        system_prompt = (
            "You are a warm, evidence-based reflective journaling companion. "
            "Write 2-4 sentences of personalised reflection on the user's journal entry.\n"
            "Rules:\n"
            "- Speak directly to the user in second person.\n"
            "- Name what you actually notice in their words; do not invent events.\n"
            "- If a cognitive distortion is listed, gently name the pattern and offer one reframe.\n"
            "- End with one concrete, small, doable next step.\n"
            "- Never diagnose, and never claim to be a clinician.\n"
            "- Plain prose only: no bullet points, headings, or markdown.\n\n"
            f"Detected emotion: {nlp_res.get('dominant_emotion')}\n"
            f"Sentiment score (-1 negative to +1 positive): {sentiment}\n"
            f"Cognitive distortions detected: {', '.join(distortions) if distortions else 'none'}\n"
            f"Topics: {', '.join(topics) if topics else 'general reflection'}\n"
            f"Self-reported mood context: {mood_context or 'not provided'}"
        )

        try:
            from app.ai.providers import MockLLMProvider

            provider = get_llm_provider()

            # MockLLMProvider is an offline keyword agent, not a language model: it cannot follow
            # a system prompt and would answer a journal entry with a chat greeting. When no model
            # is configured we therefore keep the NLP-derived reflection, which at least quotes the
            # user's own wording and names the detected pattern.
            if isinstance(provider, MockLLMProvider):
                logger.info(
                    "No language model configured; using NLP-derived journal reflection for user %s.",
                    user_id,
                )
                return fallback

            text, _ = await provider.generate_response(
                user_message=f"Here is my journal entry:\n\n{content}",
                system_prompt=system_prompt,
                conversation_history=[],
                user_id=user_id,
                db=self.db,
            )
            text = (text or "").strip()
            if text:
                logger.info(
                    "Journal reflection generated for user %s via %s",
                    user_id,
                    type(provider).__name__,
                )
                return text
        except Exception as exc:
            logger.warning("Journal reflection generation failed (%s); using NLP fallback.", exc)

        return fallback

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
        if not assessment:
            from app.models.entities import Assessment, AssessmentQuestion
            assessment = Assessment(
                title="IPIP Big Five Factor Personality Inventory",
                assessment_type="ocean_big_five",
                version="1.0.0",
                description="Validated 50-item psychometric inventory assessing Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.",
                is_active=True,
            )
            self.assessment_repo.db.add(assessment)
            await self.assessment_repo.db.flush()

            for idx, q_data in enumerate(OceanBigFiveEngine.QUESTIONS_DATA):
                question = AssessmentQuestion(
                    assessment_id=assessment.id,
                    question_text=q_data["text"],
                    domain_trait=q_data["trait"],
                    reverse_scored=q_data["reverse"],
                    order_index=idx + 1,
                )
                self.assessment_repo.db.add(question)
                questions_map[question.id] = {
                    "domain_trait": question.domain_trait,
                    "reverse_scored": question.reverse_scored,
                }
            await self.assessment_repo.db.flush()
        else:
            if assessment.questions:
                for q in assessment.questions:
                    questions_map[q.id] = {
                        "domain_trait": q.domain_trait,
                        "reverse_scored": q.reverse_scored,
                    }

        if assessment:
            # Clients send a placeholder id because the questions endpoint does not expose one.
            # Resolve it to the real row so the stored result keeps a valid foreign key
            # (SQLite tolerates a dangling value; PostgreSQL rejects it outright).
            assessment_id = assessment.id

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

    async def _assemble_system_prompt(self, user_id: str, typing_dynamics: Optional[Dict[str, Any]] = None) -> Tuple[str, Any]:
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
            typing_dynamics=typing_dynamics,
        )
        return prompt, user

    async def process_message(self, user_id: str, content: str, conversation_id: Optional[str] = None, typing_dynamics: Optional[Dict[str, Any]] = None) -> Any:
        conv = None
        if conversation_id:
            conv = await self.conv_repo.get_conversation_by_id(conversation_id, user_id)
        if not conv:
            conv = await self.conv_repo.get_or_create_active_conversation(user_id)

        # Build prior history BEFORE saving the current turn
        history = [{"role": m.sender_role, "content": m.content} for m in (conv.messages[-20:] if conv.messages else [])]

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
        system_prompt, user = await self._assemble_system_prompt(user_id, typing_dynamics=typing_dynamics)

        # Store typing dynamics
        if typing_dynamics and user and user.consent and getattr(user.consent, "typing_dynamics_consent", False):
            from app.models.entities import BehavioralSignal
            signal = BehavioralSignal(
                user_id=user_id,
                signal_type="typing_dynamics",
                typing_speed_wpm=float(typing_dynamics.get("wpm", 55.0)),
                backspace_rate=float(typing_dynamics.get("backspace_rate", 0.08)),
                pause_frequency=float(typing_dynamics.get("pause_frequency", 0.15)),
            )
            self.db.add(signal)
            await self.db.flush()

        # 4. Invoke LLM Provider with tool dispatching
        provider = get_llm_provider()
        logger.info(f"AI Companion for user {user_id} using provider: {type(provider).__name__}")
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

    async def process_message_stream(self, user_id: str, content: str, conversation_id: Optional[str] = None, typing_dynamics: Optional[Dict[str, Any]] = None):
        """
        Asynchronous generator yielding Server-Sent Events (SSE) for real-time streaming.
        """
        import json
        conv = None
        if conversation_id:
            conv = await self.conv_repo.get_conversation_by_id(conversation_id, user_id)
        if not conv:
            conv = await self.conv_repo.get_or_create_active_conversation(user_id)

        # Build prior history BEFORE saving the current turn
        history = [{"role": m.sender_role, "content": m.content} for m in (conv.messages[-20:] if conv.messages else [])]

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
            yield f"data: {json.dumps({'type': 'done', 'full_text': safety_eval['intervention_text'], 'conversation_id': conv.id, 'provider': 'Safety Guardrail'})}\n\n"
            return

        system_prompt, user = await self._assemble_system_prompt(user_id, typing_dynamics=typing_dynamics)

        # Store typing dynamics
        if typing_dynamics and user and user.consent and getattr(user.consent, "typing_dynamics_consent", False):
            from app.models.entities import BehavioralSignal
            signal = BehavioralSignal(
                user_id=user_id,
                signal_type="typing_dynamics",
                typing_speed_wpm=float(typing_dynamics.get("wpm", 55.0)),
                backspace_rate=float(typing_dynamics.get("backspace_rate", 0.08)),
                pause_frequency=float(typing_dynamics.get("pause_frequency", 0.15)),
            )
            self.db.add(signal)
            await self.db.flush()

        provider = get_llm_provider()
        logger.info(f"AI Companion streaming for user {user_id} using provider: {type(provider).__name__}")
        from app.ai.gemini_provider import GeminiProvider

        accumulated_text = []
        extracted_memories = []

        if isinstance(provider, GeminiProvider):
            async for event in provider.stream_conversation(content, system_prompt, history, user_id=user_id, db=self.db):
                if event.get("type") == "delta":
                    accumulated_text.append(event.get("content", ""))
                elif event.get("type") == "done":
                    extracted_memories = event.get("extracted_memories", [])
                    event["conversation_id"] = conv.id
                    if "provider" not in event:
                        event["provider"] = "Gemini 1.5 Flash"
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
            yield f"data: {json.dumps({'type': 'done', 'full_text': resp_text, 'extracted_memories': extracted, 'conversation_id': conv.id, 'provider': 'Offline Companion'})}\n\n"

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

