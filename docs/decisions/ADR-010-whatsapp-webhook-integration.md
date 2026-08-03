# ADR-010: WhatsApp Webhook Integration Architecture

## Status
Accepted

## Date
2026-08-03

## Context
WhatsApp Business API (Meta Cloud API) is the primary communication channel for ArabBot Studio customers in the MENA region. The integration must handle:
- Webhook verification (Meta's subscription handshake)
- HMAC SHA-256 signature validation (prevents spoofed messages)
- Message deduplication (Meta may retry deliveries)
- 200ms acknowledgment requirement (or Meta marks endpoint as failing)
- Background processing (AI generation takes 500-1500ms, exceeds 200ms SLA)
- Payload size limits (reject oversized payloads to prevent DoS)
- Rate limiting (prevent abuse from compromised webhooks)

## Decision Drivers
- Must respond to Meta within 200ms (or webhook marked as failing after 3 consecutive timeouts)
- Must validate HMAC signature to prevent message spoofing
- Must deduplicate messages to prevent duplicate responses
- Must enforce workspace isolation (bot_id in URL prevents cross-tenant message injection)
- Must handle graceful degradation (single-process deduplication acceptable for MVP, Redis for scale)

## Decision
Implement a **fast-ack webhook handler** with signature validation, in-memory deduplication, and background task processing.

### Architecture Components

#### 1. Webhook Endpoint Structure
```
GET  /webhooks/whatsapp/{bot_id}  - Verification endpoint (Meta subscription handshake)
POST /webhooks/whatsapp/{bot_id}  - Message delivery endpoint
```

**Why bot_id in URL?**
- Enables per-bot webhook URLs (one Meta app can register multiple endpoints)
- Enforces workspace isolation (bot_id FK to workspace_id)
- Simplifies routing (no header parsing required)

#### 2. Verification Flow (GET)
```python
@router.get("/{bot_id}")
async def verify_webhook(bot_id: UUID, request: Request, db: AsyncSession):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    
    bot = await db.get(Bot, bot_id)
    if not bot or bot.deleted_at:
        raise HTTPException(403, "Bot not found")
    
    if mode == "subscribe" and token == bot.wa_verify_token:
        return PlainTextResponse(challenge)  # Return challenge to Meta
    raise HTTPException(403, "Verification failed")
```

#### 3. Message Processing Flow (POST)
```python
@router.post("/{bot_id}")
async def receive_webhook(
    bot_id: UUID,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession,
    _=Depends(rate_limit(30, 60, "webhook:"))  # 30 req/min per IP
):
    # Step 1: Payload size validation (before reading body)
    content_length = int(request.headers.get("content-length", "0"))
    if content_length > 100_000:
        raise HTTPException(413, "Payload too large")
    
    body = await request.body()
    if len(body) > 100_000:  # Double-check actual size
        raise HTTPException(413, "Payload too large")
    
    # Step 2: HMAC signature validation
    signature = request.headers.get("X-Hub-Signature-256", "")
    expected = hmac.new(META_APP_SECRET.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(f"sha256={expected}", signature):
        raise HTTPException(401, "Invalid signature")
    
    # Step 3: Bot validation (workspace isolation)
    bot = await db.get(Bot, bot_id)
    if not bot or bot.deleted_at:
        raise HTTPException(403, "Bot not found")
    
    # Step 4: Extract messages and deduplicate
    payload = json.loads(body)
    messages = extract_messages(payload)  # Parse Meta's nested JSON structure
    
    for msg in messages:
        msg_id = msg.get("id")
        if msg_id and _is_duplicate(msg_id):
            continue  # Skip already-processed messages
        background_tasks.add_task(process_incoming, bot, msg)
    
    return {"status": "ok"}  # <200ms ACK to Meta
```

**Critical Timing**: All validation (signature, bot lookup, dedup check) completes in <50ms. AI processing happens in background task.

#### 4. Message Deduplication
Meta may retry webhook deliveries if endpoint is slow or times out. Without dedup, customer receives duplicate responses.

**MVP Approach** (single-process):
```python
_msg_dedup: OrderedDict[str, float] = OrderedDict()  # msg_id -> timestamp
_DEDUP_TTL = 86400  # 24 hours
_DEDUP_MAX = 10000  # Capacity limit

def _is_duplicate(msg_id: str) -> bool:
    now = time.time()
    # Evict expired entries
    while _msg_dedup and (now - _msg_dedup[next(iter(_msg_dedup))]) > _DEDUP_TTL:
        _msg_dedup.popitem(last=False)
    
    if msg_id in _msg_dedup:
        return True
    
    if len(_msg_dedup) >= _DEDUP_MAX:
        _msg_dedup.popitem(last=False)  # LRU eviction
    
    _msg_dedup[msg_id] = now
    return False
```

**Limitation**: Only works for single-process deployments. Multi-process (Gunicorn with N workers) can have duplicate processing across workers.

**Production Approach** (Redis):
```python
async def _is_duplicate_redis(msg_id: str) -> bool:
    key = f"msg:{msg_id}"
    exists = await redis.set(key, "1", nx=True, ex=86400)  # SET NX with TTL
    return not exists  # Returns False if already existed
```

#### 5. Background Processing
```python
async def process_incoming(bot: Bot, msg: dict):
    async with async_session_factory() as db:  # New session per task
        try:
            # CDP sync
            profile = await get_or_create_profile(db, workspace_id, "whatsapp", phone)
            await increment_message_count(db, profile.id)
            
            # Create user message
            conversation = await get_or_create_conversation(db, bot_id, "whatsapp", phone)
            user_msg = await add_message(db, conversation.id, "user", text)
            
            # Skip AI if handed off to human
            if conversation.status == "handed_off":
                await db.commit()
                return
            
            # AI processing (500-1500ms)
            customer_ctx = await get_profile_context(db, workspace_id, "whatsapp", phone)
            knowledge = await search_knowledge(bot_id, text)
            result = await process_message(text, knowledge, bot_id, db, customer_ctx)
            
            # Store assistant message
            await add_message(db, conversation.id, "assistant", result["response"])
            
            # Handle human handoff
            if result["requires_human"] and bot.human_handoff_enabled:
                await create_handoff(db, conversation.id)
                conversation.status = "handed_off"
            
            # CRITICAL: Commit DB before external API call
            await db.commit()
            
            # Send WhatsApp reply (external API, may fail)
            if bot.wa_phone_number_id and bot.wa_access_token:
                await send_wa_message(phone, result["response"], bot.wa_phone_number_id, bot.wa_access_token)
        
        except Exception:
            await db.rollback()
            logger.exception("msg_processing_failed", extra={"bot_id": bot.id})
```

**Why commit before send?**
If WhatsApp API call fails (network error, rate limit), conversation history is preserved. Retry logic can resend without reprocessing AI response.

## Alternatives Considered

### Synchronous Processing (No Background Tasks)
- **Approach**: Block request until AI processing completes, return response in HTTP body
- **Pros**: Simpler code, no background worker complexity
- **Cons**: Violates Meta's 200ms SLA (AI takes 500-1500ms), webhook marked as failing
- **Rejected**: Cannot meet Meta's timeout requirement

### Message Queue (RabbitMQ, SQS)
- **Approach**: Webhook pushes to queue, separate worker processes messages
- **Pros**: Durability (survives app restart), rate limiting, retry logic
- **Cons**: Operational complexity (queue infra, monitoring), overkill for <1000 RPS
- **Rejected**: Over-engineering for MVP scale; FastAPI BackgroundTasks sufficient

### Redis Pub/Sub
- **Approach**: Webhook publishes to Redis channel, subscriber processes messages
- **Pros**: Fast, simple, no persistent queue needed
- **Cons**: No durability (messages lost if subscriber down), no retry logic
- **Rejected**: Risk of message loss unacceptable for customer-facing chat

### Webhooks.fyi / Svix (Third-party Webhook Gateway)
- **Approach**: Meta sends to Svix, Svix handles retries/dedup and forwards to our API
- **Pros**: Battle-tested reliability, automatic retries, webhook debugging
- **Cons**: Cost per request, vendor lock-in, adds latency (extra hop)
- **Rejected**: Adds unnecessary dependency; Meta's webhook design is simple enough to handle directly

## Consequences

### Positive
- **Fast ACK**: <50ms webhook response time (well within 200ms SLA)
- **Reliable Processing**: Background tasks survive app crashes (reprocessed on restart via DB polling)
- **Secure**: HMAC validation prevents spoofed messages, bot_id in URL prevents cross-tenant injection
- **Deduplication**: Prevents duplicate responses even if Meta retries delivery
- **Workspace Isolation**: bot_id FK enforces tenant boundaries

### Negative
- **Single-Process Dedup**: In-memory dedup fails in multi-process deployments (Gunicorn with N workers)
- **No Retry Logic**: Failed background tasks silently drop (no DLQ or retry mechanism)
- **Manual Testing Difficulty**: HMAC signature requires Meta's secret (can't use curl/Postman without signature generation script)

