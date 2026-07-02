"""
Medical schematic diagram generator (matplotlib).

Each function draws a genuine, labeled clinical diagram and returns PNG bytes.
These are embedded into the sample procedure PDFs so the multimodal RAG has
real images (not decorative boxes) to describe and retrieve.
"""
from __future__ import annotations

import io
import matplotlib
matplotlib.use("Agg")  # headless
import matplotlib.pyplot as plt
from matplotlib.patches import (
    Rectangle, FancyBboxPatch, Circle, Wedge, Polygon, FancyArrowPatch, Ellipse,
)
import numpy as np

# ── Palette ────────────────────────────────────────────────────────────────
TEAL   = "#0891B2"
TEAL_L = "#67e8f9"
DARK   = "#0c1a2e"
LIGHT  = "#f0f9ff"
CARD   = "#e0f2fe"
RED    = "#dc2626"
AMBER  = "#f59e0b"
GREEN  = "#16a34a"
GRAY   = "#6b7280"
SKIN   = "#fcd9b6"
FAT    = "#fef3c7"
MUSCLE = "#fca5a5"

FIGSIZE = (8, 3.4)   # matches ~15cm x 6.4cm in the PDF
DPI = 150

plt.rcParams["font.family"] = "DejaVu Sans"


# ── Canvas helpers ───────────────────────────────────────────────────────────
def _canvas(xlim=100, ylim=42.5):
    fig, ax = plt.subplots(figsize=FIGSIZE, dpi=DPI)
    ax.set_xlim(0, xlim)
    ax.set_ylim(0, ylim)
    ax.set_aspect("auto")
    ax.axis("off")
    fig.patch.set_facecolor("white")
    return fig, ax


def _render(fig) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=DPI, bbox_inches="tight",
                pad_inches=0.12, facecolor="white")
    plt.close(fig)
    return buf.getvalue()


def _title(ax, text, x=50, y=39.5):
    ax.text(x, y, text, ha="center", va="center", fontsize=11.5,
            fontweight="bold", color=DARK)


def _panel(ax, x, y, w, h, fill=LIGHT, edge=TEAL, lw=1.5):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.15,rounding_size=1.2",
        facecolor=fill, edgecolor=edge, linewidth=lw))


def _arrow(ax, x1, y1, x2, y2, color=TEAL, lw=2.0, style="-|>", ms=14):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style,
                                 mutation_scale=ms, color=color, lw=lw))


def _badge(ax, x, y, n, r=2.6):
    ax.add_patch(Circle((x, y), r, facecolor=TEAL, edgecolor="none", zorder=5))
    ax.text(x, y, str(n), ha="center", va="center", color="white",
            fontsize=10, fontweight="bold", zorder=6)


# ── Reusable icons ─────────────────────────────────────────────────────────
def _syringe(ax, x, y, s=1.0, color=DARK):
    ax.add_patch(Rectangle((x, y), 16*s, 4*s, facecolor="white", edgecolor=color, lw=1.4))
    for i in range(1, 8):
        ax.plot([x+i*2*s, x+i*2*s], [y+4*s, y+3*s], color=color, lw=0.7)
    ax.add_patch(Rectangle((x-5*s, y+1.2*s), 5*s, 1.6*s, facecolor=color))
    ax.add_patch(Rectangle((x-6.5*s, y), 1.3*s, 4*s, facecolor=color))
    ax.plot([x+16*s, x+23*s], [y+2*s, y+2*s], color=color, lw=1.3)


def _vial(ax, x, y, s=1.0, cap=TEAL, label=None):
    ax.add_patch(Rectangle((x, y), 6*s, 12*s, facecolor="white", edgecolor=DARK, lw=1.3))
    ax.add_patch(Rectangle((x-0.6*s, y+12*s), 7.2*s, 2*s, facecolor=cap, edgecolor="none"))
    ax.add_patch(Rectangle((x+0.8*s, y+2*s), 4.4*s, 5*s, facecolor=CARD, edgecolor="none"))
    if label:
        ax.text(x+3*s, y-2.2*s, label, ha="center", va="top", fontsize=7.5, color=DARK)


