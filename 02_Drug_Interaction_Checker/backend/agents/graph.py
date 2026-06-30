from langgraph.graph import END, START, StateGraph

from agents.nodes.decompose import decompose_pairs
from agents.nodes.pair_agent import analyze_pair
from agents.nodes.report import generate_pdf_report
from agents.nodes.synthesis import synthesize_results
from agents.state import DrugInteractionState


def build_graph():
    builder = StateGraph(DrugInteractionState)

    # Nodes
    builder.add_node("analyze_pair", analyze_pair)
    builder.add_node("synthesize", synthesize_results)
    builder.add_node("generate_pdf", generate_pdf_report)

    # START → decompose_pairs (returns list[Send]) → parallel analyze_pair nodes
    builder.add_conditional_edges(START, decompose_pairs, ["analyze_pair"])

    # After ALL parallel analyze_pair executions complete → synthesize
    builder.add_edge("analyze_pair", "synthesize")

    # synthesize → generate_pdf → END
    builder.add_edge("synthesize", "generate_pdf")
    builder.add_edge("generate_pdf", END)

    return builder.compile()


# Module-level compiled graph — imported by the API layer
graph = build_graph()