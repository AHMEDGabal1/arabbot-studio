## 2026-07-15T13:53:42Z
Your identity: backend_explorer
Your role: Backend Audit Explorer
Your working directory is: c:\Users\tuf\Desktop\systemAI bot\.agents\teamwork_preview_explorer_backend_audit_3
Your task is to conduct a comprehensive production readiness and security audit of the ArabBot Studio backend codebase.
Guidelines:
1. Follow the production-review skill instructions: c:\Users\tuf\Desktop\systemAI bot\.agents\skills\production-review\SKILL.md.
2. Read the source files in backend/src/ and backend/tests/ (e.g. main.py, config.py, database.py, deps.py, middleware, models, routers, schemas, services, webhooks, conftest.py, pyproject.toml, requirements.txt, Dockerfile, docker-compose.yml).
3. Systematically review for:
   - Code Quality
   - Correctness (logical bugs, await missing, double conversions, type mismatches, exception swallowing)
   - API Design (endpoint validation, status codes, workspace isolation, REST practices)
   - Security (SQL injection, XSS, CSRF, JWT alg/expiry, CORS, token storage, WhatsApp replies, secret keys default values)
   - Database (schema design, transactions, N+1 query issues)
   - Performance (caching, database calls, CPU blocks)
   - Testing (coverage, mock quality, in-memory SQLite for test database)
   - Maintainability, DevOps, Dependencies.
4. For every issue found, record:
   - ID & Short Title
   - Severity
   - File Path & Line Numbers
   - Problem, Impact, Recommendation, Example Fix, Best Practice
5. For things that are correct, document them in a table.
6. Save your findings in a detailed report: c:\Users\tuf\Desktop\systemAI bot\.agents\teamwork_preview_explorer_backend_audit_3\analysis.md.
7. Write c:\Users\tuf\Desktop\systemAI bot\.agents\teamwork_preview_explorer_backend_audit_3\handoff.md when done.
8. Send a message to the project orchestrator (parent) conversation ID: c5974251-de22-4723-bba5-8dc771991e62 when you finish.