# ═══════════════════════════════════════════════════════════════════════════
# INSULIN INJECTION DIAGRAMS
# ═══════════════════════════════════════════════════════════════════════════
def insulin_supplies() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Required Supplies")
    items = [
        ("Insulin\nvial / pen", "vial"),
        ("Syringe /\npen needle", "syringe"),
        ("Alcohol\nswabs", "swab"),
        ("Sharps\ncontainer", "sharps"),
        ("Clean\ngloves", "gloves"),
    ]
    x0, w, gap = 6, 15, 3.5
    for i, (label, kind) in enumerate(items):
        x = x0 + i * (w + gap)
        _panel(ax, x, 8, w, 22, fill=LIGHT)
        cx = x + w / 2
        if kind == "vial":
            _vial(ax, cx - 3, 15, s=0.9)
        elif kind == "syringe":
            _syringe(ax, x + 3.5, 20, s=0.5)
        elif kind == "swab":
            ax.add_patch(FancyBboxPatch((cx-4, 16), 8, 8, boxstyle="round,pad=0.2",
                         facecolor="white", edgecolor=TEAL, lw=1.3))
            ax.plot([cx-4, cx+4], [20, 20], color=TEAL_L, lw=1)
            ax.plot([cx, cx], [16, 24], color=TEAL_L, lw=1)
        elif kind == "sharps":
            ax.add_patch(Polygon([(cx-4, 14), (cx+4, 14), (cx+3, 24), (cx-3, 24)],
                         closed=True, facecolor=RED, edgecolor=DARK, lw=1.2))
            ax.add_patch(Rectangle((cx-4.5, 23.5), 9, 2, facecolor=DARK))
        elif kind == "gloves":
            ax.add_patch(FancyBboxPatch((cx-3.5, 15), 7, 9, boxstyle="round,pad=0.3",
                         facecolor=CARD, edgecolor=TEAL, lw=1.3))
            for dx in (-1.8, 0, 1.8):
                ax.add_patch(Rectangle((cx+dx-0.4, 23), 0.8, 2.5, facecolor=CARD, edgecolor=TEAL, lw=1))
        ax.text(cx, 10.5, label, ha="center", va="center", fontsize=7.6, color=DARK)
    return _render(fig)


def insulin_prepare() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Preparing the Insulin")
    # Left: roll, don't shake
    _panel(ax, 5, 7, 42, 26, fill=LIGHT)
    ax.text(26, 30, "Roll gently 10× — do NOT shake", ha="center", fontsize=8.5,
            color=DARK, fontweight="bold")
    _vial(ax, 22, 12, s=1.0, cap=TEAL)
    ax.add_patch(FancyArrowPatch((17, 24), (22, 24), connectionstyle="arc3,rad=0.6",
                 arrowstyle="-|>", mutation_scale=12, color=TEAL, lw=1.8))
    ax.add_patch(FancyArrowPatch((33, 24), (28, 24), connectionstyle="arc3,rad=0.6",
                 arrowstyle="-|>", mutation_scale=12, color=TEAL, lw=1.8))
    ax.text(12, 13, "palm", ha="center", fontsize=7, color=GRAY)
    ax.text(40, 13, "palm", ha="center", fontsize=7, color=GRAY)
    # Right: clear before cloudy
    _panel(ax, 53, 7, 42, 26, fill=LIGHT)
    ax.text(74, 30, "Mixing order: clear before cloudy", ha="center", fontsize=8.5,
            color=DARK, fontweight="bold")
    _vial(ax, 62, 11, s=0.9, cap=TEAL, label="1. Clear\n(rapid)")
    ax.add_patch(Rectangle((62.7, 13), 3.6, 4, facecolor="white", edgecolor="none"))
    _vial(ax, 80, 11, s=0.9, cap=GRAY, label="2. Cloudy\n(NPH)")
    ax.add_patch(Rectangle((80.7, 13), 3.6, 4, facecolor="#d1d5db", edgecolor="none"))
    _arrow(ax, 70, 17, 78, 17)
    return _render(fig)


