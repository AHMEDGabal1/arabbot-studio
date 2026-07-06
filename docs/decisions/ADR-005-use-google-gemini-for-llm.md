# ADR-005: Use Google Gemini for LLM Integration

## Status
Accepted

## Date
2026-07-06

## Context
ArabBot Studio's core value proposition is providing AI chatbots for the Egyptian market. This requires an LLM that is not only fluent in Modern Standard Arabic (MSA) but natively understands and can generate natural-sounding Egyptian Arabic (العامية المصرية). Furthermore, the LLM must be fast enough to adhere to WhatsApp's strict conversational latency expectations and cheap enough to operate at scale.

## Decision
Use Google Gemini (Gemini 2.0 Flash for routing/fast tasks, Gemini 2.5 Pro for complex RAG generation) via LangChain.

## Alternatives Considered

### OpenAI (GPT-4o / GPT-4o-mini)
- Pros: Industry standard, extremely reliable API, massive ecosystem support.
- Cons: While proficient in MSA, GPT models often sound slightly formal or "translated" when attempting regional dialects like Egyptian Arabic. They occasionally slip back into MSA during long interactions.
- Rejected: Gemini demonstrated superior cultural nuance and dialect consistency during testing with Egyptian Arabic idioms.

### Anthropic (Claude 3.5 Sonnet)
- Pros: Incredible reasoning, excellent instruction following.
- Cons: Arabic support is generally weaker than both OpenAI and Gemini. It often struggles with right-to-left syntax in JSON outputs and defaults to highly formal Arabic.
- Rejected: Poor dialect support.

### Open Source (Llama 3, Mistral) hosted locally
- Pros: Zero per-token cost, absolute data privacy.
- Cons: High infrastructure overhead (requires costly GPU instances). Most open-source models require significant fine-tuning to perform well in Arabic, let alone regional dialects.
- Rejected: Too expensive and complex to host for the MVP phase.

## Consequences
- **Ecosystem**: We use `langchain-google-genai` to integrate Gemini into our routing and RAG pipelines.
- **Latency vs Quality**: We route simple intents (Greeting, Out of Scope, Handoff requests) through the ultra-fast Gemini 2.0 Flash model, and reserve the more expensive/slower Gemini 2.5 Pro model exclusively for answering complex FAQ questions using the FAISS knowledge base.
