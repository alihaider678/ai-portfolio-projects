"""
LicenseGuard — evaluation harness
=================================

Runs the labeled test set (testset.json) through the decision engine and reports
accuracy on the license OUTCOME (and, secondarily, the decision DRIVER). This is
the "agentic eval" that guards against regressions in the classification LLM or
the decision matrix.

Usage:
    python run_eval.py                # run the engine directly (fast)
    python run_eval.py --graph        # run through the full LangGraph agent
    python run_eval.py --json out.json

Exit code is non-zero if outcome accuracy is below --min (default 0.9), so it can
gate CI.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "mcp_server"))
sys.path.insert(0, str(ROOT / "agent"))

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # noqa: BLE001
    pass

TESTSET = Path(__file__).parent / "testset.json"


def run_engine(cases: list[dict]) -> list[dict]:
    from rules_engine import load_engine
    eng = load_engine()
    out = []
    for c in cases:
        r = eng.determine_license_requirement(c["country"], c["product"])
        out.append({"outcome": r["outcome"], "driver": r["decision"]["driver"]})
    return out


def run_graph(cases: list[dict]) -> list[dict]:
    from graph import build_graph, run_query
    from tools import DirectTools
    compiled = build_graph(DirectTools())
    out = []
    for c in cases:
        r = run_query(compiled, product=c["product"], country=c["country"])
        out.append({"outcome": r["outcome"], "driver": r["decision"]["driver"]})
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description="LicenseGuard eval harness")
    ap.add_argument("--graph", action="store_true", help="Run through the LangGraph agent")
    ap.add_argument("--min", type=float, default=0.9, help="Min outcome accuracy to pass")
    ap.add_argument("--json", default="", help="Write a JSON report to this path")
    args = ap.parse_args()

    cases = json.loads(TESTSET.read_text(encoding="utf-8"))["cases"]
    preds = run_graph(cases) if args.graph else run_engine(cases)

    outcome_hits = driver_hits = 0
    rows = []
    for c, p in zip(cases, preds):
        ok = p["outcome"] == c["expected_outcome"]
        dok = p["driver"] == c.get("expected_driver", p["driver"])
        outcome_hits += ok
        driver_hits += dok
        rows.append({**c, "got_outcome": p["outcome"], "got_driver": p["driver"],
                     "outcome_ok": ok, "driver_ok": dok})

    n = len(cases)
    acc = outcome_hits / n
    dacc = driver_hits / n

    print(f"\nLicenseGuard eval — {'graph' if args.graph else 'engine'} · {n} cases")
    print("=" * 74)
    for r in rows:
        mark = "PASS" if r["outcome_ok"] else "FAIL"
        dmark = "" if r["driver_ok"] else f"  [driver: got {r['got_driver']}, want {r['expected_driver']}]"
        print(f"  [{mark}] {r['product'][:34]:<34} -> {r['country']:<13} "
              f"{r['got_outcome']}{dmark}")
    print("=" * 74)
    print(f"  Outcome accuracy : {outcome_hits}/{n} = {acc:.1%}")
    print(f"  Driver  accuracy : {driver_hits}/{n} = {dacc:.1%}")

    if args.json:
        Path(args.json).write_text(json.dumps(
            {"n": n, "outcome_accuracy": acc, "driver_accuracy": dacc, "rows": rows},
            indent=2), encoding="utf-8")
        print(f"  Report written   : {args.json}")

    if acc < args.min:
        print(f"\nFAILED: outcome accuracy {acc:.1%} < threshold {args.min:.0%}")
        sys.exit(1)
    print(f"\nPASSED: outcome accuracy {acc:.1%} >= threshold {args.min:.0%}")


if __name__ == "__main__":
    main()