"""
Generate 3 realistic sample prescription images for testing the Prescription Reader.
Run: python scripts/generate_sample_prescriptions.py

Output -> data/sample_prescriptions/
  1. rx_printed_clinic.png     (typed clinic Rx pad)   Warfarin + Aspirin  -> HIGH bleeding risk
  2. rx_handwritten.png        (doctor's handwriting)  Lisinopril + Spironolactone + Ibuprofen
  3. rx_hospital_discharge.png (EHR discharge list)    Simvastatin + Clarithromycin + Amlodipine

Each uses well-known drugs so Project 02's interaction API returns meaningful results.
"""
from __future__ import annotations

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import matplotlib

OUTPUT_DIR = Path(__file__).parent.parent / "data" / "sample_prescriptions"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

WINF = Path(r"C:\Windows\Fonts")
DEJAVU = Path(matplotlib.__file__).parent / "mpl-data" / "fonts" / "ttf"

# Colours
TEAL = (8, 145, 178)
DARK = (15, 23, 42)
GRAY = (100, 116, 139)
LIGHT_GRAY = (226, 232, 240)
INK = (23, 37, 84)      # dark blue pen
RED = (190, 30, 45)


def _font(candidates: list[Path], size: int) -> ImageFont.FreeTypeFont:
    for p in candidates:
        try:
            return ImageFont.truetype(str(p), size)
        except Exception:
            continue
    return ImageFont.load_default()


def sans(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    win = WINF / ("arialbd.ttf" if bold else "arial.ttf")
    dv = DEJAVU / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
    return _font([win, dv], size)


def serif(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    win = WINF / ("timesbd.ttf" if bold else "times.ttf")
    dv = DEJAVU / ("DejaVuSerif-Bold.ttf" if bold else "DejaVuSerif.ttf")
    return _font([win, dv], size)


def handwriting(size: int) -> ImageFont.FreeTypeFont:
    # Windows handwriting fonts, then a script fallback
    return _font([
        WINF / "Inkfree.ttf",
        WINF / "segoesc.ttf",
        WINF / "segoescb.ttf",
        WINF / "comic.ttf",
        DEJAVU / "DejaVuSans.ttf",
    ], size)


# ── 1. Printed clinic prescription ───────────────────────────────────────────
def printed_clinic() -> Path:
    W, H = 1000, 1400
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, W, 12], fill=TEAL)
    d.rectangle([20, 20, W - 20, H - 20], outline=LIGHT_GRAY, width=2)

    # Letterhead
    d.text((60, 45), "Riverside Family Medical Center", font=sans(38, bold=True), fill=DARK)
    d.text((60, 95), "1420 Oakwood Avenue, Suite 210  ·  Springfield, IL 62704", font=sans(20), fill=GRAY)
    d.text((60, 122), "Tel: (217) 555-0184   ·   Fax: (217) 555-0185", font=sans(20), fill=GRAY)
    d.line([60, 165, W - 60, 165], fill=TEAL, width=2)

    # Prescriber
    d.text((60, 185), "Dr. Sarah Mitchell, M.D.", font=sans(24, bold=True), fill=DARK)
    d.text((60, 218), "Internal Medicine   ·   NPI: 1487560923   ·   DEA: BM4820156", font=sans(18), fill=GRAY)

    # Patient block
    d.rectangle([60, 265, W - 60, 365], outline=LIGHT_GRAY, width=2)
    d.text((80, 282), "Patient:  John Anderson", font=sans(22), fill=DARK)
    d.text((80, 320), "DOB:  03/14/1958        Weight: 82 kg", font=sans(20), fill=DARK)
    d.text((620, 282), "Date:  06/12/2025", font=sans(22), fill=DARK)
    d.text((620, 320), "Chart #: 44821", font=sans(20), fill=DARK)

    # Rx symbol
    d.text((60, 400), "℞", font=serif(80, bold=True), fill=DARK)

    # Medications
    y = 430
    meds = [
        ("Warfarin  5 mg tablet", "Sig: Take 1 tablet by mouth once daily in the evening.",
         "Disp: #30 (thirty)      Refills: 2"),
        ("Aspirin  81 mg tablet", "Sig: Take 1 tablet by mouth once daily with food.",
         "Disp: #90 (ninety)      Refills: 3"),
    ]
    for name, sig, disp in meds:
        d.text((170, y), name, font=sans(28, bold=True), fill=DARK)
        d.text((170, y + 42), sig, font=sans(22), fill=(40, 55, 80))
        d.text((170, y + 74), disp, font=sans(20), fill=GRAY)
        d.line([170, y + 118, W - 80, y + 118], fill=LIGHT_GRAY, width=1)
        y += 150

    # Signature
    d.line([560, 900, W - 80, 900], fill=DARK, width=2)
    d.text((560, 910), "Prescriber Signature", font=sans(18), fill=GRAY)
    d.text((560, 850), "S. Mitchell, MD", font=handwriting(40), fill=INK)

    d.text((80, 900), "☐  Dispense as written", font=sans(20), fill=DARK)
    d.text((80, 935), "☑  Substitution permitted", font=sans(20), fill=DARK)

    d.line([60, 1300, W - 60, 1300], fill=LIGHT_GRAY, width=1)
    d.text((60, 1315), "This prescription is not valid without a signature. Confidential medical document.",
           font=sans(16), fill=GRAY)

    path = OUTPUT_DIR / "rx_printed_clinic.png"
    img.save(path, "PNG")
    print(f"Created: {path}")
    return path


