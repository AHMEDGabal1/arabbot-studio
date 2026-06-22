from src.services.ai_service import get_full_llm

PROMPT = """You are a helpful Egyptian Arabic chatbot for a business. Use the following context to answer the user's question. Respond in Egyptian colloquial Arabic (عامية مصرية).

Context information:
{context}

User question: {question}

Answer in Egyptian Arabic:"""


async def generate_response(question: str, context: str) -> str:
    llm = get_full_llm()
    response = await llm.ainvoke(PROMPT.format(question=question, context=context))
    return response.content.strip()
