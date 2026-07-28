"""
Generates a synthetic set of wallet transactions for the lookup_transaction tool.

Entirely fictional accounts/transaction IDs and amounts — no real Keenu customer
data exists or is used anywhere in this project. Only the FAQ text (data/keenu_faqs.json)
is real, publicly published content; everything account/transaction-shaped here is
fabricated purely to give the agent something realistic to look up.
"""
from __future__ import annotations

import json
import random
from pathlib import Path

OUT_FILE = Path(__file__).parent / "mock_transactions.json"

FIRST_NAMES = ["Ayesha", "Bilal", "Sara", "Usman", "Fatima", "Ahmed", "Zainab", "Hassan", "Nida", "Imran"]
LAST_NAMES = ["Khan", "Malik", "Chaudhry", "Butt", "Sheikh", "Raza", "Qureshi"]

BILLERS = ["K-Electric", "SSGC", "PTCL", "Jazz Postpaid", "Zong Postpaid", "IESCO", "LESCO"]
METHODS = ["bill_payment", "mobile_topup", "p2p_transfer", "ibft", "online_payment"]

STATUSES = [
    ("success", None, 0.62),
    ("failed", "insufficient_balance", 0.14),
    ("failed", "daily_limit_exceeded", 0.08),
    ("failed", "network_timeout", 0.07),
    ("pending", "processing_delay", 0.06),
    ("failed", "biller_service_unavailable", 0.03),
]

REASON_TEXT = {
    "insufficient_balance": "Your Keenu wallet balance was lower than the transaction amount at the time of payment.",
    "daily_limit_exceeded": "This transaction would have pushed you past your daily transaction limit for your current verification tier.",
    "network_timeout": "The request timed out communicating with the biller/network — a temporary connectivity issue, not an account problem.",
    "processing_delay": "The transaction is still being confirmed by the biller/network — this can take a few minutes to clear.",
    "biller_service_unavailable": "The biller's system was temporarily unavailable when the payment was attempted.",
}


def weighted_status(rng: random.Random):
    r = rng.random()
    cum = 0.0
    for status, reason, weight in STATUSES:
        cum += weight
        if r <= cum:
            return status, reason
    return STATUSES[-1][0], STATUSES[-1][1]


def generate(num_accounts: int = 25, txns_per_account: int = 8, seed: int = 42) -> dict:
    rng = random.Random(seed)
    accounts = []
    transactions = []

    for i in range(1, num_accounts + 1):
        account_id = f"WA-{i:04d}"
        name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        accounts.append({"account_id": account_id, "display_name": name})

        for j in range(1, txns_per_account + 1):
            txn_id = f"TXN-{i:04d}-{j:03d}"
            method = rng.choice(METHODS)
            status, reason = weighted_status(rng)
            amount = round(rng.uniform(150, 15000), 0)
            biller = rng.choice(BILLERS) if method in ("bill_payment",) else None

            transactions.append({
                "transaction_id": txn_id,
                "account_id": account_id,
                "method": method,
                "biller": biller,
                "amount": amount,
                "currency": "PKR",
                "status": status,
                "reason_code": reason,
                "reason_text": REASON_TEXT.get(reason),
                "occurred_at": f"2026-07-{rng.randint(1, 27):02d}T{rng.randint(0, 23):02d}:{rng.randint(0, 59):02d}:00Z",
            })

    return {"accounts": accounts, "transactions": transactions}


if __name__ == "__main__":
    data = generate()
    OUT_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Generated {len(data['accounts'])} accounts / {len(data['transactions'])} transactions -> {OUT_FILE}")