# Security Report — ArabBot Studio

Scope: `backend/src` and `frontend/src`. Date: 2026-07-08.

## 1. Security Vulnerabilities

### 1.1 Mass assignment on Bot create/update (Medium)
`BotCreate`/`BotUpdate` accept `wa_access_token`, `wa_verify_token`, `wa_phone_number_id`, `system_prompt`, `human_handoff_enabled` (`schemas/bot.py:7-41`). The router passes the raw body to `bot_service.create_bot`/`update_bot` (`routers/bots.py:32,54`), which splat it into the model via `Bot(workspace_id=..., **data)` (`bot_service.py:11`) and `update(Bot).values(**data)` (`bot_service.py:48`).

Consequences:
- Any authenticated workspace member can set/overwrite the bot's WhatsApp credentials (`wa_access_token`) — there is no owner-vs-member role check on update/delete.
- `system_prompt` is settable but the orchestrator never reads it (`chains/orchestrator.py` uses hardcoded prompts), so it is dead config (see 2.2).

### 1.2 Workspace isolation ignores JWT `workspace_id` (Medium)
`get_current_workspace` returns the **first** `WorkspaceMember` for the user with `limit(1)` and no ordering (`deps.py:47-56`). The `workspace_id` claim in the JWT is set by `workspace_middleware` into `request.state.workspace_id` (`middleware/workspace.py:14-26`) but is never used for authorization. A user in multiple workspaces always acts on their first workspace regardless of the token. Not a cross-tenant data leak (membership-based), but the JWT claim is decorative and the behavior is unpredictable for multi-tenant users.

### 1.3 Webhook signature uses a single global secret & empty-secret fallback (Medium)
`verify_signature` is called with `settings.meta_app_secret` for the POST webhook (`webhooks/whatsapp.py:158`), a single global secret, while each bot has its own `wa_verify_token` used only for the GET challenge (`webhooks/whatsapp.py:66`). Inconsistencies:
- The per-bot secret is not used to authenticate inbound messages.
- If `meta_app_secret` is empty (it has a default `""` in `config.py:19`), the HMAC is computed with an empty key; an attacker who learns the key is empty can forge webhook payloads. The POST handler also only rate-limits at 30/60s per IP (`webhooks/whatsapp.py:148`), so forgery attempts are not throttled per signature.

### 1.4 Weak/default JWT secret in repo working tree (Low–Medium)
`backend/.env` contains `SECRET_KEY=dev-secret-key-change-in-production-32chars` (`backend/.env:12`). The file is git-ignored (not committed), but if deployed as-is, the HS256 secret is guessable and allows JWT forgery (arbitrary `sub`/`workspace_id`). `config.py:27` requires `secret_key` with no default, which is good, but there is no startup validation that it is high-entropy.

### 1.5 CORS allows wildcard with credentials in non-production (Low)
`main.py:60` sets `origins = ["*"]` when `environment != "production"`, combined with `allow_credentials=True` (`main.py:100`). Browsers reject credentialed `*` responses, so it is not directly exploitable today, but it is fragile: setting `environment=production` with a wrong `base_url` or changing credential handling opens CSRF / credential-theft. Origins should be an explicit allowlist.

### 1.6 LLM prompt injection (Low–Medium)
User-supplied WhatsApp text is interpolated into LLM prompts via `.format()` in `intent_router.py:41`, `dialect_normalizer.py:12`, and `rag_chain.py:15`. A crafted message can manipulate intent classification (e.g., force `HUMAN_REQUEST`) or attempt to extract the RAG context. Outputs are sent back to users and stored. There is no output sanitization or guardrail between LLM output and downstream actions/storage.

### 1.7 Refresh token has no revocation / no rate limit (Low)
`/auth/refresh` (`routers/auth.py:86-104`) decodes the JWT and re-issues an access token without checking revocation/expiry beyond the JWT itself, and has no rate limiting (unlike login/register, which use `rate_limit(5,60)`). Refresh tokens are valid 7 days and cannot be invalidated.

