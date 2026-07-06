# ADR-006: Multi-tenant Workspace Isolation

## Status
Accepted

## Date
2026-07-06

## Context
ArabBot Studio is a B2B SaaS platform. A single user may belong to multiple organizations (Workspaces), and each Workspace can own multiple Bots. It is critical that a user in Workspace A cannot access, modify, or query the bots, conversations, or knowledge bases of Workspace B.

## Decision
Enforce Workspace isolation via a combination of JWT payload claims, a global `WorkspaceMiddleware`, and strict ORM-level joins on every database query.

## Alternatives Considered

### Database-level Row Level Security (RLS)
- Pros: Absolute security. The database engine itself rejects unauthorized queries.
- Cons: SQLAlchemy and standard asyncpg connection pools do not play well with dynamic PostgreSQL session variables required for RLS without significant custom connection management logic.
- Rejected: Too complex to implement cleanly with standard FastAPI/SQLAlchemy connection pooling.

### Separate Database per Tenant
- Pros: Ultimate isolation, easy backups per tenant.
- Cons: Extremely difficult to manage migrations, scaling, and connection pooling for thousands of small tenants.
- Rejected: Over-engineering for a startup MVP.

## Consequences
- **Middleware**: A `workspace_middleware` intercepts requests to `/api/v1/*` (except auth), extracts the `workspace_id` from the JWT, and injects the loaded `Workspace` model into the FastAPI `Request.state`.
- **Dependency Injection**: Routers must use the `Depends(get_current_workspace)` dependency to access the validated workspace.
- **ORM Requirement**: EVERY single database query must explicitly filter by `workspace_id`. For child entities (like Conversations or Knowledge Items), the query MUST join the `Bot` table to verify that the bot owns the conversation AND the workspace owns the bot. 
- **Security Audit**: Failure to include the workspace filter in a query results in an Insecure Direct Object Reference (IDOR) vulnerability. Code reviews must strictly verify these joins.
