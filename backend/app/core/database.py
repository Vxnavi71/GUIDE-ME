import logging
from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger("guideme.database")

Base = declarative_base()

# Determine effective database URL based on environment and connectivity
_effective_async_url = settings.DATABASE_URL
_effective_sync_url = settings.DATABASE_URL_SYNC

if settings.DATABASE_FALLBACK_SQLITE:
    # Test if PostgreSQL is directly reachable
    try:
        test_engine = create_engine(
            settings.DATABASE_URL_SYNC,
            connect_args={"connect_timeout": 2} if "postgresql" in settings.DATABASE_URL_SYNC else {},
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
                except Exception as e:
                    logger.debug(f"Digital wellbeing column check error: {e}")

            await conn.run_sync(migrate_sqlite)

