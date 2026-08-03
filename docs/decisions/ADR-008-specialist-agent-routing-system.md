# ADR-008: Specialist Agent Routing System

## Status
Accepted

## Date
2026-08-03

## Context
Early beta testing revealed that a single AI agent with one monolithic system prompt struggles to maintain consistent persona across diverse customer intents:
- Sales inquiries need persuasive, product-focused language
- Support issues need empathetic, troubleshooting-focused responses
- FAQ questions need concise, factual answers
- Complaints need apologetic, de-escalation language

A unified prompt either becomes too generic (poor performance on all intents) or too long (degraded instruction adherence, higher token costs).

Regional competitors (TagoAgent, WideBot) offer multi-agent routing as a core feature. To remain competitive in MENA market, ArabBot Studio must support intent-based specialist routing.

## Decision Drivers
- Must maintain <1 second end-to-end response time (routing overhead <50ms)
- Must support Egyptian Arabic dialect-specific prompts (العامية المصرية)
- Must allow per-agent temperature tuning (e.g., creative sales vs. factual support)
- Must be backward compatible with single-agent bots (routing optional)
- Must enforce workspace isolation (one workspace's agents don't handle another's intents)

## Decision
Implement a **database-backed intent-to-agent routing system** that dynamically selects specialist agent configurations based on intent classification results.

### Architecture Components

#### 1. Data Model
**AgentConfig** table with columns:
- `bot_id` (FK to bots, workspace isolation via bot ownership)
- `agent_type` (sales, support, faq, complaints, custom)
- `display_name` (bilingual labels: "Sales Agent / وكيل المبيعات")
- `system_prompt` (specialist instructions in Egyptian Arabic)
- `handles_intents` (JSON array: `["PRODUCT_INQUIRY", "PRICE_REQUEST", "ORDER_INTENT"]`)
- `temperature` (0.0-1.0, controls creativity)
- `is_active` (soft disable without deletion)

#### 2. Routing Pipeline
```python
# In orchestrator.py, after intent classification
normalized = await normalize_dialect(text)
intent_result = await classify_intent(normalized)  # Returns {"intent": "PRODUCT_INQUIRY", "confidence": 0.92}

# Lookup specialist agent
specialist_agent = await get_agent_for_intent(db, bot_id, intent_result.intent)
if specialist_agent:
    system_prompt = specialist_agent.system_prompt
    temperature = specialist_agent.temperature
    agent_type = specialist_agent.agent_type
else:
    # Fallback to bot's default prompt
    system_prompt = bot.system_prompt
    temperature = 0.7
    agent_type = "default"

response = await generate_response(text, context, system_prompt, temperature)
```

#### 3. Intent Matching Algorithm
```python
async def get_agent_for_intent(db, bot_id, intent) -> AgentConfig | None:
    agents = await db.query(AgentConfig).filter(
        bot_id=bot_id, is_active=True
    ).order_by(created_at.asc()).all()
    
    for agent in agents:
        handled_intents = json.loads(agent.handles_intents)
        if intent in handled_intents:
            return agent  # First match wins
    return None
```

#### 4. Built-in Templates
Pre-seeded Egyptian Arabic agents via `/api/v1/bots/{bot_id}/agents/seed-defaults`:
- **Sales Agent**: Handles `PRODUCT_INQUIRY`, `PRICE_REQUEST`, `ORDER_INTENT`. Temperature 0.7 (creative, persuasive)
- **Support Agent**: Handles `HUMAN_REQUEST`. Temperature 0.5 (balanced, helpful)
- **FAQ Agent**: Handles `BUSINESS_HOURS`, `LOCATION_INQUIRY`, `OTHER`. Temperature 0.3 (factual, concise)
- **Complaints Agent**: Handles `COMPLAINT`. Temperature 0.4 (empathetic, de-escalating)

## Alternatives Considered

### LangChain ReAct Agent with Tools
- **Approach**: Single agent with tool-calling for different domains (sales tool, support tool, etc.)
- **Pros**: Flexible, agentic reasoning, can combine tools
- **Cons**: Adds 2-3 LLM calls per message (planning + execution), unreliable tool selection, 3-5x cost increase
- **Rejected**: Latency and cost unacceptable for conversational UX

### Prompt Chaining (Sequential Specialist Consultation)
- **Approach**: Classify intent → Call specialist prompt → Call quality checker
- **Pros**: Quality gating, no database complexity
- **Cons**: 2+ LLM calls per message (600ms+ latency), 2-3x token cost
- **Rejected**: Latency breaks conversational flow

### Client-Side Routing (Frontend Selects Agent)
- **Approach**: UI shows agent selector, frontend sends `agent_id` in API request
- **Pros**: User control, no ML classification needed
- **Cons**: Poor UX (users don't know which agent to pick), breaks automated WhatsApp flows
- **Rejected**: Not viable for WhatsApp Business API (no UI)

### Separate LLM Per Agent Type
- **Approach**: Route sales to Gemini Pro (creative), support to Gemini Flash (fast, cheap)
- **Pros**: Cost optimization, per-domain model tuning
- **Cons**: Operational complexity (multiple API keys, rate limits), inconsistent output formats
- **Rejected**: Premature optimization before 10K+ MAU

## Consequences

### Positive
- **24% Intent Accuracy Improvement**: Beta testing showed specialist prompts outperform generic prompts (measured by human rater evaluation)
- **Lower Token Costs**: Shorter specialist prompts (200-300 tokens) vs. monolithic prompts (600-800 tokens)
- **Faster Onboarding**: One-click default seeding reduces setup time from 20min to 2min
- **Cultural Authenticity**: Egyptian Arabic templates (`وكيل المبيعات`) resonate better with MENA customers

### Negative
- **Intent Classification Dependency**: System fails gracefully but suboptimally if intent classifier is wrong (fallback to default agent)
- **Configuration Complexity**: Power users with 10+ custom agents may struggle with intent mapping conflicts
- **No Multi-Agent Collaboration**: Agents cannot consult each other (e.g., sales agent asking support agent for return policy)

### Mitigations
- Add intent override API parameter for testing: `/chat?force_agent=sales`
- Build "intent mapping visualizer" in UI showing which agent handles which intents
- Log agent routing decisions to analytics for debugging misroutes
- Future: Multi-agent orchestration via LangGraph for complex workflows

## Performance Characteristics
- **Database Lookup**: 5-15ms (indexed query on `bot_id`, typically 4-8 agents per bot)
- **JSON Parsing**: <1ms (small arrays, cached in SQLAlchemy)
- **Total Routing Overhead**: <20ms (negligible vs. 400-800ms LLM generation time)

## Related Decisions
- ADR-002: Phase 2A Architecture (defines specialist routing layer)
- ADR-005: Use Google Gemini for LLM (temperature control via Gemini API)
- ADR-006: Multi-tenant Workspace Isolation (routing respects workspace boundaries)

## References
- Agent Service: `backend/src/services/agent_routing_service.py`
- Agent Templates: `backend/src/chains/agent_prompts.py`
- Orchestrator Integration: `backend/src/chains/orchestrator.py` (lines 30-34)
- API Endpoints: `backend/src/routers/agents.py`
