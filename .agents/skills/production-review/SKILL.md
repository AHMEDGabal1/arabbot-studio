---
name: production-review
description: >
  Full production readiness review of the entire project. Performs a deep, critical audit
  covering Security, Correctness, API Design, Code Quality, Database, Performance, Testing,
  Maintainability, DevOps, and Dependencies. Acts as a Staff Software Engineer, Security
  Engineer, and API Architect. Use when the user asks to review, audit, or check the project
  for production readiness, security issues, bugs, or code quality.
---

# Production Readiness Review Skill

## Role

Act as a **Staff Software Engineer**, **Security Engineer**, and **API Architect** simultaneously.
Perform a production readiness review as if this is the final gate before deployment.

## Core Principles

- **Do NOT assume the implementation is correct.** Verify everything critically.
- **Do NOT give generic advice.** Only report issues verified from actual code.
- **If something is correct, explicitly state why it is correct.**
- **If unsure, say "Unable to verify from the available code."**

## Execution Steps

### Step 1: Full Codebase Read

Read **every source file** in the project. Do not skip files. Use subagents for parallel reading if the codebase is large.

**Backend files to read:**
- `src/main.py` — Entry point, middleware, lifespan
- `src/config.py` — Settings, env vars, secrets
- `src/database.py` — Engine, sessions, Base
- `src/deps.py` — Auth dependencies, workspace resolution
- `src/middleware/*.py` — All middleware
- `src/models/*.py` — All ORM models
- `src/schemas/*.py` — All Pydantic schemas
- `src/routers/*.py` — All API routers
- `src/services/*.py` — All service layer files
- `src/chains/*.py` — All AI chain files
- `src/webhooks/*.py` — All webhook handlers
- `tests/conftest.py` — Test configuration
- `tests/**/*.py` — All test files
- `requirements.txt` / `pyproject.toml` — Dependencies
- `Dockerfile`, `docker-compose.yml` — Container config
- `.env.example` — Environment template
- `alembic/` — Migrations

**Frontend files to read:**
- `src/App.tsx` — Router, providers
- `src/main.tsx` — Entry point
- `src/lib/api.ts` — API client, interceptors
- `src/lib/auth.tsx` — Auth context, token management
- `src/lib/supabase.ts` — Supabase client config
- `src/types/` — TypeScript types
- `src/pages/*.tsx` — All page components
- `src/components/*.tsx` — All shared components
- `package.json` — Dependencies
- `vite.config.ts` — Build config
- `.env` / `.env.example` — Environment

### Step 2: Systematic Review

For each area below, inspect every relevant file and document findings.

#### 2.1 Code Quality
- Architecture and project structure
- Code smells, duplication, dead code, unnecessary complexity
- Naming consistency
- Separation of concerns
- Performance bottlenecks
- Unused imports, unused files, empty files

#### 2.2 Correctness
- Logical bugs (especially missing imports, wrong variable names, type mismatches)
- Race conditions (especially in shared mutable state like file I/O, caches, global dicts)
- Error handling (bare except, swallowed exceptions, missing rollbacks)
- Edge cases (empty lists, None values, zero-length strings)
- Missing null/None checks
- Async behavior (missing await, sync calls in async functions, blocking the event loop)
- Business logic matching intended behavior

#### 2.3 API Review
- Validate every endpoint (method, path, params, body, response)
- Request validation (Pydantic schemas, field validators, UUID typing on path params)
- Response consistency (same schema for same resource across endpoints)
- Status codes (201 for create, 204 for delete, 404 for not found, 409 for conflict)
- Pagination (limit/offset on list endpoints)
- Authentication and authorization on every endpoint
- Workspace isolation (every data query filtered by workspace_id)
- REST best practices (plural nouns, nested resources, proper HTTP methods)

#### 2.4 Security Review
- SQL injection (check for raw SQL with string interpolation)
- XSS risks (user input rendered in templates)
- CSRF protection
- SSRF vulnerabilities (user-controlled URLs in server-side requests)
- Path traversal (user input in file paths)
- JWT implementation (algorithm, expiry, secret management, no default secrets)
- Password storage (bcrypt/argon2, salted, not plaintext)
- Secret management (no hardcoded credentials, env vars required)
- CORS configuration (wildcard in production?)
- Rate limiting (on auth endpoints, webhook endpoints)
- Security headers (CSP, X-Content-Type-Options, HSTS)
- Sensitive data in logs (passwords, tokens, PII)
- Privilege escalation (cross-workspace access, cross-user access)
- OWASP Top 10 issues
- Dependency vulnerabilities (known CVEs)
- Pickle/marshal deserialization (RCE vectors)
- Token storage (localStorage vs httpOnly cookies)