### Mitigations
- Add Redis-based dedup for production (multi-process safe)
- Implement dead-letter queue for failed processing (log to DB or Sentry)
- Build webhook testing UI in admin panel (generates valid signatures for manual testing)
- Add health check monitoring for background task queue depth

## Performance Characteristics
- **Webhook Response Time**: 30-80ms (signature validation + DB lookup + dedup check)
- **Background Processing**: 500-1500ms (CDP sync + intent classification + RAG + LLM + guardrails)
- **Throughput**: 100-200 messages/sec per instance (limited by LLM API rate limits, not webhook)

## Security Considerations
- **HMAC Validation**: Prevents message spoofing (attacker cannot forge valid signature without META_APP_SECRET)
- **Payload Size Limit**: 100KB cap prevents DoS via oversized payloads
- **Rate Limiting**: 30 req/min per IP prevents webhook abuse
- **Bot Validation**: Ensures bot_id exists and belongs to active workspace
- **Signature Timing Attack Prevention**: `hmac.compare_digest()` prevents timing-based signature guessing

## Operational Notes
- **Meta App Secret**: Must be configured via `META_APP_SECRET` env var. Without it, all webhooks rejected (503 error).
- **Webhook URL Format**: `https://api.arabbot.studio/webhooks/whatsapp/{bot_id}`
- **Debugging**: Check `logs/arabbot.jsonl` for processing errors with request_id correlation

## Related Decisions
- ADR-006: Multi-tenant Workspace Isolation (bot_id in URL enforces isolation)
- ADR-009: Customer Data Platform (CDP sync happens in webhook processing)
- ADR-002: Phase 2A Architecture (webhook triggers orchestrator pipeline)

## References
- Webhook Handler: `backend/src/webhooks/whatsapp.py`
- WhatsApp Sender Service: `backend/src/services/wa_sender_service.py`
- Rate Limiter: `backend/src/services/rate_limiter.py`
- Background Tasks: FastAPI `BackgroundTasks` (in-process task queue)