# ── 2. Handwritten prescription ──────────────────────────────────────────────
def handwritten() -> Path:
    W, H = 1000, 1300
    img = Image.new("RGB", (W, H), (253, 252, 247))  # slightly cream paper
    d = ImageDraw.Draw(img)

    d.rectangle([15, 15, W - 15, H - 15], outline=(210, 205, 190), width=2)

    # Pre-printed pad header
    d.text((55, 45), "LAKESIDE MEDICAL GROUP", font=sans(30, bold=True), fill=DARK)
    d.text((55, 88), "Dr. Robert Chen, M.D.   ·   Family Practice", font=sans(20), fill=GRAY)
    d.text((55, 115), "88 Harbor Road, Portland, OR 97201   ·   (503) 555-0142", font=sans(18), fill=GRAY)
    d.line([55, 155, W - 55, 155], fill=(180, 175, 160), width=2)

    # Patient / date (printed labels, handwritten answers)
    hw = handwriting(38)
    hw_sm = handwriting(34)
    d.text((55, 180), "Patient:", font=sans(22), fill=DARK)
    d.text((190, 172), "Margaret Wilson", font=hw, fill=INK)
    d.text((640, 180), "Date:", font=sans(22), fill=DARK)
    d.text((720, 172), "6 / 12 / 25", font=hw, fill=INK)
    d.text((55, 232), "Age:", font=sans(22), fill=DARK)
    d.text((140, 224), "67", font=hw, fill=INK)
    d.line([55, 285, W - 55, 285], fill=(200, 195, 180), width=1)

    # Rx symbol
    d.text((55, 315), "℞", font=serif(76, bold=True), fill=INK)

    # Handwritten medication lines
    y = 340
    lines = [
        "Lisinopril 10 mg",
        "   1 tab PO daily",
        "",
        "Spironolactone 25 mg",
        "   1 tab PO daily",
        "",
        "Ibuprofen 400 mg",
        "   1 tab PO q8h PRN pain",
    ]
    for ln in lines:
        if ln.strip():
            d.text((165, y), ln, font=hw_sm, fill=INK)
        y += 52

    # Refill + signature (handwritten)
    d.text((165, y + 20), "Refills x 1", font=hw_sm, fill=INK)
    d.line([560, 1150, W - 70, 1150], fill=DARK, width=2)
    d.text((575, 1085), "R. Chen", font=handwriting(52), fill=INK)
    d.text((560, 1160), "Physician Signature", font=sans(18), fill=GRAY)

    path = OUTPUT_DIR / "rx_handwritten.png"
    img.save(path, "PNG")
    print(f"Created: {path}")
    return path


