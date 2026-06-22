import uuid
from contextvars import ContextVar

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from src.database import get_db
from src.middleware.workspace import workspace_middleware
from src.routers import analytics, auth, bots, conversations, handoffs, knowledge
from src.webhooks import whatsapp

request_id_var: ContextVar[str] = ContextVar("request_id")

app = FastAPI(title="ArabBot Studio", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    request_id_var.set(request_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


app.middleware("http")(workspace_middleware)


app.include_router(auth.router, prefix="/api/v1")
app.include_router(bots.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")
app.include_router(knowledge.router, prefix="/api/v1")
app.include_router(handoffs.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(whatsapp.router)


@app.get("/health")
async def health():
    db_ok = False
    redis_ok = False
    try:
        async for db in get_db():
            await db.execute(text("SELECT 1"))
            db_ok = True
            break
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "up" if db_ok else "down",
        "redis": "up" if redis_ok else "unknown",
    }
