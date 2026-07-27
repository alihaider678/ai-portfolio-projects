"""
TransactionGuard — synthetic transaction data generator.
=========================================================

There is no real Keenu/wallet transaction data available, so this script
generates a realistic-looking but entirely synthetic dataset: ~50 mock
accounts with 60-90 days of "normal" transaction history, plus a deliberate
set of injected anomalies (velocity bursts, amount spikes, geo jumps, and
new-device transactions) covering every rule the detection engine checks.

is_synthetic_anomaly / anomaly_type are GROUND TRUTH labels for our own
accuracy evaluation later — the agent is never shown these two fields.

Output: data/accounts.json, data/transactions.json (deterministic given SEED,
via random.Random(SEED) rather than the module-level random state).

Run:
    python generate_synthetic_data.py
"""
from __future__ import annotations

import json
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

SEED = 42
NUM_ACCOUNTS = 50
HISTORY_DAYS = 75
ANOMALY_ACCOUNT_FRACTION = 0.16  # ~8 of 50 accounts get an injected anomaly

CITIES = [
    ("Karachi", "Pakistan"), ("Lahore", "Pakistan"), ("Islamabad", "Pakistan"),
    ("Rawalpindi", "Pakistan"), ("Faisalabad", "Pakistan"), ("Multan", "Pakistan"),
    ("Peshawar", "Pakistan"), ("Quetta", "Pakistan"), ("Sialkot", "Pakistan"),
    ("Hyderabad", "Pakistan"), ("Gujranwala", "Pakistan"), ("Bahawalpur", "Pakistan"),
]
FAR_CITIES = [("Dubai", "UAE"), ("Doha", "Qatar"), ("Riyadh", "Saudi Arabia"),
              ("Istanbul", "Turkey"), ("London", "UK")]
METHODS = ["wallet_transfer", "pos", "online", "atm"]
FIRST_NAMES = ["Ahmed", "Bilal", "Sara", "Ayesha", "Usman", "Hamza", "Zainab", "Fatima",
               "Ali", "Hassan", "Nida", "Kamran", "Sana", "Imran", "Mariam", "Tariq"]
LAST_NAMES = ["Khan", "Malik", "Butt", "Chaudhry", "Raza", "Sheikh", "Qureshi", "Iqbal"]

rng = random.Random(SEED)


def make_account(i: int) -> dict:
    city, country = rng.choice(CITIES)
    name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
    account_id = f"ACC-{i:04d}"
    primary_device = f"DEV-{uuid.UUID(int=rng.getrandbits(128)).hex[:10]}"
    return {
        "account_id": account_id,
        "display_name": name,
        "home_city": city,
        "home_country": country,
        "device_ids": [primary_device],
        "_typical_amount": round(rng.uniform(800, 6000), 2),  # PKR, internal use only
    }


def make_normal_txn(account: dict, occurred_at: datetime) -> dict:
    amount = max(50.0, rng.gauss(account["_typical_amount"], account["_typical_amount"] * 0.28))
    return {
        "transaction_id": f"TXN-{uuid.uuid4().hex[:12]}",
        "account_id": account["account_id"],
        "counterparty_id": f"MER-{rng.randint(1000, 9999)}",
        "amount": round(amount, 2),
        "currency": "PKR",
        "method": rng.choice(METHODS),
        "city": account["home_city"],
        "country": account["home_country"],
        "device_id": account["device_ids"][0],
        "occurred_at": occurred_at.isoformat(),
        "is_synthetic_anomaly": False,
        "anomaly_type": None,
    }


def inject_velocity_burst(account: dict, base_time: datetime) -> list[dict]:
    burst = []
    t = base_time
    for _ in range(rng.randint(5, 8)):
        t = t + timedelta(minutes=rng.randint(3, 12))
        txn = make_normal_txn(account, t)
        txn["is_synthetic_anomaly"] = True
        txn["anomaly_type"] = "velocity"
        burst.append(txn)
    return burst


def inject_amount_spike(account: dict, at: datetime) -> dict:
    txn = make_normal_txn(account, at)
    txn["amount"] = round(account["_typical_amount"] * rng.uniform(8, 15), 2)
    txn["is_synthetic_anomaly"] = True
    txn["anomaly_type"] = "amount_spike"
    return txn


def inject_geo_jump(account: dict, at: datetime) -> dict:
    city, country = rng.choice(FAR_CITIES)
    txn = make_normal_txn(account, at)
    txn["city"], txn["country"] = city, country
    txn["is_synthetic_anomaly"] = True
    txn["anomaly_type"] = "geo_jump"
    return txn


def inject_new_device(account: dict, at: datetime) -> dict:
    txn = make_normal_txn(account, at)
    txn["device_id"] = f"DEV-{uuid.uuid4().hex[:10]}"
    txn["is_synthetic_anomaly"] = True
    txn["anomaly_type"] = "new_device"
    return txn


def build_dataset() -> tuple[list[dict], list[dict]]:
    now = datetime.now(timezone.utc)
    accounts = [make_account(i) for i in range(1, NUM_ACCOUNTS + 1)]
    anomaly_accounts = rng.sample(accounts, max(1, round(NUM_ACCOUNTS * ANOMALY_ACCOUNT_FRACTION)))
    anomaly_ids = {a["account_id"] for a in anomaly_accounts}
    injectors = [inject_velocity_burst, inject_amount_spike, inject_geo_jump, inject_new_device]

    all_txns: list[dict] = []
    for account in accounts:
        history_start = now - timedelta(days=HISTORY_DAYS)
        num_normal = rng.randint(20, 45)
        for _ in range(num_normal):
            offset = timedelta(days=rng.uniform(0, HISTORY_DAYS), hours=rng.uniform(0, 23))
            all_txns.append(make_normal_txn(account, history_start + offset))

        if account["account_id"] in anomaly_ids:
            # anomalies land in the most recent 3 days so the demo can surface them as "current"
            recent_window = now - timedelta(days=rng.uniform(0.2, 3))
            chosen = rng.sample(injectors, k=rng.randint(1, 2))
            for injector in chosen:
                result = injector(account, recent_window)
                if isinstance(result, list):
                    all_txns.extend(result)
                else:
                    all_txns.append(result)
                recent_window += timedelta(hours=rng.uniform(1, 10))

    all_txns.sort(key=lambda t: t["occurred_at"])
    for account in accounts:
        account.pop("_typical_amount", None)
    return accounts, all_txns


def main() -> None:
    accounts, transactions = build_dataset()
    out_dir = Path(__file__).parent
    (out_dir / "accounts.json").write_text(json.dumps(accounts, indent=2), encoding="utf-8")
    (out_dir / "transactions.json").write_text(json.dumps(transactions, indent=2), encoding="utf-8")

    anomaly_count = sum(1 for t in transactions if t["is_synthetic_anomaly"])
    by_type: dict[str, int] = {}
    for t in transactions:
        if t["anomaly_type"]:
            by_type[t["anomaly_type"]] = by_type.get(t["anomaly_type"], 0) + 1

    print(f"Accounts:      {len(accounts)}")
    print(f"Transactions:  {len(transactions)}  ({anomaly_count} labeled anomalies, "
          f"{anomaly_count / len(transactions):.1%})")
    print(f"Anomaly types: {by_type}")
    print(f"Written to:    {out_dir / 'accounts.json'}, {out_dir / 'transactions.json'}")


if __name__ == "__main__":
    main()