import pytest
from src.services.guardrail_service import (
    _check_forbidden_word,
    _check_max_discount,
    _check_max_length,
    _check_regex_block,
    _check_required_phrase,
)


def test_forbidden_word_english():
    assert _check_forbidden_word("We offer free shipping", "free") is True
    assert _check_forbidden_word("We offer shipping", "free") is False


def test_forbidden_word_arabic():
    assert _check_forbidden_word("عندنا خصم كبير", "خصم") is True
    assert _check_forbidden_word("عندنا عرض كبير", "خصم") is False


def test_forbidden_word_case_insensitive():
    assert _check_forbidden_word("FREE delivery", "free") is True


def test_regex_block_match():
    assert _check_regex_block("Call 01012345678", r"\d{11}") is True
    assert _check_regex_block("Hello world", r"\d{11}") is False


def test_regex_block_invalid_pattern():
    assert _check_regex_block("test", r"[") is False


def test_max_discount_percentage():
    assert _check_max_discount("خصم 50%", "30") is True
    assert _check_max_discount("خصم 20%", "30") is False


def test_max_discount_arabic():
    assert _check_max_discount("خصم 40 بالمية", "30") is True


def test_required_phrase_present():
    assert _check_required_phrase("الأسعار قابلة للتغيير", "قابلة للتغيير") is False
    assert _check_required_phrase("شكرا لك", "قابلة للتغيير") is True


def test_max_length():
    assert _check_max_length("short", "100") is False
    assert _check_max_length("x" * 200, "100") is True
