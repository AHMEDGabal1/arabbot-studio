# WhatsApp Business Webhook Contract

## Overview

This document describes the WhatsApp webhook contract that ArabBot Studio exposes for receiving messages from the Meta WhatsApp Business API.

## Endpoint

```
GET  /webhooks/whatsapp/{bot_id}
POST /webhooks/whatsapp/{bot_id}
```

## Authentication

### Verification Challenge (GET)

Meta sends a GET request to verify webhook ownership.

**Request Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| hub.mode | string | Yes | Always "subscribe" |
| hub.verify_token | string | Yes | Must match bot's `wa_verify_token` |
| hub.challenge | string | Yes | Random string to echo back |

**Response:**
- Success: Return `hub.challenge` as plain integer (HTTP 200)
- Failure: HTTP 403

### Message Verification (POST)

Every POST request must include signature verification.

**Request Headers:**

| Header | Type | Required | Description |
|---|---|---|---|
| X-Hub-Signature-256 | string | Yes | HMAC-SHA256 of raw body |

**Signature Verification:**

```python
import hmac
import hashlib

def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

## Message Format

### Incoming Message Payload

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "phone_number_id": "PHONE_NUMBER_ID",
              "display_phone_number": "+1234567890"
            },
            "messages": [
              {
                "from": "USER_PHONE_NUMBER",
                "id": "wamid.XXX",
                "timestamp": "1234567890",
                "type": "text",
                "text": {
                  "body": "مرحبا، عندي سؤال"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Supported Message Types

| Type | Field | Description |
|---|---|---|
| text | message.text.body | Text message |
| audio | message.audio.id | Voice note (needs transcription) |
| image | message.image.id | Image (acknowledge only) |
| interactive | message.interactive | Button/list reply |
| location | message.location | Location share |

### Outgoing Message Format

```json
{
  "messaging_product": "whatsapp",
  "to": "+201234567890",
  "type": "text",
  "text": {
    "body": "أهلاً وسهلاً! إزاي أقدر أساعدك؟"
  }
}
```

## Error Responses

### Meta API Errors

| Error Code | Description | Action |
|---|---|---|
| 130429 | Rate limit hit | Retry with exponential backoff |
| 131026 | Message undeliverable | Log and mark conversation |
| 131047 | Template validation failed | Check message format |

### ArabBot Internal Errors

| Status Code | Description |
|---|---|
| 200 | Success |
| 400 | Invalid payload format |
| 401 | Signature verification failed |
| 403 | Bot not found or inactive |
| 500 | Internal processing error |

## Processing Flow

```
1. Receive POST /webhooks/whatsapp/{bot_id}
2. Verify signature (X-Hub-Signature-256)
3. Parse payload
4. For each message:
   a. Extract text/audio
   b. If audio: download + transcribe via Gemini
   c. Process via AI engine (normalize → intent → RAG → respond)
   d. Send response via WhatsApp API
5. Return 200 immediately
```

## Rate Limits

- WhatsApp Cloud API: 1,000 messages/day (free tier)
- Per conversation: Manage via Redis rate limiting
- Webhook response: Must return within 5 seconds

## Version

- Contract Version: 1.0
- Meta API Version: v20.0
- Last Updated: 2026-04-21
