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
from src.database import get_db
from src.models import Bot, Conversation, Message
from src.services import conversation_service, handoff_service
from src.services.knowledge_service import search_knowledge

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
async def verify_webhook(bot_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    result = await db.execute(select(Bot).where(Bot.id == uuid.UUID(bot_id), Bot.deleted_at.is_(None)))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bot not found")

    if mode == "subscribe" and token:
        return int(challenge)
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification failed")


async def process_incoming(bot: Bot, msg: dict, db: AsyncSession):
    start = time.monotonic()
    channel_user_id = msg["from"]
    text = msg.get("text", "")

    conversation = await conversation_service.get_or_create_conversation(
        db, str(bot.id), "whatsapp", channel_user_id,
    )

    user_msg = await conversation_service.add_message(
        db, str(conversation.id), "user", text, raw_content=text,
    )

    knowledge_items = await search_knowledge(str(bot.id), text)

    result = await process_message(text, knowledge_items if knowledge_items else None)

    processing_ms = int((time.monotonic() - start) * 1000)

    user_msg.intent_detected = result["intent"]
    user_msg.confidence = result["confidence"]
    user_msg.processing_ms = processing_ms

    await conversation_service.add_message(
        db, str(conversation.id), "assistant", result["response"],
    )

    if result["requires_human"] and bot.human_handoff_enabled:
        await handoff_service.create_handoff(
            db, str(conversation.id), reason=f"Intent: {result['intent']}",
        )
        conversation.status = "handed_off"

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


@router.post("/{bot_id}")
async def receive_webhook(
    bot_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")

    result = await db.execute(select(Bot).where(Bot.id == uuid.UUID(bot_id), Bot.deleted_at.is_(None)))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bot not found")

    if not verify_signature(body, signature, bot.wa_access_token or ""):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    payload = json.loads(body)
    messages = extract_messages(payload)

    for msg in messages:
        background_tasks.add_task(process_incoming, bot, msg, db)

    return {"status": "ok"}
