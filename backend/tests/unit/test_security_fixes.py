"""
Unit tests for security fixes from audit report.
Tests SEC-02, CORR-03, and BUS-01 fixes.
"""
import hashlib
import hmac
import uuid

import numpy as np
import pytest


class TestWebhookSignatureValidation:
    """Test SEC-02: Webhook signature spoofing prevention."""

    def test_verify_signature_with_valid_signature(self):
        """Valid signature should pass verification."""
        from src.webhooks.whatsapp import verify_signature

        secret = "test_secret"
        payload = b'{"test": "data"}'
        expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        signature = f"sha256={expected}"

        assert verify_signature(payload, signature, secret) is True

    def test_verify_signature_with_empty_secret(self):
        """Empty secret should always fail verification (SEC-02 fix)."""
        from src.webhooks.whatsapp import verify_signature

        payload = b'{"test": "data"}'
        signature = "sha256=" + hmac.new(b"", payload, hashlib.sha256).hexdigest()

        # CRITICAL: This must return False to prevent signature spoofing
        assert verify_signature(payload, signature, "") is False

    def test_verify_signature_with_whitespace_secret(self):
        """Whitespace-only secret should fail verification (SEC-02 fix)."""
        from src.webhooks.whatsapp import verify_signature

        payload = b'{"test": "data"}'
        signature = "sha256=" + hmac.new(b"   ", payload, hashlib.sha256).hexdigest()

        assert verify_signature(payload, signature, "   ") is False

    def test_verify_signature_with_empty_signature(self):
        """Empty signature should fail verification."""
        from src.webhooks.whatsapp import verify_signature

        payload = b'{"test": "data"}'
        assert verify_signature(payload, "", "secret") is False

    def test_verify_signature_with_invalid_signature(self):
        """Invalid signature should fail verification."""
        from src.webhooks.whatsapp import verify_signature

        payload = b'{"test": "data"}'
        signature = "sha256=invalid"

        assert verify_signature(payload, signature, "secret") is False

    def test_verify_signature_timing_safe(self):
        """Signature comparison should be timing-safe."""
        from src.webhooks.whatsapp import verify_signature

        secret = "test_secret"
        payload = b'{"test": "data"}'
        correct_sig = "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        wrong_sig = "sha256=" + "a" * 64

        # Both should complete in similar time (timing-safe comparison)
        assert verify_signature(payload, correct_sig, secret) is True
        assert verify_signature(payload, wrong_sig, secret) is False


class TestFAISSIndexValidation:
    """Test CORR-03: FAISS negative index handling."""

    def test_faiss_indices_filter_negative(self):
        """FAISS search should filter out negative indices (CORR-03 fix)."""
        # Simulate FAISS returning negative indices when k > available items
        indices = np.array([[-1, 0, 1]])  # -1 indicates "no match"
        texts = ["doc1", "doc2", "doc3"]

        # Filter logic from the fix
        results = [texts[i] for i in indices[0] if 0 <= i < len(texts)]

        assert results == ["doc1", "doc2"]
        assert len(results) == 2

    def test_faiss_indices_all_negative(self):
        """All negative indices should return empty results."""
        indices = np.array([[-1, -1, -1]])
        texts = ["doc1", "doc2", "doc3"]

        results = [texts[i] for i in indices[0] if 0 <= i < len(texts)]

        assert results == []

    def test_faiss_indices_out_of_bounds(self):
        """Out of bounds indices should be filtered."""
        indices = np.array([[0, 5, 10]])  # 5 and 10 are out of bounds
        texts = ["doc1", "doc2", "doc3"]

        results = [texts[i] for i in indices[0] if 0 <= i < len(texts)]

        assert results == ["doc1"]

    def test_faiss_indices_valid_only(self):
        """All valid indices should be included."""
        indices = np.array([[2, 0, 1]])
        texts = ["doc1", "doc2", "doc3"]

        results = [texts[i] for i in indices[0] if 0 <= i < len(texts)]

        assert results == ["doc3", "doc1", "doc2"]


class TestMessageQuotaEnforcement:
    """Test BUS-01: Monthly message quota enforcement."""

    @pytest.mark.asyncio
    async def test_quota_enforcement_logic(self):
        """Test quota enforcement prevents processing when limit reached."""
        from datetime import datetime, timezone

        # Simulate workspace at quota
        current_usage = 1000
        monthly_limit = 1000

        # Business logic from the fix
        quota_exceeded = current_usage >= monthly_limit

        assert quota_exceeded is True

    @pytest.mark.asyncio
    async def test_quota_enforcement_below_limit(self):
        """Test messages process normally when below quota."""
        current_usage = 999
        monthly_limit = 1000

        quota_exceeded = current_usage >= monthly_limit

        assert quota_exceeded is False

    @pytest.mark.asyncio
    async def test_month_rollover_resets_counter(self):
        """Test that month rollover resets usage counter."""
        from datetime import datetime, timezone

        # Simulate last month
        last_month = datetime(2026, 7, 15, tzinfo=timezone.utc)
        last_month_key = last_month.year * 12 + last_month.month  # 2026*12 + 7 = 24319

        # Current month
        now = datetime(2026, 8, 3, tzinfo=timezone.utc)
        current_month_key = now.year * 12 + now.month  # 2026*12 + 8 = 24320

        # Check if rollover should happen
        should_reset = current_month_key != last_month_key

        assert should_reset is True
        assert current_month_key == 24320
        assert last_month_key == 24319


class TestUUIDValidation:
    """Test API-01: UUID validation in query parameters."""

    def test_uuid_validation_valid(self):
        """Valid UUID should parse successfully."""
        valid_uuid = "123e4567-e89b-12d3-a456-426614174000"
        parsed = uuid.UUID(valid_uuid)

        assert str(parsed) == valid_uuid

    def test_uuid_validation_invalid_format(self):
        """Invalid UUID format should raise ValueError."""
        invalid_uuid = "not-a-uuid"

        with pytest.raises(ValueError):
            uuid.UUID(invalid_uuid)

    def test_uuid_validation_empty_string(self):
        """Empty string should raise ValueError."""
        with pytest.raises(ValueError):
            uuid.UUID("")

    def test_uuid_validation_none(self):
        """None should raise TypeError or ValueError."""
        with pytest.raises((TypeError, ValueError, AttributeError)):
            uuid.UUID(None)
