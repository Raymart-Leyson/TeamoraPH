ALTER TABLE public.candidate_profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;
