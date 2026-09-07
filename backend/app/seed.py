import asyncio
import logging
from datetime import datetime, timezone, timedelta
from app.core.database import AsyncSessionLocal, init_db_tables
from app.core.security import get_password_hash
from app.models.entities import (
    User,
    UserProfile,
    UserConsent,
    Assessment,
    AssessmentQuestion,
    PersonalityResult,
    MoodEntry,
    StressObservation,
    Journal,
    JournalAnalysis,
    Goal,
    GoalMilestone,
    WellnessMetric,
    DigitalWellbeingMetric,
    EmergencyContact,
)
from app.ml.ocean_engine import OceanBigFiveEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("guideme.seed")


async def seed_database():
    logger.info("Initializing database tables for seeding...")
    await init_db_tables()

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        from sqlalchemy import select
        existing_user = await session.execute(select(User).where(User.email == "demo@guideme.com"))
        if existing_user.scalar_one_or_none():
            logger.info("Database already seeded with demo user.")
            return

        logger.info("Seeding demo user and profile...")
        demo_user = User(
            email="demo@guideme.com",
            hashed_password=get_password_hash("DemoUser123!"),
            role="user",
            is_active=True,
            is_verified=True,
        )
        session.add(demo_user)
        await session.flush()

        demo_profile = UserProfile(
            user_id=demo_user.id,
            full_name="Jordan Chen",
            preferred_name="Jordan",
            timezone="America/Los_Angeles",
            occupation="Systems Engineer & Design Thinker",
            bio="Passionate about intentional technology, sustainable routines, and outdoor mindfulness.",
        )
        demo_consent = UserConsent(
            user_id=demo_user.id,
            camera_consent=True,
            audio_consent=False,
            wearable_consent=True,
            memory_consent=True,
            typing_dynamics_consent=True,
            store_facial_data=False,
        )
        session.add_all([demo_profile, demo_consent])
        await session.flush()

        logger.info("Seeding Big Five OCEAN Assessment Question Bank...")
        assessment = Assessment(
            title="IPIP Big Five Factor Personality Inventory",
            assessment_type="ocean_big_five",
            version="1.0.0",
            description="Validated 50-item psychometric inventory assessing Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.",
            is_active=True,
        )
        session.add(assessment)
        await session.flush()

        for idx, q_data in enumerate(OceanBigFiveEngine.QUESTIONS_DATA):
            question = AssessmentQuestion(
                assessment_id=assessment.id,
                question_text=q_data["text"],
                domain_trait=q_data["trait"],
                reverse_scored=q_data["reverse"],
                order_index=idx + 1,
            )
            session.add(question)
        await session.flush()

        logger.info("Seeding baseline personality result for Jordan...")
        scores = {
            "openness": 78.0,
            "conscientiousness": 72.0,
            "extraversion": 45.0,
            "agreeableness": 82.0,
            "neuroticism": 32.0,
        }
        dominant, summary, careers = OceanBigFiveEngine.interpret_profile(scores)
        personality_res = PersonalityResult(
            user_id=demo_user.id,
            assessment_id=assessment.id,
            openness=scores["openness"],
            conscientiousness=scores["conscientiousness"],
            extraversion=scores["extraversion"],
            agreeableness=scores["agreeableness"],
            neuroticism=scores["neuroticism"],
            dominant_traits=dominant,
            analysis_summary=summary,
            career_strengths=careers,
        )
        session.add(personality_res)

        logger.info("Seeding historical mood & stress observations...")
        now = datetime.now(timezone.utc)
        for days_ago in range(7, -1, -1):
            date_time = now - timedelta(days=days_ago)
            date_str = date_time.strftime("%Y-%m-%d")

            mood = MoodEntry(
                user_id=demo_user.id,
                score=7.0 + (days_ago % 3) * 0.5,
                valence=0.4,
                arousal=0.5,
                energy_level="moderate" if days_ago % 2 == 0 else "high",
                tags=["work", "evening-walk", "focus"],
                note="Balanced day with productive focus and mindful breaks.",
                recorded_at=date_time,
            )
            stress = StressObservation(
                user_id=demo_user.id,
                score=28.0 + (days_ago * 2.5),
                confidence=0.88,
                risk_band="low" if days_ago > 3 else "moderate",
                evidence={"autonomic_hrv": "54ms", "sleep_quality": "82%"},
                source="multimodal",
                deviation_from_baseline=-0.2,
                recorded_at=date_time,
            )
            wellness = WellnessMetric(
                user_id=demo_user.id,
                metric_date=date_str,
                sleep_hours=7.4,
                sleep_quality_score=83.0,
                water_intake_ml=2200,
                step_count=8400 - (days_ago * 200),
                active_minutes=40,
                resting_heart_rate=63.0,
                hrv_ms=56.0,
            )
            digital = DigitalWellbeingMetric(
                user_id=demo_user.id,
                metric_date=date_str,
                total_screen_time_minutes=250 + (days_ago * 10),
                focus_time_minutes=130,
                notification_count=35,
                night_screen_minutes=20,
                pickup_count=45,
            )
            session.add_all([mood, stress, wellness, digital])

        logger.info("Seeding sample journal entries with AI reflections...")
        journal_1 = Journal(
            user_id=demo_user.id,
            title="Reflections on System Architecture and Focus",
            content="Today we wrapped up the initial design phase. I felt a slight wave of anxiety around deadline commitments, but taking a quiet 15-minute walk outside really restored my clarity. I realized that breaking things into small daily deliverables eliminates the feeling of overwhelm.",
            tags=["architecture", "mindfulness", "perspective"],
            mood_context="calm_focused",
            is_pinned=True,
        )
        session.add(journal_1)
        await session.flush()

        analysis_1 = JournalAnalysis(
            journal_id=journal_1.id,
            user_id=demo_user.id,
            sentiment_score=0.45,
            dominant_emotion="contentment & clarity",
            cognitive_distortions=[],
            topics=["career & work", "mental state"],
            reflection_prompt="Notice how reconnecting with nature and physical movement quickly restored your problem-solving capacity.",
            recommended_action="Schedule recurring 10-minute movement pauses between deep work blocks.",
        )
        session.add(analysis_1)

        logger.info("Seeding active goals...")
        goal_1 = Goal(
            user_id=demo_user.id,
            title="Cultivate Mindful Digital Boundaries",
            description="Limit late-night screen exposure and maintain consistent restorative sleep routines.",
            category="wellness",
            target_date=now + timedelta(days=30),
            progress_percentage=66,
            status="in_progress",
        )
        session.add(goal_1)
        await session.flush()

        m1 = GoalMilestone(goal_id=goal_1.id, title="Institute 10:00 PM digital screen curfew", is_completed=True, completed_at=now - timedelta(days=2))
        m2 = GoalMilestone(goal_id=goal_1.id, title="Log daily reflections for 7 consecutive days", is_completed=True, completed_at=now - timedelta(days=1))
        m3 = GoalMilestone(goal_id=goal_1.id, title="Maintain 7.5+ hours average sleep over two weeks", is_completed=False)
        session.add_all([m1, m2, m3])

        logger.info("Seeding safety emergency contact...")
        contact = EmergencyContact(
            user_id=demo_user.id,
            name="Morgan Vance",
            relationship="Trusted Mentor & Friend",
            phone_number="+1-555-0199",
            email="morgan.vance@example.com",
            notify_on_distress=False,
        )
        session.add(contact)

        await session.commit()
        logger.info("Database seeding completed successfully!")
        logger.info("Demo User Credentials: email='demo@guideme.com', password='DemoUser123!'")


if __name__ == "__main__":
    asyncio.run(seed_database())
