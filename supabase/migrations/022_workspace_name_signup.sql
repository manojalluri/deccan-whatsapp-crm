-- ============================================================
-- 022_workspace_name_signup.sql — Custom Workspace Name on Signup
--
-- Updates the `handle_new_user` trigger to read `workspace_name` 
-- from raw_user_meta_data and use it as the `accounts.name` instead 
-- of defaulting to "Full Name's Account".
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_workspace_name TEXT;
  v_account_id UUID;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_workspace_name := COALESCE(NEW.raw_user_meta_data->>'workspace_name', '');

  -- If workspace_name is not provided, fallback to the previous logic
  -- but make it look cleaner like "Company Name" or "My account"
  IF v_workspace_name = '' THEN
    v_workspace_name := COALESCE(NULLIF(v_full_name, ''), NEW.email, 'My account');
  END IF;

  INSERT INTO public.accounts (name, owner_user_id)
  VALUES (v_workspace_name, NEW.id)
  RETURNING id INTO v_account_id;

  INSERT INTO public.profiles (user_id, full_name, email, account_id, account_role)
  VALUES (NEW.id, v_full_name, NEW.email, v_account_id, 'owner');

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to bootstrap account/profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
