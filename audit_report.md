# ArabBot Studio - Consolidated Audit Report

## High-Level Summary

This report presents a consolidated analysis of the security, performance, and code quality audits conducted across both the `backend/` (FastAPI) and `frontend/` (React + Vite + TypeScript) directories of ArabBot Studio.

### System Overview
ArabBot Studio's foundation is built upon modern asynchronous patterns in FastAPI with a service-oriented architecture, using SQLAlchemy 2.0 with PostgreSQL/SQLite. The frontend leverages React, Vite, and Tailwind CSS, featuring robust localization support (Cairo fonts, Right-to-Left formatting for Arabic), secure protected route guards, and top-level Error Boundaries.

### Audit Summary
Despite a well-structured foundation, the system is **not production-ready** due to several critical flaws:
1. **Multi-Workspace Isolation Bypass (Backend)**: Requests completely bypass client-specified workspaces from JWTs and force-evaluate using the user's first workspace membership.
2. **Database Transaction Auto-Commit Risk (Backend)**: Commits executed after response delivery in dependency teardown risk background exceptions and silent client data loss.
3. **Permanent Handoff Lock (Backend)**: Human-agent handoff resolutions do not reset conversation status, locking the chat bot permanently.
4. **TypeScript & ESLint Compilation Failures (Frontend)**: Standard builds (`npm run build`) and lint checks (`npm run lint`) are broken by 12+ separate issues, including missing fields, hoisting violations, and misconfigured test setups.
5. **Token/Credentials Leakage (Frontend)**: Refresh tokens are left in local storage on logout, and unused Supabase credentials are hardcoded in the public `.env` configuration.

Addressing these issues immediately is required to achieve production readiness.

---

## Security

### SEC-01: Broken Multi-Workspace Isolation
* **Scope**: Backend
* **File Path**: `backend/src/deps.py`
* **Line Number(s)**: 43-57
* **Severity**: Critical
* **Problem Description**: The workspace middleware correctly decodes the JWT and sets `request.state.workspace_id`. However, the dependency `get_current_workspace` completely ignores this state. Instead, it queries the first workspace membership of the authenticated user.
* **Impact**: Users who belong to multiple workspaces are unable to switch context. All API actions occur within their first workspace database row, violating secure context isolation and data isolation principles.
* **Recommendation**: Modify `get_current_workspace` to extract `request.state.workspace_id`. Verify that the authenticated user has a membership in that workspace, and default to the first membership only if no workspace ID is provided.

### SEC-02: Webhook Signature Spoofing (Empty Secret)
* **Scope**: Backend
* **File Path**: `backend/src/webhooks/whatsapp.py`
* **Line Number(s)**: 28-30, 158
* **Severity**: High
* **Problem Description**: Meta Webhook signature validation hashes payloads with `settings.meta_app_secret`, which defaults to an empty string `""` in the application configuration.
* **Impact**: If the application is deployed without `META_APP_SECRET` configured, signature validation will run using an empty key. Attackers can forge incoming webhook events using empty secrets, allowing manipulation of conversation histories and unauthorized LLM usage charges.
* **Recommendation**: Throw a configuration error on application startup in production if `meta_app_secret` is empty, or explicitly reject signature verification inside the webhook endpoint when the secret is blank.

### CORR-02: Unhandled JWT Decode ValueError Crash
* **Scope**: Backend
* **File Path**: `backend/src/deps.py`
* **Line Number(s)**: 33-36
* **Severity**: Medium
* **Problem Description**: The token verification block catches `JWTError`, but executes `uuid.UUID(user_id)` outside the `try/except` boundary.
* **Impact**: If a token contains a non-UUID string in the `sub` claim, `uuid.UUID()` raises a `ValueError` which goes uncaught, causing the server to respond with a `500 Internal Server Error` instead of a `401 Unauthorized` response.
* **Recommendation**: Move the UUID conversion statement inside the decoding `try` block and catch `ValueError` alongside `JWTError`.

