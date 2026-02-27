-- Add profile_views counter to candidate_profiles
ALTER TABLE public.candidate_profiles
ADD COLUMN IF NOT EXISTS profile_views INTEGER NOT NULL DEFAULT 0;
