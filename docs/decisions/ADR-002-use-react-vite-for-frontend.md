# ADR-002: Use React and Vite for Frontend

## Status
Accepted

## Date
2026-07-06

## Context
ArabBot Studio requires a responsive, high-performance web dashboard for users to manage their WhatsApp bots, view analytics, and configure the RAG knowledge base. The application is highly interactive but does not require public SEO indexing for the dashboard routes, as it sits entirely behind authentication.

## Decision
Use React 19 with Vite 8 and Tailwind CSS 4 for the frontend architecture.

## Alternatives Considered

### Next.js
- Pros: Excellent SEO, server-side rendering (SSR), unified full-stack capability.
- Cons: Overhead of running a Node.js server for the frontend, complexity of App Router for a purely authenticated SPA.
- Rejected: The dashboard requires zero SEO. The backend logic is firmly rooted in Python (FastAPI). Adding a Next.js server introduces unnecessary deployment complexity for an application that can be served entirely as static files.

### Vue.js / Svelte
- Pros: Lighter weight, simpler reactivity models.
- Cons: Smaller ecosystem for complex charting libraries (Recharts) and data-table components compared to React.
- Rejected: React's massive ecosystem of headless UI components and charting libraries accelerates dashboard development significantly.

### Create React App (CRA) / Webpack
- Pros: Familiar, historically standard.
- Cons: Deprecated, incredibly slow build times, bulky configuration.
- Rejected: Vite offers near-instant HMR (Hot Module Replacement) and vastly superior build performance.

## Consequences
- **Deployment**: The frontend can be built into static HTML/JS/CSS files and hosted cheaply on any CDN or static hosting provider (S3, Vercel, Netlify) without requiring a Node.js runtime.
- **Styling**: Tailwind CSS enables rapid UI development adhering to our "Amber Studio" design system without managing scattered CSS modules.
- **Routing**: Client-side routing (React Router) manages navigation, leading to fast, app-like page transitions.
