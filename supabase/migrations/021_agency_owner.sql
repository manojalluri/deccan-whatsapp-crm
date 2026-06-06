-- ============================================================
-- 021_agency_owner.sql — Agency Owner / Super Admin capabilities
--
-- Adds a boolean flag to the profiles table that designates a user
-- as an Agency Owner. This allows them to use the Agency Dashboard
-- to impersonate client accounts.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_agency_owner BOOLEAN NOT NULL DEFAULT false;

-- We will make the first user in the database an agency owner automatically.
-- This assumes the person deploying the CRM was the first to sign up.
DO $$
BEGIN
  UPDATE profiles
  SET is_agency_owner = true
  WHERE id = (
    SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1
  );
END $$;
