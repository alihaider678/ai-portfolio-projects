from operator import itemgetter
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from vectorstore.chroma_store import get_vectorstore
from utils.config import settings

SUPPORT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a professional and empathetic customer support agent.
Use the knowledge base context below to answer the customer's question accurately.
If the answer is not in the context, say you'll look into it further — never make up information.
Always be polite, clear, and solution-focused.

Knowledge Base Context:
{context}

Conversation History:
{chat_history}
"""),
    ("human", "{question}"),
])


def format_docs(docs) -> str:
    return "\n\n".join(doc.page_content for doc in docs)


def format_chat_history(messages) -> str:
    if not messages:
        return "No previous conversation."
    formatted = []
    for msg in messages:
        role = "Customer" if msg.type == "human" else "Agent"
        formatted.append(f"{role}: {msg.content}")
    return "\n".join(formatted)


def get_rag_chain():
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.3,
    )
    chain = (
        {
            "context": itemgetter("question") | retriever | format_docs,
            "question": itemgetter("question"),
            "chat_history": itemgetter("chat_history") | RunnableLambda(format_chat_history),
        }
        | SUPPORT_PROMPT
        | llm
        | StrOutputParser()
    )
    return chain, retriever