# ── 3. Hospital discharge medication list ────────────────────────────────────
def hospital_discharge() -> Path:
    W, H = 1100, 1300
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)

    # Header band
    d.rectangle([0, 0, W, 110], fill=DARK)
    d.text((40, 24), "METRO GENERAL HOSPITAL", font=sans(34, bold=True), fill="white")
    d.text((40, 70), "Discharge Medication Reconciliation", font=sans(22), fill=(150, 200, 220))
    d.text((760, 34), "Page 1 of 1", font=sans(20), fill=(150, 200, 220))

    # Patient info bar
    d.rectangle([40, 135, W - 40, 245], fill=(241, 245, 249), outline=LIGHT_GRAY, width=2)
    d.text((60, 152), "Patient: David Thompson", font=sans(22, bold=True), fill=DARK)
    d.text((60, 190), "MRN: 007734512      DOB: 09/22/1961      Sex: M", font=sans(19), fill=(40, 55, 80))
    d.text((640, 152), "Admit: 06/05/2025", font=sans(19), fill=DARK)
    d.text((640, 190), "Discharge: 06/12/2025", font=sans(19), fill=DARK)

    d.text((40, 275), "CURRENT MEDICATIONS AT DISCHARGE", font=sans(24, bold=True), fill=TEAL)

    # Table header
    cols = [("Medication", 60), ("Dose", 430), ("Frequency", 600), ("Route", 940)]
    d.rectangle([40, 320, W - 40, 368], fill=TEAL)
    for label, x in cols:
        d.text((x, 332), label, font=sans(20, bold=True), fill="white")

    rows = [
        ("Simvastatin", "40 mg", "Once daily at bedtime", "Oral"),
        ("Clarithromycin", "500 mg", "Twice daily x 7 days", "Oral"),
        ("Amlodipine", "5 mg", "Once daily", "Oral"),
        ("Metformin", "1000 mg", "Twice daily with meals", "Oral"),
    ]
    y = 368
    for i, (name, dose, freq, route) in enumerate(rows):
        bg = (248, 250, 252) if i % 2 == 0 else "white"
        d.rectangle([40, y, W - 40, y + 70], fill=bg, outline=LIGHT_GRAY, width=1)
        d.text((60, y + 22), name, font=sans(22, bold=True), fill=DARK)
        d.text((430, y + 22), dose, font=sans(20), fill=(40, 55, 80))
        d.text((600, y + 22), freq, font=sans(20), fill=(40, 55, 80))
        d.text((940, y + 22), route, font=sans(20), fill=(40, 55, 80))
        y += 70

    # Instructions
    y += 40
    d.text((40, y), "Discharge Instructions:", font=sans(22, bold=True), fill=DARK)
    d.text((40, y + 40),
           "Continue all medications as listed. Complete the full course of Clarithromycin.",
           font=sans(20), fill=(40, 55, 80))
    d.text((40, y + 74),
           "Follow up with primary care physician within 7 days.",
           font=sans(20), fill=(40, 55, 80))

    # Footer
    d.line([40, H - 130, W - 40, H - 130], fill=LIGHT_GRAY, width=1)
    d.text((40, H - 110), "Attending Physician: Dr. Elena Vasquez, M.D.", font=sans(20), fill=DARK)
    d.text((40, H - 75), "Electronically signed 06/12/2025 14:32   ·   Metro General EHR System",
           font=sans(17), fill=GRAY)

    path = OUTPUT_DIR / "rx_hospital_discharge.png"
    img.save(path, "PNG")
    print(f"Created: {path}")
    return path


if __name__ == "__main__":
    printed_clinic()
    handwritten()
    hospital_discharge()
    print("\nAll sample prescriptions generated.")
    print(f"Location: {OUTPUT_DIR}")