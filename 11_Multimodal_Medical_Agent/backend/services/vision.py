import base64
from openai import AsyncOpenAI


SYSTEM_PROMPT = """You are a clinical pharmacist AI. Your task is to read handwritten or printed
prescriptions from images. Extract ALL medications with their dosages, frequencies, and routes
of administration. Return a structured JSON response ONLY.

Format:
{
  "medications": [
    {"name": "drug name", "dosage": "amount + unit", "frequency": "how often", "route": "oral/IV/etc"},
    ...
  ],
  "prescriber": "doctor name if visible",
  "patient_name": "patient name if visible",
  "notes": "any special instructions",
  "confidence": 0.0-1.0
}

If text is illegible, set confidence lower and note it."""


async def read_prescription_image(image_bytes: bytes, openai_api_key: str) -> dict:
    client = AsyncOpenAI(api_key=openai_api_key)
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    response = await client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "high"},
                    },
                    {"type": "text", "text": "Extract all medications from this prescription."},
                ],
            },
        ],
        max_tokens=1000,
    )
    import json
    return json.loads(response.choices[0].message.content)


async def describe_image(image_bytes: bytes, openai_api_key: str, context: str = "") -> str:
    """Generate a text description of a medical procedure image for RAG indexing."""
    client = AsyncOpenAI(api_key=openai_api_key)
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = f"Describe this medical procedure image in detail for a clinical knowledge base. {context}"
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                    {"type": "text", "text": prompt},
                ],
            }
        ],
        max_tokens=400,
    )
    return response.choices[0].message.content