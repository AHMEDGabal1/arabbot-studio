# ADR-009: Customer Data Platform (CDP) Architecture

## Status
Accepted

## Date
2026-08-03

## Context
Conversational AI systems suffer from "amnesia" when treating each interaction as isolated. Users expect businesses to remember:
- Previous conversation history ("as I mentioned yesterday...")
- Customer preferences and context ("I'm allergic to peanuts")
- Behavioral patterns (VIP customer, frequent complainer, first-time buyer)
- Internal agent notes ("promised 10% discount on next order")

Without persistent memory, AI agents provide impersonal, repetitive experiences that frustrate customers and miss upselling opportunities.

MENA market competitors (Unifonic, Karix) offer "customer 360" features. To compete, ArabBot Studio must track cross-conversation customer profiles.

## Decision Drivers
- Must support multi-channel identity (same customer on WhatsApp, web chat, phone)
- Must enforce workspace isolation (customer profiles scoped per workspace)
- Must inject context into LLM prompts without exceeding token limits
- Must support real-time updates during conversations (increment message counter)
- Must handle high-cardinality data (millions of customers per workspace)
- Must protect PII (no plain-text storage of sensitive data without encryption)

## Decision
Implement a **workspace-scoped Customer Data Platform** with unique customer identification per channel and automated context injection into LLM prompts.

### Architecture Components

#### 1. Data Model
**CustomerProfile** table with columns:
- `id` (UUID primary key)
- `workspace_id` (FK to workspaces, enforces isolation)
- `channel` (whatsapp, webchat, phone)
- `channel_user_id` (platform-specific identifier: WhatsApp phone, session cookie, caller ID)
- `display_name` (human-readable name, nullable)
- `phone`, `email` (contact info, nullable)
- `tags` (JSON array: `["vip", "returning", "high_value"]`)
- `notes` (free-text field for human agent annotations)
- `first_seen_at`, `last_seen_at` (activity tracking)
- `total_conversations`, `total_messages` (engagement metrics)
- `preferred_language` (eg: "ar-EG", "ar-SA")
- `custom_fields` (JSON object for business-specific data)
- **Unique Constraint**: `(workspace_id, channel, channel_user_id)` prevents duplicates

#### 2. Context Injection Pipeline
```python
# In webhook handler (whatsapp.py), before orchestrator
profile = await get_or_create_profile(db, workspace_id, "whatsapp", phone_number)
await increment_message_count(db, profile.id)

customer_ctx = await get_profile_context(db, workspace_id, "whatsapp", phone_number)
# Returns: "Customer: Ahmed (VIP, 15 previous messages). Agent notes: Prefers morning delivery."

# Passed to orchestrator
result = await process_message(
    text,
    knowledge_items=knowledge_items,
    bot_id=bot_id,
    db=db,
    customer_context=customer_ctx  # Injected here
)

# In rag_chain.py, prepended to RAG context
system_prompt = f"{specialist_prompt}\n\nCustomer Context: {customer_context}"
response = await llm.generate(system_prompt, user_message, rag_context)
```

#### 3. Context Summarization
To avoid token bloat, profile context is condensed:
```python
def get_profile_context(profile: CustomerProfile) -> str:
    parts = []
    if profile.display_name:
        parts.append(f"اسم العميل: {profile.display_name}")
    if profile.tags:
        tags = json.loads(profile.tags)
        if tags:
            parts.append(f"تصنيف: {', '.join(tags)}")
    if profile.total_messages > 5:
        parts.append(f"عميل متكرر ({profile.total_messages} رسالة سابقة)")
    if profile.notes:
        parts.append(f"ملاحظات: {profile.notes[:200]}")  # Truncate long notes
    return " | ".join(parts) if parts else ""
```
**Token Cost**: Typically 30-80 tokens (vs. 200-500 for full profile dump).

#### 4. Cross-Bot Memory
Customer profiles are workspace-scoped, **not** bot-scoped. This enables:
- **Unified Identity**: Customer interacting with "Sales Bot" and "Support Bot" shares same profile
- **Cross-Bot Analytics**: Total messages across all bots in workspace
- **Centralized Notes**: Human agents see notes regardless of which bot customer contacted

