import asyncio
import logging
from typing import Any
import httpx
from langchain_google_genai import ChatGoogleGenerativeAI

from src.config import settings

logger = logging.getLogger(__name__)


class LLMResponse:
    def __init__(self, content: str):
        self.content = content


class TokenRouterLLM:
    """Async & sync OpenAI-compatible Chat Model for TokenRouter (e.g. moonshotai/kimi-k3-free) with retry support."""

    def __init__(self, api_key: str, base_url: str, model: str, max_retries: int = 3, timeout: float = 60.0):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.max_retries = max_retries
        self.timeout = timeout

    def _prepare_messages(self, input_data: Any) -> list[dict[str, str]]:
        if isinstance(input_data, str):
            return [{"role": "user", "content": input_data}]
        if isinstance(input_data, list):
            messages = []
            for msg in input_data:
                if isinstance(msg, dict):
                    messages.append(msg)
                elif hasattr(msg, "type") and hasattr(msg, "content"):
                    role = "user"
                    if msg.type == "system":
                        role = "system"
                    elif msg.type in ("ai", "assistant"):
                        role = "assistant"
                    messages.append({"role": role, "content": msg.content})
                else:
                    messages.append({"role": "user", "content": str(msg)})
            return messages
        return [{"role": "user", "content": str(input_data)}]

    async def ainvoke(self, input_data: Any) -> LLMResponse:
        messages = self._prepare_messages(input_data)
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
        }

        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.post(url, headers=headers, json=payload)
                    res.raise_for_status()
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    return LLMResponse(content=content)
            except Exception as e:
                last_error = e
                logger.warning(f"TokenRouter API attempt {attempt}/{self.max_retries} failed: {e}")
                if attempt < self.max_retries:
                    await asyncio.sleep(1.0 * attempt)

        raise RuntimeError(f"TokenRouter API call failed after {self.max_retries} attempts: {last_error}")

    def invoke(self, input_data: Any) -> LLMResponse:
        messages = self._prepare_messages(input_data)
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
        }

        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    res = client.post(url, headers=headers, json=payload)
                    res.raise_for_status()
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    return LLMResponse(content=content)
            except Exception as e:
                last_error = e
                logger.warning(f"TokenRouter API attempt {attempt}/{self.max_retries} failed: {e}")
                if attempt < self.max_retries:
                    import time
                    time.sleep(1.0 * attempt)

        raise RuntimeError(f"TokenRouter API call failed after {self.max_retries} attempts: {last_error}")


_fast_llm: Any = None
_full_llm: Any = None


def get_fast_llm() -> Any:
    global _fast_llm
    if _fast_llm is None:
        if settings.llm_provider.lower() == "tokenrouter" and settings.tokenrouter_api_key:
            _fast_llm = TokenRouterLLM(
                api_key=settings.tokenrouter_api_key,
                base_url=settings.tokenrouter_base_url,
                model=settings.tokenrouter_model,
            )
        else:
            _fast_llm = ChatGoogleGenerativeAI(
                model=settings.gemini_model_fast,
                google_api_key=settings.google_api_key,
            )
    return _fast_llm


def get_full_llm() -> Any:
    global _full_llm
    if _full_llm is None:
        if settings.llm_provider.lower() == "tokenrouter" and settings.tokenrouter_api_key:
            _full_llm = TokenRouterLLM(
                api_key=settings.tokenrouter_api_key,
                base_url=settings.tokenrouter_base_url,
                model=settings.tokenrouter_model,
            )
        else:
            _full_llm = ChatGoogleGenerativeAI(
                model=settings.gemini_model_full,
                google_api_key=settings.google_api_key,
            )
    return _full_llm
