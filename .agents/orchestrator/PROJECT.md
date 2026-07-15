# Project: ArabBot Studio Production Readiness and Security Audit

## Architecture
ArabBot Studio is a full-stack chatbot development platform consisting of:
1. **Backend**: FastAPI web framework, SQLAlchemy (async SQLite/PostgreSQL), Alembic migrations, JWT-based security, integration with Google Gemini.
2. **Frontend**: React (Vite + Tailwind CSS), TypeScript, react-router-dom, lucide-react.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Plan & Layout | Define plan and create PROJECT.md | None | DONE |
| 2 | Backend Audit | Deep audit of `backend/` for security, performance, and code quality issues. | M1 | DONE (Conv: a7fc2541-a09b-4d5f-b0b5-4bc20c6e9c66) |
| 3 | Frontend Audit | Deep audit of `frontend/` for security, performance, and code quality issues. | M1 | DONE (Conv: b72bd344-d480-4c0b-b8d0-1a421359f66b) |
| 4 | Synthesis & Report | Consolidate findings into `audit_report.md` | M2, M3 | IN_PROGRESS (Conv: 8765f2d5-a522-4d0f-9970-bfae7f3e075f) |
| 5 | Review & Audit | Verify report correctness, exact file paths, line numbers, and formatting | M4 | PLANNED |

## Interface Contracts
- **Audit Report Output**: `audit_report.md` at root must contain:
  - High-Level Summary section at the top.
  - Security section listing vulnerabilities with exact files and line numbers.
  - Performance section listing bottlenecks with exact files and line numbers.
  - Code Quality section listing code quality issues with exact files and line numbers.
  - Actionable recommendations for every finding.
  - Both `backend/` and `frontend/` directories must be fully analyzed.