def insulin_draw_dose() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Drawing Up the Correct Dose")
    # Large syringe with unit scale
    ax.add_patch(Rectangle((14, 16), 56, 8, facecolor="white", edgecolor=DARK, lw=1.6))
    for i in range(0, 11):
        xx = 16 + i * 5.2
        ax.plot([xx, xx], [24, 21.5], color=DARK, lw=1)
        if i % 2 == 0:
            ax.text(xx, 25.5, str(i * 5), ha="center", fontsize=6.5, color=GRAY)
    ax.text(42, 27.5, "units", ha="center", fontsize=7, color=GRAY)
    # plunger
    ax.add_patch(Rectangle((6, 18), 8, 4, facecolor=DARK))
    ax.add_patch(Rectangle((3, 16), 3, 8, facecolor=DARK))
    # dose fill
    ax.add_patch(Rectangle((14, 16.5), 30, 7, facecolor=TEAL_L, edgecolor="none", alpha=0.6))
    # needle into vial
    ax.plot([70, 80], [20, 20], color=DARK, lw=1.6)
    _vial(ax, 80, 12, s=1.1, cap=TEAL)
    # callouts
    _arrow(ax, 30, 12, 30, 15.8, color=TEAL)
    ax.text(30, 9.5, "Pull plunger to\nexact prescribed units", ha="center", fontsize=7.5, color=DARK)
    _arrow(ax, 55, 32, 48, 24.5, color=AMBER)
    ax.text(60, 33, "Tap out air bubbles", ha="left", fontsize=7.5, color=AMBER, va="center")
    return _render(fig)


def insulin_sites() -> bytes:
    fig, ax = _canvas(xlim=100, ylim=42.5)
    _title(ax, "Subcutaneous Injection Sites & Absorption")
    # Simple front-view body silhouette (left half)
    cx = 26
    ax.add_patch(Circle((cx, 33), 3.2, facecolor=SKIN, edgecolor=DARK, lw=1.2))          # head
    ax.add_patch(FancyBboxPatch((cx-7, 14), 14, 16, boxstyle="round,pad=0.3",
                 facecolor=SKIN, edgecolor=DARK, lw=1.2))                                 # torso
    ax.add_patch(FancyBboxPatch((cx-11, 16), 4, 12, boxstyle="round,pad=0.2",
                 facecolor=SKIN, edgecolor=DARK, lw=1.1))                                 # left arm
    ax.add_patch(FancyBboxPatch((cx+7, 16), 4, 12, boxstyle="round,pad=0.2",
                 facecolor=SKIN, edgecolor=DARK, lw=1.1))                                 # right arm
    ax.add_patch(FancyBboxPatch((cx-6, 2), 5, 13, boxstyle="round,pad=0.2",
                 facecolor=SKIN, edgecolor=DARK, lw=1.1))                                 # left leg
    ax.add_patch(FancyBboxPatch((cx+1, 2), 5, 13, boxstyle="round,pad=0.2",
                 facecolor=SKIN, edgecolor=DARK, lw=1.1))                                 # right leg
    # zones
    ax.add_patch(Circle((cx, 20), 3.4, facecolor=TEAL, edgecolor="none", alpha=0.7))      # abdomen
    ax.add_patch(Circle((cx-9, 22), 1.8, facecolor=AMBER, edgecolor="none", alpha=0.8))   # arm
    ax.add_patch(Circle((cx-3.5, 8), 2.1, facecolor=GREEN, edgecolor="none", alpha=0.7))  # thigh
    ax.add_patch(Circle((cx+3.5, 8), 2.1, facecolor=GREEN, edgecolor="none", alpha=0.7))
    # legend (right)
    lx = 52
    legend = [
        (TEAL,  "Abdomen — fastest, most consistent (preferred for mealtime)"),
        (AMBER, "Upper outer arm — moderate absorption"),
        (GREEN, "Outer thigh / buttocks — slower absorption"),
    ]
    ax.text(lx, 30, "Rotate sites systematically", fontsize=8.5, color=DARK, fontweight="bold")
    for i, (col, txt) in enumerate(legend):
        yy = 25 - i * 6
        ax.add_patch(Circle((lx + 1.5, yy), 1.5, facecolor=col, alpha=0.8, edgecolor="none"))
        ax.text(lx + 5, yy, txt, fontsize=7.6, color=DARK, va="center")
    ax.text(lx, 4.5, "Keep injections ≥2 inches (5 cm) from the navel and rotate to prevent lipohypertrophy.",
            fontsize=7, color=GRAY, va="center")
    return _render(fig)


