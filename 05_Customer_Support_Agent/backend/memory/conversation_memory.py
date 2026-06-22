from langchain_core.messages import BaseMessage, HumanMessage, AIMessage


class WindowMemory:
    def __init__(self, k: int = 10):
        self._k = k
        self.messages: list[BaseMessage] = []

    def add_message(self, message: BaseMessage) -> None:
        self.messages.append(message)
        max_msgs = self._k * 2
        if len(self.messages) > max_msgs:
            self.messages = self.messages[-max_msgs:]


_sessions: dict[str, WindowMemory] = {}


def get_memory(session_id: str) -> WindowMemory:
    if session_id not in _sessions:
        _sessions[session_id] = WindowMemory(k=10)
    return _sessions[session_id]


def clear_memory(session_id: str) -> None:
    if session_id in _sessions:
        del _sessions[session_id]


def get_chat_history(session_id: str) -> list[BaseMessage]:
    return get_memory(session_id).messages