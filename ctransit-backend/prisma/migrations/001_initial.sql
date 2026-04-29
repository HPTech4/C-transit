-- ============================================================
-- C-TRANSIT INITIAL MIGRATION
-- Run via: npx prisma migrate deploy
-- Or apply manually to your PostgreSQL instance.
-- ============================================================

-- Terminals: source of truth for fleet hardware state
CREATE TABLE terminals (
    terminal_id     VARCHAR(20) PRIMARY KEY,
    status          VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',   -- ONLINE | OFFLINE | LOCKED
    last_seen       TIMESTAMPTZ,
    active_driver_uid VARCHAR(20),
    secret_key      VARCHAR(64) NOT NULL DEFAULT 'UNPROVISIONED'
);

-- Transactions: immutable financial ledger
-- PRIMARY KEY = composite string from ESP32 hardware
-- ON CONFLICT DO NOTHING enforces idempotency
CREATE TABLE transactions (
    transaction_id  VARCHAR(50) PRIMARY KEY,                  -- e.g., T04-1708000500-A1B2C3D4
    terminal_id     VARCHAR(20) NOT NULL REFERENCES terminals(terminal_id),
    student_uid     VARCHAR(20) NOT NULL,
    amount          DECIMAL(10, 2) NOT NULL,
    driver_uid      VARCHAR(20),
    synced_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Wallets: internal balance ledger
-- Funded via Monnify webhooks. Deducted via bus taps.
CREATE TABLE wallets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_uid     VARCHAR(20) NOT NULL UNIQUE,
    balance         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_linked       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for high-frequency wallet lookups during tap ingestion
CREATE INDEX idx_wallets_student_uid ON wallets(student_uid);
CREATE INDEX idx_transactions_student_uid ON transactions(student_uid);
CREATE INDEX idx_transactions_terminal_id ON transactions(terminal_id);
CREATE INDEX idx_terminals_status ON terminals(status);
