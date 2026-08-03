import hashlib
import hmac
import pytest

from src.webhooks.whatsapp import verify_signature


def test_valid_signature():
    """Verify that a valid signature returns True."""
    payload = b'{"event": "message_received"}'
    secret = "my_secret_key"
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    signature = f"sha256={expected}"

    assert verify_signature(payload, signature, secret) is True


def test_invalid_signature():
    """Verify that an invalid signature returns False."""
    payload = b'{"event": "message_received"}'
    secret = "my_secret_key"
    invalid_signature = "sha256=invalid_hash_value"

    assert verify_signature(payload, invalid_signature, secret) is False


def test_empty_secret():
    """Verify that an empty secret returns False to prevent signature spoofing."""
    payload = b'{"event": "message_received"}'
    signature = "sha256=" + hmac.new(b"", payload, hashlib.sha256).hexdigest()

    assert verify_signature(payload, signature, "") is False


def test_empty_signature():
    """Verify that an empty signature string returns False."""
    payload = b'{"event": "message_received"}'
    secret = "my_secret_key"

    assert verify_signature(payload, "", secret) is False


def test_whitespace_secret():
    """Verify that a whitespace-only secret returns False."""
    payload = b'{"event": "message_received"}'
    secret = "   "
    signature = "sha256=" + hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()

    assert verify_signature(payload, signature, secret) is False
