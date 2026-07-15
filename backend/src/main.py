import json
import logging
import uuid
from contextlib import asynccontextmanager
from contextvars import ContextVar
from logging.handlers import RotatingFileHandler
from pathlib import Path

import sentry_sdk
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sqlalchemy import text

from src.config import settings
from src.database import get_db
from src.middleware.workspace import workspace_middleware
from src.routers import analytics, auth, bots, conversations, handoffs, knowledge, admin
from src.services.rate_limiter import _redis as redis_client
from src.services.storage import ensure_buckets
from src.webhooks import whatsapp

request_id_var: ContextVar[str] = ContextVar("request_id")


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log = {
            "ts": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "request_id": request_id_var.get(""),
        }
        if hasattr(record, "extra"):
            log.update(record.extra)
        return json.dumps(log)


handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())

logs_dir = Path("logs")
logs_dir.mkdir(exist_ok=True)
file_handler = RotatingFileHandler(logs_dir / "arabbot.jsonl", maxBytes=10 * 1024 * 1024, backupCount=5)
file_handler.setFormatter(JSONFormatter())

logging.basicConfig(level=logging.INFO, handlers=[handler, file_handler], force=True)


if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        integrations=[FastApiIntegration()],
    )

origins = [settings.base_url] if settings.environment == "production" else ["*"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_buckets()
    yield


app = FastAPI(title="ArabBot Studio", version="0.1.0", lifespan=lifespan)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        413: "PAYLOAD_TOO_LARGE",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMITED",
    }
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": code_map.get(exc.status_code, "SERVER_ERROR"), "message": exc.detail}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": "Invalid request data", "details": {"errors": exc.errors()}}},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response


app.middleware("http")(workspace_middleware)


app.include_router(auth.router, prefix="/api/v1")
app.include_router(bots.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")
app.include_router(knowledge.router, prefix="/api/v1")
app.include_router(handoffs.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(whatsapp.router)


@app.get("/health")
async def health():
    db_ok = False
    try:
        async for db in get_db():
            await db.execute(text("SELECT 1"))
            db_ok = True
            break
    except Exception:
        db_ok = False
    redis_ok = False
    if redis_client is not None:
        try:
            await redis_client.ping()
            redis_ok = True
        except Exception:
            redis_ok = False
    status = "ok" if (db_ok and (redis_client is None or redis_ok)) else "degraded"
    return {
        "status": status,
        "database": "up" if db_ok else "down",
        "redis": "up" if redis_ok else ("disabled" if redis_client is None else "down"),
    }
