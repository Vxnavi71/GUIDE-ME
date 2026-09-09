import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship as orm_relationship

from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# =====================================================================
# 1. User & Identity Management
# =====================================================================
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    profile = orm_relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    consent = orm_relationship("UserConsent", back_populates="user", uselist=False, cascade="all, delete-orphan")
    audit_logs = orm_relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    personality_results = orm_relationship("PersonalityResult", back_populates="user", cascade="all, delete-orphan")
    mood_entries = orm_relationship("MoodEntry", back_populates="user", cascade="all, delete-orphan")
    stress_observations = orm_relationship("StressObservation", back_populates="user", cascade="all, delete-orphan")
    distress_events = orm_relationship("DistressEvent", back_populates="user", cascade="all, delete-orphan")
    journals = orm_relationship("Journal", back_populates="user", cascade="all, delete-orphan")
    conversations = orm_relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    memories = orm_relationship("ConversationMemory", back_populates="user", cascade="all, delete-orphan")
    goals = orm_relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    habits = orm_relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    habit_logs = orm_relationship("HabitLog", back_populates="user", cascade="all, delete-orphan")
    wellness_metrics = orm_relationship("WellnessMetric", back_populates="user", cascade="all, delete-orphan")
    wearables = orm_relationship("WearableConnection", back_populates="user", cascade="all, delete-orphan")
    digital_wellbeing = orm_relationship("DigitalWellbeingMetric", back_populates="user", cascade="all, delete-orphan")
    behavioral_signals = orm_relationship("BehavioralSignal", back_populates="user", cascade="all, delete-orphan")
    recommendations = orm_relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    notifications = orm_relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    emergency_contacts = orm_relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan")
    safety_events = orm_relationship("SafetyEvent", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    preferred_name = Column(String(100), nullable=True)
    timezone = Column(String(50), default="UTC", nullable=False)
    occupation = Column(String(150), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="profile")


class UserConsent(Base):
    __tablename__ = "user_consents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    camera_consent = Column(Boolean, default=False, nullable=False)
    audio_consent = Column(Boolean, default=False, nullable=False)
    wearable_consent = Column(Boolean, default=False, nullable=False)
    memory_consent = Column(Boolean, default=True, nullable=False)
    typing_dynamics_consent = Column(Boolean, default=False, nullable=False)
    store_facial_data = Column(Boolean, default=False, nullable=False)
    consent_version = Column(String(20), default="1.0.0", nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="consent")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource = Column(String(100), nullable=False)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    user = orm_relationship("User", back_populates="audit_logs")


# =====================================================================
# 2. Personality & Assessments (Big Five / OCEAN)
# =====================================================================
class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    assessment_type = Column(String(50), default="ocean_big_five", nullable=False, index=True)
    version = Column(String(20), default="1.0.0", nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    questions = orm_relationship("AssessmentQuestion", back_populates="assessment", cascade="all, delete-orphan")


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    domain_trait = Column(String(50), nullable=False)  # openness, conscientiousness, extraversion, agreeableness, neuroticism
    reverse_scored = Column(Boolean, default=False, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)

    assessment = orm_relationship("Assessment", back_populates="questions")


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(36), ForeignKey("assessment_questions.id", ondelete="CASCADE"), nullable=False)
    score_value = Column(Integer, nullable=False)  # 1 to 5 Likert scale
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class PersonalityResult(Base):
    __tablename__ = "personality_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    openness = Column(Float, nullable=False)
    conscientiousness = Column(Float, nullable=False)
    extraversion = Column(Float, nullable=False)
    agreeableness = Column(Float, nullable=False)
    neuroticism = Column(Float, nullable=False)
    dominant_traits = Column(JSON, nullable=False)
    analysis_summary = Column(Text, nullable=False)
    career_strengths = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    user = orm_relationship("User", back_populates="personality_results")


# =====================================================================
# 3. Mood, Stress & Distress
# =====================================================================
class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, nullable=False)  # 1.0 (very low) to 10.0 (optimal)
    valence = Column(Float, default=0.0, nullable=False)  # -1.0 to +1.0
    arousal = Column(Float, default=0.0, nullable=False)  # 0.0 to 1.0
    energy_level = Column(String(50), default="moderate", nullable=False)
    tags = Column(JSON, default=list, nullable=False)
    note = Column(Text, nullable=True)
    recorded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    user = orm_relationship("User", back_populates="mood_entries")


