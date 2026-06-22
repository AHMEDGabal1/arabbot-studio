# ArabBot Studio MVP — Specification
**Version:** 0.1 MVP
**Stack:** Python · FastAPI · LangChain · Gemini Pro 1.5/2.0 · WhatsApp Business API · PostgreSQL · Redis
**Build Mode:** OpenCode / Spec-Kit
**Feature Branch:** 001-arabbot-mvp

---

## 1. PRODUCT DEFINITION

### What It Is
A no-code/low-code platform that lets Egyptian SMBs build, deploy, and manage AI chatbots for WhatsApp Business and Facebook Messenger — in Egyptian Arabic dialect — without writing code.

### Core Value Proposition
- Egyptian Arabic dialect understanding (not MSA — actual عامية مصرية)
- Connects to WhatsApp Business API + Facebook Messenger out of the box
- EGP-native pricing, Fawry/Paymob payment link injection in chat
- No technical skill required to set up a bot

### Who Uses It
| Persona | Pain | What They Want |
|---|---|---|
| Restaurant owner | "I answer the same questions 100x/day on WhatsApp" | Bot that answers menu, hours, delivery zone — auto |
| Online seller | "I miss orders when I'm asleep" | 24/7 order intake + Bosta shipment creation |
| Clinic receptionist | "Patients WhatsApp me at midnight to book" | Appointment booking bot |
| Marketing agency | "My clients need chatbots, I can't build custom" | White-label bot builder to resell |

---

## 2. SYSTEM ARCHITECTURE

```
┌──────────────────────────────────────────────────┐
│                   FRONTEND                        │
│         Bot Builder UI (React/Next.js)            │
│   Flow editor · Training panel · Analytics        │
└──────────────────┬───────────────────────────────┘
                    │ REST / WebSocket
┌──────────────────▼───────────────────────────────┐
│                  BACKEND (FastAPI)                │
│  /api/v1/                                         │
│  ├── auth/          JWT + workspace isolation     │
│  ├── bots/          CRUD for bot configs          │
│  ├── flows/         Flow definitions (JSON)       │
│  ├── training/      FAQ ingestion + embedding     │
│  ├── conversations/ Message logs + analytics      │
│  └── webhooks/      WA + FB incoming messages     │
└────┬────────┬──────────────────────────────────  ┘
     │        │
┌────▼──┐ ┌──▼──────────────────────────────────┐
│  DB   │ │         AI ENGINE                    │
│ PgSQL │ │  LangChain Orchestrator              │
│ Redis │ │  ├── Intent Router (Gemini Flash)    │
└───────┘ │  ├── RAG Chain (FAISS + embeddings)  │
          │  ├── Dialect Normalizer              │
          │  └── Response Generator (Gemini Pro) │
          └─────────────────────────────────────┘
                    │
     ┌─────────────┼─────────────────┐
     ▼             ▼                 ▼
  WhatsApp    Facebook           Fawry/Paymob
  Business    Messenger          Payment Links
  API (Meta)  API (Meta)
```

---

## 3. DATABASE SCHEMA

```sql
-- Workspaces (one per customer/agency account)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'starter',           -- starter | pro | agency
  monthly_message_limit INT DEFAULT 1000,
  messages_used_this_month INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users (can belong to multiple workspaces)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workspace membership
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member',            -- owner | admin | member
  PRIMARY KEY (workspace_id, user_id)
);

-- Bots (one workspace can have multiple bots)
CREATE TABLE bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  name TEXT NOT NULL,
  language TEXT DEFAULT 'ar-EG',
  channel TEXT NOT NULL,                 -- whatsapp | facebook | both
  wa_phone_number_id TEXT,               -- from Meta dashboard
  wa_access_token TEXT,
  fb_page_id TEXT,
  fb_access_token TEXT,
  system_prompt TEXT,                    -- base personality/context
  fallback_message TEXT DEFAULT 'هوريك لحد من فريقنا دلوقتي',
  human_handoff_enabled BOOL DEFAULT true,
  fawry_merchant_code TEXT,
  paymob_api_key TEXT,
  is_active BOOL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ                     -- soft delete
);

-- Knowledge Base (the FAQ / product catalog the bot knows)
CREATE TABLE knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                    -- faq | product | policy | custom
  question TEXT,                         -- for FAQ type
  answer TEXT NOT NULL,
  metadata JSONB,                        -- price, availability, category etc
  embedding VECTOR(768),                 -- pgvector
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation sessions
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES bots(id),
  channel TEXT NOT NULL,
  channel_user_id TEXT NOT NULL,         -- WA phone or FB PSID
  user_display_name TEXT,
  status TEXT DEFAULT 'active',          -- active | handed_off | closed
  started_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ                     -- soft delete
);

-- Individual messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL,                    -- user | assistant | system
  content TEXT NOT NULL,
  raw_content TEXT,                      -- original dialect before normalization
  intent_detected TEXT,
  confidence FLOAT,
  was_rag_hit BOOL DEFAULT false,
  processing_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Human handoff queue
CREATE TABLE handoff_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  reason TEXT,
  assigned_to UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. API ENDPOINTS (FastAPI)

### Auth
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
DELETE /api/v1/auth/logout
```

