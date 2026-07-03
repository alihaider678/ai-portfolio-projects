"""
Download and normalise real sanctions + PEP data for the screening engine.

Sources (public, free):
  - OFAC SDN list           via OpenSanctions  (dataset: us_ofac_sdn)
  - Politically Exposed     via OpenSanctions  (dataset: peps)
    Persons (PEP)

OpenSanctions publishes a clean "simplified" CSV per dataset, which is far
easier to work with than raw OFAC XML. We download those, normalise every
record into one common schema, and write a single JSONL file the engine loads.

Usage:
    python ingest.py                 # OFAC (full) + PEP (capped at 25k for speed)
    python ingest.py --full-peps     # OFAC + PEP (all — slower, more memory)
    python ingest.py --peps-limit 5000
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

import httpx

DATA_DIR = Path(__file__).parent / "data"
RAW_DIR = DATA_DIR / "raw"
OUTPUT = DATA_DIR / "normalized.jsonl"

BASE = "https://data.opensanctions.org/datasets/latest"
SOURCES = {
    "sanctions": {
        "dataset": "us_ofac_sdn",
        "label": "OFAC SDN",
        "url": f"{BASE}/us_ofac_sdn/targets.simple.csv",
    },
    "pep": {
        "dataset": "peps",
        "label": "OpenSanctions PEP",
        "url": f"{BASE}/peps/targets.simple.csv",
    },
}

# CSV allows very large fields (long alias lists) — raise the limit.
csv.field_size_limit(10_000_000)


def download(url: str, dest: Path) -> None:
    """Stream a (possibly large) CSV to disk."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  downloading {url}")
    with httpx.stream("GET", url, timeout=180.0, follow_redirects=True) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_bytes(chunk_size=1 << 16):
                f.write(chunk)
    print(f"  saved -> {dest}  ({dest.stat().st_size / 1e6:.1f} MB)")


def _split(value: str) -> list[str]:
    """OpenSanctions multi-value fields are ';'-separated."""
    if not value:
        return []
    return [v.strip() for v in value.split(";") if v.strip()]


def normalise_row(row: dict, list_type: str, source_label: str) -> dict | None:
    name = (row.get("name") or "").strip()
    if not name:
        return None
    return {
        "id": row.get("id", ""),
        "schema": row.get("schema", ""),          # Person / Organization / Company ...
        "name": name,
        "aliases": _split(row.get("aliases", "")),
        "countries": _split(row.get("countries", "")),
        "birth_date": (row.get("birth_date") or "").strip(),
        "programs": _split(row.get("sanctions", "")),
        "list_type": list_type,                    # "sanctions" | "pep"
        "source": source_label,
    }


def ingest_source(key: str, cfg: dict, limit: int | None) -> list[dict]:
    raw_path = RAW_DIR / f"{cfg['dataset']}.csv"
    if not raw_path.exists():
        download(cfg["url"], raw_path)
    else:
        print(f"  using cached {raw_path.name} (delete to re-download)")

    records: list[dict] = []
    with open(raw_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if limit is not None and i >= limit:
                break
            rec = normalise_row(row, key, cfg["label"])
            if rec:
                records.append(rec)
    print(f"  {cfg['label']}: {len(records):,} records")
    return records


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest sanctions + PEP data")
    parser.add_argument("--only", choices=["sanctions", "pep", "both"], default="both",
                        help="Which datasets to ingest (default: both)")
    parser.add_argument("--full-peps", action="store_true", help="Load ALL PEP records (slower)")
    parser.add_argument("--peps-limit", type=int, default=25_000, help="Cap PEP records (default 25000)")
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    peps_limit = None if args.full_peps else args.peps_limit

    print("Ingesting sanctions + PEP data...\n")
    all_records: list[dict] = []
    if args.only in ("sanctions", "both"):
        all_records += ingest_source("sanctions", SOURCES["sanctions"], limit=None)
    if args.only in ("pep", "both"):
        all_records += ingest_source("pep", SOURCES["pep"], limit=peps_limit)

    with open(OUTPUT, "w", encoding="utf-8") as f:
        for rec in all_records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"\nDone. {len(all_records):,} total records -> {OUTPUT}")


if __name__ == "__main__":
    try:
        main()
    except httpx.HTTPError as e:
        print(f"\nDownload failed: {e}", file=sys.stderr)
        sys.exit(1)