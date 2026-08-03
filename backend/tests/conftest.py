import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.config import settings as test_settings
from src.database import Base, get_db
from src.main import app

test_settings.environment = "test"
test_settings.meta_app_secret = "test_secret"
test_settings.supabase_url = ""
test_settings.supabase_service_role_key = ""

TEST_DATABASE_URL = "sqlite+aiosqlite://"


@pytest.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def mock_langchain_gemini():
    """
    Mock LangChain Gemini LLM and Embeddings to prevent real network calls
    to Google APIs during test runs.
    """
    from unittest.mock import AsyncMock, patch
    from langchain_core.messages import AIMessage

    mock_ai_message = AIMessage(content="مرحبا! كيف يمكنني مساعدتك؟")
    with patch("langchain_google_genai.ChatGoogleGenerativeAI.ainvoke", new_callable=AsyncMock) as mock_ainvoke, \
         patch("langchain_google_genai.GoogleGenerativeAIEmbeddings.aembed_documents", new_callable=AsyncMock) as mock_aembed_docs, \
         patch("langchain_google_genai.GoogleGenerativeAIEmbeddings.aembed_query", new_callable=AsyncMock) as mock_aembed_query:
        mock_ainvoke.return_value = mock_ai_message
        mock_aembed_docs.return_value = [[0.1] * 768]
        mock_aembed_query.return_value = [0.1] * 768
        yield {
            "ainvoke": mock_ainvoke,
            "aembed_documents": mock_aembed_docs,
            "aembed_query": mock_aembed_query,
        }

