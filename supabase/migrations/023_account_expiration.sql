-- ============================================================
-- 023_account_expiration.sql — Subscription Billing
--
-- Adds an expiration date to accounts. If this date is set and
-- in the past, the account is locked down for all users except
-- the Super Admin / Agency Owner.
-- ============================================================

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
