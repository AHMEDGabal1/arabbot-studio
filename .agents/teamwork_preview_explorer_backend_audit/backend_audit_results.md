# ArabBot Studio: FastAPI Backend Production Readiness & Security Audit Report

**Date**: 2026-07-15
**Auditor Role**: Staff Software Engineer, Security Engineer, and API Architect (backend_explorer)
**Target Directory**: `backend/`

---

## Executive Summary

ArabBot Studio is a FastAPI-based backend tailored for managing Egyptian SMB AI chatbots on WhatsApp. The codebase utilizes modern asynchronous patterns (`async/await` with SQLAlchemy 2.0 and PostgreSQL in production, FastAPI routing, and LangChain for LLM processing). While the database isolation and routing structures are logically organized, there are several **critical and high-severity issues** that prevent the application from being production-ready.

The most notable issues include:
1. **Critical business logic defect in Human Handoff**: When a support conversation is resolved, the status of the conversation is never reset to `active`, leaving the user permanently muted from AI responses.
2. **Critical security/installation bug**: The `bcrypt` package is used for password hashing but is missing from both `requirements.txt` and `pyproject.toml`, which breaks new installations and Docker builds.
3. **High-severity authentication defect**: The `get_current_workspace` dependency ignores the workspace switcher value in the JWT token, preventing multi-workspace users from switching between their accounts.
4. **High-severity RAG index defect**: The FAISS vector store search logic does not account for negative index values (`-1`) returned when the index contains fewer items than `k`. This causes the system to return duplicated context to the LLM.
5. **High-severity bypass of bot status**: Inactive bots still respond to webhook messages.

Resolving these issues is necessary before deploying ArabBot Studio to production.

---

## Scores (out of 10)

*   **Security Score**: `6.5 / 10`
*   **Code Quality Score**: `8.0 / 10`
*   **API Design Score**: `8.5 / 10`
*   **Performance Score**: `7.5 / 10`
*   **Maintainability Score**: `8.0 / 10`
*   **Production Readiness Score**: `6.5 / 10`

---

## Deployment Blockers (Critical / High Issues)

These issues MUST be resolved before shipping the code to production.

| ID | Title | Severity | Impact |
| :--- | :--- | :--- | :--- |
| **AUD-01** | Missing `bcrypt` Dependency | Critical | Fresh installations and Docker builds crash due to `ModuleNotFoundError`. |
| **AUD-02** | Permanent Handoff Loop (Stuck in `handed_off` Status) | Critical | The bot ignores all future user messages forever after a single handoff is triggered. |
| **AUD-03** | Ineffective Workspace Switcher in JWT Validation | High | Users are locked into a single workspace and cannot switch accounts. |
| **AUD-04** | FAISS Vector Store Negative Index Range Issue (RAG) | High | Duplicate context is sent to the LLM, inflating token costs and corrupting prompt structure. |
| **AUD-05** | Webhook Processing for Inactive Bots | High | Inactive bots still reply to WhatsApp messages, inflating API costs and sending unwanted responses. |

---

## Detailed Findings

### AUD-01: Missing `bcrypt` Dependency
**Severity**: Critical  
**File**: `backend/requirements.txt`, `backend/pyproject.toml`  
**Problem**: The `bcrypt` library is imported and used in `backend/src/routers/auth.py` for password hashing and verification, but it is not listed in `requirements.txt` or `pyproject.toml` dependencies.  
**Impact**: Fresh builds of the backend environment (e.g. running `pip install -r requirements.txt` or building the Docker container) will result in a `ModuleNotFoundError` when hitting the `/register` or `/login` endpoints.  
**Recommendation**: Add `bcrypt` to the dependencies in both `requirements.txt` and `pyproject.toml`.  
**Example Fix**:  
In `requirements.txt`:
```text
bcrypt==4.1.3
```
In `pyproject.toml`:
```toml
dependencies = [
    # ... other dependencies ...
    "bcrypt==4.1.3",
]
```
**Best Practice**: Ensure all imported libraries are explicitly pinned and tracked in dependency files (CWE-439).

---

