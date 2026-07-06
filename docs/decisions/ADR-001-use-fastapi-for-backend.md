# ADR-001: Use FastAPI for Backend Framework

## Status
Accepted

## Date
2026-07-06

## Context
ArabBot Studio requires a backend framework capable of handling rapid conversational IO from WhatsApp, managing long-running LLM generation tasks, and serving a dashboard API. The backend must integrate easily with AI ecosystems (LangChain/Gemini), handle high concurrency without blocking, and enforce strict data validation to prevent malformed API/Webhook payloads.

## Decision
Use FastAPI (Python 3.12) as the core backend framework.

## Alternatives Considered

### Django
- Pros: "Batteries included", robust ORM, admin panel.
- Cons: Synchronous by default (though async support is improving), heavyweight, ORM can be difficult to integrate seamlessly with highly async LLM pipelines.
- Rejected: We need first-class async support from the ground up to prevent the webhook handler from blocking during slow LLM inferences.

### Node.js (Express / NestJS)
- Pros: Native async/event-loop, shared language with frontend (TypeScript).
- Cons: The AI/ML ecosystem (LangChain, FAISS, generic LLM tooling) is overwhelmingly Python-first. Node.js ports of these libraries often lag behind or have missing features.
- Rejected: The business value is in the AI capabilities; Python is non-negotiable for the AI layer.

### Flask
- Pros: Lightweight, familiar.
- Cons: Async support is bolted on. No built-in data validation or OpenAPI schema generation.
- Rejected: FastAPI offers the lightweight nature of Flask but with native async, Pydantic validation, and auto-generated docs.

## Consequences
- **Validation**: We rely heavily on Pydantic for strict request/response validation, reducing boilerplate error checking.
- **Async Complexity**: Developers must be careful to use `asyncio` correctly (e.g., `asyncpg`, async SQLAlchemy) and avoid synchronous blocking calls (like standard `requests` or `time.sleep()`).
- **Documentation**: We get free OpenAPI (Swagger) documentation which makes frontend integration significantly easier.
