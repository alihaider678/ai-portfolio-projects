from openai import AsyncOpenAI


async def transcribe_audio(audio_bytes: bytes, filename: str, openai_api_key: str) -> str:
    """Transcribe voice audio using OpenAI Whisper."""
    client = AsyncOpenAI(api_key=openai_api_key)

    # Whisper expects a file-like object with a name attribute
    import io
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="en",
        prompt="Medical prescription with drug names and dosages.",
    )
    return transcript.text


async def extract_drugs_from_text(text: str, openai_api_key: str) -> dict:
    """Parse transcribed prescription text into structured drug data."""
    import json
    client = AsyncOpenAI(api_key=openai_api_key)

    response = await client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Extract medications from the transcribed prescription text. "
                    "Return JSON: {\"medications\": [{\"name\": str, \"dosage\": str, "
                    "\"frequency\": str, \"route\": str}], \"notes\": str, \"confidence\": float}"
                ),
            },
            {"role": "user", "content": f"Prescription text: {text}"},
        ],
        max_tokens=600,
    )
    return json.loads(response.choices[0].message.content)