import pytest

from src.chains.intent_router import INTENTS, IntentResult


class TestIntentConstants:
    def test_defined_intents(self):
        assert "GREETING" in INTENTS
        assert "PRODUCT_INQUIRY" in INTENTS
        assert "ORDER_INTENT" in INTENTS
        assert "PRICE_REQUEST" in INTENTS
        assert "COMPLAINT" in INTENTS
        assert "HUMAN_REQUEST" in INTENTS
        assert "BUSINESS_HOURS" in INTENTS
        assert "LOCATION_INQUIRY" in INTENTS
        assert "OTHER" in INTENTS

    def test_exactly_9_intents(self):
        assert len(INTENTS) == 9


class TestIntentResult:
    def test_constructor(self):
        result = IntentResult(intent="GREETING", confidence=0.95)
        assert result.intent == "GREETING"
        assert result.confidence == 0.95
