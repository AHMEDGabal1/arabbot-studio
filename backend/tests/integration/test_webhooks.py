import hashlib
import hmac
import json
import uuid

import pytest


def _sign(body: bytes, secret: str) -> str:
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return f"sha256={expected}"


@pytest.mark.asyncio
async def test_verify_webhook_get(client, db_session):
    from src.models import Bot

    bot = Bot(
        name="Webhook Bot",
        channel="whatsapp",
        workspace_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
    )
    db_session.add(bot)
    await db_session.flush()
    bot_id = str(bot.id)

    resp = await client.get(
        f"/webhooks/whatsapp/{bot_id}",
        params={"hub.mode": "subscribe", "hub.verify_token": "test_token", "hub.challenge": "12345"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_receive_webhook_post(client, db_session):
    from src.models import Bot

    bot = Bot(
        name="Receive Bot",
        channel="whatsapp",
        workspace_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
        wa_access_token="test_secret",
    )
    db_session.add(bot)
    await db_session.flush()
    bot_id = str(bot.id)

    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "ACCOUNT_ID",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "PHONE_ID", "display_phone_number": "+1234567890"},
                    "messages": [{
                        "from": "+201234567890",
                        "id": "wamid.123",
                        "timestamp": "1234567890",
                        "type": "text",
                        "text": {"body": "مرحبا"},
                    }],
                },
                "field": "messages",
            }],
        }],
    }
    body = json.dumps(payload).encode()
    signature = _sign(body, "test_secret")

    resp = await client.post(
        f"/webhooks/whatsapp/{bot_id}",
        content=body,
        headers={"X-Hub-Signature-256": signature},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
