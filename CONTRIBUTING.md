# Contributing to ArabBot Studio 🚀

Thank you for your interest in contributing to **ArabBot Studio**, the premier open-source Arabic-First AI Agent & Chatbot Studio!

Whether you are fixing a bug, adding new Arabic dialect support, enhancing guardrails, or building new UI components, your contributions are warmly welcomed.

---

## 📋 Table of Contents
1. [Code of Conduct](#-code-of-conduct)
2. [Getting Started](#-getting-started)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
3. [Development Workflow](#-development-workflow)
   - [Branch Naming](#branch-naming)
   - [Running Tests](#running-tests)
   - [Code Quality & Styling](#code-quality--styling)
4. [Submitting a Pull Request](#-submitting-a-pull-request)
5. [Architecture & Design Records (ADRs)](#-architecture--design-records-adrs)

---

## 📜 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to `security@arabbot.studio`.

---

## 🛠️ Getting Started

### Prerequisites
- **Python**: 3.12+
- **Node.js**: 18.x or 20.x (with `npm`)
- **Docker & Docker Compose** (Optional, for running PostgreSQL + Redis locally)
- **Google Gemini API Key** (Required for AI agent capabilities)

---

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your GOOGLE_API_KEY and JWT secrets

# Run database migrations
alembic upgrade head

# Start local backend server
uvicorn src.main:app --reload --port 8000
```

---

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
# App will run at http://localhost:5173 (proxied to :8000)
```

---

## 🧪 Development Workflow

### Branch Naming
Use descriptive branch names with conventional prefixes:
- `feat/feature-name` — for new features
- `fix/bug-description` — for bug fixes
- `docs/update-readme` — for documentation updates
- `refactor/component-name` — for code refactoring

### Running Tests

#### Backend Tests (Pytest)
Always make sure all backend tests pass before opening a PR:
```bash
cd backend
python -m pytest tests/ -v
```

#### Frontend Type Checking & Build
Ensure TypeScript checks and production builds pass cleanly:
```bash
cd frontend
npm run build
```

---

## 📐 Architecture & Design Records (ADRs)

If you are proposing a major architectural change or dependency addition, please read our existing ADRs in `docs/decisions/` and add a new ADR explaining the decision rationale.

---

## 📩 Submitting a Pull Request

1. **Fork the repo** and create your branch from `main`.
2. Ensure test suite (`pytest`) and frontend build (`npm run build`) pass.
3. Write clean commit messages adhering to [Conventional Commits](https://www.conventionalcommits.org/).
4. Submit a Pull Request targeting `main`.
5. Tag maintainers for review!

Thank you for helping build the future of Arabic Conversational AI! 🌟
