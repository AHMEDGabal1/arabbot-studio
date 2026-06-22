from src.chains.dialect_normalizer import normalize_dialect
from src.chains.intent_handlers import (
    HUMAN_HANDOFF_FALLBACK,
    get_greeting_response,
)
from src.chains.intent_router import classify_intent
from src.chains.rag_chain import generate_response


async def process_message(text: str, knowledge_items: list[dict] | None = None) -> dict:
    normalized = await normalize_dialect(text)

    intent_result = await classify_intent(normalized)

    response_text = ""
    requires_human = False

    if intent_result.intent == "GREETING":
        response_text = get_greeting_response()
    elif intent_result.intent == "HUMAN_REQUEST":
        response_text = HUMAN_HANDOFF_FALLBACK
        requires_human = True
    elif intent_result.intent == "COMPLAINT":
        response_text = "آسفين على الإزعاج. هورينك شكوتك لفريقنا وهنتواصل معاك في أقرب وقت."
        requires_human = True
    else:
        context = ""
        if knowledge_items:
            context = "\n\n".join(
                f"Q: {k['question']}\nA: {k['answer']}"
                for k in knowledge_items if k.get("question")
            )
        if context:
            response_text = await generate_response(normalized, context)
        else:
            response_text = "شكراً لسؤالك! هحاول أساعدك بأفضل شكل ممكن."

    return {
        "intent": intent_result.intent,
        "confidence": intent_result.confidence,
        "response": response_text,
        "requires_human": requires_human,
        "normalized_text": normalized,
    }
