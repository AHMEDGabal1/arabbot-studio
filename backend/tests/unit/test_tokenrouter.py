import pytest
from unittest.mock import AsyncMock, patch
from src.services.ai_service import TokenRouterLLM, get_fast_llm, get_full_llm
from src.config import settings


@pytest.mark.asyncio
async def test_tokenrouter_llm_messages_preparation():
    llm = TokenRouterLLM(
        api_key="test-key",
        base_url="https://api.tokenrouter.com/v1",
        model="moonshotai/kimi-k3-free",
    )
    msgs = llm._prepare_messages("Hello world")
    assert msgs == [{"role": "user", "content": "Hello world"}]


@pytest.mark.asyncio
async def test_tokenrouter_get_llm_instances():
    assert settings.llm_provider == "tokenrouter"
    fast_llm = get_fast_llm()
    full_llm = get_full_llm()
    assert isinstance(fast_llm, TokenRouterLLM)
    assert isinstance(full_llm, TokenRouterLLM)
    assert fast_llm.model == "moonshotai/kimi-k3-free"
    assert fast_llm.base_url == "https://api.tokenrouter.com/v1"
