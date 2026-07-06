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
_locks: dict[str, asyncio.Lock] = {}


def _get_lock(bot_id: str) -> asyncio.Lock:
    if bot_id not in _locks:
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
        logger.warning("No Google API key set - skipping FAISS index build")
        return
    vectors = await embeddings.aembed_documents(texts)
    dimension = len(vectors[0])
    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(vectors).astype("float32"))
    faiss.write_index(index, str(_index_path(bot_id)))
    with open(_store_path(bot_id), "w", encoding="utf-8") as f:
        json.dump({"texts": texts}, f)


async def add_to_index(bot_id: str, texts: list[str]) -> None:
    async with _get_lock(bot_id):
        if not index_exists(bot_id):
            return await build_index(bot_id, texts)
        embeddings = _get_embeddings()
        if embeddings is None:
            return
        vectors = await embeddings.aembed_documents(texts)
        index = faiss.read_index(str(_index_path(bot_id)))
        index.add(np.array(vectors).astype("float32"))
        faiss.write_index(index, str(_index_path(bot_id)))
        with open(_store_path(bot_id), "r", encoding="utf-8") as f:
            data = json.load(f)
        data["texts"].extend(texts)
        with open(_store_path(bot_id), "w", encoding="utf-8") as f:
            json.dump(data, f)


async def search(bot_id: str, query: str, k: int = 3) -> list[str]:
    if not index_exists(bot_id):
        return []
    embeddings = _get_embeddings()
    if embeddings is None:
        return []
    query_vector = await embeddings.aembed_query(query)
    index = faiss.read_index(str(_index_path(bot_id)))
    distances, indices = index.search(np.array([query_vector]).astype("float32"), k)
    with open(_store_path(bot_id), "r", encoding="utf-8") as f:
        data = json.load(f)
    return [data["texts"][i] for i in indices[0] if i < len(data["texts"])]
