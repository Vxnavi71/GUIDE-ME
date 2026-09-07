from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# =====================================================================
# Auth & User Schemas
# =====================================================================
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=150)
    preferred_name: Optional[str] = None
    occupation: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    full_name: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)


class UserProfileResponse(BaseModel):
    id: str
    email: str
    role: str
    full_name: str
    preferred_name: Optional[str]
    timezone: str
    occupation: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None
    timezone: Optional[str] = None
    occupation: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserConsentResponse(BaseModel):
    camera_consent: bool
    audio_consent: bool
    wearable_consent: bool
    memory_consent: bool
    typing_dynamics_consent: bool
    store_facial_data: bool
    consent_version: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserConsentUpdate(BaseModel):
    camera_consent: Optional[bool] = None
    audio_consent: Optional[bool] = None
    wearable_consent: Optional[bool] = None
    memory_consent: Optional[bool] = None
    typing_dynamics_consent: Optional[bool] = None
    store_facial_data: Optional[bool] = None


class AuditLogResponse(BaseModel):
    id: str
    action: str
    resource: str
    created_at: datetime
    details: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


# =====================================================================
# Personality & Assessment Schemas (OCEAN Big 5)
# =====================================================================
class AssessmentQuestionSchema(BaseModel):
    id: str
    question_text: str
    domain_trait: str
    reverse_scored: bool
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class AssessmentAnswerItem(BaseModel):
    question_id: str
    score_value: int = Field(..., ge=1, le=5)


class AssessmentSubmission(BaseModel):
    assessment_id: str
    answers: List[AssessmentAnswerItem]


