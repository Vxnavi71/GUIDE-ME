import os
import sys
import pytest
import pytest_asyncio

# Ensure backend root is always first in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import init_db_tables


@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_test_database():
    """Initializes tables before running test sessions."""
    await init_db_tables()