### CORR-03: FAISS Search Negative Index Match Hallucination
* **Scope**: Backend
* **File Path**: `backend/src/services/vector_store.py`
* **Line Number(s)**: 98-101
* **Severity**: Medium
* **Problem Description**: The vector store queries match indices from FAISS. If FAISS cannot find matching records, it returns `-1`. The code validates bounds using `i < len(data["texts"])` but does not verify if `i` is non-negative.
* **Impact**: In Python, `list[-1]` yields the last element in the array. FAISS returning a `-1` index leads to returning the last knowledge document, contaminating the RAG context with irrelevant data and causing chatbot hallucinations. (CWE-125: Out-of-bounds Read).
* **Recommendation**: Add a check to ensure that the FAISS index is non-negative: `0 <= i < len(data["texts"])`.

### DEV-01: Container Runs as Root and Lacks `.dockerignore`
* **Scope**: Backend
* **File Path**: `backend/Dockerfile`
* **Line Number(s)**: Entire File
* **Severity**: Medium
* **Problem Description**: The backend container runs as the default `root` user and lacks a `.dockerignore` file.
* **Impact**: Root-run containers introduce system escape vulnerabilities. The lack of a `.dockerignore` file causes developer artifacts, local SQLite databases (`dev.db`), and virtual environments (`.venv`) to be copied into the container image, increasing image size and risking architecture mismatch crashes.
* **Recommendation**: Declare a non-root group and user inside the Dockerfile, switch context to this user using `USER`, and create a `.dockerignore` file to exclude local environment configurations.

### [ID-6]: Session Leak via `refresh_token` Left in Storage on Logout
* **Scope**: Frontend
* **File Path**: `frontend/src/lib/auth.tsx`
* **Line Number(s)**: 39
* **Severity**: Medium
* **Problem Description**: The frontend `logout()` function removes the JWT `token` from `localStorage` but leaves the `refresh_token` behind.
* **Impact**: The `refresh_token` persists in browser storage indefinitely, leaving active refresh credentials vulnerable to extraction on public or shared machines.
* **Recommendation**: Ensure that both `token` and `refresh_token` are explicitly removed from `localStorage` during the logout sequence.

### [ID-9]: Hardcoded Unused Supabase Credentials in `.env`
* **Scope**: Frontend
* **File Path**: `frontend/.env`
* **Line Number(s)**: 1-2
* **Severity**: Medium
* **Problem Description**: The `.env` file exposes active/valid Supabase URL and Anon Key credentials, but Supabase is completely unused in the project.
* **Impact**: Information leakage of cloud database environments, exposing infrastructure details.
* **Recommendation**: Purge the Supabase environment credentials from `.env`.

---

## Performance

### PERF-01: Distributed Rate Limiting Defeated by Local Fallback
* **Scope**: Backend
* **File Path**: `backend/src/services/rate_limiter.py`
* **Line Number(s)**: 39-64
* **Severity**: Medium
* **Problem Description**: If Redis rate limiting returns `False` (meaning the limit has not been exceeded), the rate limiter still executes local, in-memory fallback limit tracking using `_store`.
* **Impact**: The local memory limiter runs concurrently alongside Redis, meaning each application container instance tracks and enforces its own local memory quota block. This defeats the purpose of distributed rate limiting (allowing requests across multiple servers) and bloats local memory tables.
* **Recommendation**: Structure `_check_redis` to return a status indicating whether Redis was successfully queried. If Redis is healthy and returns a success check, skip the local fallback limiter entirely.

### DEV-02: Missing Health Check in App Container
* **Scope**: Backend
* **File Path**: `backend/docker-compose.yml`
* **Line Number(s)**: 32-52
* **Severity**: Low
* **Problem Description**: The primary `app` container configuration lacks a `healthcheck` definition, whereas `postgres` and `redis` services have them defined.
* **Impact**: Container orchestrators and reverse proxies cannot dynamically check whether the application's ASGI server has hung, crashed, or degraded, impacting automatic routing and self-healing deployments.
* **Recommendation**: Add a `healthcheck` block to `docker-compose.yml` that performs a curl check on the `/health` endpoint.

