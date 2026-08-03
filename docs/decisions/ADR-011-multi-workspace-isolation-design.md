# ADR-011: Multi-Workspace Isolation Design

## Status
Accepted

## Date
2026-08-03

## Context
ArabBot Studio is a multi-tenant B2B SaaS platform where a single database and application instance serve multiple organizations. Each organization (Workspace) expects complete data isolation:
- Company A cannot view, modify, or query Company B's bots, conversations, or customer data
- Users may belong to multiple workspaces (agency employees managing multiple client accounts)
- A compromised user account in one workspace should not expose other workspaces' data

Without strict isolation, the platform is vulnerable to Insecure Direct Object Reference (IDOR) attacks where users manipulate IDs in API requests to access unauthorized data.

## Decision Drivers
- Must enforce isolation at application layer (database RLS too complex for SQLAlchemy connection pooling)
- Must support user membership in multiple workspaces (role-based access per workspace)
- Must minimize query complexity (avoid nested joins on every query)
- Must prevent accidental cross-workspace data leaks during development (fail-safe defaults)
- Must integrate with JWT authentication (workspace_id in token claims)

## Decision
Implement **JWT-based workspace identification with middleware injection and ORM-level query filtering**.

### Architecture Components

#### 1. Data Model Hierarchy
```
User (global identity, email/password)
  ↓ Many-to-Many
WorkspaceMembership (user_id, workspace_id, role)
  ↓
Workspace (tenant root entity, message quota, billing)
  ↓ One-to-Many
Bot (workspace_id FK, bot config)
  ↓ One-to-Many
├── Conversation (bot_id FK)
│   ↓ One-to-Many
│   └── Message (conversation_id FK)
├── AgentConfig (bot_id FK)
├── GuardrailRule (bot_id FK)
└── KnowledgeItem (bot_id FK)

CustomerProfile (workspace_id FK, cross-bot customer memory)
```

**Key Design**: Child entities (Conversation, AgentConfig, etc.) do NOT have direct `workspace_id` FK. Workspace ownership is derived through `bot_id` FK.

#### 2. JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "workspace_id": "workspace-uuid",
  "role": "admin",
  "exp": 1722690423
}
```

**Why workspace_id in token?**
- Enables fast workspace identification without database lookup on every request
- Supports multi-workspace users (user requests new token when switching workspaces)
- Token signing prevents tampering (user cannot forge workspace_id)

#### 3. Workspace Middleware
```python
# src/middleware/workspace.py
async def workspace_middleware(request: Request, call_next):
    # Skip auth endpoints
    if request.url.path.startswith("/api/v1/auth"):
        return await call_next(request)
    
    # Extract JWT from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Missing authorization")
    
    token = auth_header.removeprefix("Bearer ")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        workspace_id = payload.get("workspace_id")
        if not workspace_id:
            raise HTTPException(401, "Invalid token: missing workspace_id")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    
    # Load workspace from database
    async with async_session_factory() as db:
        workspace = await db.get(Workspace, UUID(workspace_id))
        if not workspace:
            raise HTTPException(403, "Workspace not found")
        
        # Inject workspace into request context
        request.state.workspace = workspace
        request.state.user_id = payload.get("sub")
    
    return await call_next(request)
```

#### 4. Dependency Injection in Routes
```python
# src/deps.py
async def get_current_workspace(request: Request) -> Workspace:
    """FastAPI dependency that retrieves workspace from middleware."""
    if not hasattr(request.state, "workspace"):
        raise HTTPException(403, "Workspace not available")
    return request.state.workspace

# src/routers/bots.py
@router.get("/bots")
async def list_bots(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Bot)
        .where(Bot.workspace_id == workspace.id, Bot.deleted_at.is_(None))
        .order_by(Bot.created_at.desc())
    )
    bots = result.scalars().all()
    return {"bots": [serialize_bot(b) for b in bots]}
```

#### 5. Query Filtering Patterns

**Pattern 1: Direct workspace_id filter (root entities)**
```python
# Bots, CustomerProfiles have workspace_id FK
await db.execute(
    select(Bot).where(
        Bot.workspace_id == workspace.id,
        Bot.id == bot_id,
        Bot.deleted_at.is_(None)
    )
)
```

**Pattern 2: Join-based filter (child entities)**
```python
# Conversations belong to bots, which belong to workspaces
await db.execute(
    select(Conversation)
    .join(Bot, Conversation.bot_id == Bot.id)
    .where(
        Bot.workspace_id == workspace.id,
        Conversation.id == conversation_id
    )
)
```

**Pattern 3: Verification pattern (before updates/deletes)**
```python
async def delete_agent(bot_id: str, agent_id: str, workspace: Workspace, db: AsyncSession):
    # First verify bot belongs to workspace
    bot = await db.get(Bot, UUID(bot_id))
    if not bot or bot.workspace_id != workspace.id:
        raise HTTPException(404, "Bot not found")
    
    # Then delete agent (implicitly workspace-safe)
    agent = await db.get(AgentConfig, UUID(agent_id))
    if not agent or agent.bot_id != UUID(bot_id):
        raise HTTPException(404, "Agent not found")
    
    await db.delete(agent)
    await db.commit()