def insulin_angle() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Injection Angle & Skin Layers")
    # skin layers
    layers = [
        (26, 6, SKIN,   "Epidermis"),
        (20, 6, "#f0b98a", "Dermis"),
        (9, 11, FAT,    "Subcutaneous fat  ← target"),
        (2, 7, MUSCLE,  "Muscle"),
    ]
    for y, h, col, name in layers:
        ax.add_patch(Rectangle((8, y), 84, h, facecolor=col, edgecolor="white", lw=1))
        ax.text(90, y + h / 2, name, ha="right", va="center", fontsize=7.4, color=DARK)
    # 90 degree needle
    ax.add_patch(FancyArrowPatch((30, 35), (30, 14), arrowstyle="-|>",
                 mutation_scale=15, color=DARK, lw=2.2))
    ax.text(30, 36.5, "90°", ha="center", fontsize=8.5, color=DARK, fontweight="bold")
    ax.text(30, 12.5, "standard", ha="center", fontsize=7, color=GREEN, va="top")
    # 45 degree needle
    ax.add_patch(FancyArrowPatch((58, 35), (68, 14), arrowstyle="-|>",
                 mutation_scale=15, color=DARK, lw=2.2))
    ax.text(56, 36.5, "45°", ha="center", fontsize=8.5, color=DARK, fontweight="bold")
    ax.text(72, 12.5, "thin patients /\nshort needle", ha="center", fontsize=7, color=AMBER, va="top")
    return _render(fig)


def insulin_withdraw() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Withdraw & Apply Gentle Pressure")
    # skin line
    ax.add_patch(Rectangle((8, 12), 84, 8, facecolor=SKIN, edgecolor=DARK, lw=1.2))
    # needle leaving
    ax.add_patch(FancyArrowPatch((36, 14), (28, 34), arrowstyle="-|>",
                 mutation_scale=15, color=DARK, lw=2.2))
    ax.text(24, 35, "Withdraw at same angle", fontsize=7.8, color=DARK, ha="left")
    # cotton ball pressing
    ax.add_patch(Circle((64, 22), 4.5, facecolor="white", edgecolor=GRAY, lw=1.3))
    _arrow(ax, 64, 31, 64, 26, color=TEAL)
    ax.text(64, 33, "Press with gauze", ha="center", fontsize=7.8, color=DARK)
    ax.text(64, 8, "Do NOT rub — rubbing speeds absorption unpredictably",
            ha="center", fontsize=7.4, color=RED)
    return _render(fig)


def insulin_dispose() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Dispose Safely & Document")
    # sharps container
    ax.add_patch(Polygon([(12, 6), (36, 6), (33, 30), (15, 30)], closed=True,
                 facecolor=RED, edgecolor=DARK, lw=1.5))
    ax.add_patch(Rectangle((13, 29), 22, 3, facecolor=DARK))
    ax.text(24, 18, "SHARPS", ha="center", color="white", fontsize=9, fontweight="bold", rotation=0)
    _syringe(ax, 20, 34, s=0.6, color=DARK)
    _arrow(ax, 26, 33, 24, 31, color=DARK)
    ax.text(24, 2.5, "Never recap needles", ha="center", fontsize=7.4, color=RED)
    # documentation checklist
    checks = ["Dose administered", "Time & site used", "Blood glucose reading", "Next rotation site"]
    _panel(ax, 50, 5, 46, 30, fill=LIGHT)
    ax.text(73, 31, "Document", ha="center", fontsize=8.5, color=DARK, fontweight="bold")
    for i, c in enumerate(checks):
        yy = 26 - i * 5.5
        ax.add_patch(Circle((55, yy), 1.3, facecolor=GREEN, edgecolor="none"))
        ax.plot([54.3, 54.9, 55.9], [yy, yy-0.6, yy+0.7], color="white", lw=1.4)
        ax.text(58.5, yy, c, fontsize=7.8, color=DARK, va="center")
    return _render(fig)


