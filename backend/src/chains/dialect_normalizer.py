from src.services.ai_service import get_fast_llm

PROMPT = """You are an Egyptian Arabic dialect normalizer. Convert the following user message into a standardized form suitable for intent classification. Preserve the meaning but normalize slang, dialectal variations, and spelling inconsistencies.

User message: {text}

Return only the normalized text, nothing else."""


async def normalize_dialect(text: str) -> str:
    llm = get_fast_llm()
    response = await llm.ainvoke(PROMPT.format(text=text))
    return response.content.strip()
