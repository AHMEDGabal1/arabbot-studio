import asyncio
import logging

import httpx

from src.config import settings

logger = logging.getLogger(__name__)

RETRY_DELAYS = [1, 2, 4]
RETRY_ERROR_CODES = {130429, 131026}


async def send_wa_message(
    to: str,
    text: str,
    phone_number_id: str,
    access_token: str,
    retry_count: int = 0,
) -> dict:
    url = f"https://graph.facebook.com/v20.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text},
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code == 429 or (
            resp.status_code >= 400 and resp.json().get("error", {}).get("code") in RETRY_ERROR_CODES
        ):
            if retry_count < len(RETRY_DELAYS):
                delay = RETRY_DELAYS[retry_count]
                logger.warning("Retrying WhatsApp API call in %ss (attempt %d)", delay, retry_count + 1)
                await asyncio.sleep(delay)
                return await send_wa_message(to, text, phone_number_id, access_token, retry_count + 1)
        resp.raise_for_status()
        return resp.json()