# ═══════════════════════════════════════════════════════════════════════════
# BLOOD PRESSURE DIAGRAMS
# ═══════════════════════════════════════════════════════════════════════════
def bp_prepare() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Correct Patient Positioning")
    # chair
    ax.add_patch(Rectangle((20, 8), 3, 22, facecolor=GRAY))       # backrest
    ax.add_patch(Rectangle((20, 8), 20, 3, facecolor=GRAY))       # seat
    # seated figure
    ax.add_patch(Circle((30, 30), 3, facecolor=SKIN, edgecolor=DARK, lw=1.2))     # head
    ax.add_patch(FancyBboxPatch((26, 11), 8, 16, boxstyle="round,pad=0.3",
                 facecolor=TEAL, edgecolor=DARK, lw=1.2))                          # torso
    ax.add_patch(Rectangle((34, 16), 14, 3, facecolor=SKIN, edgecolor=DARK, lw=1)) # arm out
    ax.add_patch(Rectangle((34, 4), 3, 8, facecolor=SKIN, edgecolor=DARK, lw=1))   # lower leg
    # heart-level line
    ax.plot([26, 62], [18, 18], color=RED, ls="--", lw=1.3)
    ax.text(63, 18, "arm at\nheart level", fontsize=7.4, color=RED, va="center")
    # labels
    notes = [
        "Rest seated 5 min before measuring",
        "Back supported, legs uncrossed",
        "Feet flat on the floor",
        "No talking, caffeine or smoking 30 min prior",
    ]
    for i, n in enumerate(notes):
        yy = 30 - i * 6
        ax.add_patch(Circle((70, yy), 1.1, facecolor=TEAL, edgecolor="none"))
        ax.text(73, yy, n, fontsize=7.5, color=DARK, va="center")
    return _render(fig)


def bp_cuff_size() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Selecting the Correct Cuff Size")
    # arm with measurement bracket
    ax.add_patch(FancyBboxPatch((8, 20), 34, 10, boxstyle="round,pad=0.3",
                 facecolor=SKIN, edgecolor=DARK, lw=1.3))
    ax.annotate("", xy=(8, 33), xytext=(42, 33),
                arrowprops=dict(arrowstyle="<->", color=TEAL, lw=1.5))
    ax.text(25, 35, "arm circumference (mid-upper arm)", ha="center", fontsize=7.3, color=TEAL)
    ax.text(25, 25, "Bladder should encircle 80% of arm", ha="center", fontsize=7.2, color=DARK)
    # size table
    rows = [
        ("Small adult", "22–26 cm"),
        ("Adult", "27–34 cm"),
        ("Large adult", "35–44 cm"),
        ("Thigh cuff", "45–52 cm"),
    ]
    tx, ty = 52, 30
    ax.add_patch(Rectangle((tx, 6), 44, 26, facecolor=LIGHT, edgecolor=TEAL, lw=1.3))
    ax.text(tx + 22, ty, "Cuff sizing", ha="center", fontsize=8.3, color=DARK, fontweight="bold")
    for i, (name, rng) in enumerate(rows):
        yy = ty - 5 - i * 5
        ax.text(tx + 3, yy, name, fontsize=7.6, color=DARK, va="center")
        ax.text(tx + 40, yy, rng, fontsize=7.6, color=TEAL, va="center", ha="right", fontweight="bold")
    ax.text(50, 2.5, "Wrong cuff size is the most common source of measurement error.",
            ha="center", fontsize=7, color=AMBER)
    return _render(fig)


def bp_position() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Cuff & Stethoscope Placement")
    # arm
    ax.add_patch(FancyBboxPatch((10, 16), 70, 12, boxstyle="round,pad=0.3",
                 facecolor=SKIN, edgecolor=DARK, lw=1.3))
    # brachial artery
    ax.plot([12, 78], [22, 22], color=RED, lw=1.6)
    ax.text(78, 25, "brachial artery", fontsize=7.2, color=RED, ha="right")
    # cuff
    ax.add_patch(Rectangle((22, 14), 26, 16, facecolor=TEAL, edgecolor=DARK, lw=1.3, alpha=0.85))
    ax.text(35, 32, "cuff", ha="center", fontsize=7.6, color=TEAL, fontweight="bold")
    # elbow crease marker
    ax.plot([56, 56], [14, 30], color=DARK, ls="--", lw=1)
    ax.annotate("", xy=(48, 12), xytext=(56, 12), arrowprops=dict(arrowstyle="<->", color=DARK, lw=1.2))
    ax.text(52, 9.5, "2–3 cm", ha="center", fontsize=7, color=DARK)
    ax.text(56, 32, "elbow crease", ha="center", fontsize=7, color=GRAY)
    # stethoscope bell
    ax.add_patch(Circle((60, 22), 3, facecolor="white", edgecolor=DARK, lw=1.5))
    ax.text(66, 16, "stethoscope\nbell over artery", fontsize=7.2, color=DARK, va="center")
    return _render(fig)


