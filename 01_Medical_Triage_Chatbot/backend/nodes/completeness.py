"""
Completeness router — decides whether the interview has enough information
to proceed to triage, or should continue asking questions.
This is a pure logic function with no LLM call.
"""

from config import settings
from models.schemas import TriageState


def check_completeness(state: TriageState) -> str:
    """Return 'triage' or 'continue' for the conditional edge."""
    symptoms = state["collected_symptoms"]

    # Force triage after max turns regardless of completeness
    if state["turn_count"] >= settings.max_interview_turns:
        return "triage"

    has_main = bool(symptoms.get("main_symptom"))
    has_duration = bool(symptoms.get("duration"))
    has_severity = bool(symptoms.get("severity"))
    has_associated = bool(symptoms.get("associated_symptoms"))

    # Minimum required: main symptom + duration + severity + at least one follow-up
    if has_main and has_duration and has_severity and has_associated:
        return "triage"

    return "continue"