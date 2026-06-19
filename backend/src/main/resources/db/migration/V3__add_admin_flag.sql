-- ============================================================
-- V3: Add is_admin flag to users table
-- Set manually in DB for admin users:
--   UPDATE users SET is_admin = true WHERE email = 'your@email.com';
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users (is_admin) WHERE is_admin = true;
