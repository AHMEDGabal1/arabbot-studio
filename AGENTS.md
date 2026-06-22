# ArabBot Studio

## Project Structure
- `backend/` — FastAPI async backend (Python 3.12)
- `frontend/` — React + Vite + Tailwind CSS dashboard (TypeScript)
- `specs/` — Feature specifications and plans
- `features/` — Feature definitions

## Backend Commands
```bash
cd backend
pip install -r requirements.txt    # Install deps
pytest tests/ -v                   # Run tests (21 tests)
alembic upgrade head               # Run migrations
uvicorn src.main:app --reload      # Start dev server
```

## Frontend Commands
```bash
cd frontend
npm install                         # Install deps
npm run dev                         # Start dev server (port 5173)
npm run build                       # Production build
```

## Key Info
- Backend runs on :8000, Frontend runs on :5173 (proxied to :8000)
- All DB operations async (SQLite in test, PostgreSQL in prod)
- JWT auth with workspace isolation
- Google Gemini API key required for AI features
- Tests use SQLite in-memory — no DB setup needed
<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
- Implementation Plan: specs/001-arabbot-mvp/plan.md
- Research: specs/001-arabbot-mvp/research.md
- Data Model: specs/001-arabbot-mvp/data-model.md
- Quickstart: specs/001-arabbot-mvp/quickstart.md
- Contracts: specs/001-arabbot-mvp/contracts/
<!-- SPECKIT END -->
