"""
LicenseGuard — Rules Engine
===========================

The shared decision core used by BOTH front doors (the MCP server and, through
the LangGraph agent, the FastAPI web app). Given a product description and a
destination country it answers the export-license question by combining two
independent checks:

  1. check_country_status(country)          -> unrestricted | partial | embargoed
  2. classify_control_category(product)     -> uncontrolled | dual-use | controlled
  3. combine_and_decide(...)                -> NOT_REQUIRED | LICENSE_REQUIRED | PROHIBITED

The license requirement depends on the *combination*, not either alone. The
engine is deterministic and auditable: every outcome cites the specific rule(s)
that triggered it. Product classification uses an LLM when OPENAI_API_KEY is
present, and falls back to keyword matching otherwise (so it always runs).

Data:
  data/countries.json       — curated OFAC country-based sanctions levels
  data/ccl_categories.json  — curated subset of the US Commerce Control List
"""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from config import LLM_MODEL, get_openai_client, load_env

DATA_DIR = Path(__file__).parent / "data"

# Outcome constants.
NOT_REQUIRED = "NOT_REQUIRED"
LICENSE_REQUIRED = "LICENSE_REQUIRED"
PROHIBITED = "PROHIBITED"

# Human labels for the outcomes (used in UI + explanations).
OUTCOME_LABEL = {
    NOT_REQUIRED: "No License Required",
    LICENSE_REQUIRED: "License Required",
    PROHIBITED: "Prohibited",
}

DEFAULT_COUNTRY_LEVEL = "unrestricted"


def combine_and_decide(country_status: dict, product_class: dict) -> dict:
    """
    Apply the decision matrix over the two independent checks. Pure function
    (no data access) so the LangGraph agent can reuse it as its 'decide' node.

                     | unrestricted | partial            | embargoed
        uncontrolled | NOT_REQUIRED  | LICENSE (country)  | PROHIBITED
        dual-use     | LICENSE (prod)| LICENSE (both)     | PROHIBITED
        controlled   | LICENSE (prod)| LICENSE (both,high)| PROHIBITED
    """
    c_level = country_status.get("level", DEFAULT_COUNTRY_LEVEL)
    p_level = product_class.get("control_level", "uncontrolled")

    triggers: list[dict] = []
    if c_level in ("partial", "embargoed"):
        triggers.append({
            "type": "country",
            "detail": f"{country_status.get('country')} is "
                      f"{'under a comprehensive embargo' if c_level == 'embargoed' else 'subject to targeted restrictions'}"
                      + (f" ({country_status.get('program')})" if country_status.get('program') else ""),
        })
    if p_level in ("dual-use", "controlled"):
        triggers.append({
            "type": "product",
            "detail": f"{product_class.get('category_name')} is a {p_level} item"
                      + (f" (CCL {product_class.get('ccl_reference')})" if product_class.get('ccl_reference') else ""),
        })

    if c_level == "embargoed":
        outcome, scrutiny, driver = PROHIBITED, "prohibited", "country"
    elif p_level == "uncontrolled" and c_level == "unrestricted":
        outcome, scrutiny, driver = NOT_REQUIRED, "standard", "none"
    else:
        outcome = LICENSE_REQUIRED
        both = c_level == "partial" and p_level in ("dual-use", "controlled")
        scrutiny = "high" if (both or p_level == "controlled") else "standard"
        if both:
            driver = "both"
        elif p_level in ("dual-use", "controlled"):
            driver = "product"
        else:
            driver = "country"

    return {
        "outcome": outcome,
        "outcome_label": OUTCOME_LABEL[outcome],
        "scrutiny": scrutiny,
        "driver": driver,
        "triggers": triggers,
        "country_level": c_level,
        "product_level": p_level,
    }


