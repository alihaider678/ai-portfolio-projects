"""
Capability 1 — Prescription Reader Agent

Flow:
  image input  → vision.read_prescription_image → extract drugs
  audio input  → whisper.transcribe_audio → whisper.extract_drugs_from_text → extract drugs
  → drug_checker.check_interactions (calls Project 02 API)
  → build summary text
  → tts.synthesize (OpenAI or ElevenLabs)
  → return structured result
"""
from services import vision, whisper, tts, drug_checker
from core.logger import get_logger

logger = get_logger("prescription_agent")


async def run(
    *,
    input_type: str,           # "image" | "audio"
    file_bytes: bytes,
    filename: str,
    tts_provider: str,         # "openai" | "elevenlabs"
    openai_api_key: str,
    elevenlabs_api_key: str | None,
    voice_id: str | None,
) -> dict:

    # ── Step 1: Extract medications ──────────────────────────────────────────
    if input_type == "image":
        logger.info("Reading prescription image with GPT-4o Vision")
        extraction = await vision.read_prescription_image(file_bytes, openai_api_key)
    else:
        logger.info("Transcribing audio with Whisper")
        transcript = await whisper.transcribe_audio(file_bytes, filename, openai_api_key)
        logger.info("Extracting drugs from transcript", transcript=transcript[:100])
        extraction = await whisper.extract_drugs_from_text(transcript, openai_api_key)
        extraction["transcript"] = transcript

    medications = extraction.get("medications", [])
    drug_names = [m["name"] for m in medications if m.get("name")]

    # ── Step 2: Drug interaction check (Project 02 API) ──────────────────────
    interaction_result = None
    if len(drug_names) >= 2:
        logger.info("Checking interactions", drugs=drug_names)
        try:
            interaction_result = await drug_checker.check_interactions(drug_names, openai_api_key)
        except Exception as e:
            logger.warning("Drug interaction check failed", error=str(e))
            interaction_result = {"error": str(e)}

    # ── Step 3: Build voice summary ───────────────────────────────────────────
    summary = _build_summary(medications, interaction_result)

    # ── Step 4: TTS ──────────────────────────────────────────────────────────
    logger.info("Synthesizing speech", provider=tts_provider)
    audio_bytes = await tts.synthesize(
        text=summary,
        provider=tts_provider,
        openai_api_key=openai_api_key,
        elevenlabs_api_key=elevenlabs_api_key,
        voice_id=voice_id,
    )

    return {
        "input_type": input_type,
        "extraction": extraction,
        "medications": medications,
        "drug_names": drug_names,
        "interaction_result": interaction_result,
        "summary_text": summary,
        "audio_b64": _bytes_to_b64(audio_bytes),
    }


def _build_summary(medications: list[dict], interaction_result: dict | None) -> str:
    if not medications:
        return "I could not identify any medications in the prescription. Please ensure the image is clear or re-record your voice input."

    drug_list = ", ".join(m["name"] for m in medications)
    parts = [f"I identified {len(medications)} medication{'s' if len(medications) > 1 else ''}: {drug_list}."]

    for med in medications:
        detail = med.get("name", "")
        if med.get("dosage"):
            detail += f", {med['dosage']}"
        if med.get("frequency"):
            detail += f", taken {med['frequency']}"
        parts.append(detail + ".")

    if interaction_result and "error" not in interaction_result:
        overall = interaction_result.get("overall_risk", "")
        if overall:
            parts.append(f"Drug interaction analysis: Overall risk is {overall}.")
        pairs = interaction_result.get("pair_results", [])
        severe = [p for p in pairs if p.get("severity", "").upper() in ("SEVERE", "HIGH", "CONTRAINDICATED")]
        if severe:
            parts.append(
                f"Warning: {len(severe)} severe interaction{'s' if len(severe) > 1 else ''} detected. "
                "Please consult a pharmacist or physician before dispensing."
            )
    elif interaction_result and "error" in interaction_result:
        parts.append("Drug interaction check could not be completed. Please verify interactions manually.")

    return " ".join(parts)


def _bytes_to_b64(b: bytes) -> str:
    import base64
    return base64.b64encode(b).decode("utf-8")