### [ID-7]: Unused Refresh Token Logic (UX Degradation)
* **Scope**: Frontend
* **File Path**: `frontend/src/lib/api.ts`
* **Line Number(s)**: 22-25
* **Severity**: Medium
* **Problem Description**: The login API retrieves and stores a `refresh_token` in `localStorage`, but the axios response interceptor doesn't use it. When an access token expires (401), the app forces a full logout.
* **Impact**: Users are forced to log in again repeatedly on session timeout, causing UX friction and generating unnecessary auth traffic.
* **Recommendation**: Implement a refresh cycle in the response interceptor before logging the user out.

---

## Code Quality

### DB-01: Database Auto-Commit in Dependency Cleanup
* **Scope**: Backend
* **File Path**: `backend/src/database.py`
* **Line Number(s)**: 18-26
* **Severity**: Critical
* **Problem Description**: The database session dependency `get_db` yields a session and runs `await session.commit()` in the generator teardown step.
* **Impact**: Cleanup blocks in FastAPI dependencies execute *after* the client receives the HTTP response. If the database commit raises an exception (e.g. `IntegrityError` from unique constraints or pool issues), the client will have already received a `200 OK` or `201 Created` status code, resulting in silent data loss. Unnecessary commits are also run on read-only requests.
* **Recommendation**: Remove the automatic commit from the session dependency cleanup. Use explicit transaction management (`await db.commit()`) inside services and router handlers where mutations occur.

### CORR-01: Handoff Resolution Doesn't Reactivate AI
* **Scope**: Backend
* **File Path**: `backend/src/services/handoff_service.py`
* **Line Number(s)**: 61-74
* **Severity**: High
* **Problem Description**: Resolving a handoff updates the `HandoffQueue` resolved timestamp, but it does not update the `status` column of the associated `Conversation`.
* **Impact**: The conversation remains locked in `"handed_off"` status forever. Subsequent messages sent by the user bypass AI processing, disabling the chatbot permanently.
* **Recommendation**: Modify `resolve_handoff` to also execute an update query resetting the `Conversation` status back to `"active"`.

### DEP-01: Missing Bcrypt and Numpy Dependencies
* **Scope**: Backend
* **File Path**: `backend/requirements.txt`, `backend/pyproject.toml`
* **Severity**: High
* **Problem Description**: The backend imports `bcrypt` (in `backend/src/routers/auth.py` line 4) and `numpy` (in `backend/src/services/vector_store.py` line 7) without declaring them in configuration files.
* **Impact**: Production builds and local setups starting from scratch will fail to start or crash with a `ModuleNotFoundError` for these libraries.
* **Recommendation**: Add `bcrypt` and `numpy` to the dependencies list in both `requirements.txt` and `pyproject.toml`.

### BUS-01: Monthly Message Quota Limits Not Enforced
* **Scope**: Backend
* **File Path**: `backend/src/webhooks/whatsapp.py`
* **Line Number(s)**: 93-100
* **Severity**: High
* **Problem Description**: The webhook increments `ws.messages_used_this_month` when a user message is processed, but it never compares this count against the workspace's `monthly_message_limit`.
* **Impact**: Workspaces can exceed their limits indefinitely. The platform continues calling the Gemini API and sending WhatsApp messages, incurring significant API billing costs for the business with no automated controls.
* **Recommendation**: Validate whether `messages_used_this_month` has exceeded `monthly_message_limit` before calling the RAG/LLM classification models. Skip processing if the limit is exceeded.

### TEST-01: LangChain/LLM Integration Calls Unmocked in Webhook Tests
* **Scope**: Backend
* **File Path**: `backend/tests/integration/test_webhooks.py`
* **Severity**: High
* **Problem Description**: Webhook integration tests trigger the POST `/webhooks/whatsapp/{bot_id}` endpoint, which schedules the `process_incoming` background task. This task calls the real LangChain LLM instances without any mocking configuration.
* **Impact**: Integration tests depend on a live network connection and a valid `GOOGLE_API_KEY`. If run in CI environments, these tests will fail (due to missing keys) or incur unexpected costs. If they fail in the background after the test finishes, they pollute test logs with stack traces.
* **Recommendation**: Implement a global autouse mock fixture in `conftest.py` that intercepts `ChatGoogleGenerativeAI.ainvoke` and `GoogleGenerativeAIEmbeddings.aembed_documents`.

