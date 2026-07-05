from src.services.ai_service import get_fast_llm

INTENTS = [
    "GREETING",
    "PRODUCT_INQUIRY",
    "ORDER_INTENT",
    "PRICE_REQUEST",
    "COMPLAINT",
    "HUMAN_REQUEST",
    "BUSINESS_HOURS",
    "LOCATION_INQUIRY",
    "OTHER",
]

PROMPT = """Classify the intent of this Egyptian Arabic message. Respond with ONLY the intent label from the list.

Intents:
- GREETING: Hello, welcome, how are you etc.
- PRODUCT_INQUIRY: Ask about products, services, menu items
- ORDER_INTENT: Want to place an order
- PRICE_REQUEST: Ask about prices
- COMPLAINT: Complain about service, product issue
- HUMAN_REQUEST: Ask to speak to a human
- BUSINESS_HOURS: Ask about working hours
- LOCATION_INQUIRY: Ask for location/directions
- OTHER: Anything else

Message: {text}

Intent:"""


class IntentResult:
    def __init__(self, intent: str, confidence: float):
        self.intent = intent
        self.confidence = confidence


async def classify_intent(text: str) -> IntentResult:
    llm = get_fast_llm()
    response = await llm.ainvoke(PROMPT.format(text=text))
    intent = response.content.strip().upper()
    if intent not in INTENTS:
        intent = "OTHER"
    return IntentResult(intent=intent, confidence=0.0)
