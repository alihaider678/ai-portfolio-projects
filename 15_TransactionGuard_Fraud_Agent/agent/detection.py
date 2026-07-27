"""
TransactionGuard — rule-based detection engine.
================================================

Four deterministic checks, each looking only at an account's transaction
history *strictly before* the transaction being evaluated. These are called
selectively by the LangGraph agent (agent picks which to run, and when to
stop) rather than always running all four in a fixed order — see graph.py.

Every check returns a CheckResult: triggered/severity/detail is exactly what
the LLM reasoning nodes read, so the wording here IS the evidence the agent
reasons over.
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass, field
from datetime import datetime, timedelta


@dataclass
class CheckResult:
    check: str
    triggered: bool
    severity: str  # "none" | "low" | "medium" | "high"
    detail: str
    evidence: dict = field(default_factory=dict)


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def check_velocity(current: dict, history: list[dict], window_minutes: int = 60,
                    trigger_count: int = 4) -> CheckResult:
    """Unusual number of transactions in a short rolling window."""
    now = _parse(current["occurred_at"])
    window_start = now - timedelta(minutes=window_minutes)
    recent = [t for t in history if window_start <= _parse(t["occurred_at"]) < now]
    count = len(recent) + 1  # include current

    if count >= trigger_count:
        severity = "high" if count >= trigger_count + 2 else "medium"
        return CheckResult(
            check="velocity", triggered=True, severity=severity,
            detail=f"{count} transactions from account {current['account_id']} within "
                   f"the last {window_minutes} minutes (normal is well under {trigger_count}).",
            evidence={"count_in_window": count, "window_minutes": window_minutes},
        )
    return CheckResult(
        check="velocity", triggered=False, severity="none",
        detail=f"Only {count} transaction(s) in the last {window_minutes} minutes — normal cadence.",
        evidence={"count_in_window": count, "window_minutes": window_minutes},
    )


def check_amount_threshold(current: dict, history: list[dict], z_trigger: float = 4.0) -> CheckResult:
    """Amount far above the account's own historical mean (z-score)."""
    amounts = [t["amount"] for t in history]
    if len(amounts) < 5:
        return CheckResult(
            check="amount_threshold", triggered=False, severity="none",
            detail="Not enough transaction history yet to establish a baseline amount.",
            evidence={"history_size": len(amounts)},
        )
    mean = statistics.mean(amounts)
    stdev = statistics.pstdev(amounts) or 1.0
    z = (current["amount"] - mean) / stdev

    if z >= z_trigger:
        severity = "high" if z >= z_trigger * 1.5 else "medium"
        return CheckResult(
            check="amount_threshold", triggered=True, severity=severity,
            detail=f"Amount {current['amount']:.0f} {current.get('currency','PKR')} is "
                   f"{z:.1f}x standard deviations above this account's typical "
                   f"{mean:.0f} {current.get('currency','PKR')}.",
            evidence={"amount": current["amount"], "historical_mean": round(mean, 2), "z_score": round(z, 2)},
        )
    return CheckResult(
        check="amount_threshold", triggered=False, severity="none",
        detail=f"Amount {current['amount']:.0f} is within the account's normal range "
               f"(baseline mean ~{mean:.0f}, z-score {z:.1f}).",
        evidence={"amount": current["amount"], "historical_mean": round(mean, 2), "z_score": round(z, 2)},
    )


def check_geo_anomaly(current: dict, history: list[dict]) -> CheckResult:
    """Transaction from a city/country not seen in the account's recent history."""
    if not history:
        return CheckResult(
            check="geo_anomaly", triggered=False, severity="none",
            detail="No prior location history for this account yet.",
            evidence={},
        )
    known_cities = {t["city"] for t in history}
    known_countries = {t["country"] for t in history}

    if current["country"] not in known_countries:
        return CheckResult(
            check="geo_anomaly", triggered=True, severity="high",
            detail=f"Transaction originates from {current['city']}, {current['country']} — "
                   f"a country never seen before for this account (known: {sorted(known_countries)}).",
            evidence={"current_location": f"{current['city']}, {current['country']}",
                      "known_countries": sorted(known_countries)},
        )
    if current["city"] not in known_cities:
        return CheckResult(
            check="geo_anomaly", triggered=True, severity="medium",
            detail=f"Transaction originates from {current['city']} — a new city for this "
                   f"account (usual cities: {sorted(known_cities)}).",
            evidence={"current_location": f"{current['city']}, {current['country']}",
                      "known_cities": sorted(known_cities)},
        )
    return CheckResult(
        check="geo_anomaly", triggered=False, severity="none",
        detail=f"{current['city']} is a familiar location for this account.",
        evidence={"current_location": f"{current['city']}, {current['country']}"},
    )


def check_device_fingerprint(current: dict, history: list[dict]) -> CheckResult:
    """Transaction from a device never associated with this account before."""
    known_devices = {t["device_id"] for t in history if t.get("device_id")}
    if not known_devices:
        return CheckResult(
            check="device_fingerprint", triggered=False, severity="none",
            detail="No prior device history for this account yet.",
            evidence={},
        )
    if current.get("device_id") not in known_devices:
        return CheckResult(
            check="device_fingerprint", triggered=True, severity="medium",
            detail=f"Device {current.get('device_id')} has never been used by this account before "
                   f"({len(known_devices)} known device(s)).",
            evidence={"device_id": current.get("device_id"), "known_device_count": len(known_devices)},
        )
    return CheckResult(
        check="device_fingerprint", triggered=False, severity="none",
        detail="Device matches one previously used by this account.",
        evidence={"device_id": current.get("device_id")},
    )


CHECKS = {
    "check_velocity": check_velocity,
    "check_amount_threshold": check_amount_threshold,
    "check_geo_anomaly": check_geo_anomaly,
    "check_device_fingerprint": check_device_fingerprint,
}


def run_check(name: str, current: dict, history: list[dict]) -> CheckResult:
    fn = CHECKS.get(name)
    if fn is None:
        raise ValueError(f"Unknown check: {name}")
    return fn(current, history)