class PersonalityResultResponse(BaseModel):
    id: str
    openness: float
    conscientiousness: float
    extraversion: float
    agreeableness: float
    neuroticism: float
    dominant_traits: List[str]
    analysis_summary: str
    career_strengths: Optional[List[str]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =====================================================================
# Mood & Stress Schemas
# =====================================================================
class MoodCreate(BaseModel):
    score: float = Field(..., ge=1.0, le=10.0)
    valence: float = Field(0.0, ge=-1.0, le=1.0)
    arousal: float = Field(0.5, ge=0.0, le=1.0)
    energy_level: str = "moderate"
    tags: List[str] = []
    note: Optional[str] = None


class MoodResponse(BaseModel):
    id: str
    score: float
    valence: float
    arousal: float
    energy_level: str
    tags: List[str]
    note: Optional[str]
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StressObservationResponse(BaseModel):
    id: str
    score: Optional[float] = None
    confidence: float = 0.0
    risk_band: Optional[str] = None
    evidence: Dict[str, Any] = {}
    source: str = "multimodal"
    deviation_from_baseline: Optional[float] = None
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DistressEventCreate(BaseModel):
    risk_level: str = "moderate"
    triggers: List[str] = []
    symptoms: List[str] = []


class DistressEventResponse(BaseModel):
    id: str
    risk_level: str
    triggers: List[str]
    symptoms: List[str]
    support_recommended: List[str]
    is_resolved: bool
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =====================================================================
# Journal Schemas
# =====================================================================
class JournalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    tags: List[str] = []
    mood_context: Optional[str] = None


class JournalUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    mood_context: Optional[str] = None
    is_pinned: Optional[bool] = None


class JournalAnalysisResponse(BaseModel):
    id: str
    sentiment_score: Optional[float] = None
    dominant_emotion: Optional[str] = None
    cognitive_distortions: List[str] = []
    topics: List[str] = []
    reflection_prompt: Optional[str] = None
    recommended_action: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JournalResponse(BaseModel):
    id: str
    title: str
    content: str
    tags: List[str]
    mood_context: Optional[str]
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    analysis: Optional[JournalAnalysisResponse] = None

    model_config = ConfigDict(from_attributes=True)


# =====================================================================
# AI Companion Schemas
# =====================================================================
class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    typing_dynamics: Optional[Dict[str, float]] = None


class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_role: str
    content: str
    metadata_json: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class MemoryItemResponse(BaseModel):
    id: str
    memory_type: str
    key: str
    content: str
    confidence: float
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ConversationCreate(BaseModel):
    title: Optional[str] = "Mindful Companion Dialogue"


class ActionConfirmationRequest(BaseModel):
    action_id: str


class ActionConfirmationResponse(BaseModel):
    status: str
    action_id: str
    tool: Optional[str] = None
    message: str
    result: Optional[Dict[str, Any]] = None


class MemoryCreate(BaseModel):
    memory_type: str = "preference"
    key: str
    content: str
    confidence: float = 0.9


class MemoryUpdate(BaseModel):
    content: Optional[str] = None
    is_active: Optional[bool] = None


# =====================================================================
# Goals Schemas
# =====================================================================
class MilestoneSchema(BaseModel):
    id: Optional[str] = None
    title: str
    is_completed: bool = False


class GoalCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category: str = "wellness"
    target_date: Optional[datetime] = None
    milestones: List[str] = []


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target_date: Optional[datetime] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[str] = None


class GoalResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    target_date: Optional[datetime]
    progress_percentage: int
    status: str
    created_at: datetime
    updated_at: datetime
    milestones: List[MilestoneSchema] = []

    model_config = ConfigDict(from_attributes=True)


# =====================================================================
# Habit Schemas
# =====================================================================
class HabitLogResponse(BaseModel):
    id: str
    habit_id: str
    date: str
    completed_count: int
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HabitCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category: str = "mindfulness"
    target_frequency: str = "daily"
    target_per_day: int = 1


class HabitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target_frequency: Optional[str] = None
    target_per_day: Optional[int] = None
    is_archived: Optional[bool] = None


class HabitResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    target_frequency: str
    target_per_day: int
    streak_count: int
    best_streak: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    completed_today: bool = False
    today_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# =====================================================================
# Wellness, Wearables & Digital Wellbeing Schemas
# =====================================================================
class WellnessMetricCreate(BaseModel):
    metric_date: str
    sleep_hours: float = 7.0
    sleep_quality_score: float = 80.0
    water_intake_ml: int = 2000
    step_count: int = 7500
    active_minutes: int = 30
    resting_heart_rate: float = 68.0
    hrv_ms: float = 52.0
    calories_burned: int = 2100
    distance_km: float = 5.4
    sleep_stages: Dict[str, float] = {}


class SleepSummaryResponse(BaseModel):
    metric_date: Optional[str] = None
    sleep_hours: Optional[float] = None
    target_sleep_hours: float = 8.0
    sleep_quality_score: Optional[float] = None
    consistency_percentage: Optional[int] = None
    stages: Dict[str, float] = {}
    trend_7d: List[Dict[str, Any]] = []
    stress_correlation_note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WellnessMetricResponse(BaseModel):
    id: str
    metric_date: str
    sleep_hours: Optional[float] = None
    sleep_quality_score: Optional[float] = None
    water_intake_ml: Optional[int] = None
    step_count: Optional[int] = None
    active_minutes: Optional[int] = None
    resting_heart_rate: Optional[float] = None
    hrv_ms: Optional[float] = None
    calories_burned: Optional[int] = None
    distance_km: Optional[float] = None
    sleep_stages: Dict[str, float] = {}
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WearableConnectionResponse(BaseModel):
    id: str
    provider: str
    is_connected: bool
    device_name: str
    last_sync_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class DigitalWellbeingUpdate(BaseModel):
    total_screen_time_minutes: Optional[int] = None
    focus_time_minutes: Optional[int] = None
    notification_count: Optional[int] = None
    night_screen_minutes: Optional[int] = None
    pickup_count: Optional[int] = None
    target_limit_minutes: Optional[int] = None
    categories: Optional[Dict[str, int]] = None


class DigitalWellbeingDayTrend(BaseModel):
    date: str
    day_name: str
    total_screen_time_minutes: int
    focus_time_minutes: int
    is_target_met: bool


class DigitalWellbeingResponse(BaseModel):
    id: Optional[str] = None
    metric_date: Optional[str] = None
    total_screen_time_minutes: Optional[int] = None
    focus_time_minutes: Optional[int] = None
    notification_count: Optional[int] = None
    night_screen_minutes: Optional[int] = None
    pickup_count: Optional[int] = None
    target_limit_minutes: int = 300
    categories: Dict[str, int] = {}
    provider_mode: str = "not_connected"
    weekly_trends: List[DigitalWellbeingDayTrend] = []

    model_config = ConfigDict(from_attributes=True)


class DashboardTrendPoint(BaseModel):
    day: str
    date: str
    mood: Optional[float] = None
    stress: Optional[float] = None


class DashboardSummaryResponse(BaseModel):
    user_name: str
    baseline_calibrated: bool = False
    stress_deviation: Optional[float] = None
    latest_mood: Optional[float] = None
    mood_label: Optional[str] = None
    stress_score: Optional[float] = None
    stress_risk_band: Optional[str] = None
    sleep_hours: Optional[float] = None
    sleep_target: float = 8.0
    hrv_ms: Optional[int] = None
    resting_hr: Optional[int] = None
    screen_time_hours: Optional[float] = None
    screen_time_target_hours: float = 5.0
    focus_time_hours: Optional[float] = None
    pickup_count: Optional[int] = None
    habits_completed_today: int = 0
    habits_total_today: int = 0
    habit_completion_rate: float = 0.0
    active_goals_count: int = 0
    trends_7d: List[DashboardTrendPoint] = []
    wearable_provider_mode: str = "not_connected"
    screen_provider_mode: str = "not_connected"



# =====================================================================
# Facial Analysis & Privacy
# =====================================================================
class FacialFramePayload(BaseModel):
    image_base64: str  # Base64 encoded JPEG/PNG frame from browser video feed
    client_timestamp: Optional[str] = None


class FacialSignalMetrics(BaseModel):
    smile_ratio: float
    brow_furrow_index: float
    eye_aperture: float
    head_pose_stability: float


class FacialAnalysisResponse(BaseModel):
    face_detected: bool = False
    detected_expression: str  # e.g., "Calm / Neutral", "No face detected"
    confidence: float
    signals: Optional[FacialSignalMetrics] = None
    probabilistic_disclaimer: str
    model_version: str
    analysis_timestamp: datetime


# =====================================================================
# Career Guidance
# =====================================================================
class CareerRecommendationResponse(BaseModel):
    path_title: str
    match_score: int
    alignment_reason: str
    key_strengths: List[str]
    growth_areas: List[str]
    learning_roadmap: List[str]


# =====================================================================
# Safety, Privacy & Recommendations
# =====================================================================
class EmergencyContactCreate(BaseModel):
    name: str
    relationship: str
    phone_number: str
    email: Optional[EmailStr] = None
    notify_on_distress: bool = False


class EmergencyContactResponse(BaseModel):
    id: str
    name: str
    relationship: str
    phone_number: str
    email: Optional[str]
    notify_on_distress: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecommendationResponse(BaseModel):
    id: str
    category: str
    title: str
    description: str
    reason: str
    priority: str
    confidence: float
    action_url: Optional[str]
    is_dismissed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