### 1.8 Silently swallowed webhook errors (Low)
`process_incoming` wraps everything in a bare `except Exception` that only logs (`webhooks/whatsapp.py:137-139`), so a failed AI call or storage error still returns `{"status":"ok"}` to Meta. This can mask abuse/failures and prevent Meta retry/alerting logic from triggering correctly.

## 2. Code Quality Issues

- **Unused security claim / dead middleware state.** `request.state.workspace_id` is set but never read for authz (`middleware/workspace.py:22`).
- **Path construction from `bot_id` string.** `vector_store._index_path`/`_store_path` build `data/faiss_indices/{bot_id}.faiss` directly (`vector_store.py:45-50`). All current callers pass UUIDs (FastAPI-validated), so traversal is not reachable today, but there is no validation if a future caller passes unsanitized input.
- **In-memory rate limiter is per-process.** `_store` (`rate_limiter.py:10`) is per-worker; in a multi-worker deployment rate limits do not aggregate. It is also fully bypassed when `environment == "test"` (`rate_limiter.py:41`).
- **Hardcoded product strings in code.** Arabic UI/response strings live in `intent_handlers.py` and `orchestrator.py` instead of config/i18n; `system_prompt`/`fallback_message` on the Bot model are partly unused.
- **Fragile session usage in health check.** `main.py:135-138` manually drives the `get_db()` generator for a raw `SELECT 1`; works but is brittle if the generator contract changes.
- **FAISS index is global mutable state** keyed only by `bot_id` with a single global `_locks` dict (`vector_store.py:18-30`) — acceptable, but unbounded cross-process file writes with no size cap.

## 3. Test Coverage Gaps

### Backend (`backend/tests`)
Covered: auth, bots, admin, handoffs, knowledge, webhooks (integration); dialect_normalizer, intent_router (unit).

Missing:
- **Multi-tenant isolation tests**: no test asserts that a user in workspace A cannot read/modify workspace B's bots/conversations/handoffs (would have caught 1.2).
- **Mass-assignment tests**: no test verifying that `wa_access_token`/`system_prompt` cannot be set by a non-owner, or that role checks exist (1.1).
- **Webhook signature tests**: `verify_signature` has no unit test, including the empty-`meta_app_secret` case (1.3).
- **JWT hardening tests**: no test that `alg:none` / RS256 / tampered payloads are rejected (decode pins HS256 at `deps.py:29`, but untested).
- **Rate-limiter tests**: no test for Redis fallback or multi-worker behavior (2).
- **Service-layer unit tests**: `conversation_service`, `handoff_service`, `knowledge_service.search_knowledge`, `ai_service`, `vector_store` (incl. path handling) are only exercised indirectly or not at all.
- **Analytics router** (`routers/analytics.py`) has no tests.

### Frontend (`frontend/src`)
Covered: `App.test.tsx`, `BotsList.test.tsx`, `KnowledgeBase.test.tsx`, `Login.test.tsx`.

Missing:
- No tests for `lib/auth.tsx` context, `lib/api.ts` interceptors (token injection, 401 redirect), or `lib/admin_api.ts`.
- No tests for admin pages (`AdminDashboard/Users/Workspaces`), `Conversations`, `Handoffs`, `Analytics`, `BotEditor`, `Settings`.
- No security tests (token storage in `localStorage`, absence of `dangerouslySetInnerHTML` — confirmed none today, but unguarded by tests).
- `bot_service`/`wa_sender_service` error paths (retry logic in `wa_sender_service.py:34-50`) untested.

## Priority Fix List
1. Scope bot mutation to workspace owners + drop writable `wa_*`/`system_prompt` from member-facing schemas (1.1).
2. Enforce `workspace_id` from the JWT in `get_current_workspace` (1.2).
3. Verify webhooks with per-bot secrets and fail closed on empty `meta_app_secret` (1.3).
4. Require a high-entropy `SECRET_KEY` and never ship the dev default (1.4).
5. Replace wildcard CORS with an explicit origin allowlist (1.5).
6. Add the missing tests listed in section 3.