### AUD-02: Permanent Handoff Loop (Stuck in `handed_off` Status)
**Severity**: Critical  
**File**: `backend/src/services/handoff_service.py` (Line 61)  
**Problem**: The `resolve_handoff` function updates the `resolved_at` column in the `handoff_queue` table but does not reset the associated `Conversation.status` column from `"handed_off"` back to `"active"`.  
**Impact**: Once a conversation is handed off to a human agent, it remains stuck in `"handed_off"` status forever. The WhatsApp webhook (`process_incoming`) skips AI processing for any conversation with `"handed_off"` status, meaning the bot will never respond to this user again, even after the human agent marks the issue as resolved.  
**Recommendation**: Update `resolve_handoff` to also reset the `Conversation.status` to `"active"`.  
**Example Fix**:
```python
async def resolve_handoff(db: AsyncSession, handoff_id: str, workspace_id: str) -> HandoffQueue | None:
    subq = select(Conversation.id).join(Bot).where(Bot.workspace_id == uuid.UUID(workspace_id))
    result = await db.execute(
        update(HandoffQueue)
        .where(
            HandoffQueue.id == uuid.UUID(handoff_id),
            HandoffQueue.resolved_at.is_(None),
            HandoffQueue.conversation_id.in_(subq),
        )
        .values(resolved_at=datetime.now(timezone.utc))
        .returning(HandoffQueue)
    )
    handoff = result.scalar_one_or_none()
    if handoff:
        await db.execute(
            update(Conversation)
            .where(Conversation.id == handoff.conversation_id)
            .values(status="active")
        )
        await db.flush()
    return handoff
```
**Best Practice**: Ensure state transitions are fully completed across all related database records (OWASP State Machine Management).

---

### AUD-03: Ineffective Workspace Switcher in JWT Validation
**Severity**: High  
**File**: `backend/src/deps.py` (Lines 43-56)  
**Problem**: While the workspace middleware extracts a `workspace_id` from the JWT token and writes it to `request.state.workspace_id`, the `get_current_workspace` dependency ignores this value entirely. Instead, it queries the `WorkspaceMember` table filtering only by `user_id` and takes the first row (`.limit(1)`).  
**Impact**: Multi-workspace users cannot switch workspaces; their requests are always tied to the first workspace returned by the DB query. Additionally, if the frontend sends a JWT scoped to a secondary workspace, the backend will silently route the queries to the default workspace instead of using the workspace ID in the token.  
**Recommendation**: Modify `get_current_workspace` to read from `request.state.workspace_id` (which can be obtained by accessing the `Request` object via FastAPI dependency injection) and verify that the user is indeed a member of that workspace.  
**Example Fix**:
```python
from fastapi import Request

async def get_current_workspace(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Workspace:
    workspace_id_str = getattr(request.state, "workspace_id", None)
    if not workspace_id_str:
        # Fallback to default if not present
        result = await db.execute(
            select(WorkspaceMember)
            .where(WorkspaceMember.user_id == user.id)
            .options(selectinload(WorkspaceMember.workspace))
            .limit(1)
        )
        membership = result.scalar_one_or_none()
    else:
        try:
            target_workspace_id = uuid.UUID(workspace_id_str)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid workspace ID")
            
        result = await db.execute(
            select(WorkspaceMember)
            .where(WorkspaceMember.user_id == user.id, WorkspaceMember.workspace_id == target_workspace_id)
            .options(selectinload(WorkspaceMember.workspace))
        )
        membership = result.scalar_one_or_none()
        
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No workspace found or permission denied")
    return membership.workspace
```
**Best Practice**: Ensure authentication tokens scope access properly, and authenticate the scope parameters with the database (OWASP Broken Object Level Authorization).

---

### AUD-04: FAISS Vector Store Negative Index Range Issue (RAG)
**Severity**: High  
**File**: `backend/src/services/vector_store.py` (Line 101)  
**Problem**: When searching the FAISS index (`index.search(...)`), if the index contains fewer documents than `k` (e.g. 1 document in database, `k=3` requested), FAISS returns `-1` for empty slots. Because Python supports negative indexing (e.g. `data["texts"][-1]` returns the last document), the list comprehension returns the last document multiple times instead of skipping the empty slot.  
**Impact**: Duplicate and incorrect context is sent to the LLM during RAG execution. This causes bloated prompts, higher token usage, and redundant data fed to the LLM model.  
**Recommendation**: Add a check to only retrieve elements where `i >= 0`.  
**Example Fix**:
```python
async def search(bot_id: str, query: str, k: int = 3) -> list[str]:
    async with _get_lock(bot_id):
        if not index_exists(bot_id):
            return []
        embeddings = _get_embeddings()
        if embeddings is None:
            return []
        query_vector = await embeddings.aembed_query(query)
        index = faiss.read_index(str(_index_path(bot_id)))
        distances, indices = index.search(np.array([query_vector]).astype("float32"), k)
        with open(_store_path(bot_id), "r", encoding="utf-8") as f:
            data = json.load(f)
        return [data["texts"][i] for i in indices[0] if 0 <= i < len(data["texts"])]
```
**Best Practice**: Validate all returned indices from numerical library calls before accessing Python collections (CWE-125 Out-of-bounds Read).

