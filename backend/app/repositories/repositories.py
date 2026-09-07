from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import select, update, delete, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.entities import (
    User,
    UserProfile,
    UserConsent,
    AuditLog,
    Assessment,
    AssessmentQuestion,
    AssessmentAnswer,
    PersonalityResult,
    MoodEntry,
    StressObservation,
    DistressEvent,
    Journal,
    JournalAnalysis,
    Conversation,
    ConversationMessage,
    ConversationMemory,
    Goal,
    GoalMilestone,
    Habit,
    HabitLog,
    WellnessMetric,
    WearableConnection,
    DigitalWellbeingMetric,
    BehavioralSignal,
    Recommendation,
    Notification,
    EmergencyContact,
    SafetyEvent,
)


class BaseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db


class UserRepository(BaseRepository):
    async def get_by_id(self, user_id: str) -> Optional[User]:
        stmt = (
            select(User)
            .options(selectinload(User.profile), selectinload(User.consent))
            .where(User.id == user_id)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = (
            select(User)
            .options(selectinload(User.profile), selectinload(User.consent))
            .where(User.email == email.lower().strip())
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def create_user(
        self,
        email: str,
        hashed_password: str,
        full_name: str,
        preferred_name: Optional[str] = None,
        occupation: Optional[str] = None,
        role: str = "user",
    ) -> User:
        user = User(
            email=email.lower().strip(),
            hashed_password=hashed_password,
            role=role,
            is_active=True,
            is_verified=True,
        )
        self.db.add(user)
        await self.db.flush()

        profile = UserProfile(
            user_id=user.id,
            full_name=full_name,
            preferred_name=preferred_name or full_name.split()[0],
            occupation=occupation,
        )
        consent = UserConsent(
            user_id=user.id,
            camera_consent=False,
            memory_consent=True,
            wearable_consent=False,
        )
        self.db.add_all([profile, consent])
        await self.db.flush()
        return user

    async def update_profile(self, user_id: str, updates: Dict[str, Any]) -> Optional[UserProfile]:
        stmt = select(UserProfile).where(UserProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        profile = res.scalar_one_or_none()
        if profile:
            for k, v in updates.items():
                if v is not None and hasattr(profile, k):
                    setattr(profile, k, v)
            await self.db.flush()
        return profile

    async def update_consent(self, user_id: str, updates: Dict[str, Any]) -> Optional[UserConsent]:
        stmt = select(UserConsent).where(UserConsent.user_id == user_id)
        res = await self.db.execute(stmt)
        consent = res.scalar_one_or_none()
        if consent:
            for k, v in updates.items():
                if v is not None and hasattr(consent, k):
                    setattr(consent, k, v)
            await self.db.flush()
        return consent


class JournalRepository(BaseRepository):
    async def list_by_user(self, user_id: str, limit: int = 50) -> List[Journal]:
        stmt = (
            select(Journal)
            .options(selectinload(Journal.analysis))
            .where(Journal.user_id == user_id)
            .order_by(desc(Journal.created_at))
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_by_id(self, journal_id: str, user_id: str) -> Optional[Journal]:
        # Strict IDOR check: must match journal_id AND user_id
        stmt = (
            select(Journal)
            .options(selectinload(Journal.analysis))
            .where(Journal.id == journal_id, Journal.user_id == user_id)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def create(self, user_id: str, title: str, content: str, tags: List[str], mood_context: Optional[str]) -> Journal:
        journal = Journal(
            user_id=user_id,
            title=title,
            content=content,
            tags=tags,
            mood_context=mood_context,
        )
        self.db.add(journal)
        await self.db.flush()
        return journal

    async def attach_analysis(
        self,
        journal_id: str,
        user_id: str,
        sentiment_score: Optional[float],
        dominant_emotion: str,
        cognitive_distortions: List[str],
        topics: List[str],
        reflection_prompt: Optional[str],
        recommended_action: Optional[str],
    ) -> JournalAnalysis:
        analysis = JournalAnalysis(
            journal_id=journal_id,
            user_id=user_id,
            sentiment_score=sentiment_score,
            dominant_emotion=dominant_emotion,
            cognitive_distortions=cognitive_distortions,
            topics=topics,
            reflection_prompt=reflection_prompt,
            recommended_action=recommended_action,
        )
        self.db.add(analysis)
        await self.db.flush()
        return analysis

    async def delete(self, journal_id: str, user_id: str) -> bool:
        stmt = select(Journal).where(Journal.id == journal_id, Journal.user_id == user_id)
        res = await self.db.execute(stmt)
        item = res.scalar_one_or_none()
        if item:
            await self.db.delete(item)
            await self.db.flush()
            return True
        return False


class AssessmentRepository(BaseRepository):
    async def get_default_assessment(self) -> Optional[Assessment]:
        stmt = (
            select(Assessment)
            .options(selectinload(Assessment.questions))
            .where(Assessment.assessment_type == "ocean_big_five", Assessment.is_active == True)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_latest_result(self, user_id: str) -> Optional[PersonalityResult]:
        stmt = (
            select(PersonalityResult)
            .where(PersonalityResult.user_id == user_id)
            .order_by(desc(PersonalityResult.created_at))
            .limit(1)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def save_result(
        self,
        user_id: str,
        assessment_id: str,
        scores: Dict[str, float],
        dominant_traits: List[str],
        analysis_summary: str,
        career_strengths: List[str],
    ) -> PersonalityResult:
        result = PersonalityResult(
            user_id=user_id,
            assessment_id=assessment_id,
            openness=scores.get("openness", 50.0),
            conscientiousness=scores.get("conscientiousness", 50.0),
            extraversion=scores.get("extraversion", 50.0),
            agreeableness=scores.get("agreeableness", 50.0),
            neuroticism=scores.get("neuroticism", 50.0),
            dominant_traits=dominant_traits,
            analysis_summary=analysis_summary,
            career_strengths=career_strengths,
        )
        self.db.add(result)
        await self.db.flush()
        return result


class MoodStressRepository(BaseRepository):
    async def log_mood(
        self,
        user_id: str,
        score: float,
        valence: float,
        arousal: float,
        energy_level: str,
        tags: List[str],
        note: Optional[str],
    ) -> MoodEntry:
        entry = MoodEntry(
            user_id=user_id,
            score=score,
            valence=valence,
            arousal=arousal,
            energy_level=energy_level,
            tags=tags,
            note=note,
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def list_moods(self, user_id: str, limit: int = 30) -> List[MoodEntry]:
        stmt = (
            select(MoodEntry)
            .where(MoodEntry.user_id == user_id)
            .order_by(desc(MoodEntry.recorded_at))
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def log_stress(
        self,
        user_id: str,
        score: Optional[float],
        confidence: float,
        risk_band: Optional[str],
        evidence: Dict[str, Any],
        source: str,
        deviation_from_baseline: Optional[float],
    ) -> StressObservation:
        obs = StressObservation(
            user_id=user_id,
            score=score,
            confidence=confidence,
            risk_band=risk_band,
            evidence=evidence,
            source=source,
            deviation_from_baseline=deviation_from_baseline,
        )
        self.db.add(obs)
        await self.db.flush()
        return obs

    async def get_recent_stress_scores(self, user_id: str, limit: int = 14) -> List[float]:
        stmt = (
            select(StressObservation.score)
            .where(StressObservation.user_id == user_id)
            .order_by(desc(StressObservation.recorded_at))
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_latest_stress(self, user_id: str) -> Optional[StressObservation]:
        stmt = (
            select(StressObservation)
            .where(StressObservation.user_id == user_id)
            .order_by(desc(StressObservation.recorded_at))
            .limit(1)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def list_recent_stress_observations(self, user_id: str, limit: int = 14) -> List[StressObservation]:
        stmt = (
            select(StressObservation)
            .where(StressObservation.user_id == user_id)
            .order_by(desc(StressObservation.recorded_at))
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def log_distress(
        self,
        user_id: str,
        risk_level: str,
        triggers: List[str],
        symptoms: List[str],
        support_recommended: List[str],
    ) -> DistressEvent:
        event = DistressEvent(
            user_id=user_id,
            risk_level=risk_level,
            triggers=triggers,
            symptoms=symptoms,
            support_recommended=support_recommended,
            is_resolved=False,
        )
        self.db.add(event)
        await self.db.flush()
        return event


class ConversationRepository(BaseRepository):
    async def get_or_create_active_conversation(self, user_id: str) -> Conversation:
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.updated_at))
            .limit(1)
        )
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            conv = Conversation(user_id=user_id, title="Mindful Companion Dialogue")
            self.db.add(conv)
            await self.db.flush()
            # re-query with options
            stmt = select(Conversation).options(selectinload(Conversation.messages)).where(Conversation.id == conv.id)
            res = await self.db.execute(stmt)
            conv = res.scalar_one()
        return conv

    async def add_message(
        self,
        conversation_id: str,
        user_id: str,
        sender_role: str,
        content: str,
        metadata_json: Optional[Dict[str, Any]] = None,
    ) -> ConversationMessage:
        msg = ConversationMessage(
            conversation_id=conversation_id,
            user_id=user_id,
            sender_role=sender_role,
            content=content,
            metadata_json=metadata_json or {},
        )
        self.db.add(msg)
        await self.db.flush()
        return msg

    async def list_memories(self, user_id: str) -> List[ConversationMemory]:
        stmt = (
            select(ConversationMemory)
            .where(ConversationMemory.user_id == user_id, ConversationMemory.is_active == True)
            .order_by(desc(ConversationMemory.created_at))
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def add_memory(self, user_id: str, memory_type: str, key: str, content: str, confidence: float = 0.9) -> ConversationMemory:
        mem = ConversationMemory(
            user_id=user_id,
            memory_type=memory_type,
            key=key,
            content=content,
            confidence=confidence,
            is_active=True,
        )
        self.db.add(mem)
        await self.db.flush()
        return mem

    async def delete_memory(self, memory_id: str, user_id: str) -> bool:
        stmt = select(ConversationMemory).where(ConversationMemory.id == memory_id, ConversationMemory.user_id == user_id)
        res = await self.db.execute(stmt)
        mem = res.scalar_one_or_none()
        if mem:
            await self.db.delete(mem)
            await self.db.flush()
            return True
        return False

    async def list_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.updated_at))
        )
        res = await self.db.execute(stmt)
        convs = list(res.scalars().all())
        return [
            {
                "id": c.id,
                "title": c.title,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
                "message_count": len(c.messages),
            }
            for c in convs
        ]

    async def create_conversation(self, user_id: str, title: Optional[str] = None) -> Conversation:
        conv = Conversation(user_id=user_id, title=title or "Mindful Companion Dialogue")
        self.db.add(conv)
        await self.db.flush()
        stmt = select(Conversation).options(selectinload(Conversation.messages)).where(Conversation.id == conv.id)
        res = await self.db.execute(stmt)
        return res.scalar_one()

    async def get_conversation_by_id(self, conversation_id: str, user_id: str) -> Optional[Conversation]:
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id, Conversation.user_id == user_id)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user_id)
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            return False
        await self.db.delete(conv)
        await self.db.flush()
        return True

    async def update_memory(
        self,
        memory_id: str,
        user_id: str,
        content: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[ConversationMemory]:
        stmt = select(ConversationMemory).where(ConversationMemory.id == memory_id, ConversationMemory.user_id == user_id)
        res = await self.db.execute(stmt)
        mem = res.scalar_one_or_none()
        if not mem:
            return None
        if content is not None:
            mem.content = content
        if is_active is not None:
            mem.is_active = is_active
        await self.db.flush()
        return mem

    async def clear_messages(self, conversation_id: str, user_id: str) -> bool:
        stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user_id)
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            return False

        del_stmt = delete(ConversationMessage).where(
            ConversationMessage.conversation_id == conversation_id,
            ConversationMessage.user_id == user_id
        )
        await self.db.execute(del_stmt)
        await self.db.flush()
        return True



class GoalRepository(BaseRepository):
    async def list_by_user(self, user_id: str) -> List[Goal]:
        stmt = (
            select(Goal)
            .options(selectinload(Goal.milestones))
            .where(Goal.user_id == user_id)
            .order_by(desc(Goal.created_at))
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def create(
        self,
        user_id: str,
        title: str,
        description: Optional[str],
        category: str,
        target_date: Optional[datetime],
        milestones: List[str],
    ) -> Goal:
        goal = Goal(
            user_id=user_id,
            title=title,
            description=description,
            category=category,
            target_date=target_date,
            progress_percentage=0,
            status="in_progress",
        )
        self.db.add(goal)
        await self.db.flush()

        for m_title in milestones:
            if m_title.strip():
                ms = GoalMilestone(goal_id=goal.id, title=m_title.strip(), is_completed=False)
                self.db.add(ms)
        await self.db.flush()
        return await self.get_by_id(goal.id, user_id)

    async def toggle_milestone(self, milestone_id: str, user_id: str) -> Optional[Goal]:
        stmt = (
            select(GoalMilestone)
            .join(Goal)
            .where(GoalMilestone.id == milestone_id, Goal.user_id == user_id)
        )
        res = await self.db.execute(stmt)
        ms = res.scalar_one_or_none()
        if ms:
            ms.is_completed = not ms.is_completed
            ms.completed_at = datetime.now(timezone.utc) if ms.is_completed else None
            await self.db.flush()

            # Recalculate goal progress
            goal_stmt = select(Goal).options(selectinload(Goal.milestones)).where(Goal.id == ms.goal_id)
            goal_res = await self.db.execute(goal_stmt)
            goal = goal_res.scalar_one()
            total = len(goal.milestones)
            if total > 0:
                completed = sum(1 for m in goal.milestones if m.is_completed)
                goal.progress_percentage = int((completed / total) * 100)
                if goal.progress_percentage == 100:
                    goal.status = "completed"
            await self.db.flush()
            return goal
        return None

    async def get_by_id(self, goal_id: str, user_id: str) -> Optional[Goal]:
        stmt = (
            select(Goal)
            .options(selectinload(Goal.milestones))
            .where(Goal.id == goal_id, Goal.user_id == user_id)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def update(self, goal_id: str, user_id: str, data: Dict[str, Any]) -> Optional[Goal]:
        goal = await self.get_by_id(goal_id, user_id)
        if not goal:
            return None
        for k, v in data.items():
            if v is not None and hasattr(goal, k):
                setattr(goal, k, v)
        await self.db.flush()
        return goal

    async def delete(self, goal_id: str, user_id: str) -> bool:
        goal = await self.get_by_id(goal_id, user_id)
        if not goal:
            return False
        await self.db.delete(goal)
        await self.db.flush()
        return True


class HabitRepository(BaseRepository):
    async def list_by_user(self, user_id: str, today_str: Optional[str] = None) -> List[Dict[str, Any]]:
        if not today_str:
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        stmt = (
            select(Habit)
            .options(selectinload(Habit.logs))
            .where(Habit.user_id == user_id, Habit.is_archived == False)
            .order_by(desc(Habit.created_at))
        )
        res = await self.db.execute(stmt)
        habits = list(res.scalars().all())

        results = []
        for h in habits:
            today_log = next((l for l in h.logs if l.date == today_str), None)
            completed_today = (today_log.completed_count >= h.target_per_day) if today_log else False
            today_count = today_log.completed_count if today_log else 0
            results.append({
                "id": h.id,
                "title": h.title,
                "description": h.description,
                "category": h.category,
                "target_frequency": h.target_frequency,
                "target_per_day": h.target_per_day,
                "streak_count": h.streak_count,
                "best_streak": h.best_streak,
                "is_archived": h.is_archived,
                "created_at": h.created_at,
                "updated_at": h.updated_at,
                "completed_today": completed_today,
                "today_count": today_count,
            })
        return results

    async def get_by_id(self, habit_id: str, user_id: str) -> Optional[Habit]:
        stmt = (
            select(Habit)
            .options(selectinload(Habit.logs))
            .where(Habit.id == habit_id, Habit.user_id == user_id)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def create(
        self,
        user_id: str,
        title: str,
        description: Optional[str],
        category: str,
        target_frequency: str = "daily",
        target_per_day: int = 1,
    ) -> Habit:
        habit = Habit(
            user_id=user_id,
            title=title,
            description=description,
            category=category,
            target_frequency=target_frequency,
            target_per_day=target_per_day,
            streak_count=0,
            best_streak=0,
        )
        self.db.add(habit)
        await self.db.flush()
        return habit

    async def update(self, habit_id: str, user_id: str, data: Dict[str, Any]) -> Optional[Habit]:
        habit = await self.get_by_id(habit_id, user_id)
        if not habit:
            return None
        for k, v in data.items():
            if v is not None and hasattr(habit, k):
                setattr(habit, k, v)
        await self.db.flush()
        return habit

    async def delete(self, habit_id: str, user_id: str) -> bool:
        habit = await self.get_by_id(habit_id, user_id)
        if not habit:
            return False
        await self.db.delete(habit)
        await self.db.flush()
        return True

    async def toggle_completion(self, habit_id: str, user_id: str, date_str: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not date_str:
            date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        habit = await self.get_by_id(habit_id, user_id)
        if not habit:
            return None

        log_stmt = select(HabitLog).where(
            HabitLog.habit_id == habit_id,
            HabitLog.user_id == user_id,
            HabitLog.date == date_str
        )
        res = await self.db.execute(log_stmt)
        log = res.scalar_one_or_none()

        if log:
            # If already completed or logged, toggle back to 0 or delete
            if log.completed_count >= habit.target_per_day:
                await self.db.delete(log)
                if habit.streak_count > 0:
                    habit.streak_count -= 1
                await self.db.flush()
                completed_today = False
                today_count = 0
            else:
                log.completed_count += 1
                if log.completed_count >= habit.target_per_day:
                    habit.streak_count += 1
                    if habit.streak_count > habit.best_streak:
                        habit.best_streak = habit.streak_count
                await self.db.flush()
                completed_today = (log.completed_count >= habit.target_per_day)
                today_count = log.completed_count
        else:
            # Create first log for date
            log = HabitLog(
                habit_id=habit_id,
                user_id=user_id,
                date=date_str,
                completed_count=1,
            )
            self.db.add(log)
            if log.completed_count >= habit.target_per_day:
                habit.streak_count += 1
                if habit.streak_count > habit.best_streak:
                    habit.best_streak = habit.streak_count
            await self.db.flush()
            completed_today = (log.completed_count >= habit.target_per_day)
            today_count = log.completed_count

        return {
            "id": habit.id,
            "title": habit.title,
            "description": habit.description,
            "category": habit.category,
            "target_frequency": habit.target_frequency,
            "target_per_day": habit.target_per_day,
            "streak_count": habit.streak_count,
            "best_streak": habit.best_streak,
            "is_archived": habit.is_archived,
            "created_at": habit.created_at,
            "updated_at": habit.updated_at,
            "completed_today": completed_today,
            "today_count": today_count,
        }


class WellnessRepository(BaseRepository):
    async def get_today_metric(self, user_id: str, date_str: str) -> Optional[WellnessMetric]:
        stmt = select(WellnessMetric).where(WellnessMetric.user_id == user_id, WellnessMetric.metric_date == date_str)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def log_metric(self, user_id: str, metric_data: Dict[str, Any]) -> WellnessMetric:
        date_str = metric_data.get("metric_date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        metric = await self.get_today_metric(user_id, date_str)
        if not metric:
            metric = WellnessMetric(user_id=user_id, metric_date=date_str)
            self.db.add(metric)

        for k, v in metric_data.items():
            if hasattr(metric, k) and v is not None:
                setattr(metric, k, v)
        await self.db.flush()
        return metric

    async def list_recent_metrics(self, user_id: str, limit: int = 14) -> List[WellnessMetric]:
        stmt = (
            select(WellnessMetric)
            .where(WellnessMetric.user_id == user_id)
            .order_by(desc(WellnessMetric.metric_date))
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_digital_wellbeing(self, user_id: str, date_str: str) -> Optional[DigitalWellbeingMetric]:
        stmt = select(DigitalWellbeingMetric).where(
            DigitalWellbeingMetric.user_id == user_id,
            DigitalWellbeingMetric.metric_date == date_str
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def log_digital_wellbeing(self, user_id: str, data: Dict[str, Any]) -> DigitalWellbeingMetric:
        date_str = data.get("metric_date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        metric = await self.get_digital_wellbeing(user_id, date_str)
        if not metric:
            metric = DigitalWellbeingMetric(
                user_id=user_id,
                metric_date=date_str,
                total_screen_time_minutes=data.get("total_screen_time_minutes", 240),
                focus_time_minutes=data.get("focus_time_minutes", 120),
                notification_count=data.get("notification_count", 45),
                night_screen_minutes=data.get("night_screen_minutes", 30),
                pickup_count=data.get("pickup_count", 50),
                target_limit_minutes=data.get("target_limit_minutes", 300),
                categories=data.get("categories", {
                    "productive": 120,
                    "communication": 60,
                    "entertainment_distraction": 75,
                    "utility": 25,
                }),
            )
            self.db.add(metric)
        else:
            for k, v in data.items():
                if hasattr(metric, k) and v is not None:
                    setattr(metric, k, v)
        await self.db.flush()
        return metric

    async def list_recent_digital_wellbeing(self, user_id: str, limit: int = 7) -> List[DigitalWellbeingMetric]:
        stmt = (
            select(DigitalWellbeingMetric)
            .where(DigitalWellbeingMetric.user_id == user_id)
            .order_by(desc(DigitalWellbeingMetric.metric_date))
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())


class SafetyRepository(BaseRepository):
    async def list_emergency_contacts(self, user_id: str) -> List[EmergencyContact]:
        stmt = select(EmergencyContact).where(EmergencyContact.user_id == user_id)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def add_emergency_contact(
        self,
        user_id: str,
        name: str,
        relationship: str,
        phone_number: str,
        email: Optional[str] = None,
        notify_on_distress: bool = False,
    ) -> EmergencyContact:
        contact = EmergencyContact(
            user_id=user_id,
            name=name,
            relationship=relationship,
            phone_number=phone_number,
            email=email,
            notify_on_distress=notify_on_distress,
        )
        self.db.add(contact)
        await self.db.flush()
        return contact

    async def log_safety_event(
        self,
        user_id: str,
        severity: str,
        event_type: str,
        details: Dict[str, Any],
        support_displayed: List[str],
    ) -> SafetyEvent:
        event = SafetyEvent(
            user_id=user_id,
            severity=severity,
            event_type=event_type,
            details=details,
            support_displayed=support_displayed,
        )
        self.db.add(event)
        await self.db.flush()
        return event


class AuditRepository(BaseRepository):
    async def log_action(
        self,
        user_id: Optional[str],
        action: str,
        resource: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        audit = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
        )
        self.db.add(audit)
        await self.db.flush()
        return audit
