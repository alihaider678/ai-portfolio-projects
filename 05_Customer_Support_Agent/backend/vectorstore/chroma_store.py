from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from utils.config import settings


def get_vectorstore() -> Chroma:
    embeddings = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        api_key=settings.openai_api_key,
    )
    return Chroma(
        persist_directory=settings.chroma_persist_dir,
        embedding_function=embeddings,
    )


def ingest_documents(documents: list[Document]) -> Chroma:
    embeddings = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        api_key=settings.openai_api_key,
    )
    vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=settings.chroma_persist_dir,
    )
    return vectorstore