---

### AUD-05: Webhook Processing for Inactive Bots
**Severity**: High  
**File**: `backend/src/webhooks/whatsapp.py` (Lines 142-172)  
**Problem**: The webhook routes verify that the bot exists (`Bot.deleted_at.is_(None)`), but they do not check whether the bot is active (`Bot.is_active`).  
**Impact**: Bots that are marked as inactive/disabled in the dashboard will still process incoming events, invoke LangChain LLM completions, and send replies on WhatsApp. This leads to billing inflation (AI API costs) and unwanted automated replies.  
**Recommendation**: Enforce `Bot.is_active == True` in the database query inside both the verify and receive webhook handlers.  
**Example Fix**:
```python
    result = await db.execute(select(Bot).where(Bot.id == bot_id, Bot.is_active == True, Bot.deleted_at.is_(None)))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bot not found or inactive")
```
**Best Practice**: Ensure webhook pipelines check target state and authorization flags before executing backend logic.

---

### AUD-06: Overhead of `httpx.AsyncClient` Instantiation per Request
**Severity**: Medium  
**File**: `backend/src/services/wa_sender_service.py` (Lines 32-33)  
**Problem**: The `send_wa_message` function instantiates a new `httpx.AsyncClient()` block on every call.  
**Impact**: Recreating the client pool on each request introduces latency (due to TCP/SSL handshake setup) and risks connection pool starvation or file descriptor exhaustion under load.  
**Recommendation**: Declare a single module-level client or manage the client lifecycle using FastAPI lifespan setup.  
**Example Fix**:
```python
# Create a reusable client at the module level
_client = httpx.AsyncClient()

async def send_wa_message(
    to: str,
    text: str,
    phone_number_id: str,
    access_token: str,
    retry_count: int = 0,
) -> dict:
    # ...
    # Use the shared client
    resp = await _client.post(url, json=payload, headers=headers)
    # ...
```
**Best Practice**: Reuse HTTP connections via persistent client instances (performance optimization).

---

### AUD-07: Unhandled ValueError in UUID Conversions (500 Error instead of 401/400)
**Severity**: Medium  
**File**: `backend/src/deps.py` (Line 36), `backend/src/routers/auth.py` (Line 98)  
**Problem**: String values parsed from JWT `sub` or `workspace_id` parameters are cast directly to `uuid.UUID(...)` outside of `try...except` blocks.  
**Impact**: If a client sends a token containing a malformed UUID, the application throws a `ValueError` which goes unhandled, leading to a HTTP 500 Internal Server Error instead of a clean HTTP 401 Unauthorized or 400 Bad Request.  
**Recommendation**: Wrap UUID parsing in a `try...except ValueError` block or perform it within the JWT decode block.  
**Example Fix**:
```python
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token identifier")
    
    result = await db.execute(select(User).where(User.id == user_uuid))
```
**Best Practice**: Always validate external inputs before passing them to internal database functions (CWE-20: Improper Input Validation).

---

### AUD-08: Token Refresh Session Persistence / Revocation Bypass
**Severity**: Medium  
**File**: `backend/src/routers/auth.py` (Line 87)  
**Problem**: The `/refresh` token endpoint decodes the `workspace_id` from the refresh token and issues a new access token without validating if the user is still a member of that workspace.  
**Impact**: If a user is removed from a workspace or their role is modified, they can continue to refresh their session and generate new access tokens for that workspace indefinitely as long as their refresh token is valid.  
**Recommendation**: Query the `WorkspaceMember` table in the refresh handler to ensure the user still has membership in the requested `workspace_id` before issuing the new token.  
**Example Fix**:
```python
    # After loading the user:
    member_check = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.user_id == user.id,
            WorkspaceMember.workspace_id == uuid.UUID(workspace_id)
        )
    )
    if not member_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Workspace access revoked")
```
**Best Practice**: Re-validate session authorization parameters at critical checkpoints (OWASP Broken Authentication).

---