def bp_korotkoff() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Korotkoff Sounds — Inflate & Deflate")
    # axes
    ax.annotate("", xy=(92, 8), xytext=(12, 8), arrowprops=dict(arrowstyle="->", color=DARK, lw=1.3))
    ax.annotate("", xy=(12, 34), xytext=(12, 8), arrowprops=dict(arrowstyle="->", color=DARK, lw=1.3))
    ax.text(52, 3.5, "time / deflation →", ha="center", fontsize=7.5, color=GRAY)
    ax.text(7, 21, "cuff\npressure", ha="center", fontsize=7.5, color=GRAY, rotation=90, va="center")
    # deflation curve
    x = np.linspace(14, 90, 200)
    y = 30 - (x - 14) * (20 / 76)
    ax.plot(x, y, color=TEAL, lw=2)
    # systolic & diastolic markers
    xs, xd = 34, 70
    ys = 30 - (xs - 14) * (20 / 76)
    yd = 30 - (xd - 14) * (20 / 76)
    # sound waveforms between systolic and diastolic
    xw = np.linspace(xs, xd, 120)
    amp = np.hanning(120) * 2.4
    yw = 14 + amp * np.sin(xw * 4)
    ax.plot(xw, yw, color=RED, lw=1.1)
    ax.plot([xs, xs], [8, ys], color=GREEN, ls="--", lw=1.3)
    ax.plot([xd, xd], [8, yd], color=AMBER, ls="--", lw=1.3)
    ax.text(xs, ys + 2.5, "Phase I\nfirst sound\n= SYSTOLIC", ha="center", fontsize=7, color=GREEN)
    ax.text(xd, yd + 2.5, "Phase V\nsound gone\n= DIASTOLIC", ha="center", fontsize=7, color=AMBER)
    ax.text(52, 11, "deflate 2–3 mmHg / sec", ha="center", fontsize=7, color=GRAY, style="italic")
    return _render(fig)


def bp_categories() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Blood Pressure Categories (ACC/AHA)")
    cats = [
        ("Normal",        "<120 / <80",       GREEN),
        ("Elevated",      "120–129 / <80",    "#84cc16"),
        ("Stage 1 HTN",   "130–139 / 80–89",  AMBER),
        ("Stage 2 HTN",   "≥140 / ≥90",       "#f97316"),
        ("Crisis",        ">180 / >120",      RED),
    ]
    x0, w, gap = 6, 16.4, 1.8
    for i, (name, rng, col) in enumerate(cats):
        x = x0 + i * (w + gap)
        ax.add_patch(FancyBboxPatch((x, 12), w, 16, boxstyle="round,pad=0.15,rounding_size=1",
                     facecolor=col, edgecolor="white", lw=1.5, alpha=0.9))
        ax.text(x + w/2, 24, name, ha="center", va="center", fontsize=7.8,
                color="white", fontweight="bold")
        ax.text(x + w/2, 18, rng, ha="center", va="center", fontsize=7.2, color="white")
        if i < len(cats) - 1:
            _arrow(ax, x + w + 0.2, 20, x + w + gap - 0.2, 20, color=GRAY, lw=1.4, ms=9)
    ax.text(50, 6.5, "Crisis + symptoms (chest pain, dyspnea, neuro changes) = emergency — call physician.",
            ha="center", fontsize=7, color=RED)
    return _render(fig)


# ═══════════════════════════════════════════════════════════════════════════
# WOUND DRESSING DIAGRAMS
# ═══════════════════════════════════════════════════════════════════════════
def wound_equipment() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Assemble Equipment (Sterile Field)")
    items = ["Sterile &\nclean gloves", "Saline /\ncleanser", "Dressings\n(gauze, foam)",
             "Tape /\nbandage", "Measuring\ntools", "Waste\nbag"]
    x0, w, gap = 5, 13.5, 1.8
    for i, label in enumerate(items):
        x = x0 + i * (w + gap)
        _panel(ax, x, 10, w, 20, fill=LIGHT)
        cx = x + w / 2
        # simple symbol
        ax.add_patch(Circle((cx, 22), 3.2, facecolor=CARD, edgecolor=TEAL, lw=1.3))
        ax.text(cx, 13.5, label, ha="center", va="center", fontsize=7.2, color=DARK)
    ax.text(50, 5, "Perform hand hygiene before and after — review the wound care order first.",
            ha="center", fontsize=7.2, color=GRAY)
    return _render(fig)


