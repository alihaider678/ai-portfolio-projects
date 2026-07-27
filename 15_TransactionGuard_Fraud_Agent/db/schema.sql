-- TransactionGuard v2 — Postgres schema (Postgres + pgvector, single DB for
-- transactional data AND episodic-memory vector search).
--
-- Run automatically by docker-compose (mounted into
-- /docker-entrypoint-initdb.d/) on first container start. For Supabase, run
-- this file once via the SQL editor after creating the project.

create extension if not exists vector;
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ── Accounts (wallet holders) ────────────────────────────────────────────
create table if not exists accounts (
  account_id    text primary key,
  display_name  text not null,
  home_city     text not null,
  home_country  text not null default 'Pakistan',
  device_ids    text[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- ── Transactions (synthetic + baseline history) ──────────────────────────
-- is_synthetic_anomaly / anomaly_type are GROUND TRUTH labels used only by
-- our own accuracy evaluation script — the agent never reads these columns.
create table if not exists transactions (
  id                    uuid primary key default gen_random_uuid(),
  transaction_id        text unique not null,
  account_id            text not null references accounts(account_id),
  counterparty_id       text,
  amount                numeric(14, 2) not null,
  currency              text not null default 'PKR',
  method                text not null,              -- wallet_transfer | pos | atm | online
  city                  text not null,
  country               text not null default 'Pakistan',
  device_id             text,
  occurred_at           timestamptz not null,
  is_synthetic_anomaly  boolean not null default false,
  anomaly_type          text,                        -- velocity | amount_spike | geo_jump | new_device | null
  created_at            timestamptz not null default now()
);
create index if not exists idx_transactions_account_time on transactions (account_id, occurred_at desc);
create index if not exists idx_transactions_txid on transactions (transaction_id);

-- ── Investigations (one per transaction that was run through the agent) ──
create table if not exists investigations (
  id                 uuid primary key default gen_random_uuid(),
  transaction_id     text not null references transactions(transaction_id),
  status             text not null default 'running',   -- running | complete | error
  risk_level         text,                               -- LOW | MEDIUM | HIGH
  action             text,                               -- monitor | hold | escalate
  explanation        text,
  hypothesis         text,                               -- triage_hypothesis's initial reasoning
  checks_run         text[] not null default '{}',
  reasoning_trail    jsonb not null default '[]',         -- ordered list of {node, input, output, reasoning}
  precedent_used     jsonb,                                -- the retrieved precedent, if any
  iterations         int not null default 0,
  analyst_feedback   text,                                 -- confirmed_fraud | false_positive | null
  analyst_id         uuid,
  feedback_at        timestamptz,
  created_at         timestamptz not null default now(),
  completed_at       timestamptz
);
create index if not exists idx_investigations_txid on investigations (transaction_id);
create index if not exists idx_investigations_status on investigations (status);

-- ── Episodic memory (vector precedent store) ─────────────────────────────
-- text-embedding-3-small → 1536 dims.
create table if not exists precedents (
  id               uuid primary key default gen_random_uuid(),
  investigation_id uuid not null references investigations(id),
  account_id       text not null references accounts(account_id),
  summary          text not null,       -- natural-language description of the pattern + outcome
  risk_level       text not null,
  action           text not null,
  embedding        vector(1536) not null,
  created_at       timestamptz not null default now()
);
create index if not exists idx_precedents_embedding
  on precedents using hnsw (embedding vector_cosine_ops);

-- ── Analysts (ops dashboard login) ───────────────────────────────────────
create table if not exists analysts (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);