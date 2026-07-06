# ADR-003: Use PostgreSQL as Primary Database

## Status
Accepted

## Date
2026-07-06

## Context
ArabBot Studio needs a persistent data store to manage users, workspaces, bots, conversations, and human handoff queues. The data model is highly structured and relational (e.g., a message belongs to a conversation, which belongs to a bot, which belongs to a workspace).

## Decision
Use PostgreSQL with SQLAlchemy (async) and asyncpg as the primary database.

## Alternatives Considered

### MongoDB / NoSQL
- Pros: Schema flexibility, easy to store unstructured JSON data (like raw LLM responses or WhatsApp webhooks).
- Cons: Poor support for complex relational queries (e.g., finding all unresolved handoffs across all bots in a specific workspace). No built-in ACID transactions across multiple documents out of the box (without complex configurations).
- Rejected: Our data model is fundamentally relational. Trying to model this in a document database leads to excessive data duplication and complex application-side join logic.

### SQLite (for production)
- Pros: Zero infrastructure, fast.
- Cons: Limited concurrent writes. Not suitable for a multi-tenant web application handling potentially hundreds of simultaneous WhatsApp webhooks.
- Rejected: We use SQLite exclusively for the local `pytest` suite due to its speed and in-memory capabilities, but it cannot scale to production needs.

### MySQL
- Pros: Excellent relational database, widely supported.
- Cons: PostgreSQL offers superior support for `JSONB` columns (which we use heavily for metadata) and advanced indexing.
- Rejected: PostgreSQL is strictly superior for our specific use case of mixing relational constraints with flexible JSON metadata.

## Consequences
- **Schema Migrations**: We use Alembic to manage strict database schema versions.
- **Async Driver**: We must use `asyncpg` to ensure database I/O does not block the FastAPI event loop.
- **JSON Support**: We can store raw, unstructured webhook payloads in `JSONB` columns while maintaining strict foreign keys for the core relational architecture.
