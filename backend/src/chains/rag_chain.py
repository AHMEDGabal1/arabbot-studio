from src.services.ai_service import get_full_llm

DEFAULT_SYSTEM_PROMPT = "You are a helpful Egyptian Arabic chatbot for a business. Respond in Egyptian colloquial Arabic (عامية مصرية)."


async def generate_response(
    question: str,
    context: str,
    system_prompt: str | None = None,
    customer_context: str | None = None,
) -> str:
    base_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT

    prompt_parts = [base_prompt]

    if customer_context:
        prompt_parts.append(f"\nCustomer Context:\n{customer_context}")

    prompt_parts.append(f"\nContext information:\n{context}")
    prompt_parts.append(f"\nUser question: {question}")
    prompt_parts.append("\nAnswer in Egyptian Arabic:")

    full_prompt = "\n".join(prompt_parts)

    llm = get_full_llm()
    response = await llm.ainvoke(full_prompt)
    return response.content.strip()
