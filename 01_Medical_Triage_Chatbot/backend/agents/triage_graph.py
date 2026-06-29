"""
LangGraph StateGraph for medical triage.

Flow:
  START
    └─► interview_node  (extract symptoms, ask next question)
          └─► check_completeness  (conditional router)
                ├─ "continue"  ──► END  (return question to user)
                └─ "triage"    ──► retrieval_node
                                      └─► analysis_node
                                              └─► END  (return triage result)
"""

from langgraph.graph import END, StateGraph

from models.schemas import TriageState
from nodes.analysis import analysis_node
from nodes.completeness import check_completeness
from nodes.interview import interview_node
from nodes.retrieval import retrieval_node

_workflow = StateGraph(TriageState)

_workflow.add_node("interview", interview_node)
_workflow.add_node("retrieval", retrieval_node)
_workflow.add_node("analysis", analysis_node)

_workflow.set_entry_point("interview")

_workflow.add_conditional_edges(
    "interview",
    check_completeness,
    {"continue": END, "triage": "retrieval"},
)

_workflow.add_edge("retrieval", "analysis")
_workflow.add_edge("analysis", END)

graph = _workflow.compile()