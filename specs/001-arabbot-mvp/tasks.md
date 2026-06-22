# Tasks: ArabBot Studio MVP
**Feature**: ArabBot Studio MVP | **Branch**: `001-arabbot-mvp`
**Generated**: 2026-04-21 | **Spec**: `spec.md` | **Plan**: `plan.md`
> **CRITICAL**: Execute tasks in strict ID order. Check dependencies before starting each task.
> **CRITICAL**: Tests are OPTIONAL for this project — only generate test tasks if requested.
---
## Dependencies Graph
```
Phase 1 (Setup)
  │
  ▼
Phase 2 (Foundational)
  │
  ▼
Phase 3 (Auth + Workspace) ←─────── Phase 2 required
  │
  ▼
Phase 4 (Bot CRUD + Webhooks) ←── Phase 3 required
  │
  ▼
Phase 5 (AI Pipeline) ←────────── Phase 4 required
  │
  ▼
Phase 6 (Knowledge Base) ←───── Phase 4 required
  │
  ▼
Phase 7 (Human Handoff) ←──── Phase 5 + Phase 6 required
```
**Parallel opportunities**: Models, schemas, services within same phase are independently testable.
---
## Phase 1: Setup
*Goal: Initialize project structure with dependencies and environment*
### Independent Test Criteria
- Server starts with `uvicorn main:app --reload`
- All env vars load from `.env` via pydantic-settings
- Health check endpoint returns 200
- Docker Compose starts all services (PostgreSQL + Redis)
---
- [ ] T001 Create `pyproject.toml` at `backend/pyproject.toml` with project metadata and `__main__.py` entry
- [ ] T002 Create `backend/requirements.txt` with pinned versions per plan.md
- [ ] T003 Create `backend/.env.example` with all env vars (DATABASE_URL, REDIS_URL, GOOGLE_API_KEY, etc.)
- [ ] T004 Create `backend/docker-compose.yml` with PostgreSQL (port 5432), Redis (port 6379), health checks
- [ ] T005 Create `backend/src/__init__.py` and package directories per plan.md Project Structure
- [ ] T006 Create `backend/src/config.py` using pydantic-settings with Settings class, env var validation
- [ ] T007 Create `backend/src/main.py` FastAPI app factory with title "ArabBot Studio", version, docs route
- [ ] T008 Create `backend/src/deps.py` with get_db (async session), get_current_user, get_workspace dependencies
- [ ] T009 Add `.gitignore`, `.env` to gitignore, `__pycache__` exclusions
---
## Phase 2: Foundational (DB, Models, Schemas)
*Goal: Async database layer with all SQLAlchemy models and Pydantic schemas*
### Independent Test Criteria
- All models importable without errors
- Async session factory creates sessions
- Alembic migrations generate and apply cleanly
- All schemas serialize/deserialize correctly
---
- [ ] T010 [P] Create `backend/src/database.py` with async engine, async session maker (asyncpg + async SQLAlchemy 2.0)
- [ ] T011 [P] Create `backend/src/models/__init__.py` exporting all models with Base
- [ ] T012 [P] Create `backend/src/models/base.py` with declarative async Base, created_at/updated_at mixin
- [ ] T013 [P] Create `backend/src/models/workspace.py` with Workspace model per data-model.md
- [ ] T014 [P] Create `backend/src/models/user.py` with User model per data-model.md
- [ ] T015 [P] Create `backend/src/models/workspace_member.py` with WorkspaceMember model per data-model.md
- [ ] T016 [P] Create `backend/src/models/bot.py` with Bot model per data-model.md, soft delete (deleted_at)
- [ ] T017 [P] Create `backend/src/models/conversation.py` with Conversation model, soft delete
- [ ] T018 [P] Create `backend/src/models/message.py` with Message model per data-model.md
- [ ] T019 [P] Create `backend/src/models/knowledge.py` with KnowledgeItem model, Vector field
- [ ] T020 [P] Create `backend/src/models/handoff.py` with HandoffQueue model per data-model.md
- [ ] T021 [P] Create `backend/src/schemas/__init__.py` exporting all schemas
- [ ] T022 [P] Create `backend/src/schemas/auth.py` with LoginRequest, RegisterRequest, TokenResponse
- [ ] T023 [P] Create `backend/src/schemas/user.py` with UserCreate, UserRead, UserUpdate schemas
- [ ] T024 [P] Create `backend/src/schemas/workspace.py` with WorkspaceCreate, WorkspaceRead schemas
- [ ] T025 [P] Create `backend/src/schemas/bot.py` with BotCreate, BotRead, BotUpdate schemas
- [ ] T026 [P] Create `backend/src/schemas/conversation.py` with ConversationRead, MessageRead schemas
- [ ] T027 [P] Create `backend/src/schemas/knowledge.py` with KnowledgeItemCreate, KnowledgeItemRead
- [ ] T028 [P] Create `backend/src/schemas/handoff.py` with HandoffAssign, HandoffResolve schemas
- [ ] T029 Initialize `backend/alembic/` with `alembic.ini` and env.py, using async SQLAlchemy
- [ ] T030 Generate and apply initial Alembic migration for all models
---
## Phase 3: Auth + Workspace [US1]
*Goal: JWT authentication with workspace isolation*
### Independent Test Criteria
- POST /api/v1/auth/register creates user + workspace
- POST /api/v1/auth/login returns JWT
- Authenticated requests with valid JWT return 200
- Requests without JWT or invalid JWT return 401
- User cannot access another user's workspace bots
---
- [ ] T031 [P] Create `backend/src/services/auth_service.py` with hash_password, verify_password, create_access_token
- [ ] T032 [P] Create `backend/src/services/workspace_service.py` with create_workspace, get_workspace_by_user
- [ ] T033 Create `backend/src/routers/auth.py` with POST /register, POST /login, POST /refresh, DELETE /logout
- [ ] T034 Create `backend/src/middleware/__init__.py` and `backend/src/middleware/workspace.py`
- [ ] T035 Wire auth router into `backend/src/main.py`
- [ ] T036 Add workspace context dependency in `backend/src/deps.py` (get_workspace_from_user)
- [ ] T037 Write integration tests for auth endpoints in `backend/tests/integration/test_auth.py`
---
## Phase 4: Bot CRUD + WhatsApp Webhooks [US2]
*Goal: Bot management with WhatsApp Business API webhook handler*
### Independent Test Criteria
- POST /api/v1/bots creates bot in user's workspace
- GET /api/v1/bots lists only user's workspace bots (not others')
- DELETE soft-deletes (sets deleted_at)
- GET /webhooks/whatsapp/{bot_id} passes Meta verification challenge
- POST /webhooks/whatsapp/{bot_id} returns 200 within 500ms
- Workspace isolation: cannot manage other workspace's bots
---
- [ ] T038 [P] Create `backend/src/services/bot_service.py` with create_bot, get_bot (workspace-scoped), update_bot, delete_bot (soft)
- [ ] T039 [P] Create `backend/src/services/wa_sender_service.py` with send_wa_message function (Meta Cloud API)
- [ ] T040 Create `backend/src/routers/bots.py` with GET/POST /bots, GET/PATCH/DELETE /bots/{bot_id}, POST /activate, POST /deactivate
- [ ] T041 Create `backend/src/webhooks/whatsapp.py` with GET /verify (challenge), POST /receive with BackgroundTasks
- [ ] T042 Implement Meta signature verification (X-Hub-Signature-256 HMAC) in `backend/src/webhooks/whatsapp.py`
- [ ] T043 Implement message type handling (text, audio, image, interactive) in `backend/src/webhooks/whatsapp.py`
- [ ] T044 Add retry with exponential backoff via Redis for Meta API errors (130429, 131026)
- [ ] T045 Wire webhook router and bot router into `backend/src/main.py`
- [ ] T046 Write integration tests for bot CRUD in `backend/tests/integration/test_bots.py`
- [ ] T047 Write integration tests for WhatsApp webhook in `backend/tests/integration/test_webhooks.py`
---
## Phase 5: AI Pipeline [US3]
*Goal: AI engine with dialect normalization, intent routing, and RAG chain*
### Independent Test Criteria
- Dialect normalizer converts Egyptian Arabic slang to processable form
- Intent router classifies messages into 9 intent categories with confidence
- RAG chain retrieves relevant knowledge items by semantic similarity
- Response generated in Egyptian colloquial Arabic (عامية مصرية), not MSA
- Pipeline handles GREETING, HUMAN_REQUEST, COMPLAINT as special cases
---
- [ ] T048 [P] Create `backend/src/chains/dialect_normalizer.py` per spec with normalize_dialect function
- [ ] T049 [P] Create `backend/src/chains/intent_router.py` per spec with IntentRouter class, 9 intents
- [ ] T050 [P] Create `backend/src/chains/rag_chain.py` per spec with RAG chain using FAISS + Gemini Pro
- [ ] T051 [P] Create `backend/src/chains/orchestrator.py` with message_processing_pipeline
- [ ] T052 [P] Create `backend/src/chains/intent_handlers.py` with scripted responses for GREETING, HUMAN_REQUEST, COMPLAINT
- [ ] T053 [P] Create `backend/src/services/vector_store.py` with FAISS index management (build, add, search)
- [ ] T054 Wire orchestrator into `backend/src/webhooks/whatsapp.py` process_message call
- [ ] T055 Create `backend/src/services/ai_service.py` with Gemini client initialization
- [ ] T056 Write unit tests for dialect_normalizer in `backend/tests/unit/test_chains/`
- [ ] T057 Write unit tests for intent_router in `backend/tests/unit/test_chains/`
---
## Phase 6: Knowledge Base [US4]
*Goal: FAQ knowledge base with manual Q&A, FAISS indexing, and conversation logging*
### Independent Test Criteria
- POST /api/v1/bots/{bot_id}/knowledge adds FAQ items
- POST /api/v1/bots/{bot_id}/knowledge/reindex rebuilds FAISS index
- Every WhatsApp message creates conversation + message records
- RAG chain uses per-bot knowledge base (not global)
---
- [ ] T058 [P] Create `backend/src/services/knowledge_service.py` with create_item, get_items, delete_item, reindex
- [ ] T059 [P] Create `backend/src/services/conversation_service.py` with get_or_create_conversation, add_message
- [ ] T060 [P] Create `backend/src/services/embedding_service.py` with text-embedding-004 via Gemini
- [ ] T061 Create `backend/src/routers/knowledge.py` with GET/POST/DELETE /bots/{bot_id}/knowledge, POST /reindex
- [ ] T062 Create `backend/src/routers/conversations.py` with GET /conversations, GET /conversations/{id}/messages
- [ ] T063 Wire knowledge and conversation services into orchestrator
- [ ] T064 Wire conversation router into `backend/src/main.py`
- [ ] T065 Write integration tests for knowledge base in `backend/tests/integration/test_knowledge.py`
---
## Phase 7: Human Handoff [US5]
*Goal: Human handoff queue with WhatsApp notification to bot owner*
### Independent Test Criteria
- Conversation transitions to "handed_off" status when HUMAN_REQUEST intent detected
- HandoffQueue record created with reason
- POST /api/v1/handoffs returns pending handoffs for owner
- PATCH /api/v1/handoffs/{id}/assign assigns to agent
- PATCH /api/v1/handoffs/{id}/resolve closes handoff
- WhatsApp notification sent to workspace owner on handoff
---
- [ ] T066 [P] Create `backend/src/services/handoff_service.py` with create_handoff, get_pending, assign_handoff, resolve_handoff
- [ ] T067 Create `backend/src/routers/handoffs.py` with GET /handoffs, PATCH /assign, PATCH /resolve
- [ ] T068 Wire HUMAN_REQUEST intent handler to create_handoff + send_wa_message to owner
- [ ] T069 Wire handoff router into `backend/src/main.py`
- [ ] T070 Write integration tests for handoff in `backend/tests/integration/test_handoffs.py`
---
## Phase 8: Polish & Cross-Cutting
*Goal: Observability, health checks, and final integration*
### Independent Test Criteria
- Health check endpoint returns component status
- Structured JSON logs with request_id, latency, intent metadata
- Analytics endpoints return message volume and intent breakdown
- All Phase 1-7 tasks complete and passing
---
- [ ] T071 Create `backend/src/routers/analytics.py` with GET /analytics/overview, GET /analytics/bots/{bot_id}
- [ ] T072 Add structured logging with python-json-logger (request_id, latency, intent_detected, processing_ms)
- [ ] T073 Add Redis rate limiting per conversation in `backend/src/services/wa_sender_service.py`
- [ ] T074 Create `backend/src/main.py` health check with DB + Redis ping
- [ ] T075 Add CORS middleware, security headers, request ID middleware to `backend/src/main.py`
- [ ] T076 Create `backend/tests/conftest.py` with pytest fixtures (async_db, test_client, test_bot)
- [ ] T077 Create `backend/Dockerfile` for production container
- [ ] T078 Update `backend/docker-compose.yml` with production config
- [ ] T079 Final smoke test: run server, send WhatsApp test message, verify response flows end-to-end
- [ ] T080 Verify all task file paths exist and imports resolve
---
## Task Summary
| Metric | Count |
|---|---|
| **Total tasks** | 80 |
| **Phase 1 (Setup)** | 9 |
| **Phase 2 (Foundational)** | 21 |
| **Phase 3 (Auth + Workspace)** | 7 |
| **Phase 4 (Bot CRUD + Webhooks)** | 10 |
| **Phase 5 (AI Pipeline)** | 10 |
| **Phase 6 (Knowledge Base)** | 8 |
| **Phase 7 (Human Handoff)** | 5 |
| **Phase 8 (Polish)** | 10 |
| **Parallelizable [P]** | 36 |
| **User Stories** | 5 (US1-US5) |
---
## MVP Scope Recommendation
**Suggested MVP (Weeks 1-3)**: Phases 1-4 + T048 (dialect normalizer placeholder)
- Delivers: Auth, Bot CRUD, WhatsApp webhook with text acknowledgment
- Omits: Full AI pipeline (Gemini calls) for initial pilot
- Rationale: Can test WhatsApp integration with real users, gather feedback, then add AI
**Full MVP**: All 80 tasks (Weeks 1-6)
---
## Implementation Strategy
1. **Week 1**: Phases 1-2 (setup + DB + models) — foundation for everything
2. **Week 2**: Phase 3 (auth) + Phase 4 (bot CRUD) — core API ready
3. **Week 3**: WhatsApp webhook end-to-end — first live test
4. **Week 4**: Phase 5 (AI pipeline) — intelligent responses
5. **Week 5**: Phase 6 (knowledge base + RAG) — content-aware bot
6. **Week 6**: Phase 7 (human handoff) — escalation for complex queries
7. **Week 7+**: Phase 8 (polish) — production hardening
---
## Format Validation
All 80 tasks follow checklist format: `- [ ] T### [P?] [Story?] Description with file path`