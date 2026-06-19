-- ============================================================
-- V1: Initial Schema – Nova Bank
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL    PRIMARY KEY,
    auth0_sub  TEXT         NOT NULL UNIQUE,
    email      TEXT,
    full_name  TEXT,
    picture    TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_auth0_sub ON users (auth0_sub);

CREATE TYPE account_type AS ENUM ('SAVINGS', 'CURRENT', 'FIXED_DEPOSIT');

CREATE TABLE IF NOT EXISTS accounts (
    id             BIGSERIAL        PRIMARY KEY,
    user_id        BIGINT           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    account_number TEXT             NOT NULL UNIQUE,
    account_name   TEXT             NOT NULL,
    account_type   account_type     NOT NULL DEFAULT 'SAVINGS',
    balance        NUMERIC(14, 2)   NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_number  ON accounts (account_number);

CREATE TYPE transaction_status AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

CREATE TABLE IF NOT EXISTS transactions (
    id                  BIGSERIAL           PRIMARY KEY,
    from_account_id     BIGINT              REFERENCES accounts (id),
    to_account_id       BIGINT              REFERENCES accounts (id),
    amount              NUMERIC(14, 2)      NOT NULL CHECK (amount > 0),
    description         TEXT,
    reference_number    TEXT                NOT NULL UNIQUE,
    status              transaction_status  NOT NULL DEFAULT 'SUCCESS',
    created_by_user_id  BIGINT              REFERENCES users (id),
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_from   ON transactions (from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to     ON transactions (to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ref    ON transactions (reference_number);
CREATE INDEX IF NOT EXISTS idx_transactions_date   ON transactions (created_at DESC);
