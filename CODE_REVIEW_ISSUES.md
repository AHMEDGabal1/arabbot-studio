# ArabBot Studio — Code Review Issues

Date: 2026-07-31
Review method: direct code review (3 subagent negotiation was cancelled before completion)

## Scores

| Area | Score /10 |
|---|---|
| Security | 5 |
| Code Quality | 7 |
| API Design | 6 |
| Performance | 6 |
| Production Readiness | 4 |

---

## Critical

### C1: Hardcoded API key committed to source
- **Severity**: Critical
- **File**: `backend/src/config.py:15`
- **Problem**: `tokenrouter_api_key: str = "sk-lps1U24JtzaMYEnj3NtCmojz0hbn0EYoixMCDLJWiqnBf907"` is a hardcoded default committed to git.
- **Impact**: Anyone with repo access has a live API key. Key can be used/cost accrued until rotated.
- **Recommendation**: Remove the default, require it via env (`tokenrouter_api_key: str | None = None` or required field), rotate the current key immediately.

### C2: Customer data (FAISS vectors) committed to git
- **Severity**: Critical
- **File**: `backend/data/faiss_indices/*.faiss` and `*.pkl`
- **Problem**: ~10 bots' worth of embedding indices and `.pkl` payloads are tracked in the repo. The current code writes `.json` (`vector_store.py:49-50`), so the `.pkl` files are stale artifacts containing embedded customer message data.
- **Impact**: Customer message embeddings are now part of git history; cannot be removed without history rewrite.
- **Recommendation**: `git rm --cached` the data files, add `backend/data/` to `.gitignore`, purge history if the repo is shared.

---

## High

### H1: DB schema created at boot, bypassing Alembic
- **Severity**: High
- **File**: `backend/src/main.py:67-68`
- **Problem**: `lifespan` runs `Base.metadata.create_all`.
- **Impact**: Alembic migrations (which exist in `backend/alembic/versions/`) are bypassed in production → uncontrolled schema changes, drift between migrations and models.
- **Recommendation**: Run `alembic upgrade head` as part of deployment; remove `create_all` from the lifespan.

### H2: CORS wildcard with allow_credentials=True
- **Severity**: High
- **File**: `backend/src/main.py:60,104`
- **Problem**: `allow_origins=["*"]` combined with `allow_credentials=True`.
- **Impact**: Browsers reject credentialed requests against a wildcard origin (breaks real auth in prod) while the config is still maximally permissive.
- **Recommendation**: Set explicit origins in `cors_origins` env var; keep `allow_credentials=True` only with a non-wildcard list.

### H3: WhatsApp webhook not idempotent (no message-id dedup)
- **Severity**: High
- **File**: `backend/src/webhooks/whatsapp.py:190-191`
- **Problem**: Every delivered message spawns `process_incoming` with no dedup on `msg["id"]`. WhatsApp redelivers messages on retries.
- **Impact**: Duplicate AI replies sent to the customer and the message quota (`messages_used_this_month`) double-counted.
- **Recommendation**: Track processed `msg["id"]` (e.g., dedup table or Redis set) and skip already-processed messages.

### H4: JWT stored in localStorage
- **Severity**: High
- **File**: `frontend/src/lib/api.ts:24,50`, `frontend/src/lib/auth.tsx:24`
- **Problem**: Access + refresh tokens persisted in `localStorage`.
- **Impact**: Any XSS reads the tokens. CSP (`default-src 'self'` at `main.py:118`) mitigates but React builds usually need `style-src 'unsafe-inline'`, so verify it works.
- **Recommendation**: Move to httpOnly cookies, or at minimum tighten CSP and validate `style-src` in production build.

---

## Medium

### M1: /auth/refresh not rate-limited and refresh tokens never rotated
- **Severity**: Medium
- **File**: `backend/src/routers/auth.py:89-114`
- **Problem**: `refresh` has no `Depends(rate_limit(...))`, and each refresh issues a new access token but keeps the same refresh token.
- **Impact**: Unbounded brute-force surface; a stolen refresh token stays valid for 7 days (`minutes=10080`).
- **Recommendation**: Add rate limiting; rotate the refresh token on each use (issue a new one, invalidate the old).

### M2: Rate limiter keys on client IP only
- **Severity**: Medium
- **File**: `backend/src/services/rate_limiter.py:46`
- **Problem**: Key is `client.host` from the request object; no `X-Forwarded-For` handling.
- **Impact**: Behind a reverse proxy all users share one IP → a single user can exhaust the shared window and cause a global 429 (DoS). Without a proxy, IPs are trivially rotated.
- **Recommendation**: Honor trusted `X-Forwarded-For`, or key on user identity (email/workspace) where available.

### M3: get_current_workspace silently falls back to first workspace
- **Severity**: Medium
- **File**: `backend/src/deps.py:76-85`
- **Problem**: When no `workspace_id` is in `request.state`, the dependency returns the user's first workspace instead of erroring.
- **Impact**: A mis-scoped request silently operates on the wrong workspace instead of failing loudly.
- **Recommendation**: Require `workspace_id` for workspace-scoped routes; raise 403 instead of the fallback.

### M4: Vector store is local disk + per-process locks
- **Severity**: Medium
- **File**: `backend/src/services/vector_store.py:14,19,23-30`
- **Problem**: FAISS indices live in `data/faiss_indices/` on local disk; per-bot locks are in-process only.
- **Impact**: Indices disappear on container redeploy; locks don't protect across multiple workers → corrupt writes under concurrency.
- **Recommendation**: Persist to object storage / DB and use a distributed lock (or accept single-process-only and document it).

### M5: SQLAlchemy echo=True in development
- **Severity**: Medium
- **File**: `backend/src/database.py:10`
- **Problem**: `echo=settings.environment == "development"`.
- **Impact**: Every query logged in dev; noisy but not a prod issue. (Positive: `statement_cache_size=0` correctly set for pgbouncer.)
- **Recommendation**: None urgent; keep gated by environment.

---

## Verified correct (no action needed)

| Area | Why |
|---|---|
| Password hashing | bcrypt via `asyncio.to_thread` + salt (`auth.py:45,74`) |
| JWT | algorithm pinned HS256, `secret_key` required with no default (`config.py:32`) |
| Webhook auth | HMAC-SHA256 with `compare_digest`, payload size cap, rate limit (`whatsapp.py:28-30,165-180`) |
| Workspace isolation | membership checked per-request via WorkspaceMember (`deps.py:62-73`) |
| Rate limiter | bounded LRU store with `popitem(last=False)` correct eviction (`rate_limiter.py:57-63`) |
| Security headers | request-id, nosniff, X-Frame-Options, CSP (`main.py:110-119`) |
| Frontend | no `dangerouslySetInnerHTML`/`innerHTML` sinks found |
| Refresh token | `type` claim enforced; malformed `sub` guarded (`auth.py:96,103-106`) |

---

## Deployment blockers (fix before prod)

1. Rotate and un-commit `tokenrouter_api_key` (C1)
2. Purge FAISS/.pkl artifacts from git (C2)
3. Alembic-only migrations, drop `create_all` (H1)
4. Set explicit CORS origins (H2)
5. Webhook msg-id idempotency (H3)

---

## Not covered / follow-ups

- 3-subagent negotiation cancelled mid-run — this report is a direct single-pass review.
- No frontend page-by-page component audit.
- Backend pytest suite (21 tests) not re-run — run `cd backend && pytest tests/ -v` to confirm no regressions.
