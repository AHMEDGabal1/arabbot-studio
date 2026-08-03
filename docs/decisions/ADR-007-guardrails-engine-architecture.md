# ADR-007: Guardrails Engine Architecture

## Status
Accepted

## Date
2026-08-03

## Context
ArabBot Studio operates in regulated industries (healthcare, finance, e-commerce) where AI responses must comply with business rules and legal requirements. Customers need to:
- Prevent hallucinated discounts or pricing that violates approval limits
- Block forbidden words or phrases (profanity, competitor names, prohibited medical claims)
- Enforce mandatory disclaimers in specific contexts
- Limit response length for channel constraints (SMS, WhatsApp character limits)
- Escalate to human agents when responses violate critical rules

Without guardrails, LLMs can generate responses that expose businesses to legal liability, brand damage, or financial loss.

## Decision Drivers
- Must execute in <100ms to maintain sub-second response times
- Must support priority-ordered rule evaluation (critical rules first)
- Must be workspace-isolated (one bot's rules don't affect another)
- Must support multiple action types (block, replace, flag, escalate)
- Must prevent ReDoS (Regular Expression Denial of Service) attacks
- Must handle Arabic text patterns (Eastern Arabic numerals, dialect variations)

## Decision
Implement a **priority-ordered post-generation validation engine** that evaluates bot responses against configurable rules before delivery to users.

### Architecture Components

#### 1. Data Model
- **GuardrailRule** table with columns:
  - `bot_id` (FK to bots, indexed)
  - `rule_type` (forbidden_word, max_discount, required_phrase, regex_block, max_length)
  - `value` (rule parameter: word, percentage, phrase, pattern, character limit)
  - `action` (block, replace, flag, escalate)
  - `replacement_text` (for replace action)
  - `priority` (higher = evaluated first)
  - `is_active` (soft disable without deletion)

#### 2. Validation Pipeline
```python
# Executed in orchestrator.py after LLM generation, before message storage
rules = await get_bot_rules(db, bot_id)  # ORDER BY priority DESC
violations = []
sanitized_text = response_text
final_action = "allow"

for rule in rules:
    if validator(sanitized_text, rule.value):
        violations.append(rule)
        if rule.action == "replace":
            sanitized_text = apply_replacement(sanitized_text, rule)
        elif rule.action in ["block", "escalate"]:
            final_action = rule.action
            break  # Stop processing on critical violation
```

#### 3. Validator Implementations
- **forbidden_word**: Case-insensitive substring match
- **max_discount**: Regex extraction of discount percentages with Eastern Arabic numeral normalization (٠-٩ → 0-9)
- **required_phrase**: Exact phrase presence check
- **regex_block**: Pattern match with 200-char limit and 10KB text limit (ReDoS prevention)
- **max_length**: Character count check

#### 4. Action Handlers
- **block**: Replace response with safe fallback ("عذراً، لا أستطيع الرد على هذا الطلب")
- **replace**: Substitute forbidden content with replacement_text
- **flag**: Log violation but allow response (monitoring mode)
- **escalate**: Mark conversation for human handoff

## Alternatives Considered

### Pre-generation Prompt Injection
- **Approach**: Add rules as LLM instructions ("Never offer discounts above 10%")
- **Pros**: No post-processing overhead
- **Cons**: LLMs ignore instructions ~15% of the time (jailbreak prompts, edge cases), no deterministic enforcement
- **Rejected**: Cannot guarantee compliance for regulated industries

### Third-party Content Moderation API
- **Approach**: Use OpenAI Moderation API or Azure Content Safety
- **Pros**: Battle-tested, multi-language support
- **Cons**: Adds 200-500ms latency, external dependency, cost per request, no custom business rules (e.g., max discount validation)
- **Rejected**: Latency unacceptable for conversational UX, lacks domain-specific rules

### Rule Engine in Separate Microservice
- **Approach**: Deploy guardrails as standalone service with gRPC API
- **Pros**: Independent scaling, language-agnostic
- **Cons**: Network overhead, service mesh complexity, operational burden for startups
- **Rejected**: Over-engineering for MVP scale (<1000 RPS)

## Consequences

### Positive
- **Deterministic Compliance**: 100% enforcement rate for all rule types
- **Low Latency**: <50ms validation overhead for typical rule sets (5-10 rules)
- **Audit Trail**: All violations logged to database with rule IDs for compliance reporting
- **Flexible Actions**: Customers choose between blocking (strict) and flagging (monitor-only)
- **ReDoS Protection**: Pattern length limits and text size caps prevent regex-based DoS

### Negative
- **Rule Ordering Complexity**: Priority conflicts require clear documentation. Current behavior: first blocking/escalating rule stops evaluation.
- **No Semantic Understanding**: Cannot detect implicit violations (e.g., "it's basically free" when max_discount=0). Future: LLM-as-Judge validator.
- **Maintenance Burden**: Each new rule type requires validator implementation and testing.

### Mitigations
- Provide rule priority calculator in UI to help users order rules logically
- Add "dry run" mode to test rules against historical messages before activation
- Build rule template library for common use cases (e-commerce, healthcare, finance)

## Related Decisions
- ADR-002: Phase 2A Architecture (defines guardrails as post-generation layer)
- ADR-006: Multi-tenant Workspace Isolation (guardrails enforce workspace_id via bot_id FK)

## References
- Guardrail Service: `backend/src/services/guardrail_service.py`
- Orchestrator Integration: `backend/src/chains/orchestrator.py` (lines 58-70)
- API Endpoints: `backend/src/routers/guardrails.py`
