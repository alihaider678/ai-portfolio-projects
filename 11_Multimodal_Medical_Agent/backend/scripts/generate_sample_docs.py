"""
Generate synthetic medical procedure PDFs for the RAG knowledge base.
Run once before first use: python scripts/generate_sample_docs.py

Creates 3 PDFs in data/sample_docs/:
  - insulin_injection_procedure.pdf   (7 steps)
  - blood_pressure_measurement.pdf    (5 steps)
  - wound_dressing_change.pdf         (6 steps)
"""
import os
import sys
from pathlib import Path

# Allow running from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io

from diagrams import render_diagram, FIGSIZE


OUTPUT_DIR = Path(__file__).parent.parent / "data" / "sample_docs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = A4

BRAND_BLUE = colors.HexColor("#0891B2")
BRAND_DARK = colors.HexColor("#0c1a2e")
LIGHT_BG = colors.HexColor("#f0f9ff")


# Aspect ratio of the matplotlib diagrams (width / height)
_IMG_W_CM = 15.0
_IMG_H_CM = _IMG_W_CM * (FIGSIZE[1] / FIGSIZE[0])


def build_pdf(filename: str, title: str, subtitle: str, steps: list[dict]):
    path = OUTPUT_DIR / filename
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("Title", parent=styles["Title"], textColor=BRAND_DARK, fontSize=22, spaceAfter=6)
    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], textColor=BRAND_BLUE, fontSize=12, spaceAfter=16)
    step_title_style = ParagraphStyle("StepTitle", parent=styles["Heading2"], textColor=BRAND_DARK, fontSize=14, spaceBefore=12, spaceAfter=4)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, leading=14, spaceAfter=8)
    warn_style = ParagraphStyle("Warn", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#dc2626"), spaceAfter=8)
    note_style = ParagraphStyle("Note", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#6b7280"), spaceAfter=12)

    story = []
    story.append(Paragraph(title, title_style))
    story.append(Paragraph(subtitle, subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE, spaceAfter=16))

    for i, step in enumerate(steps, 1):
        # Step diagram (real medical schematic via matplotlib)
        img_bytes = render_diagram(step["diagram"])
        img_buf = io.BytesIO(img_bytes)
        story.append(RLImage(img_buf, width=_IMG_W_CM*cm, height=_IMG_H_CM*cm))
        story.append(Spacer(1, 4))

        story.append(Paragraph(f"Step {i}: {step['title']}", step_title_style))
        story.append(Paragraph(step["instruction"], body_style))

        if step.get("warning"):
            story.append(Paragraph(f"⚠ {step['warning']}", warn_style))
        if step.get("note"):
            story.append(Paragraph(f"Note: {step['note']}", note_style))
        story.append(Spacer(1, 8))

    doc.build(story)
    print(f"Created: {path}")
    return path


# ─── Document 1: Insulin Injection Procedure ───────────────────────────────────
INSULIN_STEPS = [
    {
        "title": "Gather Supplies",
        "diagram": "insulin_supplies",
        "instruction": "Collect insulin vial or pen, appropriate syringe or pen needle (4–8mm), alcohol swabs, sharps container, and clean gloves. Verify the insulin type, concentration (U-100 or U-500), and expiration date.",
        "warning": "Never use expired insulin or cloudy rapid-acting insulin (except NPH which is normally cloudy).",
        "note": "Wash hands thoroughly with soap and water for at least 20 seconds before beginning.",
    },
    {
        "title": "Prepare the Insulin",
        "diagram": "insulin_prepare",
        "instruction": "For cloudy insulins (NPH, premixed), gently roll the vial between palms 10 times — do NOT shake. For clear insulins, inspect for particles. If using a vial, wipe the rubber stopper with an alcohol swab and let it dry for 15–30 seconds.",
        "note": "If mixing insulins, always draw clear (rapid-acting) before cloudy (intermediate-acting) — 'clear before cloudy'.",
    },
    {
        "title": "Draw Up the Dose",
        "diagram": "insulin_draw_dose",
        "instruction": "Pull back the plunger to the prescribed number of units to draw air into the syringe. Insert the needle into the vial and push the air in. Invert the vial and draw back slightly more than the required dose. Remove air bubbles by tapping the syringe and pushing excess back into vial. Confirm the exact dose.",
        "warning": "Double-check dose with a second nurse if administering to a hospitalized patient (per facility policy).",
    },
    {
        "title": "Select and Prepare Injection Site",
        "diagram": "insulin_sites",
        "instruction": "Rotate injection sites systematically. Preferred sites: abdomen (fastest absorption, 2 inches from navel), outer thigh, upper outer arm, upper buttocks. Clean the site with an alcohol swab in a circular motion and allow to air-dry completely (10–30 seconds) — injecting into wet skin stings and may affect absorption.",
        "note": "Abdomen has the most consistent absorption rate and is preferred for meal-time insulin.",
    },
    {
        "title": "Administer the Injection",
        "diagram": "insulin_angle",
        "instruction": "Pinch a fold of skin (if using a longer needle or patient has little subcutaneous fat). Insert needle at 90° angle (45° for thin patients with short needles). Release skin fold. Inject insulin slowly and steadily. Hold for 10 seconds before withdrawing to prevent leakage.",
        "warning": "Do not inject into lumpy, scarred, or inflamed tissue — absorption will be erratic.",
    },
    {
        "title": "Withdraw and Apply Pressure",
        "diagram": "insulin_withdraw",
        "instruction": "Withdraw the needle at the same angle it was inserted. Apply gentle pressure with a clean cotton ball or gauze — do NOT rub (rubbing accelerates absorption unpredictably). If there is minor bleeding, hold pressure for 1–2 minutes.",
    },
    {
        "title": "Dispose and Document",
        "diagram": "insulin_dispose",
        "instruction": "Immediately dispose of the needle and syringe in an approved sharps container — never recap needles. Document the dose administered, time, injection site used, and patient's blood glucose reading. Schedule the next site for rotation.",
        "warning": "Needles must NEVER be recapped, bent, or placed in regular trash — risk of needlestick injury.",
        "note": "Monitor patient for hypoglycemia (rapid-acting insulin peaks in 1–3 hours).",
    },
]

# ─── Document 2: Blood Pressure Measurement ────────────────────────────────────
BP_STEPS = [
    {
        "title": "Prepare the Patient",
        "diagram": "bp_prepare",
        "instruction": "Have the patient rest seated for at least 5 minutes before measurement. Legs should be uncrossed, feet flat on the floor, back supported. Ask the patient to avoid talking, caffeine, smoking, or exercise for 30 minutes prior. Ensure the patient has an empty bladder.",
        "note": "Anxiety and pain can temporarily raise blood pressure by 10–40 mmHg.",
    },
    {
        "title": "Select the Correct Cuff Size",
        "diagram": "bp_cuff_size",
        "instruction": "Measure arm circumference at mid-point between shoulder and elbow. Cuff bladder should encircle 80% of arm circumference. Use: small adult (22–26cm), adult (27–34cm), large adult (35–44cm), thigh cuff (45–52cm). An undersized cuff gives falsely high readings; oversized gives falsely low readings.",
        "warning": "Using wrong cuff size is one of the most common sources of blood pressure measurement error.",
    },
    {
        "title": "Position the Cuff and Stethoscope",
        "diagram": "bp_position",
        "instruction": "Place the cuff on bare skin (not over clothing). Cuff lower edge should be 2–3 cm above the antecubital fossa (elbow crease). The artery marker on the cuff should align over the brachial artery. Place the stethoscope bell (not diaphragm) directly over the brachial artery without going under the cuff. Support the arm at heart level.",
    },
    {
        "title": "Inflate and Deflate",
        "diagram": "bp_korotkoff",
        "instruction": "Inflate cuff rapidly to 20–30 mmHg above expected systolic pressure (or 160 mmHg if unknown). Deflate at 2–3 mmHg per second. Listen for Korotkoff sounds: Phase I (first sound heard) = systolic pressure. Phase V (sounds disappear) = diastolic pressure. Record to nearest 2 mmHg.",
        "note": "If you miss the reading, fully deflate for 1–2 minutes before re-inflating.",
    },
    {
        "title": "Record and Interpret",
        "diagram": "bp_categories",
        "instruction": "Record both readings immediately. For new patients, measure both arms — use the higher reading arm for future measurements. Take two readings 1–2 minutes apart and average them. Normal: <120/80 mmHg. Elevated: 120–129/<80. Stage 1 HTN: 130–139/80–89. Stage 2 HTN: ≥140/≥90. Hypertensive crisis: >180/120.",
        "warning": "BP >180/120 mmHg with symptoms (chest pain, shortness of breath, neurological changes) = hypertensive emergency — call physician immediately.",
    },
]

# ─── Document 3: Wound Dressing Change ─────────────────────────────────────────
WOUND_STEPS = [
    {
        "title": "Assess and Gather Equipment",
        "diagram": "wound_equipment",
        "instruction": "Review the wound care order and last dressing change notes. Gather: sterile gloves, clean gloves, wound cleansing solution (normal saline or prescribed solution), appropriate dressing (gauze, foam, hydrocolloid, alginate per wound type), tape or bandage, wound measurement tools, and a waste bag. Perform hand hygiene.",
    },
    {
        "title": "Remove the Old Dressing",
        "diagram": "wound_remove",
        "instruction": "Don clean gloves. Loosen tape edges carefully — use adhesive remover for skin-friendly removal if needed. Remove the old dressing gently, peeling back parallel to the skin rather than pulling upward. Note drainage amount, color, odor, and consistency. Place soiled dressing in waste bag. Remove gloves and perform hand hygiene.",
        "warning": "Do not forcibly remove adherent dressings — moisten with saline first to prevent trauma to fragile wound bed.",
    },
    {
        "title": "Assess the Wound",
        "diagram": "wound_assess",
        "instruction": "Using sterile technique, assess: wound dimensions (length × width × depth in cm), wound bed color (red = healthy granulation, yellow = slough, black = necrosis), wound edges (undermining, tunneling), periwound skin condition, exudate level and type. Document all findings.",
        "note": "Measure wound using clock face orientation — 12 o'clock = toward head, 6 o'clock = toward feet.",
    },
    {
        "title": "Cleanse the Wound",
        "diagram": "wound_cleanse",
        "instruction": "Use prescribed solution (normal saline is most common). Irrigate with gentle pressure (5–8 psi) using a 30–35mL syringe with an 18–19 gauge angiocatheter, or use a commercial wound cleanser. Cleanse from cleanest to dirtiest area in a circular motion moving outward. Pat dry the surrounding skin gently.",
        "warning": "Do not use hydrogen peroxide or povidone-iodine on open wounds routinely — they are cytotoxic to granulation tissue.",
    },
    {
        "title": "Apply the New Dressing",
        "diagram": "wound_dressing_layers",
        "instruction": "Select dressing appropriate to wound stage: dry wounds → moisture-retentive (hydrogel), wet wounds → absorptive (foam/alginate), infected → antimicrobial (silver). Apply primary dressing directly to wound bed without stretching. Apply secondary dressing if needed. Secure with tape on all edges, avoiding circumferential taping.",
        "note": "Leave dressing in place per order frequency — changing too often disrupts wound healing environment.",
    },
    {
        "title": "Document and Educate",
        "diagram": "wound_document",
        "instruction": "Document: date and time, wound measurements and assessment findings, cleansing solution and technique used, dressing type and materials applied, patient tolerance, next scheduled change. Educate patient on signs of infection (increased pain, redness, warmth, purulent discharge, fever) and when to seek immediate care.",
    },
]


if __name__ == "__main__":
    build_pdf(
        "insulin_injection_procedure.pdf",
        "Insulin Injection Procedure",
        "Standard operating procedure for safe subcutaneous insulin administration",
        INSULIN_STEPS,
    )
    build_pdf(
        "blood_pressure_measurement.pdf",
        "Blood Pressure Measurement Guide",
        "Evidence-based protocol for accurate non-invasive blood pressure measurement",
        BP_STEPS,
    )
    build_pdf(
        "wound_dressing_change.pdf",
        "Wound Dressing Change Procedure",
        "Clinical protocol for wound assessment and dressing change",
        WOUND_STEPS,
    )
    print("\nAll sample documents generated successfully.")
    print(f"Location: {OUTPUT_DIR}")