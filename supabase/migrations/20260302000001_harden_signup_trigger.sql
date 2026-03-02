-- SECURITY: Harden handle_new_user trigger to prevent self-registration
-- as elevated roles (admin, staff, owner) via raw_user_meta_data injection.
--
-- Exploit path being closed:
--   POST /signup with role=admin/owner → supabase.auth.signUp stores metadata
--   → trigger casts raw value to user_role enum → profile.role = 'admin'
--
-- Fix: Only 'employer' is explicitly allowed from metadata.
-- Everything else (including admin/staff/owner attempts) becomes 'candidate'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    safe_role user_role;
BEGIN
    -- Allowlist: only 'employer' may be self-selected at signup.
    -- Any other value — including admin, staff, owner, or garbage — becomes 'candidate'.
    safe_role := CASE
        WHEN new.raw_user_meta_data->>'role' = 'employer' THEN 'employer'::user_role
        ELSE 'candidate'::user_role
    END;

    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, safe_role);

    IF safe_role = 'employer' THEN
        INSERT INTO public.employer_profiles (id) VALUES (new.id);
    ELSE
        INSERT INTO public.candidate_profiles (id) VALUES (new.id);
    END IF;

    RETURN new;
END;
$$;