def generate_explanation(country_status: dict, product_class: dict,
                         decision: dict) -> str:
    """Deterministic, auditable plain-English justification. Pure function."""
    country = country_status.get("country")
    outcome = decision["outcome"]
    parts: list[str] = []

    if country_status.get("level") == "embargoed":
        parts.append(f"{country} is under a comprehensive US embargo "
                     f"({country_status.get('program')}).")
    elif country_status.get("level") == "partial":
        parts.append(f"{country} is subject to targeted US restrictions "
                     f"({country_status.get('program')}).")
    else:
        parts.append(f"{country} is not under a US country-based embargo.")

    if product_class.get("control_level") == "uncontrolled":
        parts.append("The product is not on the Commerce Control List (EAR99-style).")
    else:
        parts.append(f"The product classifies as \"{product_class.get('category_name')}\" — "
                     f"a {product_class.get('control_level')} item under CCL "
                     f"{product_class.get('ccl_reference')}.")

    if outcome == PROHIBITED:
        parts.append("Because the destination is embargoed, the export is prohibited "
                     "absent a specific government license (presumption of denial).")
    elif outcome == NOT_REQUIRED:
        parts.append("Neither the destination nor the product triggers a control, so no "
                     "export license is required on these grounds. Standard end-user / "
                     "end-use screening still applies.")
    else:  # LICENSE_REQUIRED
        driver = decision["driver"]
        if driver == "both":
            parts.append("Both the controlled product AND the restricted destination "
                         "trigger a license requirement — expect high scrutiny; cite both.")
        elif driver == "product":
            parts.append("The controlled nature of the product triggers a license "
                         "requirement (product-driven), regardless of most destinations.")
        else:  # country
            parts.append("The destination's restrictions trigger a license requirement "
                         "(country-driven) even though the product itself is uncontrolled.")
    return " ".join(parts)


def _load_json(name: str) -> dict:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", " ", (s or "").lower()).strip()