### Bots
```
GET    /api/v1/bots                        # list all bots in workspace
POST   /api/v1/bots                        # create new bot
GET    /api/v1/bots/{bot_id}
PATCH  /api/v1/bots/{bot_id}
DELETE /api/v1/bots/{bot_id}               # soft delete
POST   /api/v1/bots/{bot_id}/activate       # enable live traffic
POST   /api/v1/bots/{bot_id}/deactivate
GET    /api/v1/bots/{bot_id}/test           # sandbox test endpoint
```

### Knowledge Base
```
GET    /api/v1/bots/{bot_id}/knowledge
POST   /api/v1/bots/{bot_id}/knowledge           # add single item
POST   /api/v1/bots/{bot_id}/knowledge/bulk      # CSV/JSON upload
DELETE /api/v1/bots/{bot_id}/knowledge/{item_id}
POST   /api/v1/bots/{bot_id}/knowledge/reindex   # rebuild FAISS index
```

### Webhooks (Meta Platform)
```
GET    /webhooks/whatsapp/{bot_id}     # verification challenge
POST   /webhooks/whatsapp/{bot_id}     # incoming messages
GET    /webhooks/facebook/{bot_id}
POST   /webhooks/facebook/{bot_id}
```

### Conversations & Analytics
```
GET    /api/v1/conversations                     # list with filters
GET    /api/v1/conversations/{conv_id}/messages
GET    /api/v1/analytics/overview                # MRR, MAU, msg volume
GET    /api/v1/analytics/bots/{bot_id}
GET    /api/v1/handoffs                          # queue for human agents
PATCH  /api/v1/handoffs/{id}/assign
PATCH  /api/v1/handoffs/{id}/resolve
```

---

## 5. AI ENGINE — CORE CHAINS

### 5.1 Dialect Normalizer
**Purpose:** Convert Egyptian Arabic slang/abbreviations to processable form before intent detection.

```python
# chains/dialect_normalizer.py
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

NORMALIZE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """أنت متخصص في اللغة العربية المصرية العامية.
مهمتك: خذ الرسالة دي وحولها لعربي فصيح مفهوم مع الحفاظ على المعنى الأصلي.
لا تجاوب على الرسالة — بس حولها.
أمثلة:
- "فيه ايه؟" → "ماذا يوجد؟"
- "بكام الكيلو؟" → "ما هو سعر الكيلوجرام؟"
- "بيوصل امتى؟" → "متى يصل؟"
رد بالنص المحول فقط، بدون شرح."""),
    ("human", "{text}")
])

def normalize_dialect(text: str, llm) -> str:
    chain = NORMALIZE_PROMPT | llm
    result = chain.invoke({"text": text})
    return result.content
```

### 5.2 Intent Router
**Purpose:** Fast classification before hitting the full RAG chain.

```python
INTENT_ROUTER_PROMPT = """
أنت نظام تصنيف نوايا للمحادثات التجارية المصرية.

صنف الرسالة دي في واحدة من الفئات دي:
- PRODUCT_INQUIRY     (سؤال عن منتج أو خدمة أو سعر)
- ORDER_INTENT        (عايز يطلب أو يشتري)
- BOOKING_INTENT      (عايز يحجز موعد)
- COMPLAINT           (مشكلة أو شكوى)
- PAYMENT_INQUIRY     (سؤال عن الدفع)
- DELIVERY_INQUIRY    (سؤال عن التوصيل)
- GREETING            (تحية أو بداية محادثة)
- HUMAN_REQUEST       (طلب التحدث مع إنسان)
- OTHER               (أي حاجة تانية)

رد بـ JSON فقط:
{"intent": "INTENT_NAME", "confidence": 0.0-1.0, "key_entities": []}

الرسالة: {message}
"""
```

