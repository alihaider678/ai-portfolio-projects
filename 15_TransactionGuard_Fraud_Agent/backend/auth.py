"""Analyst login (JWT in an httpOnly cookie) — gates the ops dashboard's feedback actions
(confirm fraud / mark false positive). Public investigate/history/stats endpoints don't need this."""
from __future__ import annotations

import os
import time
import uuid
from typing import Optional

import bcrypt
from jose import JWTError, jwt

ANALYST_COOKIE = "tg_analyst"
ALGORITHM = "HS256"
EXPIRY_SECONDS = 7 * 24 * 3600


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_token(analyst_id: str, username: str) -> str:
    payload = {"sub": analyst_id, "username": username, "exp": int(time.time()) + EXPIRY_SECONDS}
    return jwt.encode(payload, _secret(), algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, _secret(), algorithms=[ALGORITHM])
    except JWTError:
        return None


async def bootstrap_analyst(pool) -> None:
    """Create the single ops analyst account from env vars if none exists yet."""
    if pool is None:
        return
    username = os.environ.get("ANALYST_USERNAME", "analyst")
    password = os.environ.get("ANALYST_PASSWORD", "")
    if not password:
        return
    async with pool.acquire() as conn:
        exists = await conn.fetchval("select 1 from analysts where username = $1", username)
        if not exists:
            await conn.execute(
                "insert into analysts (id, username, password_hash) values ($1, $2, $3)",
                str(uuid.uuid4()), username, hash_password(password),
            )


async def authenticate(pool, username: str, password: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("select * from analysts where username = $1", username)
    if row and verify_password(password, row["password_hash"]):
        return {"id": str(row["id"]), "username": row["username"]}
    return None