Conversations remain bot-specific (FK to bots table), but profiles aggregate across bots.

## Alternatives Considered

### Conversation-Scoped Memory Only
- **Approach**: Store history in conversations table, retrieve last N messages per conversation
- **Pros**: Simple, no new tables, automatic pruning (delete old conversations)
- **Cons**: Loses context when customer starts new conversation, no cross-bot memory, no human annotations
- **Rejected**: Poor UX for returning customers ("why are you asking my name again?")

### Redis-Based Session Store
- **Approach**: Store customer context in Redis with TTL (1 week), no database persistence
- **Pros**: Fast reads (<1ms), automatic expiration
- **Cons**: Data loss on Redis restart, no long-term analytics, no human-editable fields
- **Rejected**: Customer memory must survive restarts; analytics require SQL queries

### External CDP Integration (Segment, mParticle)
- **Approach**: Send events to third-party CDP, fetch profiles via API
- **Pros**: Enterprise-grade features (audience segmentation, ML predictions)
- **Cons**: 200-500ms API latency (breaks <1s response time), cost per API call, vendor lock-in
- **Rejected**: Latency unacceptable; most customers need basic CDP, not enterprise features

### LLM-Generated Summaries
- **Approach**: After each conversation, LLM generates profile summary ("Customer prefers...")
- **Pros**: Semantic compression, captures implicit info
- **Cons**: Adds 1-2 LLM calls per conversation (cost/latency), hallucination risk (LLM invents preferences)
- **Rejected**: Cost and reliability concerns; manual notes + tags sufficient for MVP

## Consequences

### Positive
- **Personalized Responses**: LLM acknowledges customer history ("مرحباً أحمد! كيف حال طلبك السابق؟")
- **Human Agent Continuity**: Notes follow customer across conversations and bots
- **Retention Analytics**: Track engagement metrics (total messages, last seen)
- **VIP Treatment**: Tag high-value customers for priority handling or custom prompts
- **GDPR-Ready**: Centralized customer data enables right-to-deletion (delete profile + cascade to conversations)

### Negative
- **Token Overhead**: Context injection adds 30-80 tokens per request (3-5% cost increase)
- **Stale Data Risk**: Profile updates during conversation may not reflect in same LLM call (read-after-write timing)
- **Duplicate Detection**: No fuzzy matching (same person on different phone numbers = 2 profiles)
- **PII Storage**: Plain-text phone/email in database (encryption not yet implemented)

### Mitigations
- Add "forget customer" API endpoint for GDPR compliance
- Implement profile merging UI for deduplication (future)
- Add field-level encryption for phone/email (Phase 3 security hardening)
- Cache profile context in request lifecycle to avoid stale reads

## Performance Characteristics
- **Profile Lookup**: 5-10ms (indexed query on `workspace_id + channel + channel_user_id`)
- **Context Generation**: <1ms (string formatting, no LLM calls)
- **Counter Updates**: Async after response sent (no latency impact)
- **Total Overhead**: <15ms per message

## Security Considerations
- **Workspace Isolation**: Enforced via `workspace_id` FK and unique constraint
- **PII Protection**: Current: application-level access control. Future: field-level encryption (AES-256-GCM)
- **Audit Trail**: Profile updates logged via `updated_at` timestamp (no change history yet)

## Related Decisions
- ADR-002: Phase 2A Architecture (defines CDP as context injection layer)
- ADR-006: Multi-tenant Workspace Isolation (profiles scoped per workspace)
- ADR-008: Specialist Agent Routing (customer context passed to all agent types)

## References
- Customer Profile Model: `backend/src/models/customer_profile.py`
- Profile Service: `backend/src/services/customer_profile_service.py`
- Webhook Integration: `backend/src/webhooks/whatsapp.py` (lines 109-135)
- API Endpoints: `backend/src/routers/customers.py`
