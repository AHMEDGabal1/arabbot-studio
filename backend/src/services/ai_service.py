from langchain_google_genai import ChatGoogleGenerativeAI

from src.config import settings

_fast_llm: ChatGoogleGenerativeAI | None = None
_full_llm: ChatGoogleGenerativeAI | None = None


def get_fast_llm() -> ChatGoogleGenerativeAI:
    global _fast_llm
    if _fast_llm is None:
        _fast_llm = ChatGoogleGenerativeAI(
            model=settings.gemini_model_fast,
            google_api_key=settings.google_api_key,
        )
    return _fast_llm


def get_full_llm() -> ChatGoogleGenerativeAI:
    global _full_llm
    if _full_llm is None:
        _full_llm = ChatGoogleGenerativeAI(
            model=settings.gemini_model_full,
            google_api_key=settings.google_api_key,
        )
    return _full_llm