### API-01: Missing Query Parameter UUID Type Validation
* **Scope**: Backend
* **File Path**: `backend/src/routers/conversations.py`
* **Line Number(s)**: 18, 25-27
* **Severity**: Medium
* **Problem Description**: The endpoint `list_conversations` declares `bot_id: str | None = Query(None)`. When this string is passed to `conversation_service.list_conversations`, it is converted to a UUID via `uuid.UUID(bot_id)`.
* **Impact**: If an invalid UUID format string is passed as the `bot_id` query parameter (e.g. `/api/v1/conversations?bot_id=123`), the application crashes with a `500 Internal Server Error` instead of failing validation gracefully with a `422 Unprocessable Entity`.
* **Recommendation**: Change the type declaration of `bot_id` from `str | None` to `uuid.UUID | None` in the FastAPI endpoint signature.

### TEST-02: Lack of Real Assertions in Prompt Unit Tests
* **Scope**: Backend
* **File Path**: `backend/tests/unit/test_chains/test_dialect_normalizer.py`, `test_intent_router.py`
* **Severity**: Low
* **Problem Description**: Unit tests for RAG prompt strings only assert that the string contains placeholders or keyword substrings rather than testing functional behavior.
* **Impact**: Changes to LLM class methods, prompts, or response formatting are not verified by automated tests, making the application vulnerable to regressions.
* **Recommendation**: Rewrite prompt unit tests to test the underlying functions using mocked LangChain LLM client responses.

### DOC-01: Under-documented API / Lack of ADRs
* **Scope**: Backend
* **File Path**: `backend/` and `docs/`
* **Severity**: Low
* **Problem Description**: Endpoints are under-documented, and the codebase lacks Architecture Decision Records (ADRs) despite structural design choices being made.
* **Impact**: Increased developer onboarding friction and lack of traceability for architectural decisions.
* **Recommendation**: Establish a formal ADR path under `docs/decisions/` and document critical endpoints using FastAPI's OpenAPI features.

### [ID-1]: Missing Fields in `Analytics` Type Definition
* **Scope**: Frontend
* **File Path**: `frontend/src/types/index.ts` and `frontend/src/pages/Analytics.tsx`
* **Line Number(s)**: `index.ts`: 88-99, `Analytics.tsx`: 89, 93
* **Severity**: Critical
* **Problem Description**: The type declaration for `Analytics` does not include `messages_over_time`. However, `Analytics.tsx` attempts to read `data.messages_over_time` and pass it to Recharts.
* **Impact**: TypeScript compiler throws type error `TS2339`, preventing the production build from completing.
* **Recommendation**: Add the missing `messages_over_time?: Array<{ date: string; count: number }>` definition to the `Analytics` interface.

### [ID-2]: Missing `vi` Import and Incorrect `global` Usage in Test Setup
* **Scope**: Frontend
* **File Path**: `frontend/src/test/setup.ts`
* **Line Number(s)**: 5-7, 16
* **Severity**: Critical
* **Problem Description**: The test environment configures a mock `IntersectionObserver` using `vi.fn()` but does not import `vi` from `vitest`. It also uses `global` which is undefined in strict browser DOM targets.
* **Impact**: Prevents compilation of test helper files.
* **Recommendation**: Import `vi` from `'vitest'` and use `globalThis` instead of `global`.

### [ID-3]: Vite Config Type Mismatch with Vitest Configuration
* **Scope**: Frontend
* **File Path**: `frontend/vite.config.ts`
* **Line Number(s)**: 14
* **Severity**: High
* **Problem Description**: The config file imports `defineConfig` from `'vite'`, but configures a `'test'` block for Vitest. Since `vite` does not natively support the `test` schema, TypeScript errors out.
* **Impact**: Throws compiler error `TS2769` and blocks production build verification.
* **Recommendation**: Import `defineConfig` from `'vitest/config'`.

