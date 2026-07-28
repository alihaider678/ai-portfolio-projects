"""
SQLite access layer — mock accounts/transactions (seeded once from
data/mock_transactions.json), chat sessions/messages, structured per-turn
conversation logging, and demo-key rate-limit counters.

SQLite (not Postgres/Redis) is enough here: the "account data" is static
synthetic seed data regenerated at boot, and session/demo-limit state is
disposable — no need for external infra for this project.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import aiosqlite

DB_PATH = os.environ.get("DATABASE_PATH", str(Path(__file__).parent / "walletassist.db"))
MOCK_DATA_FILE = Path(__file__).parent.parent / "data" / "mock_transactions.json"

SCHEMA = """
CREATE TABLE IF NOT EXISTS accounts (
    account_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    method TEXT NOT NULL,
    biller TEXT,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    reason_code TEXT,
    reason_text TEXT,
    occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_txn_account ON transactions(account_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    last_active_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    path_taken TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, id);

CREATE TABLE IF NOT EXISTS conversation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    intent TEXT NOT NULL,
    path_taken TEXT NOT NULL,
    account_id TEXT,
    transaction_id TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS demo_key_usage (
    ip TEXT NOT NULL,
    window_start TEXT NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (ip, window_start)
);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        await db.commit()

        cur = await db.execute("SELECT COUNT(*) FROM accounts")
        (count,) = await cur.fetchone()
        if count == 0:
            await _seed(db)


async def _seed(db: aiosqlite.Connection) -> None:
    data = json.loads(MOCK_DATA_FILE.read_text(encoding="utf-8"))
    await db.executemany(
        "INSERT INTO accounts (account_id, display_name) VALUES (?, ?)",
        [(a["account_id"], a["display_name"]) for a in data["accounts"]],
    )
    await db.executemany(
        """INSERT INTO transactions
           (transaction_id, account_id, method, biller, amount, currency, status,
            reason_code, reason_text, occurred_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            (t["transaction_id"], t["account_id"], t["method"], t["biller"], t["amount"],
             t["currency"], t["status"], t["reason_code"], t["reason_text"], t["occurred_at"])
            for t in data["transactions"]
        ],
    )
    await db.commit()


async def list_accounts() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            """SELECT a.account_id, a.display_name, COUNT(t.transaction_id) AS transaction_count
               FROM accounts a LEFT JOIN transactions t ON t.account_id = a.account_id
               GROUP BY a.account_id ORDER BY a.account_id"""
        )
        return [dict(r) for r in await cur.fetchall()]


async def get_transaction(transaction_id: Optional[str] = None, account_id: Optional[str] = None) -> Optional[dict]:
    """Look up a specific transaction by ID, or fall back to the most recent
    transaction for the given account. This backs the agent's lookup_transaction tool."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if transaction_id:
            cur = await db.execute("SELECT * FROM transactions WHERE transaction_id = ?", (transaction_id,))
        elif account_id:
            cur = await db.execute(
                "SELECT * FROM transactions WHERE account_id = ? ORDER BY occurred_at DESC LIMIT 1",
                (account_id,),
            )
        else:
            return None
        row = await cur.fetchone()
        return dict(row) if row else None


async def get_account_history(account_id: str, limit: int = 10) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT * FROM transactions WHERE account_id = ? ORDER BY occurred_at DESC LIMIT ?",
            (account_id, limit),
        )
        return [dict(r) for r in await cur.fetchall()]


async def ensure_session(session_id: str) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        now = _now()
        await db.execute(
            """INSERT INTO sessions (session_id, created_at, last_active_at) VALUES (?, ?, ?)
               ON CONFLICT(session_id) DO UPDATE SET last_active_at = excluded.last_active_at""",
            (session_id, now, now),
        )
        await db.commit()


async def get_session_history(session_id: str, limit: int = 8) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?",
            (session_id, limit),
        )
        rows = await cur.fetchall()
        return [dict(r) for r in reversed(rows)]


async def log_message(session_id: str, role: str, content: str, path_taken: Optional[str] = None) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO messages (session_id, role, content, path_taken, created_at) VALUES (?, ?, ?, ?, ?)",
            (session_id, role, content, path_taken, _now()),
        )
        await db.commit()


async def log_turn(session_id: str, intent: str, path_taken: str,
                    account_id: Optional[str], transaction_id: Optional[str]) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO conversation_log
               (session_id, intent, path_taken, account_id, transaction_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (session_id, intent, path_taken, account_id, transaction_id, _now()),
        )
        await db.commit()


async def check_and_increment_demo_usage(ip: str, limit_per_hour: int = 5) -> bool:
    """Returns True if this request is allowed under the demo-key rate limit."""
    window_start = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00:00")
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "SELECT count FROM demo_key_usage WHERE ip = ? AND window_start = ?", (ip, window_start)
        )
        row = await cur.fetchone()
        current = row[0] if row else 0
        if current >= limit_per_hour:
            return False
        await db.execute(
            """INSERT INTO demo_key_usage (ip, window_start, count) VALUES (?, ?, 1)
               ON CONFLICT(ip, window_start) DO UPDATE SET count = count + 1""",
            (ip, window_start),
        )
        await db.commit()
        return True