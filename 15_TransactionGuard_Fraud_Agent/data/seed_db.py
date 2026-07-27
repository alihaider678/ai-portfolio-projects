"""
Seed the Postgres database with the generated synthetic dataset
(accounts.json, transactions.json — see generate_synthetic_data.py).

Uses the same DATABASE_URL as the backend (.env at the project root). Safe
to re-run: truncates accounts/transactions/investigations/precedents first
(schema.sql's tables only — analysts are left untouched).

Run (from backend's venv, which already has asyncpg + python-dotenv):
    python seed_db.py
"""
from __future__ import annotations

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL", "")


async def main() -> None:
    if not DATABASE_URL:
        raise SystemExit("DATABASE_URL is not set — copy .env.example to .env first.")

    accounts = json.loads((Path(__file__).parent / "accounts.json").read_text(encoding="utf-8"))
    transactions = json.loads((Path(__file__).parent / "transactions.json").read_text(encoding="utf-8"))

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute("truncate precedents, investigations, transactions, accounts cascade")

        await conn.executemany(
            """
            insert into accounts (account_id, display_name, home_city, home_country, device_ids)
            values ($1, $2, $3, $4, $5)
            """,
            [(a["account_id"], a["display_name"], a["home_city"], a["home_country"], a["device_ids"])
             for a in accounts],
        )

        await conn.executemany(
            """
            insert into transactions
                (transaction_id, account_id, counterparty_id, amount, currency, method,
                 city, country, device_id, occurred_at, is_synthetic_anomaly, anomaly_type)
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            """,
            [(t["transaction_id"], t["account_id"], t["counterparty_id"], t["amount"], t["currency"],
              t["method"], t["city"], t["country"], t["device_id"], datetime.fromisoformat(t["occurred_at"]),
              t["is_synthetic_anomaly"], t["anomaly_type"])
             for t in transactions],
        )

        acc_count = await conn.fetchval("select count(*) from accounts")
        txn_count = await conn.fetchval("select count(*) from transactions")
        print(f"Seeded {acc_count} accounts, {txn_count} transactions.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())