class StressObservation(Base):
    __tablename__ = "stress_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, nullable=True)  # 0 to 100
    confidence = Column(Float, default=0.0, nullable=False)
    risk_band = Column(String(50), default="uncalibrated", nullable=True, index=True)  # low, moderate, elevated, critical
    evidence = Column(JSON, default=dict, nullable=False)
    source = Column(String(50), default="multimodal", nullable=False)  # multimodal, self_report, wearable, typing
    deviation_from_baseline = Column(Float, default=0.0, nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    user = orm_relationship("User", back_populates="stress_observations")


class DistressEvent(Base):
    __tablename__ = "distress_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_level = Column(String(50), nullable=False, index=True)  # mild, moderate, severe, acute
    triggers = Column(JSON, default=list, nullable=False)
    symptoms = Column(JSON, default=list, nullable=False)
    support_recommended = Column(JSON, default=list, nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    user = orm_relationship("User", back_populates="distress_events")


# =====================================================================
# 4. Journaling & Thought Reflection
# =====================================================================
class Journal(Base):
    __tablename__ = "journals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(JSON, default=list, nullable=False)
    mood_context = Column(String(50), nullable=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="journals")
    analysis = orm_relationship("JournalAnalysis", back_populates="journal", uselist=False, cascade="all, delete-orphan")


class JournalAnalysis(Base):
    __tablename__ = "journal_analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    journal_id = Column(String(36), ForeignKey("journals.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sentiment_score = Column(Float, nullable=True)  # -1.0 to +1.0
    dominant_emotion = Column(String(50), default="neutral", nullable=False)
    cognitive_distortions = Column(JSON, default=list, nullable=False)
    topics = Column(JSON, default=list, nullable=False)
    reflection_prompt = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    journal = orm_relationship("Journal", back_populates="analysis")


# =====================================================================
# 5. AI Companion, Conversation & Memory
# =====================================================================
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), default="Companion Discussion", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="conversations")
    messages = orm_relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ConversationMessage.created_at")


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_role = Column(String(50), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    conversation = orm_relationship("Conversation", back_populates="messages")


class ConversationMemory(Base):
    __tablename__ = "conversation_memories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    memory_type = Column(String(50), default="preference", nullable=False)  # preference, wellness_goal, stress_trigger, fact
    key = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    confidence = Column(Float, default=0.9, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="memories")


# =====================================================================
# 6. Goals & Milestones
# =====================================================================
class Goal(Base):
    __tablename__ = "goals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="wellness", nullable=False)  # wellness, career, habit, mindfulness, physical
    target_date = Column(DateTime(timezone=True), nullable=True)
    progress_percentage = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="in_progress", nullable=False)  # not_started, in_progress, completed, paused
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="goals")
    milestones = orm_relationship("GoalMilestone", back_populates="goal", cascade="all, delete-orphan")


class GoalMilestone(Base):
    __tablename__ = "goal_milestones"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    goal_id = Column(String(36), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    goal = orm_relationship("Goal", back_populates="milestones")


class Habit(Base):
    __tablename__ = "habits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="mindfulness", nullable=False)  # mindfulness, physical, digital_detox, sleep, learning
    target_frequency = Column(String(50), default="daily", nullable=False)  # daily, weekly
    target_per_day = Column(Integer, default=1, nullable=False)
    streak_count = Column(Integer, default=0, nullable=False)
    best_streak = Column(Integer, default=0, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="habits")
    logs = orm_relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    habit_id = Column(String(36), ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    completed_count = Column(Integer, default=1, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    habit = orm_relationship("Habit", back_populates="logs")
    user = orm_relationship("User", back_populates="habit_logs")


# =====================================================================
# 7. Wellness, Wearables & Digital Wellbeing
# =====================================================================
class WellnessMetric(Base):
    __tablename__ = "wellness_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    sleep_hours = Column(Float, default=7.0, nullable=False)
    sleep_quality_score = Column(Float, default=80.0, nullable=False)  # 0 to 100
    water_intake_ml = Column(Integer, default=2000, nullable=False)
    step_count = Column(Integer, default=7500, nullable=False)
    active_minutes = Column(Integer, default=30, nullable=False)
    resting_heart_rate = Column(Float, default=68.0, nullable=False)
    hrv_ms = Column(Float, default=52.0, nullable=False)  # Heart Rate Variability
    calories_burned = Column(Integer, default=2100, nullable=False)
    distance_km = Column(Float, default=5.4, nullable=False)
    sleep_stages = Column(JSON, default=dict, nullable=False)  # {"deep": 1.5, "rem": 1.8, "light": 3.8, "awake": 0.4}
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="wellness_metrics")


class WearableConnection(Base):
    __tablename__ = "wearable_connections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)  # mock, fitbit, apple_health, google_fit
    is_connected = Column(Boolean, default=False, nullable=False)
    device_name = Column(String(100), default="Standard Tracker", nullable=False)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="wearables")


class DigitalWellbeingMetric(Base):
    __tablename__ = "digital_wellbeing_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    total_screen_time_minutes = Column(Integer, default=240, nullable=False)
    focus_time_minutes = Column(Integer, default=120, nullable=False)
    notification_count = Column(Integer, default=45, nullable=False)
    night_screen_minutes = Column(Integer, default=35, nullable=False)
    pickup_count = Column(Integer, default=55, nullable=False)
    target_limit_minutes = Column(Integer, default=300, nullable=False)
    categories = Column(JSON, default=dict, nullable=False)  # {"productive": 120, "communication": 60, "entertainment_distraction": 75, "utility": 20}
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="digital_wellbeing")


class BehavioralSignal(Base):
    __tablename__ = "behavioral_signals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    signal_type = Column(String(50), default="typing_dynamics", nullable=False)
    typing_speed_wpm = Column(Float, default=55.0, nullable=False)
    backspace_rate = Column(Float, default=0.08, nullable=False)
    pause_frequency = Column(Float, default=0.15, nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="behavioral_signals")


# =====================================================================
# 8. Recommendations, Safety & Notifications
# =====================================================================
class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # wellness, focus, sleep, career, mindfulness
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    evidence = Column(JSON, default=dict, nullable=False)
    priority = Column(String(20), default="medium", nullable=False)  # low, medium, high
    confidence = Column(Float, default=0.88, nullable=False)
    action_url = Column(String(255), nullable=True)
    is_dismissed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="recommendations")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="general", nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="notifications")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    relationship = Column(String(100), nullable=False)
    phone_number = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    notify_on_distress = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="emergency_contacts")


class SafetyEvent(Base):
    __tablename__ = "safety_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    severity = Column(String(50), nullable=False)  # low, moderate, urgent, emergency
    event_type = Column(String(100), nullable=False)  # crisis_keyword, distress_spike, manual_alert
    details = Column(JSON, default=dict, nullable=False)
    support_displayed = Column(JSON, default=list, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = orm_relationship("User", back_populates="safety_events")
