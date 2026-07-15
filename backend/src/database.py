from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from src.config import settings

is_supabase = "supabase.co" in settings.database_url or "pooler.supabase" in settings.database_url
connect_args = {}
if is_supabase:
    connect_args = {"ssl": "require", "statement_cache_size": 0}
engine = create_async_engine(settings.database_url, echo=settings.environment == "development", connect_args=connect_args)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """Yield a database session. Callers must explicitly commit writes.
    IMPORTANT: Auto-commit was removed to prevent silent data loss on
    IntegrityErrors raised during post-response cleanup."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