### 5.3 RAG Chain (Main Response Generator)
```python
# chains/rag_chain.py
from langchain.chains import RetrievalQA
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS

RAG_SYSTEM_PROMPT = """
أنت مساعد ذكي بتمثل {business_name}.

{custom_system_prompt}

تعليمات مهمة:
- ارد دايماً بالعربية المصرية العامية — مش فصحى
- كن ودود وإيجابي ومختصر
- لو مش عارف الإجابة، قل "مش متأكد" وعرض التحويل لشخص من الفريق
- لو حد عايز يطلب، بعتله لينك الدفع: {payment_link_template}
- لو حد زعلان، اعتذر أولاً قبل ما تحل المشكلة
- متكتبش قوائم طويلة — خلي الردود طبيعية زي محادثة WhatsApp

السياق من قاعدة المعرفة:
{context}

المحادثة اللي فاتت:
{chat_history}
"""
```

### 5.4 Voice Note Handler
```python
# handlers/voice_handler.py
# WhatsApp sends voice notes as audio/ogg
# Pipeline: download → transcribe (Gemini) → normalize dialect → process as text

async def handle_voice_note(media_id: str, bot_id: str) -> str:
    """
    1. Download audio from Meta CDN using media_id
    2. Send to Gemini Pro for Arabic transcription
    3. Return transcribed text for normal processing pipeline
    """
    audio_bytes = await download_wa_media(media_id)
    
    # Gemini multimodal transcription
    transcription_prompt = """
    اسمع الصوت ده وحوله لنص عربي.
    لو في كلمات مش واضحة، اكتب [غير واضح].
    رد بالنص بس بدون أي شرح.
    """
    # ... Gemini API call with audio bytes
    return transcribed_text
```

---

## 6. WHATSAPP WEBHOOK HANDLER

```python
# webhooks/whatsapp.py
from fastapi import APIRouter, Request, HTTPException
import hmac, hashlib

router = APIRouter()

@router.get("/webhooks/whatsapp/{bot_id}")
async def verify_webhook(bot_id: str, request: Request):
    """Meta webhook verification"""
    params = dict(request.query_params)
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    
    bot = await get_bot(bot_id)
    if mode == "subscribe" and token == bot.wa_verify_token:
        return int(challenge)
    raise HTTPException(403)

@router.post("/webhooks/whatsapp/{bot_id}")
async def receive_message(bot_id: str, request: Request):
    """Process incoming WhatsApp messages"""
    payload = await request.json()
    
    # Verify Meta signature
    signature = request.headers.get("X-Hub-Signature-256", "")
    verify_meta_signature(await request.body(), signature, bot_id)
    
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            
            for message in value.get("messages", []):
                msg_type = message.get("type")
                
                if msg_type == "text":
                    text = message["text"]["body"]
                elif msg_type == "audio":
                    # Voice note
                    text = await handle_voice_note(
                        message["audio"]["id"], bot_id
                    )
                elif msg_type == "image":
                    text = "[صورة] — مش قادر أشوف الصور دلوقتي"
                else:
                    text = f"[{msg_type}] غير مدعوم"
                
                # Process through AI engine
                response = await process_message(
                    bot_id=bot_id,
                    user_phone=message["from"],
                    text=text,
                    wa_message_id=message["id"]
                )
                
                # Send reply
                await send_wa_message(
                    phone_number_id=value["metadata"]["phone_number_id"],
                    to=message["from"],
                    text=response,
                    access_token=bot.wa_access_token
                )
    
    return {"status": "ok"}
```

---

## 7. ENVIRONMENT VARIABLES

```env
# .env

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/arabbot
REDIS_URL=redis://localhost:6379/0

# AI
GOOGLE_API_KEY=your_gemini_api_key
GEMINI_MODEL_FAST=gemini-2.0-flash-exp         # for intent routing (cheap)
GEMINI_MODEL_FULL=gemini-2.5-pro               # for response generation

# Meta / WhatsApp
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret

# Payments
FAWRY_BASE_URL=https://www.atfawry.com/ECommerceWeb/Fawry/payments/charge
PAYMOB_API_BASE=https://accept.paymob.com/api

# App
SECRET_KEY=your_jwt_secret_32chars_min
ENVIRONMENT=development
BASE_URL=https://your-domain.com

# Storage (for voice note temp files)
AWS_BUCKET=arabbot-media
AWS_REGION=me-south-1
```

---

## 8. NON-FUNCTIONAL REQUIREMENTS

| Attribute | Target |
|---|---|
| Latency (p95) | 500ms webhook-to-ACK |
| Scale | 10,000 MAU |
| Observability | Structured JSON logs + Redis counters + PostgreSQL aggregations |
| Error handling | Retry with exponential backoff (1s → 2s → 4s) via Redis tracking |
| Soft deletes | Bots, conversations (deleted_at TIMESTAMPTZ) |