### [ID-4]: Object Literal Specifies Unknown Property `updated_at` in Test Mocks
* **Scope**: Frontend
* **File Path**: `frontend/src/pages/BotsList.test.tsx` and `frontend/src/pages/KnowledgeBase.test.tsx`
* **Line Number(s)**: `BotsList.test.tsx`: 47-48, 66, `KnowledgeBase.test.tsx`: 44, 55, 78, 80
* **Severity**: High
* **Problem Description**: Mock objects define `updated_at` properties, but `Bot` and `KnowledgeItem` interfaces in `types/index.ts` only include `created_at`.
* **Impact**: Prevents compilation of test files under strict typechecking.
* **Recommendation**: Remove `updated_at` from test mocks, or add `updated_at?: string` optional property to the types definitions in `types/index.ts`.

### [ID-5]: Non-hoisted Function Declarations Accessed Before Line Initialization
* **Scope**: Frontend
* **File Path**: `frontend/src/pages/admin/AdminUsers.tsx` and `frontend/src/pages/admin/AdminWorkspaces.tsx`
* **Line Number(s)**: `AdminUsers.tsx`: 13, 16, `AdminWorkspaces.tsx`: 13, 16
* **Severity**: High
* **Problem Description**: The `useEffect` calls `loadUsers()` / `loadWorkspaces()` before they are declared as `const` variables. ESLint flags this as a reference violation.
* **Impact**: ESLint throws a blocking error, failing pipeline build.
* **Recommendation**: Convert the async functions to traditional hoisted `function` syntax, or move the `useEffect` hook below the `const` definitions.

### [ID-8]: Uncaught Promise Rejections in API Mutators
* **Scope**: Frontend
* **File Path**: `frontend/src/pages/BotsList.tsx`, `frontend/src/pages/KnowledgeBase.tsx`, and `frontend/src/pages/Handoffs.tsx`
* **Line Number(s)**: `BotsList.tsx`: 19, 25, `KnowledgeBase.tsx`: 28, 37, `Handoffs.tsx`: 18
* **Severity**: Medium
* **Problem Description**: Async actions (deleting bot, toggling status, resolving handoff) trigger API requests without `try-catch` blocks or error feedback to the user.
* **Impact**: Unhandled errors lead to silent bugs or inconsistent UI (spinner hangs, action fails without explaining why).
* **Recommendation**: Wrap all network mutator requests in `try-catch` and toast errors to the user.

### [ID-10]: Inconsistent Token Clearing on HTTP 401/403 Errors
* **Scope**: Frontend
* **File Path**: `frontend/src/lib/admin_api.ts` vs `frontend/src/lib/api.ts`
* **Line Number(s)**: `admin_api.ts`: 15-18, `api.ts`: 22-25
* **Severity**: Low
* **Problem Description**: In `admin_api.ts`, a 401/403 interceptor redirects the user to `/login` but does not remove the expired token from local storage, whereas the main `api.ts` does.
* **Impact**: Can result in auth looping or stale authorization states for admins.
* **Recommendation**: Align error response interceptors to clear local storage tokens.

### [ID-11]: Dead Code and Unused Files in Codebase
* **Scope**: Frontend
* **File Path**: `frontend/src/lib/useScrollReveal.ts`
* **Line Number(s)**: Entire File
* **Severity**: Low
* **Problem Description**: The custom hook `useScrollReveal` is defined but never imported. Multiple default assets (like `logo.svg`, `icons.svg`, `react.svg`, `vite.svg`) are unused.
* **Impact**: Clutters the codebase and increases repository size.
* **Recommendation**: Delete the unused hook and assets.

### [ID-12]: Browser `prompt()` in Admin Panel and Hardcoded Workspace Plan
* **Scope**: Frontend
* **File Path**: `frontend/src/pages/admin/AdminWorkspaces.tsx`
* **Line Number(s)**: 28, 31
* **Severity**: Low
* **Problem Description**: Native `prompt()` is used for user input when editing limits. Additionally, when limits are updated, the workspace plan is hardcoded to `'pro'`, which can overwrite custom plans.
* **Impact**: Bad user experience and potential plan corruption.
* **Recommendation**: Build a simple React modal overlay to select the plan and limit values dynamically.
