"""
Loads the normalized sanctions/PEP records and builds a flat search index.

The index expands every entity into its primary name PLUS each alias, so a
query can match on any known spelling. `choices` is the list of normalized
strings RapidFuzz scans; parallel arrays map each choice back to its entity.
"""
from __future__ import annotations

import json
from pathlib import Path

from matcher import normalize_name

DATA_FILE = Path(__file__).parent / "data" / "normalized.jsonl"


class ScreeningStore:
    def __init__(self, records: list[dict]):
        self.records = records
        self.choices: list[str] = []          # normalized name/alias strings
        self.choices_nospace: list[str] = []  # same, spaces removed (catches concatenation)
        self._orig: list[str] = []            # original (unnormalized) matched string
        self._owner: list[int] = []           # index into self.records
        self.token_df: dict[str, int] = {}    # document frequency per token (for IDF weighting)
        self.n_names: int = 0
        self._build_index()

    def _build_index(self) -> None:
        for r_idx, rec in enumerate(self.records):
            surface_forms = [rec["name"], *rec.get("aliases", [])]
            for form in surface_forms:
                # Drop org suffixes (LLC, JSC, GmbH…) so generic words don't
                # inflate similarity between unrelated companies.
                norm = normalize_name(form, drop_org_suffixes=True)
                if not norm:
                    continue
                self.choices.append(norm)
                self.choices_nospace.append(norm.replace(" ", ""))
                self._orig.append(form)
                self._owner.append(r_idx)
                for tok in set(norm.split()):
                    self.token_df[tok] = self.token_df.get(tok, 0) + 1
        self.n_names = len(self.choices)

    def record_for_choice(self, choice_idx: int) -> dict:
        return self.records[self._owner[choice_idx]]

    def original_for_choice(self, choice_idx: int) -> str:
        return self._orig[choice_idx]

    def get_by_id(self, entity_id: str) -> dict | None:
        for rec in self.records:
            if rec["id"] == entity_id:
                return rec
        return None

    def stats(self) -> dict:
        sanctions = sum(1 for r in self.records if r["list_type"] == "sanctions")
        peps = sum(1 for r in self.records if r["list_type"] == "pep")
        return {
            "total_entities": len(self.records),
            "indexed_names": len(self.choices),
            "sanctions_entities": sanctions,
            "pep_entities": peps,
        }


def load_store(path: Path = DATA_FILE) -> ScreeningStore:
    if not path.exists():
        raise FileNotFoundError(
            f"Data file not found at {path}. "
            "Run `python ingest.py` first to download and normalise the datasets."
        )
    records = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return ScreeningStore(records)