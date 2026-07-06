import hashlib
import hmac
import json
import logging
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.chains.orchestrator import process_message
from src.config import settings
from src.database import async_session_factory, get_db
from src.models import Bot, Workspace
from src.services import conversation_service, handoff_service
from src.services.knowledge_service import search_knowledge
from src.services.rate_limiter import rate_limit
from src.services.wa_sender_service import send_wa_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/whatsapp", tags=["webhooks"])


def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


def extract_messages(body: dict) -> list[dict]:
    messages = []
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for msg in value.get("messages", []):
                msg_type = msg.get("type", "text")
                text = ""
                if msg_type == "text":
                    text = msg.get("text", {}).get("body", "")
                elif msg_type == "interactive":
                    text = msg.get("interactive", {}).get("button_reply", {}).get("title", "")
                messages.append({
                    "from": msg.get("from"),
                    "id": msg.get("id"),
                    "timestamp": msg.get("timestamp"),
                    "type": msg_type,
                    "text": text,
                })
    return messages


@router.get("/{bot_id}")
async def verify_webhook(bot_id: uuid.UUID, request: Request, db: AsyncSession = Depends(get_db)):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    result = await db.execute(select(Bot).where(Bot.id == bot_id, Bot.deleted_at.is_(None)))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bot not found")

    if mode == "subscribe" and token and token == bot.wa_verify_token:
        return int(challenge)
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification failed")


async def process_incoming(bot: Bot, msg: dict):
    async with async_session_factory() as db:
        try:
            start = time.monotonic()
            channel_user_id = msg["from"]
            text = msg.get("text", "")

            conversation = await conversation_service.get_or_create_conversation(
                db, str(bot.id), "whatsapp", channel_user_id,
            )

            user_msg = await conversation_service.add_message(
                db, str(conversation.id), "user", text, raw_content=text,
            )

            ws = await db.get(Workspace, bot.workspace_id)
            if ws:
                now = datetime.now(timezone.utc)
                month_key = now.year * 12 + now.month
                if ws.last_message_month is None or month_key != ws.last_message_month:
                    ws.messages_used_this_month = 0
                    ws.last_message_month = month_key
                ws.messages_used_this_month = (ws.messages_used_this_month or 0) + 1

            knowledge_items = await search_knowledge(str(bot.id), text)

            result = await process_message(text, knowledge_items if knowledge_items else None)

            processing_ms = int((time.monotonic() - start) * 1000)

            user_msg.intent_detected = result["intent"]
            user_msg.confidence = result["confidence"]
            user_msg.processing_ms = processing_ms

            await conversation_service.add_message(
                db, str(conversation.id), "assistant", result["response"],
            )

            if bot.wa_phone_number_id and bot.wa_access_token:
                await send_wa_message(channel_user_id, result["response"], bot.wa_phone_number_id, bot.wa_access_token)

            if result["requires_human"] and bot.human_handoff_enabled:
                await handoff_service.create_handoff(
                    db, str(conversation.id), reason=f"Intent: {result['intent']}",
                )
                conversation.status = "handed_off"

            await db.commit()

            logger.info(
                "msg_processed",
                extra={
                    "bot_id": str(bot.id),
                    "conversation_id": str(conversation.id),
                    "intent": result["intent"],
                    "confidence": result["confidence"],
                    "processing_ms": processing_ms,
                },
            )
        except Exception:
            await db.rollback()
            logger.exception("msg_processing_failed", extra={"bot_id": str(bot.id)})


@router.post("/{bot_id}")
async def receive_webhook(
    bot_id: uuid.UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _=Depends(rate_limit(30, 60, "webhook:")),
):
    content_length = request.headers.get("content-length", "0")
    if content_length.isdigit() and int(content_length) > 100_000:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Payload too large")
    body = await request.body()
    if len(body) > 100_000:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Payload too large")
    signature = request.headers.get("X-Hub-Signature-256", "")

    if not verify_signature(body, signature, settings.meta_app_secret):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    result = await db.execute(select(Bot).where(Bot.id == bot_id, Bot.deleted_at.is_(None)))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bot not found")

    payload = json.loads(body)
    messages = extract_messages(payload)

    for msg in messages:
        background_tasks.add_task(process_incoming, bot, msg)

    return {"status": "ok"}
