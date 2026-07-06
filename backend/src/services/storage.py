import asyncio
import logging

from src.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

BUCKETS = {
    "bot-assets": {"public": True, "allowed_mime_types": ["image/png", "image/jpeg", "image/svg+xml"]},
    "knowledge-files": {"public": False, "allowed_mime_types": ["application/pdf", "text/plain", "text/csv"]},
}

async def _ensure_bucket(name: str, config: dict):
    supabase = get_supabase_admin()
    if not supabase:
        return
    try:
        await asyncio.to_thread(supabase.storage.get_bucket, name)
    except Exception:
        try:
            await asyncio.to_thread(supabase.storage.create_bucket, id=name, name=name, options=config)
        except Exception as e:
            logger.warning("Failed to create bucket %s: %s", name, e)

async def ensure_buckets():
    for name, config in BUCKETS.items():
        await _ensure_bucket(name, config)
