"""
Interview node — extracts symptom data from the patient's latest message
and generates the next structured question to ask.
Uses Claude Haiku for speed and cost efficiency.
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
You are an AI medical triage assistant conducting a structured symptom interview.
Your role is to gather the information needed to assess the patient's urgency level.

Current collected information:
{collected_symptoms}

Questions already asked:
{questions_asked}

Information still needed (collect in this priority order):
1. main_symptom — the primary complaint (if missing)
2. duration — how long they have had the symptom (if missing)
3. severity — pain or discomfort on a scale of 1–10 (if missing)
4. associated_symptoms — any other symptoms present (fever, nausea, dizziness, etc.) (if missing)
5. medical_history — relevant existing conditions (heart disease, diabetes, allergies, etc.) (if missing)
6. age — patient's age (helpful for risk assessment) (if missing)

Rules:
- Extract ALL symptom information mentioned in the patient's latest message
- Ask exactly ONE question per response
- Keep your tone calm, professional, and empathetic
- Do not repeat a question already asked
- Do not diagnose or give medical advice — only collect information

Respond with ONLY valid JSON, no extra text:
{{
  "extracted_symptoms": {{}},
  "next_question": "Your next question here"
}}

The extracted_symptoms dict should contain new key-value pairs from the latest message.
Keys should use the names from the priority list above.\
"""


def interview_node(state: TriageState) -> dict:
    latest_message = state["messages"][-1].content

    llm = ChatOpenAI(
        model=settings.interview_model,
        api_key=state["api_key"],
        temperature=0.3,
        max_tokens=512,
    )

    system_content = _SYSTEM.format(
        collected_symptoms=json.dumps(state["collected_symptoms"], indent=2) or "{}",
        questions_asked=json.dumps(state["questions_asked"]) or "[]",
    )

    try:
        response = llm.invoke([
            SystemMessage(content=system_content),
            HumanMessage(content=f"Patient's latest message: {latest_message}"),
        ])

        json_match = re.search(r"\{.*\}", response.content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            extracted = data.get("extracted_symptoms", {})
            next_question = data.get("next_question", "Could you describe your symptom in more detail?")
        else:
            extracted = {}
            next_question = "Could you tell me more about how you're feeling?"

    except Exception as e:
        logger.error(f"Interview node error: {e}")
        extracted = {}
        next_question = "I had trouble processing that. Could you describe your main symptom again?"

    updated_symptoms = {**state["collected_symptoms"], **extracted}
    updated_questions = state["questions_asked"] + [next_question]

    return {
        "collected_symptoms": updated_symptoms,
        "questions_asked": updated_questions,
        "turn_count": state["turn_count"] + 1,
        "response_text": next_question,
        "response_type": "question",
    }