"""
Fuzzy + phonetic name matching and risk scoring for sanctions/PEP screening.

Why this is non-trivial: the same sanctioned entity is written many ways
("Muhammad" / "Mohammed" / "Mohamad", "JSC Rosoboronexport" / "Rosoboron export").
Exact matching misses these. We combine:
  - RapidFuzz WRatio  — robust to word order, partials, and typos
  - Metaphone         — catches names that *sound* alike but are spelled differently
and turn the best match into an explainable risk score.
"""
from __future__ import annotations

import math
import re
import unicodedata

import jellyfish
from rapidfuzz import fuzz, process

# Company suffixes stripped so "Acme Trading LLC" matches "Acme Trading".
_ORG_SUFFIXES = {
    "llc", "ltd", "limited", "inc", "incorporated", "corp", "corporation",
    "co", "company", "plc", "gmbh", "ag", "sa", "jsc", "ojsc", "pjsc",
    "llp", "lp", "pvt", "private", "group", "holding", "holdings", "trading",
}
_PUNCT = re.compile(r"[^\w\s]", flags=re.UNICODE)
_WS = re.compile(r"\s+")


def normalize_name(name: str, drop_org_suffixes: bool = False) -> str:
    """Lowercase, strip accents/punctuation, collapse whitespace."""
    text = unicodedata.normalize("NFKD", name)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = _PUNCT.sub(" ", text.lower())
    text = _WS.sub(" ", text).strip()
    if drop_org_suffixes:
        tokens = [t for t in text.split() if t not in _ORG_SUFFIXES]
        text = " ".join(tokens) or text
    return text


def phonetic_key(name: str) -> str:
    """Metaphone code of the whole normalized name (space-joined per token)."""
    norm = normalize_name(name)
    return " ".join(jellyfish.metaphone(tok) for tok in norm.split() if tok)


# ── Risk model ────────────────────────────────────────────────────────────
# Sanctions hits are blocking-level risk; PEP hits mean "enhanced due
# diligence", not a block — so PEP risk is capped lower for the same score.
def _risk_band(score: float, list_type: str, phonetic_only: bool) -> tuple[str, str]:
    """Return (risk_level, confidence) for a single candidate match."""
    confidence = (
        "High" if score >= 90 else
        "Medium" if score >= 78 else
        "Low"
    )
    if phonetic_only and confidence == "High":
        confidence = "Medium"  # sounded alike but spelling differed — be cautious

    if list_type == "sanctions":
        level = (
            "CRITICAL" if score >= 92 else
            "HIGH" if score >= 82 else
            "MEDIUM" if score >= 70 else
            "LOW"
        )
    else:  # pep
        level = (
            "HIGH" if score >= 90 else
            "MEDIUM" if score >= 78 else
            "LOW"
        )
    return level, confidence


_LEVEL_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}


def _distinctive_fraction(q_tokens: list[str], cand_tokens: list[str], store) -> float:
    """
    Fraction of the query's *information* (IDF-weighted) covered by tokens it
    shares with the candidate. Common words ("ocean", "shipping", "trading")
    have low IDF, so a match on only those scores near 0; a match on a rare,
    distinctive token ("rosoboron", "putin") scores high. Used to reject
    generic-word coincidences without hurting real matches.
    """
    shared = set(q_tokens) & set(cand_tokens)
    if not shared:
        return 0.0
    n = store.n_names or 1

    def idf(tok: str) -> float:
        return math.log((n + 1) / (store.token_df.get(tok, 0) + 1)) + 1.0

    q_info = sum(idf(t) for t in set(q_tokens)) or 1.0
    return sum(idf(t) for t in shared) / q_info


def _passes_length_guard(q_tokens: list[str], cand_norm: str, q_norm: str) -> bool:
    """
    Reject structural false positives that fuzzy scorers over-reward:
      - a single short token matched against a long multi-token name
        (e.g. alias "RT" vs "Rosoboron Export")
      - names of wildly different length
    """
    cand_tokens = cand_norm.split()
    lo, hi = sorted((len(q_tokens), len(cand_tokens)))
    if lo == 1 and hi >= 3:
        return False
    length_ratio = min(len(cand_norm), len(q_norm)) / max(len(cand_norm), len(q_norm), 1)
    return length_ratio >= 0.34