def wound_remove() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Removing the Old Dressing")
    # correct: peel parallel
    _panel(ax, 5, 8, 42, 26, fill=LIGHT, edge=GREEN)
    ax.add_patch(Rectangle((10, 14), 32, 5, facecolor=SKIN, edgecolor=DARK, lw=1.2))
    ax.add_patch(Rectangle((14, 19), 20, 3, facecolor=CARD, edgecolor=TEAL, lw=1))
    ax.add_patch(FancyArrowPatch((24, 22), (12, 20), arrowstyle="-|>",
                 mutation_scale=13, color=GREEN, lw=2))
    ax.text(26, 30, "Peel parallel to skin", ha="center", fontsize=8, color=GREEN, fontweight="bold")
    ax.text(26, 10.5, "low, flat angle", ha="center", fontsize=7, color=GRAY)
    # wrong: pull up
    _panel(ax, 53, 8, 42, 26, fill=LIGHT, edge=RED)
    ax.add_patch(Rectangle((58, 14), 32, 5, facecolor=SKIN, edgecolor=DARK, lw=1.2))
    ax.add_patch(Rectangle((62, 19), 20, 3, facecolor=CARD, edgecolor=TEAL, lw=1))
    ax.add_patch(FancyArrowPatch((72, 22), (72, 32), arrowstyle="-|>",
                 mutation_scale=13, color=RED, lw=2))
    ax.text(74, 30, "Do NOT pull upward", ha="center", fontsize=8, color=RED, fontweight="bold")
    ax.text(74, 10.5, "moisten adherent dressings first", ha="center", fontsize=6.8, color=GRAY)
    return _render(fig)


def wound_assess() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Wound Assessment — Clock Method & Bed Colour")
    # clock face over wound
    ax.add_patch(Circle((26, 19), 13, facecolor=LIGHT, edgecolor=TEAL, lw=1.4))
    ax.add_patch(Ellipse((26, 19), 12, 9, facecolor=MUSCLE, edgecolor=RED, lw=1.2, alpha=0.7))
    for hr, (dx, dy) in {"12": (0, 11), "3": (11, 0), "6": (0, -11), "9": (-11, 0)}.items():
        ax.text(26 + dx, 19 + dy, hr, ha="center", va="center", fontsize=7.5, color=DARK, fontweight="bold")
    ax.text(26, 3.5, "12 o'clock = toward head", ha="center", fontsize=7, color=GRAY)
    # measurement note
    ax.text(26, 34.5, "Measure L × W × D (cm)", ha="center", fontsize=7.6, color=DARK, fontweight="bold")
    # wound bed colour scale
    scale = [(RED, "Red", "healthy granulation"),
             (AMBER, "Yellow", "slough"),
             ("#1f2937", "Black", "necrosis / eschar")]
    lx = 50
    ax.text(lx, 32, "Wound bed colour", fontsize=8.3, color=DARK, fontweight="bold")
    for i, (col, name, desc) in enumerate(scale):
        yy = 26 - i * 7
        ax.add_patch(Rectangle((lx, yy - 2), 6, 4.5, facecolor=col, edgecolor="white", lw=1))
        ax.text(lx + 8, yy + 0.8, name, fontsize=7.8, color=DARK, va="center", fontweight="bold")
        ax.text(lx + 8, yy - 1.4, desc, fontsize=6.8, color=GRAY, va="center")
    return _render(fig)


def wound_cleanse() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Cleansing & Irrigation")
    # wound
    ax.add_patch(Rectangle((10, 8), 80, 8, facecolor=SKIN, edgecolor=DARK, lw=1.2))
    ax.add_patch(Ellipse((40, 12), 16, 6, facecolor=MUSCLE, edgecolor=RED, lw=1.1, alpha=0.7))
    # syringe irrigating
    _syringe(ax, 26, 28, s=0.9, color=DARK)
    for dx in (-2, 0, 2):
        ax.add_patch(FancyArrowPatch((46 + dx, 26), (40 + dx, 16), arrowstyle="-|>",
                     mutation_scale=9, color=TEAL, lw=1))
    ax.text(30, 35, "30–35 mL syringe · 18–19 G · 5–8 psi", fontsize=7.6, color=DARK)
    # circular outward motion
    ax.add_patch(FancyArrowPatch((66, 12), (78, 12), connectionstyle="arc3,rad=-0.5",
                 arrowstyle="-|>", mutation_scale=12, color=GREEN, lw=1.6))
    ax.text(72, 20, "clean → dirty,\ncircular outward", ha="center", fontsize=7, color=GREEN)
    ax.text(50, 3.5, "Avoid hydrogen peroxide / povidone-iodine on open wounds — cytotoxic to granulation.",
            ha="center", fontsize=6.9, color=AMBER)
    return _render(fig)


