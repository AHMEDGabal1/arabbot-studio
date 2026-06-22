# REST API Contract

## Overview

ArabBot Studio exposes a RESTful API for managing bots, knowledge bases, conversations, and analytics.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All endpoints (except `/auth/register`, `/auth/login`) require JWT Bearer token.

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Auth

| Method | Path | Description |
|---|---|---|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login, get JWT token |
| POST | /auth/refresh | Refresh JWT token |
| DELETE | /auth/logout | Logout (invalidate token) |

### Bots

| Method | Path | Description |
|---|---|---|
| GET | /bots | List all bots in workspace |
| POST | /bots | Create new bot |
| GET | /bots/{bot_id} | Get bot details |
| PATCH | /bots/{bot_id} | Update bot |
| DELETE | /bots/{bot_id} | Soft delete bot |
| POST | /bots/{bot_id}/activate | Activate bot for live traffic |
| POST | /bots/{bot_id}/deactivate | Deactivate bot |
| GET | /bots/{bot_id}/test | Test bot (sandbox) |

### Knowledge Base

| Method | Path | Description |
|---|---|---|
| GET | /bots/{bot_id}/knowledge | List knowledge items |
| POST | /bots/{bot_id}/knowledge | Add single item |
| POST | /bots/{bot_id}/knowledge/bulk | Bulk upload (CSV/JSON) |
| DELETE | /bots/{bot_id}/knowledge/{item_id} | Delete item |
| POST | /bots/{bot_id}/knowledge/reindex | Rebuild FAISS index |

### Conversations

| Method | Path | Description |
|---|---|---|
| GET | /conversations | List conversations (with filters) |
| GET | /conversations/{conv_id} | Get conversation details |
| GET | /conversations/{conv_id}/messages | Get conversation messages |

### Analytics

| Method | Path | Description |
|---|---|---|
| GET | /analytics/overview | Workspace-level analytics |
| GET | /analytics/bots/{bot_id} | Bot-specific analytics |

### Human Handoff

| Method | Path | Description |
|---|---|---|
| GET | /handoffs | List pending handoffs |
| PATCH | /handoffs/{id}/assign | Assign handoff to agent |
| PATCH | /handoffs/{id}/resolve | Resolve handoff |

---

## Request/Response Formats

### Bot Create

**Request:**
```json
{
  "name": "Restaurant Bot",
  "channel": "whatsapp",
  "language": "ar-EG",
  "system_prompt": "You are a helpful restaurant assistant",
  "fallback_message": "سوري، مش قادر أساعد دلوقتي"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "name": "Restaurant Bot",
  "channel": "whatsapp",
  "language": "ar-EG",
  "system_prompt": "You are a helpful restaurant assistant",
  "fallback_message": "سوري، مش قادر أساعد دلوقتي",
  "is_active": false,
  "created_at": "2026-04-21T10:00:00Z"
}
```

### Knowledge Item Create

**Request:**
```json
{
  "type": "faq",
  "question": "What are your hours?",
  "answer": "We are open from 10 AM to 11 PM daily",
  "metadata": {
    "category": "general"
  }
}
```

### Conversation List

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| bot_id | uuid | all | Filter by bot |
| status | string | all | Filter: active, handed_off, closed |
| limit | int | 50 | Max results |
| offset | int | 0 | Pagination offset |

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "bot_id": "uuid",
      "channel": "whatsapp",
      "channel_user_id": "+201234567890",
      "user_display_name": "Ahmed",
      "status": "active",
      "started_at": "2026-04-21T10:00:00Z",
      "last_message_at": "2026-04-21T10:05:00Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### Analytics Overview

**Response:**
```json
{
  "total_bots": 5,
  "active_bots": 3,
  "total_conversations": 1250,
  "messages_this_month": 8500,
  "messages_limit": 10000,
  "intent_breakdown": {
    "PRODUCT_INQUIRY": 450,
    "ORDER_INTENT": 200,
    "GREETING": 300,
    "OTHER": 300
  },
  "avg_response_time_ms": 320
}
```

---

## Error Responses

| Status Code | Description | Example |
|---|---|---|
| 400 | Bad Request | Invalid payload |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Workspace access denied |
| 404 | Not Found | Resource not found |
| 422 | Validation Error | Schema validation failed |
| 429 | Rate Limited | Too many requests |
| 500 | Internal Error | Server error |

**Error Format:**
```json
{
  "detail": "Error message",
  "code": "ERROR_CODE"
}
```

---

## WebSocket

For real-time features (live conversation updates):

```
WS /ws/conversations/{conversation_id}
```

**Events:**
- `message_new`: New message in conversation
- `handoff_new`: Conversation handed off to agent
- `handoff_resolved`: Handoff resolved

---

## Version

- API Version: v1
- Base Path: /api/v1
- Last Updated: 2026-04-21