class RulesEngine:
    """Loads the reference data and answers the export-license question."""

    def __init__(self) -> None:
        countries_doc = _load_json("countries.json")
        self.default_level = countries_doc.get("_default_level", "unrestricted")
        self.default_note = countries_doc.get("_default_note", "")
        self.countries: dict = countries_doc["countries"]
        # alias -> canonical key
        self._alias_index: dict[str, str] = {}
        for key, rec in self.countries.items():
            self._alias_index[_norm(key)] = key
            self._alias_index[_norm(rec["name"])] = key
            for a in rec.get("aliases", []):
                self._alias_index[_norm(a)] = key

        ccl_doc = _load_json("ccl_categories.json")
        self.categories: list[dict] = ccl_doc["categories"]
        self.control_level_help: dict = ccl_doc.get("_control_levels", {})
        self._cat_by_id = {c["id"]: c for c in self.categories}

    # ── Dimension 1: destination country ──────────────────────────────────
    def check_country_status(self, country: str) -> dict:
        """Return the restriction level for a destination country."""
        q = _norm(country)
        key = self._alias_index.get(q)
        # loose contains-match as a fallback (e.g. "the islamic republic of iran")
        if not key and q:
            for alias, k in self._alias_index.items():
                if alias and (alias in q or q in alias):
                    key = k
                    break
        if not key:
            return {
                "country": country.strip() or "(unspecified)",
                "matched": False,
                "level": self.default_level,
                "program": None,
                "note": self.default_note,
            }
        rec = self.countries[key]
        return {
            "country": rec["name"],
            "matched": True,
            "level": rec["level"],
            "program": rec.get("program"),
            "note": rec.get("note", ""),
        }

    # ── Dimension 2: product control classification ───────────────────────
    def classify_control_category(self, product_description: str,
                                  api_key: str | None = None) -> dict:
        """
        Classify a plain-English product into a US CCL control category (or
        'uncontrolled'). Uses an LLM when a key is available (per-request or
        server-side), and falls back to keyword matching otherwise.
        """
        product = (product_description or "").strip()
        if not product:
            return self._uncontrolled(product, confidence="Low",
                                      reasoning="No product description provided.")
        try:
            from config import has_openai_key
            if has_openai_key(api_key):
                return self._classify_llm(product, api_key)
        except Exception:  # noqa: BLE001 — never let classification hard-fail
            pass
        return self._classify_keywords(product)

    def _uncontrolled(self, product: str, confidence: str, reasoning: str,
                      matched_keywords: list[str] | None = None) -> dict:
        return {
            "product": product,
            "control_level": "uncontrolled",
            "category_id": None,
            "category_name": "Not on the control list (EAR99-style)",
            "ccl_category": None,
            "ccl_reference": "EAR99",
            "matched_keywords": matched_keywords or [],
            "confidence": confidence,
            "reasoning": reasoning,
        }

    def _from_category(self, product: str, cat: dict, confidence: str,
                       matched_keywords: list[str], reasoning: str) -> dict:
        return {
            "product": product,
            "control_level": cat["control_level"],
            "category_id": cat["id"],
            "category_name": cat["name"],
            "ccl_category": cat["ccl_category"],
            "ccl_reference": cat["ccl_reference"],
            "matched_keywords": matched_keywords,
            "confidence": confidence,
            "reasoning": reasoning or cat.get("reason", ""),
        }

    def _classify_keywords(self, product: str) -> dict:
        p = _norm(product)
        best, best_hits = None, []
        for cat in self.categories:
            hits = [kw for kw in cat["keywords"] if _norm(kw) in p]
            if len(hits) > len(best_hits):
                best, best_hits = cat, hits
        if not best:
            return self._uncontrolled(
                product, confidence="Medium",
                reasoning="No controlled-item keywords matched; treated as not on the control list.")
        conf = "High" if len(best_hits) >= 2 else "Medium"
        return self._from_category(
            product, best, conf, best_hits,
            f"Matched control-list keywords {best_hits} → {best['name']}.")

    def _classify_llm(self, product: str, api_key: str | None = None) -> dict:
        client = get_openai_client(api_key)
        catalog = [
            {"id": c["id"], "name": c["name"], "control_level": c["control_level"],
             "keywords": c["keywords"][:8], "examples": c["examples"]}
            for c in self.categories
        ]
        system = (
            "You are an export-control classification assistant. Given a product "
            "description, decide whether it matches one of the US Commerce Control "
            "List (CCL) categories provided, or is uncontrolled (EAR99-style). "
            "Pick the SINGLE best matching category id, or use \"uncontrolled\". "
            "Be conservative: only assign a controlled category when the product "
            "clearly fits it. Ordinary consumer goods (clothes, food, basic "
            "electronics, toys, furniture) are uncontrolled."
        )
        user = (
            f"PRODUCT: {product}\n\n"
            f"CATEGORIES (JSON):\n{json.dumps(catalog, ensure_ascii=False)}\n\n"
            "Respond with ONLY a JSON object: {\"category_id\": <id or \"uncontrolled\">, "
            "\"confidence\": \"High\"|\"Medium\"|\"Low\", "
            "\"matched_signals\": [<short strings>], \"reasoning\": <one sentence>}"
        )
        resp = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "system", "content": system},
                      {"role": "user", "content": user}],
            response_format={"type": "json_object"},
            temperature=0,
        )
        data = json.loads(resp.choices[0].message.content)
        cid = (data.get("category_id") or "").strip()
        conf = data.get("confidence") or "Medium"
        signals = data.get("matched_signals") or []
        reasoning = data.get("reasoning") or ""
        if cid and cid != "uncontrolled" and cid in self._cat_by_id:
            return self._from_category(product, self._cat_by_id[cid], conf, signals, reasoning)
        return self._uncontrolled(product, confidence=conf,
                                  reasoning=reasoning or "Not matched to a controlled category.",
                                  matched_keywords=signals)

    # ── Dimension 3: combine + decide (delegates to the pure functions) ───
    def combine_and_decide(self, country_status: dict, product_class: dict) -> dict:
        return combine_and_decide(country_status, product_class)

    def generate_explanation(self, country_status: dict, product_class: dict,
                             decision: dict) -> str:
        return generate_explanation(country_status, product_class, decision)

    # ── One-shot combined determination ───────────────────────────────────
    def determine_license_requirement(self, country: str, product_description: str,
                                      api_key: str | None = None) -> dict:
        """Run both checks, combine, and explain — the full answer in one call."""
        cs = self.check_country_status(country)
        pc = self.classify_control_category(product_description, api_key)
        decision = combine_and_decide(cs, pc)
        explanation = generate_explanation(cs, pc, decision)
        return {
            "country_status": cs,
            "product_classification": pc,
            "decision": decision,
            "outcome": decision["outcome"],
            "outcome_label": decision["outcome_label"],
            "explanation": explanation,
        }

    def stats(self) -> dict:
        levels = [c["level"] for c in self.countries.values()]
        return {
            "countries_tracked": len(self.countries),
            "embargoed": levels.count("embargoed"),
            "partial": levels.count("partial"),
            "control_categories": len(self.categories),
            "controlled": sum(c["control_level"] == "controlled" for c in self.categories),
            "dual_use": sum(c["control_level"] == "dual-use" for c in self.categories),
        }


@lru_cache(maxsize=1)
def load_engine() -> RulesEngine:
    """Build (and cache) the rules engine."""
    return RulesEngine()


if __name__ == "__main__":
    eng = load_engine()
    print("stats:", eng.stats())
    for c, p in [
        ("Germany", "men's cotton t-shirt"),
        ("Iran", "laptop computer"),
        ("Russia", "ordinary laptop computer"),
        ("France", "end-to-end encrypted messaging app"),
        ("China", "datacenter AI training GPU"),
    ]:
        r = eng.determine_license_requirement(c, p)
        print(f"\n{p!r} -> {c}: {r['outcome_label']}  ({r['decision']['driver']}-driven)")
        print("  ", r["explanation"])