def wound_dressing_layers() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Dressing Application — Layered Cross-Section")
    layers = [
        (8,  6, MUSCLE, "Wound bed"),
        (14, 5, "#a7f3d0", "Primary dressing (contact layer)"),
        (19, 5, CARD, "Secondary dressing (absorptive)"),
        (24, 4, "#e2e8f0", "Securing tape / bandage"),
    ]
    for y, h, col, name in layers:
        ax.add_patch(Rectangle((16, y), 52, h, facecolor=col, edgecolor="white", lw=1.2))
        ax.text(70, y + h / 2, name, ha="left", va="center", fontsize=7.6, color=DARK)
    # selection guide
    ax.text(42, 33.5, "Match dressing to wound moisture", ha="center", fontsize=8, color=DARK, fontweight="bold")
    guide = ["Dry → hydrogel", "Wet → foam / alginate", "Infected → silver (antimicrobial)"]
    for i, g in enumerate(guide):
        ax.text(4, 27 - i * 3.5, "• " + g, fontsize=7, color=GRAY, va="center")
    return _render(fig)


def wound_document() -> bytes:
    fig, ax = _canvas()
    _title(ax, "Document & Educate Patient")
    # doc checklist
    _panel(ax, 5, 6, 44, 28, fill=LIGHT)
    ax.text(27, 30, "Document", ha="center", fontsize=8.5, color=DARK, fontweight="bold")
    docs = ["Date & time", "Measurements & findings", "Cleanser & technique",
            "Dressing type applied", "Patient tolerance", "Next scheduled change"]
    for i, d in enumerate(docs):
        yy = 26 - i * 3.7
        ax.add_patch(Circle((9, yy), 1, facecolor=GREEN, edgecolor="none"))
        ax.text(12, yy, d, fontsize=7.2, color=DARK, va="center")
    # infection signs
    _panel(ax, 53, 6, 43, 28, fill="#fef2f2", edge=RED)
    ax.text(74, 30, "Teach: signs of infection", ha="center", fontsize=8.5, color=RED, fontweight="bold")
    signs = ["Increased pain", "Redness & warmth", "Purulent discharge", "Fever"]
    for i, s in enumerate(signs):
        yy = 25 - i * 4.5
        ax.add_patch(Circle((57, yy), 1, facecolor=RED, edgecolor="none"))
        ax.text(60, yy, s, fontsize=7.4, color=DARK, va="center")
    ax.text(74, 4.5, "→ seek immediate care if these appear", ha="center", fontsize=6.9, color=RED)
    return _render(fig)


# ── Registry: maps a diagram key to its function ─────────────────────────────
DIAGRAMS = {
    # insulin
    "insulin_supplies": insulin_supplies,
    "insulin_prepare": insulin_prepare,
    "insulin_draw_dose": insulin_draw_dose,
    "insulin_sites": insulin_sites,
    "insulin_angle": insulin_angle,
    "insulin_withdraw": insulin_withdraw,
    "insulin_dispose": insulin_dispose,
    # blood pressure
    "bp_prepare": bp_prepare,
    "bp_cuff_size": bp_cuff_size,
    "bp_position": bp_position,
    "bp_korotkoff": bp_korotkoff,
    "bp_categories": bp_categories,
    # wound
    "wound_equipment": wound_equipment,
    "wound_remove": wound_remove,
    "wound_assess": wound_assess,
    "wound_cleanse": wound_cleanse,
    "wound_dressing_layers": wound_dressing_layers,
    "wound_document": wound_document,
}


def render_diagram(key: str) -> bytes:
    """Return PNG bytes for the named diagram."""
    fn = DIAGRAMS.get(key)
    if fn is None:
        raise KeyError(f"Unknown diagram key: {key}")
    return fn()


if __name__ == "__main__":
    # Quick preview: dump every diagram to a _preview folder
    from pathlib import Path
    out = Path(__file__).parent / "_diagram_preview"
    out.mkdir(exist_ok=True)
    for key in DIAGRAMS:
        (out / f"{key}.png").write_bytes(render_diagram(key))
        print(f"  rendered {key}")
    print(f"\nPreviews written to {out}")