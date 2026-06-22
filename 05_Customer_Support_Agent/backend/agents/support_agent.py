from typing import Any
from langgraph.graph import StateGraph, END
from agents.nodes import retrieve_and_respond, sentiment_node, escalation_check, escalate_node


def build_support_graph() -> StateGraph:
    graph = StateGraph(dict)

    graph.add_node("analyze_sentiment", sentiment_node)
    graph.add_node("respond", retrieve_and_respond)
    graph.add_node("escalate", escalate_node)

    graph.set_entry_point("analyze_sentiment")

    graph.add_conditional_edges(
        "analyze_sentiment",
        escalation_check,
        {
            "respond": "respond",
            "escalate": "escalate",
        },
    )

    graph.add_edge("respond", END)
    graph.add_edge("escalate", END)

    return graph.compile()


support_graph = build_support_graph()


def run_agent(session_id: str, user_message: str, api_key: str | None = None) -> dict[str, Any]:
    initial_state = {
        "session_id": session_id,
        "user_message": user_message,
        "api_key": api_key,
        "sentiment": "neutral",
        "negative_count": 0,
        "response": "",
        "escalated": False,
        "case_id": None,
    }
    result = support_graph.invoke(initial_state)
    return result