---

## 9. MVP FEATURE CHECKLIST

### Phase 1 — Core (Weeks 1–3) — ALL 10 ITEMS
- [ ] Auth system (JWT, workspace isolation)
- [ ] Bot CRUD with basic config
- [ ] WhatsApp Business API webhook handler
- [ ] Simple intent router (Gemini Flash)
- [ ] FAQ knowledge base (add Q&A pairs manually)
- [ ] RAG chain with FAISS
- [ ] Dialect normalizer chain
- [ ] Send text replies via WA API
- [ ] Basic conversation logging (PostgreSQL)
- [ ] Human handoff flag + WhatsApp notification to owner

**Clarification:** All 10 items are MVP scope, delivered sequentially (1/week).

### Phase 2 — Product Polish (Weeks 4–5)
- [ ] Voice note transcription (Gemini multimodal)
- [ ] Facebook Messenger webhook
- [ ] Fawry payment link injection
- [ ] Analytics dashboard (message volume, intent breakdown)
- [ ] Bulk knowledge upload (CSV)
- [ ] Bot testing sandbox (simulate conversation without live WA)

### Phase 3 — Growth (Week 6+)
- [ ] Agency white-label (custom subdomain per agency)
- [ ] Bosta shipment creation from chat
- [ ] Paymob payment link alternative
- [ ] Multi-language support (MSA, Khaleeji)
- [ ] Subscription billing (Paymob recurring)
- [ ] API for developers (bring-your-own-channel)

---

## 10. FOLDER STRUCTURE

```
arabbot-studio/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── bot.py
│   │   ├── conversation.py
│   │   └── knowledge.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── bots.py
│   │   ├── knowledge.py
│   │   ├── conversations.py
│   │   └── analytics.py
│   ├── webhooks/
│   │   ├── whatsapp.py
│   │   └── facebook.py
│   ├── chains/
│   │   ├── dialect_normalizer.py
│   │   ├── intent_router.py
│   │   ├── rag_chain.py
│   │   └── voice_handler.py
│   ├── services/
│   │   ├── wa_sender.py
│   │   ├── fb_sender.py
│   │   ├── payment_links.py
│   │   └── vector_store.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   ├── bots/
│   │   │   ├── knowledge/
│   │   │   └── analytics/
│   │   └── components/
└── docker-compose.yml
```

---

## 11. KEY DEPENDENCIES (requirements.txt)

```
fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
alembic==1.14.0
redis[asyncio]==5.2.0

# AI / LangChain
langchain==0.3.7
langchain-google-genai==2.0.5
langchain-community==0.3.7
faiss-cpu==1.9.0
pgvector==0.3.6

# Auth & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.17

# HTTP
httpx==0.28.0
aiofiles==24.1.0

# Utils
pydantic==2.10.0
pydantic-settings==2.6.1
python-dotenv==1.0.1
```

---

## 12. GO-TO-MARKET — FIRST 90 DAYS

| Week | Action |
|---|---|
| 1–3 | Build Phase 1 MVP (backend + WA webhook) |
| 4 | Deploy on DigitalOcean/Railway. Test with 3 real businesses (restaurant, clinic, seller) for free |
| 5–6 | Fix bugs from pilot. Add voice note + analytics |
| 7 | Launch in 3 Facebook groups: مجموعة رواد الأعمال المصريين, مجموعات التجارة الإلكترونية مصر, مجموعات أصحاب المطاعم |
| 8 | Approach 5 digital marketing agencies. Offer 30% reseller margin |
| 9–12 | Target 50 paid customers. Optimize conversion. Add Fawry payments |

### Pricing (EGP)
| Plan | Price | Limit | Target |
|---|---|---|---|
| Starter | EGP 299/mo | 1,000 msgs | Solo SMB |
| Pro | EGP 699/mo | 5,000 msgs | Growing business |
| Agency | EGP 1,999/mo | Unlimited + white-label | Marketing agencies |

**Goal: 100 paying customers by Month 3 = EGP 50K–70K MRR**

---

## Clarifications

### Session 2026-04-21
- Q: Latency target? → A: 500ms p95
- Q: Scale target? → A: 10,000 MAU
- Q: Observability approach? → A: Structured logs + metrics (Option B)
- Q: Error handling strategy? → A: Retry with exponential backoff (Option B)
- Q: Phase 1 scope? → A: Keep all 10 items - deliver sequentially (Option B)