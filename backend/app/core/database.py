import logging
from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger("guideme.database")

Base = declarative_base()

from sqlalchemy.engine.url import make_url

# Determine effective database URL based on environment and connectivity
_effective_async_url = settings.DATABASE_URL
_effective_sync_url = settings.DATABASE_URL_SYNC

# Automatically synchronize sync URL if async URL points to a remote PostgreSQL server
if "localhost:5432" in _effective_sync_url and "localhost" not in _effective_async_url:
    try:
        _parsed = make_url(_effective_async_url)
        _effective_sync_url = _parsed.set(drivername="postgresql").render_as_string(hide_password=False)
    except Exception as e:
        logger.debug(f"Could not auto-derive sync database URL: {e}")

is_production = settings.ENVIRONMENT.lower() in ("production", "prod")
allow_sqlite_fallback = settings.DATABASE_FALLBACK_SQLITE and not is_production

if allow_sqlite_fallback:
    # Test if PostgreSQL is directly reachable
    try:
        test_engine = create_engine(
            _effective_sync_url,
            connect_args={"connect_timeout": 2} if "postgresql" in _effective_sync_url else {},
        )
        with test_engine.connect():
            pass
        logger.info("Successfully connected to primary PostgreSQL database.")
    except Exception as exc:
        logger.warning(
            f"PostgreSQL unreachable ({exc}). Falling back to local SQLite database: {settings.DATABASE_SQLITE_URL}"
        )
        _effective_async_url = settings.DATABASE_SQLITE_URL
        _effective_sync_url = settings.DATABASE_SQLITE_URL_SYNC
else:
    if is_production:
        logger.info("Production environment detected: SQLite fallback is strictly disabled.")
    else:
        logger.info("PostgreSQL SQLite fallback disabled by configuration.")

# Asynchronous engine & sessionmaker for FastAPI routes
async_engine = create_async_engine(
    _effective_async_url,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in _effective_async_url else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Synchronous engine & sessionmaker for migrations & seeders
sync_engine = create_engine(
    _effective_sync_url,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in _effective_sync_url else {},
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining an asynchronous database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_sync_db():
    """Context manager / utility for synchronous database operations (seeding, scripts)."""
    db = SyncSessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


async def init_db_tables():
    """Initializes tables asynchronously and applies incremental schema additions."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        if "sqlite" in _effective_async_url:
            def migrate_sqlite(sync_conn):
                from sqlalchemy import text
                cursor = sync_conn.connection.cursor()

                # Check wellness_metrics columns
                try:
                    cursor.execute("PRAGMA table_info(wellness_metrics)")
                    columns = [row[1] for row in cursor.fetchall()]
                    if columns:
                        if "calories_burned" not in columns:
                            sync_conn.execute(text("ALTER TABLE wellness_metrics ADD COLUMN calories_burned FLOAT DEFAULT 0.0"))
                        if "distance_km" not in columns:
                            sync_conn.execute(text("ALTER TABLE wellness_metrics ADD COLUMN distance_km FLOAT DEFAULT 0.0"))
                        if "sleep_stages" not in columns:
                            sync_conn.execute(text("ALTER TABLE wellness_metrics ADD COLUMN sleep_stages JSON"))
                        # ADD COLUMN leaves existing rows NULL, but the ORM declares this column
                        # NOT NULL with a dict default. Without this backfill the rows written
                        # before the column existed fail response validation and
                        # GET /wellness/metrics returns 500 for the whole collection.
                        sync_conn.execute(
                            text("UPDATE wellness_metrics SET sleep_stages = '{}' WHERE sleep_stages IS NULL")
                        )
                except Exception as e:
                    logger.debug(f"Wellness metrics column check error: {e}")

                # Check digital_wellbeing_metrics columns
                try:
                    cursor.execute("PRAGMA table_info(digital_wellbeing_metrics)")
                    dw_cols = [row[1] for row in cursor.fetchall()]
                    if dw_cols:
                        if "target_limit_minutes" not in dw_cols:
                            sync_conn.execute(text("ALTER TABLE digital_wellbeing_metrics ADD COLUMN target_limit_minutes INTEGER DEFAULT 300"))
                        if "categories" not in dw_cols:
                            sync_conn.execute(text("ALTER TABLE digital_wellbeing_metrics ADD COLUMN categories JSON"))
                        # Same backfill as wellness_metrics above: the column is NOT NULL in the
                        # ORM, so rows predating it must be given the dict default.
                        sync_conn.execute(
                            text("UPDATE digital_wellbeing_metrics SET categories = '{}' WHERE categories IS NULL")
                        )
                except Exception as e:
                    logger.debug(f"Digital wellbeing column check error: {e}")

            await conn.run_sync(migrate_sqlite)

        # Ensure default OCEAN Assessment and questions are seeded
        def ensure_default_assessment(sync_conn):
            from app.models.entities import Assessment, AssessmentQuestion
            from app.ml.ocean_engine import OceanBigFiveEngine
            from sqlalchemy.orm import Session

            sync_session = Session(sync_conn)
            try:
                existing = (
                    sync_session.query(Assessment)
                    .filter(Assessment.assessment_type == "ocean_big_five", Assessment.is_active == True)
                    .first()
                )
                if not existing:
                    logger.info("Auto-provisioning default Big Five OCEAN assessment and question bank...")
                    assessment = Assessment(
                        title="IPIP Big Five Factor Personality Inventory",
                        assessment_type="ocean_big_five",
                        version="1.0.0",
                        description="Validated 50-item psychometric inventory assessing Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.",
                        is_active=True,
                    )
                    sync_session.add(assessment)
                    sync_session.flush()

                    for idx, q_data in enumerate(OceanBigFiveEngine.QUESTIONS_DATA):
                        question = AssessmentQuestion(
                            assessment_id=assessment.id,
                            question_text=q_data["text"],
                            domain_trait=q_data["trait"],
                            reverse_scored=q_data["reverse"],
                            order_index=idx + 1,
                        )
                        sync_session.add(question)
                    sync_session.commit()
                    logger.info(f"Default Big Five Assessment provisioned with ID: {assessment.id}")
            except Exception as exc:
                sync_session.rollback()
                logger.warning(f"Default assessment provisioning notice: {exc}")
            finally:
                sync_session.close()

        await conn.run_sync(ensure_default_assessment)

