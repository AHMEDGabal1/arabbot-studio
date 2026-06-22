from src.chains.dialect_normalizer import PROMPT


class TestDialectNormalizerPrompt:
    def test_prompt_contains_placeholder(self):
        assert "{text}" in PROMPT

    def test_prompt_mentions_egyptian_arabic(self):
        assert "Egyptian" in PROMPT or "مصري" in PROMPT
