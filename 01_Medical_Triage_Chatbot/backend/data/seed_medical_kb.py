"""
Medical knowledge base — seeded into ChromaDB on startup.
Content is structured around triage categories: emergency, urgent, routine.
ChromaDB uses its default all-MiniLM-L6-v2 embeddings (downloaded once, local).
"""

import logging

import chromadb

from config import settings

logger = logging.getLogger(__name__)

# Module-level singleton so the collection survives across requests
_client: chromadb.Client | None = None
_collection: chromadb.Collection | None = None

MEDICAL_DOCUMENTS = [
    # ── EMERGENCY CONDITIONS ───────────────────────────────────────────────────
    {
        "id": "em_cardiac",
        "text": (
            "EMERGENCY — CARDIAC EVENT. "
            "Symptoms: chest pain or pressure, shortness of breath, pain radiating to arm or jaw, "
            "sweating, nausea, palpitations, dizziness. Especially dangerous when multiple symptoms "
            "occur together or with a history of heart disease. Possible conditions: myocardial "
            "infarction (heart attack), unstable angina, aortic dissection. "
            "Action: Call 911 immediately. Do not drive. Chew 325mg aspirin if not allergic. "
            "Stay calm and sit down. Severity 7–10 with shortness of breath = automatic emergency."
        ),
        "category": "emergency",
    },
    {
        "id": "em_stroke",
        "text": (
            "EMERGENCY — STROKE. "
            "Use FAST criteria: Face drooping (one side of face droops or is numb), "
            "Arm weakness (one arm drifts downward), Speech difficulty (slurred or strange speech), "
            "Time to call 911. Additional signs: sudden severe headache described as 'worst headache of my life', "
            "sudden vision loss in one eye, sudden loss of balance or coordination, sudden confusion. "
            "Possible conditions: ischemic stroke, hemorrhagic stroke, TIA (mini-stroke). "
            "Action: Call 911 immediately. Note the time symptoms started. Do not give food or water. "
            "Every minute counts — brain cells die rapidly without blood flow."
        ),
        "category": "emergency",
    },
    {
        "id": "em_anaphylaxis",
        "text": (
            "EMERGENCY — SEVERE ALLERGIC REACTION (ANAPHYLAXIS). "
            "Symptoms: throat swelling or tightening, difficulty breathing, wheezing, hives spreading "
            "rapidly, facial swelling, drop in blood pressure, dizziness or fainting, after exposure "
            "to allergen (food, bee sting, medication). "
            "Possible conditions: anaphylactic shock. "
            "Action: Use epinephrine auto-injector (EpiPen) if available. Call 911 immediately. "
            "Lay patient flat with legs elevated unless breathing is difficult. "
            "Do not stand up. Second dose of epinephrine may be needed after 5–15 minutes."
        ),
        "category": "emergency",
    },
    {
        "id": "em_respiratory",
        "text": (
            "EMERGENCY — SEVERE RESPIRATORY DISTRESS. "
            "Symptoms: unable to speak in full sentences due to breathlessness, blue or gray lips or "
            "fingernails (cyanosis), breathing rate >30 per minute, use of neck or abdominal muscles "
            "to breathe, severe asthma attack not responding to inhaler. "
            "Possible conditions: status asthmaticus, pulmonary embolism, pneumothorax, COPD exacerbation, "
            "severe pneumonia. "
            "Action: Call 911. Sit patient upright. Administer rescue inhaler if asthma. "
            "Do not lay flat. Loosen tight clothing. Provide supplemental oxygen if available."
        ),
        "category": "emergency",
    },
    {
        "id": "em_head_trauma",
        "text": (
            "EMERGENCY — SEVERE HEAD INJURY. "
            "Symptoms: loss of consciousness (even brief), confusion or disorientation after head impact, "
            "repeated vomiting after head injury, one pupil larger than the other, seizure after head injury, "
            "clear fluid from nose or ears, severe headache after head trauma, inability to recognize people. "
            "Possible conditions: traumatic brain injury, intracranial hemorrhage, skull fracture, concussion. "
            "Action: Call 911. Do not move patient if spinal injury suspected. Keep patient still and awake. "
            "Do not give pain medications. Monitor breathing constantly."
        ),
        "category": "emergency",
    },
    {
        "id": "em_meningitis",
        "text": (
            "EMERGENCY — MENINGITIS / SEPSIS. "
            "Symptoms: high fever (>103°F/39.4°C) combined with severe neck stiffness (cannot touch "
            "chin to chest), intense headache, sensitivity to light (photophobia), non-blanching rash "
            "(rash does not fade when pressed with a glass), altered consciousness, rapid heart rate. "
            "Possible conditions: bacterial meningitis, viral meningitis, septicemia. "
            "Action: Call 911 immediately. Bacterial meningitis can be fatal within hours. "
            "Do not wait to see if symptoms improve. This is a true medical emergency."
        ),
        "category": "emergency",
    },
    {
        "id": "em_severe_abdominal",
        "text": (
            "EMERGENCY — SEVERE ABDOMINAL PAIN. "
            "Symptoms: sudden severe abdominal pain rated 8–10/10, rigid or board-like abdomen, "
            "pain that started suddenly and is constant and worsening, pain in lower right quadrant "
            "with fever (possible appendicitis), abdominal pain after abdominal surgery or injury. "
            "Possible conditions: appendicitis (ruptured), perforated ulcer, bowel obstruction, "
            "ectopic pregnancy (women), internal bleeding. "
            "Action: Call 911 or go to ER immediately. Do not eat or drink. Do not apply heat. "
            "Ruptured appendix can cause life-threatening peritonitis within hours."
        ),
        "category": "emergency",
    },
    {
        "id": "em_overdose",
        "text": (
            "EMERGENCY — OVERDOSE OR POISONING. "
            "Symptoms: unresponsive or unconscious, slow or stopped breathing, blue lips, "
            "pinpoint or very large pupils, seizures, extreme confusion, after known or suspected "
            "ingestion of medication, drugs, or toxic substance. "
            "Possible conditions: opioid overdose, benzodiazepine overdose, medication toxicity. "
            "Action: Call 911 immediately. If opioid overdose suspected and naloxone (Narcan) "
            "is available, administer it. Place patient in recovery position if unconscious but breathing. "
            "Begin CPR if not breathing. Do not leave patient alone."
        ),
        "category": "emergency",
    },

    # ── URGENT CONDITIONS ──────────────────────────────────────────────────────
    {
        "id": "ur_high_fever",
        "text": (
            "URGENT — HIGH FEVER. "
            "Symptoms: fever 101–103°F (38.3–39.4°C) lasting more than 3 days in adults, "
            "fever with rash (non-meningitis), fever with severe sore throat, fever with ear pain. "
            "Fever without neck stiffness or altered consciousness. "
            "Possible conditions: bacterial infection, severe viral infection, influenza, pneumonia. "
            "Action: See a doctor today or visit urgent care. Take acetaminophen or ibuprofen for comfort. "
            "Stay hydrated. Monitor for worsening symptoms (stiff neck, confusion, rash = escalate to emergency)."
        ),
        "category": "urgent",
    },
    {
        "id": "ur_uti",
        "text": (
            "URGENT — URINARY TRACT INFECTION (UTI). "
            "Symptoms: burning or pain with urination, frequent urge to urinate, cloudy or foul-smelling urine, "
            "pelvic pressure (women), lower abdominal discomfort. If fever, chills, back/flank pain are present "
            "(suggests kidney infection = pyelonephritis, more urgent). "
            "Possible conditions: cystitis (bladder infection), urethritis, pyelonephritis. "
            "Action: See a doctor today — antibiotics required. Drink plenty of water. "
            "Avoid cranberry juice as primary treatment. If fever or back pain: go to urgent care or ER."
        ),
        "category": "urgent",
    },
    {
        "id": "ur_ear_infection",
        "text": (
            "URGENT — SEVERE EAR INFECTION. "
            "Symptoms: severe ear pain (rated 6–8/10), ear pain with fever, hearing loss, "
            "discharge from ear, ear pain lasting more than 2 days. "
            "Possible conditions: acute otitis media, otitis externa, mastoiditis. "
            "Action: See a doctor today. Pain management with ibuprofen or acetaminophen. "
            "Do not insert objects into ear canal. If pain behind ear or facial swelling: "
            "go to ER (possible mastoiditis)."
        ),
        "category": "urgent",
    },
    {
        "id": "ur_laceration",
        "text": (
            "URGENT — WOUND REQUIRING STITCHES. "
            "Symptoms: deep cut where wound edges cannot be held together, cut longer than 0.75 inches (2cm), "
            "cut on face, hand, or over a joint, wound with visible fat or deeper tissue, "
            "wound from animal or human bite, wound with contamination (dirt, rust). "
            "Possible conditions: laceration requiring closure, puncture wound, bite wound. "
            "Action: Apply firm pressure to stop bleeding. Do not remove embedded objects. "
            "Go to urgent care or ER within 6 hours. Tetanus booster may be needed."
        ),
        "category": "urgent",
    },
    {
        "id": "ur_hypertension",
        "text": (
            "URGENT — HYPERTENSIVE URGENCY. "
            "Symptoms: blood pressure >180/120 mmHg, severe headache, visual changes, "
            "chest discomfort, but NO organ damage symptoms (stroke, heart attack signs). "
            "Possible conditions: hypertensive urgency, medication non-compliance. "
            "Action: Go to urgent care or ER today. Do not take extra blood pressure medication "
            "without medical supervision. Sit quietly. Avoid stress and caffeine. "
            "If chest pain, shortness of breath, or neurological symptoms develop: call 911."
        ),
        "category": "urgent",
    },
    {
        "id": "ur_severe_headache",
        "text": (
            "URGENT — SEVERE HEADACHE. "
            "Symptoms: headache rated 7–8/10, throbbing or pulsating pain, sensitivity to light and sound, "
            "nausea with headache, lasting more than 4 hours despite pain medication. "
            "NOT the worst headache of life (that = emergency). "
            "Possible conditions: severe migraine, tension headache, cluster headache, sinusitis. "
            "Action: See a doctor today or urgent care. Take prescribed migraine medication. "
            "Rest in dark quiet room. Stay hydrated. If first severe headache of this type: "
            "go to ER to rule out serious cause."
        ),
        "category": "urgent",
    },
    {
        "id": "ur_moderate_abdominal",
        "text": (
            "URGENT — MODERATE ABDOMINAL PAIN. "
            "Symptoms: abdominal pain rated 4–7/10, pain in lower right or lower left abdomen, "
            "pain with nausea or vomiting but no rigidity, abdominal pain lasting more than 6 hours. "
            "Possible conditions: gastroenteritis, ovarian cyst (women), kidney stone, constipation, "
            "early appendicitis. "
            "Action: See a doctor today or go to urgent care. Avoid eating solid food. "
            "Monitor for escalating pain, fever, or rigid abdomen (= emergency)."
        ),
        "category": "urgent",
    },

    # ── ROUTINE CONDITIONS ─────────────────────────────────────────────────────
    {
        "id": "ro_cold_flu",
        "text": (
            "ROUTINE — COMMON COLD / MILD FLU. "
            "Symptoms: runny nose, nasal congestion, mild sore throat, mild cough, low-grade fever "
            "(<101°F/38.3°C), mild body aches, fatigue. Symptoms typically improve within 7–10 days. "
            "Possible conditions: rhinovirus (common cold), influenza (mild), upper respiratory infection. "
            "Action: Rest and stay hydrated. Over-the-counter symptom relief (decongestants, cough suppressants). "
            "Schedule a doctor appointment if symptoms worsen or persist beyond 10 days. "
            "Antiviral medications (e.g., Tamiflu) may be prescribed within 48 hours of flu onset."
        ),
        "category": "routine",
    },
    {
        "id": "ro_minor_injury",
        "text": (
            "ROUTINE — MINOR CUTS, BRUISES, AND SPRAINS. "
            "Symptoms: small cuts (under 0.75 inches, wound edges close easily), minor bruising, "
            "mild sprain with minimal swelling, no significant pain with movement. "
            "Possible conditions: minor laceration, contusion, mild sprain. "
            "Action: Clean wounds with soap and water. Apply pressure for 5–10 minutes. "
            "Use RICE for sprains (Rest, Ice, Compression, Elevation). "
            "Schedule doctor visit if no improvement in 3–5 days. Tetanus booster if wound is dirty "
            "and vaccination is not current."
        ),
        "category": "routine",
    },
    {
        "id": "ro_mild_headache",
        "text": (
            "ROUTINE — MILD HEADACHE. "
            "Symptoms: dull or aching headache rated 1–4/10, responds to over-the-counter pain relievers, "
            "no nausea or vomiting, no visual disturbances, no fever. "
            "Possible conditions: tension headache, dehydration headache, stress headache. "
            "Action: Take ibuprofen or acetaminophen. Rest in a quiet area. "
            "Drink 2–3 glasses of water. Reduce screen time. Schedule a doctor visit if headaches "
            "are recurring more than 3 times per week."
        ),
        "category": "routine",
    },
    {
        "id": "ro_gi_mild",
        "text": (
            "ROUTINE — MILD DIGESTIVE ISSUES. "
            "Symptoms: mild nausea without vomiting, constipation (no bowel movement 3+ days), "
            "mild diarrhea (less than 6 episodes/day, no blood), bloating, mild heartburn. "
            "Possible conditions: constipation, IBS flare, acid reflux (GERD), mild gastroenteritis. "
            "Action: Increase fluid intake, dietary fiber for constipation. Antacids for heartburn. "
            "BRAT diet for diarrhea (bananas, rice, applesauce, toast). "
            "Schedule doctor appointment if symptoms persist beyond 1 week. "
            "Seek urgent care if blood appears in stool or vomit."
        ),
        "category": "routine",
    },
    {
        "id": "ro_skin_rash",
        "text": (
            "ROUTINE — MINOR SKIN RASH. "
            "Symptoms: localized rash, not spreading, no difficulty breathing, no facial swelling, "
            "mild itching or redness, possible contact with irritant or new product. "
            "Possible conditions: contact dermatitis, eczema flare, heat rash, mild allergic reaction. "
            "Action: Avoid suspected irritant. Apply hydrocortisone cream for itching. "
            "Take antihistamine (e.g., Benadryl) if allergic cause suspected. "
            "Schedule doctor appointment if rash spreads, blisters, or does not improve in 5–7 days. "
            "If rash spreads rapidly or breathing is affected: escalate to emergency."
        ),
        "category": "routine",
    },
    {
        "id": "ro_back_pain",
        "text": (
            "ROUTINE — MILD TO MODERATE BACK PAIN. "
            "Symptoms: lower back pain rated 1–5/10, no radiation down legs, no numbness or tingling, "
            "no loss of bladder or bowel control, pain improves with rest or mild activity. "
            "Possible conditions: muscle strain, poor posture, mild disc irritation. "
            "Action: Apply ice for first 48 hours, then heat. Ibuprofen or naproxen for pain. "
            "Gentle stretching and walking. Avoid bed rest beyond 1–2 days. "
            "Schedule physical therapy if no improvement in 2 weeks. "
            "Seek urgent care if: radiating leg pain, numbness/weakness, or loss of bladder/bowel control."
        ),
        "category": "routine",
    },
]


def get_collection() -> chromadb.Collection:
    global _client, _collection
    if _collection is not None:
        return _collection
    _client = chromadb.Client()
    _collection = _client.get_or_create_collection(settings.chroma_collection)
    return _collection


def seed_if_empty() -> None:
    collection = get_collection()
    if collection.count() > 0:
        logger.info(f"Medical KB already loaded ({collection.count()} documents)")
        return

    collection.add(
        ids=[doc["id"] for doc in MEDICAL_DOCUMENTS],
        documents=[doc["text"] for doc in MEDICAL_DOCUMENTS],
        metadatas=[{"category": doc["category"]} for doc in MEDICAL_DOCUMENTS],
    )
    logger.info(f"Medical KB seeded with {len(MEDICAL_DOCUMENTS)} documents")