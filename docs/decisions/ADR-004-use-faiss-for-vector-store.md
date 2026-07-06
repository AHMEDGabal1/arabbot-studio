# ADR-004: Use FAISS for Vector Store

## Status
Accepted

## Date
2026-07-06

## Context
ArabBot Studio features a Retrieval-Augmented Generation (RAG) engine that allows business owners to upload FAQs and knowledge bases. The bots query this knowledge to answer user questions on WhatsApp. This requires converting text into vector embeddings and performing similarity searches.

## Decision
Use Meta's FAISS (Facebook AI Similarity Search) running locally over managed cloud vector databases.

## Alternatives Considered

### Pinecone / Milvus / Weaviate (Managed Services)
- Pros: Infinite scale, zero infrastructure management, highly concurrent.
- Cons: High baseline costs (often $70+/month just for a production-ready index), network latency for every query, excessive complexity for the MVP phase.
- Rejected: The target demographic (SMBs) will likely have small knowledge bases (50-500 FAQs per bot). The network overhead and high fixed costs of managed vector databases make them unviable for our current pricing model.

### pgvector (PostgreSQL Extension)
- Pros: Keeps all data in one database, simplifies infrastructure.
- Cons: Requires a PostgreSQL instance compiled with the extension (complicating local dev and cheap hosting). Vector search performance can degrade without careful tuning.
- Rejected: We prefer the decoupling of vector data from transactional data at this stage.

## Consequences
- **Concurrency**: Because FAISS is an in-memory C++ library wrapped in Python, concurrent writes (e.g., adding knowledge) and reads (searching) to the same index can cause segmentation faults or memory corruption. We mitigate this using a bounded dictionary of `asyncio.Lock` per bot ID in the `vector_store.py` service.
- **Persistence**: The FAISS index is serialized to disk alongside a JSON file mapping vectors to the original text. In a multi-node deployment, this would require a shared mounted volume (like EFS) or a shift to a centralized vector database. For the MVP single-node architecture, local disk is sufficient.
