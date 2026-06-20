from langchain_classic.memory import ConversationBufferWindowMemory

_sessions: dict[str, ConversationBufferWindowMemory] = {}


def get_memory(session_id: str) -> ConversationBufferWindowMemory:
    if session_id not in _sessions:
        _sessions[session_id] = ConversationBufferWindowMemory(
            k=10,
            return_messages=True,
            memory_key="chat_history",
        )
    return _sessions[session_id]


def clear_memory(session_id: str) -> None:
    if session_id in _sessions:
        del _sessions[session_id]


def get_chat_history(session_id: str) -> list:
    memory = get_memory(session_id)
    return memory.chat_memory.messages
