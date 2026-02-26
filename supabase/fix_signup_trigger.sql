-- Run this directly in your Supabase SQL Editor if you are hitting "Database error saving new user"
-- The fix explicitly sets the schema search_path so the trigger understands the user_role ENUM type.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'candidate'::user_role)
  );
  
  -- Also initialize specific profile based on role
  IF (new.raw_user_meta_data->>'role') = 'employer' THEN
    INSERT INTO public.employer_profiles (id) VALUES (new.id);
  ELSE
    INSERT INTO public.candidate_profiles (id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$;
