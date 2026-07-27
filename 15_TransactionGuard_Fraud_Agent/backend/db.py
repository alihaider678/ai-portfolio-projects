"""Postgres access layer (asyncpg pool) — transactions, accounts, investigations, precedents."""
from __future__ import annotations

import json
import os
from typing import Optional

import asyncpg

_pool: Optional[asyncpg.Pool] = None


async def init_pool() -> Optional[asyncpg.Pool]:
    global _pool
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        return None
    _pool = await asyncpg.create_pool(url, min_size=1, max_size=8)
    return _pool


async def close_pool() -> None:
    if _pool is not None:
        await _pool.close()


def get_pool() -> Optional[asyncpg.Pool]:
    return _pool


async def get_account(account_id: str) -> Optional[dict]:
    if _pool is None:
        return None
    async with _pool.acquire() as conn:
        row = await conn.fetchrow("select * from accounts where account_id = $1", account_id)
        if not row:
            return None
        account = dict(row)
        account["created_at"] = account["created_at"].isoformat()
        return account


async def list_accounts() -> list[dict]:
    """Accounts + transaction/anomaly counts, for the frontend's picker (so a reviewer can
    find an interesting transaction without guessing)."""
    if _pool is None:
        return []
    async with _pool.acquire() as conn:
        rows = await conn.fetch(
            """
            select a.account_id, a.display_name, a.home_city, a.home_country,
                   count(t.id) as transaction_count,
                   count(t.id) filter (where t.is_synthetic_anomaly) as anomaly_count
            from accounts a
            left join transactions t on t.account_id = a.account_id
            group by a.account_id, a.display_name, a.home_city, a.home_country
            order by a.account_id
            """
        )
        return [dict(r) for r in rows]


async def get_history(account_id: str, before: Optional[str] = None, limit: int = 500) -> list[dict]:
    """Transaction history for an account, strictly before `before` (ISO timestamp) if given."""
    if _pool is None:
        return []
    async with _pool.acquire() as conn:
        if before:
            rows = await conn.fetch(
                """select * from transactions where account_id = $1 and occurred_at < $2
                   order by occurred_at asc limit $3""",
                account_id, before, limit,
            )
        else:
            rows = await conn.fetch(
                """select * from transactions where account_id = $1
                   order by occurred_at asc limit $2""",
                account_id, limit,
            )
        return [_serialize_txn(dict(r)) for r in rows]


def _serialize_txn(row: dict) -> dict:
    row["occurred_at"] = row["occurred_at"].isoformat()
    row["amount"] = float(row["amount"])
    row.pop("created_at", None)
    row.pop("id", None)
    return row


async def get_transaction(transaction_id: str) -> Optional[dict]:
    if _pool is None:
        return None
    async with _pool.acquire() as conn:
        row = await conn.fetchrow("select * from transactions where transaction_id = $1", transaction_id)
        return _serialize_txn(dict(row)) if row else None


async def create_investigation(investigation_id: str, transaction_id: str) -> None:
    async with _pool.acquire() as conn:
        await conn.execute(
            "insert into investigations (id, transaction_id, status) values ($1, $2, 'running')",
            investigation_id, transaction_id,
        )


async def complete_investigation(investigation_id: str, state: dict) -> None:
    async with _pool.acquire() as conn:
        await conn.execute(
            """
            update investigations set
                status = 'complete', risk_level = $2, action = $3, explanation = $4,
                hypothesis = $5, checks_run = $6, reasoning_trail = $7::jsonb,
                precedent_used = $8::jsonb, iterations = $9, completed_at = now()
            where id = $1
            """,
            investigation_id, state.get("risk_level"), state.get("action"), state.get("explanation"),
            state.get("hypothesis"), state.get("checks_run", []),
            json.dumps(state.get("reasoning_trail", [])),
            json.dumps(state.get("precedent")) if state.get("precedent") else None,
            state.get("iterations", 0),
        )


async def fail_investigation(investigation_id: str, error: str) -> None:
    async with _pool.acquire() as conn:
        await conn.execute(
            "update investigations set status = 'error', explanation = $2, completed_at = now() where id = $1",
            investigation_id, error,
        )