```

## Alternatives Considered

### PostgreSQL Row Level Security (RLS)
- **Approach**: Database enforces workspace filtering via policies
```sql
CREATE POLICY workspace_isolation ON bots
    USING (workspace_id = current_setting('app.workspace_id')::uuid);
```
- **Pros**: Absolute security (impossible to bypass in application code), works with any ORM
- **Cons**: Requires setting session variable on every connection (`SET app.workspace_id = '...'`), breaks SQLAlchemy connection pooling (connections shared across requests), complex connection lifecycle management
- **Rejected**: SQLAlchemy/asyncpg pools reuse connections across requests without proper session variable cleanup

### Separate Database Per Tenant
- **Approach**: `workspace_abc.public.bots`, `workspace_xyz.public.bots`
- **Pros**: Ultimate isolation, independent backups/restores, easier to shard
- **Cons**: Migration nightmare (run Alembic on 1000+ databases), connection pool explosion, cross-workspace queries impossible
- **Rejected**: Operationally infeasible for startup scale

### Schema-Based Isolation
- **Approach**: `workspace_abc.bots`, `workspace_xyz.bots` (schemas within single DB)
- **Pros**: Better than separate DBs (single migration), still strong isolation
- **Cons**: Schema count limits (10K+ workspaces = 10K+ schemas), search_path management complexity, cross-workspace analytics difficult
- **Rejected**: PostgreSQL schema limits and search_path brittleness

### X-Workspace-ID Header
- **Approach**: Client sends workspace ID in custom header, backend filters by header value
- **Pros**: Simple, no JWT parsing needed
- **Cons**: Trivial to spoof (user changes header to access other workspaces), requires separate authentication mechanism
- **Rejected**: Insecure without cryptographic binding (JWT signature provides this)

## Consequences

### Positive
- **Lightweight**: No database-level config, pure application logic
- **Developer-Friendly**: Middleware automatically injects workspace, routes use standard dependency injection
- **Flexible**: Supports multi-workspace users (issue new JWT with different workspace_id)
- **Auditable**: Every request logs workspace_id for forensics
- **Token-Based**: Works with mobile apps, SPAs, API clients (no cookies required)

### Negative
- **Developer Burden**: Every query MUST include workspace filter. Forgetting filter = IDOR vulnerability.
- **No Database-Level Safety Net**: If developer forgets workspace filter, database allows cross-workspace access.
- **Token Bloat**: Multi-workspace users must manage multiple tokens (one per workspace).
- **Code Review Overhead**: Security audits must verify workspace filters on every database query.

### Mitigations
- **Code Review Checklist**: PR template includes "Verified workspace isolation on all queries"
- **Integration Tests**: Test suite includes cross-workspace access attempts (should return 404)
- **Static Analysis**: Add linter rule to detect queries without workspace filter (future)
- **Query Helpers**: Build wrapper functions that auto-inject workspace filters (future)

## Security Testing
Integration tests verify isolation:
```python
def test_cross_workspace_bot_access():
    workspace_a = create_workspace()
    workspace_b = create_workspace()
    bot_a = create_bot(workspace_a.id)
    
    token_b = generate_jwt(workspace_id=workspace_b.id)
    response = client.get(f"/api/v1/bots/{bot_a.id}", headers={"Authorization": f"Bearer {token_b}"})
    
    assert response.status_code == 404  # Bot not found (actually exists but in different workspace)
```

## Performance Characteristics
- **Middleware Overhead**: 5-10ms (JWT decode + single DB lookup per request)
- **Query Performance**: Workspace filters use indexed columns (workspace_id on bots, bot_id on conversations)
- **Token Size**: 200-300 bytes (negligible for HTTP headers)

## Operational Notes
- **Token Expiration**: Default 7 days (configurable via `JWT_EXPIRATION_DAYS`)
- **Workspace Switching**: Frontend must request new token via `/api/v1/auth/switch-workspace`
- **Debugging**: Check `request.state.workspace` in logs to verify correct workspace loaded

## Related Decisions
- ADR-001: Use FastAPI for Backend (middleware pattern leverages FastAPI's dependency injection)
- ADR-003: Use PostgreSQL for Database (foreign keys enforce referential integrity)

## References
- Workspace Middleware: `backend/src/middleware/workspace.py`
- Dependency Injection: `backend/src/deps.py`
- JWT Utilities: `backend/src/routers/auth.py`
- Integration Tests: `backend/tests/test_workspace_isolation.py`
