"""
Analysis node — performs the final triage assessment using Claude Sonnet.
Combines collected symptom data with RAG medical context to output a
structured triage level, probable conditions, and recommended next steps.
"""

import json
import logging
import re

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from config import settings
from models.schemas import TriageState

logger = logging.getLogger(__name__)

_SYSTEM = """\
You are an expert medical triage system. Your role is to assess symptom severity
and recommend the appropriate level of care — not to diagnose or treat.

TRIAGE LEVELS (choose exactly one):
- emergency: Potentially life-threatening. Requires calling 911 or going to the ER immediately.
- urgent: Serious but not immediately life-threatening. Requires same-day medical attention.
- routine: Non-urgent. Can be addressed at a scheduled doctor appointment within a few days.

SAFETY RULE: When in doubt, always escalate to the higher urgency level.

Respond with ONLY valid JSON, no extra text:
{{
  "triage_level": "emergency" | "urgent" | "routine",
  "probable_conditions": ["Most likely condition", "Second possibility", "Third possibility"],
  "recommendations": [
    "First specific action to take",
    "Second action",
    "Third action",
    "Fourth action"
  ]
}}

- probable_conditions: List 2–4 conditions, most likely first
- recommendations: List 3–5 specific, actionable steps appropriate for the triage level\
"""


def analysis_node(state: TriageState) -> dict:
    llm = ChatOpenAI(
        model=settings.analysis_model,
        api_key=state["api_key"],
        temperature=0.1,
        max_tokens=1024,
    )

    symptoms_text = json.dumps(state["collected_symptoms"], indent=2)
    rag_context = state.get("rag_context", "") or "No additional medical context retrieved."

    user_content = (
        f"Collected patient symptoms:\n{symptoms_text}\n\n"
        f"Relevant medical knowledge:\n{rag_context}\n\n"
        "Provide your triage assessment."
    )

    try:
        response = llm.invoke([
            SystemMessage(content=_SYSTEM),
            HumanMessage(content=user_content),
        ])

        json_match = re.search(r"\{.*\}", response.content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            triage_level = data.get("triage_level", "urgent")
            conditions = data.get("probable_conditions", [])
            recommendations = data.get("recommendations", [])
        else:
            raise ValueError("No JSON found in analysis response")

    except Exception as e:
        logger.error(f"Analysis node error: {e}")
        triage_level = "urgent"
        conditions = ["Unable to determine — insufficient data"]
        recommendations = [
            "Please consult a healthcare professional as soon as possible.",
            "Describe your symptoms clearly to the doctor.",
            "If symptoms worsen rapidly, call 911.",
        ]

    level_labels = {
        "emergency": "🔴 EMERGENCY",
        "urgent": "🟡 URGENT",
        "routine": "🟢 ROUTINE",
    }
    response_text = (
        f"{level_labels.get(triage_level, '🟡 URGENT')} — "
        f"Triage assessment complete. See your results below."
    )

    return {
        "triage_level": triage_level,
        "probable_conditions": conditions,
        "recommendations": recommendations,
        "is_complete": True,
        "response_text": response_text,
        "response_type": "triage",
    }