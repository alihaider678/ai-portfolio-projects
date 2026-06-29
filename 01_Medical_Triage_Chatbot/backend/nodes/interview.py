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

HANDLING SPECIAL MESSAGES — read carefully:

If the patient asks "who are you", "what are you", "what is your name", "what can you do", or similar identity questions:
  → Answer briefly in next_question, then redirect to symptoms.
  → Example: "I'm MediTriage, an AI medical triage assistant. I conduct a short structured interview about your symptoms and then classify your situation as Emergency, Urgent, or Routine care. I'm not a replacement for a real doctor — but I can help you understand how quickly you should seek care. Now, what symptom or concern brings you here today?"

If the patient asks "what information do you have", "what conditions do you know about", or similar knowledge questions:
  → Answer briefly: you have a medical knowledge base covering emergency conditions (cardiac, stroke, anaphylaxis, respiratory, trauma), urgent conditions (high fever, UTI, ear infection, hypertension, severe headache), and routine conditions (cold/flu, minor injury, mild headache, skin rash, back pain). Then redirect.

If the patient sends a completely irrelevant message (jokes, random text, non-medical topics):
  → Politely acknowledge and redirect. Example: "I'm only able to help with medical triage. Could you tell me what symptom or health concern brings you here today?"

Rules:
- Extract ALL symptom information mentioned in the patient's latest message
- Ask exactly ONE question per response (or give a brief answer + one question for special cases above)
- Keep your tone calm, professional, and empathetic
- Do not repeat a question already asked
- Do not diagnose or give medical advice — only collect information

Respond with ONLY valid JSON, no extra text:
{{
  "extracted_symptoms": {{}},
  "next_question": "Your response here (answer + redirect question if off-topic, or next symptom question if on-topic)"
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