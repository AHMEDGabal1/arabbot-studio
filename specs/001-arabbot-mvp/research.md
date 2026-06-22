# Research: ArabBot Studio MVP

## Decision: Async Database with SQLAlchemy 2.0

**Decision**: Use SQLAlchemy 2.0 with asyncpg driver and async sessions

**Rationale**: 
- WhatsApp webhook requires fast response; blocking DB calls would violate 200ms constraint
- arabbot-prompts.md explicitly requires "ALL database operations must be async"
- asyncpg provides connection pooling essential for 10K MAU scale

**Alternatives considered**:
- Synchronous SQLAlchemy: Rejected - violates non-functional requirement
- Raw asyncpg: Rejected - loses ORM productivity, schema management
- Tortoise ORM: Rejected - less mature, less community support

---

## Decision: FAISS for Vector Storage

**Decision**: Use FAISS (Facebook AI Similarity Search) for vector embeddings

**Rationale**:
- Spec explicitly calls out FAISS
- In-memory FAISS is fast for read-heavy workloads (<10K documents)
- LangChain has built-in FAISS integration
- Simpler than pgvector for MVP (no PostgreSQL extension setup)

**Alternatives considered**:
- pgvector: Rejected - requires PostgreSQL extension setup, slightly slower for pure similarity search
- Pinecone: Rejected - external dependency, cost at scale
- Weaviate: Rejected - heavier infrastructure

---

## Decision: Gemini 2.0 Flash for Intent Routing, Gemini 2.5 Pro for Response Generation

**Decision**: Dual-model strategy

**Rationale**:
- Flash is fast + cheap: ideal for intent classification on every message
- Pro is high-quality: needed for natural Egyptian Arabic response generation
- Cost optimization: only call expensive Pro model when RAG is needed

**Alternatives considered**:
- Single model (Pro only): Rejected - 10x cost increase
- Single model (Flash only): Rejected - response quality insufficient for customer-facing chatbot
- OpenAI: Rejected - not specified in requirements, Gemini preferred for Arabic

---

## Decision: JWT with Workspace Isolation

**Decision**: JWT tokens with workspace_id claim, workspace-scoped queries mandatory

**Rationale**:
- Multi-tenant SaaS requires workspace isolation at DB level
- JWT provides stateless auth suitable for API-heavy workload
- Workspace ID in token prevents accidental cross-tenant queries

**Alternatives considered**:
- Session-based auth: Rejected - not stateless, harder to scale
- API keys: Rejected - no user identity for conversation attribution
- OAuth2: Rejected - overkill for internal SaaS

---

## Decision: Background Processing for Heavy AI

**Decision**: Use FastAPI BackgroundTasks or Redis queue for heavy AI processing

**Rationale**:
- Meta webhook must return 200 within ~5 seconds or retries
- AI processing (RAG) can exceed this; must be async
- Redis queue preferred for durability and rate limiting

**Alternatives considered**:
- Synchronous processing: Rejected - violates webhook timing constraint
- Celery: Rejected - adds infrastructure complexity; Redis is already in stack
- In-memory queue: Rejected - lost messages on restart

---

## Decision: Exponential Backoff for External API Errors

**Decision**: Implement retry with exponential backoff (1s → 2s → 4s) using Redis for rate tracking

**Rationale**:
- WhatsApp API returns 130429 (rate limit) and 131026 (undeliverable)
- Standard pattern is exponential backoff
- Redis tracks per-conversation rate limits

**Alternatives considered**:
- Fail fast: Rejected - bad UX for transient errors
- Fixed delay: Rejected - inefficient, may still hit rate limits
- No retry: Rejected - messages lost

---

## Decision: Soft Deletes for Bots and Conversations

**Decision**: Add `deleted_at` TIMESTAMPTZ column to bots and conversations tables

**Rationale**:
- arabbot-prompts.md §D explicitly requires soft deletes
- Conversation history may be needed for analytics even after "deletion"
- Easier recovery from accidental deletes

**Alternatives considered**:
- Hard deletes: Rejected - violates data retention needs
- Archive tables: Referred to Phase 2+ (adds complexity)

---

## Decision: Structured Logging + Redis Counters + PostgreSQL Aggregations

**Decision**: Observability stack: JSON structured logs, Redis for real-time counters, PostgreSQL for analytics queries

**Rationale**:
- Spec calls for analytics dashboard (message volume, intent breakdown)
- Redis ideal for real-time counters (increment on each message)
- PostgreSQL aggregation queries for historical analytics

**Alternatives considered**:
- Full APM (LangSmith/Jaeger): Referred to Phase 2+ (cost/complexity)
- No observability: Rejected - cannot debug production issues
- CloudWatch: Rejected - vendor lock-in

---

## Technical Stack Summary

| Component | Technology | Version |
|---|---|---|
| Language | Python | 3.12 |
| Framework | FastAPI | 0.115.0 |
| ORM | SQLAlchemy | 2.0.36 (async) |
| DB Driver | asyncpg | 0.30.0 |
| Vector Store | FAISS | 1.9.0 |
| Cache/Session | Redis | 5.2.0 |
| AI | LangChain | 0.3.7 |
| LLM (fast) | Gemini | 2.0-flash-exp |
| LLM (full) | Gemini | 2.5-pro |
| Auth | python-jose | 3.3.0 |
| Password | passlib | 1.7.4 |
| Migration | Alembic | 1.14.0 |
| Testing | pytest | - |

---

## Phased Delivery Rationale

All 10 Phase 1 items are MVP scope, delivered sequentially (1/week):

1. **Week 1**: Auth system (JWT + workspace) — foundation for everything else
2. **Week 2**: Bot CRUD + WhatsApp webhook handler — core inbound channel
3. **Week 3**: Intent router + dialect normalizer — AI pipeline core
4. **Week 4**: Knowledge base + RAG chain — content retrieval
5. **Week 5**: Send replies + conversation logging — full message flow
6. **Week 6**: Human handoff — differentiate from simple auto-responders

Deferring to Phase 2:
- Voice notes (requires multimodal Gemini, more complex)
- Facebook Messenger (parallel channel, adds testing complexity)
- Payment links (requires merchant integration)
- Analytics dashboard (needs data first)
- Bulk upload (nice-to-have for early users)
- Testing sandbox (can test via live webhook initially)