#### 2.5 Database
- Schema design (proper types, constraints, foreign keys, indexes)
- Schema drift (models vs migrations mismatch)
- Transactions (commit/rollback behavior)
- N+1 query issues (eager loading with selectinload/joinedload)
- Query efficiency (unnecessary full-table scans)
- Soft delete consistency (all queries filter deleted_at)

#### 2.6 Performance
- Caching strategy
- Unnecessary database calls
- Memory usage (unbounded dicts, lists that grow forever)
- CPU intensive operations (blocking the event loop)
- Concurrency (race conditions, locking)
- Scalability issues (single-process state, file-based storage)

#### 2.7 Testing
- Test coverage gaps (which services/routers have no tests?)
- Test quality (do tests actually assert correctness?)
- Test isolation (in-memory DB, proper teardown)
- Edge case tests missing
- Mock quality (are LLM calls properly mocked?)

#### 2.8 Maintainability
- Modularity (can components be replaced independently?)
- Configuration management (env vars, settings validation)
- Documentation (README, docstrings, API docs)
- Logging (structured, includes request IDs, appropriate levels)
- Monitoring readiness (health checks, metrics)

#### 2.9 DevOps
- Docker configuration (multi-stage builds, .dockerignore, non-root user)
- CI/CD pipeline (exists? runs tests? lint?)
- Production configuration (workers, TLS, secret injection)
- Container health checks

#### 2.10 Dependencies
- Outdated packages
- Unused packages (installed but never imported)
- Duplicate packages
- Known security vulnerabilities
- Safer alternatives

### Step 3: Output Format

For **every issue found**, provide:

```
### [ID]: [Short Title]

**Severity**: Critical / High / Medium / Low
**File**: [file path with link and line number]

**Problem**: Explain exactly what is wrong.

**Impact**: Describe the real-world consequence.

**Recommendation**: Explain the best solution.

**Example Fix**:
```code
corrected code
```

**Best Practice**: Reference the relevant standard (OWASP, CWE, etc.)
```

For **things that are correct**, explicitly state:
```
| Area | ✅ Correct | Why |
```

### Step 4: Produce Summary

At the end of every review, produce:

1. **Executive Summary** — 2-3 paragraph overview
2. **Scores** (out of 10):
   - Security Score
   - Code Quality Score
   - API Design Score
   - Performance Score
   - Maintainability Score
   - Production Readiness Score
3. **Top 20 highest priority improvements** — ordered by impact, in a table
4. **Deployment Blockers** — Critical/High issues that MUST be fixed before production
5. **What's Correct and Why** — Table of verified-correct items

### Step 5: Save as Artifact

Save the full report as a markdown artifact named `production_readiness_audit.md`.

## Checklist of Common Bugs to Always Check

These are bugs found in previous audits of this project. Always verify they haven't regressed:

- [ ] Missing imports (especially `datetime`, `timezone`, `uuid`)
- [ ] `await` missing on async function calls
- [ ] Default values for secret keys (should be required, no defaults)
- [ ] Hardcoded credentials in frontend source
- [ ] Pickle deserialization (should use JSON)
- [ ] Dead code files that are never imported
- [ ] Double UUID conversion (`uuid.UUID(already_uuid_typed_param)`)
- [ ] Route ordering (`/resource/new` must come before `/resource/:id`)
- [ ] Webhook verify token actually compared (not just checking non-empty)
- [ ] Auth guard on frontend layout/protected routes
- [ ] Workspace isolation on ALL data-modifying endpoints
- [ ] WhatsApp reply actually sent (not just saved to DB)
- [ ] RAG context format matches between producer and consumer
- [ ] Rate limiter memory eviction (bounded dict, not unbounded)
- [ ] Monthly quota counter both incremented AND reset
- [ ] docker-compose includes all required env vars (especially SECRET_KEY)
- [ ] Test database uses in-memory SQLite, not file-based
- [ ] No duplicate entries in requirements.txt
