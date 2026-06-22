from langchain_google_genai import GoogleGenerativeAIEmbeddings

from src.config import settings

_embeddings = None


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=settings.google_api_key,
        )
    return _embeddings
