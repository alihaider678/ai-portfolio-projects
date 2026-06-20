ESCALATION_RESPONSE = """I completely understand your frustration, and I sincerely apologize for the experience you've had.

I'm escalating your case to a senior support specialist right now. They will reach out to you within the next 2 hours with a full resolution.

Your case ID is: {case_id}

Is there anything else I can note down for the specialist before they contact you?"""


def get_escalation_response(case_id: str) -> str:
    return ESCALATION_RESPONSE.format(case_id=case_id)


def should_escalate(sentiment: str, negative_count: int, threshold: int) -> bool:
    if sentiment == "frustrated":
        return True
    if sentiment == "negative" and negative_count >= threshold:
        return True
    return False
