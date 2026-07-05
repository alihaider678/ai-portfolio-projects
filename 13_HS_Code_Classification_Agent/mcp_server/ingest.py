"""
TariffLens — HTS data ingestion
================================

Downloads the official **USITC Harmonized Tariff Schedule (HTS)** — the US
implementation of the international HS nomenclature — and normalizes it into a
flat `normalized.jsonl` the RAG engine indexes.

Why USITC HTS: it's public and free, and a single dataset gives us BOTH the
product descriptions (for retrieval) AND the general duty rates (for the duty
lookup tool).

Two things this script handles that make classification actually work:

  1. **Full-context descriptions.** HTS rows are hierarchical (an `indent`
     level). A leaf like "Males" only means something as its full path:
     "Live horses... > Horses > Purebred breeding animals > Males". We walk the
     indent stack and store that full path so retrieval has real context.

  2. **Duty inheritance.** The general duty rate usually sits on the 8-digit
     "rate line" (e.g. 0101.21.00 = "Free"); 10-digit statistical splits below
     it have a blank rate and inherit from that parent.

Usage:
    python ingest.py                 # all chapters (01-99)
    python ingest.py --chapters 1-10 # a subset (handy for quick tests)
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import httpx

DATA_DIR = Path(__file__).parent / "data"
RAW_DIR = DATA_DIR / "raw"
OUTPUT = DATA_DIR / "normalized.jsonl"

# USITC HTS REST export — returns an ordered JSON list of rows for a code range.
EXPORT_URL = "https://hts.usitc.gov/reststop/exportList"


def fetch_chapter(client: httpx.Client, chapter: int) -> list[dict]:
    """Fetch all HTS rows for one chapter (e.g. chapter 1 -> headings 0100-0199)."""
    frm = f"{chapter:02d}00"
    to = f"{chapter:02d}99"
    params = {"from": frm, "to": to, "format": "JSON", "styles": "true"}
    raw_path = RAW_DIR / f"chapter_{chapter:02d}.json"
    for attempt in range(3):
        try:
            r = client.get(EXPORT_URL, params=params, timeout=120.0)
            r.raise_for_status()
            data = r.json()
            raw_path.write_text(json.dumps(data), encoding="utf-8")
            return data if isinstance(data, list) else []
        except Exception as e:  # noqa: BLE001
            if attempt == 2:
                print(f"  ! chapter {chapter:02d} failed: {e}")
                return []
            time.sleep(2)
    return []


def clean(text: str) -> str:
    return " ".join((text or "").replace("\n", " ").split()).strip(" :;")


def normalize_chapter(rows: list[dict]) -> list[dict]:
    """
    Walk the ordered rows, tracking an indent stack, and emit one record per row
    that has a real HTS code. Each record carries its full ancestor-path context
    and its effective (inherited) general duty rate.
    """
    out: list[dict] = []
    stack: list[dict] = []  # ancestors: {indent, desc, general, special, other}

    for row in rows:
        htsno = (row.get("htsno") or "").strip()
        desc = clean(row.get("description", ""))
        if not desc:
            continue
        try:
            indent = int(row.get("indent") or 0)
        except (TypeError, ValueError):
            indent = 0

        # Pop siblings/deeper rows so `stack` holds only strict ancestors.
        while stack and stack[-1]["indent"] >= indent:
            stack.pop()

        general = (row.get("general") or "").strip()
        special = (row.get("special") or "").strip()
        other = (row.get("other") or "").strip()

        # Effective duty: own rate, else nearest ancestor that has one.
        eff_general = general or next(
            (s["general"] for s in reversed(stack) if s["general"]), ""
        )
        eff_other = other or next(
            (s["other"] for s in reversed(stack) if s["other"]), ""
        )

        path_parts = [s["desc"] for s in stack] + [desc]
        context = " > ".join(path_parts)

        node = {
            "indent": indent,
            "desc": desc,
            "general": general,
            "special": special,
            "other": other,
        }

        if htsno:
            digits = htsno.replace(".", "")
            out.append(
                {
                    "hts_code": htsno,
                    "description": desc,          # this row's own description
                    "context": context,           # full ancestor path > this row
                    "level": len(digits),          # 4/6/8/10 digits
                    "duty_general": eff_general,   # inherited MFN/general rate
                    "duty_special": special,       # special-program rates (own row)
                    "duty_other": eff_other,       # column-2 rate
                    "units": row.get("units") or [],
                    "chapter": htsno[:2],
                }
            )

        stack.append(node)

    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Download & normalize USITC HTS data")
    parser.add_argument(
        "--chapters",
        default="1-99",
        help="Chapter range to fetch, e.g. '1-99' or '1-10' (default: 1-99)",
    )
    args = parser.parse_args()

    lo, _, hi = args.chapters.partition("-")
    lo = int(lo)
    hi = int(hi) if hi else lo

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    all_records: list[dict] = []
    with httpx.Client(follow_redirects=True, headers={"User-Agent": "TariffLens/1.0"}) as client:
        for ch in range(lo, hi + 1):
            if ch == 77:  # chapter 77 is reserved/unused in the HS
                continue
            rows = fetch_chapter(client, ch)
            recs = normalize_chapter(rows)
            all_records.extend(recs)
            print(f"  chapter {ch:02d}: {len(rows):5d} rows -> {len(recs):5d} coded records")

    with OUTPUT.open("w", encoding="utf-8") as f:
        for rec in all_records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    with_duty = sum(1 for r in all_records if r["duty_general"])
    print(
        f"\nDone. {len(all_records):,} HTS records written to {OUTPUT}\n"
        f"  with a general duty rate: {with_duty:,}\n"
        f"  chapters: {lo}-{hi}"
    )


if __name__ == "__main__":
    main()