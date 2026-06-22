# Data Model: ArabBot Studio MVP

## Entities

### Workspace

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, auto-generated | Primary key |
| name | TEXT | NOT NULL | Workspace name |
| plan | TEXT | DEFAULT 'starter' | 'starter' / 'pro' / 'agency' |
| monthly_message_limit | INT | DEFAULT 1000 | Messages allowed per month |
| messages_used_this_month | INT | DEFAULT 0 | Running total |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

### User

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, auto-generated | Primary key |
| email | TEXT | UNIQUE, NOT NULL | User email (login) |
| phone | TEXT | NULLABLE | Phone number |
| password_hash | TEXT | NOT NULL | bcrypt hash |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

### WorkspaceMember

| Field | Type | Constraints | Notes |
|---|---|---|---|
| workspace_id | UUID | FK → workspace.id, PK | Composite key |
| user_id | UUID | FK → user.id, PK | Composite key |
| role | TEXT | DEFAULT 'member' | 'owner' / 'admin' / 'member' |

### Bot

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, auto-generated | Primary key |
| workspace_id | UUID | FK → workspace.id | Soft tenant isolation |
| name | TEXT | NOT NULL | Bot display name |
| language | TEXT | DEFAULT 'ar-EG' | Arabic (Egypt) |
| channel | TEXT | NOT NULL | 'whatsapp' / 'facebook' / 'both' |
| wa_phone_number_id | TEXT | NULLABLE | From Meta dashboard |
| wa_access_token | TEXT | NULLABLE | Meta API token |
| fb_page_id | TEXT | NULLABLE | Facebook page ID |
| fb_access_token | TEXT | NULLABLE | Facebook access token |
| system_prompt | TEXT | NULLABLE | Custom bot personality |
| fallback_message | TEXT | DEFAULT 'هورينك لحد من فريقنا دلوقتي' | Default Arabic response |
| human_handoff_enabled | BOOL | DEFAULT true | Enable human handoff |
| fawry_merchant_code | TEXT | NULLABLE | Fawry payment |
| paymob_api_key | TEXT | NULLABLE | Paymob payment |
| is_active | BOOL | DEFAULT false | Live traffic flag |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |
| deleted_at | TIMESTAMPTZ | NULLABLE | Soft delete |

### KnowledgeItem

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, auto-generated | Primary key |
| bot_id | UUID | FK → bot.id, CASCADE | Bot context |
| type | TEXT | NOT NULL | 'faq' / 'product' / 'policy' / 'custom' |
| question | TEXT | NULLABLE | For FAQ type |
| answer | TEXT | NOT NULL | Answer content |
| metadata | JSONB | NULLABLE | Extra fields (price, category) |
| embedding | VECTOR(768) | NULLABLE | pgvector for FAISS |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last update |

### Conversation

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, auto-generated | Primary key |
| bot_id | UUID | FK → bot.id | Bot context |
| channel | TEXT | NOT NULL | 'whatsapp' / 'facebook' |
| channel_user_id | TEXT | NOT NULL | WA phone or FB PSID |
| user_display_name | TEXT | NULLABLE | User's display name |
| status | TEXT | DEFAULT 'active' | 'active' / 'handed_off' / 'closed' |
| started_at | TIMESTAMPTZ | DEFAULT now() | Conversation start |
| last_message_at | TIMESTAMPTZ | NULLABLE | Last message timestamp |
| deleted_at | TIMESTAMPTZ | NULLABLE | Soft delete |

### Message

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, auto-generated | Primary key |
| conversation_id | UUID | FK → conversation.id | Parent conversation |
| role | TEXT | NOT NULL | 'user' / 'assistant' / 'system' |
| content | TEXT | NOT NULL | Message content |
| raw_content | TEXT | NULLABLE | Original before normalization |
| intent_detected | TEXT | NULLABLE | Intent from router |
| confidence | FLOAT | NULLABLE | Intent confidence 0-1 |
| was_rag_hit | BOOL | DEFAULT false | Did RAG retrieval succeed? |
| processing_ms | INT | NULLABLE | Processing time |
| created_at | TIMESTAMPTZ | DEFAULT now() | Message timestamp |

### HandoffQueue

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, auto-generated | Primary key |
| conversation_id | UUID | FK → conversation.id | Conversation to handoff |
| reason | TEXT | NULLABLE | Handoff reason |
| assigned_to | UUID | FK → user.id, NULLABLE | Assigned agent |
| resolved_at | TIMESTAMPTZ | NULLABLE | Resolution timestamp |
| created_at | TIMESTAMPTZ | DEFAULT now() | Handoff timestamp |

---

## Relationships

```
Workspace 1 ──┐
         │
         └─ 1 WorkspaceMember ←─ 1 User
         │
         └─ 1 Bot
               │
               ├─ 1 Conversation
               │     │
               │     └─ N Message
               │     │
               │     └─ 1 HandoffQueue
               │
               └─ N KnowledgeItem
```

- Workspace → Users: Many-to-many (via WorkspaceMember)
- Workspace → Bots: One-to-many
- Bot → Conversations: One-to-many
- Bot → KnowledgeItems: One-to-many
- Conversation → Messages: One-to-many
- Conversation → HandoffQueue: One-to-one (optional)

---

## State Transitions

### Conversation Status

```
active ──┬─── handed_off (on human_handoff request)
        │         │
        │         └── closed (resolved)
        │
        └── closed (user silence timeout)
```

### Handoff Queue

```
pending ── assigned (assigned_to set)
    │         │
    │         └── resolved (resolved_at set)
    │
    └── [auto-resolve on timeout]
```

---

## Validation Rules

| Entity | Rule |
|---|---|
| User.email | Must be valid email format, unique |
| User.password_hash | Required, bcrypt hash |
| Bot.name | 1-100 characters |
| Bot.channel | Must be 'whatsapp', 'facebook', or 'both' |
| Bot.workspace_id | Must match authenticated user's workspace |
| KnowledgeItem.type | Must be 'faq', 'product', 'policy', or 'custom' |
| KnowledgeItem.answer | Required, max 5000 chars |
| Conversation.status | Must be 'active', 'handed_off', or 'closed' |
| Message.role | Must be 'user', 'assistant', or 'system' |
| Workspace.plan | Must be 'starter', 'pro', or 'agency' |
| Workspace.monthly_message_limit | > 0 |

---

## Indexes

| Table | Index | Fields |
|---|---|---|
| workspace_members | idx_workspace_members_workspace | workspace_id |
| workspace_members | idx_workspace_members_user | user_id |
| bots | idx_bots_workspace | workspace_id, deleted_at |
| conversations | idx_conversations_bot | bot_id, status |
| messages | idx_messages_conversation | conversation_id |
| knowledge_items | idx_knowledge_bot | bot_id |
| knowledge_items | idx_knowledge_embedding | embedding (vector index) |