async def get_investigation(investigation_id: str) -> Optional[dict]:
    if _pool is None:
        return None
    async with _pool.acquire() as conn:
        row = await conn.fetchrow(
            """select i.*, t.account_id, t.amount, t.city, t.country, t.method, t.occurred_at
               from investigations i join transactions t on t.transaction_id = i.transaction_id
               where i.id = $1""",
            investigation_id,
        )
        return _serialize_investigation(dict(row)) if row else None


async def list_investigations(limit: int = 50, risk_level: Optional[str] = None,
                                status: Optional[str] = None) -> list[dict]:
    if _pool is None:
        return []
    async with _pool.acquire() as conn:
        query = """select i.*, t.account_id, t.amount, t.city, t.country, t.method, t.occurred_at
                   from investigations i join transactions t on t.transaction_id = i.transaction_id
                   where 1=1"""
        params: list = []
        if risk_level:
            params.append(risk_level)
            query += f" and i.risk_level = ${len(params)}"
        if status:
            params.append(status)
            query += f" and i.status = ${len(params)}"
        query += f" order by i.created_at desc limit ${len(params) + 1}"
        params.append(limit)
        rows = await conn.fetch(query, *params)
        return [_serialize_investigation(dict(r)) for r in rows]


def _serialize_investigation(row: dict) -> dict:
    for key in ("created_at", "completed_at", "feedback_at", "occurred_at"):
        if row.get(key) is not None:
            row[key] = row[key].isoformat()
    if row.get("amount") is not None:
        row["amount"] = float(row["amount"])
    for key in ("reasoning_trail", "precedent_used"):
        if isinstance(row.get(key), str):
            row[key] = json.loads(row[key])
    row["id"] = str(row["id"])
    if row.get("analyst_id"):
        row["analyst_id"] = str(row["analyst_id"])
    return row


async def set_feedback(investigation_id: str, feedback: str, analyst_id: str) -> None:
    async with _pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                """update investigations set analyst_feedback = $2, analyst_id = $3, feedback_at = now()
                   where id = $1""",
                investigation_id, feedback, analyst_id,
            )
            corrected_risk = "HIGH" if feedback == "confirmed_fraud" else "LOW"
            corrected_action = "escalate" if feedback == "confirmed_fraud" else "monitor"
            await conn.execute(
                """update precedents set risk_level = $2, action = $3
                   where investigation_id = $1""",
                investigation_id, corrected_risk, corrected_action,
            )


async def get_precedents(account_id: Optional[str] = None, limit: int = 20) -> list[dict]:
    if _pool is None:
        return []
    async with _pool.acquire() as conn:
        if account_id:
            rows = await conn.fetch(
                """select id, investigation_id, account_id, summary, risk_level, action, created_at
                   from precedents where account_id = $1 order by created_at desc limit $2""",
                account_id, limit,
            )
        else:
            rows = await conn.fetch(
                """select id, investigation_id, account_id, summary, risk_level, action, created_at
                   from precedents order by created_at desc limit $1""",
                limit,
            )
        out = []
        for r in rows:
            d = dict(r)
            d["id"], d["investigation_id"] = str(d["id"]), str(d["investigation_id"])
            d["created_at"] = d["created_at"].isoformat()
            out.append(d)
        return out


async def get_stats() -> dict:
    if _pool is None:
        return {"total_accounts": 0, "total_transactions": 0, "total_investigations": 0,
                "flagged_count": 0, "flagged_pct": 0.0, "risk_distribution": {}}
    async with _pool.acquire() as conn:
        total_accounts = await conn.fetchval("select count(*) from accounts")
        total_transactions = await conn.fetchval("select count(*) from transactions")
        total_investigations = await conn.fetchval("select count(*) from investigations where status = 'complete'")
        flagged = await conn.fetchval(
            "select count(*) from investigations where status = 'complete' and risk_level in ('MEDIUM','HIGH')")
        rows = await conn.fetch(
            """select risk_level, count(*) as n from investigations
               where status = 'complete' group by risk_level""")
        distribution = {r["risk_level"]: r["n"] for r in rows if r["risk_level"]}
    return {
        "total_accounts": total_accounts,
        "total_transactions": total_transactions,
        "total_investigations": total_investigations,
        "flagged_count": flagged,
        "flagged_pct": round(100 * flagged / total_investigations, 1) if total_investigations else 0.0,
        "risk_distribution": distribution,
    }