### AUD-09: Sync Redis Pipeline Commands Awaited
**Severity**: Low  
**File**: `backend/src/services/rate_limiter.py` (Lines 29-32)  
**Problem**: Pipeline methods like `pipe.zadd` and `pipe.expire` are awaited (`await pipe.zadd(...)`). In `redis-py` async interface, pipeline commands do not return coroutines; they return the pipeline builder instance.  
**Impact**: Awaiting non-coroutines raises `TypeError`. This exception is caught in the `try...except` block, causing the Redis-based rate limiter to fail silently and fall back to the in-memory rate limiter, degrading performance and increasing lock contentions in multi-worker environments.  
**Recommendation**: Remove the `await` keyword from the pipeline buffering calls. Only `pipe.execute()` should be awaited.  
**Example Fix**:
```python
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {f"{now}:{uuid.uuid4()}": now})
        pipe.expire(key, window_seconds)
        pipe.zcard(key)
        results = await pipe.execute()
```
**Best Practice**: Use redis pipeline buffering correctly (do not await individual buffer commands).

---

### AUD-10: Testing Gaps on Asynchronous AI Processes
**Severity**: Medium  
**File**: `backend/tests/integration/test_webhooks.py`  
**Problem**: The webhook tests trigger background tasks which run the LangChain AI processing chains asynchronously. Any runtime errors (such as missing API keys, rate limits, or model config crashes) inside the background task are logged and swallowed by the `try...except` handler inside `process_incoming`, returning HTTP 200 to the caller.  
**Impact**: The test suite passes successfully even if the core AI logic is broken, creating a false sense of security.  
**Recommendation**: Write tests that call the AI logic synchronously or explicitly mock the orchestrator services to assert proper output structure and error handling.  
**Best Practice**: Ensure asynchronous task execution paths are explicitly tracked, verified, or mocked in test assertions.

---

### AUD-11: hardcoded Database Credentials in docker-compose
**Severity**: Low  
**File**: `backend/docker-compose.yml` (Lines 7-9)  
**Problem**: The PostgreSQL service has hardcoded database user and password values (`user` and `pass`).  
**Impact**: If deployed directly using this file, weak credentials are used in production, violating secure defaults.  
**Recommendation**: Use environment variables to inject the database username and password in Docker compose.  
**Best Practice**: Never hardcode credentials in configuration files (CWE-798).

---

### AUD-12: Root User Configuration in Dockerfile
**Severity**: Low  
**File**: `backend/Dockerfile`  
**Problem**: The Dockerfile does not specify a non-root user to execute the FastAPI application.  
**Impact**: The application runs as the root user. If a remote code execution vulnerability occurs, the attacker immediately gains full root privilege within the container, increasing the blast radius.  
**Recommendation**: Create a non-privileged user and switch to it using the `USER` directive in the Dockerfile.  
**Example Fix**:
```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
**Best Practice**: Run containers with the principle of least privilege (CWE-250).

---

### AUD-13: Quota Messaging Limits Not Enforced
**Severity**: Low  
**File**: `backend/src/webhooks/whatsapp.py` (Lines 93-100)  
**Problem**: The application tracks monthly usage in `messages_used_this_month` but never compares it against `monthly_message_limit` to block incoming webhook processing if exceeded.  
**Impact**: Inactive or billing-exceeded workspaces can continue to send messages without limit.  
**Recommendation**: Add a check before running AI processes that validates if `messages_used_this_month < monthly_message_limit`.

---

### AUD-14: Hardcoded Confidence Score in Intent Routing
**Severity**: Low  
**File**: `backend/src/chains/intent_router.py` (Line 45)  
**Problem**: The `classify_intent` service returns a hardcoded confidence score of `0.0`.  
**Impact**: The intent routing confidence database field is always 0.0, rendering analytics charts on confidence levels meaningless.  
**Recommendation**: Parse confidence from the LLM response or use a structured output schema to extract both intent and confidence from the model.

---

## What's Correct and Why

| Area | ✅ Correct | Why |
| :--- | :--- | :--- |
| **Workspace isolation on data retrieval** | Correct | `routers/conversations.py` and `routers/bots.py` join or filter queries by `workspace_id` to ensure users only retrieve data belonging to their workspace. |
| **SQL Injection Protection** | Correct | The codebase uses SQLAlchemy 2.0 ORM expressions (`select()`, `where()`) rather than raw SQL strings with string formatting, which mitigates SQL injection vulnerabilities. |
| **Security Headers** | Correct | The middleware in `src/main.py` applies security headers like `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Content-Security-Policy: default-src 'self'`. |
| **Cross-Origin Resource Sharing (CORS)** | Correct | CORS configuration restricts origins to `settings.base_url` in production environments, preventing wildcard usage in live environments. |
| **Lifespan Management** | Correct | Lifespan context manager is used for startup bucket verification asynchronously. |
| **Signature verification** | Correct | Meta app signature is validated on the raw payload using HMAC SHA-256 before processing. |
