from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from utils.config import settings

SENTIMENT_PROMPT = PromptTemplate.from_template(
    """Analyze the sentiment of this customer message.
    Reply with exactly one word: positive, neutral, negative, or frustrated.

    Frustrated means the customer is angry, repeatedly asking the same thing, or using words like
    "still", "again", "useless", "terrible", "unacceptable".

    Message: {message}

    Sentiment:"""
)


def analyze_sentiment(message: str) -> str:
    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0,
    )
    chain = SENTIMENT_PROMPT | llm
    result = chain.invoke({"message": message})
    return result.content.strip().lower()
