# ---- Builder stage ----
# Install heavy build deps (gcc, libpq-dev) only in this stage so they
# don't bloat the final runtime image.
FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---- Runtime stage ----
FROM python:3.12-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# IMPORTANT: Run as non-root for container security.
RUN addgroup --system app && adduser --system --group app

WORKDIR /app

# Copy site-packages from builder (avoids re-installing in runtime image)
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code (owned by non-root user)
COPY --chown=app:app . .

# Remove test/dev artifacts from production image
RUN rm -rf tests/ .pytest_cache/ .venv/ data/ *.db

USER app

EXPOSE 8000

# Use Gunicorn + Uvicorn workers for multi-process production serving.
# Render sets PORT env var automatically; we default to 8000.
CMD ["sh", "-c", "alembic upgrade head && gunicorn src.main:app \
     --worker-class uvicorn.workers.UvicornWorker \
     --workers 2 \
     --bind 0.0.0.0:${PORT:-8000} \
     --timeout 120 \
     --access-logfile - \
     --error-logfile -"]
