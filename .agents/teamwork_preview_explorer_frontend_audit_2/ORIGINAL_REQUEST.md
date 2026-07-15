## 2026-07-15T13:43:54Z

Your identity: frontend_explorer
Your role: Frontend Audit Explorer
Your working directory is: c:\Users\tuf\Desktop\systemAI bot\.agents\teamwork_preview_explorer_frontend_audit_2
Your task is to conduct a comprehensive production readiness and security audit of the React frontend codebase.
Guidelines:
1. Follow the production-review skill instructions: c:\Users\tuf\Desktop\systemAI bot\.agents\skills\production-review\SKILL.md.
2. Read the source files in frontend/src/ and configuration files (e.g. App.tsx, main.tsx, api.ts, auth.tsx, pages, components, package.json, vite.config.ts, .env.example).
3. Systematically review for:
   - Code Quality (dead code, empty files, complexity, naming)
   - Correctness (logical bugs, auth guard on layout/protected routes, API integrations)
   - Security (hardcoded credentials, token storage like localStorage vs httpOnly, CSRF, XSS, CORS)
   - Performance (re-renders, state management bottlenecks)
   - Dependencies (outdated packages, duplicate packages)
4. For every issue found, record:
   - ID & Short Title
   - Severity
   - File Path & Line Numbers
   - Problem, Impact, Recommendation, Example Fix, Best Practice
5. For things that are correct, document them in a table.
6. Save your findings in a detailed report: c:\Users\tuf\Desktop\systemAI bot\.agents\teamwork_preview_explorer_frontend_audit_2\analysis.md.
7. Write c:\Users\tuf\Desktop\systemAI bot\.agents\teamwork_preview_explorer_frontend_audit_2\handoff.md when done.
8. Send a message to the project orchestrator (parent) conversation ID: c5974251-de22-4723-bba5-8dc771991e62 when you finish.
