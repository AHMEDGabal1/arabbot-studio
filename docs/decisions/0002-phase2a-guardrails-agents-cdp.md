# 2. Phase 2A Architecture: Guardrails Engine, Specialist Agent Routing, and Customer Profiles (CDP)

* Status: Accepted
* Date: 2026-07-25

## Context and Problem Statement

To bridge competitive gaps identified against regional MENA conversational AI platforms (TagoAgent, WideBot), ArabBot Studio required three core intelligence capabilities:
1. **Safety & Guardrails**: Prevention of hallucinated discounts, prohibited terminology, missing disclaimers, or invalid responses.
2. **Multi-Agent Specialist Routing**: Domain-specific prompts for Sales, Support, FAQ, and Complaints agents routed dynamically based on intent classification.
3. **Customer Data Platform (CDP)**: Persistent memory across conversations tracking tags, notes, total interactions, and context injection into LLM prompts.

## Decision Drivers

- Workspace isolation must be strictly preserved across all new APIs and models.
- AI pipeline performance must remain sub-second.
- Full backward compatibility with existing single-agent bots and webhooks must be maintained.

## Considered Options

1. **Monolithic Prompt Expansion**: Adding rules and customer context directly into a single massive system prompt.
   * *Cons*: Causes prompt confusion, higher token costs, lower instruction adherence.
2. **Modular 3-Layer Execution Pipeline (Chosen)**:
   - Pre-generation Context Injection (CDP profile summary + Specialist Agent system prompt).
   - Intent Routing (Intent Classifier -> Specialist Agent lookup -> RAG Generation).
   - Post-generation Guardrail Evaluation (5 validator types evaluating response text, with action handlers for block, replace, flag, escalate).

## Decision Outcome

Chosen Option: **Modular 3-Layer Execution Pipeline**.

### Key Additions Built

1. **Guardrails Engine**:
   - `GuardrailRule` model (`guardrail_rules` table) with priority-ordered execution.
   - Validators: `forbidden_word`, `max_discount`, `required_phrase`, `regex_block`, `max_length`.
   - Actions: `block` (fallback response), `replace` (sanitized text), `flag` (log), `escalate` (human handoff).

2. **Specialist Agent Routing**:
   - `AgentConfig` model (`agent_configs` table) linking intent lists (`handles_intents`) to custom system prompts and model parameters.
   - Built-in Egyptian Arabic templates for Sales, Support, FAQ, and Complaints.

3. **Customer Profiles (CDP)**:
   - `CustomerProfile` model (`customer_profiles` table) with composite uniqueness on `(workspace_id, channel, channel_user_id)`.
   - Automatic message/conversation counter tracking and summary context generation for LLM prompts.

## Positive Consequences

- All 26 new and existing unit & integration tests pass with 100% success rate.
- Standardized REST APIs under `/api/v1/bots/{bot_id}/guardrails`, `/api/v1/bots/{bot_id}/agents`, and `/api/v1/customers`.
