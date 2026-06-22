# Quickstart: ArabBot Studio MVP

## Prerequisites

- Python 3.12+
- PostgreSQL 14+ (with pgvector extension)
- Redis 6+
- Google Gemini API key

## Setup

### 1. Clone and Install

```bash
# Clone the project
git clone https://github.com/yourorg/arabbot-studio.git
cd arabbot-studio

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/arabbot

# Redis
REDIS_URL=redis://localhost:6379/0

# AI
GOOGLE_API_KEY=your_gemini_api_key
GEMINI_MODEL_FAST=gemini-2.0-flash-exp
GEMINI_MODEL_FULL=gemini-2.5-pro

# Meta / WhatsApp
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret

# App
SECRET_KEY=your_jwt_secret_32chars_min
ENVIRONMENT=development
BASE_URL=http://localhost:8000
```

### 3. Database Setup

```bash
# Enable pgvector extension (run as PostgreSQL admin)
psql -U postgres -d arabbot -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
alembic upgrade head
```

### 4. Start the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server runs at `http://localhost:8000`

API docs at `http://localhost:8000/docs`

---

## First Run: Create Workspace + Bot

### Step 1: Register User

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "securepassword",
    "name": "Your Name"
  }'
```

### Step 2: Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "securepassword"
  }'
```

Response includes JWT token. Save it.

### Step 3: Create Bot

```bash
curl -X POST http://localhost:8000/api/v1/bots \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Restaurant Bot",
    "channel": "whatsapp",
    "language": "ar-EG",
    "system_prompt": "You are a helpful restaurant assistant"
  }'
```

### Step 4: Add Knowledge (FAQ)

```bash
curl -X POST http://localhost:8000/api/v1/bots/{bot_id}/knowledge \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "faq",
    "question": "What are your hours?",
    "answer": "We are open daily from 10 AM to 11 PM"
  }'
```

### Step 5: Configure WhatsApp Webhook

1. Create Meta App in Facebook Developer Portal
2. Configure webhook URL: `https://your-domain.com/webhooks/whatsapp/{bot_id}`
3. Get verify token and access token
4. Update bot with credentials:

```bash
curl -X PATCH http://localhost:8000/api/v1/bots/{bot_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wa_phone_number_id": "your_phone_number_id",
    "wa_access_token": "your_wa_access_token"
  }'
```

### Step 6: Activate Bot

```bash
curl -X POST http://localhost:8000/api/v1/bots/{bot_id}/activate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing the Bot

Send a WhatsApp message to your business number. The bot should:

1. Receive the message via webhook
2. Normalize Egyptian Arabic dialect
3. Detect intent (e.g., PRODUCT_INQUIRY)
4. Search knowledge base (RAG)
5. Generate response in Egyptian Arabic
6. Send reply via WhatsApp API

---

## Project Structure

```
backend/
├── main.py                 # FastAPI app entry
├── config.py               # Settings
├── database.py             # Async DB session
├── deps.py                 # FastAPI dependencies
├── models/                 # SQLAlchemy models
│   ├── workspace.py
│   ├── user.py
│   ├── bot.py
│   └── ...
├── schemas/                # Pydantic schemas
├── routers/                # API endpoints
│   ├── auth.py
│   ├── bots.py
│   └── ...
├── webhooks/               # WhatsApp/FB webhooks
├── chains/                 # LangChain AI chains
└── services/               # External services
```

---

## Key Commands

```bash
# Run server
uvicorn main:app --reload

# Run tests
pytest

# Create migration
alembic revision --autogenerate -m "Add field"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Common Issues

### "Database not ready"
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Create database
createdb arabbot
```

### "Redis connection refused"
```bash
# Check Redis is running
redis-cli ping

# Start Redis
redis-server
```

### "WhatsApp webhook not verifying"
- Verify token must match `wa_verify_token` in bot record
- Use ngrok for local development: `ngrok http 8000`

---

## Next Steps

1. Add more knowledge items (bulk upload via CSV)
2. Configure Fawry/Paymob for payment links
3. Set up human handoff workflow
4. Deploy to production (DigitalOcean/Railway)
