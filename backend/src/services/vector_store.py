"""
FAISS-based local vector store for bot knowledge base search.

KNOWN LIMITATIONS (single-process-only design):
  1. Indices are stored on local disk (data/faiss_indices/). They will be lost
     on container redeploy, ephemeral filesystem, or pod restart.
  2. Concurrency is protected by per-process asyncio.Lock objects — these do NOT
     protect across multiple uvicorn workers or replicas.
  3. This design is acceptable for single-process development and staging.

PRODUCTION MIGRATION PATH:
  - Replace FAISS with pgvector (PostgreSQL extension) or a managed vector DB
    (e.g., Qdrant, Pinecone, Weaviate) to get durable, multi-worker-safe storage.
  - The public interface (build_index, add_to_index, search) is intentionally
    narrow so the migration only requires swapping this module's internals.
"""

import asyncio
import json
import logging
from pathlib import Path

import faiss
import numpy as np
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from src.config import settings

logger = logging.getLogger(__name__)

INDEX_DIR = Path("data/faiss_indices")
INDEX_DIR.mkdir(parents=True, exist_ok=True)

_embeddings = None
from collections import OrderedDict
_locks: OrderedDict[str, asyncio.Lock] = OrderedDict()
_MAX_LOCKS = 1000


def _get_lock(bot_id: str) -> asyncio.Lock:
    if bot_id in _locks:
        _locks.move_to_end(bot_id)
    else:
        if len(_locks) >= _MAX_LOCKS:
            _locks.popitem(last=False)
        _locks[bot_id] = asyncio.Lock()
    return _locks[bot_id]


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        if not settings.google_api_key:
            return None
        _embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=settings.google_api_key,
        )
    return _embeddings


def _index_path(bot_id: str) -> Path:
    return INDEX_DIR / f"{bot_id}.faiss"


def _store_path(bot_id: str) -> Path:
    return INDEX_DIR / f"{bot_id}.json"


def index_exists(bot_id: str) -> bool:
    return _index_path(bot_id).exists()


async def build_index(bot_id: str, texts: list[str]) -> None:
    embeddings = _get_embeddings()
    if embeddings is None:
        logger.warning("No embedding model configured - skipping FAISS index build")
        return
    try:
        vectors = await embeddings.aembed_documents(texts)
        dimension = len(vectors[0])
        index = faiss.IndexFlatL2(dimension)
        index.add(np.array(vectors).astype("float32"))
        faiss.write_index(index, str(_index_path(bot_id)))
        with open(_store_path(bot_id), "w", encoding="utf-8") as f:
            json.dump({"texts": texts}, f)
    except Exception as e:
        logger.warning(f"Failed to build vector index: {e}")
        with open(_store_path(bot_id), "w", encoding="utf-8") as f:
            json.dump({"texts": texts}, f)


async def add_to_index(bot_id: str, texts: list[str]) -> None:
    async with _get_lock(bot_id):
        if not index_exists(bot_id):
            return await build_index(bot_id, texts)
        embeddings = _get_embeddings()
        if embeddings is None:
            return
        try:
            vectors = await embeddings.aembed_documents(texts)
            index = faiss.read_index(str(_index_path(bot_id)))
            index.add(np.array(vectors).astype("float32"))
            faiss.write_index(index, str(_index_path(bot_id)))
        except Exception as e:
            logger.warning(f"Failed to update vector index: {e}")
        with open(_store_path(bot_id), "r", encoding="utf-8") as f:
            data = json.load(f)
        data["texts"].extend(texts)
        with open(_store_path(bot_id), "w", encoding="utf-8") as f:
            json.dump(data, f)


async def search(bot_id: str, query: str, k: int = 3) -> list[str]:
    async with _get_lock(bot_id):
        if not index_exists(bot_id):
            return []
        embeddings = _get_embeddings()
        if embeddings is None:
            with open(_store_path(bot_id), "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get("texts", [])[:k]
        try:
            query_vector = await embeddings.aembed_query(query)
            index = faiss.read_index(str(_index_path(bot_id)))
            distances, indices = index.search(np.array([query_vector]).astype("float32"), k)
            with open(_store_path(bot_id), "r", encoding="utf-8") as f:
                data = json.load(f)
            # IMPORTANT: Filter out negative indices returned by FAISS when k > index size.
            # Negative indices (usually -1) indicate "no match found" and would cause IndexError
            # or return incorrect results if used directly.
            return [data["texts"][i] for i in indices[0] if 0 <= i < len(data["texts"])]
        except Exception as e:
            logger.warning(f"Failed to search vector index: {e}")
            if _store_path(bot_id).exists():
                with open(_store_path(bot_id), "r", encoding="utf-8") as f:
                    data = json.load(f)
                return data.get("texts", [])[:k]
            return []
