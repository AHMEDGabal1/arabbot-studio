# Implementation Plan: ArabBot Studio MVP

**Branch**: `001-arabbot-mvp` | **Date**: 2026-04-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-arabbot-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a no-code/low-code platform that lets Egyptian SMBs build and deploy AI chatbots for WhatsApp Business in Egyptian Arabic dialect. Core MVP includes JWT auth with workspace isolation, WhatsApp webhook handler, AI engine with dialect normalization + intent routing + RAG, and human handoff — all with 500ms p95 latency target supporting 10K MAU.

## Technical Context

| Attribute | Value |
|---|---|
| **Language/Version** | Python 3.12 |
| **Primary Dependencies** | FastAPI, LangChain 0.3+, Google Gemini 2.0/2.5, PostgreSQL, Redis, asyncpg, python-jose, passlib |
| **Storage** | PostgreSQL (async with asyncpg) + Redis (async) + FAISS (vector store) |
| **Testing** | pytest + pytest-asyncio |
| **Target Platform** | Linux server (DigitalOcean/Railway) |
| **Project Type** | Web service (REST API + Webhooks) |
| **Performance Goals** | 500ms p95 webhook-to-ACK latency |
| **Constraints** | 200ms webhook response time (heavy AI goes to background), workspace isolation mandatory |
| **Scale/Scope** | 10,000 MAU, 100+ paying customers target |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No constitution gates defined (template constitution). Project proceeds without gate checks.

## Project Structure

### Documentation (this feature)

```
specs/001-arabbot-mvp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md            # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── main.py                 # FastAPI app factory
│   ├── config.py              # Settings via pydantic-settings
│   ├── database.py            # Async engine + session factory
│   ├── deps.py                # FastAPI dependency injection
│   ├── models/                # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── workspace.py
│   │   ├── user.py
│   │   ├── bot.py
│   │   ├── conversation.py
│   │   ├── message.py
│   │   ├── knowledge.py
│   │   └── handoff.py
│   ├── schemas/               # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── workspace.py
│   │   ├── user.py
│   │   ├── bot.py
│   │   ├── conversation.py
│   │   ├── knowledge.py
│   │   └── auth.py
│   ├── routers/               # FastAPI routers
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── bots.py
│   │   ├── knowledge.py
│   │   ├── conversations.py
│   │   └── analytics.py
│   ├── webhooks/              # Meta webhook handlers
│   │   ├── __init__.py
│   │   ├── whatsapp.py
│   │   └── facebook.py
│   ├── chains/                # LangChain chains
│   │   ├── __init__.py
│   │   ├── dialect_normalizer.py
│   │   ├── intent_router.py
│   │   ├── rag_chain.py
│   │   └── voice_handler.py
│   └── services/              # External API clients
│       ├── __init__.py
│       ├── wa_sender.py
│       ├── fb_sender.py
│       ├── payment_links.py
│       └── vector_store.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   │   ├── test_chains/
│   │   └── test_schemas/
│   └── integration/
│       ├── test_webhooks/
│       └── test_api/
├── alembic/                   # Database migrations
│   └── versions/
├── requirements.txt
├── pyproject.toml
└── .env.example

frontend/                      # Phase 2+ (not in MVP)
├── src/
│   ├── pages/
│   └── components/
└── tests/
```

**Structure Decision**: Web application with backend-only MVP. Frontend deferred to Phase 2. Backend follows FastAPI best practices with async throughout, workspace-scoped queries, and LangChain for AI pipeline.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

# PHASE 0: Research

Research complete. Key decisions documented in research.md.

---

# PHASE 1: Design & Contracts

See `research.md`, `data-model.md`, `quickstart.md`, and `contracts/` for detailed outputs.