def screen(store, query: str, entity_type: str = "any",
           limit: int = 5, min_score: int = 84) -> dict:
    """
    Screen a single name against the loaded sanctions/PEP data.

    entity_type: "any" | "person" | "organization"
    Returns a structured, explainable result (see server.py tool docstring).
    """
    q_norm = normalize_name(query, drop_org_suffixes=True)
    if not q_norm:
        return {"query": query, "overall_risk": "LOW", "match_count": 0, "matches": []}

    q_tokens = q_norm.split()
    q_nospace = q_norm.replace(" ", "")
    q_phon = phonetic_key(query)

    # ── Stage 1 — fast recall ────────────────────────────────────────────
    # Two cheap single-pass C scorers gather a candidate pool (much faster
    # than WRatio, which internally runs 4+ scorers):
    #   token_set_ratio on spaced names → typos, reordering, subsets
    #   ratio on no-space names        → concatenation ("Rosoboron Export" == "Rosoboronexport")
    cand_indices: set[int] = set()
    for _c, _s, idx in process.extract(
        q_norm, store.choices, scorer=fuzz.token_set_ratio, limit=60, score_cutoff=72
    ):
        cand_indices.add(idx)
    for _c, _s, idx in process.extract(
        q_nospace, store.choices_nospace, scorer=fuzz.ratio, limit=40, score_cutoff=82
    ):
        cand_indices.add(idx)

    # ── Stage 2 — precise rerank ─────────────────────────────────────────
    # Require the WHOLE names to be similar (not just one shared token like
    # "Fresh" or "John"). Take the max of two strict scorers; Metaphone
    # rescues transliteration variants (Mohammed / Muhammad).
    best: dict[str, dict] = {}
    for idx in cand_indices:
        cand_norm = store.choices[idx]
        if not _passes_length_guard(q_tokens, cand_norm, q_norm):
            continue

        ts = fuzz.token_sort_ratio(q_norm, cand_norm)
        ns = fuzz.ratio(q_nospace, store.choices_nospace[idx])
        # The no-space scorer only earns trust when near-exact — real
        # concatenation variants score ~100, whereas a weak shared suffix
        # ("Global Tech Solutions" vs "Maxtech Solutions") sits ~80 and must
        # NOT count as a match.
        score = float(ts if ns < 90 else max(ts, ns))

        matched_field = store.original_for_choice(idx)
        phonetic_only = False
        if score < min_score:
            if score >= 60 and phonetic_key(matched_field) == q_phon:
                score, phonetic_only = 84.0, True   # sounds identical → flag for review
            else:
                continue

        # Distinctive-token gate: a mid-range match must share a meaningful,
        # non-generic token. Near-exact matches (>=92) and phonetic hits bypass.
        if not phonetic_only and score < 92:
            if _distinctive_fraction(q_tokens, cand_norm.split(), store) < 0.5:
                continue

        rec = store.record_for_choice(idx)
        if entity_type == "person" and rec["schema"] not in ("Person",):
            continue
        if entity_type == "organization" and rec["schema"] in ("Person",):
            continue

        level, confidence = _risk_band(score, rec["list_type"], phonetic_only)

        prev = best.get(rec["id"])
        if prev and prev["score"] >= score:
            continue
        best[rec["id"]] = {
            "entity_id": rec["id"],
            "matched_name": matched_field,
            "primary_name": rec["name"],
            "is_alias": matched_field != rec["name"],
            "schema": rec["schema"],
            "list_type": rec["list_type"],
            "source": rec["source"],
            "programs": rec.get("programs", []),
            "countries": rec.get("countries", []),
            "score": round(score, 1),
            "risk_level": level,
            "confidence": confidence,
            "phonetic_match": phonetic_only,
        }

    matches = sorted(best.values(),
                     key=lambda m: (_LEVEL_ORDER[m["risk_level"]], m["score"]),
                     reverse=True)[:limit]

    for m in matches:
        m["explanation"] = _explain(query, m)

    overall = matches[0]["risk_level"] if matches else "LOW"
    return {
        "query": query,
        "entity_type": entity_type,
        "overall_risk": overall,
        "match_count": len(matches),
        "matches": matches,
    }


def _explain(query: str, m: dict) -> str:
    how = (
        "phonetic (sounds alike)" if m["phonetic_match"]
        else "alias" if m["is_alias"]
        else "name"
    )
    list_desc = "OFAC sanctions list" if m["list_type"] == "sanctions" else "PEP list"
    prog = f" · programs: {', '.join(m['programs'][:3])}" if m["programs"] else ""
    return (
        f"'{query}' matched '{m['matched_name']}' ({how} match, {m['score']}% similarity) "
        f"on the {list_desc} [{m['source']}]{prog}. "
        f"Risk: {m['risk_level']} (confidence: {m['confidence']})."
    )