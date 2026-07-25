from sqlalchemy.ext.asyncio import AsyncSession

from src.chains.dialect_normalizer import normalize_dialect
from src.chains.intent_handlers import (
    HUMAN_HANDOFF_FALLBACK,
    get_greeting_response,
)
from src.chains.intent_router import classify_intent
from src.chains.rag_chain import generate_response
from src.services.agent_routing_service import get_agent_for_intent
from src.services.guardrail_service import validate_response


async def process_message(
    text: str,
    knowledge_items: list[dict] | None = None,
    bot_id: str | None = None,
    db: AsyncSession | None = None,
    customer_context: str | None = None,
) -> dict:
    normalized = await normalize_dialect(text)
    intent_result = await classify_intent(normalized)

    response_text = ""
    requires_human = False
    agent_type = "default"
    specialist_system_prompt = None

    # Step 1: Check for specialist agent routing if db and bot_id are provided
    if bot_id and db:
        specialist_agent = await get_agent_for_intent(db, bot_id, intent_result.intent)
        if specialist_agent:
            agent_type = specialist_agent.agent_type
            specialist_system_prompt = specialist_agent.system_prompt

    # Step 2: Generate base response according to intent or RAG
    if intent_result.intent == "GREETING":
        response_text = get_greeting_response()
    elif intent_result.intent == "HUMAN_REQUEST":
        response_text = HUMAN_HANDOFF_FALLBACK
        requires_human = True
    elif intent_result.intent == "COMPLAINT":
        response_text = "آسفين على الإزعاج. حولنا شكوتك لفريقنا وهنتواصل معاك في أقرب وقت."
        requires_human = True
    else:
        context = "\n\n".join(k["content"] for k in (knowledge_items or []))
        if context or specialist_system_prompt or customer_context:
            response_text = await generate_response(
                normalized,
                context or "لا تتوفر معلومات إضافية.",
                system_prompt=specialist_system_prompt,
                customer_context=customer_context,
            )
        else:
            response_text = "شكراً لسؤالك! هحاول أساعدك بأفضل شكل ممكن."

    # Step 3: Guardrail Validation (if bot_id & db provided)
    guardrail_violations = []
    guardrail_action = "allow"
    if bot_id and db:
        guardrail_res = await validate_response(db, bot_id, response_text)
        guardrail_violations = guardrail_res.get("violations", [])
        guardrail_action = guardrail_res.get("action", "allow")

        if guardrail_action == "block":
            response_text = "عذراً، لا أستطيع الرد على هذا الطلب. يرجى التواصل مع فريقنا."
        elif guardrail_action == "escalate":
            requires_human = True
        elif guardrail_action == "replace":
            response_text = guardrail_res.get("sanitized_text", response_text)

    return {
        "intent": intent_result.intent,
        "confidence": intent_result.confidence,
        "response": response_text,
        "requires_human": requires_human,
        "normalized_text": normalized,
        "agent_type": agent_type,
        "guardrail_violations": guardrail_violations,
        "guardrail_action": guardrail_action,
    }
